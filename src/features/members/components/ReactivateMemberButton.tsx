/**
 * Reactivate Member Button Component
 * Button and dialog for manually reactivating inactive members
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReactivateMember } from "../hooks/use-auto-inactivation";
import { useAuth } from "@/hooks/use-auth";

interface ReactivateMemberButtonProps {
  memberId: string;
  memberName: string;
  inactivatedDate?: string;
}

/**
 * Button to reactivate an inactive member
 * Shows confirmation dialog before proceeding
 */
export function ReactivateMemberButton({
  memberId,
  memberName,
  inactivatedDate,
}: ReactivateMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const reactivate = useReactivateMember();
  const { user } = useAuth();

  const handleReactivate = async () => {
    await reactivate.mutateAsync({
      memberId,
      adminName: (user?.email as string) || "Admin",
    });
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Reactivate Member</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to reactivate {memberName}?
            </DialogDescription>
          </DialogHeader>
          {inactivatedDate && (
            <p className="text-muted-foreground text-sm">
              This member was automatically inactivated on {inactivatedDate}.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReactivate} disabled={reactivate.isPending}>
              {reactivate.isPending ? "Reactivating..." : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
