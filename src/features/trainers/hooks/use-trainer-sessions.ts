import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Types for trainer sessions
export interface TrainerSession {
  trainer_id: string;
  session_id: string;
  scheduled_start: string;
  scheduled_end: string;
  session_status: "scheduled" | "in_progress" | "completed" | "cancelled";
  location: string | null;
  notes: string | null;
  duration_minutes: number;
  is_upcoming: boolean;
  is_today: boolean;
  member_count: number;
  max_participants: number;
  current_participants: number;
  member_names: string | null; // Comma-separated list of member names
}

export interface TrainerSessionFilters {
  status?: "all" | "upcoming" | "completed" | "cancelled";
  date_range?: {
    start: Date;
    end: Date;
  };
  search?: string;
  member_id?: string;
}

interface UseTrainerSessionsOptions
  extends Omit<
    UseQueryOptions<TrainerSession[], Error>,
    "queryKey" | "queryFn"
  > {
  filters?: TrainerSessionFilters;
}

// Hook to fetch trainer sessions with filtering
export function useTrainerSessions(
  trainerId: string,
  options: UseTrainerSessionsOptions = {}
) {
  const { filters = {}, ...queryOptions } = options;

  return useQuery<TrainerSession[], Error>({
    queryKey: ["trainer-sessions", trainerId, filters],
    queryFn: async () => {
      let query = supabase
        .from("trainer_session_history")
        .select("*")
        .eq("trainer_id", trainerId);

      // Apply status filter
      if (filters.status && filters.status !== "all") {
        if (filters.status === "upcoming") {
          query = query.eq("is_upcoming", true);
        } else if (filters.status === "completed") {
          query = query.eq("session_status", "completed");
        } else if (filters.status === "cancelled") {
          query = query.eq("session_status", "cancelled");
        }
      }

      // Apply member filter (search in member names)
      if (filters.member_id) {
        query = query.ilike("member_names", `%${filters.member_id}%`);
      }

      // Apply date range filter
      if (filters.date_range) {
        query = query
          .gte("scheduled_start", filters.date_range.start.toISOString())
          .lte("scheduled_start", filters.date_range.end.toISOString());
      }

      // Apply search filter (search in member names, location, or notes)
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(
          `member_names.ilike.${searchTerm},location.ilike.${searchTerm},notes.ilike.${searchTerm}`
        );
      }

      // Order by scheduled date (most recent first for completed, upcoming first for future)
      query = query.order("scheduled_start", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching trainer sessions:", error);
        throw new Error(`Failed to fetch trainer sessions: ${error.message}`);
      }

      return data || [];
    },
    enabled: Boolean(trainerId),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    ...queryOptions,
  });
}

// Hook to fetch upcoming sessions only (for calendar view)
export function useUpcomingTrainerSessions(trainerId: string) {
  return useTrainerSessions(trainerId, {
    filters: { status: "upcoming" },
    staleTime: 60 * 1000, // 1 minute for upcoming sessions
  });
}

// Hook to fetch trainer's schedule for today
export function useTodayTrainerSessions(trainerId: string) {
  return useQuery<TrainerSession[], Error>({
    queryKey: ["trainer-sessions-today", trainerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainer_session_history")
        .select("*")
        .eq("trainer_id", trainerId)
        .eq("is_today", true)
        .order("scheduled_start", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch today's sessions: ${error.message}`);
      }

      return data || [];
    },
    enabled: Boolean(trainerId),
    staleTime: 5 * 60 * 1000, // 5 minutes for today's sessions
  });
}

// Hook to fetch trainer's schedule for the current week
export function useWeeklyTrainerSessions(trainerId: string) {
  return useQuery<TrainerSession[], Error>({
    queryKey: ["trainer-sessions-week", trainerId],
    queryFn: async () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
      endOfWeek.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("trainer_session_history")
        .select("*")
        .eq("trainer_id", trainerId)
        .gte("scheduled_start", startOfWeek.toISOString())
        .lte("scheduled_start", endOfWeek.toISOString())
        .order("scheduled_start", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch weekly sessions: ${error.message}`);
      }

      return data || [];
    },
    enabled: Boolean(trainerId),
    staleTime: 2 * 60 * 1000, // 2 minutes for weekly view
  });
}

// Hook to fetch trainer session history (completed sessions for analytics)
export function useTrainerSessionHistory(
  trainerId: string,
  options: UseTrainerSessionsOptions = {}
) {
  const { filters = {}, ...queryOptions } = options;

  return useTrainerSessions(trainerId, {
    ...queryOptions,
    filters: {
      ...filters,
      status:
        filters.status === "all" ? undefined : filters.status || "completed",
    },
  });
}

// Export query key factory for external cache invalidation
export const trainerSessionsQueryKeys = {
  all: (trainerId: string) => ["trainer-sessions", trainerId],
  withFilters: (trainerId: string, filters: TrainerSessionFilters) => [
    "trainer-sessions",
    trainerId,
    filters,
  ],
  today: (trainerId: string) => ["trainer-sessions-today", trainerId],
  week: (trainerId: string) => ["trainer-sessions-week", trainerId],
  upcoming: (trainerId: string) => [
    "trainer-sessions",
    trainerId,
    { status: "upcoming" },
  ],
};
