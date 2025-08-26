import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { memberUtils, type MemberFilters } from "@/features/database/lib/utils";
import type { Member, MemberStatus } from "@/features/database/lib/types";

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
export function useMemberWithSubscription(id: string) {
  return useQuery({
    queryKey: memberKeys.withSubscription(id),
    queryFn: () => memberUtils.getMemberWithSubscription(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
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

// Create member mutation with optimistic updates
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memberUtils.createMember,
    onSuccess: (newMember) => {
      // Invalidate member lists to show the new member
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      queryClient.invalidateQueries({ queryKey: memberKeys.count() });
      queryClient.invalidateQueries({ queryKey: memberKeys.countByStatus() });

      // Optionally set the new member in cache
      queryClient.setQueryData(memberKeys.detail(newMember.id), newMember);
    },
    onError: (error) => {
      console.error("Failed to create member:", error);
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

      // Snapshot previous value
      const previousMember = queryClient.getQueryData<Member>(
        memberKeys.detail(id)
      );

      // Optimistically update
      if (previousMember) {
        queryClient.setQueryData(memberKeys.detail(id), {
          ...previousMember,
          ...data,
          updated_at: new Date().toISOString(),
        });

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
      }

      return { previousMember };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousMember) {
        queryClient.setQueryData(memberKeys.detail(id), context.previousMember);
      }
      console.error("Failed to update member:", error);
    },

    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) });
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

      // Snapshot previous value
      const previousMember = queryClient.getQueryData<Member>(
        memberKeys.detail(id)
      );

      // Optimistically update individual member
      if (previousMember) {
        queryClient.setQueryData(memberKeys.detail(id), {
          ...previousMember,
          status,
          updated_at: new Date().toISOString(),
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

      return { previousMember };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousMember) {
        queryClient.setQueryData(memberKeys.detail(id), context.previousMember);
      }
      console.error("Failed to update member status:", error);
    },

    onSuccess: () => {
      // Invalidate status counts since they changed
      queryClient.invalidateQueries({ queryKey: memberKeys.countByStatus() });
    },

    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) });
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
              ? { ...member, status, updated_at: new Date().toISOString() }
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
      console.error("Failed to bulk update member status:", error);
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
      console.error("Failed to delete member:", error);
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
