/**
 * Hook for querying members with active subscriptions but no session bookings
 * in a specified week
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Member } from "@/features/database/lib/types";

export interface MemberWithoutReservation {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | undefined;
  email: string | null;
  remaining_sessions: number;
}

export interface UseMembersWithoutReservationsOptions {
  weekStart: string; // YYYY-MM-DD format
  weekEnd: string; // YYYY-MM-DD format
}

/**
 * Fetch members with active subscriptions but no session bookings
 * in the specified week
 *
 * @param options - Week start and end dates
 * @returns React Query result with members without reservations
 */
export function useMembersWithoutReservations({
  weekStart,
  weekEnd,
}: UseMembersWithoutReservationsOptions) {
  return useQuery({
    queryKey: ["members-without-reservations", weekStart, weekEnd],
    queryFn: async () => {
      // Step 1: Get all members with active status and active subscriptions
      const { data: membersWithActiveSubscriptions, error: membersError } =
        await supabase
          .from("members")
          .select(
            `
            id,
            first_name,
            last_name,
            phone,
            email,
            member_subscriptions!inner(
              id,
              status,
              total_sessions_snapshot,
              used_sessions
            )
          `
          )
          .eq("status", "active")
          .eq("member_subscriptions.status", "active");

      if (membersError) {
        throw new Error(`Failed to fetch members: ${membersError.message}`);
      }

      if (
        !membersWithActiveSubscriptions ||
        membersWithActiveSubscriptions.length === 0
      ) {
        return [];
      }

      // Step 2: Calculate remaining sessions and filter out members with 0 remaining
      type MemberWithSubscription = Member & {
        member_subscriptions: Array<{
          id: string;
          status: string;
          total_sessions_snapshot: number | null;
          used_sessions: number | null;
        }>;
      };

      const membersWithRemainingCredits = (
        membersWithActiveSubscriptions as unknown as MemberWithSubscription[]
      )
        .map((member) => {
          // Calculate remaining sessions from active subscriptions
          const totalRemaining = member.member_subscriptions.reduce(
            (sum, subscription) => {
              const total = subscription.total_sessions_snapshot ?? 0;
              const used = subscription.used_sessions ?? 0;
              return sum + (total - used);
            },
            0
          );

          return {
            ...member,
            remaining_sessions: totalRemaining,
          };
        })
        .filter((member) => member.remaining_sessions > 0);

      if (membersWithRemainingCredits.length === 0) {
        return [];
      }

      // Step 3: Get all member IDs who HAVE bookings in the selected week
      const memberIds = membersWithRemainingCredits.map((m) => m.id);

      const { data: bookingsInWeek, error: bookingsError } = await supabase
        .from("training_session_members")
        .select(
          `
          member_id,
          training_sessions!inner(
            scheduled_start
          )
        `
        )
        .in("member_id", memberIds)
        .gte("training_sessions.scheduled_start", weekStart)
        .lte("training_sessions.scheduled_start", weekEnd);

      if (bookingsError) {
        throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
      }

      // Create a Set of member IDs who have bookings
      const memberIdsWithBookings = new Set(
        (bookingsInWeek || []).map((booking) => booking.member_id)
      );

      // Step 4: Filter out members who have bookings - keep only those WITHOUT bookings
      const membersWithoutBookings: MemberWithoutReservation[] =
        membersWithRemainingCredits
          .filter((member) => !memberIdsWithBookings.has(member.id))
          .map((member) => ({
            id: member.id,
            first_name: member.first_name,
            last_name: member.last_name,
            phone: member.phone,
            email: member.email,
            remaining_sessions: member.remaining_sessions,
          }));

      return membersWithoutBookings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - reasonable for this type of data
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
  });
}
