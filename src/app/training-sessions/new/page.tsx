"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SessionBookingDialog } from "@/features/training-sessions/components";
import { useCreateTrainingSession } from "@/features/training-sessions/hooks/use-training-sessions";
import { useRequireStaff } from "@/hooks/use-require-auth";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function AddTrainingSessionPage() {
  const [dialogOpen, setDialogOpen] = useState(true);
  const router = useRouter();

  // Require staff role (admin + trainer) for this page
  const { isLoading: isAuthLoading } = useRequireStaff("/login");

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

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // User cancelled or closed the dialog
      router.push("/training-sessions");
    }
    setDialogOpen(open);
  };

  // Show success state after submission
  if (createSessionMutation.isSuccess) {
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
                  The new training session has been scheduled.
                </p>
              </div>
              <Button onClick={() => router.push("/training-sessions")}>
                Go to Sessions
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Book New Training Session</h1>
            <p className="text-muted-foreground mt-2">
              Create a new training session booking
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/training-sessions")}
          >
            Cancel
          </Button>
        </div>

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

        {/* Session Booking Dialog */}
        <SessionBookingDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
        />
      </div>
    </MainLayout>
  );
}
