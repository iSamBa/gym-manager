"use client";

import { useState, memo } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SessionBookingForm } from "@/features/training-sessions/components/forms/SessionBookingForm";
import type { Member } from "@/features/database/lib/types";

interface AddSessionButtonProps {
  member: Member;
  onSuccess?: () => void;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

/**
 * AddSessionButton - Quick action to add a training session for a member
 *
 * Opens a dialog with the session booking form.
 */
export const AddSessionButton = memo(function AddSessionButton({
  member,
  onSuccess,
  variant = "ghost",
  size = "sm",
  className,
  showText = false,
}: AddSessionButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="Add Session"
      >
        <Calendar className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
        {showText && "Book Session"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Book Session for {member.first_name} {member.last_name}
            </DialogTitle>
            <DialogDescription>
              Schedule a new training session for this member
            </DialogDescription>
          </DialogHeader>

          <SessionBookingForm
            initialMemberId={member.id}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </>
  );
});
