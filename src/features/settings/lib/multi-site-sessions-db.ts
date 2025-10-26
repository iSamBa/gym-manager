/**
 * Multi-Site Sessions Database Utilities
 * Functions for fetching and managing multi-site session data
 */

import { supabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date-utils";
import type { MultiSiteSession, MultiSiteSessionFilters } from "./types";

/**
 * Fetch all multi-site sessions with optional filters
 * @param filters - Optional filters for search, date range, and origin studio
 * @returns Array of multi-site sessions
 */
export async function getMultiSiteSessions(
  filters?: MultiSiteSessionFilters
): Promise<MultiSiteSession[]> {
  let query = supabase
    .from("training_sessions")
    .select(
      `
      id,
      scheduled_start,
      guest_first_name,
      guest_last_name,
      guest_gym_name,
      trainer_id,
      status,
      notes
    `
    )
    .eq("session_type", "multi_site")
    .order("scheduled_start", { ascending: false });

  // Apply filters
  if (filters?.date_from) {
    query = query.gte("scheduled_start", `${filters.date_from}T00:00:00Z`);
  }

  if (filters?.date_to) {
    query = query.lte("scheduled_start", `${filters.date_to}T23:59:59Z`);
  }

  if (filters?.origin_studio) {
    query = query.eq("guest_gym_name", filters.origin_studio);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch multi-site sessions: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // Fetch trainer names separately if needed
  const trainerIds = data
    .map((s) => s.trainer_id)
    .filter((id): id is string => id !== null);

  const trainersMap = new Map<string, string>();

  if (trainerIds.length > 0) {
    const { data: trainersData } = await supabase
      .from("trainers")
      .select("id, user_profiles!inner(first_name, last_name)")
      .in("id", trainerIds);

    if (trainersData) {
      trainersData.forEach(
        (trainer: {
          id: string;
          user_profiles: { first_name: string; last_name: string }[];
        }) => {
          // Supabase returns user_profiles as array even for one-to-one relationships
          const profile = trainer.user_profiles?.[0];
          if (profile) {
            trainersMap.set(
              trainer.id,
              `${profile.first_name} ${profile.last_name}`
            );
          }
        }
      );
    }
  }

  // Transform data and apply search filter
  let sessions = data.map((session) => {
    const sessionDate = new Date(session.scheduled_start);
    const trainerName = session.trainer_id
      ? trainersMap.get(session.trainer_id) || null
      : null;

    return {
      id: session.id,
      scheduled_start: session.scheduled_start,
      guest_first_name: session.guest_first_name,
      guest_last_name: session.guest_last_name,
      guest_gym_name: session.guest_gym_name,
      trainer_id: session.trainer_id,
      trainer_name: trainerName,
      status: session.status as
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled",
      notes: session.notes,
      session_date: getLocalDateString(sessionDate),
      session_time: sessionDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };
  });

  // Apply client-side search filter (for member name)
  if (filters?.search && filters.search.trim() !== "") {
    const searchLower = filters.search.toLowerCase();
    sessions = sessions.filter((session) => {
      const fullName =
        `${session.guest_first_name} ${session.guest_last_name}`.toLowerCase();
      return fullName.includes(searchLower);
    });
  }

  return sessions;
}

/**
 * Get list of unique origin studios for filtering
 * @returns Array of unique studio names
 */
export async function getOriginStudios(): Promise<string[]> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("guest_gym_name")
    .eq("session_type", "multi_site")
    .not("guest_gym_name", "is", null);

  if (error) {
    throw new Error(`Failed to fetch origin studios: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // Extract unique studio names
  const uniqueStudios = [
    ...new Set(data.map((item) => item.guest_gym_name).filter(Boolean)),
  ] as string[];

  return uniqueStudios.sort();
}
