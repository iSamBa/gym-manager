# Hook Architecture Documentation

## Overview

This document describes the hook organization in the gym-manager application, following React best practices and CLAUDE.md standards.

**Total Hooks**: 31 (across 9 features)
**Target**: Maximum 4 hooks per feature (guideline, not rigid rule)
**Philosophy**: Consolidate related functionality, avoid over-specialization

## Hook Organization Standards

### Guideline: Maximum 4 Hooks Per Feature

The 4-hook guideline aims to prevent **hook proliferation** - having many tiny, overlapping hooks doing similar things. However, this is a pragmatic guideline, not a rigid rule.

**✅ GOOD Reasons for Multiple Hooks:**

- Distinct responsibilities (CRUD vs Analytics vs Form Management)
- Different data sources or query patterns
- Clear separation of concerns
- Each hook serves a unique purpose

**❌ BAD Hook Patterns:**

- Over-specialized hooks (useMemberCount, useMemberExport for tiny operations)
- Duplicate logic across multiple hooks
- Hooks that could easily be combined into one
- Tiny hooks that just wrap a single operation

## Current Hook Distribution

| Feature           | Hooks  | Status   | Notes                                   |
| ----------------- | ------ | -------- | --------------------------------------- |
| Settings          | 7      | ⚠️       | Complex feature with distinct concerns  |
| Dashboard         | 5      | ⚠️       | Analytics hooks serve different metrics |
| Members           | 5      | ⚠️       | Well-separated responsibilities         |
| Trainers          | 3      | ✅       | Compliant                               |
| Training Sessions | 3      | ✅       | Compliant                               |
| Memberships       | 3      | ✅       | Compliant                               |
| Payments          | 2      | ✅       | Compliant                               |
| Invoices          | 2      | ✅       | Compliant                               |
| Database          | 1      | ✅       | Compliant                               |
| **TOTAL**         | **31** | **Good** | Pragmatically organized                 |

### Why Features Are Over the "Limit"

**Settings (7 hooks)**:

- `use-studio-settings` - Base CRUD hook for all settings
- `use-general-settings` - Business info + logo upload (wraps base)
- `use-invoice-settings` - Invoice configuration (wraps base)
- `use-planning-settings` - Planning parameters (direct DB)
- `use-opening-hours` - Opening hours by date (direct DB)
- `use-multi-site-sessions` - Multi-site data (direct DB)
- `use-conflict-detection` - Session conflicts (direct DB)

**Rationale**: Each hook serves a distinct purpose. Settings is a complex feature managing different concerns (business config, scheduling, conflicts). Forcing consolidation would create artificial coupling.

**Dashboard (5 hooks)**:

- `use-member-analytics` - Member statistics and metrics
- `use-members-without-reservations` - Specific member subset
- `use-monthly-activity` - Monthly activity charts
- `use-recent-activities` - Activity feed
- `use-weekly-sessions` - Weekly session statistics

**Rationale**: Dashboard aggregates different analytics. Each hook fetches different metrics for different widgets. Consolidating would create a massive, unfocused hook.

**Members (5 hooks)**:

- `use-members` - Main CRUD operations (42KB - already consolidated!)
- `use-auto-inactivation` - Automatic member status management
- `use-body-checkups` - Body composition tracking
- `use-member-comments` - Comment system
- `use-member-page-data` - Page-specific data aggregation

**Rationale**: One large consolidated hook for CRUD + 4 specialized hooks for distinct features. This follows good separation of concerns.

## Hook Patterns

### 1. CRUD Hook Pattern

Main hook for entity CRUD operations with search, export, and mutations.

```typescript
// ✅ GOOD: Consolidated CRUD hook
export function useMembers(options?: UseMembersOptions) {
  const query = useInfiniteQuery(['members'], fetchMembers);
  const createMutation = useMutation(createMember);
  const updateMutation = useMutation(updateMember);
  const deleteMutation = useMutation(deleteMember);

  return {
    // Query state
    members: query.data,
    isLoading: query.isLoading,
    // Mutations
    createMember: createMutation.mutateAsync,
    updateMember: updateMutation.mutateAsync,
    deleteMember: deleteMutation.mutateAsync,
    // Actions
    exportToCSV: useCallback(...),
    search: useCallback(...),
  };
}
```

### 2. Analytics Hook Pattern

Separate hooks for different analytics/metrics to avoid massive bloated hooks.

```typescript
// ✅ GOOD: Focused analytics hooks
export function useMemberAnalytics() {
  // Member-specific stats
}

export function useWeeklySessions() {
  // Weekly session metrics
}

// ❌ BAD: Everything in one hook
export function useDashboard() {
  // 500 lines of mixed analytics...
}
```

### 3. Form Management Hook Pattern

Dedicated hooks for complex form state and validation.

```typescript
// ✅ GOOD: Focused form hook
export function useSubscriptionForm() {
  const form = useForm<SubscriptionFormData>(...);
  const validation = useSubscriptionValidation();

  return {
    form,
    validation,
    handleSubmit,
  };
}
```

### 4. Wrapper Hook Pattern

Light wrappers around base hooks to provide domain-specific interfaces.

```typescript
// ✅ GOOD: Specific wrapper around base hook
export function useGeneralSettings() {
  const { data, updateSettings } = useStudioSettings("general_settings");

  const uploadLogo = useCallback(...);
  const deleteLogo = useCallback(...);

  return {
    settings: data?.setting_value,
    uploadLogo,
    deleteLogo,
  };
}
```

