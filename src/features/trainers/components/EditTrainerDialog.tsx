"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrainerForm } from "./TrainerForm";
import {
  useUpdateTrainer,
  useTrainerCacheUtils,
} from "@/features/trainers/hooks";
import { AlertCircle, CheckCircle, Edit } from "lucide-react";
import { toast } from "sonner";
import type { TrainerWithProfile } from "@/features/database/lib/types";
import type { UpdateTrainerData } from "@/features/database/lib/utils";

interface EditTrainerDialogProps {
  trainer: TrainerWithProfile | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedTrainer: TrainerWithProfile) => void;
}

export function EditTrainerDialog({
  trainer,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditTrainerDialogProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Update trainer mutation with optimistic updates
  const updateTrainerMutation = useUpdateTrainer();

  // Cache utilities for smart invalidation
  const { invalidateTrainerCache } = useTrainerCacheUtils();

  const handleSubmit = async (data: UpdateTrainerData) => {
    if (!trainer) return;

    try {
      setIsSubmitted(true);

      // Update trainer with optimistic UI updates
      const updatedTrainer = await updateTrainerMutation.mutateAsync({
        id: trainer.id,
        data,
      });

      // Invalidate related caches for consistency
      await invalidateTrainerCache(trainer.id);

      toast.success("Trainer Updated", {
        description: `${trainer.user_profile?.first_name || "Trainer"} ${trainer.user_profile?.last_name || ""}'s information has been updated`,
      });

      // Call success callback and close dialog
      onSuccess?.(updatedTrainer);

      // Close dialog after a brief delay to show success state
      setTimeout(() => {
        onOpenChange(false);
        setIsSubmitted(false);
      }, 1000);
    } catch (error) {
      setIsSubmitted(false);
      console.error("Failed to update trainer:", error);

      toast.error("Update Failed", {
        description: "Failed to update trainer information. Please try again.",
      });
    }
  };

  const handleCancel = () => {
    setIsSubmitted(false);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !updateTrainerMutation.isPending) {
      onOpenChange(open);
      if (!open) {
        setIsSubmitted(false);
      }
    }
  };

  // Show success state after submission
  if (isSubmitted && updateTrainerMutation.isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <div className="p-6 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <h2 className="mb-2 text-2xl font-bold">
              Trainer Updated Successfully!
            </h2>
            <p className="text-muted-foreground mb-4">
              The trainer&apos;s information has been updated.
            </p>
            <div className="animate-pulse">Closing...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!trainer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] w-[70vw] overflow-y-auto sm:max-w-[70vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Edit className="h-6 w-6" />
            Edit Trainer: {trainer.user_profile?.first_name || "Unknown"}{" "}
            {trainer.user_profile?.last_name || "Trainer"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {updateTrainerMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {updateTrainerMutation.error instanceof Error
                  ? updateTrainerMutation.error.message
                  : "Failed to update trainer. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          {/* Trainer Form */}
          <TrainerForm
            trainer={trainer}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updateTrainerMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
