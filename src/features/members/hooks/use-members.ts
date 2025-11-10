import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { getUserFriendlyErrorMessage } from "@/lib/error-messages";
import {
  memberUtils,
  type MemberFilters,
} from "@/features/members/lib/database-utils";
import type {
  Member,
  MemberStatus,
  MemberType,
} from "@/features/database/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { exportMembersToCSV } from "../lib/csv-utils";
import {
  formatTimestampForDatabase,
  getLocalDateString,
} from "@/lib/date-utils";
import { supabase } from "@/lib/supabase";
import type { SimpleMemberFilters } from "../components/SimpleMemberFilters";
import {
  convertCollaborationMember,
  type ConvertCollaborationMemberInput,
} from "../lib/collaboration-utils";

// Query key factory for consistent cache management
export const memberKeys = {
  all: ["members"] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (filters: MemberFilters) => [...memberKeys.lists(), filters] as const,
  details: () => [...memberKeys.all, "detail"] as const,
  detail: (id: string) => [...memberKeys.details(), id] as const,
  search: (query: string) => [...memberKeys.all, "search", query] as const,
  count: () => [...memberKeys.all, "count"] as const,
  countByStatus: () => [...memberKeys.all, "count", "by-status"] as const,
  newThisMonth: () => [...memberKeys.all, "new-this-month"] as const,
  collaborationCount: () => [...memberKeys.all, "collaboration-count"] as const,
  withSubscription: (id: string) =>
    [...memberKeys.details(), id, "with-subscription"] as const,
};

// Main members list hook with filtering
export function useMembers(filters: MemberFilters = {}) {
  return useQuery({
    queryKey: memberKeys.list(filters),
    queryFn: () => memberUtils.getMembers(filters),
    placeholderData: keepPreviousData, // Smooth transitions when filters change
    staleTime: 5 * 60 * 1000, // 5 minutes - from global config
  });
}

// Single member hook
export function useMember(id: string) {
  return useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: () => memberUtils.getMemberById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual member data
  });
}

// Member with subscription and emergency contacts
export function useMemberWithSubscription(
  id: string,
  options?: {
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
  }
) {
  return useQuery({
    queryKey: memberKeys.withSubscription(id),
    queryFn: () => memberUtils.getMemberWithSubscription(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
  });
}

// Search members hook with debouncing handled by TanStack Query
export function useSearchMembers(query: string) {
  return useQuery({
    queryKey: memberKeys.search(query),
    queryFn: () => memberUtils.searchMembers(query),
    enabled: query.length >= 1, // Only search with 1+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    placeholderData: keepPreviousData,
  });
}

// Members by status
export function useMembersByStatus(status: MemberStatus) {
  return useQuery({
    queryKey: memberKeys.list({ status }),
    queryFn: () => memberUtils.getMembersByStatus(status),
    staleTime: 5 * 60 * 1000,
  });
}

// Member count
export function useMemberCount() {
  return useQuery({
    queryKey: memberKeys.count(),
    queryFn: () => memberUtils.getMemberCount(),
    staleTime: 15 * 60 * 1000, // 15 minutes for counts
  });
}

// Member count by status
export function useMemberCountByStatus() {
  return useQuery({
    queryKey: memberKeys.countByStatus(),
    queryFn: () => memberUtils.getMemberCountByStatus(),
    staleTime: 15 * 60 * 1000,
  });
}

// New members this month
export function useNewMembersThisMonth() {
  return useQuery({
    queryKey: memberKeys.newThisMonth(),
    queryFn: () => memberUtils.getNewMembersThisMonth(),
    staleTime: 30 * 60 * 1000, // 30 minutes for monthly stats
  });
}

// Collaboration member count
export function useCollaborationMemberCount() {
  return useQuery({
    queryKey: memberKeys.collaborationCount(),
    queryFn: () => memberUtils.getCollaborationMemberCount(),
    staleTime: 15 * 60 * 1000, // 15 minutes for counts
  });
}

// Create member mutation with optimistic updates
export function useCreateMember() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Parameters<typeof memberUtils.createMember>[0]
    ) => {
      // Frontend admin check
      if (!isAdmin) {
        throw new Error("Only administrators can create members");
      }
      return memberUtils.createMember(data);
    },
    onSuccess: (newMember) => {
      // Invalidate member lists to show the new member
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      queryClient.invalidateQueries({ queryKey: memberKeys.count() });
      queryClient.invalidateQueries({ queryKey: memberKeys.countByStatus() });

      // Optionally set the new member in cache
      queryClient.setQueryData(memberKeys.detail(newMember.id), newMember);
    },
    onError: (error) => {
      logger.error("Failed to create member", { error });
    },
  });
}

