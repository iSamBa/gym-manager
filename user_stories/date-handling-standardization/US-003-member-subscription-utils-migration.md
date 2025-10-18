# US-003: Member & Subscription Utils Migration

**Status**: Not Started
**Priority**: P0 (Critical Bug Fix)
**Estimated Time**: 2-3 hours
**Assigned To**: TBD
**Dependencies**: US-001 (Core Date Utility Library)

---

## 📋 User Story

**As a** developer
**I want** all member and subscription date operations to use correct formatting
**So that** database stores dates correctly and queries work reliably

---

## 🎯 Business Value

### Problem

- 50+ instances of `.toISOString()` used for date columns (should be date format only)
- Member join_date, subscription start_date/end_date storing full timestamps
- Inconsistent date vs timestamp handling
- Database queries may fail or return unexpected results

### Solution

Migrate all member and subscription utilities to use `formatForDatabase()` for date columns and `formatTimestampForDatabase()` for timestamp columns.

---

## ✅ Acceptance Criteria

### AC1: Member Utils Updated

**Files to modify**:

- `src/features/members/lib/database-utils.ts`
- `src/features/members/lib/comments-utils.ts`

**Changes required**:

1. Line 269: `join_date` uses `formatForDatabase()`
2. Line 324: `updated_at` uses `formatTimestampForDatabase()`
3. Line 446: Date comparison uses `getLocalDateString()`
4. Comments-utils line 28: Uses `getLocalDateString()`

### AC2: Subscription Utils Updated

**Files to modify**:

- `src/features/memberships/lib/subscription-utils.ts`
- `src/features/memberships/lib/notification-utils.ts`

**Changes required**:

1. All `start_date`, `end_date`, `pause_start_date`, `pause_end_date`, `cancellation_date` use `formatForDatabase()`
2. All `created_at`, `updated_at` use `formatTimestampForDatabase()`
3. Line 236, 252, 289: Use `formatForDatabase()` for date fields
4. Notification timestamps use `formatTimestampForDatabase()`

### AC3: All Tests Passing

- [ ] Member database utils tests pass
- [ ] Subscription utils tests pass
- [ ] Date format verified in database
- [ ] No regressions

---

## 🔧 Technical Implementation

### Pattern to Replace

```typescript
// ❌ WRONG - Full ISO string for date column
await supabase.from("members").insert({
  join_date: new Date().toISOString(), // ❌ "2025-10-18T01:26:00.000Z"
});

// ✅ CORRECT - Date format for date column
import { formatForDatabase } from "@/lib/date-utils";
await supabase.from("members").insert({
  join_date: formatForDatabase(new Date()), // ✅ "2025-10-18"
});
```

### Files and Line Numbers

**Member Utils** (`src/features/members/lib/database-utils.ts`):

- Line 269: `join_date: memberData.join_date || formatForDatabase(new Date())`
- Line 324: `updated_at: formatTimestampForDatabase(new Date())`
- Line 446: `gte("join_date", getLocalDateString(firstDayOfMonth))`

**Comments Utils** (`src/features/members/lib/comments-utils.ts`):

- Line 28: `const today = getLocalDateString();`

**Subscription Utils** (`src/features/memberships/lib/subscription-utils.ts`):

- Lines 36, 38-44: Use `formatForDatabase()` for all date fields
- Lines 71, 112, 156, 208, 236, 252, 289: Use correct format function
- Lines 112, 156, 222: `updated_at` uses `formatTimestampForDatabase()`

**Notification Utils** (`src/features/memberships/lib/notification-utils.ts`):

- Line 43: `created_at: formatTimestampForDatabase(new Date())`
- Line 93: `created_at: formatTimestampForDatabase(new Date())`

---

## ✅ Definition of Done

- [ ] All member utils migrated to use date-utils
- [ ] All subscription utils migrated to use date-utils
- [ ] Date columns use `formatForDatabase()`
- [ ] Timestamptz columns use `formatTimestampForDatabase()`
- [ ] Zero `.toISOString()` calls for date columns
- [ ] All tests passing
- [ ] Database manual verification (dates stored correctly)

---

**Ready to implement?**

```bash
/implement-userstory US-003
```
