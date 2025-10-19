/**
 * Preview Inactivation Dialog Component
 * Shows list of members who will be inactivated before running the process
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInactivationCandidates } from "../hooks/use-auto-inactivation";

interface PreviewInactivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Dialog for previewing members who will be marked inactive
 * Provides dry-run preview before executing auto-inactivation
 */
export function PreviewInactivationDialog({
  open,
  onOpenChange,
  onConfirm,
}: PreviewInactivationDialogProps) {
  const { data: candidates, isLoading } = useInactivationCandidates();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preview: Members to be Inactivated</DialogTitle>
          <DialogDescription>
            Based on configured inactivity period
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="py-4 text-center">Loading...</p>
        ) : candidates && candidates.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Last Session</TableHead>
                  <TableHead>Days Inactive</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.member_id}>
                    <TableCell>{candidate.member_name}</TableCell>
                    <TableCell>
                      {candidate.last_session_date || "Never"}
                    </TableCell>
                    <TableCell>
                      {candidate.days_inactive
                        ? `${candidate.days_inactive} days`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-muted-foreground text-sm">
              Total: {candidates.length} members will be inactivated
            </p>
          </>
        ) : (
          <p className="py-4 text-center">No members meet the criteria</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!candidates || candidates.length === 0}
          >
            Run Auto-Inactivation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
