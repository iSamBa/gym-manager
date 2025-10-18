# US-007: Documentation & Standards

**Status**: Not Started
**Priority**: P1 (Developer Experience)
**Estimated Time**: 1 hour
**Dependencies**: All previous stories

---

## 📋 User Story

**As a** developer
**I want** clear documentation on date handling standards
**So that** I can maintain consistency in future development

---

## ✅ Acceptance Criteria

### AC1: CLAUDE.md Updated

Add new section "Date Handling Standards":

```markdown
## Date Handling Standards

### ALWAYS Use date-utils

Import from `@/lib/date-utils`:

- `getLocalDateString()` - Get today's date
- `compareDates()` - Compare dates
- `formatForDatabase()` - Format for date columns
- `formatTimestampForDatabase()` - Format for timestamptz columns

### NEVER Use These Patterns

❌ `.toISOString().split("T")[0]` for user-facing dates
❌ `.setHours(0,0,0,0)` + `.getTime()` comparisons
❌ Full ISO string for date columns

### Column Type Guide

**date columns** → Use `formatForDatabase()`

- join_date, start_date, end_date, effective_from, etc.

**timestamptz columns** → Use `formatTimestampForDatabase()`

- created_at, updated_at, scheduled_start, cancelled_at, etc.
```

### AC2: Migration Guide Created

Create `docs/DATE-HANDLING-MIGRATION.md` with:

- How to identify date vs timestamp columns
- Before/after code examples
- Common pitfalls
- Testing checklist

### AC3: JSDoc Comments Complete

All date-utils functions have:

- Clear description
- Parameter documentation
- Return value documentation
- Usage examples

### AC4: README in date-utils

Create `src/lib/README.md` explaining:

- When to use each function
- Why we use local timezone
- Common patterns

---

## ✅ Definition of Done

- [ ] CLAUDE.md updated
- [ ] Migration guide created
- [ ] JSDoc comments complete
- [ ] README created
- [ ] All documentation reviewed

---

```bash
/implement-userstory US-007
```
