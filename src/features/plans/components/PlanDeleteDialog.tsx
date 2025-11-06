"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

import type { SubscriptionPlanWithSessions } from "@/features/database/lib/types";
import { useDeleteSubscriptionPlan } from "@/features/memberships/hooks/use-subscriptions";

import { logger } from "@/lib/logger";
interface PlanDeleteDialogProps {
  plan: SubscriptionPlanWithSessions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanDeleteDialog({
  plan,
  open,
  onOpenChange,
}: PlanDeleteDialogProps) {
  const deleteMutation = useDeleteSubscriptionPlan();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(plan.id);
      onOpenChange(false);
    } catch (error) {
      logger.error("Failed to delete plan:", { error });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Plan
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            subscription plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Are you sure you want to delete the{" "}
              <strong>&quot;{plan.name}&quot;</strong> plan? This will
              permanently remove the plan from the system.
            </AlertDescription>
          </Alert>

          <div className="bg-muted/30 rounded-lg border p-4">
            <h4 className="mb-2 font-medium">Plan Details</h4>
            <div className="text-muted-foreground space-y-1 text-sm">
              <div>
                <strong>Name:</strong> {plan.name}
              </div>
              <div>
                <strong>Price:</strong> ${plan.price}
              </div>
              <div>
                <strong>Duration:</strong> {plan.duration_months} month(s)
              </div>
              <div>
                <strong>Status:</strong>{" "}
                {plan.is_active ? "Active" : "Inactive"}
              </div>
            </div>
          </div>

          {deleteMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {deleteMutation.error.message || "Failed to delete plan"}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
