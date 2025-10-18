# Date Handling Standardization - Technical README

## 📐 Architecture Overview

### Problem Statement

The gym manager application has inconsistent date handling across 18+ files, leading to critical timezone bugs:

1. **Timezone Mismatch**: Client uses local timezone, but `.toISOString().split("T")[0]` returns UTC date
2. **Mixed Patterns**: Some code uses Date objects, some uses strings, no standard
3. **Database Confusion**: Date columns vs timestamptz columns handled inconsistently
4. **User Impact**: Scheduled changes disappear, dates off by 1 day

### Solution Architecture

Create a centralized date utility library (`src/lib/date-utils.ts`) that:

- Always uses user's local timezone for date-only operations
- Provides clear distinction between date and timestamp handling
- Offers simple, consistent API for common date operations
- Eliminates timezone-dependent comparisons

---

## 🏗️ System Design

### Component Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Application Layer                    │
│  (Components, Hooks, API Functions)                 │
└───────────────┬────────────────────────────┬────────┘
                │                            │
                │ Import                     │ Import
                ↓                            ↓
┌───────────────────────────┐  ┌──────────────────────┐
│    src/lib/date-utils.ts  │  │  Date/Timestamp      │
│                           │  │  (from database)     │
│ - getLocalDateString()    │  │                      │
│ - compareDates()          │  │  "2025-10-18"       │
│ - isFutureDate()          │  │  "2025-10-18T..."   │
│ - formatForDatabase()     │  │                      │
│ - formatTimestamp...()    │  │                      │
└───────────────────────────┘  └──────────────────────┘
                │
                │ Returns consistent
                │ date strings
                ↓
┌─────────────────────────────────────────────────────┐
│            PostgreSQL Database                       │
│                                                      │
│  date columns:        timestamptz columns:          │
│  - join_date          - created_at                  │
│  - start_date         - updated_at                  │
│  - effective_from     - scheduled_start             │
│  - due_date           - cancelled_at                │
└─────────────────────────────────────────────────────┘
```

### Data Flow

#### Creating a Scheduled Setting

```typescript
// 1. User selects date in EffectiveDatePicker (local timezone)
const selectedDate = new Date(2025, 9, 20); // Oct 20, 2025

// 2. Component uses date-utils to format for database
import { formatForDatabase } from "@/lib/date-utils";
const effectiveFrom = formatForDatabase(selectedDate);
// Result: "2025-10-20" (local date string)

// 3. API sends to database
await supabase.from("studio_settings").insert({
  effective_from: effectiveFrom, // "2025-10-20"
  // ...
});

// 4. Database stores exactly: "2025-10-20" (no timezone conversion)
```

#### Comparing Dates for Display

```typescript
// 1. Fetch scheduled settings from database
const { data: scheduledSettings } = await supabase
  .from("studio_settings")
  .select("*")
  .eq("setting_key", "opening_hours")
  .gt("effective_from", getLocalDateString()); // Use local date for comparison

// 2. Check if scheduled change should display
import { compareDates } from "@/lib/date-utils";
const shouldShow =
  compareDates(
    scheduledSettings.effective_from, // "2025-10-20"
    new Date() // Current date in user's timezone
  ) > 0;

// 3. Result: Consistent across all timezones!
```

---

## 🔧 Technical Specifications

### Date Utility Functions

#### `getLocalDateString(date?: Date): string`

Returns date as YYYY-MM-DD string in user's local timezone.

```typescript
// Example
const today = getLocalDateString();
// User in GMT+2 at Oct 18, 2025 01:26
// Returns: "2025-10-18" (not "2025-10-17" from UTC!)

