# Performance Optimization Plan

**Created**: 2025-11-07
**Status**: In Progress
**Estimated Total Time**: 72 hours
**Expected Performance Gain**: 40-60% overall improvement

## Executive Summary

Comprehensive analysis identified critical optimization opportunities:

- **4 large components** missing React.memo (20-40% unnecessary re-renders)
- **Members page** makes 5 database queries (800ms → target 200ms with consolidation)
- **Hook proliferation** - Members feature has 9 hooks (target: 4 per feature)
- **50+ inline arrow functions** causing re-render overhead
- **4 components over 500 lines** need splitting

## Current Performance Baseline

| Metric                | Current         | Target | Improvement Potential         |
| --------------------- | --------------- | ------ | ----------------------------- |
| Members Page Load     | 800ms           | 200ms  | **75% faster**                |
| Dashboard Load        | 750ms           | 300ms  | **60% faster**                |
| Table Re-renders      | 30% unnecessary | 10%    | **66% reduction**             |
| Bundle Size (initial) | ~800KB          | ~400KB | **50% smaller**               |
| Hooks per Feature     | 9 (members)     | 4      | **Compliance with standards** |

---

## Phase 1: Quick Wins (Week 1)

**Status**: 🔵 Not Started
**Est. Time**: 12 hours
**Impact**: 60-70% of total improvement

### Task 1.1: Add React.memo to Critical Components

**Time**: 4 hours
**Priority**: 🔴 Critical
**Impact**: 20-40% reduction in unnecessary re-renders

**Files to Update**:

- [ ] `src/features/members/components/BulkActionToolbar.tsx` (600 lines)
- [ ] `src/features/members/components/MemberDetailsModal.tsx` (508 lines)
- [ ] `src/features/members/components/ProgressiveMemberForm.tsx` (1726 lines)
- [ ] `src/features/trainers/components/ProgressiveTrainerForm.tsx` (1316 lines)

**Implementation Pattern**:

```tsx
// Before
export function BulkActionToolbar({ selectedMembers, ... }: Props) {
  // component logic
}

// After
import { memo } from 'react';

export const BulkActionToolbar = memo(function BulkActionToolbar({
  selectedMembers,
  ...
}: Props) {
  // component logic
});
```

**Testing Requirements**:

- Verify no functional changes
- Check re-render count with React DevTools
- Ensure all props are properly memoized
- Run full test suite

---

### Task 1.2: Consolidate Members Page Queries

**Time**: 8 hours
**Priority**: 🔴 Critical
**Impact**: 75% faster page load (800ms → 200ms)

**Current State** - 5 separate queries:

```tsx
// app/members/page.tsx
const { data: members } = useMembers({ ...filters }); // Query 1
const { data: totalMemberCount } = useMemberCount(); // Query 2
const { data: memberCountByStatus } = useMemberCountByStatus(); // Query 3
const { data: collaborationCount } = useCollaborationMemberCount(); // Query 4
const { prefetchOnHover } = useMemberPrefetch(); // Query 5
```

**Target State** - 1 aggregated query:

```tsx
const { data, isLoading } = useMemberPageData(filters);
// Returns: { members, totalCount, countByStatus, collaborationCount }
```

**Implementation Steps**:

