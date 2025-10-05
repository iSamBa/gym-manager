# Supabase Lazy Initialization - Technical Architecture

## Overview

This document describes the technical architecture for refactoring Supabase client initialization from **eager** (module-level) to **lazy** (on-demand) initialization.

---

## Current Architecture (Eager Initialization)

### File: `src/lib/supabase.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for browser-side operations
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Problems

1. **Module-Level Execution:**
   - `createBrowserClient()` executes **immediately** when module is imported
   - Cannot be delayed or controlled
   - Happens before test setup runs

2. **Test Environment Issues:**
   - Client creation fails if env vars not set
   - Requires workaround: set `process.env` before ANY imports
   - Current fix in `vitest.setup.ts` (lines 11-12):
     ```typescript
     process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
     ```

3. **Module Side Effects:**
   - Importing `@/lib/supabase` has side effects
   - Violates functional programming principles
   - Makes module harder to test in isolation

4. **Unnecessary Initialization:**
   - Client created even if never used
   - No way to delay until actually needed

### Import Chain Example

```
Test File (use-session-booking-with-credits.test.tsx)
  ↓ imports
Hook (use-session-booking-with-credits.ts)
  ↓ imports
Util (subscription-utils.ts)
  ↓ imports
src/lib/supabase.ts → createBrowserClient() EXECUTES HERE ❌
```

If env vars not set at this point → **CRASH**

---

## Proposed Architecture (Lazy Initialization)

### Design Pattern: Singleton with Lazy Initialization

```typescript
// src/lib/supabase.ts
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton instance of Supabase client
 * Created lazily on first access
 */
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get Supabase client instance (creates on first call)
 *
 * @returns Supabase client for browser-side operations
 *
 * @example
 * const supabase = getSupabaseClient();
 * const { data } = await supabase.from('members').select();
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}

/**
 * Reset the Supabase client instance (mainly for testing)
 * @internal
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null;
}
```

### Benefits

1. **Lazy Initialization:**
   - Client only created when `getSupabaseClient()` is called
   - No module-level side effects
   - Safe to import without executing

2. **Singleton Pattern:**
   - First call creates instance
   - Subsequent calls return cached instance
   - No performance penalty

3. **Test-Friendly:**
   - Easy to mock: `vi.mock('@/lib/supabase', () => ({ getSupabaseClient: vi.fn() }))`
   - Can reset between tests with `resetSupabaseClient()`
   - No timing issues with env vars

4. **Type Safety:**
   - Return type is `SupabaseClient` (fully typed)
   - No `any` types needed

---

## Migration Strategy

### Phase 1: Create New Pattern (US-001)

**Goal:** Implement lazy factory function alongside existing eager initialization

**Changes:**

```typescript
// src/lib/supabase.ts

// OLD (keep temporarily for backward compatibility)
export const supabase = createBrowserClient(...);

// NEW (add this)
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(...);
  }
  return supabaseInstance;
}

export function resetSupabaseClient(): void {
  supabaseInstance = null;
}
```

**Testing:**

```typescript
// src/lib/__tests__/supabase-lazy.test.ts
describe("getSupabaseClient", () => {
  it("creates client on first call", () => {
    const client = getSupabaseClient();
    expect(client).toBeDefined();
  });

  it("returns same instance (singleton)", () => {
    const client1 = getSupabaseClient();
    const client2 = getSupabaseClient();
    expect(client1).toBe(client2);
  });

  it("can be reset for testing", () => {
    const client1 = getSupabaseClient();
    resetSupabaseClient();
    const client2 = getSupabaseClient();
    expect(client1).not.toBe(client2); // New instance created
  });
});
```

### Phase 2: Gradual Migration (US-002)

**Goal:** Update feature modules one at a time to use lazy pattern

**Migration Pattern:**

```typescript
// BEFORE
import { supabase } from "@/lib/supabase";

export async function fetchMembers() {
  const { data } = await supabase.from("members").select();
  return data;
}

// AFTER
import { getSupabaseClient } from "@/lib/supabase";

export async function fetchMembers() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("members").select();
  return data;
}
```

**Files to Update** (find with Grep):

```bash
# Find all files importing supabase
grep -r "import.*supabase.*from.*@/lib/supabase" src/
```

Expected locations:

- `src/features/*/lib/*.ts` (feature utilities)
- `src/features/*/hooks/*.ts` (feature hooks)
- `src/lib/auth-provider.tsx` (auth context)
- `src/hooks/use-*.ts` (shared hooks)

**Testing After Each Migration:**

```bash
# Test the specific feature after migrating
npm test -- src/features/members

# Run full suite periodically
npm test
```

### Phase 3: Remove Old Pattern (US-003)

**Goal:** Clean up backward compatibility code and test workarounds

**Changes:**

1. **Remove eager initialization from `src/lib/supabase.ts`:**

   ```typescript
   // DELETE THIS
   export const supabase = createBrowserClient(...);
   ```

2. **Remove test workarounds from `vitest.setup.ts`:**

   ```typescript
   // DELETE THESE LINES (11-12)
   process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
   ```

3. **Keep `vi.stubEnv()` in `beforeEach()` for per-test control:**
   ```typescript
   beforeEach(() => {
     vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
     vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
   });
   ```

### Phase 4: Validation (US-004)

**Goal:** Comprehensive testing and documentation

**Testing Checklist:**

- [ ] Unit tests for lazy factory
- [ ] All feature tests pass
- [ ] Integration tests pass
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Performance benchmarks

**Documentation:**

