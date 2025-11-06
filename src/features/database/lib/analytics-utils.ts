/**
 * Database analytics utilities using SQL GROUP BY and aggregation functions
 * Replaces client-side filtering and aggregation with database-level operations
 */
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export interface TrainerAnalytics {
  trainer_id: string;
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  total_revenue: number;
  avg_revenue_per_session: number;
  unique_members: number;
  total_hours: number;
  avg_utilization: number;
}

export interface MemberAnalytics {
  status_distribution: {
    status: string;
    count: number;
    percentage: number;
  }[];
  membership_trends: {
    period: string;
    new_members: number;
    expired_members: number;
    retention_rate: number;
  }[];
  revenue_by_plan: {
    plan_name: string;
    member_count: number;
    total_revenue: number;
  }[];
}

/**
 * Get trainer analytics using SQL aggregation instead of client-side filtering
 */
export const getTrainerAnalytics = async (
  trainerId: string
): Promise<TrainerAnalytics | null> => {
  try {
    // Single SQL query with GROUP BY and aggregations
    const { data, error } = await supabase.rpc("get_trainer_analytics", {
      p_trainer_id: trainerId,
    });

    if (error) {
      logger.error("Error fetching trainer analytics:", { error });
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    logger.error("Database error in getTrainerAnalytics:", { error });
    return null;
  }
};

/**
 * Get member status distribution using SQL GROUP BY
 */
export const getMemberStatusDistribution = async (): Promise<
  { status: string; count: number; percentage: number }[]
> => {
  try {
    const { data, error } = await supabase.rpc(
      "get_member_status_distribution"
    );

    if (error) {
      logger.error("Error fetching member status distribution:", { error });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error("Database error in getMemberStatusDistribution:", { error });
    return [];
  }
};

/**
 * Get dashboard stats using SQL aggregations
 */
export const getDashboardStats = async () => {
  try {
    const { data, error } = await supabase.rpc("get_dashboard_stats");

    if (error) {
      logger.error("Error fetching dashboard stats:", { error });
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    logger.error("Database error in getDashboardStats:", { error });
    return null;
  }
};
