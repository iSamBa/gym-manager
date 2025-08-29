"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TrainerForm } from "@/features/trainers/components/TrainerForm";
import { useCreateTrainer } from "@/features/trainers/hooks";
import { useAuth } from "@/hooks/use-auth";
import { Plus, AlertCircle, Shield, CheckCircle } from "lucide-react";
import type { CreateTrainerData } from "@/features/database/lib/utils";

interface AddTrainerDialogProps {
  onTrainerCreated?: (trainerId: string) => void;
}

export function AddTrainerDialog({ onTrainerCreated }: AddTrainerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const router = useRouter();

  // Check admin status
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  // Create trainer mutation with optimistic updates
  const createTrainerMutation = useCreateTrainer();

  // Don't render if not admin
  if (!isAuthenticated || isLoading) {
    return (
      <Button disabled>
        <Plus className="mr-2 h-4 w-4" />
        Add Trainer
      </Button>
    );
  }

  if (!isAdmin) {
    return (
      <Button disabled title="Only administrators can create trainers">
        <Shield className="mr-2 h-4 w-4" />
        Add Trainer (Admin Only)
      </Button>
    );
  }

  const handleSubmit = async (data: CreateTrainerData) => {
    try {
      setIsSubmitted(true);

      // Create trainer with optimistic UI updates
      const newTrainer = await createTrainerMutation.mutateAsync(data);

      // Show success state briefly before closing dialog
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);

        // Reset form by closing and reopening if needed
        if (onTrainerCreated) {
          onTrainerCreated(newTrainer.id);
        }

        // Navigate to the trainers page
        router.push("/trainers");
      }, 1500);
    } catch (error) {
      // Reset loading state on error
      setIsSubmitted(false);
      console.error("Failed to create trainer:", error);
    }
  };

  const handleCancel = () => {
    setShowConfirmCancel(true);
  };

  const handleConfirmCancel = () => {
    setIsOpen(false);
    setIsSubmitted(false);
    setShowConfirmCancel(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitted) {
      // Only show confirmation if there might be unsaved changes
      handleCancel();
    } else if (!createTrainerMutation.isPending) {
      setIsOpen(open);
      if (!open) {
        setIsSubmitted(false);
      }
    }
  };

  // Show success state after submission
  if (isSubmitted && createTrainerMutation.isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Trainer
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <div className="p-6 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <h2 className="mb-2 text-2xl font-bold">
              Trainer Created Successfully!
            </h2>
            <p className="text-muted-foreground mb-4">
              The new trainer has been added to your gym. You&apos;ll be
              redirected to the trainers page shortly.
            </p>
            <div className="animate-pulse">Redirecting...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Trainer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-[70vw] overflow-y-auto sm:max-w-[70vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Plus className="h-6 w-6" />
            Add New Trainer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {createTrainerMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {createTrainerMutation.error instanceof Error
                  ? createTrainerMutation.error.message
                  : "Failed to create trainer. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          {/* Trainer Form */}
          <TrainerForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createTrainerMutation.isPending}
          />
        </div>
      </DialogContent>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmCancel}
        onOpenChange={setShowConfirmCancel}
        onConfirm={handleConfirmCancel}
        title="Cancel Adding Trainer?"
        description="Are you sure you want to cancel? Any unsaved changes will be lost."
        confirmText="Yes, Cancel"
        cancelText="Continue Editing"
        variant="destructive"
      />
    </Dialog>
  );
}
