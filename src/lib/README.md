# Date Utils Library

Centralized date handling utilities for timezone-safe date operations.

## Quick Start

```typescript
import {
  getLocalDateString,
  formatForDatabase,
  getStartOfDay,
  compareDates,
} from '@/lib/date-utils';

// Get today's date as string
const today = getLocalDateString(new Date()); // "2025-10-18"

// Format for database storage
const joinDate = formatForDatabase(new Date()); // "2025-10-18"

// Date picker validation
<Calendar disabled={(date) => date < getStartOfDay()} />

// Compare dates
const isLater = compareDates(date1, date2) > 0;
```

## Core Principle

**All user-facing dates use local timezone, NOT UTC.**

This prevents bugs like:

- Scheduled changes appearing one day early/late
- Join dates not matching user selection
- Training session conflicts not detected

## Function Reference

### `getLocalDateString(date: Date): string`

Convert a Date object to YYYY-MM-DD string in **local timezone**.

**Use for:**

- Extracting date from timestamps
- Database queries with date columns
- Displaying dates to users

**Example:**

```typescript
const sessionDate = getLocalDateString(new Date(session.scheduled_start));
// "2025-10-18" (in user's local timezone)

// Query by date
const { data } = await supabase
  .from("sessions")
  .select("*")
  .eq("session_date", sessionDate);
```

**Performance**: < 0.1ms per call

---

### `compareDates(a: string | Date, b: string | Date): number`

Compare two dates (works with strings or Date objects).

**Returns:**

- `-1` if a < b (a is earlier)
- `0` if a === b (same date)
- `1` if a > b (a is later)

**Use for:**

- Sorting dates
- Conditional logic
- Filtering date ranges

**Example:**

```typescript
// Sort members by join date
members.sort((a, b) => compareDates(a.join_date, b.join_date));

// Check if subscription is active
if (
  compareDates(today, sub.start_date) >= 0 &&
  compareDates(today, sub.end_date) <= 0
) {
  // Subscription is active
}
```

---

### `isFutureDate(date: string | Date): boolean`

Check if a date is in the future (after today).

**Use for:**

- Filtering upcoming items
- Validation logic
- Conditional rendering

**Example:**

```typescript
// Show only future subscriptions
const upcoming = subscriptions.filter((sub) => isFutureDate(sub.start_date));

// Validate effective date
if (!isFutureDate(effectiveFrom)) {
  setError("Effective date must be in the future");
}
```

---

### `isToday(date: string | Date): boolean`

Check if a date is today.

**Use for:**

- Highlighting current items
- "Today" badges in UI
- Today-specific logic

**Example:**

```typescript
// Highlight today's sessions
<SessionCard
  className={isToday(session.date) ? "border-primary" : ""}
/>

// Show "Today" badge
{isToday(session.date) && <Badge>Today</Badge>}
```

---

### `formatForDatabase(date: Date): string`

Format a Date for PostgreSQL `date` columns (no timezone).

**Use for:**

- join_date, birth_date
- start_date, end_date
- effective_from, due_date
- Any user-selected date

**Returns**: YYYY-MM-DD in local timezone

**Example:**

```typescript
const member = await supabase.from("members").insert({
  join_date: formatForDatabase(new Date()),
  // Stored as "2025-10-18" (user's local date)
});
```

**⚠️ Important**: Only use for `date` columns, NOT `timestamptz`.

---

### `formatTimestampForDatabase(date?: Date): string`

Format a Date for PostgreSQL `timestamptz` columns (with timezone).

**Use for:**

- created_at, updated_at
- scheduled_start, cancelled_at
- Any system-generated timestamp

**Returns**: ISO 8601 string with timezone

**Example:**

```typescript
const comment = await supabase.from("member_comments").insert({
  created_at: formatTimestampForDatabase(),
  // Stored as "2025-10-18T01:26:00.000Z"
});
```

**⚠️ Important**: Only use for `timestamptz` columns, NOT `date`.

---

### `getStartOfDay(date?: Date): Date`

Get a Date object at midnight (00:00:00.000) in local timezone.

**Use for:**

- Date picker validation
- UI date comparisons
- "Today" comparisons that need Date objects

**Example:**

```typescript
// Prevent selecting past dates
<Calendar
  disabled={(date) => date < getStartOfDay()}
/>

// Check if due date is in the past
const isPastDue = formData.due_date < getStartOfDay();
```

**Note**: Returns a Date object, not a string. For string comparisons, use `getLocalDateString()`.

---

## Decision Tree: Which Function to Use?

```
Need to work with dates?
│
├─ Storing in database?
│  ├─ User-selected date (join_date, start_date, etc.)
│  │  └─> formatForDatabase()
│  │
│  └─ System timestamp (created_at, updated_at, etc.)
│     └─> formatTimestampForDatabase()
│
├─ Comparing dates?
│  ├─ Need sort order (-1, 0, 1)
│  │  └─> compareDates()
│  │
│  ├─ Check if future
│  │  └─> isFutureDate()
│  │
│  ├─ Check if today
│  │  └─> isToday()
│  │
│  └─ Date picker validation (needs Date object)
│     └─> getStartOfDay()
│
└─ Extracting date from timestamp?
   └─> getLocalDateString()
```

