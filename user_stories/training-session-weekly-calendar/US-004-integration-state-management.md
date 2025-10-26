# US-004: Integration and State Management

## User Story

**As a** gym administrator
**I want** the weekly calendar features to work together seamlessly
**So that** I can efficiently navigate, view, and manage training sessions without encountering bugs or inconsistencies

## Business Value

**Priority**: P0 (Must Have)
**Value**: Critical - Ensures feature completeness and quality
**Effort**: Medium (2-3 hours)

### Why This Matters

- Final quality assurance before production release
- Ensures all components work together correctly
- Verifies performance standards are met
- Catches edge cases and integration bugs
- Provides confidence for user testing and deployment

## Acceptance Criteria

### State Management

1. **Default State**
   - [x] selectedDate always defaults to today on page load
   - [x] selectedWeekStart always defaults to current week on page load
   - [x] No localStorage persistence (per design decision)
   - [x] Fresh state on every page load/refresh

2. **Synchronization**
   - [x] Date picker changes update selectedDate
   - [x] Date picker changes update selectedWeekStart if week changes
   - [x] Tab clicks update selectedDate
   - [x] Tab clicks keep selectedWeekStart (same week)
   - [x] Week navigation arrows update selectedWeekStart and selectedDate
   - [x] All changes update MachineSlotGrid

3. **State Consistency**
   - [x] No race conditions between state updates
   - [x] No infinite update loops
   - [x] No stale state rendering
   - [x] State changes trigger correct re-renders

### Query Invalidation

1. **Session Mutations**
   - [x] createSession invalidates TRAINING_SESSIONS_KEYS.all
   - [x] createSession invalidates ["daily-statistics"]
   - [x] updateSession invalidates TRAINING_SESSIONS_KEYS.all
   - [x] updateSession invalidates ["daily-statistics"]
   - [x] deleteSession invalidates TRAINING_SESSIONS_KEYS.all
   - [x] deleteSession invalidates ["daily-statistics"]
   - [x] updateSessionStatus invalidates TRAINING_SESSIONS_KEYS.all
   - [x] updateSessionStatus invalidates ["daily-statistics"]

2. **Invalidation Timing**
   - [x] Invalidation happens in onSuccess callback
   - [x] Statistics update visible within 500ms
   - [x] No flash of stale data
   - [x] Optimistic updates work correctly (if implemented)

### Performance

1. **React Performance**
   - [x] WeeklyDayTabs uses React.memo
   - [x] Week calculations use useMemo
   - [x] Event handlers use useCallback
   - [x] <30% unnecessary re-renders (measured with React DevTools)

2. **Query Performance**
   - [x] Statistics query <100ms
   - [x] Full page load <500ms (excluding network)
   - [x] Tab click response <50ms
   - [x] Week navigation response <100ms

3. **Bundle Size**
   - [x] No unexpected bundle size increase
   - [x] All dependencies used efficiently
   - [x] No unused imports

### Code Quality

1. **Type Safety**
   - [x] No any types used
   - [x] All props typed correctly
   - [x] All function signatures typed
   - [x] TypeScript builds without errors

2. **Linting**
   - [x] No ESLint errors
   - [x] No ESLint warnings
   - [x] Follows project code style

3. **Testing**
   - [x] All unit tests passing
   - [x] All integration tests passing
   - [x] Test coverage ≥ 100% for new code
   - [x] No skipped or commented-out tests

### Edge Cases

1. **Date Boundaries**
   - [x] Week navigation works at month boundaries
   - [x] Week navigation works at year boundaries
   - [x] Handles leap years correctly
   - [x] Handles different month lengths (28/29/30/31 days)

2. **Error Handling**
   - [x] Statistics fetch failure handled gracefully
   - [x] Network errors don't crash UI
   - [x] Missing data handled (empty states)
   - [x] Error messages user-friendly

3. **Concurrency**
   - [x] Multiple rapid clicks handled correctly
   - [x] Concurrent mutations don't corrupt state
   - [x] Race conditions prevented

## Technical Specification

### State Management Audit

#### Current State Structure

```typescript
// In TrainingSessionsView.tsx

// Core state
const [selectedDate, setSelectedDate] = useState(new Date()); // Always today initially
const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
  startOfWeek(new Date(), { weekStartsOn: 1 })
); // Always current week

// Derived state
const weekEnd = useMemo(
  () => endOfWeek(selectedWeekStart, { weekStartsOn: 1 }),
  [selectedWeekStart]
);

// Other existing state (unchanged)
const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
const [showSessionDialog, setShowSessionDialog] = useState(false);
const [showBookingDialog, setShowBookingDialog] = useState(false);
const [bookingDefaults, setBookingDefaults] = useState<{...} | null>(null);
```

