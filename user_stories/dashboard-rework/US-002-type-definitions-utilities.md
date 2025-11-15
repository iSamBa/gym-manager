# US-002: Type Definitions and Utility Functions

## 📋 User Story

**As a** developer
**I want** proper TypeScript types and date utility functions
**So that** the codebase is type-safe and date calculations are consistent

## 💼 Business Value

Type safety prevents runtime errors that could show incorrect data to admins. Consistent date utilities ensure calendar weeks are calculated correctly across all components, avoiding timezone bugs.

## ✅ Acceptance Criteria

### 1. TypeScript Interfaces Created

**File**: `src/features/dashboard/lib/types.ts`

**Interfaces**:

```typescript
export interface WeeklySessionStats {
  week_start: string; // YYYY-MM-DD
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

export interface MonthlyActivityStats {
  month_start: string;
  month_end: string;
  trial_sessions: number;
  trial_conversions: number;
  subscriptions_expired: number;
  subscriptions_renewed: number;
  subscriptions_cancelled: number;
}

export interface SessionTypeData {
  type: string;
  count: number;
  fill: string; // Color for chart
}

export interface ThreeWeekSessionsData {
  lastWeek: WeeklySessionStats | null;
  currentWeek: WeeklySessionStats | null;
  nextWeek: WeeklySessionStats | null;
}
```

- ✅ All interfaces match RPC return structures
- ✅ Field names use snake_case to match database
- ✅ Proper TypeScript exports

### 2. Week Utilities Created

**File**: `src/features/dashboard/lib/week-utils.ts`

**Functions**:

- `getCalendarWeekBounds(date: Date)` - Returns {week_start, week_end} for Monday-Sunday
- `getLastWeekBounds()` - Last week's bounds
- `getCurrentWeekBounds()` - Current week's bounds
- `getNextWeekBounds()` - Next week's bounds
- `formatWeekRange(start, end)` - Display string like "Jan 1 - 7, 2024"

**Requirements**:

- ✅ All functions use local timezone (via `@/lib/date-utils`)
- ✅ Week starts on Monday (weekStartsOn: 1)
- ✅ Uses date-fns for calculations
- ✅ Returns YYYY-MM-DD format dates

### 3. Month Utilities Created

**File**: `src/features/dashboard/lib/month-utils.ts`

**Functions**:

- `getMonthBounds(date: Date)` - Returns {month_start, month_end}
- `getCurrentMonthBounds()` - Current month bounds
- `getPreviousMonthBounds()` - Previous month bounds
- `getNextMonthBounds()` - Next month bounds
- `formatMonth(monthStart)` - Display string like "January 2024"
- `getMonthBoundsFromString(dateString)` - Parse date string to bounds

**Requirements**:

- ✅ All functions use local timezone
- ✅ Uses date-fns for calculations
- ✅ Returns YYYY-MM-DD format dates

### 4. Local Timezone Usage

- ✅ All utilities use `getLocalDateString()` from `@/lib/date-utils`
- ✅ No UTC conversions
- ✅ Consistent with project date handling standards

### 5. Unit Tests Created

**File**: `src/features/dashboard/lib/__tests__/week-utils.test.ts`
**File**: `src/features/dashboard/lib/__tests__/month-utils.test.ts`

**Test Coverage**:

- ✅ Week boundary calculations (Monday-Sunday)
- ✅ Month boundary calculations (first-last day)
- ✅ Edge cases (month/year boundaries, leap years)
- ✅ Format functions return correct strings
- ✅ Local timezone handling verified

## 🔧 Technical Scope

### Files to Create

- `src/features/dashboard/lib/types.ts`
- `src/features/dashboard/lib/week-utils.ts`
- `src/features/dashboard/lib/month-utils.ts`
- `src/features/dashboard/lib/__tests__/week-utils.test.ts`
- `src/features/dashboard/lib/__tests__/month-utils.test.ts`

### Dependencies

- date-fns (already installed)
- `@/lib/date-utils` (existing)

## 📊 Definition of Done

- [ ] All type interfaces created and exported
- [ ] Week utilities implemented with tests
- [ ] Month utilities implemented with tests
- [ ] All tests passing (100%)
- [ ] Local timezone usage verified
- [ ] No TypeScript errors
- [ ] Code follows CLAUDE.md standards

## 🔗 Dependencies

**Upstream**: US-001 (need RPC structure)
**Downstream**: US-003, US-004, US-005, US-006 (all use types/utilities)

## ⏱️ Estimated Effort

**Complexity**: Small
**Estimated Time**: 2-3 hours
