import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SessionAvailabilityCheck } from "../lib/types";
import { useCallback } from "react";

// Query keys for trainer availability
export const TRAINER_AVAILABILITY_KEYS = {
  all: ["trainer-availability"] as const,
  checks: () => [...TRAINER_AVAILABILITY_KEYS.all, "check"] as const,
  check: (params: {
    trainer_id: string;
    start_time: string;
    end_time: string;
    exclude_session_id?: string;
  }) => [...TRAINER_AVAILABILITY_KEYS.checks(), params] as const,
};

// Check trainer availability for a specific time slot
export const useTrainerAvailability = ({
  trainer_id,
  start_time,
  end_time,
  exclude_session_id,
  enabled = true,
}: {
  trainer_id: string;
  start_time: string;
  end_time: string;
  exclude_session_id?: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: TRAINER_AVAILABILITY_KEYS.check({
      trainer_id,
      start_time,
      end_time,
      exclude_session_id,
    }),
    queryFn: async (): Promise<SessionAvailabilityCheck> => {
      try {
        // Call the database function to check availability
        const { data, error } = await supabase.rpc(
          "check_trainer_availability",
          {
            p_trainer_id: trainer_id,
            p_start_time: start_time,
            p_end_time: end_time,
            p_exclude_session_id: exclude_session_id || null,
          }
        );

        if (error) {
          console.error("Error checking trainer availability:", error);
          // Return a basic availability check if the function fails
          // This allows the UI to continue working even if the advanced checking fails
          return {
            available: true,
            conflicts: [],
            message: "Unable to verify availability - please check manually",
          };
        }

        return data as SessionAvailabilityCheck;
      } catch (err) {
        console.error("Error in trainer availability check:", err);
        // Fallback: perform basic availability check
        return await performBasicAvailabilityCheck({
          trainer_id,
          start_time,
          end_time,
          exclude_session_id,
        });
      }
    },
    enabled: enabled && !!trainer_id && !!start_time && !!end_time,
    staleTime: 30 * 1000, // 30 seconds - availability can change quickly
    cacheTime: 5 * 60 * 1000, // 5 minutes - keep cached for reasonable time
    refetchOnWindowFocus: true,
    // Retry failed requests up to 2 times with exponential backoff
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      return !error?.message?.includes("network") && failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Fallback function for basic availability checking
const performBasicAvailabilityCheck = async ({
  trainer_id,
  start_time,
  end_time,
  exclude_session_id,
}: {
  trainer_id: string;
  start_time: string;
  end_time: string;
  exclude_session_id?: string;
}): Promise<SessionAvailabilityCheck> => {
  try {
    // Query for conflicting training sessions
    let query = supabase
      .from("training_sessions")
      .select("*")
      .eq("trainer_id", trainer_id)
      .neq("status", "cancelled")
      .or(`and(scheduled_start.lt.${end_time},scheduled_end.gt.${start_time})`);

    // Exclude current session if editing
    if (exclude_session_id) {
      query = query.neq("id", exclude_session_id);
    }

    const { data: conflictingSessions, error } = await query;

    if (error) {
      throw error;
    }

    const hasConflicts = conflictingSessions && conflictingSessions.length > 0;

    return {
      available: !hasConflicts,
      conflicts: conflictingSessions || [],
      message: hasConflicts
        ? `Trainer has ${conflictingSessions.length} conflicting session(s) during this time`
        : "Trainer is available",
    };
  } catch (error) {
    console.error("Error in basic availability check:", error);
    return {
      available: true,
      conflicts: [],
      message: "Unable to verify availability - please check manually",
    };
  }
};

// Hook to get all trainer availability for a specific day
export const useTrainerDayAvailability = ({
  trainer_id,
  date,
  enabled = true,
}: {
  trainer_id: string;
  date: string; // YYYY-MM-DD format
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [...TRAINER_AVAILABILITY_KEYS.all, "day", trainer_id, date],
    queryFn: async () => {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("trainer_id", trainer_id)
        .neq("status", "cancelled")
        .gte("scheduled_start", startOfDay)
        .lte("scheduled_end", endOfDay)
        .order("scheduled_start", { ascending: true });

      if (error) {
        throw new Error(
          `Failed to fetch trainer day schedule: ${error.message}`
        );
      }

      return data || [];
    },
    enabled: enabled && !!trainer_id && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes - day schedule is relatively stable
    cacheTime: 15 * 60 * 1000, // 15 minutes - longer cache for day schedules
    // Use background refetch to keep data fresh without showing loading states
    refetchOnWindowFocus: false,
    refetchInterval: 10 * 60 * 1000, // Background refresh every 10 minutes
  });
};

// Hook to check multiple time slots at once (useful for suggesting alternative times)
export const useBulkAvailabilityCheck = ({
  trainer_id,
  time_slots,
  enabled = true,
}: {
  trainer_id: string;
  time_slots: Array<{ start_time: string; end_time: string }>;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [
      ...TRAINER_AVAILABILITY_KEYS.all,
      "bulk",
      trainer_id,
      time_slots,
    ],
    queryFn: async () => {
      const availabilityPromises = time_slots.map((slot) =>
        performBasicAvailabilityCheck({
          trainer_id,
          start_time: slot.start_time,
          end_time: slot.end_time,
        })
      );

      const results = await Promise.all(availabilityPromises);

      return time_slots.map((slot, index) => ({
        ...slot,
        availability: results[index],
      }));
    },
    enabled: enabled && !!trainer_id && time_slots.length > 0,
    staleTime: 60 * 1000, // 1 minute - bulk checks are typically for immediate use
    cacheTime: 3 * 60 * 1000, // 3 minutes - shorter cache for bulk checks
    // Don't retry bulk checks automatically to avoid overwhelming the server
    retry: false,
  });
};

