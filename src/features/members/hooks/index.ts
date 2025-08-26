// Main member hooks
export {
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
  memberKeys,
} from "./use-members";

// Search and validation utilities
export {
  useDebouncedMemberSearch,
  useMemberValidation,
  useMemberPrefetch,
  useMemberCacheUtils,
} from "./use-member-search";

// Advanced search and filtering
export {
  useMemberSearchHistory,
  useAdvancedMemberSearch,
  useMemberSearchSuggestions,
  useSearchAnalytics,
  useAdvancedDebouncedSearch,
  type AdvancedMemberFilters,
} from "./use-advanced-search";

export {
  useMemberFilters,
  type MemberFilterState,
  type FilterPreset,
} from "./use-member-filters";

// Bulk operations and selection
export {
  useBulkSelection,
  useCrossPageSelection,
  useSelectionAnalytics,
  type BulkSelectionOptions,
} from "./use-bulk-selection";

export {
  useBulkUpdateMembers,
  useBulkDeleteMembers,
  useBulkExportMembers,
  useBulkUpdateMemberStatusEnhanced,
  type BulkOperationResult,
  type BulkOperationProgress,
} from "./use-bulk-operations";

// Real-time features and live updates
export {
  useRealtimeMembers,
  useMemberConflictResolution,
  useMemberPresence,
  type RealtimeConnectionStatus,
  type MemberChangeEvent,
} from "./use-realtime-members";

export {
  useBackgroundSync,
  useUserActivityTracking,
  useSyncConflictResolution,
  type NetworkStatus,
  type BackgroundSyncConfig,
  type SyncStatus,
} from "./use-background-sync";

export {
  useMemberNotifications,
  useNotificationPreferences,
  useNotificationSounds,
  type NotificationType,
  type NotificationConfig,
  type MemberNotification,
} from "./use-member-notifications";

// Advanced query patterns and composition
export {
  useMemberWithRelations,
  useMemberAnalytics,
  useMemberDashboard,
  useDependentMemberQueries,
  useMultipleMemberQueries,
  useConditionalMemberQueries,
  useOrchestatedMemberQueries,
  type MemberWithRelations,
  type MemberAnalytics,
  type MemberDashboardData,
} from "./use-composed-queries";

// Route-based cache management
export {
  useRouteCacheManager,
  usePageCacheStrategy,
} from "./use-route-cache-manager";
