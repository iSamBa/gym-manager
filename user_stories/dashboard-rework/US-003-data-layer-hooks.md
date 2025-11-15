# US-003: Data Layer - Analytics Hooks and Queries

## 📋 User Story

**As a** developer  
**I want** reusable hooks for fetching analytics data  
**So that** components can access data efficiently with automatic caching

## 💼 Business Value

React Query hooks provide automatic caching, loading states, and error handling. This improves UX with instant data display from cache while fetching fresh data in the background.

## ✅ Acceptance Criteria

### 1. Analytics Utility Functions Created

**File**: `src/features/dashboard/lib/analytics-utils.ts`

- ✅ `getWeeklySessionStats(weekStartDate)` - Calls RPC, returns WeeklySessionStats | null
- ✅ `getMonthlyActivityStats(monthStartDate)` - Calls RPC, returns MonthlyActivityStats | null
- ✅ Error handling with logger
- ✅ Graceful degradation (return null on error)

### 2. Weekly Sessions Hook

**File**: `src/features/dashboard/hooks/use-weekly-sessions.ts`

- ✅ `useWeeklySessions(weekStart)` - Single week query
- ✅ `useThreeWeekSessions()` - Parallel queries for last/current/next
- ✅ staleTime: 5 min, gcTime: 10 min
- ✅ Proper query keys

### 3. Monthly Activity Hook

**File**: `src/features/dashboard/hooks/use-monthly-activity.ts`

- ✅ `useMonthlyActivity(monthStart)` - Monthly stats query
- ✅ Same caching strategy
- ✅ TypeScript types enforced

## 🔧 Technical Scope

**Files**: analytics-utils.ts, use-weekly-sessions.ts, use-monthly-activity.ts  
**Pattern**: Follow `src/features/database/hooks/use-analytics.ts`

## 📊 Definition of Done

- [ ] All hooks implemented with proper caching
- [ ] Error handling with logger
- [ ] TypeScript types enforced
- [ ] Follows existing patterns
- [ ] Lint passes

## 🔗 Dependencies

**Upstream**: US-001, US-002  
**Downstream**: US-004, US-005, US-006

## ⏱️ Effort: 2-3 hours (Medium)
