# Supabase Lazy Initialization - START HERE

## 🎯 Feature Overview

**Feature:** Supabase Lazy Initialization
**Status:** Not Started
**Timeline:** Flexible
**Complexity:** Medium
**Priority:** Medium (Technical Debt / Testing Improvement)

### What We're Building

Refactor the Supabase client initialization from **eager** (module-level) to **lazy** (on-demand) to improve:

1. **Test Reliability** - Eliminate env var timing issues in tests
2. **Module Independence** - Remove module-level side effects
3. **Better Mocking** - Easier to mock Supabase in unit tests
4. **Performance** - Avoid creating client when not needed

### Problem Statement

**Current Architecture (Eager Initialization):**

```typescript
// src/lib/supabase.ts
export const supabase = createBrowserClient(...); // ❌ Executes immediately on import
```

**Problems:**

1. **Test Environment Issues:**
   - Client created before test setup runs
   - Requires env vars to be set before ANY imports
   - Difficult to mock for unit tests
   - Current workaround: Set `process.env` at top of vitest.setup.ts

2. **Module Side Effects:**
   - Importing `supabase.ts` has side effects (creates client)
   - Violates functional programming best practices
   - Makes modules harder to test in isolation

3. **Unnecessary Initialization:**
   - Client created even if never used in a module
   - Can't delay initialization until actually needed

**Desired Architecture (Lazy Initialization):**

```typescript
// src/lib/supabase.ts
export function getSupabaseClient() {
  // ✅ Creates client on first call
  // Lazy initialization pattern
}
```

**Benefits:**

1. **Test-Friendly:**
   - No client created until test calls the function
   - Easy to mock the function return value
   - No timing issues with env vars

2. **No Side Effects:**
   - Importing module is safe (no execution)
   - Follows functional programming principles
   - Better module isolation

3. **On-Demand Creation:**
   - Client only created when actually needed
   - Can implement singleton pattern (create once, reuse)

### Target Users

Developers and AI agents working on:

- Writing unit tests that import Supabase-dependent code
- Refactoring modules that use Supabase
- Debugging test environment issues

---

## 📚 Documentation Files

| File                                | Purpose                                     |
| ----------------------------------- | ------------------------------------------- |
| `START-HERE.md`                     | This file - overview and quick start        |
| `AGENT-GUIDE.md`                    | Step-by-step implementation workflow        |
| `README.md`                         | Technical architecture and design decisions |
| `STATUS.md`                         | Progress tracking and milestones            |
| `US-001-lazy-client-factory.md`     | Create lazy client factory function         |
| `US-002-update-feature-imports.md`  | Update all imports to use new pattern       |
| `US-003-remove-test-workarounds.md` | Clean up test setup workarounds             |
| `US-004-testing-validation.md`      | Comprehensive testing and validation        |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Development server can run (`npm run dev`)
- All tests currently passing (`npm test`)
- Understanding of Supabase client API
- Familiarity with lazy initialization patterns

### Implementation Order

**User stories MUST be completed in this order:**

1. **US-001** - Create Lazy Client Factory (foundation)
2. **US-002** - Update Feature Imports (requires US-001)
3. **US-003** - Remove Test Workarounds (requires US-001, US-002)
4. **US-004** - Testing & Validation (requires all above)

### Getting Started

**🚨 STEP 0: CREATE GIT BRANCH (DO THIS FIRST!)**

```bash
# Check current branch
git status
git branch --show-current

# Create feature branch (if not already created)
git checkout -b feature/supabase-lazy-init

# Verify you're on the feature branch (NOT main)
git branch --show-current
# Expected output: feature/supabase-lazy-init

# Confirm NOT on main
git branch --show-current | grep -q "main" && echo "❌ ERROR: Still on main!" || echo "✅ Ready to proceed"
```

**Why this is critical:**

- Prevents accidental commits to `main` branch
- Follows project branching standards (CLAUDE.md)
- Enables safe PR workflow later
- **REQUIRED** before any code changes

---

**STEP 1: Read the documentation:**

```bash
# Read this file first (you are here)
cat user_stories/supabase-lazy-init/START-HERE.md

# Then read the agent guide
cat user_stories/supabase-lazy-init/AGENT-GUIDE.md

# Then read the architecture
cat user_stories/supabase-lazy-init/README.md
```

**STEP 2: Start implementation:**

```bash
# Use the implement-userstory command
/implement-userstory US-001
```

**STEP 3: Track progress:**

```bash
# Check status after each milestone
cat user_stories/supabase-lazy-init/STATUS.md
```

---

## ⚠️ Important Notes

### Following Project Standards

**CRITICAL:** Before starting any coding, ensure you:

1. Read `CLAUDE.md` for project standards
2. Follow TypeScript best practices - NO `any` types
3. Follow the Performance Optimization Guidelines
4. Use established import aliases (`@/lib`, `@/components`, etc.)

### Code Quality

- **Maintain backward compatibility** - existing code should work during migration
- **No breaking changes** - incremental refactor approach
- Keep changes minimal and focused
- Write tests for new patterns before migrating

### Git Workflow

**⚠️ CRITICAL: Branch MUST be created BEFORE any code changes!**

```bash
# STEP 0 (MANDATORY FIRST): Create feature branch
git checkout -b feature/supabase-lazy-init

# Verify branch creation
git branch --show-current  # Should output: feature/supabase-lazy-init

# Now you can make changes, commit frequently
git add .
git commit -m "feat(supabase): implement US-001 lazy client factory"

# Push when ready
git push -u origin feature/supabase-lazy-init
```

**Branch Verification Commands:**

```bash
# Check current branch
git branch --show-current

# List all branches (* marks current)
git branch

# Verify NOT on main (should output "✅ Ready to proceed")
git branch --show-current | grep -q "main" && echo "❌ ERROR: Still on main!" || echo "✅ Ready to proceed"
```

---

## 📊 Success Criteria

This feature is complete when:

- [ ] Lazy client factory function created and tested
- [ ] All feature modules updated to use lazy initialization
- [ ] All existing tests pass with new pattern
- [ ] Test setup workarounds removed (no more process.env hacks)
- [ ] No breaking changes to existing functionality
- [ ] TypeScript compilation passes with no errors
- [ ] All linting passes
- [ ] Performance is maintained or improved
- [ ] Documentation updated (README, code comments)

---

## 🔍 Migration Strategy

### Phase 1: Create New Pattern (US-001)

- Implement lazy initialization factory
- Test new pattern thoroughly
- Document usage examples

### Phase 2: Gradual Migration (US-002)

- Update feature modules one at a time
- Test each module after migration
- Keep existing pattern available during migration

### Phase 3: Cleanup (US-003)

- Remove old eager initialization
- Clean up test workarounds
- Update documentation

### Phase 4: Validation (US-004)

- Run full test suite
- Performance testing
- Integration testing
- Documentation review

---

## 🤝 Next Steps

1. Read `AGENT-GUIDE.md` for implementation workflow
2. Read `README.md` for technical architecture
3. Start with `/implement-userstory US-001`
4. Update `STATUS.md` after each milestone

**Ready to begin? Start with the AGENT-GUIDE.md file!**
