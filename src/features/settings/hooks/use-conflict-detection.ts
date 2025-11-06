import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { OpeningHoursWeek, DayOfWeek } from "../lib/types";
import { format, getDay, parseISO } from "date-fns";

import { logger } from "@/lib/logger";
export interface SessionConflict {
  session_id: string;
  date: string; // ISO date (YYYY-MM-DD)
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  member_name: string | null;
  machine_number: number;
  reason: string;
}

const DAY_INDEX_MAP: Record<number, DayOfWeek> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

/**
 * Hook to detect conflicts between new opening hours and existing training sessions
 * @param newHours - The new opening hours configuration
 * @param effectiveDate - The date from which new hours take effect
 * @param enabled - Whether to run the query (default: false for manual trigger)
 * @returns Query result with conflicts array
 */
export function useConflictDetection(
  newHours: OpeningHoursWeek,
  effectiveDate: Date,
  enabled: boolean = false
) {
  return useQuery({
    queryKey: ["conflict-detection", newHours, effectiveDate.toISOString()],
    queryFn: () => checkConflicts(newHours, effectiveDate),
    enabled,
    staleTime: 0, // Always refetch when enabled
    gcTime: 0, // Don't cache results
  });
}

/**
 * Check for conflicts between new opening hours and existing sessions
 */
async function checkConflicts(
  newHours: OpeningHoursWeek,
  effectiveDate: Date
): Promise<SessionConflict[]> {
  // Fetch all training sessions from effective date onwards (excluding cancelled)
  const { data: sessions, error } = await supabase
    .from("training_sessions")
    .select(
      `
      id,
      scheduled_start,
      scheduled_end,
      machine_id,
      machines (machine_number),
      training_session_members (
        member:members (first_name, last_name)
      )
    `
    )
    .gte("scheduled_start", effectiveDate.toISOString())
    .neq("status", "cancelled")
    .order("scheduled_start", { ascending: true });

  if (error) {
    logger.error("Error fetching training sessions:", { error });
    throw error;
  }

  const conflicts: SessionConflict[] = [];

  sessions?.forEach((session) => {
    const sessionStart = parseISO(session.scheduled_start);
    const sessionEnd = parseISO(session.scheduled_end);
    const dayOfWeek = getDay(sessionStart);
    const dayName = DAY_INDEX_MAP[dayOfWeek];
    const dayConfig = newHours[dayName];

    // Format session times in local timezone (HH:mm)
    const sessionStartTime = format(sessionStart, "HH:mm");
    const sessionEndTime = format(sessionEnd, "HH:mm");

    // Get machine number (handle both array and object from Supabase)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const machines = session.machines as any;
    const machineNumber =
      Array.isArray(machines) && machines.length > 0
        ? machines[0]?.machine_number
        : machines?.machine_number;

    // Check if day is closed
    if (!dayConfig.is_open) {
      conflicts.push({
        session_id: session.id,
        date: format(sessionStart, "yyyy-MM-dd"),
        start_time: session.scheduled_start,
        end_time: session.scheduled_end,
        member_name: getMemberName(session.training_session_members),
        machine_number: machineNumber || 0,
        reason: "Studio closed on this day",
      });
      return;
    }

    // Check if session is outside new hours
    const openTime = dayConfig.open_time || "00:00";
    const closeTime = dayConfig.close_time || "23:59";

    // Check if session is outside new hours
    // Session conflicts if it starts before opening OR ends after closing
    if (sessionStartTime < openTime || sessionEndTime > closeTime) {
      conflicts.push({
        session_id: session.id,
        date: format(sessionStart, "yyyy-MM-dd"),
        start_time: session.scheduled_start,
        end_time: session.scheduled_end,
        member_name: getMemberName(session.training_session_members),
        machine_number: machineNumber || 0,
        reason: `Outside new hours: ${openTime} - ${closeTime}`,
      });
    }
  });

  return conflicts;
}

/**
 * Extract member name from training_session_members array
 * Note: Using any to handle Supabase's dynamic type inference
 */
function getMemberName(members: unknown): string | null {
  if (!members || !Array.isArray(members) || members.length === 0) return null;
  const firstMember = members[0];
  if (!firstMember || !firstMember.member) return null;
  const member = Array.isArray(firstMember.member)
    ? firstMember.member[0]
    : firstMember.member;
  if (!member) return null;
  return `${member.first_name} ${member.last_name}`;
}
