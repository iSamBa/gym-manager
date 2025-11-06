import { format, startOfDay, getDay } from "date-fns";
import type { TimeSlot } from "./types";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

// Default configuration (fallback when no settings exist)
const DEFAULT_SLOT_CONFIG = {
  START_HOUR: 9,
  END_HOUR: 24, // midnight
  SLOT_DURATION_MINUTES: 30,
} as const;

const DAY_INDEX_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

interface TimeSlotConfig {
  START_HOUR: number;
  END_HOUR: number;
  SLOT_DURATION_MINUTES: number;
}

/**
 * Get time slot configuration for a specific date
 * Queries opening hours from database with effective date handling
 *
 * @param date - The date to get configuration for
 * @returns Configuration object or null if day is closed
 */
export async function getTimeSlotConfig(
  date: Date
): Promise<TimeSlotConfig | null> {
  try {
    // Get active opening hours for this date
    const { data, error } = await supabase.rpc("get_active_opening_hours", {
      target_date: format(date, "yyyy-MM-dd"),
    });

    if (error) {
      logger.error("Failed to fetch opening hours:", { error: error });
      return DEFAULT_SLOT_CONFIG;
    }

    if (!data || Object.keys(data).length === 0) {
      // No settings found - use defaults
      return DEFAULT_SLOT_CONFIG;
    }

    // Get day of week
    const dayOfWeek = getDay(date);
    const dayName = DAY_INDEX_MAP[dayOfWeek];
    const dayConfig = data[dayName];

    if (!dayConfig || !dayConfig.is_open) {
      // Day is closed
      return null;
    }

    // Parse times
    const [openHour] = dayConfig.open_time.split(":").map(Number);
    const [closeHour] = dayConfig.close_time.split(":").map(Number);

    return {
      START_HOUR: openHour,
      END_HOUR: closeHour,
      SLOT_DURATION_MINUTES: 30,
    };
  } catch (err) {
    logger.error("Error getting time slot config:", { error: err });
    return DEFAULT_SLOT_CONFIG;
  }
}

/**
 * Generates 30-minute time slots for a given day
 * Now async - fetches opening hours from database
 *
 * @param date - The date to generate slots for
 * @returns Array of TimeSlot objects, or empty array if day is closed
 */
export async function generateTimeSlots(
  date: Date = new Date()
): Promise<TimeSlot[]> {
  const config = await getTimeSlotConfig(date);

  // Day is closed
  if (config === null) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const baseDate = startOfDay(date);

  for (let hour = config.START_HOUR; hour < config.END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += config.SLOT_DURATION_MINUTES) {
      const start = new Date(baseDate);
      start.setHours(hour, minute, 0, 0);

      const end = new Date(start);
      end.setMinutes(start.getMinutes() + config.SLOT_DURATION_MINUTES);

      slots.push({
        start,
        end,
        label: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
        hour,
        minute,
      });
    }
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