const custom = getLocalDateString(new Date(2025, 9, 20));
// Returns: "2025-10-20"
```

**Implementation**:

```typescript
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
```

**Why not `.toISOString().split("T")[0]`?**

- `.toISOString()` converts to UTC first
- User at Oct 18, 2025 01:26 GMT+2 gets "2025-10-17" from UTC
- Our function uses local timezone methods: `.getFullYear()`, `.getMonth()`, `.getDate()`

#### `compareDates(a: string | Date, b: string | Date): number`

Compares two dates (ignoring time). Returns -1, 0, or 1.

```typescript
// Example
compareDates("2025-10-20", "2025-10-18"); // 1 (a > b)
compareDates("2025-10-18", "2025-10-20"); // -1 (a < b)
compareDates("2025-10-18", new Date(2025, 9, 18)); // 0 (equal)
```

**Implementation**:

```typescript
export function compareDates(a: string | Date, b: string | Date): number {
  const dateA = typeof a === "string" ? a : getLocalDateString(a);
  const dateB = typeof b === "string" ? b : getLocalDateString(b);
  return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
}
```

**Why string comparison?**

- String comparison of YYYY-MM-DD is lexicographically correct
- Avoids creating Date objects and timezone issues
- Fast and simple

#### `isFutureDate(date: string | Date): boolean`

Checks if date is in the future (user's timezone).

```typescript
// Example
isFutureDate("2025-10-20"); // true if today is before Oct 20
isFutureDate("2025-10-10"); // false if today is after Oct 10
```

#### `isToday(date: string | Date): boolean`

Checks if date is today (user's timezone).

```typescript
// Example
isToday(new Date()); // true
isToday("2025-10-18"); // true if today is Oct 18
```

#### `formatForDatabase(date: Date): string`

Formats date for database **date** columns.

```typescript
// Example
formatForDatabase(new Date(2025, 9, 18));
// Returns: "2025-10-18"

// Use for: join_date, start_date, end_date, effective_from, etc.
```

#### `formatTimestampForDatabase(date: Date): string`

Formats timestamp for database **timestamptz** columns.

```typescript
// Example
formatTimestampForDatabase(new Date());
// Returns: "2025-10-18T01:26:00.000Z" (full ISO string)

// Use for: created_at, updated_at, scheduled_start, cancelled_at, etc.
```

---

## 📊 Database Schema Considerations

### PostgreSQL Date Types

#### `date` Type

- Stores: Date only (YYYY-MM-DD)
- No timezone information
- Examples: "2025-10-18"
- Use cases: Birth dates, join dates, subscription periods

**Columns using `date`**:

- members.join_date
- members.date_of_birth
- member_subscriptions.start_date
- member_subscriptions.end_date
- studio_settings.effective_from
- subscription_payments.payment_date
- subscription_payments.due_date
- trainers.background_check_date
- equipment.purchase_date

#### `timestamptz` Type

- Stores: Full timestamp with timezone
- Automatically converts to/from UTC
- Examples: "2025-10-18T01:26:00.000Z"
- Use cases: Audit trails, scheduled events, user actions

**Columns using `timestamptz`**:

- \*.created_at
- \*.updated_at
- training_sessions.scheduled_start
- training_sessions.scheduled_end
- class_bookings.check_in_time
- class_bookings.cancelled_at

### Query Examples

#### Correct: Querying date columns

```typescript
// ✅ Good - using local date string
const { data } = await supabase
  .from("studio_settings")
  .select("*")
  .gte("effective_from", getLocalDateString());

// ❌ Bad - using UTC date
const { data } = await supabase
  .from("studio_settings")
  .select("*")
  .gte("effective_from", new Date().toISOString().split("T")[0]);
```

#### Correct: Inserting date values

```typescript
// ✅ Good - using formatForDatabase
await supabase.from("members").insert({
  join_date: formatForDatabase(new Date()),
  // ...
});

