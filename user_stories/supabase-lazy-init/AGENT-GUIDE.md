# AGENT-GUIDE.md - Supabase Lazy Initialization

## 🤖 Agent Implementation Workflow

This guide provides a **systematic, step-by-step workflow** for implementing the Supabase Lazy Initialization refactor. Follow this guide exactly to ensure consistent, high-quality implementation.

---

## 📋 Pre-Implementation Checklist

**Before starting ANY user story, verify:**

- [ ] Read `CLAUDE.md` completely (project standards)
- [ ] Read `START-HERE.md` (feature overview)
- [ ] Read `README.md` (technical architecture)
- [ ] **Git branch created** (see Phase 0 below - MANDATORY FIRST STEP)
- [ ] Development server is running (`npm run dev`)
- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)

---

## 🎯 Implementation Order

**CRITICAL:** User stories MUST be completed in this order:

1. **US-001** - Lazy Client Factory (foundation)
2. **US-002** - Update Feature Imports (depends on US-001)
3. **US-003** - Remove Test Workarounds (depends on US-001, US-002)
4. **US-004** - Testing & Validation (depends on all above)

---

## 📝 User Story Implementation Template

For each user story, follow this workflow:

### Phase 0: Git Branch Setup (MANDATORY - DO THIS FIRST!)

**🚨 CRITICAL: This MUST be done BEFORE any code changes!**

1. **Verify current branch and status**

   ```bash
   git status
   git branch --show-current
   ```

2. **Create feature branch (if not already created)**

   ```bash
   # Create and switch to feature branch
   git checkout -b feature/supabase-lazy-init

   # Verify you're on the correct branch
   git branch --show-current
   # Expected output: feature/supabase-lazy-init
   ```

3. **Verify branch creation**

   ```bash
   # List all branches (current branch marked with *)
   git branch

   # Confirm you're NOT on main
   git branch --show-current | grep -q "main" && echo "❌ ERROR: Still on main!" || echo "✅ On feature branch"
   ```

4. **Document branch name**
   - Branch name: `feature/supabase-lazy-init`
   - Base branch: `main`
   - Created: [current date]

**⚠️ If you're already on main with commits:**

- STOP immediately
- Ask user how to handle existing commits
- Options: create branch from current state, stash changes, etc.

**✅ Checklist before proceeding:**

- [ ] Feature branch created
- [ ] Verified current branch is NOT main
- [ ] Branch name follows convention: `feature/supabase-lazy-init`
- [ ] Ready to start making changes

---

### Phase 1: Discovery & Planning

1. **Read the user story file completely**

   ```bash
   cat user_stories/supabase-lazy-init/US-00X-{name}.md
   ```

2. **Identify affected files**
   - Use Grep to find all imports of `@/lib/supabase`
   - Read current `src/lib/supabase.ts` implementation
   - Note all files that will need updates

3. **Create implementation checklist**
   - Break acceptance criteria into tasks
   - Identify files to modify vs. create
   - Plan testing approach

4. **Update STATUS.md**

   ```markdown
   ## US-00X: {Name}

   - Status: In Progress
   - Started: {date}
   ```

### Phase 2: Implementation

5. **Implement changes**
   - Modify existing files OR create new ones
   - Follow TypeScript best practices - NO `any` types
   - Maintain backward compatibility during migration
   - Keep changes minimal and focused

6. **Write tests**

   ```bash
   # Write tests BEFORE migrating code
   # Test new pattern in isolation first
   npm run test:watch
   ```

7. **Test manually**

   ```bash
   # Development server should be running
   npm run dev

   # Test in browser at http://localhost:3000
   # Verify all features still work
   ```

8. **Fix linting errors**

   ```bash
   npm run lint
   ```

### Phase 3: Testing & Validation

9. **Run all tests**

   ```bash
   npm test
   ```

10. **Verify acceptance criteria**
    - Check each criterion from user story
    - Test edge cases
    - Verify no regressions

11. **TypeScript validation**

    ```bash
    npx tsc --noEmit
    ```

### Phase 4: Completion

12. **Update STATUS.md**

    ```markdown
    ## US-00X: {Name}

    - Status: Completed
    - Started: {date}
    - Completed: {date}
    - Notes: {any important notes}
    ```

13. **Commit changes**

    ```bash
    git add .
    git commit -m "feat(supabase): implement US-00X {name}

    - {achievement 1}
    - {achievement 2}
    - {achievement 3}

    🤖 Generated with [Claude Code](https://claude.com/claude-code)

    Co-Authored-By: Claude <noreply@anthropic.com>"
    ```

14. **Move to next user story**

---

## 🔍 User Story Summaries

### US-001: Lazy Client Factory

**Goal:** Create lazy initialization factory function for Supabase client

**Key Tasks:**

1. Create `getSupabaseClient()` function with singleton pattern
2. Implement lazy initialization (create on first call)
3. Add TypeScript types
4. Write comprehensive unit tests
5. Document usage patterns

**Files to Modify:**

- `src/lib/supabase.ts` (add new factory function)

**Files to Create:**

- `src/lib/__tests__/supabase-lazy.test.ts` (unit tests)

**Acceptance Criteria:**

- Factory function creates client on first call
- Subsequent calls return same instance (singleton)
- No client created until function is called
- All tests pass
- TypeScript compilation succeeds

---

### US-002: Update Feature Imports

**Goal:** Migrate all feature modules to use lazy initialization

**Key Tasks:**

1. Find all imports of `supabase` from `@/lib/supabase`
2. Update to use `getSupabaseClient()` pattern
3. Test each module after migration
4. Ensure no breaking changes

