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
import { MemberForm } from "@/features/members/components";
import { useCreateMember } from "@/features/members/hooks";
import { Plus, AlertCircle, CheckCircle } from "lucide-react";
import type { MemberCreateData } from "@/features/database/lib/types";

interface AddMemberDialogProps {
  onMemberCreated?: (memberId: string) => void;
}

export function AddMemberDialog({ onMemberCreated }: AddMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  // Create member mutation with optimistic updates
  const createMemberMutation = useCreateMember();

  const handleSubmit = async (data: MemberCreateData) => {
    try {
      setIsSubmitted(true);

      // Create member with optimistic UI updates
      const newMember = await createMemberMutation.mutateAsync(data);

      // Show success state briefly before closing dialog
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);

        // Reset form by closing and reopening if needed
        if (onMemberCreated) {
          onMemberCreated(newMember.id);
        }

        // Navigate to the new member's profile
        router.push(`/members/${newMember.id}`);
      }, 1500);
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
      setIsOpen(false);
      setIsSubmitted(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitted) {
      // Only show confirmation if there might be unsaved changes
      handleCancel();
    } else if (!createMemberMutation.isPending) {
      setIsOpen(open);
      if (!open) {
        setIsSubmitted(false);
      }
    }
  };

  // Show success state after submission
  if (isSubmitted && createMemberMutation.isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <div className="p-6 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <h2 className="mb-2 text-2xl font-bold">
              Member Created Successfully!
            </h2>
            <p className="text-muted-foreground mb-4">
              The new member has been added to your gym. You&apos;ll be
              redirected to their profile shortly.
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
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-[60vw] overflow-y-auto sm:max-w-[60vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Plus className="h-6 w-6" />
            Add New Member
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
          <MemberForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createMemberMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