// Update member mutation with optimistic updates
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof memberUtils.updateMember>[1];
    }) => memberUtils.updateMember(id, data),

    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: memberKeys.detail(id) });
      await queryClient.cancelQueries({
        queryKey: memberKeys.withSubscription(id),
      });

      // Snapshot previous value
      const previousMember = queryClient.getQueryData<Member>(
        memberKeys.detail(id)
      );
      const previousMemberWithSub = queryClient.getQueryData<Member>(
        memberKeys.withSubscription(id)
      );

      // Optimistically update detail query
      if (previousMember) {
        queryClient.setQueryData(memberKeys.detail(id), {
          ...previousMember,
          ...data,
          updated_at: formatTimestampForDatabase(),
        });
      }

      // Optimistically update withSubscription query
      if (previousMemberWithSub) {
        queryClient.setQueryData(memberKeys.withSubscription(id), {
          ...previousMemberWithSub,
          ...data,
          updated_at: formatTimestampForDatabase(),
        });
      }

      // Update in lists too (handle both regular arrays and infinite query structures)
      queryClient.setQueriesData(
        { queryKey: memberKeys.lists() },
        (oldData: Member[] | { pages: Member[][] } | undefined) => {
          if (!oldData) return oldData;

          const updateMember = (member: Member) =>
            member.id === id ? { ...member, ...data } : member;

          // Handle infinite query structure
          if ("pages" in oldData && Array.isArray(oldData.pages)) {
            return {
              ...oldData,
              pages: oldData.pages.map((page) => page.map(updateMember)),
            };
          }

          // Handle regular array structure
          if (Array.isArray(oldData)) {
            return oldData.map(updateMember);
          }

          // Return unchanged if unknown structure
          return oldData;
        }
      );

      return { previousMember, previousMemberWithSub };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousMember) {
        queryClient.setQueryData(memberKeys.detail(id), context.previousMember);
      }
      if (context?.previousMemberWithSub) {
        queryClient.setQueryData(
          memberKeys.withSubscription(id),
          context.previousMemberWithSub
        );
      }
      logger.error("Failed to update member", { error });
    },

    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: memberKeys.withSubscription(id),
      });
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