// Hook for managing trainer availability cache
export const useTrainerAvailabilityCache = () => {
  const queryClient = useQueryClient();

  const invalidateTrainerAvailability = useCallback(
    (trainerId?: string) => {
      if (trainerId) {
        // Invalidate specific trainer availability
        queryClient.invalidateQueries({
          queryKey: TRAINER_AVAILABILITY_KEYS.all,
          predicate: (query) => {
            const params = query.queryKey[2] as { trainer_id?: string };
            return params?.trainer_id === trainerId;
          },
        });
      } else {
        // Invalidate all trainer availability
        queryClient.invalidateQueries({
          queryKey: TRAINER_AVAILABILITY_KEYS.all,
        });
      }
    },
    [queryClient]
  );

  const prefetchTrainerAvailability = useCallback(
    async ({
      trainer_id,
      start_time,
      end_time,
      exclude_session_id,
    }: {
      trainer_id: string;
      start_time: string;
      end_time: string;
      exclude_session_id?: string;
    }) => {
      await queryClient.prefetchQuery({
        queryKey: TRAINER_AVAILABILITY_KEYS.check({
          trainer_id,
          start_time,
          end_time,
          exclude_session_id,
        }),
        queryFn: async (): Promise<SessionAvailabilityCheck> => {
          try {
            const { data, error } = await supabase.rpc(
              "check_trainer_availability",
              {
                p_trainer_id: trainer_id,
                p_start_time: start_time,
                p_end_time: end_time,
                p_exclude_session_id: exclude_session_id || null,
              }
            );

            if (error) {
              return await performBasicAvailabilityCheck({
                trainer_id,
                start_time,
                end_time,
                exclude_session_id,
              });
            }

            return data as SessionAvailabilityCheck;
          } catch {
            return await performBasicAvailabilityCheck({
              trainer_id,
              start_time,
              end_time,
              exclude_session_id,
            });
          }
        },
        staleTime: 30 * 1000,
      });
    },
    [queryClient]
  );

  const clearTrainerAvailabilityCache = useCallback(
    (trainerId?: string) => {
      if (trainerId) {
        queryClient.removeQueries({
          queryKey: TRAINER_AVAILABILITY_KEYS.all,
          predicate: (query) => {
            const params = query.queryKey[2] as { trainer_id?: string };
            return params?.trainer_id === trainerId;
          },
        });
      } else {
        queryClient.removeQueries({
          queryKey: TRAINER_AVAILABILITY_KEYS.all,
        });
      }
    },
    [queryClient]
  );

  // Optimistically update availability when a session is created/updated/deleted
  const optimisticallyUpdateAvailability = useCallback(
    ({
      trainer_id,
      start_time,
      end_time,
      action: _action, // eslint-disable-line @typescript-eslint/no-unused-vars
    }: {
      trainer_id: string;
      start_time: string;
      end_time: string;
      action: "create" | "update" | "delete";
    }) => {
      // Invalidate all overlapping availability checks for this trainer
      queryClient.invalidateQueries({
        queryKey: TRAINER_AVAILABILITY_KEYS.all,
        predicate: (query) => {
          const params = query.queryKey[2] as {
            trainer_id?: string;
            start_time?: string;
            end_time?: string;
          };
          if (!params || params.trainer_id !== trainer_id) return false;

          // Check if the time ranges overlap
          if (!params.start_time || !params.end_time) return false;
          const queryStart = new Date(params.start_time).getTime();
          const queryEnd = new Date(params.end_time).getTime();
          const sessionStart = new Date(start_time).getTime();
          const sessionEnd = new Date(end_time).getTime();

          return queryStart < sessionEnd && queryEnd > sessionStart;
        },
      });
    },
    [queryClient]
  );

  return {
    invalidateTrainerAvailability,
    prefetchTrainerAvailability,
    clearTrainerAvailabilityCache,
    optimisticallyUpdateAvailability,
  };
};
