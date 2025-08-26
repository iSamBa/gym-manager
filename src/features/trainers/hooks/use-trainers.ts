import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import {
  trainerUtils,
  type TrainerFilters,
} from "@/features/database/lib/utils";
import type {
  Trainer,
  TrainerWithProfile,
} from "@/features/database/lib/types";

// Query key factory for consistent cache management
export const trainerKeys = {
  all: ["trainers"] as const,
  lists: () => [...trainerKeys.all, "list"] as const,
  list: (filters: TrainerFilters) => [...trainerKeys.lists(), filters] as const,
  details: () => [...trainerKeys.all, "detail"] as const,
  detail: (id: string) => [...trainerKeys.details(), id] as const,
  search: (query: string) => [...trainerKeys.all, "search", query] as const,
  count: () => [...trainerKeys.all, "count"] as const,
  countByStatus: () => [...trainerKeys.all, "count", "by-status"] as const,
  expiringCerts: (days: number) =>
    [...trainerKeys.all, "expiring-certs", days] as const,
  withProfile: (id: string) =>
    [...trainerKeys.details(), id, "with-profile"] as const,
  bySpecialization: (specialization: string) =>
    [...trainerKeys.all, "specialization", specialization] as const,
  available: () => [...trainerKeys.all, "available"] as const,
};

// Main trainers list hook with filtering
export function useTrainers(filters: TrainerFilters = {}) {
  return useQuery({
    queryKey: trainerKeys.list(filters),
    queryFn: () => trainerUtils.getTrainers(filters),
    placeholderData: keepPreviousData, // Smooth transitions when filters change
    staleTime: 5 * 60 * 1000, // 5 minutes - from global config
  });
}

// Single trainer hook
export function useTrainer(id: string) {
  return useQuery({
    queryKey: trainerKeys.detail(id),
    queryFn: () => trainerUtils.getTrainerById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual trainer data
  });
}

// Trainer with profile and specializations
export function useTrainerWithProfile(
  id: string,
  options?: {
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
  }
) {
  return useQuery({
    queryKey: trainerKeys.withProfile(id),
    queryFn: () => trainerUtils.getTrainerWithProfile(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
  });
}

// Search trainers hook with debouncing handled by TanStack Query
export function useSearchTrainers(query: string) {
  return useQuery({
    queryKey: trainerKeys.search(query),
    queryFn: () => trainerUtils.searchTrainers(query),
    enabled: query.length >= 1, // Only search with 1+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    placeholderData: keepPreviousData,
  });
}

// Trainers by specialization
export function useTrainersBySpecialization(specialization: string) {
  return useQuery({
    queryKey: trainerKeys.bySpecialization(specialization),
    queryFn: () => trainerUtils.getTrainersBySpecialization(specialization),
    enabled: !!specialization,
    staleTime: 5 * 60 * 1000,
  });
}

// Available trainers (accepting new clients)
export function useAvailableTrainers() {
  return useQuery({
    queryKey: trainerKeys.available(),
    queryFn: () => trainerUtils.getAvailableTrainers(),
    staleTime: 5 * 60 * 1000,
  });
}

// Trainer count
export function useTrainerCount() {
  return useQuery({
    queryKey: trainerKeys.count(),
    queryFn: () => trainerUtils.getTrainerCount(),
    staleTime: 15 * 60 * 1000, // 15 minutes for counts
  });
}

// Trainer count by status
export function useTrainerCountByStatus() {
  return useQuery({
    queryKey: trainerKeys.countByStatus(),
    queryFn: () => trainerUtils.getTrainerCountByStatus(),
    staleTime: 15 * 60 * 1000,
  });
}

// Trainers with expiring certifications
export function useTrainersWithExpiringCerts(days = 30) {
  return useQuery({
    queryKey: trainerKeys.expiringCerts(days),
    queryFn: () => trainerUtils.getTrainersWithExpiringCerts(days),
    staleTime: 30 * 60 * 1000, // 30 minutes for expiring certs
  });
}

// Create trainer mutation with optimistic updates
export function useCreateTrainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trainerUtils.createTrainer,
    onSuccess: (newTrainer) => {
      // Invalidate trainer lists to show the new trainer
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trainerKeys.count() });
      queryClient.invalidateQueries({ queryKey: trainerKeys.countByStatus() });

      // Optionally set the new trainer in cache
      queryClient.setQueryData(trainerKeys.detail(newTrainer.id), newTrainer);
    },
    onError: (error) => {
      console.error("Failed to create trainer:", error);
    },
  });
}

