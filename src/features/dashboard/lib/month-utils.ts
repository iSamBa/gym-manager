/**
 * Month Utilities for Dashboard Analytics
 *
 * Utilities for calculating month boundaries
 * Uses local timezone for all date operations
 */

import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  format,
} from "date-fns";
import { getLocalDateString } from "@/lib/date-utils";

/**
 * Get the start and end dates of a month for a given date
 *
 * @param date - The date to get the month bounds for
 * @returns Object with month_start and month_end in YYYY-MM-DD format
 */
export function getMonthBounds(date: Date): {
  month_start: string;
  month_end: string;
} {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  return {
    month_start: getLocalDateString(monthStart),
    month_end: getLocalDateString(monthEnd),
  };
}

/**
 * Get the bounds for current month
 *
 * @returns Object with month_start and month_end for current month
 */
export function getCurrentMonthBounds(): {
  month_start: string;
  month_end: string;
} {
  return getMonthBounds(new Date());
}

/**
 * Get the bounds for previous month
 *
 * @returns Object with month_start and month_end for previous month
 */
export function getPreviousMonthBounds(): {
  month_start: string;
  month_end: string;
} {
  const previousMonth = subMonths(new Date(), 1);
  return getMonthBounds(previousMonth);
}

/**
 * Get the bounds for next month
 *
 * @returns Object with month_start and month_end for next month
 */
export function getNextMonthBounds(): {
  month_start: string;
  month_end: string;
} {
  const nextMonth = addMonths(new Date(), 1);
  return getMonthBounds(nextMonth);
}

/**
 * Format a month for display
 *
 * @param monthStart - Month start date in YYYY-MM-DD format
 * @returns Formatted string like "January 2024"
 */
export function formatMonth(monthStart: string): string {
  const date = new Date(monthStart);
  return format(date, "MMMM yyyy");
}

/**
 * Get month bounds from a date string
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Object with month_start and month_end
 */
export function getMonthBoundsFromString(dateString: string): {
  month_start: string;
  month_end: string;
} {
  const date = new Date(dateString);
  return getMonthBounds(date);
}
