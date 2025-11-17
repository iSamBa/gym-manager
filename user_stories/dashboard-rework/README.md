# Dashboard Rework - Feature Documentation

## 📋 Overview

Complete dashboard overhaul providing admins with actionable insights through session analytics and monthly activity metrics.

## 🎯 Business Goals

### Problem

Current dashboard lacks operational insights needed for decision-making:

- No session booking pattern visibility
- No trial member conversion tracking
- No subscription lifecycle monitoring
- Cannot identify trends or optimize resources

### Solution

Analytics-focused dashboard with:

- **3-Week Session View**: Visual distribution of session types
- **Monthly Activity Metrics**: Trial conversions, subscription health
- **Historical Analysis**: Month selector for trend analysis
- **Performance Optimized**: Fast loading, efficient queries

### Success Metrics

- Admins can identify booking trends within 10 seconds
- Trial conversion rate visible at a glance
- Subscription churn tracked monthly
- Dashboard loads in <2 seconds

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────┐
│                  Dashboard Page                  │
│              (src/app/page.tsx)                  │
└────────────┬──────────────────────┬──────────────┘
             │                      │
    ┌────────▼─────────┐   ┌────────▼─────────┐
    │  Weekly Sessions │   │ Monthly Activity │
    │     Pie Charts   │   │   Metric Cards   │
    └────────┬─────────┘   └────────┬─────────┘
             │                      │
    ┌────────▼──────────────────────▼─────────┐
    │         React Query Hooks               │
    │  (use-weekly-sessions, use-monthly-    │
    │           activity)                      │
    └────────┬──────────────────────┬──────────┘
             │                      │
    ┌────────▼──────────────────────▼─────────┐
    │       Analytics Utilities                │
    │  (getWeeklySessionStats,                │
    │   getMonthlyActivityStats)               │
    └────────┬──────────────────────┬──────────┘
             │                      │
    ┌────────▼──────────────────────▼─────────┐
    │          Supabase Client                 │
    └────────┬──────────────────────┬──────────┘
             │                      │
    ┌────────▼──────────────────────▼─────────┐
    │       PostgreSQL RPC Functions           │
    │  get_weekly_session_stats()              │
    │  get_monthly_activity_stats()            │
    └──────────────────────────────────────────┘
```

### Data Flow

```
User Action (Select Month)
      ↓
React Query Hook (useMonthlyActivity)
      ↓
Analytics Utility (getMonthlyActivityStats)
      ↓
Supabase Client (RPC call)
      ↓
PostgreSQL Function (SQL aggregation)
      ↓
Return Results
      ↓
React Query Cache
      ↓
Component Re-render
      ↓
UI Update
```

## 📁 File Structure

```
src/
├── app/
│   └── page.tsx                                    # Dashboard page (modified)
├── features/
│   └── dashboard/
│       ├── components/
│       │   ├── SessionsByTypeChart.tsx            # Pie chart component (new)
│       │   └── MonthlyActivityCard.tsx            # Metric cards (new)
│       ├── hooks/
│       │   ├── use-weekly-sessions.ts             # Weekly data hook (new)
│       │   └── use-monthly-activity.ts            # Monthly data hook (new)
│       └── lib/
│           ├── types.ts                           # TypeScript interfaces (new)
│           ├── week-utils.ts                      # Week calculations (new)
│           ├── month-utils.ts                     # Month calculations (new)
│           └── analytics-utils.ts                 # RPC callers (new)
└── components/
    └── ui/
        └── chart.tsx                              # shadcn/ui charts (existing)

supabase/
└── migrations/
    ├── [timestamp]_get_weekly_session_stats.sql   # RPC function (new)
    └── [timestamp]_get_monthly_activity_stats.sql # RPC function (new)