## Barrel Exports

All feature hooks are exported via barrel exports for clean imports:

```typescript
// ❌ BAD: Long import paths
import { useMembers } from "@/features/members/hooks/use-members";
import { useMemberComments } from "@/features/members/hooks/use-member-comments";

// ✅ GOOD: Clean barrel export imports
import { useMembers, useMemberComments } from "@/features/members/hooks";
```

**Available Barrel Exports:**

- `@/features/settings/hooks` (7 hooks)
- `@/features/dashboard/hooks` (5 hooks)
- `@/features/members/hooks` (5 hooks)
- `@/features/trainers/hooks` (3 hooks)
- `@/features/training-sessions/hooks` (3 hooks)
- `@/features/memberships/hooks` (3 hooks)
- `@/features/payments/hooks` (2 hooks)
- `@/features/invoices/hooks` (2 hooks)
- `@/features/database/hooks` (1 hook)

## Performance Considerations

### React.memo with useCallback

All event handlers in hooks should use `useCallback` to prevent unnecessary re-renders:

```typescript
export function useMembers() {
  const handleCreate = useCallback(
    async (data: MemberFormData) => {
      // Implementation
    },
    [dependencies]
  );

  return { createMember: handleCreate };
}
```

### useMemo for Expensive Computations

Memoize expensive transformations:

```typescript
export function useMemberAnalytics() {
  const processedData = useMemo(() => {
    return members.map((member) => calculateMetrics(member));
  }, [members]);

  return { analytics: processedData };
}
```

## Testing Standards

### Hook Testing Pattern

Use `@testing-library/react-hooks` for hook tests:

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useMembers } from "./use-members";

describe("useMembers", () => {
  it("should fetch members on mount", async () => {
    const { result } = renderHook(() => useMembers());

    await waitFor(() => {
      expect(result.current.members).toBeDefined();
    });
  });
});
```

## Anti-Patterns to Avoid

### ❌ Over-Specialized Hooks

```typescript
// ❌ BAD: Too specialized
export function useMemberCount() {
  return useQuery(['member-count'], fetchMemberCount);
}

export function useMemberExport() {
  return useMutation(exportMembers);
}

// ✅ GOOD: Consolidated
export function useMembers() {
  const query = useQuery(['members'], fetchMembers);
  const count = useMemo(() => query.data?.length ?? 0, [query.data]);
  const exportMembers = useCallback(...);

  return { members: query.data, count, exportMembers };
}
```

### ❌ Duplicate Logic

```typescript
// ❌ BAD: Duplicate query logic
export function useActiveMembers() {
  return useQuery(["active-members"], () => fetchMembers({ status: "active" }));
}

export function useInactiveMembers() {
  return useQuery(["inactive-members"], () =>
    fetchMembers({ status: "inactive" })
  );
}

// ✅ GOOD: Single hook with filters
export function useMembers(filters?: MemberFilters) {
  return useQuery(["members", filters], () => fetchMembers(filters));
}
```

## Migration Guide

### Adding a New Hook

1. Create hook file: `src/features/[feature]/hooks/use-[name].ts`
2. Follow hook naming convention: `use[PascalCase]`
3. Add JSDoc documentation
4. Export from barrel file: `src/features/[feature]/hooks/index.ts`
5. Create unit tests: `__tests__/use-[name].test.ts`
6. Update this documentation if needed

### Consolidating Hooks

Before consolidating hooks, ask:

1. Do they serve the same purpose?
2. Do they share query logic?
3. Would consolidation improve or harm clarity?
4. Are they used together frequently?

If yes to most questions → consolidate
If no → keep separate

## Feature-Specific Notes

### Settings Hooks

The Settings feature has 7 hooks because it manages diverse concerns:

- Studio settings persistence (`use-studio-settings`)
- Business configuration (`use-general-settings`, `use-invoice-settings`)
- Schedule management (`use-opening-hours`, `use-planning-settings`)
- Data analysis (`use-multi-site-sessions`, `use-conflict-detection`)

Each hook is used by a different settings tab component. Consolidating would create artificial coupling.

### Dashboard Hooks

Dashboard hooks are intentionally separate to support widget-based architecture:

- Each widget fetches its own metrics
- Widgets can be added/removed independently
- Independent caching per metric type
- Avoids massive "god hook"

### Members Hooks

Members has one large consolidated CRUD hook (`use-members` - 42KB) plus specialized feature hooks:

- Auto-inactivation is a scheduled background process
- Body checkups are optional feature
- Comments are independent feature
- Page data aggregation for detail pages

This follows Single Responsibility Principle well.

## Conclusion

The current hook architecture (31 hooks) is **pragmatically organized** and follows best practices:

✅ No over-specialized hooks
✅ Clear separation of concerns
✅ Consolidated CRUD operations
✅ Focused analytics hooks
✅ Clean barrel exports
✅ Well-tested
✅ Performance optimized

While 3 features slightly exceed the 4-hook guideline, they have legitimate architectural reasons. Forcing strict compliance would harm code quality.

## References

- [React Hooks Best Practices](https://react.dev/reference/react)
- [CLAUDE.md - Hook Organization](../CLAUDE.md#hook-organization)
- [React Query Documentation](https://tanstack.com/query/latest)

---

**Last Updated**: 2025-01-22
**Maintained By**: Development Team
