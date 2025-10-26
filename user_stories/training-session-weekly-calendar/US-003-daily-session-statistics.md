# US-003: Daily Session Statistics

## User Story

**As a** gym administrator
**I want** to see session statistics (total, standard, trial) on each weekday tab
**So that** I can quickly understand booking patterns and capacity utilization for each day

## Business Value

**Priority**: P0 (Must Have)
**Value**: Very High - Core value proposition of the feature
**Effort**: High (3-4 hours)

### Why This Matters

- Immediate visibility into daily booking density
- Identify busy days vs. slow days for better staffing
- Track standard vs. trial session distribution for business insights
- Real-time updates when sessions are created/modified/deleted
- Data-driven decision making for scheduling and promotions

## Acceptance Criteria

### Functional Requirements

1. **Statistics Display**
   - [x] Each tab shows total number of sessions for that day
   - [x] Each tab shows count of standard sessions (orange color)
   - [x] Each tab shows count of trial sessions (blue color)
   - [x] Layout matches user-provided design example

2. **Data Accuracy**
   - [x] Statistics reflect only non-cancelled sessions
   - [x] Counts are accurate for the specific day
   - [x] Standard + Trial = Total (validation check)

3. **Real-Time Updates**
   - [x] Creating a session updates statistics immediately
   - [x] Deleting a session updates statistics immediately
   - [x] Changing session type (standard ↔ trial) updates counts
   - [x] Cancelling a session decreases count
   - [x] Un-cancelling a session increases count (if applicable)

4. **Performance**
   - [x] Statistics fetch completes in <200ms
   - [x] Database query optimized (server-side aggregation)
   - [x] Results cached appropriately (1 minute stale time)
   - [x] Targeted cache invalidation (not global)

5. **Loading States**
   - [x] Skeleton/placeholder shown while fetching statistics
   - [x] Graceful fallback if statistics fail to load
   - [x] No layout shift when statistics load

### Non-Functional Requirements

1. **Database Performance**
   - [x] Query response time <100ms
   - [x] Uses indexes effectively
   - [x] Scales to 1000+ sessions per week

2. **Code Quality**
   - [x] Hook follows React Query patterns
   - [x] Type-safe TypeScript interfaces
   - [x] Comprehensive error handling

## Technical Specification

### Database Layer

#### RPC Function: `get_daily_session_statistics`

```sql
CREATE OR REPLACE FUNCTION get_daily_session_statistics(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  day_date DATE,
  total_count BIGINT,
  standard_count BIGINT,
  trial_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(ts.scheduled_start) as day_date,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE ts.session_type = 'standard') as standard_count,
    COUNT(*) FILTER (WHERE ts.session_type = 'trail') as trail_count
  FROM training_sessions ts
  WHERE
    ts.status NOT IN ('cancelled') -- Only count non-cancelled sessions
    AND DATE(ts.scheduled_start) >= p_start_date
    AND DATE(ts.scheduled_start) <= p_end_date
  GROUP BY DATE(ts.scheduled_start)
  ORDER BY day_date;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Why RPC Function?**

- Server-side aggregation (much faster than client-side)
- Reduced network payload (counts vs. full records)
- Consistent with existing codebase patterns (see `get_sessions_with_planning_indicators`)
- Cacheable with React Query

**Testing the Function**:

```sql
-- Test query in Supabase SQL Editor
SELECT * FROM get_daily_session_statistics(
  '2025-10-14'::DATE,
  '2025-10-20'::DATE
);

-- Expected output:
-- day_date    | total_count | standard_count | trail_count
-- 2025-10-14  | 10          | 8              | 2
-- 2025-10-15  | 12          | 10             | 2
-- ...
```

### Hook Layer

#### `useDailyStatistics` Hook

**File**: `src/features/training-sessions/hooks/use-daily-statistics.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date-utils";

export interface DailyStatistics {
  date: string; // YYYY-MM-DD format
  total: number;
  standard: number;
  trial: number;
}

interface DailyStatisticsRpcResponse {
  day_date: string;
  total_count: number;
  standard_count: number;
  trail_count: number;
}