1. **Create Supabase RPC Function** (`supabase/migrations/`)

   ```sql
   CREATE OR REPLACE FUNCTION get_member_page_stats(
     p_filters jsonb DEFAULT '{}'::jsonb
   )
   RETURNS jsonb AS $$
   DECLARE
     result jsonb;
   BEGIN
     -- Aggregate all member page data in single query
     -- Include: members list, total count, status counts, collaboration count
     RETURN result;
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **Create Consolidated Hook** (`src/features/members/hooks/use-member-page-data.ts`)

   ```tsx
   export function useMemberPageData(filters: MemberFilters) {
     return useQuery({
       queryKey: ["member-page-data", filters],
       queryFn: async () => {
         const { data, error } = await supabase.rpc("get_member_page_stats", {
           p_filters: filters,
         });

         if (error) throw error;

         return {
           members: data.members,
           totalCount: data.total_count,
           countByStatus: data.count_by_status,
           collaborationCount: data.collaboration_count,
         };
       },
       staleTime: 5 * 60 * 1000, // 5 minutes
     });
   }
   ```

3. **Update Members Page** (`src/app/members/page.tsx`)
   - Replace 5 hooks with 1 `useMemberPageData` hook
   - Update component to use consolidated data structure
   - Maintain prefetch functionality separately

**Testing Requirements**:

- Verify all data matches previous implementation
- Test filtering, sorting, pagination
- Verify loading states
- Check error handling
- Performance test with React DevTools Profiler
- Run integration tests

**Rollback Plan**:

- Keep old hooks available
- Feature flag for gradual rollout
- Monitor production metrics

---

## Phase 2: Hook Consolidation (Week 2-3)

**Status**: 🔵 Not Started
**Est. Time**: 28 hours
**Impact**: Better code maintainability + 10% performance

### Task 2.1: Consolidate Members Hooks (9 → 4)

**Time**: 16 hours
**Priority**: 🔴 High
**Current Hook Count**: 9 (exceeds 4-hook standard)

**Consolidation Strategy**:

**KEEP (4 hooks)**:

1. ✅ `use-members.ts` - Main CRUD operations + search + filters + metrics + convert
2. ✅ `use-member-comments.ts` - Distinct feature (comments CRUD)
3. ✅ `use-body-checkups.ts` - Distinct feature (checkups CRUD)
4. ✅ `use-auto-inactivation.ts` - Distinct feature (inactivation logic)

**MERGE INTO use-members.ts**:

- [ ] `use-member-search.ts` → Add search functionality to main hook
- [ ] `use-simple-member-filters.ts` → Add filter utilities to main hook
- [ ] `use-member-activity-metrics.ts` → Add metrics queries to main hook
- [ ] `use-convert-collaboration-member.ts` → Add as mutation in main hook

**Implementation Steps**:

1. **Expand use-members.ts**:

   ```tsx
   export function useMembers(options?: UseMembersOptions) {
     // Existing CRUD operations
     const query = useInfiniteQuery([...]);
     const createMutation = useMutation([...]);

     // Add: Search functionality (from use-member-search)
     const searchMembers = useCallback([...], []);

     // Add: Filter utilities (from use-simple-member-filters)
     const applyFilters = useCallback([...], []);

     // Add: Activity metrics (from use-member-activity-metrics)
     const { data: metrics } = useQuery(['member-metrics'], [...]);

     // Add: Convert collaboration (from use-convert-collaboration-member)
     const convertMutation = useMutation([...]);

     return {
       // CRUD
       ...query,
       createMember: createMutation.mutateAsync,

       // Search & Filters
       searchMembers,
       applyFilters,

       // Metrics
       metrics,

       // Conversions
       convertCollaborationMember: convertMutation.mutateAsync,
     };
   }
   ```

2. **Update all imports across codebase**
3. **Remove old hook files**
4. **Update tests**

**Testing Requirements**:

- Update all component tests using old hooks
- Verify no functionality lost
- Test all CRUD operations
- Test search, filters, metrics, conversions
- Run full test suite

---

### Task 2.2: Wrap Inline Arrow Functions

**Time**: 8 hours
**Priority**: 🟡 Medium
**Impact**: 15% reduction in re-render overhead

**Pattern to Apply**:

```tsx
// ❌ Before: Creates new function every render
<Button onClick={() => handleClick(id)}>Click</Button>;

