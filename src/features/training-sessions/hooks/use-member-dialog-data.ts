import { useQuery } from "@tanstack/react-query";
import { useMember } from "@/features/members/hooks/use-members";
import { useActiveSubscription } from "@/features/memberships/hooks/use-subscriptions";
import { supabase } from "@/lib/supabase";

/**
 * Session statistics for a member
 * Uses same logic as members table for consistency
 */
export interface MemberSessionStats {
  /** Number of completed sessions (past sessions with status=completed) */
  done: number;
  /** Number of scheduled/upcoming sessions (future sessions with confirmed/waitlisted booking) */
  scheduled: number;
}

/**
 * Member information needed for the dialog
 */
export interface MemberDialogInfo {
  phone?: string;
  first_name?: string;
  last_name?: string;
  uniform_size?: string;
  vest_size?: string;
  hip_belt_size?: string;
}

/**
 * Complete data needed for the Member Details tab in SessionDialog
 */
export interface MemberDialogData {
  member: MemberDialogInfo;
  sessionStats: MemberSessionStats;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch all data needed for the Member Details tab
 *
 * Fetches:
 * 1. Member details (phone, name, equipment sizes)
 * 2. Current active subscription
 * 3. Completed sessions count (past sessions with status=completed)
 * 4. Scheduled sessions count (future sessions with confirmed/waitlisted booking)
 *
 * Note: Uses same session counting logic as members table RPC function
 * (time-based + status-based filtering) for consistency across the app.
 *
 * @param memberId - The member's ID
 * @returns Member data, session stats, loading state, and error
 */
export function useMemberDialogData(
  memberId: string | undefined
): MemberDialogData {
  // 1. Fetch member details
  const {
    data: member,
    isLoading: memberLoading,
    error: memberError,
  } = useMember(memberId || "");

  // 2. Fetch active subscription (for remaining sessions display)
  const { isLoading: subscriptionLoading, error: subscriptionError } =
    useActiveSubscription(memberId || "");

  // 3. Query completed sessions (same logic as members table RPC)
  const {
    data: completedSessions,
    isLoading: completedLoading,
    error: completedError,
  } = useQuery({
    queryKey: ["member-completed-sessions", memberId],
    queryFn: async () => {
      if (!memberId) {
        return [];
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("training_session_members")
        .select(
          "session_id, training_sessions!inner(id, status, scheduled_start)"
        )
        .eq("member_id", memberId)
        .eq("booking_status", "confirmed")
        .eq("training_sessions.status", "completed")
        .lt("training_sessions.scheduled_start", now);

      if (error) {
        throw new Error(`Failed to fetch completed sessions: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!memberId,
    staleTime: 1 * 60 * 1000, // 1 minute - session counts change frequently
  });

  // 4. Query scheduled sessions (same logic as members table RPC)
  const {
    data: scheduledSessions,
    isLoading: scheduledLoading,
    error: scheduledError,
  } = useQuery({
    queryKey: ["member-scheduled-sessions", memberId],
    queryFn: async () => {
      if (!memberId) {
        return [];
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("training_session_members")
        .select(
          "session_id, training_sessions!inner(id, status, scheduled_start)"
        )
        .eq("member_id", memberId)
        .in("booking_status", ["confirmed", "waitlisted"])
        .in("training_sessions.status", ["scheduled", "in_progress"])
        .gte("training_sessions.scheduled_start", now);

      if (error) {
        throw new Error(`Failed to fetch scheduled sessions: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!memberId,
    staleTime: 1 * 60 * 1000, // 1 minute - session counts change frequently
  });

  // Combine loading states
  const isLoading =
    memberLoading ||
    subscriptionLoading ||
    completedLoading ||
    scheduledLoading;

  // Combine errors (prioritize member error as it's most critical)
  const error =
    memberError ||
    subscriptionError ||
    completedError ||
    scheduledError ||
    null;

  return {
    member: {
      phone: member?.phone,
      first_name: member?.first_name,
      last_name: member?.last_name,
      uniform_size: member?.uniform_size,
      vest_size: member?.vest_size,
      hip_belt_size: member?.hip_belt_size,
    },
    sessionStats: {
      done: completedSessions?.length || 0,
      scheduled: scheduledSessions?.length || 0,
    },
    isLoading,
    error: error as Error | null,
  };
}
