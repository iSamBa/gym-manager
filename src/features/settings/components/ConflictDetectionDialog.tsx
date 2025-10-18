"use client";

import { memo, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { SessionConflict } from "../hooks/use-conflict-detection";
import { useRouter } from "next/navigation";

interface ConflictDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: SessionConflict[];
}

export const ConflictDetectionDialog = memo(function ConflictDetectionDialog({
  open,
  onOpenChange,
  conflicts,
}: ConflictDetectionDialogProps) {
  const router = useRouter();

  const handleViewSessions = useCallback(() => {
    // Get unique dates with conflicts
    const conflictDates = [...new Set(conflicts.map((c) => c.date))];

    // Navigate to training sessions with date filter
    const dateParam = conflictDates[0]; // Start with first conflict date
    router.push(`/training-sessions?date=${dateParam}&highlight=conflicts`);
    onOpenChange(false); // Close dialog after navigation
  }, [conflicts, router, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Memoize conflict count text
  const conflictCountText = useMemo(() => {
    const count = conflicts.length;
    return `${count} session${count !== 1 ? "s" : ""}`;
  }, [conflicts.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[60vw] sm:max-w-[60vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            Booking Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            Found {conflictCountText} that conflict with the new opening hours.
            These must be resolved before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              To proceed, you must cancel or reschedule the conflicting sessions
              listed below.
            </AlertDescription>
          </Alert>

          {/* Conflicts Table */}
          <div className="max-h-[400px] overflow-y-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0 border-b">
                <tr>
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Time</th>
                  <th className="p-3 text-left font-medium">Member</th>
                  <th className="p-3 text-center font-medium">Machine</th>
                  <th className="p-3 text-left font-medium">Issue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {conflicts.map((conflict) => {
                  const date = parseISO(conflict.date);
                  const startTime = format(
                    parseISO(conflict.start_time),
                    "HH:mm"
                  );
                  const endTime = format(parseISO(conflict.end_time), "HH:mm");

                  return (
                    <tr key={conflict.session_id} className="hover:bg-muted/50">
                      <td className="p-3 font-medium">
                        {format(date, "EEE, MMM d, yyyy")}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {startTime} - {endTime}
                      </td>
                      <td className="p-3">
                        {conflict.member_name || (
                          <span className="text-muted-foreground">
                            Unbooked
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {conflict.machine_number}
                      </td>
                      <td className="text-destructive p-3 text-xs">
                        {conflict.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Cancel Changes
          </Button>
          <Button onClick={handleViewSessions} className="w-full sm:w-auto">
            <ExternalLink className="mr-2 h-4 w-4" />
            View & Resolve Sessions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
