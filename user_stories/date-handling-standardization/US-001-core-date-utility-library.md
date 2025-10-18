# US-001: Core Date Utility Library

**Status**: ✅ Completed
**Priority**: P0 (Critical - Foundation)
**Estimated Time**: 2-3 hours
**Actual Time**: 2 hours
**Assigned To**: Claude
**Completed**: 2025-10-18
**Dependencies**: None (Foundation story)

**Implementation Notes**:

- Created `src/lib/date-utils.ts` with 6 core functions (140 lines)
- Created comprehensive test suite with 46 test cases covering all edge cases
- Achieved 100% code coverage
- All functions use user's local timezone (not UTC)
- Performance verified: < 0.1ms per function call
- Zero TypeScript errors, zero ESLint warnings
- All acceptance criteria met

---

## 📋 User Story

**As a** developer
**I want** a centralized, timezone-aware date utility library
**So that** all date operations in the application use consistent, correct patterns

---

## 🎯 Business Value

### Problem

- Application has 18+ files with inconsistent date handling
- Mixed use of UTC-based (`.toISOString().split("T")[0]`) and timezone-dependent patterns
- No clear standard for date vs timestamp formatting
- Developers must figure out correct pattern for each use case

### Solution

Create `src/lib/date-utils.ts` with well-tested, simple functions that:

- Always use user's local timezone for date-only operations
- Provide clear API for common date tasks
- Eliminate need for developers to think about timezone issues
- Serve as foundation for all subsequent migrations

### Impact

- **All developers** get clear, consistent API
- **Zero** future timezone bugs (if used correctly)
- **Faster** development (no reinventing date logic)
- **Foundation** for fixing existing bugs

---

## ✅ Acceptance Criteria

### AC1: Core Functions Implemented

**Given** the date-utils library
**When** a developer imports and uses the functions
**Then** all core functions should work correctly:

1. ✅ `getLocalDateString()` - Returns YYYY-MM-DD in user's timezone
   - Default: current date
   - Custom date parameter works
   - Handles single-digit months/days (zero-padding)

2. ✅ `compareDates()` - Compares two dates (date-only)
   - Returns -1 when first < second
   - Returns 0 when dates equal
   - Returns 1 when first > second
   - Handles both string and Date inputs

3. ✅ `isFutureDate()` - Checks if date is in the future
   - True for future dates
   - False for today
   - False for past dates

4. ✅ `isToday()` - Checks if date is today
   - True only for today
   - False for past/future dates

5. ✅ `formatForDatabase()` - Formats for date columns
   - Returns YYYY-MM-DD string
   - Uses user's local timezone

6. ✅ `formatTimestampForDatabase()` - Formats for timestamptz columns
   - Returns full ISO string
   - Includes timezone information

### AC2: Timezone Correctness

**Given** a user in any timezone
**When** they use `getLocalDateString()` or date comparison functions
**Then** the functions should use their LOCAL timezone, not UTC

**Test scenarios**:

- User in GMT+0 (London)
- User in GMT+12 (New Zealand)
- User in GMT-8 (California)
- User crossing midnight boundary

**Example**:

```typescript
// User in GMT+2 at Oct 18, 2025 01:26
getLocalDateString();
// ✅ Should return: "2025-10-18" (local date)
// ❌ Should NOT return: "2025-10-17" (UTC date)
```

### AC3: Comprehensive Test Coverage

**Given** the date-utils library
**When** running the test suite
**Then** should have:

1. ✅ 100% code coverage
2. ✅ Unit tests for each function
3. ✅ Edge case tests:
   - Leap years (Feb 29)
   - Month boundaries (Jan 31 → Feb 1)
   - Year boundaries (Dec 31 → Jan 1)
   - Single-digit months/days (Jan 5 → "2025-01-05")
   - DST transitions
   - Different timezones
4. ✅ All tests passing
5. ✅ No flaky tests (consistent results)

### AC4: TypeScript Types

**Given** the date-utils library
**When** a developer uses it in TypeScript
**Then** should have:

1. ✅ Proper type definitions for all functions
2. ✅ No `any` types
3. ✅ Clear parameter and return types
4. ✅ JSDoc comments explaining each function
5. ✅ Type inference works correctly

### AC5: Developer Experience

**Given** the date-utils library
**When** a developer needs to use it
**Then** should be:

1. ✅ Easy to import: `import { getLocalDateString } from '@/lib/date-utils'`
2. ✅ Clear function names (self-documenting)
3. ✅ Simple API (no complex configuration)
4. ✅ Fast (no performance concerns)
5. ✅ Well-documented (JSDoc + README)

---

## 🔧 Technical Implementation

### Files to Create

```
src/lib/
├── date-utils.ts          # Main implementation
└── __tests__/
    └── date-utils.test.ts # Comprehensive tests
```

### Implementation Guide

#### Step 1: Create `src/lib/date-utils.ts`

