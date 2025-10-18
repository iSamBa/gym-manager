/**
 * Date Utilities - Timezone-aware date handling
 *
 * IMPORTANT: These functions use the user's LOCAL timezone,
 * not UTC. This ensures dates display correctly regardless
 * of where the user is located.
 *
 * @module date-utils
 */

/**
 * Get local date as YYYY-MM-DD string
 *
 * Uses the user's local timezone, not UTC. This prevents the common
 * "date off by 1 day" bug when users are in different timezones.
 *
 * @param date - Date to format (defaults to current date)
 * @returns Date string in YYYY-MM-DD format (user's timezone)
 *
 * @example
 * ```typescript
 * getLocalDateString()  // "2025-10-18" (today in user's timezone)
 * getLocalDateString(new Date(2025, 9, 20))  // "2025-10-20"
 * ```
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Compare two dates (date-only, ignoring time)
 *
 * Compares dates as strings to avoid timezone issues with Date objects.
 * Works with both string dates (YYYY-MM-DD) and Date objects.
 *
 * @param a - First date (string or Date object)
 * @param b - Second date (string or Date object)
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 *
 * @example
 * ```typescript
 * compareDates("2025-10-20", "2025-10-18")  // 1 (a > b)
 * compareDates("2025-10-18", new Date(2025, 9, 18))  // 0 (equal)
 * compareDates(new Date(2025, 9, 15), "2025-10-18")  // -1 (a < b)
 * ```
 */
export function compareDates(a: string | Date, b: string | Date): number {
  const dateA = typeof a === "string" ? a : getLocalDateString(a);
  const dateB = typeof b === "string" ? b : getLocalDateString(b);
  return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
}

/**
 * Check if date is in the future (user's timezone)
 *
 * Compares against today's date in the user's local timezone.
 *
 * @param date - Date to check (string or Date object)
 * @returns true if date is after today
 *
 * @example
 * ```typescript
 * isFutureDate("2025-10-20")  // true (if today is before Oct 20)
 * isFutureDate("2025-10-10")  // false (if today is after Oct 10)
 * isFutureDate(new Date(2025, 9, 18))  // false (if today is Oct 18)
 * ```
 */
export function isFutureDate(date: string | Date): boolean {
  return compareDates(date, new Date()) > 0;
}

/**
 * Check if date is today (user's timezone)
 *
 * Compares against today's date in the user's local timezone.
 *
 * @param date - Date to check (string or Date object)
 * @returns true if date is today
 *
 * @example
 * ```typescript
 * isToday(new Date())  // true
 * isToday("2025-10-18")  // true (if today is Oct 18)
 * isToday("2025-10-20")  // false (if today is not Oct 20)
 * ```
 */
export function isToday(date: string | Date): boolean {
  return compareDates(date, new Date()) === 0;
}

/**
 * Format date for database (date column)
 *
 * Use for PostgreSQL `date` columns (no timezone information).
 * Returns date in user's local timezone as YYYY-MM-DD.
 *
 * @param date - Date to format
 * @returns Date string for database storage
 *
 * @example
 * ```typescript
 * formatForDatabase(new Date())  // "2025-10-18"
 * // Use for: join_date, start_date, end_date, effective_from, etc.
 * ```
 */
export function formatForDatabase(date: Date): string {
  return getLocalDateString(date);
}

/**
 * Format timestamp for database (timestamptz column)
 *
 * Use for PostgreSQL `timestamptz` columns (with timezone).
 * Returns full ISO string with timezone information.
 *
 * @param date - Date to format (defaults to current time)
 * @returns ISO timestamp string for database storage
 *
 * @example
 * ```typescript
 * formatTimestampForDatabase(new Date())
 * // "2025-10-18T01:26:00.000Z"
 * // Use for: created_at, updated_at, scheduled_start, cancelled_at, etc.
 * ```
 */
export function formatTimestampForDatabase(date: Date = new Date()): string {
  return date.toISOString();
}
