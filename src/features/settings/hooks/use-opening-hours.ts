import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import type { OpeningHoursWeek } from "../lib/types";

/**
 * Hook to fetch opening hours for a specific date with caching
 * Uses React Query to cache results for 5 minutes
 *
 * @param date - The date to fetch opening hours for
 * @returns React Query result with opening hours data
 */
export function useOpeningHours(date: Date) {
  return useQuery({
    queryKey: ["opening-hours", format(date, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_active_opening_hours", {
        target_date: format(date, "yyyy-MM-dd"),
      });

      if (error) throw error;

      return data as OpeningHoursWeek | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
