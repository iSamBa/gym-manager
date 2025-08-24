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

  const checkMemberNumberExists = useCallback(
    async (memberNumber: string, excludeId?: string): Promise<boolean> => {
      try {
        // Check cache first for performance
        const cachedMembers = queryClient.getQueriesData<Member[]>({
          queryKey: memberKeys.lists(),
        });

        // Look through cached data first
        for (const [, members] of cachedMembers) {
          if (members) {
            const exists = members.some(
              (member) =>
                member.member_number === memberNumber && member.id !== excludeId
            );
            if (exists) return true;
          }
        }

        // If not found in cache, check database
        const { memberUtils } = await import("@/features/database/lib/utils");
        return await memberUtils.checkMemberNumberExists(
          memberNumber,
          excludeId
        );
      } catch (error) {
        console.error("Error checking member number:", error);
        return false;
      }
    },
    [queryClient]
  );

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
    checkMemberNumberExists,
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

  return {
    prefetchMember,
    prefetchMemberWithSubscription,
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
    },
    [queryClient]
  );

  return {
    invalidateAllMembers,
    invalidateMemberLists,
    invalidateMember,
    removeMemberFromCache,
    getMemberFromCache,
    setMemberInCache,
  };
}
