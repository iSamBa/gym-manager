// Main member hooks - consolidated and optimized
export {
  // Core CRUD operations
  useMembers,
  useMember,
  useMemberWithSubscription,
  useSearchMembers,
  useMembersByStatus,
  useMemberCount,
  useMemberCountByStatus,
  useNewMembersThisMonth,
  useCreateMember,
  useUpdateMember,
  useUpdateMemberStatus,
  useBulkUpdateMemberStatus,
  useDeleteMember,
  useMembersInfinite,
  useMembersPrefetch,
  // Export functionality (merged from use-export-members)
  useExportMembers,
  // Simplified bulk operations (essential functionality only)
  useBulkDeleteMembers,
  type BulkOperationResult,
  // Query key factory
  memberKeys,
} from "./use-members";

// Core search functionality
export {
  useDebouncedMemberSearch,
  useMemberValidation,
  useMemberPrefetch,
  useMemberCacheUtils,
} from "./use-member-search";

// Simple filtering (used in pages)
export { useSimpleMemberFilters } from "./use-simple-member-filters";

// Activity metrics (US-007)
export { useMemberActivityMetrics } from "./use-member-activity-metrics";
