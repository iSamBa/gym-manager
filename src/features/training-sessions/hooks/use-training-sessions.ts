import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { getUserFriendlyErrorMessage } from "@/lib/error-messages";
import { toast } from "sonner";
import { trainingSessionUtils } from "../lib/database-utils";
import { subscriptionKeys } from "@/features/memberships/hooks/use-subscriptions";
import { subscriptionUtils } from "@/features/memberships/lib/subscription-utils";
import { memberKeys, useMember } from "@/features/members/hooks/use-members";
import { useActiveSubscription } from "@/features/memberships/hooks/use-subscriptions";
import {
  mapSessionRpcResponse,
  type RpcSessionResponse,
} from "../lib/rpc-mappers";
import {
  getLocalDateString,
  formatTimestampForDatabase,
  formatForDatabase,
} from "@/lib/date-utils";
import type {
  TrainingSession,
  CreateSessionData,
  UpdateSessionData,
  SessionFilters,
  SessionParticipant,
} from "../lib/types";

// Query keys
export const TRAINING_SESSIONS_KEYS = {
  all: ["training-sessions"] as const,
  lists: () => [...TRAINING_SESSIONS_KEYS.all, "list"] as const,
  list: (filters: SessionFilters) =>
    [...TRAINING_SESSIONS_KEYS.lists(), filters] as const,
  details: () => [...TRAINING_SESSIONS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...TRAINING_SESSIONS_KEYS.details(), id] as const,
  calendar: (start: string, end: string) =>
    [...TRAINING_SESSIONS_KEYS.all, "calendar", start, end] as const,
};

