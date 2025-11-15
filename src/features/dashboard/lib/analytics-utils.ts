/**
 * Dashboard Analytics Utilities
 *
 * Utilities for fetching dashboard analytics data from RPC functions
 */

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { WeeklySessionStats, MonthlyActivityStats } from "./types";

/**
 * Get weekly session statistics for a given week start date
 *
 * @param weekStartDate - Week start date in YYYY-MM-DD format (should be a Monday)
 * @returns Weekly session stats or null if error
 */
export const getWeeklySessionStats = async (
  weekStartDate: string
): Promise<WeeklySessionStats | null> => {
  try {
    const { data, error } = await supabase.rpc("get_weekly_session_stats", {
      p_week_start_date: weekStartDate,
    });

    if (error) {
      logger.error("Error fetching weekly session stats:", {
        error,
        weekStartDate,
      });
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    logger.error("Database error in getWeeklySessionStats:", { error });
    return null;
  }
};

/**
 * Get monthly activity statistics for a given month start date
 *
 * @param monthStartDate - Month start date in YYYY-MM-DD format (first day of month)
 * @returns Monthly activity stats or null if error
 */
export const getMonthlyActivityStats = async (
  monthStartDate: string
): Promise<MonthlyActivityStats | null> => {
  try {
    const { data, error } = await supabase.rpc("get_monthly_activity_stats", {
      p_month_start_date: monthStartDate,
    });

    if (error) {
      logger.error("Error fetching monthly activity stats:", {
        error,
        monthStartDate,
      });
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    logger.error("Database error in getMonthlyActivityStats:", { error });
    return null;
  }
};
