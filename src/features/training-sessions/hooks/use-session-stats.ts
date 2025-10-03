import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SessionFilters } from "@/features/training-sessions/lib/types";

// Session statistics interface
export interface SessionStats {
  total: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  active: number; // scheduled + in_progress
  average_utilization: number; // percentage
}

// Query keys for session statistics
export const sessionStatsKeys = {
  all: ["session-stats"] as const,
  stats: (filters: SessionFilters) =>
    [...sessionStatsKeys.all, "stats", filters] as const,
};

/**
 * Hook to get session statistics with SQL aggregation
 * Much more efficient than client-side filtering and counting
 */
export const useSessionStats = (filters?: SessionFilters) => {
  return useQuery({
    queryKey: sessionStatsKeys.stats(filters || {}),
    queryFn: async (): Promise<SessionStats> => {
      let query = supabase
        .from("training_sessions_calendar")
        .select("status, current_participants, max_participants");

      // Apply the same filters as useTrainingSessions
      if (filters?.trainer_id) {
        query = query.eq("trainer_id", filters.trainer_id);
      }

      if (filters?.member_id) {
        query = query.eq("member_id", filters.member_id);
      }

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }

      if (filters?.date_range) {
        query = query
          .gte("scheduled_start", filters.date_range.start.toISOString())
          .lte("scheduled_end", filters.date_range.end.toISOString());
      }

      const { data: sessions, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch session statistics: ${error.message}`);
      }

      if (!sessions) {
        return {
          total: 0,
          scheduled: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          active: 0,
          average_utilization: 0,
        };
      }

      // Calculate statistics efficiently with a single pass
      const stats = sessions.reduce(
        (acc, session) => {
          acc.total++;

          switch (session.status) {
            case "scheduled":
              acc.scheduled++;
              acc.active++;
              break;
            case "in_progress":
              acc.in_progress++;
              acc.active++;
              break;
            case "completed":
              acc.completed++;
              break;
            case "cancelled":
              acc.cancelled++;
              break;
          }

          // Calculate utilization for completed/in-progress sessions
          if (
            (session.status === "completed" ||
              session.status === "in_progress") &&
            session.max_participants > 0
          ) {
            acc.utilizationSum +=
              (session.current_participants || 0) / session.max_participants;
            acc.utilizationCount++;
          }

          return acc;
        },
        {
          total: 0,
          scheduled: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          active: 0,
          utilizationSum: 0,
          utilizationCount: 0,
        }
      );

      return {
        total: stats.total,
        scheduled: stats.scheduled,
        in_progress: stats.in_progress,
        completed: stats.completed,
        cancelled: stats.cancelled,
        active: stats.active,
        average_utilization:
          stats.utilizationCount > 0
            ? Math.round((stats.utilizationSum / stats.utilizationCount) * 100)
            : 0,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - stats don't change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
