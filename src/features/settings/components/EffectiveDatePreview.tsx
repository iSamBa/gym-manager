"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { format } from "date-fns";
import type { OpeningHoursWeek, DayOfWeek } from "../lib/types";
import { calculateAvailableSlots } from "../lib/slot-calculator";

interface EffectiveDatePreviewProps {
  openingHours: OpeningHoursWeek;
  effectiveDate: Date;
  isScheduled?: boolean;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const EffectiveDatePreview = memo(function EffectiveDatePreview({
  openingHours,
  effectiveDate,
  isScheduled = false,
}: EffectiveDatePreviewProps) {
  const slotsPerDay = useMemo(() => {
    return calculateAvailableSlots(openingHours);
  }, [openingHours]);

  const totalSlots = useMemo(() => {
    return Object.values(slotsPerDay).reduce((sum, slots) => sum + slots, 0);
  }, [slotsPerDay]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isScheduled ? "Scheduled Changes" : "Changes Preview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Effective Date Alert */}
        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertDescription>
            {isScheduled ? "Scheduled changes will" : "Changes will"} take
            effect on{" "}
            <strong>{format(effectiveDate, "EEEE, MMMM d, yyyy")}</strong>.
            Existing bookings before this date will remain unchanged.
          </AlertDescription>
        </Alert>

        {/* Slots Table */}
        <div>
          <h4 className="mb-3 text-sm font-medium">
            {isScheduled
              ? `Scheduled Hours (${format(effectiveDate, "MMM d, yyyy")})`
              : "Available Session Slots Per Day"}
          </h4>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-left font-medium">Day</th>
                  <th className="p-3 text-left font-medium">Hours</th>
                  <th className="p-3 text-right font-medium">
                    Available Slots
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(Object.keys(DAY_LABELS) as DayOfWeek[]).map((day) => {
                  const config = openingHours[day];
                  const slots = slotsPerDay[day];

                  return (
                    <tr
                      key={day}
                      className={!config.is_open ? "bg-muted/30" : ""}
                    >
                      <td className="p-3 font-medium">{DAY_LABELS[day]}</td>
                      <td className="p-3">
                        {config.is_open
                          ? `${config.open_time} - ${config.close_time}`
                          : "Closed"}
                      </td>
                      <td className="p-3 text-right">
                        {config.is_open ? (
                          <span className="font-mono">{slots} slots</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/50 border-t font-medium">
                <tr>
                  <td colSpan={2} className="p-3">
                    Total Weekly Slots
                  </td>
                  <td className="p-3 text-right font-mono">
                    {totalSlots} slots
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
