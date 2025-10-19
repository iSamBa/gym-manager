# Training Session Weekly Calendar View - Technical Documentation

## Feature Overview

This feature enhances the training session calendar view by adding weekly day tabs with session statistics. Users can navigate between weeks and days more efficiently while seeing booking patterns at a glance.

## Architecture

### Component Hierarchy

```
TrainingSessionsView (existing, modified)
├── Card
│   ├── CardContent
│   │   ├── Day Navigation Bar (existing)
│   │   │   ├── Previous Day Button
│   │   │   ├── Date Picker Popover
│   │   │   ├── Next Day Button
│   │   │   └── Today Button
│   │   │
│   │   ├── Week Navigation Bar (NEW)
│   │   │   ├── Previous Week Button
│   │   │   ├── Week Range Display (e.g., "Week 42: Oct 14-20")
│   │   │   ├── Next Week Button
│   │   │   └── Jump to This Week Button
│   │   │
│   │   ├── WeeklyDayTabs (NEW COMPONENT)
│   │   │   └── Tabs (shadcn/ui)
│   │   │       ├── TabsList
│   │   │       │   ├── TabsTrigger (Monday)
│   │   │       │   │   ├── Day Name
│   │   │       │   │   ├── Day Number
│   │   │       │   │   ├── Total Sessions Count
│   │   │       │   │   └── Standard/Trial Badge
│   │   │       │   ├── TabsTrigger (Tuesday) ...
│   │   │       │   └── ... (through Sunday)
│   │   │       └── TabsContent (7 tabs, content handled by parent)
│   │   │
│   │   └── MachineSlotGrid (existing)
│   │       └── [3 machine columns with time slots]
│   │
│   ├── SessionDialog (existing)
│   └── SessionBookingDialog (existing)
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     TrainingSessionsView                    │
│  State:                                                      │
│  - selectedDate: Date                                        │
│  - selectedWeekStart: Date (NEW)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
 ┌─────────────┐ ┌──────────────────┐ ┌─────────────────┐
 │ Date Picker │ │ WeeklyDayTabs    │ │ MachineSlotGrid │
 │             │ │                  │ │                 │
 │ Sync ◄─────►│ Sync ◄──────────► │ Sync             │
 └─────────────┘ └──────────────────┘ └─────────────────┘
                         │
                         │ uses
                         ▼
              ┌──────────────────────┐
              │ useDailyStatistics   │
              │                      │
              │ Input:               │
              │ - weekStart          │
              │ - weekEnd            │
              │                      │
              │ Output:              │
              │ - DailyStatistics[]  │
              │   - date             │
              │   - total            │
              │   - standard         │
              │   - trial            │
              └──────────┬───────────┘
                         │
                         │ queries
                         ▼
              ┌──────────────────────┐
              │ Supabase RPC         │
              │ get_daily_session_   │
              │ statistics()         │
              │                      │
              │ Returns:             │
              │ {day_date, total,    │
              │  standard, trial}[]  │
              └──────────────────────┘
```

### State Management

#### Core State (TrainingSessionsView)

```typescript
// Existing state
const [selectedDate, setSelectedDate] = useState(new Date());

// New state for week navigation
const [selectedWeekStart, setSelectedWeekStart] = useState(
  () => startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
);

// Derived state
const weekEnd = useMemo(
  () => endOfWeek(selectedWeekStart, { weekStartsOn: 1 }),
  [selectedWeekStart]
);
```

#### Synchronization Logic

```typescript
// When date picker changes → update week if needed
useEffect(() => {
  const newWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  if (!isSameWeek(selectedWeekStart, newWeekStart)) {
    setSelectedWeekStart(newWeekStart);
  }
}, [selectedDate]);

// When tab clicked → update selectedDate
const handleDayTabClick = (dayDate: Date) => {
  setSelectedDate(dayDate);
  // selectedWeekStart doesn't change (same week)
};

// When week navigation clicked → update week and date
const handleNextWeek = () => {
  const nextWeek = addWeeks(selectedWeekStart, 1);
  setSelectedWeekStart(nextWeek);
  setSelectedDate(nextWeek); // Jump to Monday of new week
};
```

