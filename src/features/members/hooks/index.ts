// ============================================================================
// CONSOLIDATED MEMBER HOOKS - Performance Optimization Phase 2
// ============================================================================
// All member CRUD, search, filtering, metrics, and conversion functionality
// has been consolidated into use-members.ts for better performance and
// maintainability. Hook count reduced from 10 → 4.
//
// Consolidation completed: 2025-11-07
// ============================================================================

export {
  // ========== CORE CRUD OPERATIONS ==========
  useMembers,
  useMember,
  useMemberWithSubscription,
  useSearchMembers,
  useMembersByStatus,
  useMemberCount,
  useMemberCountByStatus,
  useNewMembersThisMonth,
  useCollaborationMemberCount,
  useCreateMember,
  useUpdateMember,
  useUpdateMemberStatus,
  useBulkUpdateMemberStatus,
  useDeleteMember,
  useMembersInfinite,
  useMembersPrefetch,

  // ========== EXPORT & BULK OPERATIONS ==========
  useExportMembers,
  useBulkDeleteMembers,
  type BulkOperationResult,

  // ========== SEARCH & VALIDATION ==========
  // (merged from use-member-search.ts)
  useDebouncedMemberSearch,
  useMemberValidation,
  useMemberPrefetch,
  useMemberCacheUtils,

  // ========== FILTERING ==========
  // (merged from use-simple-member-filters.ts)
  useSimpleMemberFilters,

  // ========== ACTIVITY METRICS ==========
  // (merged from use-member-activity-metrics.ts)
  useMemberActivityMetrics,

  // ========== COLLABORATION CONVERSION ==========
  // (merged from use-convert-collaboration-member.ts)
  useConvertCollaborationMember,

  // ========== QUERY KEY FACTORY ==========
  memberKeys,
} from "./use-members";

// Member comments (US-010)
export {
  useMemberComments,
  useActiveCommentAlerts,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from "./use-member-comments";

// Body checkups (US-002)
export { useBodyCheckups } from "./use-body-checkups";

// Auto-inactivation (US-005)
export {
  useInactivationCandidates,
  useRunAutoInactivation,
  useReactivateMember,
} from "./use-auto-inactivation";

// Consolidated member page data (Performance optimization)
export {
  useMemberPageData,
  memberPageDataKeys,
  type MemberPageFilters,
  type MemberPageData,
} from "./use-member-page-data";
