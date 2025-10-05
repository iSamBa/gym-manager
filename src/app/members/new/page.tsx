"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProgressiveMemberForm } from "@/features/members/components";
import { useCreateMember } from "@/features/members/hooks";
import { useRequireAdmin } from "@/hooks/use-require-auth";
import { AlertCircle, CheckCircle } from "lucide-react";
import type { CreateMemberData } from "@/features/database/lib/utils";

export default function AddMemberPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  // Require admin role for this page
  const {
    user,
    isLoading: isAuthLoading,
    hasRequiredRole,
  } = useRequireAdmin("/login");

  // Create member mutation
  const createMemberMutation = useCreateMember();

  if (isAuthLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      </MainLayout>
    );
  }

  if (!hasRequiredRole) {
    return null; // Will redirect to login
  }

  const handleSubmit = async (data: CreateMemberData) => {
    try {
      setIsSubmitted(true);

      // Create member
      const newMember = await createMemberMutation.mutateAsync(data);

      // Show success state briefly before redirecting
      setTimeout(() => {
        router.push(`/members/${newMember.id}`);
      }, 1500);
    } catch (error) {
      setIsSubmitted(false);
      console.error("Failed to create member:", error);
    }
  };

  const handleCancel = () => {
    router.push("/members");
  };

  // Show success state after submission
  if (isSubmitted && createMemberMutation.isSuccess) {
    return (
      <MainLayout>
        <div className="container mx-auto py-4">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                  Member Created Successfully!
                </h1>
                <p className="text-muted-foreground">
                  The new member has been added to your gym. You&apos;ll be
                  redirected to their profile shortly.
                </p>
              </div>
              <div className="text-muted-foreground animate-pulse text-sm">
                Redirecting...
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-4">
        {/* Error Display */}
        {createMemberMutation.error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {createMemberMutation.error instanceof Error
                  ? createMemberMutation.error.message
                  : "Failed to create member. Please try again."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Progressive Member Form */}
        <ProgressiveMemberForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMemberMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}
