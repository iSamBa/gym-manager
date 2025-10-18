# Date Handling Migration Guide

This guide provides step-by-step instructions for migrating existing code to use the centralized `date-utils` library.

## Table of Contents

- [Overview](#overview)
- [Why Migrate?](#why-migrate)
- [Migration Patterns](#migration-patterns)
  - [Pattern 1: Database Date Storage](#pattern-1-database-date-storage)
  - [Pattern 2: Date Comparisons](#pattern-2-date-comparisons)
  - [Pattern 3: Date Picker Validation](#pattern-3-date-picker-validation)
  - [Pattern 4: Database Queries](#pattern-4-database-queries)
- [Step-by-Step Migration](#step-by-step-migration)
- [Testing After Migration](#testing-after-migration)
- [Common Issues](#common-issues)

---

## Overview

The `src/lib/date-utils.ts` library provides timezone-safe date handling for the gym management application. All date utilities use **local timezone** instead of UTC to prevent bugs like:

- ❌ "Disappearing scheduled changes" (dates stored in UTC but displayed in local time)
- ❌ Join dates showing one day earlier/later than selected
- ❌ Subscription dates not matching user expectations
- ❌ Training session conflicts not detected correctly

## Why Migrate?

**Before migration** (problematic patterns):

```typescript
// ❌ UTC date extraction (may be wrong day in user's timezone)
const dateStr = new Date().toISOString().split("T")[0];

// ❌ Manual timezone manipulation (verbose, error-prone)
const today = new Date();
today.setHours(0, 0, 0, 0);
const comparison = date.getTime() >= today.getTime();

// ❌ Inconsistent date formatting
const formatted = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
```

**After migration** (using date-utils):

```typescript
// ✅ Local timezone date extraction
import { getLocalDateString } from "@/lib/date-utils";
const dateStr = getLocalDateString(new Date());

// ✅ Clean date comparison
import { getStartOfDay } from "@/lib/date-utils";
const comparison = date >= getStartOfDay();

// ✅ Consistent formatting
import { formatForDatabase } from "@/lib/date-utils";
const formatted = formatForDatabase(new Date());
```

---

## Migration Patterns

### Pattern 1: Database Date Storage

**Before:**

```typescript
// ❌ Manual date formatting
const member = await supabase.from("members").insert({
  join_date: new Date().toISOString().split("T")[0], // UTC date
  created_at: new Date().toISOString(),
});
```

**After:**

```typescript
// ✅ Using date-utils
import {
  formatForDatabase,
  formatTimestampForDatabase,
} from "@/lib/date-utils";

const member = await supabase.from("members").insert({
  join_date: formatForDatabase(new Date()), // Local date
  created_at: formatTimestampForDatabase(), // UTC timestamp
});
```

**When to use:**

- Inserting/updating date or timestamptz columns
- Storing user-selected dates (join_date, start_date, etc.)
- Recording system timestamps (created_at, updated_at)

---

### Pattern 2: Date Comparisons

**Before:**

```typescript
// ❌ Manual date comparison
const today = new Date();
today.setHours(0, 0, 0, 0);
const isPast = selectedDate.getTime() < today.getTime();

// ❌ String comparison without normalization
const isAfter = dateString1 > dateString2; // May fail with different formats
```

**After:**

```typescript
// ✅ Using date-utils
import { getStartOfDay, compareDates } from "@/lib/date-utils";

const isPast = selectedDate < getStartOfDay();
const isAfter = compareDates(dateString1, dateString2) > 0;
```

**When to use:**

- Validating user input (date pickers, forms)
- Sorting dates
- Filtering by date ranges
- Checking if date is in past/future

---

### Pattern 3: Date Picker Validation

**Before:**

```typescript
// ❌ Verbose validation logic
<Calendar
  selected={date}
  onSelect={setDate}
  disabled={(date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }}
/>
```

**After:**

```typescript
// ✅ Clean validation with date-utils
import { getStartOfDay } from '@/lib/date-utils';

<Calendar
  selected={date}
  onSelect={setDate}
  disabled={(date) => date < getStartOfDay()}  // Prevent past dates
/>
```

**When to use:**

- Date picker validation (prevent past dates)
- Form field validation
- Calendar component disabled logic

---

### Pattern 4: Database Queries

**Before:**

```typescript
// ❌ UTC date in query (may exclude records in user's timezone)
const sessionDate = new Date(timestamp).toISOString().split("T")[0];

const { data } = await supabase
  .from("member_comments")
  .select("*")
  .gte("due_date", sessionDate); // May be wrong day
```

**After:**

```typescript
// ✅ Local date in query
import { getLocalDateString } from "@/lib/date-utils";

const sessionDate = getLocalDateString(new Date(timestamp));

const { data } = await supabase
  .from("member_comments")
  .select("*")
  .gte("due_date", sessionDate); // Correct day in user's timezone
```

**When to use:**

- Querying by date columns
- Filtering records by date range
- Extracting date from timestamps for comparison

---

## Step-by-Step Migration

### Step 1: Find Problematic Patterns

Use grep to locate code that needs migration:

```bash
# Find UTC date conversions
grep -r "toISOString().split" src/ --include="*.ts" --include="*.tsx"

# Find manual midnight calculations
grep -r "setHours(0, 0, 0, 0)" src/ --include="*.ts" --include="*.tsx"

# Find manual date formatting
grep -r "padStart(2, '0')" src/ --include="*.ts" --include="*.tsx"
```

### Step 2: Analyze Each Occurrence

For each occurrence, determine:

1. **Purpose**: What is the date operation doing?
2. **Column type**: Is this for a `date` or `timestamptz` column?
3. **Use case**: Database storage, comparison, validation, or query?

### Step 3: Choose Correct Function

| Use Case                    | Function                       | Example                                       |
| --------------------------- | ------------------------------ | --------------------------------------------- |
| Store user-selected date    | `formatForDatabase()`          | `join_date: formatForDatabase(new Date())`    |
| Store system timestamp      | `formatTimestampForDatabase()` | `created_at: formatTimestampForDatabase()`    |
| Extract date from timestamp | `getLocalDateString()`         | `getLocalDateString(new Date(timestamp))`     |
| Compare dates               | `compareDates()`               | `compareDates(date1, date2) > 0`              |
| Check if future             | `isFutureDate()`               | `isFutureDate(subscription.start_date)`       |
| Check if today              | `isToday()`                    | `isToday(session.scheduled_start)`            |
| Date picker validation      | `getStartOfDay()`              | `disabled={(date) => date < getStartOfDay()}` |

### Step 4: Replace Code

**Example 1: Database Insert**

```diff
- const join_date = new Date().toISOString().split('T')[0];
+ import { formatForDatabase } from '@/lib/date-utils';
+ const join_date = formatForDatabase(new Date());
```

**Example 2: Date Comparison**

```diff
- const today = new Date();
- today.setHours(0, 0, 0, 0);
- if (dueDate.getTime() < today.getTime()) {
-   return false;
- }
+ import { getStartOfDay } from '@/lib/date-utils';
+ if (dueDate < getStartOfDay()) {
+   return false;
+ }
```

**Example 3: Database Query**

```diff
- const sessionDate = new Date(sessionTimestamp).toISOString().split('T')[0];
+ import { getLocalDateString } from '@/lib/date-utils';
+ const sessionDate = getLocalDateString(new Date(sessionTimestamp));
```

### Step 5: Update Imports

Add necessary imports at the top of the file:

```typescript
import {
  getLocalDateString,
  formatForDatabase,
  formatTimestampForDatabase,
  getStartOfDay,
  compareDates,
  isFutureDate,
  isToday,
} from "@/lib/date-utils";
```

**Tip**: Only import what you need to keep imports clean.

---

## Testing After Migration

### 1. Run Unit Tests

```bash
npm test
```

**Expected**: All tests should pass with no regressions.

### 2. Run Linting

```bash
npm run lint
```

**Expected**: No errors or warnings.

### 3. Manual Testing Checklist

Test in your local timezone (and ideally in GMT+12 and GMT-8 to verify edge cases):

- [ ] Create a new member with today's join date → Verify it displays as today
- [ ] Create a scheduled change for tomorrow → Verify it shows as tomorrow
- [ ] Create a subscription starting next week → Verify start date is correct
- [ ] Add a comment with due date today → Verify it doesn't show as past due
- [ ] Book a training session for tomorrow → Verify date picker allows it
- [ ] View member analytics → Verify dates display correctly

### 4. Database Verification

```sql
-- Check that dates are stored correctly
SELECT id, join_date, created_at
FROM members
WHERE id = '[test-member-id]';

-- Verify dates match expectations (local date, not UTC)
```

---

## Common Issues

### Issue 1: "Date is one day off"

**Symptom**: User selects Oct 18, but database shows Oct 17 (or Oct 19).

**Cause**: Using `.toISOString().split('T')[0]` which converts to UTC first.

**Fix**:

```diff
- const date = selectedDate.toISOString().split('T')[0];
+ import { formatForDatabase } from '@/lib/date-utils';
+ const date = formatForDatabase(selectedDate);
```

### Issue 2: "Date picker allows past dates"

**Symptom**: Date picker doesn't prevent selecting yesterday.

**Cause**: Comparison doesn't account for time component.

**Fix**:

```diff
- disabled={(date) => date < new Date()}
+ import { getStartOfDay } from '@/lib/date-utils';
+ disabled={(date) => date < getStartOfDay()}
```

### Issue 3: "TypeScript error: Cannot find module"

**Symptom**: `TS2307: Cannot find module '@/lib/date-utils'`

**Cause**: Import alias not resolved.

**Fix**: Verify `tsconfig.json` has correct path mappings:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue 4: "Query returns no results"

**Symptom**: Database query with date filter returns empty array.

**Cause**: Comparing date string with timestamptz column incorrectly.

**Fix**:

```diff
// For timestamptz columns, extract date first
- .gte('scheduled_start', sessionDate)
+ .gte('scheduled_start', `${sessionDate}T00:00:00`)

// Or better: use date column for date comparisons
// Schema: Add a computed `scheduled_date` (date) column
```

---

## Completed Migrations

The following files have already been migrated as part of the date-handling-standardization feature:

### US-003: Member & Subscription Utils

- ✅ `src/features/database/lib/member-db-utils.ts` (5 changes)
- ✅ `src/features/database/lib/member-comments-utils.ts` (1 change)
- ✅ `src/features/database/lib/subscription-db-utils.ts` (10 changes)
- ✅ `src/features/memberships/lib/notification-utils.ts` (4 changes)

### US-004: Frontend Components

- ✅ `src/features/training-sessions/components/forms/SessionBookingForm.tsx` (1 change)
- ✅ `src/features/members/components/CommentDialog.tsx` (2 changes)

### US-005: Training Sessions

- ✅ `src/features/training-sessions/hooks/use-session-alerts.ts` (1 change)

**Total**: 7 files migrated, 24 date operations updated, 885 tests passing.

---

## Need Help?

- **Documentation**: See `CLAUDE.md` Date Handling Standards section
- **Examples**: Check `src/lib/__tests__/date-utils.test.ts` for usage examples
- **Reference**: See migrated files listed above for real-world patterns

---

**Last Updated**: 2025-10-18
**Feature**: date-handling-standardization
**Status**: Complete (US-007)
