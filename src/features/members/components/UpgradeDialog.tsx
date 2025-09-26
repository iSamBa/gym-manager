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

interface UpgradeDialogProps {
  currentSubscription: MemberSubscriptionWithSnapshot;
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeDialog({
  currentSubscription,
  member,
  open,
  onOpenChange,
}: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade Subscription</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>
            Upgrade dialog for {member.first_name} {member.last_name}
          </p>
          <p>Current plan: {currentSubscription.plan_name_snapshot}</p>
          <p>This component is not implemented yet.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
