"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  MemberSubscriptionWithSnapshot,
  Member,
} from "@/features/database/lib/types";

interface AddPaymentDialogProps {
  subscription: MemberSubscriptionWithSnapshot;
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPaymentDialog({
  subscription,
  member,
  open,
  onOpenChange,
}: AddPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>
            Add payment for {member.first_name} {member.last_name}
          </p>
          <p>Subscription: {subscription.plan_name_snapshot}</p>
          <p>This component is not implemented yet.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