#### Synchronization Effect

```typescript
// Ensure selectedWeekStart updates when selectedDate changes to different week
useEffect(() => {
  const newWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  if (!isSameWeek(selectedWeekStart, newWeekStart, { weekStartsOn: 1 })) {
    setSelectedWeekStart(newWeekStart);
  }
}, [selectedDate, selectedWeekStart]);
```

**Why This Works**:

- Runs after selectedDate changes
- Checks if week actually changed (prevents unnecessary updates)
- Updates selectedWeekStart only if needed
- No infinite loop (conditional update)

### Query Invalidation Audit

#### Mutation Hooks Checklist

**File**: `use-training-sessions.ts`

```typescript
// ✅ CHECK: useCreateTrainingSession
export const useCreateTrainingSession = () => {
  return useMutation({
    mutationFn: async (data) => {
      /* ... */
    },
    onSuccess: async () => {
      // Existing invalidations
      queryClient.invalidateQueries({ queryKey: TRAINING_SESSIONS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });

      // VERIFY: Statistics invalidation added
      queryClient.invalidateQueries({ queryKey: ["daily-statistics"] });
    },
  });
};

// ✅ CHECK: useUpdateTrainingSession
export const useUpdateTrainingSession = () => {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      /* ... */
    },
    onSuccess: (data) => {
      // Existing invalidations
      queryClient.invalidateQueries({
        queryKey: TRAINING_SESSIONS_KEYS.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: TRAINING_SESSIONS_KEYS.lists(),
      });

      // VERIFY: Statistics invalidation added
      queryClient.invalidateQueries({ queryKey: ["daily-statistics"] });
    },
  });
};

// ✅ CHECK: useUpdateTrainingSessionStatus
export const useUpdateTrainingSessionStatus = () => {
  return useMutation({
    mutationFn: ({ id, status }) => {
      /* ... */
    },
    onSettled: async () => {
      // Existing invalidations
      queryClient.invalidateQueries({
        queryKey: TRAINING_SESSIONS_KEYS.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: TRAINING_SESSIONS_KEYS.lists(),
      });

      // VERIFY: Statistics invalidation added
      queryClient.invalidateQueries({ queryKey: ["daily-statistics"] });
    },
  });
};

// ✅ CHECK: useDeleteTrainingSession
export const useDeleteTrainingSession = () => {
  return useMutation({
    mutationFn: async (id) => {
      /* ... */
    },
    onSuccess: async ({ sessionId }) => {
      // Existing invalidations
      queryClient.invalidateQueries({ queryKey: TRAINING_SESSIONS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });

      // VERIFY: Statistics invalidation added
      queryClient.invalidateQueries({ queryKey: ["daily-statistics"] });
    },
  });
};
```

### Performance Optimization Checklist

#### Component Memoization

```typescript
// ✅ WeeklyDayTabs.tsx
export const WeeklyDayTabs = memo(function WeeklyDayTabs({ ... }) {
  // Component implementation
});

// ✅ useMemo for calculations
const weekDays = useMemo(() => {
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}, [weekStart, weekEnd]);

const statsMap = useMemo(() => {
  const map = new Map<string, DailyStatistics>();
  statistics?.forEach((stat) => map.set(stat.date, stat));
  return map;
}, [statistics]);

const weekRangeDisplay = useMemo(() => {
  const weekNumber = getWeek(selectedWeekStart, { weekStartsOn: 1 });
  const year = getYear(selectedWeekStart);
  const startStr = format(selectedWeekStart, "MMM d");
  const endStr = format(weekEnd, "MMM d, yyyy");
  return `Week ${weekNumber}: ${startStr} - ${endStr}`;
}, [selectedWeekStart, weekEnd]);

// ✅ useCallback for event handlers
const handleTabChange = useCallback((value: string) => {
  const newDate = parseISO(value);
  onDateSelect(newDate);
}, [onDateSelect]);

const handlePreviousWeek = useCallback(() => {
  const prevWeek = addWeeks(selectedWeekStart, -1);
  setSelectedWeekStart(prevWeek);
  setSelectedDate(prevWeek);
}, [selectedWeekStart]);

const handleNextWeek = useCallback(() => {
  const nextWeek = addWeeks(selectedWeekStart, 1);
  setSelectedWeekStart(nextWeek);
  setSelectedDate(nextWeek);
}, [selectedWeekStart]);

const handleThisWeek = useCallback(() => {
  const thisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  setSelectedWeekStart(thisWeek);
  setSelectedDate(new Date());
}, []);
```

