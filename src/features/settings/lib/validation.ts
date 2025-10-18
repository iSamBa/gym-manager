import type { OpeningHoursWeek, DayOfWeek } from "./types";

/**
 * Validates opening hours for all days of the week
 * @param hours - Opening hours configuration for the week
 * @returns Object with validation errors keyed by day (empty if valid)
 */
export function validateOpeningHours(
  hours: OpeningHoursWeek
): Partial<Record<DayOfWeek, string>> {
  const errors: Partial<Record<DayOfWeek, string>> = {};

  const days: DayOfWeek[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  days.forEach((day) => {
    const config = hours[day];

    if (config.is_open) {
      // Check times exist
      if (!config.open_time || !config.close_time) {
        errors[day] = "Opening and closing times are required";
        return;
      }

      // Check time format
      const timeRegex = /^\d{2}:\d{2}$/;
      if (
        !timeRegex.test(config.open_time) ||
        !timeRegex.test(config.close_time)
      ) {
        errors[day] = "Invalid time format (expected HH:MM)";
        return;
      }

      // Check close time > open time
      if (config.close_time <= config.open_time) {
        errors[day] = "Closing time must be after opening time";
        return;
      }
    }
  });

  return errors;
}

/**
 * Checks if validation errors exist
 * @param errors - Validation errors object
 * @returns True if any errors exist, false otherwise
 */
export function hasValidationErrors(
  errors: Partial<Record<DayOfWeek, string>>
): boolean {
  return Object.keys(errors).length > 0;
}
