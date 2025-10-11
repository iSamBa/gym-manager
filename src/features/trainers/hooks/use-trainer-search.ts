import { useState, useCallback, useEffect } from "react";
import { useSearchTrainers, trainerKeys } from "./use-trainers";
import { useQueryClient } from "@tanstack/react-query";
import type {
  Trainer,
  TrainerWithProfile,
} from "@/features/database/lib/types";

// Custom hook for debounced trainer search
export function useDebouncedTrainerSearch(initialQuery = "", debounceMs = 300) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Use the search hook with debounced query
  const searchResult = useSearchTrainers(debouncedQuery);

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
  }, []);

  return {
    query,
    debouncedQuery,
    updateQuery,
    clearQuery,
    isSearching: query !== debouncedQuery || searchResult.isLoading,
    results: searchResult.data || [],
    error: searchResult.error,
    isError: searchResult.isError,
  };
}

// Hook for trainer validation during forms
export function useTrainerValidation() {
  const queryClient = useQueryClient();

  const checkEmailExists = useCallback(
    async (email: string, excludeId?: string): Promise<boolean> => {
      try {
        // Check cache first by looking at trainer profiles
        const cachedTrainersWithProfiles = queryClient.getQueriesData<
          TrainerWithProfile[]
        >({
          queryKey: trainerKeys.all,
        });

        // Look through cached data first
        for (const [, trainers] of cachedTrainersWithProfiles) {
          if (trainers) {
            const exists = trainers.some(
              (trainer) =>
                trainer.user_profile?.email?.toLowerCase() ===
                  email.toLowerCase() && trainer.id !== excludeId
            );
            if (exists) return true;
          }
        }

        // If not found in cache, we'd need to query the database
        // For now, return false as we don't have a direct utility for this
        // This could be enhanced with a dedicated utility function
        return false;
      } catch (error) {
        console.error("Error checking email:", error);
        return false;
      }
    },
    [queryClient]
  );

  return {
    checkEmailExists,
  };
}

// Hook for prefetching trainer details (useful for hover cards, etc.)
export function useTrainerPrefetch() {
  const queryClient = useQueryClient();

  const prefetchTrainer = useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: trainerKeys.detail(id),
        queryFn: async () => {
          const { trainerUtils } = await import(
            "@/features/trainers/lib/database-utils"
          );
          return trainerUtils.getTrainerById(id);
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    },
    [queryClient]
  );

  const prefetchTrainerWithProfile = useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: trainerKeys.withProfile(id),
        queryFn: async () => {
          const { trainerUtils } = await import(
            "@/features/trainers/lib/database-utils"
          );
          return trainerUtils.getTrainerWithProfile(id);
        },
        staleTime: 10 * 60 * 1000,
      });
    },
    [queryClient]
  );

  // Prefetch next and previous trainers for navigation optimization
  const prefetchAdjacentTrainers = useCallback(
    (currentTrainerId: string) => {
      // Get trainers list from cache to find adjacent trainers
      const cachedTrainers = queryClient.getQueriesData<Trainer[]>({
        queryKey: trainerKeys.lists(),
      });

      for (const [, trainers] of cachedTrainers) {
        if (trainers) {
          const currentIndex = trainers.findIndex(
            (t) => t.id === currentTrainerId
          );
          if (currentIndex !== -1) {
            // Prefetch previous trainer
            if (currentIndex > 0) {
              const prevTrainer = trainers[currentIndex - 1];
              prefetchTrainerWithProfile(prevTrainer.id);
            }
            // Prefetch next trainer
            if (currentIndex < trainers.length - 1) {
              const nextTrainer = trainers[currentIndex + 1];
              prefetchTrainerWithProfile(nextTrainer.id);
            }
            break;
          }
        }
      }
    },
    [queryClient, prefetchTrainerWithProfile]
  );

  // Prefetch trainers for table row hover
  const prefetchOnHover = useCallback(
    (id: string) => {
      // Use shorter stale time for hover prefetching
      queryClient.prefetchQuery({
        queryKey: trainerKeys.withProfile(id),
        queryFn: async () => {
          const { trainerUtils } = await import(
            "@/features/trainers/lib/database-utils"
          );
          return trainerUtils.getTrainerWithProfile(id);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes for hover prefetch
      });
    },
    [queryClient]
  );

  // Navigation-based prefetching
  const prefetchNextTrainer = useCallback(
    (currentTrainerId: string) => {
      const cachedTrainers = queryClient.getQueriesData<Trainer[]>({
        queryKey: trainerKeys.lists(),
      });

      for (const [, trainers] of cachedTrainers) {
        if (trainers) {
          const currentIndex = trainers.findIndex(
            (t) => t.id === currentTrainerId
          );
          if (currentIndex !== -1 && currentIndex < trainers.length - 1) {
            const nextTrainer = trainers[currentIndex + 1];
            prefetchTrainerWithProfile(nextTrainer.id);
            return nextTrainer.id;
          }
        }
      }
      return null;
    },
    [queryClient, prefetchTrainerWithProfile]
  );

  const prefetchPreviousTrainer = useCallback(
    (currentTrainerId: string) => {
      const cachedTrainers = queryClient.getQueriesData<Trainer[]>({
        queryKey: trainerKeys.lists(),
      });

      for (const [, trainers] of cachedTrainers) {
        if (trainers) {
          const currentIndex = trainers.findIndex(
            (t) => t.id === currentTrainerId
          );
          if (currentIndex > 0) {
            const prevTrainer = trainers[currentIndex - 1];
            prefetchTrainerWithProfile(prevTrainer.id);
            return prevTrainer.id;
          }
        }
      }
      return null;
    },
    [queryClient, prefetchTrainerWithProfile]
  );

  return {
    prefetchTrainer,
    prefetchTrainerWithProfile,
    prefetchAdjacentTrainers,
    prefetchOnHover,
    prefetchNextTrainer,
    prefetchPreviousTrainer,
  };
}

