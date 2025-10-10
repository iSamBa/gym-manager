import { format } from "date-fns";
import type { TimeSlot } from "./types";

/**
 * Generates 30-minute time slots for a given day
 * Default: 6:00 AM to 9:00 PM (30 slots)
 *
 * @param date - The date to generate slots for
 * @param startHour - Starting hour (default: 6 for 6 AM)
 * @param endHour - Ending hour (default: 21 for 9 PM)
 * @param intervalMinutes - Slot duration (default: 30 minutes)
 * @returns Array of TimeSlot objects
 */
export function generateTimeSlots(
  date: Date,
  startHour = 6,
  endHour = 21,
  intervalMinutes = 30
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const baseDate = new Date(date);

  // Set to start of day
  baseDate.setHours(0, 0, 0, 0);

  // Calculate total slots
  const totalMinutes = (endHour - startHour) * 60;
  const totalSlots = totalMinutes / intervalMinutes;

  for (let i = 0; i < totalSlots; i++) {
    const slotStart = new Date(baseDate);
    slotStart.setHours(startHour);
    slotStart.setMinutes(i * intervalMinutes);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotStart.getMinutes() + intervalMinutes);

    slots.push({
      start: slotStart,
      end: slotEnd,
      label: `${format(slotStart, "h:mm a")} - ${format(slotEnd, "h:mm a")}`,
    });
  }

  return slots;
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
