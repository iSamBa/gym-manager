# Agent Implementation Guide - Members Table Rework

## For AI Agents

This guide helps AI agents implement user stories systematically and correctly.

---

## Pre-Implementation Checklist

Before starting ANY user story, verify:

- [ ] **Git branch created** (see Step 0 in Implementation Workflow - MANDATORY FIRST!)
- [ ] Read the user story completely
- [ ] Read all dependencies (previous user stories)
- [ ] Read `CLAUDE.md` in project root
- [ ] Read `CLAUDE.local.md` in project root
- [ ] Understand the acceptance criteria
- [ ] Review the technical implementation section
- [ ] Check the testing criteria

---

## Implementation Workflow

### Step 0: Git Branch Setup (MANDATORY - DO THIS FIRST!)

**🚨 CRITICAL: This MUST be done BEFORE any code changes!**

1. **Verify current branch and status**

   ```bash
   git status
   git branch --show-current
   ```

2. **Create feature branch (if not already created)**

   ```bash
   # Determine feature name from user stories folder
   # Example: members-table-rework

   # Create and switch to feature branch
   git checkout -b feature/members-table-rework

   # Verify you're on the correct branch
   git branch --show-current
   # Expected output: feature/members-table-rework
   ```

3. **Verify branch creation**

   ```bash
   # List all branches (current branch marked with *)
   git branch

   # Confirm you're NOT on main
   git branch --show-current | grep -q "main" && echo "❌ ERROR: Still on main!" || echo "✅ On feature branch"
   ```

4. **Document branch information**
   - Branch name: `feature/members-table-rework`
   - Base branch: `main`
   - Created: [current date]

**⚠️ If you're already on main with commits:**

- STOP immediately
- Ask user how to handle existing commits
- Options: create branch from current state, stash changes, etc.
- **NEVER commit directly to main** (violates CLAUDE.md rules)

**✅ Checklist before proceeding:**

- [ ] Feature branch created
- [ ] Verified current branch is NOT main
- [ ] Branch name follows convention: `feature/[feature-name]`
- [ ] Ready to start making changes

---

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

**Example:**

```bash
# For US-002, you would create and run:
npm test -- src/features/database/lib/__tests__/enhanced-member-types.test.ts

# For US-001, you would run SQL tests:
SELECT * FROM get_members_with_details(p_limit := 10);
```

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
   - Review each AC in the user story
   - **CRITICAL**: Run ALL tests from "Testing Criteria" section
   - Ensure all tests pass (unit, integration, performance, type safety)
   - Document test results with actual numbers (e.g., "9/9 passed")
   - Verify no regression in existing functionality

2. ✓ Update the User Story Document
   - Mark all Definition of Done checkboxes as [x]
   - Add notes with actual results (e.g., "207ms" instead of just "passes")
   - Document any important decisions or deviations

3. ✓ Update STATUS.md
   - Change user story status from ⚪ to 🟢
   - Update "Completed" date
   - Update progress bars
   - Update overall completion percentage
   - Mark all Definition of Done items as [x]

4. ✓ Commit Changes
   - Stage all changes: user story docs, STATUS.md, code changes
   - Write detailed commit message following project format
   - Include performance metrics, test results, migrations
   - Add co-authorship: "Co-Authored-By: Claude <noreply@anthropic.com>"
   - Commit with: git commit -m "feat(scope): Title\n\nDetails..."
