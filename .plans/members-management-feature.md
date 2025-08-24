# Comprehensive Members Management Feature Plan

**Updated with TanStack Query Integration**

## Architecture Overview

**Database Strategy**: Supabase queries wrapped in TanStack Query hooks
**Caching Strategy**: TanStack Query with intelligent invalidation
**State Management**: Query state + optimistic updates
**Testing Strategy**: Vitest + MSW + TanStack Query testing utilities
**UI Strategy**: shadcn/ui components with real-time data sync

## Phase 1: Query Layer & Database Foundation (Week 1)

### 1.1 Enhanced Database Utilities

- **Extend** `src/features/database/lib/utils.ts` with member operations:
  - `getMembers(filters)` - Filterable member queries
  - `getMemberById(id)` - Single member fetch
  - `createMember(data)` - Member creation
  - `updateMember(id, data)` - Member updates
  - `updateMemberStatus(id, status)` - Status changes
  - `searchMembers(query)` - Full-text search
- **Unit tests** for all database utilities (>90% coverage)

### 1.2 TanStack Query Hooks Layer

- **Create** `src/features/members/hooks/`:
  - `useMembers(filters)` - Cached members list with filtering
  - `useMember(id)` - Single member with automatic refetch
  - `useCreateMember()` - Mutation with cache invalidation
  - `useUpdateMember()` - Optimistic updates
  - `useUpdateMemberStatus()` - Instant status changes
  - `useDeleteMember()` - Soft delete with rollback
  - `useSearchMembers(query)` - Debounced search with caching

### 1.3 Query Configuration

```typescript
// Optimized cache times for member data
const MEMBER_QUERIES = {
  list: ["members"], // 5min stale (from global config)
  detail: (id) => ["member", id], // 10min stale for individual
  search: (query) => ["members", "search", query], // 2min stale
};
```

## Phase 2: Core Components with Real-time Updates (Week 2)

### 2.1 Smart Components

- **MemberTable** - Auto-refreshing table with:
  - Real-time status updates via optimistic mutations
  - Instant search with debounced queries
  - Background refetching indicators
  - Error boundaries for failed requests
- **MemberCard** - Live status badges with instant updates
- **MemberForm** - Optimistic form submissions with rollback
- **MemberStatusBadge** - Real-time status reflection
- **Component tests** with MSW for API mocking

### 2.2 Advanced Table Features

- **Infinite scroll** using `useInfiniteQuery`
- **Smart pagination** with prefetching next page
- **Column sorting** with cached results
- **Bulk selections** with optimistic batch updates

## Phase 3: User Interface & Workflows (Week 3)

### 3.1 Core Pages with Live Data

- **Members List** (`/members`)
  - Auto-refreshing member list
  - Real-time search results
  - Background sync indicators
  - Optimistic status toggles
- **Member Detail** (`/members/[id]`)
  - Live member data updates
  - Automatic emergency contact sync
  - Real-time subscription status
- **Create/Edit Member** (`/members/new`, `/members/[id]/edit`)
  - Optimistic form updates
  - Instant validation feedback
  - Smart form caching (draft persistence)

### 3.2 Performance Optimizations

- **Prefetching strategies** for common navigation paths
- **Background refetching** for active pages
- **Query deduplication** for concurrent requests
- **Smart cache invalidation** patterns

## Phase 4: Advanced Data Operations (Week 4)

### 4.1 Search & Filter System with Caching

```typescript
// Debounced search with intelligent caching
export function useSearchMembers() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["members", "search", debouncedQuery],
    queryFn: () => memberUtils.searchMembers(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 2 * 60 * 1000, // 2min for search results
  });
}
```

### 4.2 Bulk Operations with Optimistic Updates

- **Bulk status changes** with optimistic UI updates
- **Batch mutations** with automatic rollback on failure
- **Progress tracking** for long-running operations
- **Smart error recovery** with partial success handling

### 4.3 Real-time Features

- **Live member count** updates
- **Status change notifications** via cache updates
- **Background sync** for member list freshness
- **Conflict resolution** for concurrent edits

## Phase 5: Analytics & Advanced Features (Week 5)

### 5.1 Cached Analytics Queries

```typescript
export function useMemberAnalytics() {
  return useQuery({
    queryKey: ["members", "analytics"],
    queryFn: memberUtils.getAnalytics,
    staleTime: 15 * 60 * 1000, // 15min for analytics
    refetchOnWindowFocus: false, // Don't refetch analytics on focus
  });
}
```

### 5.2 Export & Reporting with Background Processing

- **Cached report generation** with progress tracking
- **Background exports** using mutations
- **Smart data fetching** for large datasets
- **Progressive loading** for complex reports

## Technical Implementation Details

### Query Hook Patterns

```typescript
// Base member queries
export function useMembers(filters: MemberFilters = {}) {
  return useQuery({
    queryKey: ["members", filters],
    queryFn: () => memberUtils.getMembers(filters),
    placeholderData: keepPreviousData, // Smooth filter transitions
  });
}

// Optimistic mutations
export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MemberStatus }) =>
      memberUtils.updateStatus(id, status),

    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(["member", id]);

      // Snapshot previous value
      const previousMember = queryClient.getQueryData(["member", id]);

      // Optimistically update
      queryClient.setQueryData(["member", id], (old: any) => ({
        ...old,
        status,
        updated_at: new Date().toISOString(),
      }));

      // Update in members list too
      queryClient.setQueryData(["members"], (old: any) =>
        old?.map((member: any) =>
          member.id === id ? { ...member, status } : member
        )
      );

      return { previousMember };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMember) {
        queryClient.setQueryData(
          ["member", variables.id],
          context.previousMember
        );
      }
    },

    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(["member", id]);
      queryClient.invalidateQueries(["members"]);
    },
  });
}
```

### Testing Strategy with TanStack Query

```typescript
// Test with MSW + TanStack Query testing utilities
import { renderHook, waitFor } from "@testing-library/react";
import { useMembers } from "../use-members";
import { createTestQueryClient } from "@/test/utils";

test("useMembers returns member data", async () => {
  const { result } = renderHook(() => useMembers(), {
    wrapper: createTestQueryClient(),
  });

  expect(result.current.isLoading).toBe(true);

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.data).toHaveLength(10);
});
```

### Cache Invalidation Strategy

```typescript
// Smart invalidation patterns
const invalidationPatterns = {
  memberCreated: () => ["members"], // Invalidate lists
  memberUpdated: (id) => [["member", id], ["members"]], // Specific + lists
  memberDeleted: (id) => [["member", id], ["members"]], // Remove from cache
  bulkStatusUpdate: () => ["members"], // Invalidate all lists
};
```

### Performance Monitoring

- **Query performance metrics** via TanStack Query DevTools
- **Cache hit rates** monitoring
- **Background fetch tracking**
- **Mutation success/error rates**

## Success Metrics

- **Query Performance**: <100ms average response time
- **Cache Hit Rate**: >80% for repeated queries
- **Optimistic Update Success**: >95% without rollbacks
- **User Experience**: Instant UI feedback, <200ms perceived load time
- **Test Coverage**: >90% for hooks, >85% for components

## Dependencies & Integrations

- **TanStack Query DevTools** for development debugging
- **MSW (Mock Service Worker)** for testing API responses
- **React Hook Form** integration for optimistic form updates
- **Supabase Realtime** consideration for live updates (future phase)

This plan leverages TanStack Query's full potential to create a lightning-fast, responsive member management system with excellent UX and developer experience.
