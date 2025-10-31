import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date-utils";
import type { DailyStatistics } from "../lib/types";

/**
 * RPC response interface matching database function return type
 */
interface DailyStatisticsRpcResponse {
  day_date: string;
  total_count: number;
  trial_count: number;
  member_count: number;
  contractual_count: number;
  makeup_count: number;
  multi_site_count: number;
  collaboration_count: number;
  non_bookable_count: number;
}

/**
 * Hook for fetching daily session statistics for a date range
 *
 * Fetches aggregated session counts (total, standard, trial) for each day
 * in the specified date range using the `get_daily_session_statistics` RPC function.
 *
 * @param weekStart - Start date of the week (Monday)
 * @param weekEnd - End date of the week (Sunday)
 * @returns React Query result with DailyStatistics array
 *
 * @example
 * ```tsx
 * const { data: statistics, isLoading } = useDailyStatistics(weekStart, weekEnd);
 *
 * // statistics = [
 * //   { date: '2025-10-14', total: 10, trial: 2, member: 5, contractual: 2, makeup: 1, multi_site: 0, collaboration: 0, non_bookable: 0 },
 * //   { date: '2025-10-15', total: 12, trial: 3, member: 6, contractual: 2, makeup: 1, multi_site: 0, collaboration: 0, non_bookable: 0 },
 * //   ...
 * // ]
 * ```
 */
export const useDailyStatistics = (weekStart: Date, weekEnd: Date) => {
  return useQuery({
    queryKey: [
      "daily-statistics",
      getLocalDateString(weekStart),
      getLocalDateString(weekEnd),
    ],
    queryFn: async (): Promise<DailyStatistics[]> => {
      const { data, error } = await supabase.rpc(
        "get_daily_session_statistics",
        {
          p_start_date: getLocalDateString(weekStart),
          p_end_date: getLocalDateString(weekEnd),
        }
      );

      if (error) {
        throw new Error(`Failed to fetch daily statistics: ${error.message}`);
      }

      // Transform RPC response to DailyStatistics[]
      const statistics: DailyStatistics[] = (
        (data as DailyStatisticsRpcResponse[]) || []
      ).map((row) => ({
        date: row.day_date,
        total: row.total_count,
        trial: row.trial_count,
        member: row.member_count,
        contractual: row.contractual_count,
        makeup: row.makeup_count,
        multi_site: row.multi_site_count,
        collaboration: row.collaboration_count,
        non_bookable: row.non_bookable_count,
      }));

      return statistics;
    },
    staleTime: 1000 * 60, // 1 minute - fresh enough for real-time feel
    gcTime: 1000 * 60 * 5, // 5 minutes - keep in cache
  });
};