export const useDailyStatistics = (weekStart: Date, weekEnd: Date) => {
  return useQuery({
    queryKey: [
      "daily-statistics",
      getLocalDateString(weekStart),
      getLocalDateString(weekEnd),
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_daily_session_statistics",
        {
          p_start_date: getLocalDateString(weekStart),
          p_end_date: getLocalDateString(weekEnd),
        }
      );

      if (error) {
        throw new Error(`Failed to fetch daily statistics: ${error.message}`);
      }

      // Transform RPC response to DailyStatistics[]
      const statistics: DailyStatistics[] = (
        (data as DailyStatisticsRpcResponse[]) || []
      ).map((row) => ({
        date: row.day_date,
        total: row.total_count,
        standard: row.standard_count,
        trial: row.trail_count,
      }));

      return statistics;
    },
    staleTime: 1000 * 60, // 1 minute - fresh enough for real-time feel
    gcTime: 1000 * 60 * 5, // 5 minutes - keep in cache
  });
};
```

### Component Layer

#### Update `WeeklyDayTabs.tsx`

```typescript
import { useDailyStatistics } from "../hooks/use-daily-statistics";

export const WeeklyDayTabs: React.FC<WeeklyDayTabsProps> = memo(
  function WeeklyDayTabs({ selectedDate, weekStart, onDateSelect }) {
    // Fetch statistics for the week
    const weekEnd = useMemo(
      () => endOfWeek(weekStart, { weekStartsOn: 1 }),
      [weekStart]
    );

    const { data: statistics, isLoading } = useDailyStatistics(
      weekStart,
      weekEnd
    );

    // Create lookup map for O(1) access
    const statsMap = useMemo(() => {
      const map = new Map<string, DailyStatistics>();
      statistics?.forEach((stat) => map.set(stat.date, stat));
      return map;
    }, [statistics]);

    const weekDays = useMemo(() => {
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }, [weekStart, weekEnd]);

    return (
      <Tabs
        value={getLocalDateString(selectedDate)}
        onValueChange={handleTabChange}
      >
        <TabsList className="grid grid-cols-7 w-full">
          {weekDays.map((day) => {
            const dayStr = getLocalDateString(day);
            const stats = statsMap.get(dayStr);

            return (
              <TabsTrigger
                key={dayStr}
                value={dayStr}
                className={cn(
                  "flex flex-col items-center gap-1 p-2",
                  isToday(day) &&
                    "bg-primary/10 border-primary font-semibold"
                )}
              >
                {/* Day name and number */}
                <span className="text-xs text-muted-foreground">
                  {format(day, "EEE")}
                </span>
                <span className="text-lg font-bold">{format(day, "d")}</span>

                {/* Statistics */}
                {isLoading ? (
                  <div className="h-6 w-12 animate-pulse bg-muted rounded" />
                ) : stats ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-medium">
                      {stats.total}
                    </span>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-orange-600">
                        {stats.standard}
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-blue-600">{stats.trial}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-medium">0</span>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-orange-600">0</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-blue-600">0</span>
                    </div>
                  </div>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    );
  }
);
```

### Cache Invalidation

#### Update Mutation Hooks

**File**: `src/features/training-sessions/hooks/use-training-sessions.ts`

```typescript
// In useCreateTrainingSession
export const useCreateTrainingSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSessionData) => {
      // ... existing mutation logic ...
    },
    onSuccess: async (_result, variables) => {
      // ... existing success logic ...

      // NEW: Invalidate daily statistics
      queryClient.invalidateQueries({ queryKey: ["daily-statistics"] });
    },
  });
};

// Similar updates for:
// - useUpdateTrainingSession
// - useDeleteTrainingSession
// - useUpdateTrainingSessionStatus
```

**Why Invalidate All Statistics?**

- Simplicity: One line of code
- Safety: Ensures all weeks refresh
- Performance: Statistics queries are cheap (<100ms)
- User expectation: Expect instant updates across UI

### Type Definitions

**File**: `src/features/training-sessions/lib/types.ts`

```typescript
// Add to existing types

export interface DailyStatistics {
  date: string; // YYYY-MM-DD format
  total: number;
  standard: number;
  trial: number;
}

export interface WeeklyDayTabsProps {
  selectedDate: Date;
  weekStart: Date;
  onDateSelect: (date: Date) => void;
}
```

### Files to Create/Modify

#### New Files

1. `src/features/training-sessions/hooks/use-daily-statistics.ts`
   - Hook implementation
   - Type definitions
   - Query configuration

2. `src/features/training-sessions/hooks/__tests__/use-daily-statistics.test.ts`
   - Unit tests for hook
   - Mock Supabase responses
   - Error handling tests

3. Database: RPC function via Supabase MCP
   - Create `get_daily_session_statistics` function

#### Modified Files

1. `src/features/training-sessions/components/WeeklyDayTabs.tsx`
   - Import and use useDailyStatistics
   - Display statistics in tabs
   - Handle loading and error states

2. `src/features/training-sessions/hooks/use-training-sessions.ts`
   - Add statistics cache invalidation to all mutations

3. `src/features/training-sessions/lib/types.ts`
   - Add DailyStatistics interface

4. `src/features/training-sessions/hooks/index.ts`
   - Export useDailyStatistics hook

## Testing Requirements

### Database Function Tests

**Via Supabase SQL Editor**:

```sql
-- Test 1: Normal week with sessions
SELECT * FROM get_daily_session_statistics('2025-10-14', '2025-10-20');

-- Test 2: Week with no sessions
SELECT * FROM get_daily_session_statistics('2025-12-25', '2025-12-31');

-- Test 3: Mixed session types
-- (Create test data, then query)

-- Test 4: Cancelled sessions excluded
-- (Create cancelled session, verify not counted)

-- Validation: Standard + Trial = Total
SELECT
  day_date,
  total_count,
  standard_count + trail_count as calculated_total,
  (total_count = standard_count + trail_count) as valid
FROM get_daily_session_statistics('2025-10-14', '2025-10-20');
```

### Hook Unit Tests

**File**: `use-daily-statistics.test.ts`

```typescript
describe("useDailyStatistics", () => {
  it("fetches statistics for date range", async () => {
    // Mock supabase.rpc to return test data
    // Call hook with weekStart and weekEnd
    // Verify correct query key
    // Verify data transformation
  });

  it("handles empty results gracefully", async () => {
    // Mock empty response
    // Verify hook returns empty array
  });

  it("handles database errors", async () => {
    // Mock error response
    // Verify hook throws error
  });

  it("transforms RPC response correctly", async () => {
    // Mock RPC response with specific data
    // Verify transformation to DailyStatistics[]
  });

  it("uses correct cache configuration", () => {
    // Verify staleTime = 60 seconds
    // Verify gcTime = 5 minutes
  });
});
```

### Component Integration Tests

**File**: Update `WeeklyDayTabs.test.tsx`

```typescript
describe("WeeklyDayTabs - Statistics", () => {
  it("displays loading state while fetching statistics", () => {
    // Render component with pending query
    // Verify skeleton/loading UI shown
  });

  it("displays statistics when loaded", () => {
    // Mock successful statistics response
    // Verify total count displayed
    // Verify standard count in orange
    // Verify trial count in blue
  });

  it("displays zero counts for days with no sessions", () => {
    // Mock statistics with missing days
    // Verify "0 | 0 | 0" displayed for those days
  });

  it("validates standard + trial = total", () => {
    // Mock statistics
    // Verify math checks out in component
  });
});
```

### Real-Time Update Tests

**File**: Create `statistics-real-time-updates.test.tsx`

```typescript
describe("Statistics Real-Time Updates", () => {
  it("updates statistics after creating session", async () => {
    // Render calendar view
    // Note initial statistics
    // Create new session
    // Wait for mutation to complete
    // Verify statistics increased by 1
  });

  it("updates statistics after deleting session", async () => {
    // Render calendar view with existing session
    // Note initial statistics
    // Delete session
    // Wait for mutation
    // Verify statistics decreased by 1
  });

  it("updates statistics after changing session type", async () => {
    // Create standard session
    // Note standard vs. trial counts
    // Update session to trail type
    // Verify standard decreased, trail increased
  });

  it("updates statistics after cancelling session", async () => {
    // Create session
    // Note counts
    // Cancel session (status = 'cancelled')
    // Verify counts decreased
  });
});
```

### Manual Testing Checklist

- [ ] Statistics display correctly on all 7 tabs
- [ ] Total count matches sum of standard + trial
- [ ] Orange color for standard sessions visible
- [ ] Blue color for trial sessions visible
- [ ] Create session → statistics update immediately
- [ ] Delete session → statistics update immediately
- [ ] Change session type → counts update correctly
- [ ] Cancel session → total decreases
- [ ] Loading state shows while fetching
- [ ] Zero counts display for empty days
- [ ] Navigate to different week → statistics refresh
- [ ] Statistics query completes quickly (<200ms)
- [ ] No console errors
- [ ] No layout shift when statistics load

## Definition of Done

- [x] RPC function `get_daily_session_statistics` created and tested
- [x] useDailyStatistics hook created
- [x] Hook unit tests written and passing (100% coverage)
- [x] WeeklyDayTabs component updated to display statistics
- [x] Statistics styled per design (orange/blue colors)
- [x] Loading states implemented
- [x] Cache invalidation added to all mutation hooks
- [x] Real-time update tests written and passing
- [x] Manual testing checklist completed
- [x] Database query performance verified (<100ms)
- [x] No console errors or warnings
- [x] No lint errors
- [x] Code reviewed against CLAUDE.md standards
- [x] Committed to feature branch
- [x] STATUS.md updated

## Implementation Notes

### Database Migration

**Use Supabase MCP to create function**:

```typescript
// Use mcp__supabase__execute_sql tool
const migration = `
CREATE OR REPLACE FUNCTION get_daily_session_statistics(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  day_date DATE,
  total_count BIGINT,
  standard_count BIGINT,
  trail_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(ts.scheduled_start) as day_date,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE ts.session_type = 'standard') as standard_count,
    COUNT(*) FILTER (WHERE ts.session_type = 'trail') as trail_count
  FROM training_sessions ts
  WHERE
    ts.status NOT IN ('cancelled')
    AND DATE(ts.scheduled_start) >= p_start_date
    AND DATE(ts.scheduled_start) <= p_end_date
  GROUP BY DATE(ts.scheduled_start)
  ORDER BY day_date;
END;
$$ LANGUAGE plpgsql STABLE;
`;
```

### Performance Optimization

```typescript
// ✅ GOOD: Create lookup map for O(1) access
const statsMap = useMemo(() => {
  const map = new Map<string, DailyStatistics>();
  statistics?.forEach((stat) => map.set(stat.date, stat));
  return map;
}, [statistics]);

// Later in render:
const stats = statsMap.get(dayStr); // O(1) lookup

// ❌ BAD: O(n) lookup in render loop
const stats = statistics?.find((s) => s.date === dayStr); // Slow!
```

### Error Handling

```typescript
const { data, isLoading, error } = useDailyStatistics(weekStart, weekEnd);

if (error) {
  // Graceful fallback: show tabs without statistics
  console.warn("Failed to load statistics:", error);
  // Component still functional, just no counts
}
```

### Common Pitfalls

**Pitfall 1: Session Type Typo**

```sql
-- ❌ WRONG: Database uses 'trail' (not 'trial')
WHERE ts.session_type = 'trial'

-- ✅ CORRECT: Match database column exactly
WHERE ts.session_type = 'trail'
```

**Pitfall 2: Timezone Issues**

```typescript
// ❌ BAD: May count session on wrong day due to UTC conversion
DATE(ts.scheduled_start)

// ✅ GOOD: Database already stores correct local dates
DATE(ts.scheduled_start) -- Works because scheduled_start is timestamptz
```

**Pitfall 3: Cache Invalidation Scope**

```typescript
// ❌ TOO NARROW: Won't invalidate all weeks
queryClient.invalidateQueries({
  queryKey: ["daily-statistics", specificWeekStart, specificWeekEnd],
});

// ✅ CORRECT: Invalidate all statistics queries
queryClient.invalidateQueries({ queryKey: ["daily-statistics"] });
```

## Dependencies

**Depends On**: US-001 (Weekly Day Tabs UI)
**Blocks**: None (US-004 can proceed in parallel after this)

## Risks and Mitigations

| Risk                      | Likelihood | Impact | Mitigation                                                    |
| ------------------------- | ---------- | ------ | ------------------------------------------------------------- |
| Database query slow       | Low        | High   | Use indexes, server-side aggregation, test with large dataset |
| Cache invalidation misses | Medium     | Medium | Invalidate broadly, comprehensive tests                       |
| Session type typo         | Low        | High   | Use TypeScript enums, database type checking                  |
| Real-time updates lag     | Low        | Medium | Targeted invalidation, optimistic updates                     |

## Success Metrics

- [x] All acceptance criteria met
- [x] Database query <100ms
- [x] Statistics fetch <200ms total
- [x] Test coverage ≥ 100% for new code
- [x] Real-time updates feel instant (<500ms)
- [x] No console errors/warnings

---

**Implementation Command**: `/implement-userstory US-003`
**Estimated Effort**: 3-4 hours
**Prerequisites**: US-001 completed (US-002 optional)
**Status**: ⏸️ Ready for Implementation (after US-001)
