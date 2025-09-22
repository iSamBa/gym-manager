import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TrainerWithProfile } from "@/features/database/lib/types";

// Query keys
export const TRAINERS_KEYS = {
  all: ["trainers"] as const,
  lists: () => [...TRAINERS_KEYS.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...TRAINERS_KEYS.lists(), filters] as const,
  details: () => [...TRAINERS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...TRAINERS_KEYS.details(), id] as const,
};

// Fetch all trainers for training session selection
export const useTrainers = () => {
  return useQuery({
    queryKey: TRAINERS_KEYS.list({}),
    queryFn: async () => {
      const { data, error } = await supabase.from("trainers").select(`
          *,
          user_profile:user_profiles(*)
        `);

      if (error) {
        throw new Error(`Failed to fetch trainers: ${error.message}`);
      }

      return data as TrainerWithProfile[];
    },
  });
};

// Fetch single trainer details
export const useTrainer = (id: string) => {
  return useQuery({
    queryKey: TRAINERS_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainers")
        .select(
          `
          *,
          user_profile:user_profiles(*)
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch trainer: ${error.message}`);
      }

      return data as TrainerWithProfile;
    },
    enabled: !!id,
  });
};
