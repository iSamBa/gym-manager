import { startOfDay, isBefore, isAfter, parseISO } from "date-fns";

/**
 * Session color variants based on date
 */
export type SessionColorVariant = "past" | "today" | "future";

/**
 * Determines the color variant for a session based on its scheduled start date
 *
 * Business Logic:
 * - Sessions before today (date-only comparison) → 'past'
 * - Sessions scheduled for today → 'today'
 * - Sessions after today → 'future'
 *
 * @param scheduledStart - ISO string of session start time
 * @returns Color variant for UI rendering
 */
export function getSessionColorVariant(
  scheduledStart: string
): SessionColorVariant {
  const sessionDate = startOfDay(parseISO(scheduledStart));
  const today = startOfDay(new Date());

  if (isBefore(sessionDate, today)) {
    return "past";
  }

  if (isAfter(sessionDate, today)) {
    return "future";
  }

  return "today";
}
