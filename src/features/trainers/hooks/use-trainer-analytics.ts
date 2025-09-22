import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Types for trainer analytics
export interface TrainerAnalytics {
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  upcoming_sessions: number;
  completion_rate: number;
  total_clients: number;
  repeat_clients: number;
  client_retention_rate: number;
  avg_utilization: number;
  revenue_generated: number;
  avg_rating: number;
  total_hours: number;
  peak_hour: {
    hour: string | null;
    session_count: number;
  };
  monthly_trend: {
    direction: "up" | "down" | "stable";
    this_month: number;
    last_month: number;
    change: number;
  };
}

type UseTrainerAnalyticsOptions = Omit<
  UseQueryOptions<TrainerAnalytics, Error>,
  "queryKey" | "queryFn"
>;

// Hook to fetch trainer analytics
export function useTrainerAnalytics(
  trainerId: string,
  options: UseTrainerAnalyticsOptions = {}
) {
  return useQuery<TrainerAnalytics, Error>({
    queryKey: ["trainer-analytics", trainerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trainer_analytics", {
        trainer_uuid: trainerId,
      });

      if (error) {
        console.error("Error fetching trainer analytics:", error);
        throw new Error(`Failed to fetch trainer analytics: ${error.message}`);
      }

      if (!data) {
        // Return default analytics if no data
        return {
          total_sessions: 0,
          completed_sessions: 0,
          cancelled_sessions: 0,
          upcoming_sessions: 0,
          completion_rate: 0,
          total_clients: 0,
          repeat_clients: 0,
          client_retention_rate: 0,
          avg_utilization: 0,
          revenue_generated: 0,
          avg_rating: 0,
          total_hours: 0,
          peak_hour: {
            hour: null,
            session_count: 0,
          },
          monthly_trend: {
            direction: "stable" as const,
            this_month: 0,
            last_month: 0,
            change: 0,
          },
        };
      }

      return data as TrainerAnalytics;
    },
    enabled: Boolean(trainerId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    ...options,
  });
}

// Hook to get trainer performance insights for dashboard display
export function useTrainerPerformanceInsights(trainerId: string) {
  const { data: analytics, isLoading, error } = useTrainerAnalytics(trainerId);

  // Derived insights for quick display
  const insights = {
    // Primary performance metrics
    totalSessions: analytics?.total_sessions || 0,
    completionRate: Math.round(analytics?.completion_rate || 0),
    clientRetention: Math.round(analytics?.client_retention_rate || 0),
    utilization: Math.round(analytics?.avg_utilization || 0),

    // Revenue and rating insights
    totalRevenue: analytics?.revenue_generated || 0,
    avgRating: Math.round((analytics?.avg_rating || 0) * 10) / 10,
    totalHours: Math.round((analytics?.total_hours || 0) * 10) / 10,

    // Client insights
    totalClients: analytics?.total_clients || 0,
    repeatClients: analytics?.repeat_clients || 0,
    newClients:
      (analytics?.total_clients || 0) - (analytics?.repeat_clients || 0),

    // Scheduling insights
    upcomingSessions: analytics?.upcoming_sessions || 0,
    peakHour: analytics?.peak_hour.hour || "N/A",
    peakSessionCount: analytics?.peak_hour.session_count || 0,

    // Trend indicators
    monthlyTrend: analytics?.monthly_trend.direction || "stable",
    monthlyChange: analytics?.monthly_trend.change || 0,
    isGrowingBusiness:
      analytics?.monthly_trend.direction === "up" &&
      analytics?.monthly_trend.change > 0,

    // Performance levels for badges/indicators
    performanceLevel:
      (analytics?.completion_rate || 0) >= 95
        ? "excellent"
        : (analytics?.completion_rate || 0) >= 85
          ? "good"
          : (analytics?.completion_rate || 0) >= 70
            ? "average"
            : "needs-improvement",

    retentionLevel:
      (analytics?.client_retention_rate || 0) >= 80
        ? "excellent"
        : (analytics?.client_retention_rate || 0) >= 60
          ? "good"
          : (analytics?.client_retention_rate || 0) >= 40
            ? "average"
            : "needs-improvement",

    utilizationLevel:
      (analytics?.avg_utilization || 0) >= 80
        ? "high"
        : (analytics?.avg_utilization || 0) >= 60
          ? "medium"
          : (analytics?.avg_utilization || 0) >= 30
            ? "low"
            : "very-low",

    // Status indicators
    isActiveTrainer: (analytics?.total_sessions || 0) > 0,
    hasUpcomingSessions: (analytics?.upcoming_sessions || 0) > 0,
    isTopPerformer:
      (analytics?.completion_rate || 0) >= 90 &&
      (analytics?.client_retention_rate || 0) >= 75,
    needsAttention:
      (analytics?.completion_rate || 0) < 70 ||
      (analytics?.client_retention_rate || 0) < 40,

    // Monthly comparison
    monthlyGrowthPercentage:
      analytics?.monthly_trend.last_month > 0
        ? Math.round(
            (analytics.monthly_trend.change /
              analytics.monthly_trend.last_month) *
              100 *
              10
          ) / 10
        : analytics?.monthly_trend.this_month > 0
          ? 100
          : 0,
  };

  return {
    analytics,
    insights,
    isLoading,
    error,
  };
}

// Hook for trainer dashboard summary (lightweight version)
export function useTrainerDashboardSummary(trainerId: string) {
  return useQuery<
    {
      upcomingToday: number;
      upcomingWeek: number;
      completionRate: number;
      totalClients: number;
      monthlyTrend: string;
    },
    Error
  >({
    queryKey: ["trainer-dashboard-summary", trainerId],
    queryFn: async () => {
      // Get analytics data
      const { data: analytics, error } = await supabase.rpc(
        "get_trainer_analytics",
        {
          trainer_uuid: trainerId,
        }
      );

      if (error) {
        throw new Error(`Failed to fetch trainer summary: ${error.message}`);
      }

      // Get today's sessions count
      const { data: todaySessions, error: todayError } = await supabase
        .from("trainer_session_analytics")
        .select("*", { count: "exact" })
        .eq("trainer_id", trainerId)
        .eq("is_today", true)
        .eq("is_upcoming", true);

      if (todayError) {
        console.warn("Failed to fetch today sessions count:", todayError);
      }

      const summary = {
        upcomingToday: todaySessions?.length || 0,
        upcomingWeek: analytics?.upcoming_sessions || 0,
        completionRate: Math.round(analytics?.completion_rate || 0),
        totalClients: analytics?.total_clients || 0,
        monthlyTrend: analytics?.monthly_trend?.direction || "stable",
      };

      return summary;
    },
    enabled: Boolean(trainerId),
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard data
  });
}

// Export query key factory for external cache invalidation
export const trainerAnalyticsQueryKeys = {
  analytics: (trainerId: string) => ["trainer-analytics", trainerId],
  summary: (trainerId: string) => ["trainer-dashboard-summary", trainerId],
};