### Data Layer

#### New Hook: useDailyStatistics

```typescript
// src/features/training-sessions/hooks/use-daily-statistics.ts

export interface DailyStatistics {
  date: string; // YYYY-MM-DD
  total: number;
  standard: number;
  trial: number;
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

      if (error) throw error;

      // Map to DailyStatistics[]
      return (data || []).map((row) => ({
        date: row.day_date,
        total: row.total_count,
        standard: row.standard_count,
        trial: row.trial_count,
      }));
    },
    staleTime: 1000 * 60, // 1 minute cache
  });
};
```

#### Database RPC Function

```sql
-- Function: get_daily_session_statistics
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
    ts.status NOT IN ('cancelled') -- Exclude cancelled sessions
    AND DATE(ts.scheduled_start) >= p_start_date
    AND DATE(ts.scheduled_start) <= p_end_date
  GROUP BY DATE(ts.scheduled_start)
  ORDER BY day_date;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Why RPC Function?**

- Server-side aggregation (faster than client-side)
- Reduced data transfer (only counts, not full records)
- Consistent with existing codebase patterns
- Cacheable with React Query

### Cache Invalidation Strategy

#### Trigger Points

Statistics cache must invalidate when:

1. New session created
2. Session updated (especially session_type change)
3. Session deleted
4. Session status changed to/from "cancelled"

#### Implementation

```typescript
// In use-training-sessions.ts mutations

export const useCreateTrainingSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // ... mutation logic ...
    onSuccess: () => {
      // Existing invalidations
      queryClient.invalidateQueries({ queryKey: TRAINING_SESSIONS_KEYS.all });

      // NEW: Invalidate statistics
      queryClient.invalidateQueries({ queryKey: ["daily-statistics"] });
    },
  });
};

// Similar pattern for update, delete, and status change mutations
```

### UI/UX Design

#### Tab Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  MON   TUE   WED   THU   FRI   SAT   SUN                         │
│  ───   ───   ───   ───   ───   ───   ───                         │
│  14    15    16    17    18*   19    20    * = Today (highlighted)
│                                                                    │
│  10    12     8    15     9     5     3    (Total sessions)       │
│ 8│2   10│2   6│2  12│3   7│2   4│1   2│1   (Standard│Trial)      │
└──────────────────────────────────────────────────────────────────┘
```

#### Styling Specification

**Today Highlight**:

- Background: `bg-primary/10`
- Border: `border-primary`
- Text: `text-primary font-semibold`

**Standard Session Count**:

- Color: Orange (`text-orange-600`)
- Position: Left side of separator

**Trial Session Count**:

- Color: Blue (`text-blue-600`)
- Position: Right side of separator

**Active Tab**:

- Background: `bg-accent`
- Border: `border-accent-foreground`

### Performance Considerations

#### Optimizations Applied

1. **React.memo on WeeklyDayTabs**

   ```typescript
   export const WeeklyDayTabs = memo(function WeeklyDayTabs({ ... }) {
     // Component implementation
   });
   ```

2. **useMemo for Week Calculations**

   ```typescript
   const weekDays = useMemo(() => {
     return eachDayOfInterval({
       start: weekStart,
       end: weekEnd,
     });
   }, [weekStart, weekEnd]);
   ```

3. **useCallback for Event Handlers**

   ```typescript
   const handleDaySelect = useCallback(
     (date: Date) => {
       onDateSelect(date);
     },
     [onDateSelect]
   );
   ```

4. **React Query Caching**
   - Statistics cached for 1 minute
   - Targeted invalidation (not global)
   - Background refetching on stale data

#### Performance Targets

- **Component Re-renders**: <30% unnecessary
- **Database Query**: <100ms response time
- **Statistics Fetch**: <200ms total (including network)
- **Tab Click Response**: <50ms (instant feel)

### Type Definitions