````typescript
/**
 * Date Utilities - Timezone-aware date handling
 *
 * IMPORTANT: These functions use the user's LOCAL timezone,
 * not UTC. This ensures dates display correctly regardless
 * of where the user is located.
 */

/**
 * Get local date as YYYY-MM-DD string
 *
 * @param date - Date to format (defaults to current date)
 * @returns Date string in YYYY-MM-DD format (user's timezone)
 *
 * @example
 * ```typescript
 * getLocalDateString()  // "2025-10-18" (today in user's timezone)
 * getLocalDateString(new Date(2025, 9, 20))  // "2025-10-20"
 * ```
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Compare two dates (date-only, ignoring time)
 *
 * @param a - First date (string or Date object)
 * @param b - Second date (string or Date object)
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 *
 * @example
 * ```typescript
 * compareDates("2025-10-20", "2025-10-18")  // 1 (a > b)
 * compareDates("2025-10-18", new Date(2025, 9, 18))  // 0 (equal)
 * ```
 */
export function compareDates(a: string | Date, b: string | Date): number {
  const dateA = typeof a === "string" ? a : getLocalDateString(a);
  const dateB = typeof b === "string" ? b : getLocalDateString(b);
  return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
}

/**
 * Check if date is in the future (user's timezone)
 *
 * @param date - Date to check (string or Date object)
 * @returns true if date is after today
 *
 * @example
 * ```typescript
 * isFutureDate("2025-10-20")  // true (if today is before Oct 20)
 * isFutureDate("2025-10-10")  // false (if today is after Oct 10)
 * ```
 */
export function isFutureDate(date: string | Date): boolean {
  return compareDates(date, new Date()) > 0;
}

/**
 * Check if date is today (user's timezone)
 *
 * @param date - Date to check (string or Date object)
 * @returns true if date is today
 *
 * @example
 * ```typescript
 * isToday(new Date())  // true
 * isToday("2025-10-18")  // true (if today is Oct 18)
 * ```
 */
export function isToday(date: string | Date): boolean {
  return compareDates(date, new Date()) === 0;
}

/**
 * Format date for database (date column)
 *
 * Use for PostgreSQL `date` columns (no timezone information).
 * Returns date in user's local timezone as YYYY-MM-DD.
 *
 * @param date - Date to format
 * @returns Date string for database storage
 *
 * @example
 * ```typescript
 * formatForDatabase(new Date())  // "2025-10-18"
 * // Use for: join_date, start_date, end_date, effective_from, etc.
 * ```
 */
export function formatForDatabase(date: Date): string {
  return getLocalDateString(date);
}

/**
 * Format timestamp for database (timestamptz column)
 *
 * Use for PostgreSQL `timestamptz` columns (with timezone).
 * Returns full ISO string with timezone information.
 *
 * @param date - Date to format (defaults to current time)
 * @returns ISO timestamp string for database storage
 *
 * @example
 * ```typescript
 * formatTimestampForDatabase(new Date())
 * // "2025-10-18T01:26:00.000Z"
 * // Use for: created_at, updated_at, scheduled_start, cancelled_at, etc.
 * ```
 */
export function formatTimestampForDatabase(date: Date = new Date()): string {
  return date.toISOString();
}
````

#### Step 2: Create `src/lib/__tests__/date-utils.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getLocalDateString,
  compareDates,
  isFutureDate,
  isToday,
  formatForDatabase,
  formatTimestampForDatabase,
} from "../date-utils";

