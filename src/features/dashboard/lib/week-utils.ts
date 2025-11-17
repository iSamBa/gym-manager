/**
 * Week Utilities for Dashboard Analytics
 *
 * Utilities for calculating calendar week boundaries (Monday-Sunday)
 * Uses local timezone for all date operations
 */

import { startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { getLocalDateString } from "@/lib/date-utils";

/**
 * Get the start and end dates of a calendar week (Monday-Sunday)
 * for a given date
 *
 * @param date - The date to get the week bounds for
 * @returns Object with week_start and week_end in YYYY-MM-DD format
 */
export function getCalendarWeekBounds(date: Date): {
  week_start: string;
  week_end: string;
} {
  // Start of week (Monday)
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });

  // End of week (Sunday)
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  return {
    week_start: getLocalDateString(weekStart),
    week_end: getLocalDateString(weekEnd),
  };
}

/**
 * Get the bounds for last week (Monday-Sunday)
 *
 * @returns Object with week_start and week_end for last week
 */
export function getLastWeekBounds(): {
  week_start: string;
  week_end: string;
} {
  const lastWeek = subWeeks(new Date(), 1);
  return getCalendarWeekBounds(lastWeek);
}

/**
 * Get the bounds for current week (Monday-Sunday)
 *
 * @returns Object with week_start and week_end for current week
 */
export function getCurrentWeekBounds(): {
  week_start: string;
  week_end: string;
} {
  return getCalendarWeekBounds(new Date());
}

/**
 * Get the bounds for next week (Monday-Sunday)
 *
 * @returns Object with week_start and week_end for next week
 */
export function getNextWeekBounds(): {
  week_start: string;
  week_end: string;
} {
  const nextWeek = addWeeks(new Date(), 1);
  return getCalendarWeekBounds(nextWeek);
}

/**
 * Format a week range for display
 *
 * @param weekStart - Week start date in YYYY-MM-DD format
 * @param weekEnd - Week end date in YYYY-MM-DD format
 * @returns Formatted string like "Jan 1 - Jan 7, 2024"
 */
export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);

  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const endDay = end.getDate();
  const year = end.getFullYear();

  // If same month, show "Jan 1 - 7, 2024"
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }

  // If different months, show "Jan 30 - Feb 5, 2024"
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}
