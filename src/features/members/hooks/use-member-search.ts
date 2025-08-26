import { useState, useCallback, useEffect } from "react";
import { useSearchMembers, memberKeys } from "./use-members";
import { useQueryClient } from "@tanstack/react-query";
import type { Member } from "@/features/database/lib/types";

// Custom hook for debounced member search
export function useDebouncedMemberSearch(initialQuery = "", debounceMs = 300) {
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
  const searchResult = useSearchMembers(debouncedQuery);

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

// Hook for member validation during forms
export function useMemberValidation() {
  const queryClient = useQueryClient();

  const checkEmailExists = useCallback(
    async (email: string, excludeId?: string): Promise<boolean> => {
      try {
        // Check cache first
        const cachedMembers = queryClient.getQueriesData<Member[]>({
          queryKey: memberKeys.lists(),
        });

        // Look through cached data first
        for (const [, members] of cachedMembers) {
          if (members) {
            const exists = members.some(
              (member) =>
                member.email.toLowerCase() === email.toLowerCase() &&
                member.id !== excludeId
            );
            if (exists) return true;
          }
        }

        // If not found in cache, check database
        const { memberUtils } = await import("@/features/database/lib/utils");
        return await memberUtils.checkEmailExists(email, excludeId);
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

// Hook for prefetching member details (useful for hover cards, etc.)
export function useMemberPrefetch() {
  const queryClient = useQueryClient();

  const prefetchMember = useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: memberKeys.detail(id),
        queryFn: async () => {
          const { memberUtils } = await import("@/features/database/lib/utils");
          return memberUtils.getMemberById(id);
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    },
    [queryClient]
  );

  const prefetchMemberWithSubscription = useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: memberKeys.withSubscription(id),
        queryFn: async () => {
          const { memberUtils } = await import("@/features/database/lib/utils");
          return memberUtils.getMemberWithSubscription(id);
        },
        staleTime: 10 * 60 * 1000,
      });
    },
    [queryClient]
  );

  // Prefetch next and previous members for navigation optimization
  const prefetchAdjacentMembers = useCallback(
    (currentMemberId: string) => {
      // Get members list from cache to find adjacent members
      const cachedMembers = queryClient.getQueriesData<Member[]>({
        queryKey: memberKeys.lists(),
      });

      for (const [, members] of cachedMembers) {
        if (members) {
          const currentIndex = members.findIndex(
            (m) => m.id === currentMemberId
          );
          if (currentIndex !== -1) {
            // Prefetch previous member
            if (currentIndex > 0) {
              const prevMember = members[currentIndex - 1];
              prefetchMemberWithSubscription(prevMember.id);
            }
            // Prefetch next member
            if (currentIndex < members.length - 1) {
              const nextMember = members[currentIndex + 1];
              prefetchMemberWithSubscription(nextMember.id);
            }
            break;
          }
        }
      }
    },
    [queryClient, prefetchMemberWithSubscription]
  );

  // Prefetch members for table row hover
  const prefetchOnHover = useCallback(
    (id: string) => {
      // Use shorter stale time for hover prefetching
      queryClient.prefetchQuery({
        queryKey: memberKeys.withSubscription(id),
        queryFn: async () => {
          const { memberUtils } = await import("@/features/database/lib/utils");
          return memberUtils.getMemberWithSubscription(id);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes for hover prefetch
      });
    },
    [queryClient]
  );

  // Navigation-based prefetching
  const prefetchNextMember = useCallback(
    (currentMemberId: string) => {
      const cachedMembers = queryClient.getQueriesData<Member[]>({
        queryKey: memberKeys.lists(),
      });

      for (const [, members] of cachedMembers) {
        if (members) {
          const currentIndex = members.findIndex(
            (m) => m.id === currentMemberId
          );
          if (currentIndex !== -1 && currentIndex < members.length - 1) {
            const nextMember = members[currentIndex + 1];
            prefetchMemberWithSubscription(nextMember.id);
            return nextMember.id;
          }
        }
      }
      return null;
    },
    [queryClient, prefetchMemberWithSubscription]
  );

  const prefetchPreviousMember = useCallback(
    (currentMemberId: string) => {
      const cachedMembers = queryClient.getQueriesData<Member[]>({
        queryKey: memberKeys.lists(),
      });

      for (const [, members] of cachedMembers) {
        if (members) {
          const currentIndex = members.findIndex(
            (m) => m.id === currentMemberId
          );
          if (currentIndex > 0) {
            const prevMember = members[currentIndex - 1];
            prefetchMemberWithSubscription(prevMember.id);
            return prevMember.id;
          }
        }
      }
      return null;
    },
    [queryClient, prefetchMemberWithSubscription]
  );

  return {
    prefetchMember,
    prefetchMemberWithSubscription,
    prefetchAdjacentMembers,
    prefetchOnHover,
    prefetchNextMember,
    prefetchPreviousMember,
  };
}

// Hook for member cache invalidation utilities
export function useMemberCacheUtils() {
  const queryClient = useQueryClient();

  const invalidateAllMembers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: memberKeys.all });
  }, [queryClient]);

  const invalidateMemberLists = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
  }, [queryClient]);

  const invalidateMember = useCallback(
    (id: string) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: memberKeys.withSubscription(id),
      });
    },
    [queryClient]
  );

  // Smart cache invalidation for member updates
  const invalidateMemberCache = useCallback(
    async (id: string) => {
      // Invalidate the specific member
      await queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) });
      await queryClient.invalidateQueries({
        queryKey: memberKeys.withSubscription(id),
      });

      // Invalidate member lists that might contain this member
      await queryClient.invalidateQueries({ queryKey: memberKeys.lists() });

      // Invalidate counts and analytics
      await queryClient.invalidateQueries({ queryKey: memberKeys.count() });
      await queryClient.invalidateQueries({
        queryKey: memberKeys.countByStatus(),
      });

      // Invalidate search results that might include this member
      const searchQueries = queryClient.getQueriesData({
        queryKey: memberKeys.all,
        predicate: (query) => query.queryKey.includes("search"),
      });

      for (const [queryKey] of searchQueries) {
        await queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient]
  );

  const removeMemberFromCache = useCallback(
    (id: string) => {
      queryClient.removeQueries({ queryKey: memberKeys.detail(id) });
      queryClient.removeQueries({ queryKey: memberKeys.withSubscription(id) });
    },
    [queryClient]
  );

  const getMemberFromCache = useCallback(
    (id: string): Member | undefined => {
      return queryClient.getQueryData<Member>(memberKeys.detail(id));
    },
    [queryClient]
  );

  const setMemberInCache = useCallback(
    (member: Member) => {
      queryClient.setQueryData(memberKeys.detail(member.id), member);

      // Also update member lists if they contain this member
      const cachedLists = queryClient.getQueriesData<Member[]>({
        queryKey: memberKeys.lists(),
      });

      for (const [queryKey, members] of cachedLists) {
        if (members) {
          const updatedMembers = members.map((m) =>
            m.id === member.id ? member : m
          );
          queryClient.setQueryData(queryKey, updatedMembers);
        }
      }
    },
    [queryClient]
  );

  // Prefetch utilities
  const prefetchMember = useCallback(
    (id: string) => {
      return queryClient.prefetchQuery({
        queryKey: memberKeys.detail(id),
        queryFn: async () => {
          const { memberUtils } = await import("@/features/database/lib/utils");
          return memberUtils.getMemberById(id);
        },
        staleTime: 10 * 60 * 1000,
      });
    },
    [queryClient]
  );

  // Background refresh for active pages
  const refreshMemberInBackground = useCallback(
    (id: string) => {
      queryClient.refetchQueries({
        queryKey: memberKeys.detail(id),
        type: "active", // Only refetch active queries
      });
    },
    [queryClient]
  );

  return {
    invalidateAllMembers,
    invalidateMemberLists,
    invalidateMember,
    invalidateMemberCache,
    removeMemberFromCache,
    getMemberFromCache,
    setMemberInCache,
    prefetchMember,
    refreshMemberInBackground,
  };
}