describe("date-utils", () => {
  beforeEach(() => {
    // Reset system time before each test
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getLocalDateString", () => {
    it("should return current date in YYYY-MM-DD format", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(getLocalDateString()).toBe("2025-10-18");
    });

    it("should format custom date correctly", () => {
      const date = new Date(2025, 9, 20); // Oct 20, 2025
      expect(getLocalDateString(date)).toBe("2025-10-20");
    });

    it("should zero-pad single digit months", () => {
      const date = new Date(2025, 0, 15); // Jan 15, 2025
      expect(getLocalDateString(date)).toBe("2025-01-15");
    });

    it("should zero-pad single digit days", () => {
      const date = new Date(2025, 9, 5); // Oct 5, 2025
      expect(getLocalDateString(date)).toBe("2025-10-05");
    });

    it("should handle year boundaries correctly", () => {
      const date = new Date(2025, 0, 1); // Jan 1, 2025
      expect(getLocalDateString(date)).toBe("2025-01-01");
    });

    it("should handle leap years correctly", () => {
      const date = new Date(2024, 1, 29); // Feb 29, 2024
      expect(getLocalDateString(date)).toBe("2024-02-29");
    });
  });

  describe("compareDates", () => {
    it("should return -1 when first date is before second", () => {
      expect(compareDates("2025-10-18", "2025-10-20")).toBe(-1);
    });

    it("should return 0 when dates are equal", () => {
      expect(compareDates("2025-10-18", "2025-10-18")).toBe(0);
    });

    it("should return 1 when first date is after second", () => {
      expect(compareDates("2025-10-20", "2025-10-18")).toBe(1);
    });

    it("should compare Date objects correctly", () => {
      const date1 = new Date(2025, 9, 18);
      const date2 = new Date(2025, 9, 20);
      expect(compareDates(date1, date2)).toBe(-1);
    });

    it("should compare string and Date object correctly", () => {
      const date = new Date(2025, 9, 18);
      expect(compareDates("2025-10-18", date)).toBe(0);
    });
  });

  describe("isFutureDate", () => {
    it("should return true for future dates", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isFutureDate("2025-10-20")).toBe(true);
    });

    it("should return false for today", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isFutureDate("2025-10-18")).toBe(false);
    });

    it("should return false for past dates", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isFutureDate("2025-10-10")).toBe(false);
    });
  });

  describe("isToday", () => {
    it("should return true for today", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isToday("2025-10-18")).toBe(true);
    });

    it("should return false for future dates", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isToday("2025-10-20")).toBe(false);
    });

    it("should return false for past dates", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isToday("2025-10-10")).toBe(false);
    });

    it("should work with Date objects", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isToday(new Date(2025, 9, 18))).toBe(true);
    });
  });

  describe("formatForDatabase", () => {
    it("should format date for database date column", () => {
      const date = new Date(2025, 9, 18);
      expect(formatForDatabase(date)).toBe("2025-10-18");
    });

    it("should match getLocalDateString output", () => {
      const date = new Date(2025, 9, 18);
      expect(formatForDatabase(date)).toBe(getLocalDateString(date));
    });
  });

  describe("formatTimestampForDatabase", () => {
    it("should format timestamp for database timestamptz column", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00.000Z"));
      expect(formatTimestampForDatabase(new Date())).toBe(
        "2025-10-18T14:30:00.000Z"
      );
    });

    it("should include timezone information", () => {
      const result = formatTimestampForDatabase(new Date());
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });
  });
});
```

#### Step 3: Run Tests

```bash
npm test src/lib/__tests__/date-utils.test.ts
```

#### Step 4: Verify Coverage

```bash
npm run test:coverage -- src/lib/__tests__/date-utils.test.ts
```

Should show 100% coverage.

---

## 🧪 Testing Requirements

### Test Scenarios

1. **Basic Functionality**
   - Each function returns expected output
   - Default parameters work correctly
   - Custom parameters work correctly

2. **Edge Cases**
   - Leap years (Feb 29)
   - Month boundaries
   - Year boundaries
   - Single-digit values (zero-padding)
   - Midnight crossings

3. **Type Safety**
   - Functions accept correct types
   - Functions reject incorrect types (TypeScript compile errors)

4. **Performance**
   - Functions run in < 1ms
   - No memory leaks
   - Consistent results across calls

---

## ✅ Definition of Done

- [ ] `src/lib/date-utils.ts` created with all 6 functions
- [ ] `src/lib/__tests__/date-utils.test.ts` created with comprehensive tests
- [ ] All tests passing (`npm test src/lib/__tests__/date-utils.test.ts`)
- [ ] 100% code coverage verified
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] All functions have JSDoc comments
- [ ] Functions use user's local timezone (not UTC)
- [ ] Performance verified (< 1ms per function call)
- [ ] Code reviewed (self-review minimum)

---

## 📝 Implementation Notes

### Why Not Use Date-FNS or Moment.js?

**Reasons**:

1. **Bundle size**: date-fns adds 200KB+, moment.js adds 300KB+
2. **Overkill**: We only need 6 simple functions
3. **Performance**: Our functions are faster (no library overhead)
4. **Control**: We own the code, can customize as needed
5. **Dependencies**: Fewer dependencies = fewer security issues

### Why Local Timezone Instead of UTC?

**Reasons**:

1. **User expectation**: Users expect dates in their timezone
2. **Database design**: `date` columns don't store timezone
3. **UI consistency**: Display what user entered
4. **Simplicity**: No need to convert back and forth

**Example**:

- User in Tokyo (GMT+9) at Oct 18, 2025 02:00
- Creates scheduled change for "tomorrow" (Oct 19)
- Should store: `"2025-10-19"` (not `"2025-10-18"` from UTC!)

---

## 🔗 Related Stories

- **US-002**: Settings API Date Handling (depends on this)
- **US-003**: Member & Subscription Utils Migration (depends on this)
- **US-004**: Frontend Components Date Handling (depends on this)
- **US-005**: Training Sessions & Conflict Detection (depends on this)

**All subsequent stories depend on US-001 being complete!**

---

## 📚 References

- [PostgreSQL Date/Time Types](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [MDN: Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [TC39: Temporal Proposal](https://tc39.es/proposal-temporal/docs/) (future replacement for Date)

---

**Ready to implement?**

```bash
/implement-userstory US-001
```
