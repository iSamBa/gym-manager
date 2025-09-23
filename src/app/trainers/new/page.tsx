"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProgressiveTrainerForm } from "@/features/trainers/components/ProgressiveTrainerForm";
import { useCreateTrainer } from "@/features/trainers/hooks";
import { useRequireAdmin } from "@/hooks/use-require-auth";
import { mapUserForLayout } from "@/lib/auth-utils";
import { AlertCircle, CheckCircle } from "lucide-react";
import type { CreateTrainerData } from "@/features/database/lib/utils";

export default function AddTrainerPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  // Require admin role for this page
  const {
    user,
    isLoading: isAuthLoading,
    hasRequiredRole,
  } = useRequireAdmin("/login");

  // Create trainer mutation
  const createTrainerMutation = useCreateTrainer();

  if (isAuthLoading) {
    return (
      <MainLayout user={mapUserForLayout(user)}>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      </MainLayout>
    );
  }

  if (!hasRequiredRole) {
    return null; // Will redirect to login
  }

  const handleSubmit = async (data: CreateTrainerData) => {
    try {
      setIsSubmitted(true);

      // Create trainer
      const newTrainer = await createTrainerMutation.mutateAsync(data);

      // Show success state briefly before redirecting
      setTimeout(() => {
        router.push(`/trainers/${newTrainer.id}`);
      }, 1500);
    } catch (error) {
      setIsSubmitted(false);
      console.error("Failed to create trainer:", error);
    }
  };

  const handleCancel = () => {
    router.push("/trainers");
  };

  // Show success state after submission
  if (isSubmitted && createTrainerMutation.isSuccess) {
    return (
      <MainLayout user={mapUserForLayout(user)}>
        <div className="container mx-auto py-4">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                  Trainer Created Successfully!
                </h1>
                <p className="text-muted-foreground">
                  The new trainer has been added to your gym. You&apos;ll be
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
    <MainLayout user={mapUserForLayout(user)}>
      <div className="container mx-auto py-4">
        {/* Error Display */}
        {createTrainerMutation.error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {createTrainerMutation.error instanceof Error
                  ? createTrainerMutation.error.message
                  : "Failed to create trainer. Please try again."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Progressive Trainer Form */}
        <ProgressiveTrainerForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createTrainerMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}
