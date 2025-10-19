/**
 * Auto-Inactivation React Hooks
 * Hooks for managing automatic member inactivation
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  runAutoInactivation,
  getInactivationCandidates,
  reactivateMember,
} from "../lib/auto-inactivation-utils";

/**
 * Hook to fetch members who would be inactivated (dry-run preview)
 * @returns Query result with list of inactivation candidates
 */
export function useInactivationCandidates() {
  return useQuery({
    queryKey: ["inactivation-candidates"],
    queryFn: getInactivationCandidates,
  });
}

/**
 * Hook to run auto-inactivation process
 * Invalidates members and candidates queries on success
 * @returns Mutation object with mutateAsync function
 */
export function useRunAutoInactivation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runAutoInactivation,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["inactivation-candidates"] });
      toast.success(`${result.inactivated_count} members marked as inactive`);
    },
    onError: (error: Error) => {
      toast.error("Failed to run auto-inactivation: " + error.message);
    },
  });
}

/**
 * Hook to manually reactivate a member
 * Invalidates members and comments queries on success
 * @returns Mutation object with mutateAsync function
 */
export function useReactivateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      adminName,
    }: {
      memberId: string;
      adminName: string;
    }) => reactivateMember(memberId, adminName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member-comments"] });
      toast.success("Member reactivated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to reactivate member: " + error.message);
    },
  });
}
