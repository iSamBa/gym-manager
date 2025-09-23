import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Types for member session statistics
export interface MemberSessionStats {
  total_sessions: number;
  attended_sessions: number;
  upcoming_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  attendance_rate: number;
  favorite_trainer: {
    id: string | null;
    name: string | null;
  };
  avg_session_duration_minutes: number;
  total_training_hours: number;
  monthly_trend: {
    direction: "up" | "down" | "stable";
    this_month: number;
    last_month: number;
    change: number;
  };
}

type UseMemberSessionStatsOptions = Omit<
  UseQueryOptions<MemberSessionStats, Error>,
  "queryKey" | "queryFn"
>;

// Hook to fetch member session statistics
export function useMemberSessionStats(
  memberId: string,
  options: UseMemberSessionStatsOptions = {}
) {
  return useQuery<MemberSessionStats, Error>({
    queryKey: ["member-session-stats", memberId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_member_session_stats", {
        member_uuid: memberId,
      });

      if (error) {
        console.error("Error fetching member session stats:", error);
        throw new Error(
          `Failed to fetch member session statistics: ${error.message}`
        );
      }

      if (!data) {
        // Return default stats if no data
        return {
          total_sessions: 0,
          attended_sessions: 0,
          upcoming_sessions: 0,
          completed_sessions: 0,
          cancelled_sessions: 0,
          attendance_rate: 0,
          favorite_trainer: {
            id: null,
            name: null,
          },
          avg_session_duration_minutes: 0,
          total_training_hours: 0,
          monthly_trend: {
            direction: "stable" as const,
            this_month: 0,
            last_month: 0,
            change: 0,
          },
        };
      }

      return data as MemberSessionStats;
    },
    enabled: Boolean(memberId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    ...options,
  });
}

// Hook to get member session insights for quick display
export function useMemberSessionInsights(memberId: string) {
  const { data: stats, isLoading, error } = useMemberSessionStats(memberId);

  // Derived insights for quick display
  const insights = {
    // Primary stats
    totalSessions: stats?.total_sessions || 0,
    upcomingSessions: stats?.upcoming_sessions || 0,
    attendanceRate: Math.round(stats?.attendance_rate || 0),
    trainingHours: Math.round((stats?.total_training_hours || 0) * 10) / 10,

    // Trend indicators
    isActiveTrainer: (stats?.total_sessions || 0) > 0,
    hasUpcomingSessions: (stats?.upcoming_sessions || 0) > 0,
    isGoodAttendance: (stats?.attendance_rate || 0) >= 80,
    monthlyTrend: stats?.monthly_trend.direction || "stable",
    monthlyChange: stats?.monthly_trend.change || 0,

    // Favorite trainer
    favoriteTrainer: stats?.favorite_trainer.name || "None",
    hasFavoriteTrainer: Boolean(stats?.favorite_trainer.id),

    // Session frequency insights
    avgSessionsPerMonth: stats
      ? Math.round((stats.total_sessions / 12) * 10) / 10
      : 0,
    avgSessionDuration:
      Math.round(((stats?.avg_session_duration_minutes || 0) / 60) * 10) / 10,

    // Status badges
    attendanceLevel:
      (stats?.attendance_rate || 0) >= 90
        ? "excellent"
        : (stats?.attendance_rate || 0) >= 75
          ? "good"
          : (stats?.attendance_rate || 0) >= 50
            ? "average"
            : "needs-improvement",

    activityLevel:
      (stats?.total_sessions || 0) >= 20
        ? "high"
        : (stats?.total_sessions || 0) >= 10
          ? "medium"
          : (stats?.total_sessions || 0) > 0
            ? "low"
            : "new",
  };

  return {
    stats,
    insights,
    isLoading,
    error,
  };
}

// Export query key factory for external cache invalidation
export const memberSessionStatsQueryKeys = {
  stats: (memberId: string) => ["member-session-stats", memberId],
};
