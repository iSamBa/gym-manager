import { useQuery } from "@tanstack/react-query";
import {
  checkStudioSessionLimit,
  getWeekRange,
} from "../lib/session-limit-utils";

/**
 * React Query hook to fetch and monitor studio session limit for a given date.
 *
 * Returns session limit data including:
 * - current_count: Number of sessions scheduled this week
 * - max_allowed: Maximum sessions allowed per week
 * - can_book: Whether new bookings are allowed
 * - percentage: Current capacity utilization percentage
 *
 * The query automatically refetches every 30 seconds to keep data fresh.
 *
 * @param date - The date to check session limit for (determines which week)
 * @returns React Query result with session limit data
 *
 * @example
 * function BookingForm() {
 *   const { data: limit, isLoading } = useStudioSessionLimit(new Date());
 *
 *   if (limit?.can_book === false) {
 *     return <Alert>Studio at capacity</Alert>;
 *   }
 *
 *   return <BookingForm />;
 * }
 */
export function useStudioSessionLimit(date: Date) {
  const weekRange = getWeekRange(date);

  return useQuery({
    queryKey: ["studio-session-limit", weekRange.start, weekRange.end],
    queryFn: () => checkStudioSessionLimit(date),
    staleTime: 30000, // Revalidate every 30 seconds
  });
}
