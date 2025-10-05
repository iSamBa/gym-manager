"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProgressiveTrainingSessionForm } from "@/features/training-sessions/components";
import { useCreateTrainingSession } from "@/features/training-sessions/hooks/use-training-sessions";
import { useRequireAdmin } from "@/hooks/use-require-auth";
import { AlertCircle, CheckCircle } from "lucide-react";
import type { CreateSessionData } from "@/features/training-sessions/lib/validation";

export default function AddTrainingSessionPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  // Require admin role for this page
  const { isLoading: isAuthLoading, hasRequiredRole } =
    useRequireAdmin("/login");

  // Create session mutation
  const createSessionMutation = useCreateTrainingSession();

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

  const handleSubmit = async (data: CreateSessionData) => {
    try {
      setIsSubmitted(true);

      // Create training session
      await createSessionMutation.mutateAsync(data);

      // Show success state briefly before redirecting
      setTimeout(() => {
        router.push(`/training-sessions`);
      }, 1500);
    } catch (error) {
      setIsSubmitted(false);
      console.error("Failed to create training session:", error);
    }
  };

  const handleCancel = () => {
    router.push("/training-sessions");
  };

  // Show success state after submission
  if (isSubmitted && createSessionMutation.isSuccess) {
    return (
      <MainLayout>
        <div className="container mx-auto py-4">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                  Training Session Created Successfully!
                </h1>
                <p className="text-muted-foreground">
                  The new training session has been scheduled. You&apos;ll be
                  redirected to the sessions list shortly.
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
        {createSessionMutation.error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {createSessionMutation.error instanceof Error
                  ? createSessionMutation.error.message
                  : "Failed to create training session. Please try again."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Progressive Training Session Form */}
        <ProgressiveTrainingSessionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createSessionMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}