// Update member status mutation with optimistic updates
export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MemberStatus }) =>
      memberUtils.updateMemberStatus(id, status),

    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: memberKeys.detail(id) });
      await queryClient.cancelQueries({
        queryKey: memberKeys.withSubscription(id),
      });

      // Snapshot previous value
      const previousMember = queryClient.getQueryData<Member>(
        memberKeys.detail(id)
      );
      const previousMemberWithSub = queryClient.getQueryData<Member>(
        memberKeys.withSubscription(id)
      );

      // Optimistically update individual member
      if (previousMember) {
        queryClient.setQueryData(memberKeys.detail(id), {
          ...previousMember,
          status,
          updated_at: formatTimestampForDatabase(),
        });
      }

      // Optimistically update withSubscription query
      if (previousMemberWithSub) {
        queryClient.setQueryData(memberKeys.withSubscription(id), {
          ...previousMemberWithSub,
          status,
          updated_at: formatTimestampForDatabase(),
        });
      }

      // Update in all member lists (handle both regular arrays and infinite query structures)
      queryClient.setQueriesData(
        { queryKey: memberKeys.lists() },
        (oldData: Member[] | { pages: Member[][] } | undefined) => {
          if (!oldData) return oldData;

          // Handle infinite query structure
          if ("pages" in oldData && Array.isArray(oldData.pages)) {
            return {
              ...oldData,
              pages: oldData.pages.map((page) =>
                page.map((member) =>
                  member.id === id ? { ...member, status } : member
                )
              ),
            };
          }

          // Handle regular array structure
          if (Array.isArray(oldData)) {
            return oldData.map((member) =>
              member.id === id ? { ...member, status } : member
            );
          }

          // Return unchanged if unknown structure
          return oldData;
        }
      );

      return { previousMember, previousMemberWithSub };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousMember) {
        queryClient.setQueryData(memberKeys.detail(id), context.previousMember);
      }
      if (context?.previousMemberWithSub) {
        queryClient.setQueryData(
          memberKeys.withSubscription(id),
          context.previousMemberWithSub
        );
      }
      logger.error("Failed to update member status", { error });
    },

    onSuccess: () => {
      // Invalidate status counts since they changed
      queryClient.invalidateQueries({ queryKey: memberKeys.countByStatus() });
    },

    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: memberKeys.withSubscription(id),
      });
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

