"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MemberForm,
  withMemberErrorBoundary,
} from "@/features/members/components";
import {
  useCreateMember,
  useMemberValidation,
  useRouteCacheManager,
  usePageCacheStrategy,
} from "@/features/members/hooks";
import { ArrowLeft, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { MemberCreateData } from "@/features/database/lib/types";

function CreateMemberPage() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Create member mutation with optimistic updates
  const createMemberMutation = useCreateMember();

  // Member validation for real-time feedback
  const { validateEmail, validateMemberNumber } = useMemberValidation();

  // Route-based cache management
  useRouteCacheManager();
  usePageCacheStrategy("create");

  const handleSubmit = async (data: MemberCreateData) => {
    try {
      setIsSubmitted(true);

      // Create member with optimistic UI updates
      const newMember = await createMemberMutation.mutateAsync(data);

      // Show success state briefly before navigating
      setTimeout(() => {
        router.push(`/members/${newMember.id}`);
      }, 1000);
    } catch (error) {
      setIsSubmitted(false);
      console.error("Failed to create member:", error);
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel? Any unsaved changes will be lost."
      )
    ) {
      router.push("/members");
    }
  };

  // Show success state after submission
  if (isSubmitted && createMemberMutation.isSuccess) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
              <h2 className="mb-2 text-2xl font-bold">
                Member Created Successfully!
              </h2>
              <p className="text-muted-foreground mb-4">
                The new member has been added to your gym. You&apos;ll be
                redirected to their profile shortly.
              </p>
              <div className="animate-pulse">Redirecting...</div>
            </CardContent>
          </Card>
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
            <Link href="/members">
              <Button
                variant="ghost"
                size="sm"
                disabled={createMemberMutation.isPending}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Members
              </Button>
            </Link>
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                <UserPlus className="h-8 w-8" />
                Add New Member
              </h1>
              <p className="text-muted-foreground">
                Create a new member profile with subscription details
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {createMemberMutation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {createMemberMutation.error instanceof Error
                ? createMemberMutation.error.message
                : "Failed to create member. Please try again."}
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
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={createMemberMutation.isPending}
              submitLabel={
                createMemberMutation.isPending
                  ? "Creating Member..."
                  : "Create Member"
              }
              cancelLabel="Cancel"
              enableOptimisticUpdates={true}
              // Real-time validation
              onEmailChange={async (email) => {
                if (email) {
                  const isValid = await validateEmail(email);
                  return isValid ? null : "Email already exists";
                }
                return null;
              }}
              onMemberNumberChange={async (memberNumber) => {
                if (memberNumber) {
                  const isValid = await validateMemberNumber(memberNumber);
                  return isValid ? null : "Member number already exists";
                }
                return null;
              }}
              // Auto-save draft functionality
              enableDraftSaving={true}
              draftKey="create-member-draft"
            />
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-sm">
              <h4 className="mb-2 font-medium">
                Tips for adding a new member:
              </h4>
              <ul className="list-inside list-disc space-y-1">
                <li>Email addresses must be unique across all members</li>
                <li>Member numbers are auto-generated but can be customized</li>
                <li>Emergency contacts are optional but recommended</li>
                <li>The form auto-saves your progress as you type</li>
                <li>All fields marked with * are required</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default withMemberErrorBoundary(CreateMemberPage);
