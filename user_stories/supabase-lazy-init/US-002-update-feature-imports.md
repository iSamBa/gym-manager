# US-002: Update Feature Imports

## User Story

**As a** developer migrating to lazy initialization
**I want** all feature modules to use `getSupabaseClient()`
**So that** we eliminate module-level side effects across the codebase

---

## Business Value

- Consistent lazy initialization pattern across all features
- Eliminates test timing issues in all modules
- Better code maintainability

---

## Acceptance Criteria

### AC-001: All Imports Identified

- [ ] Use Grep to find all imports of `supabase` from `@/lib/supabase`
- [ ] Document list of files to update
- [ ] Estimate number of changes needed

### AC-002: Feature Modules Updated

- [ ] All feature files updated to use `getSupabaseClient()`
- [ ] Each file tested after migration
- [ ] No breaking changes introduced

### AC-003: All Tests Pass

- [ ] All existing tests pass after migration
- [ ] No test regressions
- [ ] TypeScript compilation succeeds

---

## Technical Implementation

### Find All Imports

```bash
# Find all files importing supabase
grep -r "import.*supabase.*from.*@/lib/supabase" src/ --include="*.ts" --include="*.tsx"
```

### Migration Pattern

**BEFORE:**

```typescript
import { supabase } from "@/lib/supabase";

export async function fetchData() {
  const { data } = await supabase.from("table").select();
  return data;
}
```

**AFTER:**

```typescript
import { getSupabaseClient } from "@/lib/supabase";

export async function fetchData() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("table").select();
  return data;
}
```

---

## Testing Criteria

- [ ] Run tests for each feature after migration
- [ ] Full test suite passes
- [ ] TypeScript compilation succeeds
- [ ] No linting errors

---

## Definition of Done

- [ ] All feature modules identified
- [ ] All imports updated to `getSupabaseClient()`
- [ ] Each module tested individually
- [ ] Full test suite passes
- [ ] TypeScript compilation succeeds
- [ ] STATUS.md updated
- [ ] Changes committed

---

## Dependencies

**Depends on:** US-001 (must be complete first)
**Blocks:** US-003, US-004

---

**Estimated Effort:** 4-6 hours
