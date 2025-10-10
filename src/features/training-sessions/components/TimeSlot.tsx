import React, { memo } from "react";
import { cn } from "@/lib/utils";
import type {
  Machine,
  TimeSlot as TimeSlotType,
  TrainingSession,
} from "../lib/types";

interface TimeSlotProps {
  machine: Machine;
  timeSlot: TimeSlotType;
  session?: TrainingSession;
  onClick: () => void;
}

/**
 * TimeSlot component - renders a single 30-minute slot
 * NOTE: This is a placeholder for US-006. Full implementation with member names,
 * colors, and booking logic will be added in US-007.
 */
export const TimeSlot = memo<TimeSlotProps>(
  ({
    machine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    timeSlot: _timeSlot, // Will be used in US-007 for rendering time labels
    session,
    onClick,
  }) => {
    const isUnavailable = !machine.is_available;
    const isBooked = !!session;
    const isClickable = !isUnavailable && !isBooked;

    return (
      <div
        data-testid="time-slot"
        onClick={isClickable ? onClick : undefined}
        className={cn(
          "h-16 rounded-md border-2 transition-all",
          // Unavailable machine
          isUnavailable && "cursor-not-allowed border-gray-200 bg-gray-50",
          // Available empty slot
          !isUnavailable &&
            !isBooked &&
            "hover:border-primary hover:bg-primary/5 cursor-pointer border-gray-300 bg-white",
          // Booked session
          isBooked &&
            "cursor-pointer border-blue-300 bg-blue-50 hover:border-blue-400"
        )}
      >
        {/* Placeholder content - full implementation in US-007 */}
        {isBooked && (
          <div className="flex h-full items-center justify-center text-xs text-blue-700">
            Booked
          </div>
        )}
      </div>
    );
  }
);

TimeSlot.displayName = "TimeSlot";