docs/
└── RPC_SIGNATURES.md                              # Updated with new RPCs
```

## 🗄️ Database Schema

### RPC Function: get_weekly_session_stats

**Purpose**: Aggregate session counts by type for a calendar week

**Parameters**:

- `p_week_start_date DATE` - Monday of target week

**Returns**:

```sql
TABLE (
  week_start DATE,
  week_end DATE,
  total_sessions BIGINT,
  trial BIGINT,
  member BIGINT,
  contractual BIGINT,
  multi_site BIGINT,
  collaboration BIGINT,
  makeup BIGINT,
  non_bookable BIGINT
)
```

**Logic**:

- Queries `training_sessions` table
- Filters by `session_date` between week_start and week_end
- Excludes cancelled sessions (`status IN ('scheduled', 'completed')`)
- Groups by session_type using COUNT(\*) FILTER

**Performance**: Uses index on `(session_date, session_type, status)`

### RPC Function: get_monthly_activity_stats

**Purpose**: Calculate trial conversions and subscription lifecycle metrics

**Parameters**:

- `p_month_start_date DATE` - First day of target month

**Returns**:

```sql
TABLE (
  month_start DATE,
  month_end DATE,
  trial_sessions BIGINT,
  trial_conversions BIGINT,
  subscriptions_expired BIGINT,
  subscriptions_renewed BIGINT,
  subscriptions_cancelled BIGINT
)
```

**Logic**:

- **trial_sessions**: Count sessions where session_type='trial' in month
- **trial_conversions**: Count members who got first subscription in month
- **subscriptions_expired**: Count subscriptions with status='expired', end_date in month
- **subscriptions_renewed**: Count new subscriptions where member had previous subscription
- **subscriptions_cancelled**: Count subscriptions with status='cancelled', updated_at in month

**Performance**: Uses indexes on:

- `training_sessions(session_date, session_type)`
- `member_subscriptions(created_at, member_id)`
- `member_subscriptions(end_date, status)`
- `member_subscriptions(updated_at, status)`

## 🎨 UI Components

### SessionsByTypeChart

**Purpose**: Display session distribution as donut pie chart

**Props**:

```typescript
interface SessionsByTypeChartProps {
  data: WeeklySessionStats;
  title: string;
}
```

**Features**:

- shadcn/ui PieChart component (recharts)
- 7 session types with distinct colors
- Legend showing all types
- Total count in center
- Responsive sizing
- Loading and empty states

**Performance**:

- Wrapped in React.memo
- Lazy loaded with React.lazy

### MonthlyActivityCard

**Purpose**: Display monthly metrics in stat cards

**Props**:

```typescript
interface MonthlyActivityCardProps {
  data: MonthlyActivityStats;
}
```

**Features**:

- 5 metric cards in responsive grid
- Icons from lucide-react
- Clear labels and large numbers
- Optional trend indicators
- Responsive layout (3→2→1 columns)

**Performance**:

- Wrapped in React.memo
- Minimal re-renders

## 🔌 Data Layer

### React Query Configuration

**Query Keys Structure**:

```typescript
weeklySessionsKeys = {
  all: ["weekly-sessions"],
  week: (weekStart: string) => ["weekly-sessions", weekStart],
  threeWeeks: () => ["weekly-sessions", "three-weeks"],
};

monthlyActivityKeys = {
  all: ["monthly-activity"],
  month: (monthStart: string) => ["monthly-activity", monthStart],
};
```

**Cache Strategy**:

- `staleTime`: 5 minutes (analytics don't change frequently)
- `gcTime`: 10 minutes (keep cached data)
- Parallel queries for 3-week data
- Prefetching for adjacent months (future enhancement)

### Error Handling

```typescript
// All hooks handle errors gracefully
const { data, error, isError } = useWeeklySessions(weekStart);

