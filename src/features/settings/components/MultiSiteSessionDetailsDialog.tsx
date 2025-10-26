/**
 * Multi-Site Session Details Dialog
 * Displays detailed information about a multi-site session
 */

"use client";

import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Building, User, FileText } from "lucide-react";
import type { MultiSiteSession } from "../lib/types";

interface MultiSiteSessionDetailsDialogProps {
  session: MultiSiteSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MultiSiteSessionDetailsDialogComponent({
  session,
  open,
  onOpenChange,
}: MultiSiteSessionDetailsDialogProps) {
  if (!session) return null;

  const fullName =
    `${session.guest_first_name || ""} ${session.guest_last_name || ""}`.trim();

  // Status badge variant
  const statusVariant = {
    scheduled: "default",
    in_progress: "secondary",
    completed: "default",
    cancelled: "destructive",
  }[session.status] as "default" | "secondary" | "destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Multi-Site Session Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Status:</span>
            <Badge variant={statusVariant} className="capitalize">
              {session.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="text-muted-foreground mt-0.5 h-4 w-4" />
            <div>
              <p className="text-sm font-medium">Session Date</p>
              <p className="text-muted-foreground text-sm">
                {session.session_date}
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="text-muted-foreground mt-0.5 h-4 w-4" />
            <div>
              <p className="text-sm font-medium">Session Time</p>
              <p className="text-muted-foreground text-sm">
                {session.session_time}
              </p>
            </div>
          </div>

          {/* Member Name */}
          <div className="flex items-start gap-3">
            <User className="text-muted-foreground mt-0.5 h-4 w-4" />
            <div>
              <p className="text-sm font-medium">Member</p>
              <p className="text-muted-foreground text-sm">
                {fullName || "N/A"}
              </p>
            </div>
          </div>

          {/* Origin Studio */}
          <div className="flex items-start gap-3">
            <Building className="text-muted-foreground mt-0.5 h-4 w-4" />
            <div>
              <p className="text-sm font-medium">Origin Studio</p>
              <p className="text-muted-foreground text-sm">
                {session.guest_gym_name || "N/A"}
              </p>
            </div>
          </div>

          {/* Trainer (if assigned) */}
          {session.trainer_name && (
            <div className="flex items-start gap-3">
              <User className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Trainer</p>
                <p className="text-muted-foreground text-sm">
                  {session.trainer_name}
                </p>
              </div>
            </div>
          )}

          {/* Notes (if available) */}
          {session.notes && (
            <div className="flex items-start gap-3">
              <FileText className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="text-muted-foreground text-sm">{session.notes}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const MultiSiteSessionDetailsDialog = memo(
  MultiSiteSessionDetailsDialogComponent
);
MultiSiteSessionDetailsDialog.displayName = "MultiSiteSessionDetailsDialog";
