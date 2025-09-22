import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Member } from "@/features/database/lib/types";

// Query keys
export const MEMBERS_KEYS = {
  all: ["members"] as const,
  lists: () => [...MEMBERS_KEYS.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...MEMBERS_KEYS.lists(), filters] as const,
  details: () => [...MEMBERS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...MEMBERS_KEYS.details(), id] as const,
};

// Fetch active members for training session selection
export const useMembers = () => {
  return useQuery({
    queryKey: MEMBERS_KEYS.list({ status: "active" }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("status", "active")
        .order("first_name", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch members: ${error.message}`);
      }

      return data as Member[];
    },
  });
};

// Fetch single member details
export const useMember = (id: string) => {
  return useQuery({
    queryKey: MEMBERS_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch member: ${error.message}`);
      }

      return data as Member;
    },
    enabled: !!id,
  });
};