## Common Patterns

### Pattern 1: Member Join Date

```typescript
import { formatForDatabase } from "@/lib/date-utils";

// User selects join date in UI
const handleSubmit = async (formData) => {
  await supabase.from("members").insert({
    name: formData.name,
    join_date: formatForDatabase(formData.selectedDate),
    created_at: formatTimestampForDatabase(),
  });
};
```

### Pattern 2: Subscription Date Validation

```typescript
import { compareDates, isFutureDate } from "@/lib/date-utils";

// Validate subscription dates
if (compareDates(endDate, startDate) <= 0) {
  setError("End date must be after start date");
}

if (!isFutureDate(startDate)) {
  setWarning("Start date is in the past");
}
```

### Pattern 3: Session Alerts Query

```typescript
import { getLocalDateString } from "@/lib/date-utils";

// Get alerts due on or after session date
const sessionDate = getLocalDateString(new Date(session.scheduled_start));

const { data } = await supabase
  .from("member_comments")
  .select("*")
  .eq("member_id", memberId)
  .not("due_date", "is", null)
  .gte("due_date", sessionDate);
```

### Pattern 4: Date Picker with Validation

```typescript
import { getStartOfDay } from '@/lib/date-utils';
import { Calendar } from '@/components/ui/calendar';

<Calendar
  mode="single"
  selected={selectedDate}
  onSelect={setSelectedDate}
  disabled={(date) => date < getStartOfDay()}  // No past dates
/>
```

## Database Schema Guidelines

### Use `date` columns for:

```sql
CREATE TABLE members (
  join_date date,           -- User-selected date
  birth_date date,          -- User-selected date
  subscription_start date,  -- User-selected date
  subscription_end date     -- User-selected date
);
```

**Format with**: `formatForDatabase()`

### Use `timestamptz` columns for:

```sql
CREATE TABLE members (
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  cancelled_at timestamptz
);
```

**Format with**: `formatTimestampForDatabase()`

## Testing

All date-utils functions have 100% test coverage. See tests at:

- `src/lib/__tests__/date-utils.test.ts`

Run tests:

```bash
npm test src/lib/__tests__/date-utils.test.ts
```

## Migration

Migrating existing code? See the comprehensive guide:

- `docs/DATE-HANDLING-MIGRATION.md`

Quick migration checklist:

- [ ] Replace `.toISOString().split('T')[0]` with `getLocalDateString()`
- [ ] Replace `.setHours(0,0,0,0)` with `getStartOfDay()`
- [ ] Use `formatForDatabase()` for date columns
- [ ] Use `formatTimestampForDatabase()` for timestamptz columns
- [ ] Run tests to verify no regressions

## Examples from Codebase

Real-world usage examples:

**Database Operations:**

- `src/features/database/lib/member-db-utils.ts` (member join dates)
- `src/features/database/lib/subscription-db-utils.ts` (subscription dates)

**Frontend Components:**

- `src/features/training-sessions/components/forms/SessionBookingForm.tsx` (date picker)
- `src/features/members/components/CommentDialog.tsx` (due date validation)

**Queries:**

- `src/features/training-sessions/hooks/use-session-alerts.ts` (date-based filtering)

## Performance

All functions are highly optimized:

| Function                       | Avg Time | Notes                              |
| ------------------------------ | -------- | ---------------------------------- |
| `getLocalDateString()`         | < 0.1ms  | No external dependencies           |
| `compareDates()`               | < 0.1ms  | String comparison                  |
| `isFutureDate()`               | < 0.1ms  | Uses `compareDates()`              |
| `isToday()`                    | < 0.1ms  | Uses `compareDates()`              |
| `formatForDatabase()`          | < 0.1ms  | Wrapper for `getLocalDateString()` |
| `formatTimestampForDatabase()` | < 0.1ms  | Native `.toISOString()`            |
| `getStartOfDay()`              | < 0.1ms  | Single Date mutation               |

**No external dependencies** - keeps bundle size small.

## Anti-Patterns

**❌ DON'T:**

```typescript
// ❌ Using UTC for user-facing dates
const date = new Date().toISOString().split("T")[0];

// ❌ Manual timezone manipulation
const today = new Date();
today.setHours(0, 0, 0, 0);

// ❌ Inconsistent formatting
const formatted = `${year}-${month}-${day}`;
```

**✅ DO:**

```typescript
// ✅ Use date-utils
import { getLocalDateString, getStartOfDay } from "@/lib/date-utils";

const date = getLocalDateString(new Date());
const today = getStartOfDay();
```

## Related Documentation

- **Standards**: See `CLAUDE.md` → Date Handling Standards
- **Migration Guide**: See `docs/DATE-HANDLING-MIGRATION.md`
- **Tests**: See `src/lib/__tests__/date-utils.test.ts`
- **Examples**: See migrated files in `src/features/`

---

**Maintained by**: Development Team
**Last Updated**: 2025-10-18
**Test Coverage**: 100% (51/51 tests passing)
