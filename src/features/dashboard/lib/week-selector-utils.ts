/**
 * Week Selector Utilities
 *
 * Utilities for selecting and navigating weeks by week number and year
 * Uses ISO 8601 week numbering (weeks start on Monday, week 1 contains Jan 4)
 */

import {
  getISOWeek,
  getISOWeeksInYear,
  setISOWeek,
  startOfISOWeek,
  endOfISOWeek,
  getYear,
  setYear,
} from "date-fns";
import { getLocalDateString } from "@/lib/date-utils";

export interface WeekOption {
  weekNumber: number;
  year: number;
  displayLabel: string;
  weekStart: string;
  weekEnd: string;
}

/**
 * Get the ISO week number for a given date
 *
 * @param date - The date to get the week number for (defaults to today)
 * @returns ISO week number (1-53)
 */
export function getCurrentWeekNumber(date: Date = new Date()): number {
  return getISOWeek(date);
}

/**
 * Get the current year
 *
 * @param date - The date to get the year for (defaults to today)
 * @returns Current year
 */
export function getCurrentYear(date: Date = new Date()): number {
  return getYear(date);
}

/**
 * Get the total number of ISO weeks in a given year
 *
 * @param year - The year to check
 * @returns Number of weeks in the year (52 or 53)
 */
export function getWeeksInYear(year: number): number {
  return getISOWeeksInYear(new Date(year, 0, 1));
}

/**
 * Get the start and end dates for a specific ISO week number and year
 *
 * @param weekNumber - ISO week number (1-53)
 * @param year - The year
 * @returns Object with week_start and week_end in YYYY-MM-DD format
 */
export function getWeekBoundsForWeekNumber(
  weekNumber: number,
  year: number
): {
  week_start: string;
  week_end: string;
} {
  // Create a date in the target year
  let date = new Date(year, 0, 4); // Jan 4 is always in week 1
  date = setYear(date, year);
  date = setISOWeek(date, weekNumber);

  // Get the start and end of the ISO week
  const weekStart = startOfISOWeek(date);
  const weekEnd = endOfISOWeek(date);

  return {
    week_start: getLocalDateString(weekStart),
    week_end: getLocalDateString(weekEnd),
  };
}

/**
 * Get a list of all weeks in a year as options for a selector
 *
 * @param year - The year to get weeks for
 * @returns Array of week options with display labels and date ranges
 */
export function getWeekOptionsForYear(year: number): WeekOption[] {
  const totalWeeks = getWeeksInYear(year);
  const weeks: WeekOption[] = [];

  for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber++) {
    const { week_start, week_end } = getWeekBoundsForWeekNumber(
      weekNumber,
      year
    );

    // Format display label
    const start = new Date(week_start);
    const end = new Date(week_end);
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const startDay = start.getDate();
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const endDay = end.getDate();

    let displayLabel: string;
    if (startMonth === endMonth) {
      displayLabel = `Week ${weekNumber}: ${startMonth} ${startDay} - ${endDay}`;
    } else {
      displayLabel = `Week ${weekNumber}: ${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }

    weeks.push({
      weekNumber,
      year,
      displayLabel,
      weekStart: week_start,
      weekEnd: week_end,
    });
  }

  return weeks;
}

/**
 * Get a range of years for the year selector
 *
 * @param startYear - The starting year (defaults to 2020)
 * @param endYear - The ending year (defaults to current year + 1)
 * @returns Array of year numbers
 */
export function getAvailableYears(
  startYear: number = 2020,
  endYear?: number
): number[] {
  const currentYear = getCurrentYear();
  const finalEndYear = endYear ?? currentYear + 1;
  const years: number[] = [];

  for (let year = startYear; year <= finalEndYear; year++) {
    years.push(year);
  }

  return years;
}

/**
 * Format a week range for display (re-exported from week-utils for convenience)
 *
 * @param weekStart - Week start date in YYYY-MM-DD format
 * @param weekEnd - Week end date in YYYY-MM-DD format
 * @returns Formatted string like "Jan 1 - Jan 7, 2024"
 */
export function formatWeekRangeWithYear(
  weekStart: string,
  weekEnd: string
): string {
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
