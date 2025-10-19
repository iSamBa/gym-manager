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
  getLastAutoInactivationRun,
} from "../lib/auto-inactivation-utils";
import { memberKeys } from "./use-members";

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
    onSuccess: async (result) => {
      // Invalidate all member-related queries
      await queryClient.invalidateQueries({ queryKey: memberKeys.all });
      await queryClient.invalidateQueries({
        queryKey: ["inactivation-candidates"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["auto-inactivation-last-run"],
      });

      // Force refetch active member queries to ensure UI updates
      await queryClient.refetchQueries({
        queryKey: memberKeys.all,
        type: "active",
      });

      toast.success(
        `${result.inactivated_count} member${result.inactivated_count !== 1 ? "s" : ""} marked as inactive`
      );
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
    onSuccess: async () => {
      // Invalidate all member-related queries
      await queryClient.invalidateQueries({ queryKey: memberKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["member-comments"] });

      // Force refetch active member queries to ensure UI updates
      await queryClient.refetchQueries({
        queryKey: memberKeys.all,
        type: "active",
      });

      toast.success("Member reactivated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to reactivate member: " + error.message);
    },
  });
}

/**
 * Hook to fetch the last auto-inactivation run information
 * @returns Query result with last run data or null if never run
 */
export function useLastAutoInactivationRun() {
  return useQuery({
    queryKey: ["auto-inactivation-last-run"],
    queryFn: getLastAutoInactivationRun,
  });
}
