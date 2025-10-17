"use client";

import { memo, useMemo } from "react";
import type { OpeningHoursWeek, DayOfWeek } from "../lib/types";
import { calculateAvailableSlots } from "../lib/slot-calculator";

interface OpeningHoursDisplayProps {
  openingHours: OpeningHoursWeek;
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

export const OpeningHoursDisplay = memo(function OpeningHoursDisplay({
  openingHours,
}: OpeningHoursDisplayProps) {
  const slotsPerDay = useMemo(() => {
    return calculateAvailableSlots(openingHours);
  }, [openingHours]);

  const totalSlots = useMemo(() => {
    return Object.values(slotsPerDay).reduce((sum, slots) => sum + slots, 0);
  }, [slotsPerDay]);

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="p-3 text-left font-medium">Day</th>
            <th className="p-3 text-left font-medium">Hours</th>
            <th className="p-3 text-right font-medium">Available Slots</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {(Object.keys(DAY_LABELS) as DayOfWeek[]).map((day) => {
            const config = openingHours[day];
            const slots = slotsPerDay[day];

            return (
              <tr key={day} className={!config.is_open ? "bg-muted/30" : ""}>
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
            <td className="p-3 text-right font-mono">{totalSlots} slots</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});