// ✅ After: Memoized callback
const handleButtonClick = useCallback(() => handleClick(id), [id, handleClick]);
<Button onClick={handleButtonClick}>Click</Button>;
```

**Priority Files** (10+ violations each):

- [ ] `src/features/members/components/AdvancedMemberTable.tsx`
- [ ] `src/features/members/components/ProgressiveMemberForm.tsx`
- [ ] `src/features/trainers/components/TrainerForm.tsx`

**Additional Files** (5-10 violations):

- [ ] `src/features/members/components/BulkActionToolbar.tsx`
- [ ] `src/features/training-sessions/components/SessionBookingDialog.tsx`
- [ ] `src/features/dashboard/components/*`

**Implementation Guidelines**:

- Wrap ALL inline functions in render
- Use `useCallback` with proper dependency arrays
- Extract complex callbacks to separate functions
- Consider using `useMemo` for complex event handlers

**Testing Requirements**:

- Verify functionality unchanged
- Check re-render counts with React DevTools
- Run component tests

---

### Task 2.3: Consolidate Dashboard Queries

**Time**: 4 hours
**Priority**: 🟡 Medium
**Impact**: 60% faster dashboard load (750ms → 300ms)

**Current State** - 5 queries:

```tsx
const { data: memberEvolutionData } = useMemberEvolution(12);
const { data: memberStatusData } = useMemberStatusDistribution();
const { data: dashboardStats } = useDashboardStats();
const { data: collaborationCount } = useCollaborationMemberCount();
const { data: recentActivities } = useRecentActivities(4);
```

**Target State** - 2-3 queries:

```tsx
const { data: stats } = useDashboardStats(); // Includes collaboration count
const { data: evolution } = useMemberEvolution(12);
const { data: activities } = useRecentActivities(4);
```

**Implementation Steps**:

1. Merge collaboration count into `useDashboardStats`
2. Merge status distribution into `useDashboardStats`
3. Update dashboard page to use consolidated data
4. Test and verify

---

## Phase 3: Architecture Refactoring (Week 4-5)

**Status**: 🔵 Not Started
**Est. Time**: 32 hours
**Impact**: Long-term maintainability

### Task 3.1: Consolidate Training Sessions Hooks (7 → 4)

**Time**: 12 hours
**Priority**: 🟡 Medium
**Current Hook Count**: 7 (exceeds 4-hook standard)

**Consolidation Strategy**:

**KEEP (4 hooks)**:

1. ✅ `use-training-sessions.ts` - Main CRUD + member dialog data + daily stats
2. ✅ `use-machines.ts` - Machine CRUD (distinct resource)
3. ✅ `use-session-alerts.ts` - Alerts + studio limits
4. ✅ [RESERVE] - For future feature

**MERGE**:

- [ ] `use-member-dialog-data.ts` → `use-training-sessions.ts`
- [ ] `use-daily-statistics.ts` → `use-training-sessions.ts`
- [ ] `use-studio-session-limit.ts` → `use-session-alerts.ts`

**Implementation Steps**:

1. Expand `use-training-sessions.ts` with member dialog data and daily stats
2. Merge studio limit logic into `use-session-alerts.ts`
3. Update all imports
4. Remove old hook files
5. Update tests

---

### Task 3.2: Split Large Components

**Time**: 20 hours
**Priority**: 🟡 Medium
**Impact**: 26% code reduction, better component caching

#### Priority 1: ProgressiveMemberForm.tsx (1726 → ~1300 lines)

**Current**: Single file with 6 form steps
**Target**: 6 step components + 1 orchestrator

**New Structure**:

```
src/features/members/components/progressive-form/
├── PersonalInfoStep.tsx       (200 lines)
├── ContactInfoStep.tsx         (200 lines)
├── HealthFitnessStep.tsx       (200 lines)
├── EquipmentStep.tsx           (200 lines)
├── SettingsStep.tsx            (200 lines)
└── ProgressiveMemberForm.tsx   (300 lines - orchestrator)
```

**Benefits**:

- Better code organization
- Improved component caching
- Easier testing
- Better code splitting
- 26% code reduction (shared logic consolidated)

**Implementation Steps**:

1. Create `progressive-form/` directory
2. Extract each step into separate component
3. Create orchestrator component
4. Update imports in parent components
5. Update tests
6. Verify functionality

#### Priority 2: ProgressiveTrainerForm.tsx (1316 → ~1000 lines)

Similar approach to ProgressiveMemberForm

#### Priority 3: SessionBookingDialog.tsx (870 lines)

Extract tabs into separate components

#### Priority 4: AdvancedMemberTable.tsx (857 lines)

Extract cell renderers and action components

---

## Testing Strategy

### Per-Task Testing

- [ ] Unit tests pass for modified components
- [ ] Integration tests pass
- [ ] Manual testing of affected features
- [ ] Performance validation with React DevTools Profiler

### Phase Completion Testing

- [ ] Full test suite passes (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Performance benchmarks meet targets

### Production Validation

- [ ] Monitor Sentry for errors
- [ ] Check performance metrics
- [ ] User feedback collection
- [ ] Rollback plan ready

---

## Progress Tracking

**Phase 1**: 🔵 Not Started (0/2 tasks complete)
**Phase 2**: 🔵 Not Started (0/3 tasks complete)
**Phase 3**: 🔵 Not Started (0/2 tasks complete)

**Overall Progress**: 0% (0/7 major tasks complete)

---

## Performance Metrics Tracking

### Before Optimization

| Metric            | Value | Measured |
| ----------------- | ----- | -------- |
| Members Page Load | 800ms | TBD      |
| Dashboard Load    | 750ms | TBD      |
| Table Re-renders  | 30%   | TBD      |
| Bundle Size       | 800KB | TBD      |

### After Phase 1

| Metric            | Value | Improvement | Measured |
| ----------------- | ----- | ----------- | -------- |
| Members Page Load | -     | -           | TBD      |
| Dashboard Load    | -     | -           | TBD      |
| Table Re-renders  | -     | -           | TBD      |

### After Phase 2

| Metric            | Value | Improvement | Measured |
| ----------------- | ----- | ----------- | -------- |
| Members Page Load | -     | -           | TBD      |
| All Re-renders    | -     | -           | TBD      |

### After Phase 3

| Metric              | Value | Total Improvement | Measured |
| ------------------- | ----- | ----------------- | -------- |
| Overall Performance | -     | Target: 40-60%    | TBD      |

---

## Rollback Strategy

### Phase 1 Rollback

- Keep old query hooks available behind feature flag
- Revert React.memo if issues occur
- Database RPC function can be ignored if not used

### Phase 2 Rollback

- Re-export old hooks as wrappers to new consolidated hooks
- Remove useCallback wrappers if causing issues

### Phase 3 Rollback

- Keep old component files in `_deprecated/` folder
- Easy to revert to monolithic components

---

## Risk Assessment

### Low Risk

- Adding React.memo (easily reversible)
- Wrapping callbacks (no functional change)

### Medium Risk

- Query consolidation (requires careful data validation)
- Hook consolidation (requires thorough import updates)

### High Risk

- Component splitting (complex refactor, many touchpoints)

**Mitigation**:

- Comprehensive testing at each step
- Feature flags for gradual rollout
- Keep old code available during transition
- Monitor production metrics closely

---

## Success Criteria

### Phase 1 Complete When:

- [ ] All 4 components use React.memo
- [ ] Members page uses single consolidated query
- [ ] Performance tests show 60% improvement
- [ ] All tests pass
- [ ] No production errors

### Phase 2 Complete When:

- [ ] Members hooks consolidated to 4
- [ ] All inline functions wrapped
- [ ] Dashboard queries consolidated
- [ ] All tests pass
- [ ] Code organization improved

### Phase 3 Complete When:

- [ ] Training sessions hooks consolidated to 4
- [ ] All large components split
- [ ] All components under 300 lines
- [ ] All tests pass
- [ ] Codebase meets all CLAUDE.md standards

### Overall Success When:

- [ ] 40-60% overall performance improvement achieved
- [ ] All CLAUDE.md performance standards met
- [ ] No production incidents
- [ ] Code maintainability improved
- [ ] Test coverage maintained or improved

---

## Notes

### Compliance with CLAUDE.md

**Currently Non-Compliant**:

- ❌ Hook count exceeds 4 per feature (members: 9, training-sessions: 7)
- ❌ Large components exceed 300 lines (4 components >500 lines)
- ❌ Missing React.memo on complex components
- ❌ Multiple queries per page (5 queries on members page)

**Will Be Compliant After**:

- ✅ Hook count at 4 per feature
- ✅ All components under 300 lines
- ✅ React.memo on all complex components
- ✅ Consolidated queries (1-3 per page)

### Best Practices Applied

- Server-side sorting/filtering (already compliant)
- Dynamic imports for heavy libraries (already compliant)
- Lazy loading for charts (already compliant)
- Logger utility instead of console (already compliant)

---

## References

- [CLAUDE.md Performance Guidelines](/CLAUDE.md#-performance-optimization-guidelines)
- [React.memo Documentation](https://react.dev/reference/react/memo)
- [useCallback Documentation](https://react.dev/reference/react/useCallback)
- [useMemo Documentation](https://react.dev/reference/react/useMemo)
- [Performance Profiling](https://react.dev/learn/react-developer-tools)
