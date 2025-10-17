import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchActiveSettings,
  fetchScheduledSettings,
  updateStudioSettings,
} from "../lib/settings-api";

/**
 * Hook for managing studio settings with React Query
 * Provides caching, loading states, and optimistic updates
 * Fetches both active (current) and scheduled (future) settings
 *
 * @param settingKey - The key of the setting to fetch (e.g., 'opening_hours')
 * @returns Query result with active and scheduled settings data and update function
 */
export function useStudioSettings(settingKey: string) {
  const queryClient = useQueryClient();

  // Query for currently active settings (effective_from <= today)
  const activeQuery = useQuery({
    queryKey: ["studio-settings", "active", settingKey],
    queryFn: () => fetchActiveSettings(settingKey),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for scheduled settings (effective_from > today)
  const scheduledQuery = useQuery({
    queryKey: ["studio-settings", "scheduled", settingKey],
    queryFn: () => fetchScheduledSettings(settingKey),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: ({
      value,
      effectiveFrom,
    }: {
      value: unknown;
      effectiveFrom: Date | null;
    }) => updateStudioSettings(settingKey, value, effectiveFrom),
    onSuccess: () => {
      // Invalidate and refetch both active and scheduled settings
      queryClient.invalidateQueries({
        queryKey: ["studio-settings", "active", settingKey],
      });
      queryClient.invalidateQueries({
        queryKey: ["studio-settings", "scheduled", settingKey],
      });
    },
  });

  return {
    // Active settings (currently in effect)
    data: activeQuery.data,
    isLoading: activeQuery.isLoading,
    error: activeQuery.error,
    refetch: activeQuery.refetch,

    // Scheduled settings (future effective date)
    scheduledData: scheduledQuery.data,
    isLoadingScheduled: scheduledQuery.isLoading,
    scheduledError: scheduledQuery.error,
    refetchScheduled: scheduledQuery.refetch,

    // Mutation
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
