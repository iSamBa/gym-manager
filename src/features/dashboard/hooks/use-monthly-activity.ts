/**
 * Monthly Activity Analytics Hook
 *
 * React Query hooks for fetching monthly activity statistics
 */

import { useQuery } from "@tanstack/react-query";
import { getMonthlyActivityStats } from "../lib/analytics-utils";

// Query keys for monthly activity
export const monthlyActivityKeys = {
  all: ["monthly-activity"] as const,
  month: (monthStart: string) =>
    [...monthlyActivityKeys.all, monthStart] as const,
};

/**
 * Hook to get monthly activity statistics for a specific month
 *
 * @param monthStart - Month start date in YYYY-MM-DD format (first day of month)
 * @returns React Query result with monthly activity stats
 */
export const useMonthlyActivity = (monthStart: string) => {
  return useQuery({
    queryKey: monthlyActivityKeys.month(monthStart),
    queryFn: () => getMonthlyActivityStats(monthStart),
    enabled: !!monthStart,
    staleTime: 5 * 60 * 1000, // 5 minutes - activity stats don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
