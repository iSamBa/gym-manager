"use client";

import { memo, useMemo } from "react";
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
import { AlertTriangle, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { OpeningHoursWeek, DayOfWeek } from "../lib/types";
import { calculateTotalWeeklySlots } from "../lib/slot-calculator";

interface SaveConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openingHours: OpeningHoursWeek;
  effectiveDate: Date;
  onConfirm: () => void;
  isLoading?: boolean;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export const SaveConfirmationDialog = memo(function SaveConfirmationDialog({
  open,
  onOpenChange,
  openingHours,
  effectiveDate,
  onConfirm,
  isLoading = false,
}: SaveConfirmationDialogProps) {
  const totalSlots = useMemo(() => {
    return calculateTotalWeeklySlots(openingHours);
  }, [openingHours]);

  const openDays = useMemo(() => {
    return (Object.keys(openingHours) as DayOfWeek[])
      .filter((day) => openingHours[day].is_open)
      .map((day) => DAY_LABELS[day])
      .join(", ");
  }, [openingHours]);

  const closedDays = useMemo(() => {
    return (Object.keys(openingHours) as DayOfWeek[])
      .filter((day) => !openingHours[day].is_open)
      .map((day) => DAY_LABELS[day])
      .join(", ");
  }, [openingHours]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Opening Hours Changes</DialogTitle>
          <DialogDescription>
            Review the changes before saving. These changes will affect session
            availability.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Effective Date */}
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Calendar className="text-muted-foreground mt-0.5 h-5 w-5" />
            <div>
              <p className="text-sm font-medium">Effective Date</p>
              <p className="text-muted-foreground text-sm">
                {format(effectiveDate, "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 rounded-lg border p-4">
            <h4 className="text-sm font-medium">Changes Summary</h4>
            <div className="text-muted-foreground space-y-1 text-sm">
              <p>
                <strong>Open Days:</strong> {openDays || "None"}
              </p>
              <p>
                <strong>Closed Days:</strong> {closedDays || "None"}
              </p>
              <p>
                <strong>Total Weekly Slots:</strong> {totalSlots}
              </p>
            </div>
          </div>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Existing bookings before the effective date will remain unchanged.
              New sessions can only be booked according to the new schedule.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Saving..." : "Confirm Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