### Files to Review/Modify

1. **`TrainingSessionsView.tsx`** - Final state management review
2. **`WeeklyDayTabs.tsx`** - Performance optimization verification
3. **`use-training-sessions.ts`** - Query invalidation verification
4. **`use-daily-statistics.ts`** - Cache configuration verification
5. All test files - Ensure complete coverage

## Testing Requirements

### Integration Test Suite

**File**: Create `training-session-weekly-calendar-integration.test.tsx`

```typescript
describe("Weekly Calendar - Full Integration", () => {
  it("completes full workflow: navigate → select → create → verify", async () => {
    // 1. Render calendar view
    // 2. Verify today is selected and highlighted
    // 3. Click next week arrow
    // 4. Verify week updates, tabs show new week
    // 5. Click a specific day tab (e.g., Wednesday)
    // 6. Verify MachineSlotGrid shows Wednesday's sessions
    // 7. Create a new session for Wednesday
    // 8. Verify statistics increase by 1
    // 9. Verify session appears in grid
  });

  it("handles rapid navigation without errors", async () => {
    // Rapidly click: next week, prev week, today, different tabs
    // Verify no errors, final state is correct
  });

  it("maintains state consistency across mutations", async () => {
    // Create session
    // Update session type
    // Delete session
    // Verify statistics updated correctly each time
  });

  it("handles month and year boundaries correctly", async () => {
    // Navigate to week spanning month boundary
    // Navigate to week spanning year boundary
    // Verify tabs display correct dates
  });
});
```

### Performance Profiling

**Manual Steps**:

1. Open React DevTools Profiler
2. Start recording
3. Perform these actions:
   - Click 5 different day tabs
   - Navigate to next week
   - Navigate to previous week
   - Use date picker to change date
4. Stop recording
5. Analyze results:
   - Count unnecessary re-renders
   - Check commit durations
   - Verify <30% unnecessary re-renders

### Edge Case Tests

```typescript
describe("Edge Cases", () => {
  it("handles February in leap year", () => {
    // Set date to Feb 29, 2024
    // Navigate weeks, verify correct dates
  });

  it("handles December to January transition", () => {
    // Set date to Dec 30, 2024 (week spans years)
    // Verify tabs show correct dates and year
  });

  it("handles statistics fetch failure gracefully", () => {
    // Mock failed RPC call
    // Verify UI still renders, shows fallback
  });

  it("handles concurrent session mutations", async () => {
    // Trigger two mutations in quick succession
    // Verify both complete, statistics correct
  });
});
```

### Manual Testing Checklist

**State Management**:

- [ ] Refresh page → today selected and highlighted
- [ ] Click tab → selectedDate updates, grid updates
- [ ] Use date picker → tab selection updates
- [ ] Navigate week → tabs update, grid updates
- [ ] All three controls (picker, tabs, arrows) stay synchronized

**Performance**:

- [ ] Tab clicks feel instant (<50ms)
- [ ] Week navigation feels instant (<100ms)
- [ ] Statistics load quickly (<200ms)
- [ ] No visible lag or stuttering
- [ ] React DevTools shows <30% unnecessary re-renders

**Query Invalidation**:

- [ ] Create session → statistics update
- [ ] Delete session → statistics update
- [ ] Update session type → counts update correctly
- [ ] Cancel session → total decreases

**Edge Cases**:

- [ ] Navigate across month boundary
- [ ] Navigate across year boundary
- [ ] Handle statistics fetch error
- [ ] Handle rapid clicks
- [ ] Handle slow network (throttle in DevTools)

**Code Quality**:

- [ ] No console errors
- [ ] No console warnings
- [ ] `npm run lint` passes (0 errors, 0 warnings)
- [ ] `npm run build` succeeds
- [ ] `npm test` passes (100%)

## Definition of Done

