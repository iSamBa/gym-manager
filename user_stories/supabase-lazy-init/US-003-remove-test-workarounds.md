# US-003: Remove Test Workarounds

## User Story

**As a** developer maintaining test infrastructure
**I want** to remove the `process.env` workaround from test setup
**So that** test configuration is clean and maintainable

---

## Business Value

- Cleaner test setup code
- No more hacky workarounds
- Proper lazy initialization makes workarounds unnecessary

---

## Acceptance Criteria

### AC-001: Remove process.env Workaround

- [ ] Lines 11-12 removed from `vitest.setup.ts`
- [ ] Comments updated to reflect lazy init pattern
- [ ] Keep `vi.stubEnv()` in `beforeEach()` for test control

### AC-002: Remove Eager Initialization

- [ ] `export const supabase` removed from `src/lib/supabase.ts`
- [ ] Only lazy pattern remains
- [ ] No backward compatibility code left

### AC-003: All Tests Pass

- [ ] All tests pass without workarounds
- [ ] No env var timing issues
- [ ] Clean test execution

---

## Technical Implementation

### vitest.setup.ts Changes

**REMOVE:**

```typescript
// Lines 11-12
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
```

**KEEP:**

```typescript
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
});
```

### src/lib/supabase.ts Changes

**REMOVE:**

```typescript
export const supabase = createBrowserClient(...); // DELETE THIS
```

**KEEP:**

```typescript
export function getSupabaseClient() { ... } // KEEP THIS
export function resetSupabaseClient() { ... } // KEEP THIS
```

---

## Testing Criteria

- [ ] All tests pass without `process.env` workaround
- [ ] No errors about missing env vars
- [ ] Clean test output

---

## Definition of Done

- [ ] Workarounds removed from `vitest.setup.ts`
- [ ] Eager initialization removed from `src/lib/supabase.ts`
- [ ] All tests pass
- [ ] Comments updated
- [ ] STATUS.md updated
- [ ] Changes committed

---

## Dependencies

**Depends on:** US-001, US-002 (all migrations must be complete)
**Blocks:** US-004

---

**Estimated Effort:** 1-2 hours