// Hook for trainer cache invalidation utilities
export function useTrainerCacheUtils() {
  const queryClient = useQueryClient();

  const invalidateAllTrainers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: trainerKeys.all });
  }, [queryClient]);

  const invalidateTrainerLists = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
  }, [queryClient]);

  const invalidateTrainer = useCallback(
    (id: string) => {
      queryClient.invalidateQueries({ queryKey: trainerKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: trainerKeys.withProfile(id),
      });
    },
    [queryClient]
  );

  // Smart cache invalidation for trainer updates
  const invalidateTrainerCache = useCallback(
    async (id: string) => {
      // Invalidate the specific trainer
      await queryClient.invalidateQueries({ queryKey: trainerKeys.detail(id) });
      await queryClient.invalidateQueries({
        queryKey: trainerKeys.withProfile(id),
      });

      // Invalidate trainer lists that might contain this trainer
      await queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });

      // Invalidate counts and analytics
      await queryClient.invalidateQueries({ queryKey: trainerKeys.count() });
      await queryClient.invalidateQueries({
        queryKey: trainerKeys.countByStatus(),
      });

      // Invalidate search results that might include this trainer
      const searchQueries = queryClient.getQueriesData({
        queryKey: trainerKeys.all,
        predicate: (query) => query.queryKey.includes("search"),
      });

      for (const [queryKey] of searchQueries) {
        await queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient]
  );

  const removeTrainerFromCache = useCallback(
    (id: string) => {
      queryClient.removeQueries({ queryKey: trainerKeys.detail(id) });
      queryClient.removeQueries({ queryKey: trainerKeys.withProfile(id) });
    },
    [queryClient]
  );

  const getTrainerFromCache = useCallback(
    (id: string): Trainer | undefined => {
      return queryClient.getQueryData<Trainer>(trainerKeys.detail(id));
    },
    [queryClient]
  );

  const setTrainerInCache = useCallback(
    (trainer: Trainer) => {
      queryClient.setQueryData(trainerKeys.detail(trainer.id), trainer);

      // Also update trainer lists if they contain this trainer
      const cachedLists = queryClient.getQueriesData<Trainer[]>({
        queryKey: trainerKeys.lists(),
      });

      for (const [queryKey, trainers] of cachedLists) {
        if (trainers) {
          const updatedTrainers = trainers.map((t) =>
            t.id === trainer.id ? trainer : t
          );
          queryClient.setQueryData(queryKey, updatedTrainers);
        }
      }
    },
    [queryClient]
  );

  // Prefetch utilities
  const prefetchTrainer = useCallback(
    (id: string) => {
      return queryClient.prefetchQuery({
        queryKey: trainerKeys.detail(id),
        queryFn: async () => {
          const { trainerUtils } = await import(
            "@/features/trainers/lib/database-utils"
          );
          return trainerUtils.getTrainerById(id);
        },
        staleTime: 10 * 60 * 1000,
      });
    },
    [queryClient]
  );

  // Background refresh for active pages
  const refreshTrainerInBackground = useCallback(
    (id: string) => {
      queryClient.refetchQueries({
        queryKey: trainerKeys.detail(id),
        type: "active", // Only refetch active queries
      });
    },
    [queryClient]
  );

  return {
    invalidateAllTrainers,
    invalidateTrainerLists,
    invalidateTrainer,
    invalidateTrainerCache,
    removeTrainerFromCache,
    getTrainerFromCache,
    setTrainerInCache,
    prefetchTrainer,
    refreshTrainerInBackground,
  };
}
