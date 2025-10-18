# Date Handling Standardization - START HERE

## 🎯 Feature Overview

**Feature Name**: Date Handling Standardization
**Status**: Not Started
**Priority**: P0 (Critical)
**Estimated Time**: 6-9 hours

### What is this?

This feature standardizes date handling across the entire application by creating a centralized date utility library and migrating all date operations to use consistent, timezone-aware patterns.

### Why is this important?

The application currently has **critical timezone inconsistencies** causing:

- ❌ Scheduled changes disappearing due to date comparison failures
- ❌ Dates off by 1 day depending on user's timezone
- ❌ Database queries returning inconsistent results
- ❌ 18+ files with conflicting date handling patterns

### Business Impact

- **User Experience**: Eliminate confusing "disappearing data" bugs
- **Data Integrity**: Ensure all date operations use user's local timezone
- **Developer Experience**: Clear patterns for future date handling
- **Reliability**: Reduce timezone-related support tickets

---

## 📋 User Stories Overview

| Story  | Title                                  | Priority | Estimated Time | Status      |
| ------ | -------------------------------------- | -------- | -------------- | ----------- |
| US-001 | Core Date Utility Library              | P0       | 2-3 hours      | Not Started |
| US-002 | Settings API Date Handling             | P0       | 1 hour         | Not Started |
| US-003 | Member & Subscription Utils Migration  | P0       | 2-3 hours      | Not Started |
| US-004 | Frontend Components Date Handling      | P1       | 1-2 hours      | Not Started |
| US-005 | Training Sessions & Conflict Detection | P1       | 2 hours        | Not Started |
| US-006 | Testing & Validation                   | P0       | 1-2 hours      | Not Started |
| US-007 | Documentation & Standards              | P1       | 1 hour         | Not Started |

**Total Estimated Time**: 6-9 hours

---

## 🚀 Getting Started

### Prerequisites

- [x] Comprehensive date handling analysis completed
- [x] 18+ files identified for migration
- [x] Critical bugs documented
- [x] User timezone requirements understood

### Recommended Implementation Order

1. **US-001** (Foundation) - Create date-utils library FIRST
2. **US-002** (Critical Bug) - Fix settings API
3. **US-003** (Critical Bug) - Fix member/subscription utils
4. **US-006** (Quality Gate) - Run tests after critical fixes
5. **US-004** (User-Facing) - Fix frontend components
6. **US-005** (Integration) - Fix training sessions
7. **US-007** (Documentation) - Update standards

### Quick Start

```bash
# 1. Read the analysis report (already completed)
# 2. Start with US-001 to create the foundation
/implement-userstory US-001

# 3. After US-001 is done, implement critical bug fixes
/implement-userstory US-002
/implement-userstory US-003

# 4. Run tests to verify critical fixes
/implement-userstory US-006

# 5. Continue with remaining stories
/implement-userstory US-004
/implement-userstory US-005
/implement-userstory US-007
```

---

## 📚 Key Documents

- **[AGENT-GUIDE.md](./AGENT-GUIDE.md)** - Step-by-step implementation workflow
- **[README.md](./README.md)** - Technical architecture and design decisions
- **[STATUS.md](./STATUS.md)** - Current progress and tracking
- **User Stories** - Individual US-00X files with detailed requirements

---

## 🔑 Key Concepts

### Date vs Timestamp

**Date Columns** (`date` type in PostgreSQL):

- Store date only: `"2025-10-18"`
- No timezone information
- Use for: join_date, start_date, end_date, effective_from, etc.
- **Format with**: `formatForDatabase(date)` → Returns YYYY-MM-DD in user's timezone

**Timestamptz Columns** (`timestamp with time zone` in PostgreSQL):

- Store full datetime with timezone: `"2025-10-18T01:26:00.000Z"`
- Automatically converts to/from UTC
- Use for: created_at, updated_at, scheduled_start, cancelled_at, etc.
- **Format with**: `formatTimestampForDatabase(date)` → Returns full ISO string

### The Problem Patterns

❌ **BAD** - Uses UTC date (wrong for user timezone):

```typescript
const today = new Date().toISOString().split("T")[0];
// User at Oct 18, 2025 01:26 GMT+2
// Returns: "2025-10-17" (UTC time!)
```

✅ **GOOD** - Uses local date:

```typescript
import { getLocalDateString } from "@/lib/date-utils";
const today = getLocalDateString();
// User at Oct 18, 2025 01:26 GMT+2
// Returns: "2025-10-18" (user's local date!)
```

❌ **BAD** - Timezone-dependent comparison:

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);
const effectiveFrom = new Date(scheduledSettings.effective_from);
return effectiveFrom.getTime() > today.getTime();
```

✅ **GOOD** - String-based comparison:

```typescript
import { compareDates } from "@/lib/date-utils";
return compareDates(scheduledSettings.effective_from, new Date()) > 0;
```

---

## 🎯 Success Criteria

This feature is complete when:

- ✅ `src/lib/date-utils.ts` created with comprehensive tests
- ✅ All 18+ files migrated to use date-utils
- ✅ No more `.toISOString().split("T")[0]` patterns for user-facing dates
- ✅ No more `.setHours(0,0,0,0)` + `.getTime()` comparisons
- ✅ Scheduled changes display correctly in all timezones
- ✅ All tests pass (unit + integration)
- ✅ CLAUDE.md updated with date handling standards
- ✅ Zero "date off by 1" bug reports

---

## 🚨 Important Notes

### Do NOT Skip US-001

US-001 creates the foundation. All other stories depend on it. Implementing stories out of order will cause:

- Import errors (date-utils doesn't exist)
- Inconsistent patterns
- Harder to review changes

### Test After Critical Fixes

After completing US-001, US-002, and US-003, MUST run US-006 tests to verify critical bugs are fixed before continuing.

### Review Database Column Types

When migrating, always check if the column is `date` or `timestamptz`:

- `date` → Use `formatForDatabase()`
- `timestamptz` → Use `formatTimestampForDatabase()`

---

## 📞 Need Help?

- Read the comprehensive analysis in the commit message
- Check AGENT-GUIDE.md for step-by-step workflow
- Review README.md for technical architecture
- Each user story has detailed implementation guidance

---

**Ready to start?** Begin with US-001 to create the foundation!

```bash
/implement-userstory US-001
```