// Update trainer mutation with optimistic updates
export function useUpdateTrainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof trainerUtils.updateTrainer>[1];
    }) => trainerUtils.updateTrainer(id, data),

    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: trainerKeys.detail(id) });

      // Snapshot previous value
      const previousTrainer = queryClient.getQueryData<Trainer>(
        trainerKeys.detail(id)
      );

      // Optimistically update
      if (previousTrainer) {
        queryClient.setQueryData(trainerKeys.detail(id), {
          ...previousTrainer,
          ...data,
          updated_at: new Date().toISOString(),
        });

        // Update in lists too (handle both regular arrays and infinite query structures)
        queryClient.setQueriesData(
          { queryKey: trainerKeys.lists() },
          (oldData: Trainer[] | { pages: Trainer[][] } | undefined) => {
            if (!oldData) return oldData;

            const updateTrainer = (trainer: Trainer) =>
              trainer.id === id ? { ...trainer, ...data } : trainer;

            // Handle infinite query structure
            if ("pages" in oldData && Array.isArray(oldData.pages)) {
              return {
                ...oldData,
                pages: oldData.pages.map((page) => page.map(updateTrainer)),
              };
            }

            // Handle regular array structure
            if (Array.isArray(oldData)) {
              return oldData.map(updateTrainer);
            }

            // Return unchanged if unknown structure
            return oldData;
          }
        );
      }

      return { previousTrainer };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousTrainer) {
        queryClient.setQueryData(
          trainerKeys.detail(id),
          context.previousTrainer
        );
      }
      console.error("Failed to update trainer:", error);
    },

    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: trainerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

// Update trainer accepting new clients status
export function useUpdateTrainerAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isAccepting }: { id: string; isAccepting: boolean }) =>
      trainerUtils.updateTrainer(id, { is_accepting_new_clients: isAccepting }),

    onMutate: async ({ id, isAccepting }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: trainerKeys.detail(id) });

      // Snapshot previous value
      const previousTrainer = queryClient.getQueryData<Trainer>(
        trainerKeys.detail(id)
      );

      // Optimistically update individual trainer
      if (previousTrainer) {
        queryClient.setQueryData(trainerKeys.detail(id), {
          ...previousTrainer,
          is_accepting_new_clients: isAccepting,
          updated_at: new Date().toISOString(),
        });
      }

      // Update in all trainer lists
      queryClient.setQueriesData(
        { queryKey: trainerKeys.lists() },
        (oldData: Trainer[] | { pages: Trainer[][] } | undefined) => {
          if (!oldData) return oldData;

          // Handle infinite query structure
          if ("pages" in oldData && Array.isArray(oldData.pages)) {
            return {
              ...oldData,
              pages: oldData.pages.map((page) =>
                page.map((trainer) =>
                  trainer.id === id
                    ? { ...trainer, is_accepting_new_clients: isAccepting }
                    : trainer
                )
              ),
            };
          }

          // Handle regular array structure
          if (Array.isArray(oldData)) {
            return oldData.map((trainer) =>
              trainer.id === id
                ? { ...trainer, is_accepting_new_clients: isAccepting }
                : trainer
            );
          }

          // Return unchanged if unknown structure
          return oldData;
        }
      );

      return { previousTrainer };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousTrainer) {
        queryClient.setQueryData(
          trainerKeys.detail(id),
          context.previousTrainer
        );
      }
      console.error("Failed to update trainer availability:", error);
    },

    onSuccess: () => {
      // Invalidate status counts since they changed
      queryClient.invalidateQueries({ queryKey: trainerKeys.countByStatus() });
      queryClient.invalidateQueries({ queryKey: trainerKeys.available() });
    },

    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: trainerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