// Fetch training sessions with filters
export const useTrainingSessions = (filters?: SessionFilters) => {
  return useQuery({
    queryKey: TRAINING_SESSIONS_KEYS.list(filters || {}),
    queryFn: async () => {
      // If date_range is provided, use the planning indicators function
      // This includes planning data (subscription_end_date, latest_payment_date, etc.)
      if (filters?.date_range) {
        const { data, error } = await supabase.rpc(
          "get_sessions_with_planning_indicators",
          {
            p_start_date: getLocalDateString(filters.date_range.start),
            p_end_date: getLocalDateString(filters.date_range.end),
          }
        );

        if (error) {
          throw new Error(
            `Failed to fetch training sessions: ${error.message}`
          );
        }

        // Map RPC response (session_id → id) using centralized utility
        let sessions = mapSessionRpcResponse<TrainingSession>(
          (data || []) as RpcSessionResponse<TrainingSession>[]
        );

        // Apply additional filters
        if (filters.trainer_id) {
          sessions = sessions.filter(
            (s) => s.trainer_id === filters.trainer_id
          );
        }

        if (filters.status && filters.status !== "all") {
          sessions = sessions.filter((s) => s.status === filters.status);
        }

        if (filters.machine_id) {
          sessions = sessions.filter(
            (s) => s.machine_id === filters.machine_id
          );
        }

        if (filters.member_id) {
          sessions = sessions.filter((s) => s.member_id === filters.member_id);
        }

        return sessions;
      }

      // Fallback to view for non-date-range queries
      let query = supabase
        .from("training_sessions_calendar")
        .select("*")
        .order("scheduled_start", { ascending: false });

      // Apply filters (simplified)
      if (filters?.trainer_id) {
        query = query.eq("trainer_id", filters.trainer_id);
      }

      // Note: member_id filtering removed as training_sessions_calendar view doesn't have member_id column
      // Member filtering should be done by checking the participants array after fetching

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.machine_id) {
        query = query.eq("machine_id", filters.machine_id);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch training sessions: ${error.message}`);
      }

      let sessions = data as TrainingSession[];

      // Filter by member_id if specified (check participants array)
      if (filters?.member_id && sessions) {
        sessions = sessions.filter((session) => {
          const participants = session.participants as SessionParticipant[];
          return participants?.some((p) => p.id === filters.member_id);
        });
      }

      return sessions;
    },
  });
};

// Fetch single training session
export const useTrainingSession = (id: string) => {
  return useQuery({
    queryKey: TRAINING_SESSIONS_KEYS.detail(id),
    queryFn: async () => {
      // First, get the session to find its scheduled_start date
      const { data: session, error: sessionError } = await supabase
        .from("training_sessions_calendar")
        .select("*")
        .eq("id", id)
        .single();

      if (sessionError) {
        throw new Error(
          `Failed to fetch training session: ${sessionError.message}`
        );
      }

      if (!session) {
        throw new Error("Session not found");
      }

      // Get planning indicators using RPC function
      // Use a date range around the session's scheduled_start (±7 days to be safe)
      const sessionDate = new Date(session.scheduled_start);
      const startDate = new Date(sessionDate);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(sessionDate);
      endDate.setDate(endDate.getDate() + 7);

      const { data: sessionsWithIndicators, error: rpcError } =
        await supabase.rpc("get_sessions_with_planning_indicators", {
          p_start_date: getLocalDateString(startDate),
          p_end_date: getLocalDateString(endDate),
        });

      if (rpcError) {
        logger.error(
          "Failed to fetch planning indicators, returning basic session",
          { error: rpcError }
        );
        // Return basic session data if RPC fails
        return session as TrainingSession;
      }

      // Map RPC response and find our session
      const mappedSessions = mapSessionRpcResponse<TrainingSession>(
        (sessionsWithIndicators || []) as RpcSessionResponse<TrainingSession>[]
      );

      const sessionWithIndicators = mappedSessions.find((s) => s.id === id);

      // Return session with indicators if found, otherwise return basic session
      return (sessionWithIndicators || session) as TrainingSession;
    },
    enabled: !!id,
  });
};

// Create training session mutation
export const useCreateTrainingSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSessionData) => {
      let memberId = data.member_id;

      // TRIAL SESSION: Create member first
      if (data.session_type === "trial") {
        // 1. Check if member already exists
        const { data: existing } = await supabase
          .from("members")
          .select("id, member_type")
          .eq("email", data.new_member_email!)
          .maybeSingle();

        if (existing) {
          // Check if this is a trial member with no sessions (orphaned)
          const { data: sessions } = await supabase
            .from("training_session_members")
            .select("id")
            .eq("member_id", existing.id)
            .limit(1);

          if (sessions && sessions.length > 0) {
            // Member has sessions - cannot reuse
            throw new Error(
              "This email is already registered. Please use a different email."
            );
          }

          // Orphaned trial member - reuse it
          memberId = existing.id;
        }

        // 2. Create trial member only if not reusing orphaned member
        if (!memberId) {
          const memberData = {
            first_name: data.new_member_first_name,
            last_name: data.new_member_last_name,
            phone: data.new_member_phone,
            email: data.new_member_email,
            gender: data.new_member_gender,
            referral_source: data.new_member_referral_source,
            member_type: "trial" as const,
            status: "pending" as const,
            join_date: formatForDatabase(new Date()),
            preferred_contact_method: "email" as const,
            marketing_consent: false,
            waiver_signed: false,
            uniform_size: "M" as const,
            vest_size: "V2" as const,
            hip_belt_size: "V1" as const,
            uniform_received: false,
          };

          const { data: newMember, error: memberError } = await supabase
            .from("members")
            .insert(memberData)
            .select()
            .single();

          if (memberError) {
            throw new Error(
              `Failed to create trial member: ${memberError.message}`
            );
          }

          if (!newMember) {
            throw new Error("Member created but no data returned");
          }

          memberId = newMember.id;
        }
      }

      // MEMBER & MAKEUP SESSIONS: Validate active subscription exists
      // Both consume credits, but makeup bypasses weekly limits
      // Contractual sessions do NOT require a subscription (contract signed during session)
      if (
        (data.session_type === "member" || data.session_type === "makeup") &&
        memberId
      ) {
        const activeSubscription =
          await subscriptionUtils.getMemberActiveSubscription(memberId);

        if (!activeSubscription) {
          throw new Error(
            "This member does not have an active subscription. Please create a subscription before booking a member session, or use a contractual session type to sign a contract during the session."
          );
        }

        // Validate subscription has remaining sessions
        const remainingSessions =
          activeSubscription.total_sessions_snapshot -
          activeSubscription.used_sessions;

        if (remainingSessions <= 0) {
          throw new Error(
            "This member has no remaining sessions in their subscription. Please upgrade or renew their subscription before booking."
          );
        }
      }

      // Determine if this is a guest session (no member association)
      // Only multi_site sessions are true guest sessions (external gym members)
      // Collaboration sessions CAN have member associations (collaboration members from our gym)
      const isGuestSession = data.session_type === "multi_site";

      // For guest sessions, pass empty member_ids array
      // For collaboration sessions, pass member_id if provided (collaboration member)
      const memberIds = isGuestSession ? [] : memberId ? [memberId] : [];

      // Call Supabase function to create session with members
      const { data: result, error } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: data.machine_id,
          p_trainer_id: data.trainer_id || null,
          p_scheduled_start: data.scheduled_start,
          p_scheduled_end: data.scheduled_end,
          p_member_ids: memberIds,
          p_session_type: data.session_type,
          p_notes: data.notes || null,
          // Guest fields (only populated for multi_site guest sessions)
          // Collaboration sessions use member_ids with collaboration members
          p_guest_first_name: data.guest_first_name || null,
          p_guest_last_name: data.guest_last_name || null,
          p_guest_gym_name: data.guest_gym_name || null,
        }
      );

      if (error) {
        logger.error("Database function error", { error });
        throw new Error(`Failed to create training session: ${error.message}`);
      }

      // Check if the function returned an error in the result
      if (
        result &&
        typeof result === "object" &&
        "success" in result &&
        !result.success
      ) {
        throw new Error(result.error || "Failed to create training session");
      }

      return result;
    },
    onSuccess: async (_result, variables) => {
      // Consume session from member's active subscription (for MEMBER and MAKEUP sessions)
      // Both member and makeup sessions consume credits, but makeup bypasses weekly limits
      // Skip for:
      // - Trial sessions: no subscription yet
      // - Contractual sessions: counted retroactively when subscription created
      // - Guest sessions: no member association
      if (
        variables.member_id &&
        (variables.session_type === "member" ||
          variables.session_type === "makeup") // Consume for member and makeup sessions
      ) {
        try {
          const subscription =
            await subscriptionUtils.getMemberActiveSubscription(
              variables.member_id
            );

          if (subscription) {
            await subscriptionUtils.consumeSession(subscription.id);

            // Refetch subscription queries for immediate cache updates
            await queryClient.refetchQueries({
              queryKey: ["subscriptions", "member", variables.member_id],
              type: "active",
            });
            await queryClient.refetchQueries({
              queryKey: subscriptionKeys.memberActive(variables.member_id),
              type: "active",
            });
          }
        } catch (error) {
          // Log error but don't fail the whole operation
          logger.error("Failed to consume session", { error });
        }
      }

      // ALWAYS refetch queries to ensure calendar updates immediately for ALL session types
      // This is critical for trial sessions, member sessions, and guest sessions
      await queryClient.refetchQueries({
        queryKey: TRAINING_SESSIONS_KEYS.all,
        type: "active", // Only refetch currently mounted/active queries
      });

      // Refetch daily statistics for real-time tab updates
      await queryClient.refetchQueries({
        queryKey: ["daily-statistics"],
        type: "active",
      });

      // Refetch members table to update scheduled_sessions_count
      await queryClient.refetchQueries({
        queryKey: memberKeys.all,
        type: "active",
      });
    },
    onError: (error) => {
      const message = getUserFriendlyErrorMessage(error, {
        operation: "create",
        resource: "training session",
      });

      logger.error("Failed to create training session", {
        error: error instanceof Error ? error.message : String(error),
      });

      toast.error(message);
    },
  });
};

// Update training session mutation
export const useUpdateTrainingSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSessionData;
    }) => {
      // Check authentication
      const {
        data: { session },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        error: authError,
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      // Separate member_id from other update data
      const { member_id, ...sessionData } = data;

      // Update session data if there are fields to update
      let result = null;
      if (Object.keys(sessionData).length > 0) {
        const { data: updateResult, error: sessionError } = await supabase
          .from("training_sessions")
          .update(sessionData)
          .eq("id", id)
          .select()
          .maybeSingle();

        if (sessionError) {
          throw new Error(
            `Failed to update training session: ${sessionError.message}`
          );
        }

        if (!updateResult) {
          throw new Error(
            "Training session update was blocked. You may not have permission to update this session."
          );
        }

        result = updateResult;
      }

      // Handle member updates ONLY if member_id is provided
      // Sessions now support only one member at a time
      if (member_id !== undefined) {
        // Get current confirmed members
        const { data: currentMembers, error: currentMembersError } =
          await supabase
            .from("training_session_members")
            .select("member_id")
            .eq("session_id", id)
            .eq("booking_status", "confirmed");

        if (currentMembersError) {
          throw new Error(
            `Failed to get current members: ${currentMembersError.message}`
          );
        }

        const currentMemberId = currentMembers?.[0]?.member_id;

        // Only update if the member has changed
        if (currentMemberId !== member_id) {
          // Remove existing member if there is one
          if (currentMemberId) {
            const { error: removeError } = await supabase
              .from("training_session_members")
              .delete()
              .eq("session_id", id)
              .eq("member_id", currentMemberId)
              .eq("booking_status", "confirmed");

            if (removeError) {
              throw new Error(
                `Failed to remove member: ${removeError.message}`
              );
            }
          }

          // Add new member
          const { error: addError } = await supabase
            .from("training_session_members")
            .upsert(
              {
                session_id: id,
                member_id: member_id,
                booking_status: "confirmed" as const,
              },
              {
                onConflict: "session_id,member_id",
              }
            );

          if (addError) {
            throw new Error(`Failed to add member: ${addError.message}`);
          }
        }
      }

      // If we didn't update session data, fetch it for the result
      if (!result) {
        const { data: fetchResult, error: fetchError } = await supabase
          .from("training_sessions")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (fetchError) {
          throw new Error(
            `Failed to fetch updated session: ${fetchError.message}`
          );
        }

        if (!fetchResult) {
          throw new Error("Training session not found or access denied");
        }

        result = fetchResult;
      }

      return result;
    },
    onSuccess: async (data) => {
      // Refetch detail query to get updated data with participants and machine info
      await queryClient.refetchQueries({
        queryKey: TRAINING_SESSIONS_KEYS.detail(data.id),
        type: "active",
      });
      // Refetch lists to refresh calendar data
      await queryClient.refetchQueries({
        queryKey: TRAINING_SESSIONS_KEYS.lists(),
        type: "active",
      });
      // Refetch daily statistics for real-time updates
      await queryClient.refetchQueries({
        queryKey: ["daily-statistics"],
        type: "active",
      });
    },
    onError: (error) => {
      const message = getUserFriendlyErrorMessage(error, {
        operation: "update",
        resource: "training session",
      });

      logger.error("Failed to update training session", {
        error: error instanceof Error ? error.message : String(error),
      });

      toast.error(message);
    },
  });
};

// Update training session status mutation - follows exact same pattern as member status update
export const useUpdateTrainingSessionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: TrainingSession["status"];
    }) => trainingSessionUtils.updateTrainingSessionStatus(id, status),

    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: TRAINING_SESSIONS_KEYS.detail(id),
      });

      // Snapshot previous value
      const previousSession = queryClient.getQueryData<TrainingSession>(
        TRAINING_SESSIONS_KEYS.detail(id)
      );

      // Optimistically update individual session
      if (previousSession) {
        queryClient.setQueryData(TRAINING_SESSIONS_KEYS.detail(id), {
          ...previousSession,
          status,
          updated_at: formatTimestampForDatabase(),
        });
      }

      // Update in all session lists (handle both regular arrays and infinite query structures)
      queryClient.setQueriesData(
        { queryKey: TRAINING_SESSIONS_KEYS.lists() },
        (
          oldData:
            | TrainingSession[]
            | { pages: TrainingSession[][] }
            | undefined
        ) => {
          if (!oldData) return oldData;

          // Handle infinite query structure
          if ("pages" in oldData && Array.isArray(oldData.pages)) {
            return {
              ...oldData,
              pages: oldData.pages.map((page) =>
                page.map((session) =>
                  session.id === id ? { ...session, status } : session
                )
              ),
            };
          }

          // Handle regular array structure
          if (Array.isArray(oldData)) {
            return oldData.map((session) =>
              session.id === id ? { ...session, status } : session
            );
          }

          // Return unchanged if unknown structure
          return oldData;
        }
      );

      return { previousSession };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousSession) {
        queryClient.setQueryData(
          TRAINING_SESSIONS_KEYS.detail(id),
          context.previousSession
        );
      }
      logger.error("Failed to update training session status", { error });
    },

    onSettled: async (data, error, { id, status }) => {
      // Refetch to ensure consistency and immediate UI updates
      await queryClient.refetchQueries({
        queryKey: TRAINING_SESSIONS_KEYS.detail(id),
        type: "active",
      });
      await queryClient.refetchQueries({
        queryKey: TRAINING_SESSIONS_KEYS.lists(),
        type: "active",
      });

      // Refetch daily statistics for real-time updates
      await queryClient.refetchQueries({
        queryKey: ["daily-statistics"],
        type: "active",
      });

      // When a session is completed, invalidate subscription queries as remaining_sessions may have changed
      if (status === "completed") {
        // Get session details to find which member(s) need subscription cache invalidation
        try {
          const { data: sessionData } = await supabase
            .from("training_session_members")
            .select("member_id")
            .eq("session_id", id)
            .eq("booking_status", "confirmed");

          if (sessionData) {
            // Refetch subscription queries for all members in this session
            for (const { member_id } of sessionData) {
              await queryClient.refetchQueries({
                queryKey: subscriptionKeys.memberActive(member_id),
                type: "active",
              });
              await queryClient.refetchQueries({
                queryKey: subscriptionKeys.memberHistory(member_id),
                type: "active",
              });
            }
          }

          // Also refetch the all-subscriptions query used by the subscriptions management page
          // This ensures real-time updates of session counts across all views
          await queryClient.refetchQueries({
            queryKey: ["all-subscriptions"],
            type: "active",
          });
        } catch (error) {
          logger.warn(
            "Failed to invalidate subscription cache after session completion",
            { error }
          );
        }
      }
    },
  });
};

// Delete training session mutation
// Delete/Cancel training session mutation
export const useDeleteTrainingSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get session details from base table (more reliable than view)
      const { data: session, error: fetchError } = await supabase
        .from("training_sessions")
        .select("id, session_type, counted_in_subscription_id")
        .eq("id", id)
        .single();

      if (fetchError) {
        throw new Error(
          `Failed to fetch session details: ${fetchError.message}`
        );
      }

      // Get member ID from training_session_members if exists
      const { data: memberData } = await supabase
        .from("training_session_members")
        .select("member_id")
        .eq("session_id", id)
        .eq("booking_status", "confirmed")
        .maybeSingle();

      const memberId = memberData?.member_id;

      // Delete session (cascade will delete training_session_members)
      const { error: deleteError } = await supabase
        .from("training_sessions")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw new Error(
          `Failed to delete training session: ${deleteError.message}`
        );
      }

      return {
        sessionId: id,
        memberId,
        sessionType: session.session_type,
        countedInSubscriptionId: session.counted_in_subscription_id,
      };
    },
    onSuccess: async ({
      sessionId,
      memberId,
      sessionType,
      countedInSubscriptionId,
    }) => {
      // Restore session credit based on session type
      if (memberId) {
        try {
          // For contractual sessions that were counted in a subscription
          if (sessionType === "contractual" && countedInSubscriptionId) {
            // Decrement from the specific subscription it was counted in
            await subscriptionUtils.restoreSession(countedInSubscriptionId);

            // Refetch subscription queries
            await queryClient.refetchQueries({
              queryKey: ["subscriptions", "member", memberId],
              type: "active",
            });
            await queryClient.refetchQueries({
              queryKey: subscriptionKeys.memberActive(memberId),
              type: "active",
            });
          }
          // For member and makeup sessions, restore to active subscription
          else if (sessionType === "member" || sessionType === "makeup") {
            const subscription =
              await subscriptionUtils.getMemberActiveSubscription(memberId);

            if (subscription) {
              await subscriptionUtils.restoreSession(subscription.id);

              // Refetch subscription queries for immediate cache updates
              await queryClient.refetchQueries({
                queryKey: ["subscriptions", "member", memberId],
                type: "active",
              });
              await queryClient.refetchQueries({
                queryKey: subscriptionKeys.memberActive(memberId),
                type: "active",
              });
            }
          }
          // For other session types (trial, multi_site, etc.), no credit restoration needed
        } catch (error) {
          // Log error but don't fail the whole operation
          logger.error("Failed to restore session credit", { error });
        }
      }

      // Refetch all training session queries to update calendar immediately
      await queryClient.refetchQueries({
        queryKey: TRAINING_SESSIONS_KEYS.all,
        type: "active",
      });
      await queryClient.refetchQueries({
        queryKey: TRAINING_SESSIONS_KEYS.detail(sessionId),
        type: "active",
      });

      // Refetch daily statistics for real-time updates
      await queryClient.refetchQueries({
        queryKey: ["daily-statistics"],
        type: "active",
      });

      // Refetch members table to update scheduled_sessions_count
      await queryClient.refetchQueries({
        queryKey: memberKeys.all,
        type: "active",
      });
    },
    onError: (error) => {
      const message = getUserFriendlyErrorMessage(error, {
        operation: "delete",
        resource: "training session",
      });

      logger.error("Failed to delete training session", {
        error: error instanceof Error ? error.message : String(error),
      });

      toast.error(message);
    },
  });
};

// ============================================================================
// MEMBER DIALOG DATA - Consolidated from use-member-dialog-data.ts
// ============================================================================

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

// ============================================================================
// DAILY STATISTICS - Consolidated from use-daily-statistics.ts
// ============================================================================

/**
 * Daily statistics interface
 */
export interface DailyStatistics {
  date: string;
  total: number;
  trial: number;
  member: number;
  contractual: number;
  makeup: number;
  multi_site: number;
  collaboration: number;
  non_bookable: number;
}

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
