import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { trainingSessionUtils } from "../lib/database-utils";
import { subscriptionKeys } from "@/features/memberships/hooks/use-subscriptions";
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

      if (filters?.date_range) {
        query = query
          .gte("scheduled_start", filters.date_range.start.toISOString())
          .lte("scheduled_end", filters.date_range.end.toISOString());
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
      const { data, error } = await supabase
        .from("training_sessions_calendar")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch training session: ${error.message}`);
      }

      return data as TrainingSession;
    },
    enabled: !!id,
  });
};

// Create training session mutation
export const useCreateTrainingSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSessionData) => {
      // Call Supabase function to create session with members
      const { data: result, error } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: data.machine_id,
          p_trainer_id: data.trainer_id || null,
          p_scheduled_start: data.scheduled_start,
          p_scheduled_end: data.scheduled_end,
          p_member_id: data.member_id,
          p_session_type: data.session_type,
          p_notes: data.notes || null,
        }
      );

      if (error) {
        console.error("Database function error:", error);
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
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: TRAINING_SESSIONS_KEYS.all });
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
    onSuccess: (data) => {
      // Update specific session in cache
      queryClient.setQueryData(TRAINING_SESSIONS_KEYS.detail(data.id), data);
      // Invalidate lists to refresh data
      queryClient.invalidateQueries({
        queryKey: TRAINING_SESSIONS_KEYS.lists(),
      });
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
          updated_at: new Date().toISOString(),
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
      console.error("Failed to update training session status:", error);
    },

    onSettled: async (data, error, { id, status }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: TRAINING_SESSIONS_KEYS.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: TRAINING_SESSIONS_KEYS.lists(),
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
            // Invalidate subscription queries for all members in this session
            sessionData.forEach(({ member_id }) => {
              queryClient.invalidateQueries({
                queryKey: subscriptionKeys.memberActive(member_id),
              });
              queryClient.invalidateQueries({
                queryKey: subscriptionKeys.memberHistory(member_id),
              });
            });
          }

          // Also invalidate the all-subscriptions query used by the subscriptions management page
          // This ensures real-time updates of session counts across all views
          queryClient.invalidateQueries({
            queryKey: ["all-subscriptions"],
          });
        } catch (error) {
          console.warn(
            "Failed to invalidate subscription cache after session completion:",
            error
          );
        }
      }
    },
  });
};

// Delete training session mutation
export const useDeleteTrainingSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_sessions")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(`Failed to delete training session: ${error.message}`);
      }
    },
    onSuccess: () => {
      // Invalidate all training session queries
      queryClient.invalidateQueries({ queryKey: TRAINING_SESSIONS_KEYS.all });
    },
  });
};
