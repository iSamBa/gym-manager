/**
 * Planning Settings Hook
 * React Query hook for managing planning parameters
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getPlanningSettings,
  updatePlanningSettings,
  initializeDefaultSettings,
} from "../lib/planning-settings-db";
import type { UpdatePlanningSettingsInput } from "../lib/types";

/**
 * Hook for managing planning settings
 * @returns Planning settings data, loading state, and update function
 */
export function usePlanningSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["planning-settings"],
    queryFn: async () => {
      const settings = await getPlanningSettings();
      return settings || (await initializeDefaultSettings());
    },
  });

  const mutation = useMutation({
    mutationFn: (updates: UpdatePlanningSettingsInput) => {
      if (!query.data?.id) throw new Error("Settings not loaded");
      return updatePlanningSettings(query.data.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-settings"] });
      toast.success("Planning settings updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
