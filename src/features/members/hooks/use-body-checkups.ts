/**
 * Body Checkups Hook
 * React hook for managing member body checkup records with React Query
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getBodyCheckups,
  getLatestBodyCheckup,
  createBodyCheckup,
  updateBodyCheckup,
  deleteBodyCheckup,
  getBodyCheckupCount,
} from "../lib/body-checkup-db";
import type { CreateBodyCheckupInput } from "../lib/types";

/**
 * Hook for managing body checkups for a specific member
 * Provides CRUD operations with optimistic updates and error handling
 */
export function useBodyCheckups(memberId: string) {
  const queryClient = useQueryClient();

  // Query for all body checkups
  const {
    data: checkups = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["body-checkups", memberId],
    queryFn: () => getBodyCheckups(memberId),
    enabled: !!memberId,
  });

  // Query for latest checkup
  const { data: latestCheckup } = useQuery({
    queryKey: ["body-checkups", memberId, "latest"],
    queryFn: () => getLatestBodyCheckup(memberId),
    enabled: !!memberId,
  });

  // Query for checkup count
  const { data: checkupCount = 0 } = useQuery({
    queryKey: ["body-checkups", memberId, "count"],
    queryFn: () => getBodyCheckupCount(memberId),
    enabled: !!memberId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createBodyCheckup,
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ["body-checkups", memberId],
      });

      // Invalidate training sessions to update planning indicators (body checkup icon)
      queryClient.invalidateQueries({
        queryKey: ["training-sessions"],
      });

      toast.success("Body checkup added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add body checkup");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateBodyCheckupInput>;
    }) => updateBodyCheckup(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["body-checkups", memberId],
      });
      toast.success("Body checkup updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update body checkup");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteBodyCheckup,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["body-checkups", memberId],
      });
      toast.success("Body checkup deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete body checkup");
    },
  });

  return {
    // Data
    checkups,
    latestCheckup,
    checkupCount,

    // Loading states
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Error
    error,

    // Actions
    createCheckup: createMutation.mutateAsync,
    updateCheckup: (id: string, updates: Partial<CreateBodyCheckupInput>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteCheckup: deleteMutation.mutateAsync,
  };
}