- Update README.md with lazy pattern
- Add JSDoc comments to factory function
- Update architectural documentation

---

## Testing Strategy

### Unit Tests (Lazy Factory)

```typescript
// src/lib/__tests__/supabase-lazy.test.ts
describe("getSupabaseClient", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    resetSupabaseClient();
  });

  it("creates client on first call", () => {
    const client = getSupabaseClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it("returns same instance on subsequent calls (singleton)", () => {
    const client1 = getSupabaseClient();
    const client2 = getSupabaseClient();
    expect(client1).toBe(client2);
  });

  it("creates new instance after reset", () => {
    const client1 = getSupabaseClient();
    resetSupabaseClient();
    const client2 = getSupabaseClient();
    expect(client1).not.toBe(client2);
  });

  it("throws error if env vars missing", () => {
    vi.unstubAllEnvs();
    expect(() => getSupabaseClient()).toThrow();
  });
});
```

### Integration Tests

```typescript
// Test that lazy init works in real usage
describe("Lazy init integration", () => {
  it("works in data fetching", async () => {
    const { data } = await fetchMembers(); // Uses getSupabaseClient() internally
    expect(data).toBeDefined();
  });

  it("works in hooks", () => {
    const { result } = renderHook(() => useMembers());
    expect(result.current).toBeDefined();
  });
});
```

### Performance Testing

```typescript
// Measure performance impact
describe("Performance", () => {
  it("has minimal overhead", () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      getSupabaseClient(); // Should return cached instance
    }
    const end = performance.now();
    expect(end - start).toBeLessThan(10); // < 10ms for 1000 calls
  });
});
```

---

## Backward Compatibility

During migration (US-002), both patterns will work:

```typescript
// src/lib/supabase.ts (during migration)

// OLD pattern (keep for backward compatibility)
export const supabase = createBrowserClient(...);

// NEW pattern (recommended)
let supabaseInstance: SupabaseClient | null = null;
export function getSupabaseClient(): SupabaseClient {
  // ...
}
```

**Benefits:**

- No breaking changes
- Can migrate modules incrementally
- Test each migration individually
- Rollback is easy if issues found

**After All Migrations Complete (US-003):**

- Remove `export const supabase = ...`
- Only keep `getSupabaseClient()`

---

## Performance Considerations

### Singleton Pattern Performance

**First Call:**

- Creates Supabase client
- Caches instance
- Cost: ~1-2ms

**Subsequent Calls:**

- Returns cached instance
- Cost: ~0.001ms (negligible)

**Conclusion:** No performance regression expected

### Bundle Size

- No change in bundle size
- Same Supabase SDK imported
- Only organizational change

---

## Type Safety

### Before (Eager)

```typescript
import { supabase } from "@/lib/supabase";
// supabase: SupabaseClient (inferred)
```

### After (Lazy)

```typescript
import { getSupabaseClient } from "@/lib/supabase";
const supabase = getSupabaseClient();
// supabase: SupabaseClient (explicit return type)
```

**Type safety is maintained** - no `any` types needed.

---

## Error Handling

### Current (Eager)

```typescript
// Fails at module load time if env vars missing
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // Crashes here
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Proposed (Lazy)

```typescript
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error(
        "Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return supabaseInstance;
}
```

**Benefits:**

- Better error messages
- Fails at usage time (more debuggable)
- Can be caught and handled by application

---

## Security Considerations

### No Change to Security Model

- Same Supabase client configuration
- Same API keys and authentication
- Only initialization timing changes

### Test Environment

- Test env vars are **fake** (safe)
- No real credentials in test setup
- Production uses real env vars from `.env.local`

---

## Rollback Plan

If issues are discovered:

1. **During Migration (US-002):**
   - Keep old eager initialization
   - Revert specific file changes
   - No breaking changes

2. **After Migration (US-003):**
   - Re-add eager initialization
   - Update imports back to old pattern
   - May require new migration effort

**Recommendation:** Test thoroughly during US-002 before proceeding to US-003.

---

## Success Metrics

### Definition of Success

- [ ] All tests pass (100% pass rate)
- [ ] No performance regression
- [ ] Zero TypeScript errors
- [ ] Zero linting errors
- [ ] Test setup is cleaner (no workarounds)
- [ ] Code is more maintainable
- [ ] Documentation is complete

### Performance Benchmarks

| Metric               | Before   | After    | Target        |
| -------------------- | -------- | -------- | ------------- |
| Client creation time | ~1-2ms   | ~1-2ms   | No regression |
| Subsequent access    | ~0.001ms | ~0.001ms | No regression |
| Bundle size          | X KB     | X KB     | No change     |
| Test execution time  | Y ms     | Y ms     | No regression |

---

## References

- [Singleton Pattern](https://refactoring.guru/design-patterns/singleton)
- [Lazy Initialization](https://en.wikipedia.org/wiki/Lazy_initialization)
- [Supabase Client Docs](https://supabase.com/docs/reference/javascript/initializing)
- [Module Side Effects](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)

---

## Questions & Answers

**Q: Why not just fix the test setup?**
A: We did (current workaround), but it's a band-aid. Lazy init is the proper architectural solution.

**Q: Will this break existing code?**
A: No, we maintain backward compatibility during migration (US-002).

**Q: Is there a performance cost?**
A: Negligible (~0.001ms per access after first call).

**Q: Can we mock it easily?**
A: Yes! Much easier than mocking module-level exports.

**Q: When should we do this?**
A: Non-urgent. Can be done anytime as technical debt cleanup.

---

**Ready to implement? Start with US-001!**
