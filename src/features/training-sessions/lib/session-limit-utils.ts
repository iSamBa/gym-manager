import { supabase } from "@/lib/supabase";
import { getLocalDateString, formatForDatabase } from "@/lib/date-utils";
import type { StudioSessionLimit } from "./types";
import type {
  MemberWeeklyLimitResult,
  SessionType,
} from "@/features/database/lib/types";

/**
 * Get the start and end dates of the week containing the given date.
 * Week is Sunday-Saturday for member weekly limit validation.
 *
 * @param date - The date to get the week range for
 * @returns WeekRange object with start (Sunday) and end (Saturday) Date objects
 *
 * @example
 * // For Thursday, Oct 18, 2025
 * getWeekRange(new Date(2025, 9, 18))
 * // Returns: { start: Date(Sunday), end: Date(Saturday) }
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  // Start of week (Sunday)
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  // End of week (Saturday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    start: weekStart,
    end: weekEnd,
  };
}

/**
 * Check if member has reached weekly session limit.
 * Calls the database RPC function check_member_weekly_session_limit.
 *
 * @param memberId - UUID of the member
 * @param scheduledStart - Start time of the session being booked
 * @param sessionType - Type of session being booked (default: "member")
 * @returns Validation result from RPC function
 * @throws Error if database query fails
 *
 * @example
 * const result = await checkMemberWeeklyLimit(
 *   "member-uuid",
 *   new Date("2025-10-18T10:00:00"),
 *   "member"
 * );
 * if (!result.can_book) {
 *   throw new Error(result.message);
 * }
 */
export async function checkMemberWeeklyLimit(
  memberId: string,
  scheduledStart: Date,
  sessionType: SessionType = "member"
): Promise<MemberWeeklyLimitResult> {
  const weekRange = getWeekRange(scheduledStart);

  const { data, error } = await supabase.rpc(
    "check_member_weekly_session_limit",
    {
      p_member_id: memberId,
      p_week_start: formatForDatabase(weekRange.start),
      p_week_end: formatForDatabase(weekRange.end),
      p_session_type: sessionType,
    }
  );

  if (error) {
    throw new Error(`Failed to check weekly limit: ${error.message}`);
  }

  return data;
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
    p_week_start: getLocalDateString(weekRange.start),
    p_week_end: getLocalDateString(weekRange.end),
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
