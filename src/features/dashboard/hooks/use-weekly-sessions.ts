/**
 * Weekly Sessions Analytics Hook
 *
 * React Query hooks for fetching weekly session statistics
 */

import { useQuery, useQueries } from "@tanstack/react-query";
import { getWeeklySessionStats } from "../lib/analytics-utils";
import {
  getLastWeekBounds,
  getCurrentWeekBounds,
  getNextWeekBounds,
} from "../lib/week-utils";
import type { ThreeWeekSessionsData, WeeklySessionStats } from "../lib/types";

// Query keys for weekly sessions
export const weeklySessionsKeys = {
  all: ["weekly-sessions"] as const,
  week: (weekStart: string) => [...weeklySessionsKeys.all, weekStart] as const,
  threeWeeks: () => [...weeklySessionsKeys.all, "three-weeks"] as const,
};

/**
 * Hook to get session statistics for a specific week
 *
 * @param weekStart - Week start date in YYYY-MM-DD format (should be a Monday)
 * @returns React Query result with weekly session stats
 */
export const useWeeklySessions = (weekStart: string) => {
  return useQuery({
    queryKey: weeklySessionsKeys.week(weekStart),
    queryFn: () => getWeeklySessionStats(weekStart),
    enabled: !!weekStart,
    staleTime: 5 * 60 * 1000, // 5 minutes - session stats don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get session statistics for last week, current week, and next week
 * Fetches all three weeks in parallel for better performance
 *
 * @returns Object with data for all three weeks
 */
export const useThreeWeekSessions = () => {
  const lastWeek = getLastWeekBounds();
  const currentWeek = getCurrentWeekBounds();
  const nextWeek = getNextWeekBounds();

  // Fetch all three weeks in parallel
  const results = useQueries({
    queries: [
      {
        queryKey: weeklySessionsKeys.week(lastWeek.week_start),
        queryFn: () => getWeeklySessionStats(lastWeek.week_start),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
      {
        queryKey: weeklySessionsKeys.week(currentWeek.week_start),
        queryFn: () => getWeeklySessionStats(currentWeek.week_start),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
      {
        queryKey: weeklySessionsKeys.week(nextWeek.week_start),
        queryFn: () => getWeeklySessionStats(nextWeek.week_start),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    ],
  });

  const [lastWeekQuery, currentWeekQuery, nextWeekQuery] = results;

  return {
    data: {
      lastWeek: lastWeekQuery.data as WeeklySessionStats | null,
      currentWeek: currentWeekQuery.data as WeeklySessionStats | null,
      nextWeek: nextWeekQuery.data as WeeklySessionStats | null,
    } as ThreeWeekSessionsData,
    isLoading:
      lastWeekQuery.isLoading ||
      currentWeekQuery.isLoading ||
      nextWeekQuery.isLoading,
    isError:
      lastWeekQuery.isError ||
      currentWeekQuery.isError ||
      nextWeekQuery.isError,
    error: lastWeekQuery.error || currentWeekQuery.error || nextWeekQuery.error,
  };
};
