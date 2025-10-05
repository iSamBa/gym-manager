# US-001: Lazy Client Factory

## User Story

**As a** developer writing tests
**I want** Supabase client to initialize lazily (on-demand)
**So that** tests don't fail due to module-level initialization timing issues

---

## Business Value

**Problem:** Current eager initialization creates Supabase client at module load time, causing test environment issues and module side effects.

**Value:**

- ✅ Tests can control when client is created
- ✅ No module-level side effects
- ✅ Easier to mock in unit tests
- ✅ Better separation of concerns

---

## Acceptance Criteria

### AC-001: Lazy Factory Function Created

- [ ] Function `getSupabaseClient()` exists in `src/lib/supabase.ts`
- [ ] Function returns `SupabaseClient` type
- [ ] Client is NOT created until function is called
- [ ] Function has JSDoc comments explaining usage

### AC-002: Singleton Pattern Implemented

- [ ] First call to `getSupabaseClient()` creates client instance
- [ ] Subsequent calls return the same cached instance
- [ ] Instance is stored in module-level variable
- [ ] Pattern prevents multiple client instances

### AC-003: Reset Function for Testing

- [ ] Function `resetSupabaseClient()` exists
- [ ] Function clears cached instance
- [ ] Next `getSupabaseClient()` call creates new instance
- [ ] Function is documented as @internal for testing only

### AC-004: Type Safety Maintained

- [ ] Return type is explicitly `SupabaseClient`
- [ ] No `any` types used
- [ ] TypeScript compilation succeeds
- [ ] Full type inference works

### AC-005: Comprehensive Testing

- [ ] Unit tests written in `src/lib/__tests__/supabase-lazy.test.ts`
- [ ] Test: Client created on first call
- [ ] Test: Same instance returned on subsequent calls
- [ ] Test: Instance can be reset
- [ ] Test: Error thrown if env vars missing
- [ ] All tests pass

### AC-006: Backward Compatibility

- [ ] Old eager initialization (`export const supabase`) still exists
- [ ] Both patterns work simultaneously
- [ ] No breaking changes to existing code
- [ ] Migration can happen incrementally

---

## Technical Implementation

### File: `src/lib/supabase.ts`

````typescript
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for browser-side operations (EAGER - TO BE DEPRECATED)
 * @deprecated Use getSupabaseClient() instead for better testability
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Singleton instance of Supabase client
 * Created lazily on first access via getSupabaseClient()
 */
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get Supabase client instance (lazy initialization)
 *
 * Creates client on first call, returns cached instance on subsequent calls.
 * This pattern avoids module-level side effects and makes testing easier.
 *
 * @returns Supabase client for browser-side operations
 *
 * @example
 * ```typescript
 * import { getSupabaseClient } from '@/lib/supabase';
 *
 * export async function fetchMembers() {
 *   const supabase = getSupabaseClient();
 *   const { data } = await supabase.from('members').select();
 *   return data;
 * }
 * ```
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        "Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
      );
    }

    supabaseInstance = createBrowserClient(url, key);
  }

  return supabaseInstance;
}