```typescript
// src/features/training-sessions/lib/types.ts

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

export interface DayTabProps {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  statistics?: DailyStatistics;
  onSelect: (date: Date) => void;
}
```

### Testing Strategy

#### Unit Tests

**WeeklyDayTabs Component**:

- Renders 7 tabs (Monday through Sunday)
- Highlights today correctly
- Handles date selection callback
- Displays statistics correctly
- Shows loading state during fetch
- Handles missing statistics gracefully

**useDailyStatistics Hook**:

- Fetches data for correct date range
- Transforms RPC response correctly
- Handles errors gracefully
- Returns correct loading/error states

#### Integration Tests

**Tab ↔ Date Synchronization**:

- Clicking tab updates selectedDate
- Changing date picker updates tab selection
- Week navigation updates both tabs and date

**Real-time Statistics**:

- Creating session updates statistics
- Deleting session updates statistics
- Changing session type updates counts

#### Test Files

```
src/features/training-sessions/
├── components/
│   └── __tests__/
│       └── WeeklyDayTabs.test.tsx
├── hooks/
│   └── __tests__/
│       └── use-daily-statistics.test.ts
```

### Dependencies

#### Existing Dependencies

- `react` - Component framework
- `react-query` - Data fetching and caching
- `date-fns` - Date manipulation utilities
- `@/components/ui/tabs` - shadcn/ui Tabs component
- `@/lib/date-utils` - Project date utilities

#### New Dependencies

None - uses existing dependencies

### Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Date Handling**: Uses date-fns for cross-browser consistency
- **CSS**: Uses Tailwind CSS (no custom CSS)

### Accessibility

- **Keyboard Navigation**: Tab key navigates between day tabs
- **ARIA Labels**: Each tab has descriptive aria-label
- **Focus Management**: Visible focus indicators
- **Screen Readers**: Proper semantic HTML with role attributes

### Error Handling

#### Statistics Fetch Failure

```typescript
const { data, isLoading, error } = useDailyStatistics(weekStart, weekEnd);

if (error) {
  // Show fallback UI without statistics
  return <WeeklyDayTabsSkeleton />;
}
```

#### Graceful Degradation

- Statistics fail → tabs still functional (no counts shown)
- Network error → cached data shown if available
- Retry mechanism → automatic retry with exponential backoff

### Future Enhancements (Out of Scope)

- [ ] Color-coded availability indicators (green/yellow/red)
- [ ] Hover tooltip with detailed breakdown
- [ ] Click-to-expand weekly summary card
- [ ] Export weekly statistics to CSV
- [ ] Historical week comparison view

### Migration Notes

**No Breaking Changes**:

- Existing functionality preserved
- Additive changes only
- Backward compatible

**Database Impact**:

- New RPC function (read-only)
- No schema changes
- No data migrations required

### Monitoring and Metrics

**Track These Metrics**:

- Statistics query response time
- Cache hit rate for daily statistics
- User interaction frequency (tab clicks)
- Error rate for statistics fetching

---

## Quick Reference

### Key Files

| File                       | Purpose            |
| -------------------------- | ------------------ |
| `WeeklyDayTabs.tsx`        | Main tab component |
| `use-daily-statistics.ts`  | Statistics hook    |
| `TrainingSessionsView.tsx` | Integration point  |
| `types.ts`                 | Type definitions   |

### Key Functions

| Function                       | Purpose                 |
| ------------------------------ | ----------------------- |
| `get_daily_session_statistics` | Database aggregation    |
| `useDailyStatistics`           | React Query hook        |
| `handleDayTabClick`            | Tab selection handler   |
| `handleWeekNavigation`         | Week navigation handler |

### Key Types

| Type                 | Description          |
| -------------------- | -------------------- |
| `DailyStatistics`    | Daily session counts |
| `WeeklyDayTabsProps` | Component props      |
| `DayTabProps`        | Individual tab props |

---

For implementation guidance, see `AGENT-GUIDE.md`
For user stories, see `US-001.md` through `US-004.md`
