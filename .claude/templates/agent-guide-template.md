# Agent Implementation Guide - {{feature_name}}

## For AI Agents

This guide helps AI agents implement user stories systematically and correctly.

---

## Pre-Implementation Checklist

Before starting ANY user story, verify:

- [ ] Read the user story completely
- [ ] Read all dependencies (previous user stories)
- [ ] Read `CLAUDE.md` in project root
- [ ] Read `CLAUDE.local.md` in project root
- [ ] Understand the acceptance criteria
- [ ] Review the technical implementation section
- [ ] Check the testing criteria

---

## Implementation Workflow

### Step 1: Understand the Context

```markdown
1. Read the user story's "Business Value" section
2. Review "Acceptance Criteria" - these are your requirements
3. Check "Dependencies" - what must exist before you start
4. Review "Technical Implementation" - this is your blueprint
```

### Step 2: Plan the Work

```markdown
1. Break down acceptance criteria into tasks
2. Identify which files need changes (check Technical Implementation)
3. Determine if new files are needed
4. Plan the testing approach
```

### Step 3: Implement

```markdown
1. Start with data layer (database, types, API)
2. Then move to components (UI)
3. Write tests as you go (not after!)
4. Follow the code snippets in Technical Implementation section
```

### Step 4: Test (MANDATORY - Run ALL Tests from User Story)

**CRITICAL**: Every user story has a "Testing Criteria" section. You MUST run ALL tests mentioned.

```markdown
1. Read the "Testing Criteria" section in the user story
2. Run EVERY test listed (unit tests, integration tests, performance tests, etc.)
3. Create test files if they don't exist (e.g., for type safety tests)
4. Verify ALL tests pass before proceeding
5. Check TypeScript: `npx tsc --noEmit`
6. Run linter: `npm run lint`
7. Document test results with actual numbers (e.g., "9/9 tests passed")
```

**Common Test Types:**

- **Database Tests**: SQL queries from Testing Criteria
- **Type Safety Tests**: TypeScript compilation tests
- **Unit Tests**: `npm test -- <test-file>`
- **Performance Tests**: EXPLAIN ANALYZE queries, timing measurements
- **Integration Tests**: End-to-end workflows

**⚠️ NEVER skip to Step 6 without running ALL tests from the user story!**

### Step 5: Verify Definition of Done

```markdown
1. Go through EVERY checkbox in "Definition of Done"
2. Mark each item as complete
3. If any item is not done, continue working
4. Only consider user story complete when ALL items are checked
```

### Step 6: Complete User Story (MANDATORY)

**When all Definition of Done items are checked, you MUST complete these 4 steps:**

```markdown
1. ✓ Verify all Acceptance Criteria and Tests are fulfilled
2. ✓ Update STATUS.md with completion timestamp and metrics
3. ✓ Commit changes with descriptive message following git conventions
4. ✓ Ask user if they want to push changes or continue to next story
```

**Only after these 4 steps can you move to the next user story.**

---

## Quick Reference by User Story

{{user_stories_quick_ref}}

---

## Common Pitfalls to Avoid

### ❌ Don't Do This

1. **Skipping Tests** - Every user story has specific tests. Run them all.
2. **Ignoring Performance** - Check CLAUDE.md optimization guidelines
3. **Using `any` Type** - Always define proper TypeScript interfaces
4. **Client-Side Sorting** - Large datasets must be sorted server-side
5. **Forgetting STATUS.md** - Update after each user story completion
6. **Skipping Dependencies** - User stories build on each other

### ✅ Do This Instead

1. **Run All Tests** - Unit, integration, performance, type safety
2. **Optimize Early** - Apply React.memo, useCallback, useMemo
3. **Strict Types** - Create interfaces in `types.ts`
4. **Server Operations** - Database sorting, filtering, aggregations
5. **Track Progress** - Update STATUS.md with metrics
6. **Follow Order** - Complete US-001 before US-002

---

## Performance Checklist (Per CLAUDE.md)

Before marking any user story complete, verify:

- [ ] React.memo for complex components
- [ ] useCallback for event handlers
- [ ] useMemo for expensive computations
- [ ] Server-side sorting/filtering for large datasets
- [ ] Dynamic imports for heavy libraries (>50kb)
- [ ] Components under 300 lines
- [ ] Maximum 4 hooks per feature domain

---

## Testing Standards

### Required for Every User Story

1. **Unit Tests** - Test individual functions/components
2. **Integration Tests** - Test feature workflows
3. **Type Safety** - Ensure TypeScript compiles without errors
4. **Performance** - Verify optimization targets are met
5. **Linting** - Zero errors, zero warnings

### Test File Naming

- Unit: `*.test.ts` or `*.test.tsx`
- Integration: `*-integration.test.ts`
- E2E: `*.e2e.test.ts`

### Coverage Standards

- Critical paths: 100%
- Business logic: 90%+
- UI components: 80%+

---

## Git Commit Standards

Follow this format when completing user stories:

```
<type>(<scope>): <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: feat, fix, refactor, test, docs, perf, chore

**Example:**

```
feat(members): Implement US-001 database foundation

- Created get_members_with_details() function
- Added indexes for performance
- Implemented server-side filtering and sorting
- Tests: 12/12 passing, <500ms query time

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Success Criteria

A user story is only complete when:

✅ All acceptance criteria verified
✅ All tests passing (100%)
✅ All DoD checkboxes checked
✅ STATUS.md updated
✅ Code committed with proper message
✅ No regressions introduced

---

## Need Help?

1. Re-read the specific user story
2. Check CLAUDE.md for project guidelines
3. Review similar completed user stories
4. Ask the user for clarification

**Remember**: Quality over speed. Do it right the first time.