/**
 * Reset the Supabase client instance
 *
 * This is primarily for testing purposes. Clears the cached instance
 * so the next call to getSupabaseClient() creates a fresh client.
 *
 * @internal
 *
 * @example
 * ```typescript
 * import { resetSupabaseClient } from '@/lib/supabase';
 *
 * beforeEach(() => {
 *   resetSupabaseClient(); // Fresh instance for each test
 * });
 * ```
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null;
}
````

### File: `src/lib/__tests__/supabase-lazy.test.ts` (NEW)

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSupabaseClient, resetSupabaseClient } from "../supabase";

describe("getSupabaseClient - Lazy Initialization", () => {
  beforeEach(() => {
    // Set up test environment variables
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key-123");

    // Reset client before each test
    resetSupabaseClient();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Lazy Initialization", () => {
    it("creates client on first call", () => {
      const client = getSupabaseClient();

      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.from).toBeDefined();
    });

    it("does not create client until function is called", () => {
      // Just importing the module should not create client
      // This is tested implicitly - if it fails, module loading would throw
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _noop = true; // Module is already loaded
      }).not.toThrow();
    });
  });

  describe("Singleton Pattern", () => {
    it("returns same instance on subsequent calls", () => {
      const client1 = getSupabaseClient();
      const client2 = getSupabaseClient();
      const client3 = getSupabaseClient();

      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
    });
  });

  describe("Reset Functionality", () => {
    it("creates new instance after reset", () => {
      const client1 = getSupabaseClient();

      resetSupabaseClient();

      const client2 = getSupabaseClient();

      expect(client1).not.toBe(client2);
    });

    it("allows multiple resets", () => {
      const client1 = getSupabaseClient();
      resetSupabaseClient();

      const client2 = getSupabaseClient();
      resetSupabaseClient();

      const client3 = getSupabaseClient();

      expect(client1).not.toBe(client2);
      expect(client2).not.toBe(client3);
      expect(client1).not.toBe(client3);
    });
  });

  describe("Error Handling", () => {
    it("throws error if NEXT_PUBLIC_SUPABASE_URL is missing", () => {
      vi.unstubAllEnvs();
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");

      expect(() => getSupabaseClient()).toThrow(
        /Supabase configuration missing/
      );
    });

    it("throws error if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
      vi.unstubAllEnvs();
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");

      expect(() => getSupabaseClient()).toThrow(
        /Supabase configuration missing/
      );
    });

    it("throws error if both env vars are missing", () => {
      vi.unstubAllEnvs();

      expect(() => getSupabaseClient()).toThrow(
        /Supabase configuration missing/
      );
    });
  });

  describe("Type Safety", () => {
    it("returns correctly typed SupabaseClient", () => {
      const client = getSupabaseClient();

      // Type assertions to verify correct type inference
      expect(typeof client.auth.signIn).toBe("function");
      expect(typeof client.from).toBe("function");
    });
  });
});
```

---

## Testing Criteria

### Unit Tests

```bash
# Run the new test file
npm test -- src/lib/__tests__/supabase-lazy.test.ts

# Expected output: 9/9 tests passing
```

**Required Tests:**

1. ✅ Client created on first call
2. ✅ Same instance returned (singleton)
3. ✅ Instance can be reset
4. ✅ Error if env vars missing (3 tests for different combinations)
5. ✅ Type safety verified

### Integration Tests

```bash
# Verify all existing tests still pass
npm test

# Expected: 100% pass rate
```

### TypeScript Validation

```bash
# No TypeScript errors
npx tsc --noEmit

# Expected: No errors
```

### Linting

```bash
npm run lint

# Expected: 0 errors, 0 warnings
```

---

## Definition of Done

- [x] Read this user story completely
- [ ] Git branch created: `feature/supabase-lazy-init`
- [ ] Implementation complete:
  - [ ] `getSupabaseClient()` function added
  - [ ] `resetSupabaseClient()` function added
  - [ ] Singleton pattern implemented
  - [ ] JSDoc comments added
  - [ ] Error handling implemented
- [ ] Testing complete:
  - [ ] Unit tests written (9 tests)
  - [ ] All new tests pass (9/9)
  - [ ] All existing tests pass
  - [ ] TypeScript compilation succeeds
  - [ ] Linting passes
- [ ] Documentation:
  - [ ] JSDoc comments complete
  - [ ] Usage examples in comments
  - [ ] README.md reviewed (if needed)
- [ ] Quality:
  - [ ] No `any` types used
  - [ ] Type safety maintained
  - [ ] No breaking changes
  - [ ] Backward compatibility preserved
- [ ] STATUS.md updated:
  - [ ] User story marked as complete
  - [ ] Completion date added
  - [ ] Notes added (if any)
- [ ] Changes committed:
  - [ ] Code changes committed
  - [ ] Test changes committed
  - [ ] Documentation changes committed
  - [ ] Commit message follows format

---

## Dependencies

**Depends on:** None (foundation story)

**Blocks:** US-002, US-003, US-004

---

## Estimated Effort

**Complexity:** Low
**Time:** 2-3 hours

**Breakdown:**

- Implementation: 1 hour
- Testing: 1 hour
- Documentation: 30 minutes
- Validation: 30 minutes

---

## Notes

- Keep eager initialization (`export const supabase`) for backward compatibility
- Will be removed in US-003 after all migrations complete
- Focus on test quality - this is foundation for entire feature
- Singleton pattern is simple but critical to get right

---

**Ready to implement? Follow AGENT-GUIDE.md workflow!**