if (isError) {
  // Log error with context
  logger.error("Failed to fetch weekly sessions", { error, weekStart });

  // Show user-friendly message
  return <ErrorDisplay message="Unable to load session data" />;
}
```

## 🎯 Performance Optimizations

### Server-Side

- ✅ Database aggregation (not client-side)
- ✅ Indexed columns for fast queries
- ✅ Single RPC call per dataset
- ✅ Query execution time <100ms

### Client-Side

- ✅ React.memo on chart components
- ✅ useCallback for event handlers
- ✅ Lazy loading charts with React.lazy
- ✅ React Query caching (5min staleTime)
- ✅ Parallel data fetching (3 weeks)
- ✅ Bundle size <300 KB for route

### Network

- ✅ Minimal data transfer (aggregated results only)
- ✅ Stale-while-revalidate pattern
- ✅ Cached responses reused across tabs

## 🧪 Testing Strategy

### Unit Tests

- **Utilities**: week-utils, month-utils
  - Calendar week boundaries
  - Month calculations
  - Edge cases (month boundaries, leap years)
  - Timezone handling

### Component Tests

- **SessionsByTypeChart**:
  - Renders with data
  - Shows all 7 session types
  - Displays legend correctly
  - Handles empty data
  - Responsive behavior

- **MonthlyActivityCard**:
  - Renders all 5 metrics
  - Displays correct values
  - Icons displayed
  - Responsive grid

### Integration Tests

- **Hooks**:
  - Mock Supabase client
  - Verify RPC calls
  - Test caching behavior
  - Error handling

- **Dashboard Page**:
  - All components render
  - Month selector works
  - Loading states displayed
  - Error states handled

### Manual Testing

- [ ] Desktop browser testing
- [ ] Mobile browser testing
- [ ] Tablet browser testing
- [ ] Different time zones
- [ ] Empty data scenarios
- [ ] Large datasets (performance)

## 📊 Data Types

### TypeScript Interfaces

```typescript
// Matches get_weekly_session_stats return
interface WeeklySessionStats {
  week_start: string;
  week_end: string;
  total_sessions: number;
  trial: number;
  member: number;
  contractual: number;
  multi_site: number;
  collaboration: number;
  makeup: number;
  non_bookable: number;
}

// Matches get_monthly_activity_stats return
interface MonthlyActivityStats {
  month_start: string;
  month_end: string;
  trial_sessions: number;
  trial_conversions: number;
  subscriptions_expired: number;
  subscriptions_renewed: number;
  subscriptions_cancelled: number;
}

// For chart data transformation
interface SessionTypeData {
  type: string;
  count: number;
  fill: string; // Color
}

// For 3-week view
interface ThreeWeekSessionsData {
  lastWeek: WeeklySessionStats | null;
  currentWeek: WeeklySessionStats | null;
  nextWeek: WeeklySessionStats | null;
}
```

## 🔐 Security Considerations

### Row Level Security (RLS)

- ✅ `training_sessions` table has RLS policies
- ✅ `member_subscriptions` table has RLS policies
- ✅ RPC functions respect RLS context
- ✅ Only authenticated admins can access analytics

### Input Validation

- ✅ Date parameters validated (YYYY-MM-DD format)
- ✅ SQL injection prevented (parameterized queries)
- ✅ Client-side date validation before API calls

### Data Access

- ✅ Analytics data only visible to admin role
- ✅ No PII exposed in aggregated data
- ✅ Error messages don't leak sensitive info

## 📈 Future Enhancements (P2)

### Advanced Analytics

- Comparison views (MoM, WoW, YoY)
- Trend forecasting
- Anomaly detection
- Custom date ranges

### Export Functionality

- CSV export for charts
- PDF report generation
- Scheduled email reports

### Customization

- Dashboard widget configuration
- Custom metric thresholds
- Personalized views per admin

### Real-Time Updates

- Supabase subscriptions for live data
- Auto-refresh on data changes
- Live session booking updates

## 🔗 Dependencies

### External

- Next.js 15.5
- React 19
- Tailwind CSS v4
- shadcn/ui
- Recharts 2.15.4
- date-fns 4.1.0
- @tanstack/react-query

### Internal

- `@/lib/supabase` - Supabase client
- `@/lib/logger` - Error logging
- `@/lib/date-utils` - Local timezone helpers
- `@/lib/utils` - cn() utility
- `@/components/ui/chart` - Chart components

## 📝 Documentation

- [START-HERE.md](./START-HERE.md) - Entry point
- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - Implementation workflow
- [STATUS.md](./STATUS.md) - Current progress
- [US-001 through US-008](.) - Individual user stories
- [/docs/RPC_SIGNATURES.md](/docs/RPC_SIGNATURES.md) - Database functions
- [/CLAUDE.md](/CLAUDE.md) - Project standards

---

**Version**: 1.0.0
**Last Updated**: 2025-11-15
**Status**: Ready for Implementation
