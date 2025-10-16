import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStudioSettings, updateStudioSettings } from "../lib/settings-api";

/**
 * Hook for managing studio settings with React Query
 * Provides caching, loading states, and optimistic updates
 *
 * @param settingKey - The key of the setting to fetch (e.g., 'opening_hours')
 * @returns Query result with settings data and update function
 */
export function useStudioSettings(settingKey: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["studio-settings", settingKey],
    queryFn: () => fetchStudioSettings(settingKey),
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
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ["studio-settings", settingKey],
      });
    },
  });

  return {
    // Query state
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Mutation
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
