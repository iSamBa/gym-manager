import { supabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date-utils";
import type { StudioSessionLimit, WeekRange } from "./types";

/**
 * Get the start and end dates of the week containing the given date.
 * Week is Monday-Sunday.
 *
 * @param date - The date to get the week range for
 * @returns WeekRange object with start (Monday) and end (Sunday) in YYYY-MM-DD format
 *
 * @example
 * // For Thursday, Oct 18, 2025
 * getWeekRange(new Date(2025, 9, 18))
 * // Returns: { start: "2025-10-13", end: "2025-10-19" }
 */
export function getWeekRange(date: Date): WeekRange {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday

  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: getLocalDateString(monday),
    end: getLocalDateString(sunday),
  };
}

/**
 * Check if studio has reached weekly session limit.
 * Calls the database function check_studio_session_limit to get:
 * - current_count: Number of sessions scheduled this week (excluding cancelled)
 * - max_allowed: Maximum sessions allowed per week (from settings)
 * - can_book: Whether new bookings are allowed
 * - percentage: Current capacity utilization percentage
 *
 * @param date - The date to check session limit for (determines which week)
 * @returns StudioSessionLimit object with capacity information
 * @throws Error if database query fails
 *
 * @example
 * const limit = await checkStudioSessionLimit(new Date());
 * if (!limit.can_book) {
 *   console.log("Studio at capacity:", limit.current_count, "/", limit.max_allowed);
 * }
 */
export async function checkStudioSessionLimit(
  date: Date
): Promise<StudioSessionLimit> {
  const weekRange = getWeekRange(date);

  const { data, error } = await supabase.rpc("check_studio_session_limit", {
    p_week_start: weekRange.start,
    p_week_end: weekRange.end,
  });

  if (error) throw error;

  // Return first row or default if no data
  return (
    data[0] || {
      current_count: 0,
      max_allowed: 0,
      can_book: false,
      percentage: 0,
    }
  );
}

/**
 * Get color scheme and styling based on capacity percentage.
 * Uses traffic light colors:
 * - Green (0-79%): Safe capacity
 * - Yellow (80-94%): Approaching capacity
 * - Red (95-100%): At or near capacity
 *
 * @param percentage - Capacity percentage (0-100)
 * @returns Object with Tailwind CSS classes and variant type
 *
 * @example
 * const colors = getCapacityColorScheme(85); // Yellow zone
 * // Returns: { text: "text-yellow-600", bg: "bg-yellow-100", ... }
 */
export function getCapacityColorScheme(percentage: number): {
  text: string;
  bg: string;
  border: string;
  variant: "default" | "warning" | "error";
} {
  if (percentage >= 95) {
    return {
      text: "text-red-600",
      bg: "bg-red-100",
      border: "border-red-300",
      variant: "error",
    };
  } else if (percentage >= 80) {
    return {
      text: "text-yellow-600",
      bg: "bg-yellow-100",
      border: "border-yellow-300",
      variant: "warning",
    };
  } else {
    return {
      text: "text-green-600",
      bg: "bg-green-100",
      border: "border-green-300",
      variant: "default",
    };
  }
}