// Bulk update accepting clients mutation
export function useBulkUpdateTrainerAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trainerIds,
      isAccepting,
    }: {
      trainerIds: string[];
      isAccepting: boolean;
    }) => trainerUtils.bulkUpdateAcceptingClients(trainerIds, isAccepting),

    onMutate: async ({ trainerIds, isAccepting }) => {
      // Cancel all relevant queries
      await queryClient.cancelQueries({ queryKey: trainerKeys.lists() });

      // Optimistically update all affected trainers in lists
      queryClient.setQueriesData(
        { queryKey: trainerKeys.lists() },
        (oldData: Trainer[] | { pages: Trainer[][] } | undefined) => {
          if (!oldData) return oldData;

          const updateTrainer = (trainer: Trainer) =>
            trainerIds.includes(trainer.id)
              ? {
                  ...trainer,
                  is_accepting_new_clients: isAccepting,
                  updated_at: new Date().toISOString(),
                }
              : trainer;

          // Handle infinite query structure
          if ("pages" in oldData && Array.isArray(oldData.pages)) {
            return {
              ...oldData,
              pages: oldData.pages.map((page) => page.map(updateTrainer)),
            };
          }

          // Handle regular array structure
          if (Array.isArray(oldData)) {
            return oldData.map(updateTrainer);
          }

          // Return unchanged if unknown structure
          return oldData;
        }
      );

      // Update individual trainer caches too
      trainerIds.forEach((id) => {
        queryClient.setQueryData(
          trainerKeys.detail(id),
          (oldTrainer: Trainer | undefined) =>
            oldTrainer
              ? { ...oldTrainer, is_accepting_new_clients: isAccepting }
              : undefined
        );
      });
    },

    onError: (error) => {
      console.error("Failed to bulk update trainer availability:", error);
    },

    onSuccess: () => {
      // Invalidate all trainer-related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: trainerKeys.all });
    },
  });
}

// Delete trainer mutation
export function useDeleteTrainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trainerUtils.deleteTrainer,
    onMutate: async (id: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: trainerKeys.detail(id) });

      // Snapshot previous value
      const previousTrainer = queryClient.getQueryData<Trainer>(
        trainerKeys.detail(id)
      );

      // Remove from cache optimistically
      queryClient.removeQueries({ queryKey: trainerKeys.detail(id) });

      // Remove from lists
      queryClient.setQueriesData(
        { queryKey: trainerKeys.lists() },
        (oldData: Trainer[] | { pages: Trainer[][] } | undefined) => {
          if (!oldData) return oldData;

          // Handle infinite query structure
          if ("pages" in oldData && Array.isArray(oldData.pages)) {
            return {
              ...oldData,
              pages: oldData.pages.map((page) =>
                page.filter((trainer) => trainer.id !== id)
              ),
            };
          }

          // Handle regular array structure
          if (Array.isArray(oldData)) {
            return oldData.filter((trainer) => trainer.id !== id);
          }

          // Return unchanged if unknown structure
          return oldData;
        }
      );

      return { previousTrainer };
    },

    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousTrainer) {
        queryClient.setQueryData(
          trainerKeys.detail(id),
          context.previousTrainer
        );
      }
      console.error("Failed to delete trainer:", error);
    },

    onSuccess: () => {
      // Invalidate counts
      queryClient.invalidateQueries({ queryKey: trainerKeys.count() });
      queryClient.invalidateQueries({ queryKey: trainerKeys.countByStatus() });
    },

    onSettled: () => {
      // Ensure lists are fresh
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

// Infinite scroll hook for large trainer lists
export function useTrainersInfinite(
  filters: Omit<TrainerFilters, "limit" | "offset"> = {},
  pageSize = 20
) {
  return useInfiniteQuery({
    queryKey: [...trainerKeys.list(filters), "infinite"],
    queryFn: ({ pageParam = 0 }) =>
      trainerUtils.getTrainers({
        ...filters,
        limit: pageSize,
        offset: pageParam * pageSize,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Return next page number if we got a full page, otherwise undefined
      return lastPage.length === pageSize ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Prefetch trainers for pagination
export function useTrainersPrefetch() {
  const queryClient = useQueryClient();

  const prefetchPage = (
    filters: TrainerFilters,
    pageNumber: number,
    pageSize = 20
  ) => {
    return queryClient.prefetchQuery({
      queryKey: trainerKeys.list({
        ...filters,
        limit: pageSize,
        offset: pageNumber * pageSize,
      }),
      queryFn: () =>
        trainerUtils.getTrainers({
          ...filters,
          limit: pageSize,
          offset: pageNumber * pageSize,
        }),
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchPage };
}
