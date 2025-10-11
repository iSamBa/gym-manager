import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Machine } from "../lib/types";
import { TRAINING_SESSIONS_KEYS } from "./use-training-sessions";

// Query keys for machines
export const MACHINES_KEYS = {
  all: ["machines"] as const,
  lists: () => [...MACHINES_KEYS.all, "list"] as const,
  list: (filters?: { available_only?: boolean }) =>
    [...MACHINES_KEYS.lists(), filters] as const,
};

/**
 * Fetch all machines with optional filtering
 * @param filters - Optional filters (available_only)
 * @returns React Query result with machines data
 */
export function useMachines(filters?: { available_only?: boolean }) {
  return useQuery({
    queryKey: MACHINES_KEYS.list(filters),
    queryFn: async () => {
      let query = supabase
        .from("machines")
        .select("*")
        .order("machine_number", { ascending: true });

      if (filters?.available_only) {
        query = query.eq("is_available", true);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch machines: ${error.message}`);
      }

      return data as Machine[];
    },
  });
}

/**
 * Update machine availability (admin only)
 * Includes optimistic updates and invalidates related queries
 * @returns React Query mutation result
 */
export function useUpdateMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { is_available: boolean };
    }) => {
      const { data: result, error } = await supabase
        .from("machines")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update machine: ${error.message}`);
      }

      return result as Machine;
    },
    onSuccess: () => {
      // Invalidate machines queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: MACHINES_KEYS.all });

      // Invalidate training sessions queries since machine availability affects session display
      queryClient.invalidateQueries({ queryKey: TRAINING_SESSIONS_KEYS.all });
    },
  });
}
