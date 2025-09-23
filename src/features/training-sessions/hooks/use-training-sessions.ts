import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  TrainingSession,
  CreateSessionData,
  UpdateSessionData,
  SessionFilters,
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
        .order("scheduled_start", { ascending: true });

      // Apply filters (simplified)
      if (filters?.trainer_id) {
        query = query.eq("trainer_id", filters.trainer_id);
      }

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.location) {
        query = query.ilike("location", `%${filters.location}%`);
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

      return data as TrainingSession[];
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
          p_trainer_id: data.trainer_id,
          p_scheduled_start: data.scheduled_start,
          p_scheduled_end: data.scheduled_end,
          p_location: data.location,
          p_max_participants: data.max_participants,
          p_member_ids: data.member_ids,
          p_notes: data.notes || null,
          p_session_type: data.session_type,
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
      const { data: result, error } = await supabase
        .from("training_sessions")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update training session: ${error.message}`);
      }

      return result;
    },
    onSuccess: (data) => {
      // Update specific session in cache
      queryClient.setQueryData(TRAINING_SESSIONS_KEYS.detail(data.id), data);
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: TRAINING_SESSIONS_KEYS.lists(),
      });
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