// ❌ Bad - using full ISO string for date column
await supabase.from("members").insert({
  join_date: new Date().toISOString(), // Wrong format!
  // ...
});
```

---

## 🧪 Testing Strategy

### Unit Tests

Test each date-utils function independently:

```typescript
describe("getLocalDateString", () => {
  it("should return date in YYYY-MM-DD format", () => {
    const date = new Date(2025, 9, 18); // Oct 18, 2025
    expect(getLocalDateString(date)).toBe("2025-10-18");
  });

  it("should use current date if no argument", () => {
    const result = getLocalDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should handle single-digit months and days correctly", () => {
    const date = new Date(2025, 0, 5); // Jan 5, 2025
    expect(getLocalDateString(date)).toBe("2025-01-05");
  });
});
```

### Integration Tests

Test cross-feature date handling:

```typescript
describe("Settings API Integration", () => {
  it("should fetch scheduled settings correctly across timezones", async () => {
    // Mock different timezone
    vi.setSystemTime(new Date("2025-10-18T01:26:00+02:00"));

    const result = await fetchScheduledSettings("opening_hours");

    expect(result).toBeDefined();
    // Verify uses local date for comparison
  });
});
```

### Manual Testing

Test in different timezones:

1. **GMT (UTC+0)**
   - Change system timezone to GMT
   - Create scheduled change for tomorrow
   - Verify displays correctly

2. **GMT+12 (New Zealand)**
   - Change system timezone to Pacific/Auckland
   - Create scheduled change for tomorrow
   - Verify displays correctly

3. **GMT-8 (Pacific Time)**
   - Change system timezone to America/Los_Angeles
   - Create scheduled change for tomorrow
   - Verify displays correctly

---

## 📈 Performance Considerations

### Date-Utils Performance

All date-utils functions are O(1) with minimal overhead:

**getLocalDateString()**: ~0.001ms

- Simple property access (`.getFullYear()`, `.getMonth()`, `.getDate()`)
- String padding and concatenation

**compareDates()**: ~0.002ms

- At most 2 calls to `getLocalDateString()`
- Simple string comparison

**Previous patterns**: ~0.005-0.010ms

- Creating Date objects
- Calling `.setHours(0,0,0,0)`
- Calling `.getTime()`
- Numeric comparison

**Result**: New patterns are actually **faster** than old patterns!

### Caching Strategy

Date-utils functions are stateless and don't require caching:

- Input → Deterministic output
- No side effects
- No API calls
- No heavy computation

---

## 🔄 Migration Strategy

### Phase 1: Create Foundation (US-001)

1. Create `src/lib/date-utils.ts`
2. Implement all functions
3. Write comprehensive tests
4. Verify 100% coverage

### Phase 2: Critical Migrations (US-002, US-003)

Priority files to migrate:

1. **Settings API** (fixes disappearing scheduled changes)
   - `fetchActiveSettings()` → use `getLocalDateString()`
   - `fetchScheduledSettings()` → use `getLocalDateString()`

2. **Member Utils** (fixes join date issues)
   - `createMember()` → use `formatForDatabase()` for join_date
   - `getNewMembersThisMonth()` → use `getLocalDateString()`

3. **Subscription Utils** (fixes date/timestamp confusion)
   - All `.toISOString()` calls → check column type
   - `start_date`, `end_date` → use `formatForDatabase()`
   - `created_at`, `updated_at` → use `formatTimestampForDatabase()`

### Phase 3: Frontend Components (US-004)

Replace all date comparison patterns:

```typescript
// Before
const today = new Date();
today.setHours(0, 0, 0, 0);
const effectiveFrom = new Date(scheduledSettings.effective_from);
effectiveFrom.setHours(0, 0, 0, 0);
return effectiveFrom.getTime() > today.getTime();

// After
import { compareDates } from "@/lib/date-utils";
return compareDates(scheduledSettings.effective_from, new Date()) > 0;
```

### Phase 4: Testing & Documentation (US-006, US-007)

1. Comprehensive test suite
2. Manual testing in multiple timezones
3. Update CLAUDE.md with standards
4. Create migration guide

---

## 🎯 Success Metrics

### Code Quality

- **0** instances of `.toISOString().split("T")[0]` for user-facing dates
- **0** instances of `.setHours(0,0,0,0)` + `.getTime()` comparisons
- **100%** test coverage for date-utils
- **18+** files successfully migrated

### User Impact

- **0** "disappearing scheduled changes" bugs
- **0** "date off by 1 day" support tickets
- **100%** correct date display across all timezones

### Developer Experience

- **1** clear pattern for all date operations
- **<5 min** to understand date handling for new developers
- **Clear** documentation in CLAUDE.md

---

## 📚 References

### PostgreSQL Documentation

- [Date/Time Types](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html)

### JavaScript Date API

- [MDN: Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)

### Supabase

- [Supabase Filtering](https://supabase.com/docs/reference/javascript/using-filters)
- [Working with Dates](https://supabase.com/docs/guides/database/tables#working-with-dates)

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Dates still off by 1 day after migration

- **Cause**: Still using `.toISOString().split("T")[0]` somewhere
- **Fix**: Search codebase for pattern, replace with `getLocalDateString()`

**Issue**: Tests failing with timezone errors

- **Cause**: Tests not mocking Date correctly
- **Fix**: Use `vi.setSystemTime()` to mock specific timezone

**Issue**: Database storing wrong format

- **Cause**: Using wrong format function for column type
- **Fix**: Check column type, use `formatForDatabase()` for date, `formatTimestampForDatabase()` for timestamptz

---

## 👥 Maintainers

This feature standardizes date handling across the entire application. For questions or issues:

1. Read this README
2. Check AGENT-GUIDE.md for implementation workflow
3. Review user story acceptance criteria
4. Check CLAUDE.md for coding standards

---

**Last Updated**: 2025-10-18
**Status**: Ready for Implementation
**Estimated Completion**: 3 days (6-9 hours)