```

**IMPORTANT**: A user story is NOT complete until all 4 steps are done!

---

## User Story Quick Reference

### US-001: Database Foundation

**What**: Create database function to fetch enhanced member data
**Where**: Supabase database (create migration)
**Key Files**:

- Migration file: `supabase/migrations/TIMESTAMP_add_members_enhanced_function.sql`
- Index migration: `supabase/migrations/TIMESTAMP_add_members_indexes.sql`

**Agent Instructions:**

1. Use Supabase MCP tools to create migrations
2. Copy SQL from US-001 Technical Implementation section
3. Test function with sample queries (see Testing Criteria)
4. Verify indexes with EXPLAIN ANALYZE
5. DO NOT proceed to US-002 until all tests pass

**Critical**: Database function MUST return correct data types and handle NULLs

---

### US-002: Type Definitions

**What**: Create TypeScript types for enhanced member data
**Where**: `src/features/database/lib/types.ts`
**Key Files**:

- `src/features/database/lib/types.ts` (update)
- `src/features/database/lib/utils.ts` (update MemberFilters)

**Agent Instructions:**

1. Add interfaces EXACTLY as shown in Technical Implementation
2. Export all new types
3. Run `npx tsc --noEmit` to verify no errors
4. Test type inference (see Testing Criteria)
5. DO NOT use `any` type anywhere

**Critical**: Types must match database function return structure exactly

---

### US-003: API Integration

**What**: Update memberUtils to call database function
**Where**: `src/features/database/lib/utils.ts`
**Key Files**:

- `src/features/database/lib/utils.ts` (update getMembers method)

**Agent Instructions:**

1. Replace existing getMembers() implementation with RPC call
2. Transform flat database response to nested types
3. Write unit tests for transformation logic
4. Test all filter parameters work correctly
5. Verify backward compatibility (existing code still works)

**Critical**: Data transformation must handle ALL NULL cases

---

### US-004: Helper Components

**What**: Create reusable cell components for table
**Where**: `src/features/members/components/cells/`
**Key Files**:

- `src/features/members/components/cells/DateCell.tsx` (new)
- `src/features/members/components/cells/SessionCountBadge.tsx` (new)
- `src/features/members/components/cells/BalanceBadge.tsx` (new)
- `src/features/members/components/cells/MemberTypeBadge.tsx` (new)
- `src/features/members/components/cells/index.ts` (new)

**Agent Instructions:**

1. Create `cells/` directory
2. Implement each component using shadcn/ui primitives ONLY
3. Wrap ALL components in React.memo
4. Write unit tests for each component
5. Test with NULL values, edge cases
6. Create Storybook stories (optional but recommended)

**Critical**: Components must handle NULL gracefully and use color coding correctly

---

### US-005: Table Component Updates

**What**: Add new columns to AdvancedMemberTable
**Where**: `src/features/members/components/AdvancedMemberTable.tsx`
**Key Files**:

- `src/features/members/components/AdvancedMemberTable.tsx` (update)
- `src/app/members/page.tsx` (may need type updates)

**Agent Instructions:**

1. Update component props to accept `MemberWithEnhancedDetails[]`
2. Add new TableHead columns (see Technical Implementation)
3. Add new TableCell columns using helper components
4. Update sort configuration to include new fields
5. Add responsive classes (hidden lg:table-cell, etc.)
6. Test with various data states (NULL, 0, large numbers)

**Critical**:

- Table must remain performant (React.memo, useCallback, useMemo)
- Responsive classes must match design requirements
- Keep component under 700 lines (split if needed)

---

### US-006: Filters & Column Visibility

**What**: Add enhanced filters and column toggle
**Where**:

- `src/features/members/components/SimpleMemberFilters.tsx` (update)
- `src/features/members/components/ColumnVisibilityToggle.tsx` (new)

**Agent Instructions:**

1. Add new filter dropdowns to SimpleMemberFilters
2. Create ColumnVisibilityToggle component
3. Integrate with useLocalStorage hook
4. Update members page to use new filters
5. Test filter combinations work correctly
6. Test column visibility persists across page refreshes

**Critical**:

- Filters must call server-side (not client filtering)
- Column visibility must persist to local storage
- Clear filters button must reset ALL filters

---

### US-007: Testing & Polish

**What**: Comprehensive testing and documentation
**Where**: All test files, documentation files
**Key Files**:

- `src/features/members/components/__tests__/` (update/create tests)
- `docs/members-table-architecture.md` (new)
- `README.md` (update)

**Agent Instructions:**

1. Write/update all unit tests
2. Write integration tests
3. Run performance tests (see Technical Implementation)
4. Run accessibility audit
5. Test on multiple browsers/devices
6. Create documentation
7. Update README

**Critical**:

- 80%+ code coverage required
- ALL performance targets must be met
- Zero accessibility violations
- Complete documentation before marking done

---

## Common Pitfalls for Agents

### 1. Skipping Dependencies

```
 BAD: Starting US-005 before US-004 is complete
 GOOD: Completing US-001 → US-002 → US-003 → US-004 → US-005 in order
```

### 2. Ignoring Testing Criteria

```
 BAD: Writing code without tests
 GOOD: Writing tests as you implement (TDD approach)
```

### 3. Not Verifying Definition of Done

```
 BAD: Assuming user story is done after code works
 GOOD: Checking EVERY item in Definition of Done
```

### 4. Using `any` Types

```typescript
//  BAD
const data: any = fetchData();

//  GOOD
const data: MemberWithEnhancedDetails[] = fetchData();
```

### 5. Client-Side Operations on Large Data

```typescript
//  BAD: Client sorting
const sorted = members.sort((a, b) => a.name.localeCompare(b.name));

//  GOOD: Server sorting
const members = await memberUtils.getMembers({
  orderBy: "name",
  orderDirection: "asc",
});
```

### 6. Forgetting React.memo/useCallback

```typescript
//  BAD: No memoization
export function MyComponent({ data }) {
  const handleClick = () => { /* ... */ };
  return <div onClick={handleClick}>{data}</div>;
}

//  GOOD: Proper memoization
export const MyComponent = memo(function MyComponent({ data }) {
  const handleClick = useCallback(() => { /* ... */ }, []);
  return <div onClick={handleClick}>{data}</div>;
});
```

---

## Agent Success Criteria

An agent has successfully completed a user story when:

1.  All acceptance criteria are met
2.  All tests pass (unit + integration)
3.  TypeScript compilation succeeds with no errors
4.  Linting passes with no warnings
5.  Performance targets are met
6.  All items in Definition of Done are checked
7.  Code follows project guidelines (CLAUDE.md)
8.  Documentation is updated

---

## When to Ask for Help

Agents should request human assistance when:

- Acceptance criteria are ambiguous or conflicting
- Performance targets cannot be met despite optimization
- Database schema changes are needed beyond what's documented
- Breaking changes to existing code are unavoidable
- Security concerns arise
- Business logic clarification is needed

---

## Iterative Development

Each user story should be completed in iterations:

**Iteration 1**: Core functionality (60% of work)
**Iteration 2**: Edge cases and error handling (25% of work)
**Iteration 3**: Testing and polish (15% of work)

After each iteration:

1. Run all tests
2. Check performance
3. Verify acceptance criteria
4. Commit working code

---

## Reference Documents

- [Project Guidelines](../../CLAUDE.md)
- [Database Schema](../../src/features/database/README.md)
- [Component Guidelines](../../src/components/ui/README.md)
- [Testing Standards](../../vitest.config.ts)

---

## Learning from User Stories

Each user story is a learning opportunity:

- **US-001**: Database function design and optimization
- **US-002**: TypeScript type system and type safety
- **US-003**: API layer design and data transformation
- **US-004**: Component composition and reusability
- **US-005**: Complex table implementation with performance
- **US-006**: State management and persistence
- **US-007**: Comprehensive testing strategies

Apply these learnings to future features!

---

**Good luck, Agent! **

Remember: Quality > Speed. It's better to take extra time to do it right than to rush and create technical debt.
