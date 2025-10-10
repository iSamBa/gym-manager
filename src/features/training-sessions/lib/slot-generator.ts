import { format, startOfDay } from "date-fns";
import type { TimeSlot } from "./types";

export const TIME_SLOT_CONFIG = {
  START_HOUR: 9,
  END_HOUR: 24, // midnight
  SLOT_DURATION_MINUTES: 30,
} as const;

/**
 * Generates 30-minute time slots for a given day
 * Default: 9:00 AM to 12:00 AM (midnight) (30 slots)
 *
 * @param date - The date to generate slots for
 * @returns Array of TimeSlot objects
 */
export function generateTimeSlots(date: Date = new Date()): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const baseDate = startOfDay(date);

  for (
    let hour = TIME_SLOT_CONFIG.START_HOUR;
    hour < TIME_SLOT_CONFIG.END_HOUR;
    hour++
  ) {
    for (
      let minute = 0;
      minute < 60;
      minute += TIME_SLOT_CONFIG.SLOT_DURATION_MINUTES
    ) {
      const start = new Date(baseDate);
      start.setHours(hour, minute, 0, 0);

      const end = new Date(start);
      end.setMinutes(
        start.getMinutes() + TIME_SLOT_CONFIG.SLOT_DURATION_MINUTES
      );

      slots.push({
        start,
        end,
        label: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
        hour,
        minute,
      });
    }
  }

  return slots; // Returns 30 slots
}

/**
 * Check if a time slot overlaps with a session time range
 */
export function isSlotOccupied(
  slot: TimeSlot,
  sessionStart: Date,
  sessionEnd: Date
): boolean {
  return (
    (slot.start >= sessionStart && slot.start < sessionEnd) ||
    (slot.end > sessionStart && slot.end <= sessionEnd) ||
    (slot.start <= sessionStart && slot.end >= sessionEnd)
  );
}
