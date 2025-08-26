"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import {
  MemberForm,
  withMemberErrorBoundary,
} from "@/features/members/components";
import {
  useMember,
  useUpdateMember,
  useMemberValidation,
  useMemberCacheUtils,
  useRouteCacheManager,
  usePageCacheStrategy,
} from "@/features/members/hooks";
import { ArrowLeft, Edit, AlertCircle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import type { MemberUpdateData } from "@/features/database/lib/types";

interface EditMemberPageProps {
  params: Promise<{ id: string }>;
}

function EditMemberPage({ params }: EditMemberPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Member data with smart caching
  const {
    data: member,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useMember(id, {
    staleTime: 10 * 60 * 1000, // 10 minutes - longer for edit form
    refetchOnWindowFocus: false, // Don't refetch when user is editing
  });

  // Update member mutation with optimistic updates
  const updateMemberMutation = useUpdateMember();

  // Member validation for real-time feedback
  const { validateEmail, validateMemberNumber } = useMemberValidation();

  // Cache utilities for smart invalidation
  const { invalidateMemberCache } = useMemberCacheUtils();

  // Route-based cache management
  useRouteCacheManager();
  usePageCacheStrategy("edit");

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSubmitted) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isSubmitted]);

  const handleSubmit = async (data: MemberUpdateData) => {
    try {
      setIsSubmitted(true);
      setHasUnsavedChanges(false);

      // Update member with optimistic UI updates
      await updateMemberMutation.mutateAsync({
        id,
        data,
      });

      // Invalidate related caches for consistency
      await invalidateMemberCache(id);

      // Show success state briefly before navigating
      setTimeout(() => {
        router.push(`/members/${id}`);
      }, 1000);
    } catch (error) {
      setIsSubmitted(false);
      console.error("Failed to update member:", error);
    }
  };

  const handleCancel = () => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        "Are you sure you want to cancel? Any unsaved changes will be lost."
      )
    ) {
      return;
    }
    router.push(`/members/${id}`);
  };

  const handleFormChange = () => {
    setHasUnsavedChanges(true);
  };

  // Show success state after submission
  if (isSubmitted && updateMemberMutation.isSuccess) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
              <h2 className="mb-2 text-2xl font-bold">
                Member Updated Successfully!
              </h2>
              <p className="text-muted-foreground mb-4">
                The member&apos;s information has been updated. You&apos;ll be
                redirected to their profile shortly.
              </p>
              <div className="animate-pulse">Redirecting...</div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          <LoadingSkeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <LoadingSkeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <LoadingSkeleton className="h-10 w-full" />
              <LoadingSkeleton className="h-10 w-full" />
              <LoadingSkeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load member information. Please try again.
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  if (!member) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-4xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Member not found.</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/members/${id}`}>
              <Button
                variant="ghost"
                size="sm"
                disabled={updateMemberMutation.isPending}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Button>
            </Link>
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                <Edit className="h-8 w-8" />
                Edit Member
                {isFetching && (
                  <Clock className="text-muted-foreground h-4 w-4 animate-spin" />
                )}
              </h1>
              <p className="text-muted-foreground">
                Update {member.first_name} {member.last_name}&apos;s information
              </p>
            </div>
          </div>

          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <Alert className="w-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>You have unsaved changes</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Error Display */}
        {updateMemberMutation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {updateMemberMutation.error instanceof Error
                ? updateMemberMutation.error.message
                : "Failed to update member. Please try again."}
            </AlertDescription>
          </Alert>
        )}

        {/* Member Form */}
        <Card>
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberForm
              initialData={member}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              onChange={handleFormChange}
              isSubmitting={updateMemberMutation.isPending}
              submitLabel={
                updateMemberMutation.isPending
                  ? "Updating Member..."
                  : "Update Member"
              }
              cancelLabel="Cancel"
              enableOptimisticUpdates={true}
              // Real-time validation (exclude current member)
              onEmailChange={async (email) => {
                if (email && email !== member.email) {
                  const isValid = await validateEmail(email);
                  return isValid ? null : "Email already exists";
                }
                return null;
              }}
              onMemberNumberChange={async (memberNumber) => {
                if (memberNumber && memberNumber !== member.member_number) {
                  const isValid = await validateMemberNumber(memberNumber);
                  return isValid ? null : "Member number already exists";
                }
                return null;
              }}
              // Auto-save draft functionality
              enableDraftSaving={true}
              draftKey={`edit-member-${id}-draft`}
            />
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-sm">
              <h4 className="mb-2 font-medium">Editing member information:</h4>
              <ul className="list-inside list-disc space-y-1">
                <li>
                  Changes are saved automatically as you type (draft mode)
                </li>
                <li>Email addresses must be unique across all members</li>
                <li>Member numbers cannot be duplicated</li>
                <li>
                  You&apos;ll be warned before leaving if you have unsaved
                  changes
                </li>
                <li>All fields marked with * are required</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default withMemberErrorBoundary(EditMemberPage);