// Bulk update status mutation
export function useBulkUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberIds,
      status,
    }: {
      memberIds: string[];
      status: MemberStatus;
    }) => memberUtils.bulkUpdateStatus(memberIds, status),

    onMutate: async ({ memberIds, status }) => {
      // Cancel all relevant queries
      await queryClient.cancelQueries({ queryKey: memberKeys.lists() });

      // Optimistically update all affected members in lists (handle both regular arrays and infinite query structures)
      queryClient.setQueriesData(
        { queryKey: memberKeys.lists() },
        (oldData: Member[] | { pages: Member[][] } | undefined) => {
          if (!oldData) return oldData;

          const updateMember = (member: Member) =>
            memberIds.includes(member.id)
              ? { ...member, status, updated_at: formatTimestampForDatabase() }
              : member;

          // Handle infinite query structure
          if ("pages" in oldData && Array.isArray(oldData.pages)) {
            return {
              ...oldData,
              pages: oldData.pages.map((page) => page.map(updateMember)),
            };
          }

          // Handle regular array structure
          if (Array.isArray(oldData)) {
            return oldData.map(updateMember);
          }

          // Return unchanged if unknown structure
          return oldData;
        }
      );

      // Update individual member caches too
      memberIds.forEach((id) => {
        queryClient.setQueryData(
          memberKeys.detail(id),
          (oldMember: Member | undefined) =>
            oldMember ? { ...oldMember, status } : undefined
        );
      });
    },

    onError: (error) => {
      logger.error("Failed to bulk update member status", { error });
    },

    onSuccess: () => {
      // Invalidate all member-related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

// Delete member mutation
export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memberUtils.deleteMember,
    onMutate: async (id: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: memberKeys.detail(id) });

      // Snapshot previous value
      const previousMember = queryClient.getQueryData<Member>(
        memberKeys.detail(id)
      );

      // Remove from cache optimistically
      queryClient.removeQueries({ queryKey: memberKeys.detail(id) });

      // Remove from lists (handle both regular arrays and infinite query structures)
      queryClient.setQueriesData(
        { queryKey: memberKeys.lists() },
        (oldData: Member[] | { pages: Member[][] } | undefined) => {
          if (!oldData) return oldData;

          // Handle infinite query structure
          if ("pages" in oldData && Array.isArray(oldData.pages)) {
            return {
              ...oldData,
              pages: oldData.pages.map((page) =>
                page.filter((member) => member.id !== id)
              ),
            };
          }

          // Handle regular array structure
          if (Array.isArray(oldData)) {
            return oldData.filter((member) => member.id !== id);
          }

          // Return unchanged if unknown structure
          return oldData;
        }
      );

      return { previousMember };
    },

    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousMember) {
        queryClient.setQueryData(memberKeys.detail(id), context.previousMember);
      }
      logger.error("Failed to delete member", { error });
    },

    onSuccess: () => {
      // Invalidate counts
      queryClient.invalidateQueries({ queryKey: memberKeys.count() });
      queryClient.invalidateQueries({ queryKey: memberKeys.countByStatus() });
    },

    onSettled: () => {
      // Ensure lists are fresh
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

// Infinite scroll hook for large member lists
export function useMembersInfinite(
  filters: Omit<MemberFilters, "limit" | "offset"> = {},
  pageSize = 20
) {
  return useInfiniteQuery({
    queryKey: [...memberKeys.list(filters), "infinite"],
    queryFn: ({ pageParam = 0 }) =>
      memberUtils.getMembers({
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

// Prefetch members for pagination
export function useMembersPrefetch() {
  const queryClient = useQueryClient();

  const prefetchPage = (
    filters: MemberFilters,
    pageNumber: number,
    pageSize = 20
  ) => {
    return queryClient.prefetchQuery({
      queryKey: memberKeys.list({
        ...filters,
        limit: pageSize,
        offset: pageNumber * pageSize,
      }),
      queryFn: () =>
        memberUtils.getMembers({
          ...filters,
          limit: pageSize,
          offset: pageNumber * pageSize,
        }),
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchPage };
}

// Export functionality
interface UseExportMembersReturn {
  isExporting: boolean;
  exportMembers: (members: Member[]) => Promise<void>;
  exportCount: number;
}

/**
 * Hook for exporting members to CSV with loading states and error handling
 */
export function useExportMembers(): UseExportMembersReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportCount, setExportCount] = useState(0);

  const exportMembers = useCallback(
    async (members: Member[]) => {
      if (isExporting) return; // Prevent multiple simultaneous exports

      if (!members || members.length === 0) {
        toast.error("No members to export", {
          description:
            "The member list is empty or no members match your current filters.",
        });
        return;
      }

      setIsExporting(true);
      setExportCount(members.length);

      try {
        // Add a small delay to show loading state for better UX
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Perform the CSV export
        exportMembersToCSV(members);

        // Show success notification
        toast.success("Export completed successfully", {
          description: `${members.length} member${
            members.length !== 1 ? "s" : ""
          } exported to CSV file.`,
        });
      } catch (error) {
        logger.error("Export failed", { error });

        toast.error("Export failed", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while exporting members.",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting]
  );

  return {
    isExporting,
    exportMembers,
    exportCount,
  };
}

// Simplified bulk operations (essential functionality only)
export interface BulkOperationResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
}

/**
 * Simplified bulk delete members hook
 */
export function useBulkDeleteMembers() {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const bulkDelete = useCallback(
    async (memberIds: string[]): Promise<BulkOperationResult> => {
      if (isDeleting || memberIds.length === 0) {
        return {
          successful: [],
          failed: [],
          totalProcessed: 0,
          totalSuccessful: 0,
          totalFailed: 0,
        };
      }

      setIsDeleting(true);
      const result: BulkOperationResult = {
        successful: [],
        failed: [],
        totalProcessed: 0,
        totalSuccessful: 0,
        totalFailed: 0,
      };

      try {
        // Process deletions sequentially to avoid overwhelming the database
        for (const id of memberIds) {
          try {
            await memberUtils.deleteMember(id);
            result.successful.push(id);
          } catch (error) {
            result.failed.push({
              id,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
          result.totalProcessed++;
        }

        result.totalSuccessful = result.successful.length;
        result.totalFailed = result.failed.length;

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: memberKeys.all });

        return result;
      } finally {
        setIsDeleting(false);
      }
    },
    [isDeleting, queryClient]
  );

  return {
    bulkDelete,
    isDeleting,
  };
}

// ============================================================================
// DEBOUNCED SEARCH (merged from use-member-search.ts)
// ============================================================================

/**
 * Custom hook for debounced member search with loading states
 * Merged from use-member-search.ts for consolidation
 */
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

// ============================================================================
// MEMBER VALIDATION (merged from use-member-search.ts)
// ============================================================================

/**
 * Hook for member validation during forms
 * Merged from use-member-search.ts for consolidation
 */
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
                member.email?.toLowerCase() === email.toLowerCase() &&
                member.id !== excludeId
            );
            if (exists) return true;
          }
        }

        // If not found in cache, check database
        return await memberUtils.checkEmailExists(email, excludeId);
      } catch (error) {
        logger.error("Error checking email:", { error });
        return false;
      }
    },
    [queryClient]
  );

  return {
    checkEmailExists,
  };
}

// ============================================================================
// MEMBER PREFETCH (merged from use-member-search.ts)
// ============================================================================

/**
 * Hook for prefetching member details (useful for hover cards, navigation)
 * Merged from use-member-search.ts for consolidation
 */
export function useMemberPrefetch() {
  const queryClient = useQueryClient();

  const prefetchMember = useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: memberKeys.detail(id),
        queryFn: () => memberUtils.getMemberById(id),
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    },
    [queryClient]
  );

  const prefetchMemberWithSubscription = useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: memberKeys.withSubscription(id),
        queryFn: () => memberUtils.getMemberWithSubscription(id),
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
        if (members && Array.isArray(members)) {
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
        queryFn: () => memberUtils.getMemberWithSubscription(id),
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
        if (members && Array.isArray(members)) {
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
        if (members && Array.isArray(members)) {
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

// ============================================================================
// MEMBER CACHE UTILITIES (merged from use-member-search.ts)
// ============================================================================

/**
 * Hook for member cache invalidation and management utilities
 * Merged from use-member-search.ts for consolidation
 */
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
    prefetchMember: (id: string) =>
      queryClient.prefetchQuery({
        queryKey: memberKeys.detail(id),
        queryFn: () => memberUtils.getMemberById(id),
        staleTime: 10 * 60 * 1000,
      }),
    refreshMemberInBackground,
  };
}

// ============================================================================
// SIMPLE MEMBER FILTERS (merged from use-simple-member-filters.ts)
// ============================================================================

/**
 * Hook for simple member filtering with UI helpers
 * Merged from use-simple-member-filters.ts for consolidation
 */
export function useSimpleMemberFilters() {
  const [filters, setFilters] = useState<SimpleMemberFilters>({
    status: "all",
  });

  const updateFilters = useCallback((newFilters: SimpleMemberFilters) => {
    setFilters(newFilters);
  }, []);

  const updateFilter = useCallback(
    (
      key: keyof SimpleMemberFilters,
      value: SimpleMemberFilters[keyof SimpleMemberFilters]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({
      status: "all",
      memberType: undefined,
      hasActiveSubscription: undefined,
      hasUpcomingSessions: undefined,
      hasOutstandingBalance: undefined,
    });
  }, []);

  // Convert simple filters to database-compatible format
  const databaseFilters = useMemo(() => {
    const dbFilters: {
      status?: MemberStatus;
      memberType?: MemberType;
      hasActiveSubscription?: boolean;
      hasUpcomingSessions?: boolean;
      hasOutstandingBalance?: boolean;
    } = {};

    // Status filter
    if (filters.status && filters.status !== "all") {
      dbFilters.status = filters.status as MemberStatus;
    }

    // Member type filter
    if (filters.memberType) {
      dbFilters.memberType = filters.memberType;
    }

    // Active subscription filter
    if (filters.hasActiveSubscription !== undefined) {
      dbFilters.hasActiveSubscription = filters.hasActiveSubscription;
    }

    // Upcoming sessions filter
    if (filters.hasUpcomingSessions !== undefined) {
      dbFilters.hasUpcomingSessions = filters.hasUpcomingSessions;
    }

    // Outstanding balance filter
    if (filters.hasOutstandingBalance !== undefined) {
      dbFilters.hasOutstandingBalance = filters.hasOutstandingBalance;
    }

    return dbFilters;
  }, [filters]);

  // Get a human-readable summary of active filters
  const getFilterSummary = useCallback(() => {
    const summary: string[] = [];

    if (filters.status && filters.status !== "all") {
      summary.push(`Status: ${filters.status}`);
    }

    if (filters.memberType) {
      summary.push(`Type: ${filters.memberType}`);
    }

    if (filters.hasActiveSubscription !== undefined) {
      summary.push(
        `Subscription: ${filters.hasActiveSubscription ? "Active" : "None"}`
      );
    }

    if (filters.hasUpcomingSessions !== undefined) {
      summary.push(
        `Sessions: ${filters.hasUpcomingSessions ? "Has Upcoming" : "No Upcoming"}`
      );
    }

    if (filters.hasOutstandingBalance !== undefined) {
      summary.push(
        `Balance: ${filters.hasOutstandingBalance ? "Has Balance" : "Fully Paid"}`
      );
    }

    return summary;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.status !== undefined && filters.status !== "all") ||
      filters.memberType !== undefined ||
      filters.hasActiveSubscription !== undefined ||
      filters.hasUpcomingSessions !== undefined ||
      filters.hasOutstandingBalance !== undefined
    );
  }, [filters]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status !== "all") count++;
    if (filters.memberType) count++;
    if (filters.hasActiveSubscription !== undefined) count++;
    if (filters.hasUpcomingSessions !== undefined) count++;
    if (filters.hasOutstandingBalance !== undefined) count++;
    return count;
  }, [filters]);

  // Quick filter helpers
  const setStatusFilter = useCallback(
    (status: SimpleMemberFilters["status"]) => {
      setFilters((prev) => ({ ...prev, status }));
    },
    []
  );

  const setMemberTypeFilter = useCallback(
    (memberType: SimpleMemberFilters["memberType"]) => {
      setFilters((prev) => ({ ...prev, memberType }));
    },
    []
  );

  const setSubscriptionFilter = useCallback(
    (hasActiveSubscription: boolean | undefined) => {
      setFilters((prev) => ({ ...prev, hasActiveSubscription }));
    },
    []
  );

  const setSessionsFilter = useCallback(
    (hasUpcomingSessions: boolean | undefined) => {
      setFilters((prev) => ({ ...prev, hasUpcomingSessions }));
    },
    []
  );

  const setBalanceFilter = useCallback(
    (hasOutstandingBalance: boolean | undefined) => {
      setFilters((prev) => ({ ...prev, hasOutstandingBalance }));
    },
    []
  );

  // Common filter presets
  const applyPreset = useCallback(
    (presetName: string) => {
      switch (presetName) {
        case "active-members":
          setFilters({
            status: "active",
            memberType: undefined,
            hasActiveSubscription: undefined,
            hasUpcomingSessions: undefined,
            hasOutstandingBalance: undefined,
          });
          break;
        case "trial-members":
          setFilters({
            status: "all",
            memberType: "trial",
            hasActiveSubscription: undefined,
            hasUpcomingSessions: undefined,
            hasOutstandingBalance: undefined,
          });
          break;
        case "active-subscribers":
          setFilters({
            status: "active",
            memberType: undefined,
            hasActiveSubscription: true,
            hasUpcomingSessions: undefined,
            hasOutstandingBalance: undefined,
          });
          break;
        case "outstanding-balance":
          setFilters({
            status: "all",
            memberType: undefined,
            hasActiveSubscription: undefined,
            hasUpcomingSessions: undefined,
            hasOutstandingBalance: true,
          });
          break;
        default:
          resetFilters();
      }
    },
    [resetFilters]
  );

  // Filter options for dropdowns
  const filterOptions = useMemo(
    () => ({
      status: [
        { value: "all", label: "All Statuses" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "suspended", label: "Suspended" },
        { value: "pending", label: "Pending" },
      ] as const,
      memberType: [
        { value: "all", label: "All Types" },
        { value: "full", label: "Full Members" },
        { value: "trial", label: "Trial Members" },
        { value: "collaboration", label: "Collaboration" },
      ] as const,
      subscription: [
        { value: "all", label: "All Subscriptions" },
        { value: "yes", label: "Active Subscription" },
        { value: "no", label: "No Subscription" },
      ] as const,
      sessions: [
        { value: "all", label: "All Sessions" },
        { value: "yes", label: "Has Upcoming" },
        { value: "no", label: "No Upcoming" },
      ] as const,
      balance: [
        { value: "all", label: "All Balances" },
        { value: "yes", label: "Has Balance Due" },
        { value: "no", label: "Fully Paid" },
      ] as const,
    }),
    []
  );

  return {
    filters,
    updateFilters,
    updateFilter,
    resetFilters,
    databaseFilters,
    getFilterSummary,
    hasActiveFilters,
    activeFilterCount,
    // Quick filter setters
    setStatusFilter,
    setMemberTypeFilter,
    setSubscriptionFilter,
    setSessionsFilter,
    setBalanceFilter,
    // Presets
    applyPreset,
    // Options for UI components
    filterOptions,
  };
}