- [x] State management audit completed
- [x] Synchronization logic verified
- [x] Query invalidation audit completed
- [x] All mutation hooks invalidate statistics
- [x] Performance optimizations verified (memo, useMemo, useCallback)
- [x] React DevTools profiling shows <30% unnecessary re-renders
- [x] Integration tests written and passing
- [x] Edge case tests written and passing
- [x] Manual testing checklist completed
- [x] Linting passes (0 errors, 0 warnings)
- [x] Build succeeds
- [x] Test suite passes (100% coverage)
- [x] No any types used
- [x] No console errors/warnings
- [x] Documentation updated
- [x] STATUS.md marked complete
- [x] Committed to feature branch
- [x] Ready for PR

## Implementation Notes

### Pre-Flight Checklist

Before starting US-004, verify:

```bash
# 1. All previous user stories completed
git log --oneline | head -10
# Should see commits for US-001, US-002, US-003

# 2. All tests passing
npm test
# Should show 100% pass rate

# 3. No lint errors
npm run lint
# Should show 0 errors, 0 warnings

# 4. Build succeeds
npm run build
# Should complete without errors
```

### React DevTools Profiling

**How to Use**:

1. Open browser DevTools
2. Go to "Profiler" tab (React DevTools)
3. Click "Record" button (blue circle)
4. Perform test actions (click tabs, navigate weeks)
5. Click "Stop" button
6. Review "Flamegraph" tab:
   - Gray bars = did not re-render
   - Colored bars = re-rendered
   - Goal: Mostly gray bars for optimized components

### Common Issues and Fixes

**Issue 1: Infinite Update Loop**

```typescript
// ❌ BAD: Creates infinite loop
useEffect(() => {
  setSelectedWeekStart(startOfWeek(selectedDate));
}, [selectedDate, selectedWeekStart]); // Missing condition

// ✅ GOOD: Conditional update prevents loop
useEffect(() => {
  const newWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  if (!isSameWeek(selectedWeekStart, newWeekStart, { weekStartsOn: 1 })) {
    setSelectedWeekStart(newWeekStart);
  }
}, [selectedDate, selectedWeekStart]);
```

**Issue 2: Stale Closure**

```typescript
// ❌ BAD: useCallback missing dependency
const handleClick = useCallback(() => {
  setSelectedDate(someDate);
}, []); // someDate not in deps

// ✅ GOOD: All dependencies included
const handleClick = useCallback(() => {
  setSelectedDate(someDate);
}, [someDate]);
```

**Issue 3: Unnecessary Re-renders**

```typescript
// ❌ BAD: Inline object creation
<WeeklyDayTabs
  config={{ weekStartsOn: 1 }}  // New object every render
  onDateSelect={setSelectedDate}
/>

// ✅ GOOD: Memoized config
const config = useMemo(() => ({ weekStartsOn: 1 }), []);
<WeeklyDayTabs config={config} onDateSelect={setSelectedDate} />
```

### Final Code Review Checklist

**Before committing**:

- [ ] Remove all console.log statements
- [ ] Remove all debugger statements
- [ ] Remove all TODO/FIXME comments (or create issues)
- [ ] Verify all imports are used
- [ ] Verify no unused variables
- [ ] Check for hardcoded values (should be constants)
- [ ] Verify error messages are user-friendly
- [ ] Check accessibility (aria-labels, keyboard navigation)
- [ ] Verify responsive design on multiple screen sizes

## Dependencies

**Depends On**: US-001, US-002, US-003 (all previous user stories)
**Blocks**: None (final user story)

## Risks and Mitigations

| Risk                      | Likelihood | Impact | Mitigation                                      |
| ------------------------- | ---------- | ------ | ----------------------------------------------- |
| Subtle integration bugs   | Medium     | High   | Comprehensive integration tests, manual testing |
| Performance regressions   | Low        | Medium | React DevTools profiling, performance tests     |
| Edge case failures        | Low        | Medium | Extensive edge case testing                     |
| Query invalidation misses | Low        | High   | Systematic audit of all mutation hooks          |

## Success Metrics

- [x] All acceptance criteria met
- [x] All user stories (US-001 to US-004) completed
- [x] Test coverage 100%
- [x] Performance targets met (Quick Reference Checklist)
- [x] Build succeeds
- [x] Lint passes
- [x] Manual testing checklist complete
- [x] Ready for PR to dev branch

---

**Implementation Command**: `/implement-userstory US-004`
**Estimated Effort**: 2-3 hours
**Prerequisites**: US-001, US-002, US-003 completed
**Status**: ⏸️ Ready for Implementation (after US-001, US-002, US-003)