**Files to Modify:**

- All files importing from `@/lib/supabase` (use Grep to find)
- Likely files:
  - `src/features/*/lib/*.ts`
  - `src/features/*/hooks/*.ts`
  - `src/lib/auth-provider.tsx`
  - `src/middleware.ts` (if applicable)

**Migration Pattern:**

```typescript
// ❌ OLD (eager)
import { supabase } from "@/lib/supabase";

export async function fetchData() {
  const { data } = await supabase.from("table").select();
  return data;
}

// ✅ NEW (lazy)
import { getSupabaseClient } from "@/lib/supabase";

export async function fetchData() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("table").select();
  return data;
}
```

**Acceptance Criteria:**

- All feature modules updated
- All existing tests pass
- No breaking changes to functionality
- TypeScript compilation succeeds
- Performance maintained or improved

---

### US-003: Remove Test Workarounds

**Goal:** Clean up test environment workarounds now that lazy init is in place

**Key Tasks:**

1. Remove `process.env` assignments from `vitest.setup.ts` (lines 11-12)
2. Keep `vi.stubEnv()` in `beforeEach()` for per-test control
3. Update test comments to reflect new architecture
4. Verify all tests still pass

**Files to Modify:**

- `vitest.setup.ts` (remove workaround, update comments)

**Acceptance Criteria:**

- No `process.env` assignments before imports
- All tests pass without workarounds
- Test setup is cleaner and more maintainable
- Comments explain lazy init pattern

---

### US-004: Testing & Validation

**Goal:** Comprehensive testing and validation of lazy init pattern

**Key Tasks:**

1. Run full test suite
2. Performance testing (ensure no regression)
3. Integration testing (test all features work)
4. Update documentation
5. Code review preparation

**Testing Checklist:**

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Application runs correctly (`npm run dev`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors or warnings

**Documentation Updates:**

- Update README.md with lazy init pattern
- Add code comments explaining singleton pattern
- Update any architectural documentation

**Acceptance Criteria:**

- 100% test pass rate
- No performance regression
- Documentation updated
- Ready for PR review

---

## 🔄 Workflow Summary

```
┌─────────────────────────────────────────┐
│ PHASE 0: GIT BRANCH SETUP (FIRST!)     │
│ 0. Create feature branch                │
│ 0. Verify NOT on main                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ PHASE 1: DISCOVERY & PLANNING           │
│ 1. Read user story                      │
│ 2. Identify affected files              │
│ 3. Create implementation checklist      │
│ 4. Update STATUS.md (In Progress)       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ PHASE 2: IMPLEMENTATION                 │
│ 5. Implement changes                    │
│ 6. Write tests                          │
│ 7. Test manually                        │
│ 8. Fix linting errors                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ PHASE 3: TESTING & VALIDATION           │
│ 9. Run all tests                        │
│ 10. Verify acceptance criteria          │
│ 11. TypeScript validation               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ PHASE 4: COMPLETION                     │
│ 12. Update STATUS.md (Completed)        │
│ 13. Commit changes                      │
│ 14. Move to next user story             │
└─────────────────────────────────────────┘
```

---

## 🛠️ Common Patterns

### Lazy Client Factory Pattern

```typescript
// src/lib/supabase.ts
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}
```

### Migration Pattern for Hooks

```typescript
// ❌ OLD
import { supabase } from "@/lib/supabase";

export function useMembers() {
  return useQuery(["members"], () => supabase.from("members").select());
}

// ✅ NEW
import { getSupabaseClient } from "@/lib/supabase";

export function useMembers() {
  const supabase = getSupabaseClient();
  return useQuery(["members"], () => supabase.from("members").select());
}
```

### Testing the Lazy Pattern

```typescript
// src/lib/__tests__/supabase-lazy.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseClient } from "../supabase";

describe("getSupabaseClient", () => {
  beforeEach(() => {
    // Reset module to test lazy init
    vi.resetModules();
  });

  it("creates client on first call", () => {
    const client = getSupabaseClient();
    expect(client).toBeDefined();
  });

  it("returns same instance on subsequent calls", () => {
    const client1 = getSupabaseClient();
    const client2 = getSupabaseClient();
    expect(client1).toBe(client2);
  });
});
```

---

## ⚠️ Common Pitfalls

### ❌ Don't Do This:

1. **Forgetting to call the function**

   ```typescript
   // ❌ Bad - importing eager client
   import { supabase } from "@/lib/supabase";
   ```

2. **Creating multiple instances**

   ```typescript
   // ❌ Bad - creates new client every time
   export function getData() {
     const supabase = createBrowserClient(...); // NO!
   }
   ```

3. **Not testing before migrating**
   ```typescript
   // ❌ Bad - migrating all files at once without testing
   ```

### ✅ Do This Instead:

1. **Use the factory function**

   ```typescript
   // ✅ Good - lazy initialization
   import { getSupabaseClient } from "@/lib/supabase";
   const supabase = getSupabaseClient();
   ```

2. **Use singleton pattern**

   ```typescript
   // ✅ Good - returns cached instance
   export function getSupabaseClient() {
     if (!instance) {
       instance = create...
     }
     return instance;
   }
   ```

3. **Migrate incrementally**
   ```typescript
   // ✅ Good - migrate one module, test, then continue
   ```

---

## 🚀 Ready to Start?

1. Ensure pre-implementation checklist is complete
2. Start with US-001: `cat user_stories/supabase-lazy-init/US-001-lazy-client-factory.md`
3. Follow the implementation template above
4. Update STATUS.md as you progress

**Good luck! 🎉**
