"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProgressiveMemberForm } from "./ProgressiveMemberForm";
import { useUpdateMember, useMemberCacheUtils } from "@/features/members/hooks";
import { AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/features/database/lib/types";
import type { UpdateMemberData } from "@/features/members/lib/database-utils";

import { logger } from "@/lib/logger";
interface EditMemberDialogProps {
  member: Member | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedMember: Member) => void;
}

export function EditMemberDialog({
  member,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditMemberDialogProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Update member mutation with optimistic updates
  const updateMemberMutation = useUpdateMember();

  // Cache utilities for smart invalidation
  const { invalidateMemberCache } = useMemberCacheUtils();

  // Note: data parameter type is UpdateMemberData, but ProgressiveMemberForm sends MemberFormData
  // This is safe because UpdateMemberData is a subset of MemberFormData (all fields optional)
  // and the database update function will only use the fields it recognizes
  const handleSubmit = async (data: UpdateMemberData) => {
    if (!member) return;

    try {
      setIsSubmitted(true);

      // Update member with optimistic UI updates
      const updatedMember = await updateMemberMutation.mutateAsync({
        id: member.id,
        data,
      });

      // Invalidate related caches for consistency
      await invalidateMemberCache(member.id);

      toast.success("Member Updated", {
        description: `${member.first_name} ${member.last_name}'s information has been updated`,
      });

      // Call success callback and close dialog
      onSuccess?.(updatedMember);

      // Close dialog after a brief delay to show success state
      setTimeout(() => {
        onOpenChange(false);
        setIsSubmitted(false);
      }, 1000);
    } catch (error) {
      setIsSubmitted(false);
      logger.error("Failed to update member:", { error });

      toast.error("Update Failed", {
        description: "Failed to update member information. Please try again.",
      });
    }
  };

  const handleCancel = () => {
    setIsSubmitted(false);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsSubmitted(false);
    }
    onOpenChange(open);
  };

  // Show success state after submission
  if (isSubmitted && updateMemberMutation.isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="w-[90%] sm:max-w-[500px]">
          <div className="p-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <h2 className="mb-2 text-2xl font-bold">
              Member Updated Successfully!
            </h2>
            <p className="text-muted-foreground mb-4">
              {member?.first_name} {member?.last_name}&apos;s information has
              been updated.
            </p>
            <div className="animate-pulse">Saving changes...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] w-[95%] overflow-y-auto sm:max-w-[95%] lg:max-w-[1400px]">
        <DialogHeader>
          <DialogTitle>
            Edit Member: {member.first_name} {member.last_name}
          </DialogTitle>
        </DialogHeader>

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
        <div className="mt-4 px-4 py-6">
          <ProgressiveMemberForm
            member={member}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updateMemberMutation.isPending}
            showHeader={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
