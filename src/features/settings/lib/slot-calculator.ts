import type { OpeningHoursWeek, DayOfWeek } from "./types";

/**
 * Calculate available 30-minute session slots for each day of the week
 * @param openingHours - Weekly opening hours configuration
 * @returns Object mapping each day to its number of available slots
 */
export function calculateAvailableSlots(
  openingHours: OpeningHoursWeek
): Record<DayOfWeek, number> {
  const slots: Record<DayOfWeek, number> = {} as Record<DayOfWeek, number>;

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
    const config = openingHours[day];

    if (!config.is_open || !config.open_time || !config.close_time) {
      slots[day] = 0;
      return;
    }

    // Parse time strings (HH:MM)
    const [openHour, openMin] = config.open_time.split(":").map(Number);
    const [closeHour, closeMin] = config.close_time.split(":").map(Number);

    // Convert to minutes
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    // Calculate 30-minute slots
    const totalMinutes = closeMinutes - openMinutes;
    const slotCount = Math.floor(totalMinutes / 30);

    slots[day] = slotCount;
  });

  return slots;
}

/**
 * Calculate total weekly available slots across all days
 * @param openingHours - Weekly opening hours configuration
 * @returns Total number of 30-minute slots available per week
 */
export function calculateTotalWeeklySlots(
  openingHours: OpeningHoursWeek
): number {
  const slotsPerDay = calculateAvailableSlots(openingHours);
  return Object.values(slotsPerDay).reduce((sum, slots) => sum + slots, 0);
}