// ============================================================================
// MEMBER ACTIVITY METRICS (merged from use-member-activity-metrics.ts)
// ============================================================================

interface ActivityMetrics {
  sessionsThisMonth: number;
  lastSessionDate: Date | null;
  overduePaymentsCount: number;
}

/**
 * Hook for fetching member activity metrics
 * Merged from use-member-activity-metrics.ts for consolidation
 */
export function useMemberActivityMetrics(memberId: string) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  return useQuery({
    queryKey: ["member-activity-metrics", memberId],
    enabled: !!memberId && isAuthenticated && !isAuthLoading,
    queryFn: async (): Promise<ActivityMetrics> => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Sessions this month
      const { count: sessionsCount } = await supabase
        .from("training_sessions")
        .select("*, training_session_members!inner(member_id)", {
          count: "exact",
          head: true,
        })
        .eq("training_session_members.member_id", memberId)
        .eq("status", "completed")
        .gte(
          "scheduled_start",
          new Date(currentYear, currentMonth, 1).toISOString()
        )
        .lt(
          "scheduled_start",
          new Date(currentYear, currentMonth + 1, 1).toISOString()
        );

      // Last session
      const { data: lastSessionData } = await supabase
        .from("training_sessions")
        .select(
          "scheduled_start, status, training_session_members!inner(member_id)"
        )
        .eq("training_session_members.member_id", memberId)
        .eq("status", "completed")
        .order("scheduled_start", { ascending: false })
        .limit(1);

      const lastSession = lastSessionData?.[0] || null;

      // Overdue payments
      const { count: overdueCount } = await supabase
        .from("subscription_payments")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .in("payment_status", ["pending", "failed"])
        .lt("due_date", getLocalDateString(new Date()));

      return {
        sessionsThisMonth: sessionsCount || 0,
        lastSessionDate: lastSession?.scheduled_start
          ? new Date(lastSession.scheduled_start)
          : null,
        overduePaymentsCount: overdueCount || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

// ============================================================================
// COLLABORATION MEMBER CONVERSION (merged from use-convert-collaboration-member.ts)
// ============================================================================

/**
 * Hook for converting collaboration members to full members
 * Merged from use-convert-collaboration-member.ts for consolidation
 */
export function useConvertCollaborationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ConvertCollaborationMemberInput) =>
      convertCollaborationMember(input),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate all member queries
        queryClient.invalidateQueries({ queryKey: memberKeys.all });
        if (result.member?.id) {
          queryClient.invalidateQueries({
            queryKey: memberKeys.detail(result.member.id),
          });
        }
      }
    },
    onError: (error) => {
      const message = getUserFriendlyErrorMessage(error, {
        operation: "update",
        resource: "member",
      });

      logger.error("Failed to convert collaboration member", {
        error: error instanceof Error ? error.message : String(error),
      });

      toast.error(message);
    },
  });
}
