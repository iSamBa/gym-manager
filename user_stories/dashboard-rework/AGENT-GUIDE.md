# Dashboard Rework - Agent Implementation Guide

## 🤖 Purpose

This guide provides a systematic workflow for implementing the Dashboard Rework feature using Claude Code. Follow this guide step-by-step to ensure consistent, high-quality implementation.

## ⚠️ CRITICAL: Pre-Implementation Checklist

**BEFORE starting ANY user story, ALWAYS:**

### 1. Git Branch Verification (MANDATORY)

```bash
# Check current branch
git branch --show-current

# Expected: feature/dashboard-rework
# If NOT on feature branch, STOP and create one:
git checkout dev
git pull origin dev
git checkout -b feature/dashboard-rework
```

**🚨 NEVER commit directly to `dev` or `main`!**

### 2. Read Project Standards

- ✅ Read `CLAUDE.md` - Project coding standards
- ✅ Read `CLAUDE.local.md` - Workflow requirements
- ✅ Review Performance Optimization Guidelines
- ✅ Check Production Readiness Standards

### 3. Understand Feature Context

- ✅ Read `START-HERE.md` - Feature overview
- ✅ Read `README.md` - Architecture details
- ✅ Check `STATUS.md` - Current progress
- ✅ Review dependency chain for current user story

## 📋 Implementation Workflow

### Phase 1: User Story Selection

1. **Check STATUS.md** for next user story
2. **Verify dependencies** are complete
3. **Read user story file** (US-XXX-\*.md)
4. **Understand acceptance criteria** completely

### Phase 2: Implementation

#### Step 1: Plan the Work

```bash
# Use the implement-userstory command
/implement-userstory US-XXX
```

This will:

- Load the user story details
- Create a plan
- Set up tracking

#### Step 2: Execute Implementation

Follow the user story's technical scope:

**For Database Changes (US-001):**

```bash
# Use Supabase MCP server to apply migrations
# ALWAYS use feature branch before migrations!
```

**For TypeScript/Utilities (US-002):**

- Create files in `src/features/dashboard/lib/`
- Follow naming conventions from `CLAUDE.md`
- Use local timezone via `@/lib/date-utils`

**For Hooks (US-003):**

- Create in `src/features/dashboard/hooks/`
- Follow React Query patterns from existing code
- Set appropriate `staleTime` and `gcTime`

**For Components (US-004, US-005):**

- Use ONLY shadcn/ui components
- Apply React.memo for performance
- Use useCallback for event handlers
- Make responsive (mobile/tablet/desktop)

**For Page Integration (US-006):**

- Update `src/app/page.tsx`
- Implement lazy loading for charts
- Add proper loading/error states
- Follow responsive design patterns

#### Step 3: Testing

**For every user story:**

```bash
# Run tests
npm test

# Run linting
npm run lint

# Check build
npm run build
```

**Test Requirements:**

- Unit tests for utilities
- Component tests for UI
- Integration tests for hooks
- Manual testing of functionality

#### Step 4: Quality Checks

**Before marking story complete:**

- ✅ All acceptance criteria met
- ✅ Tests passing (100%)
- ✅ Lint check passes (0 errors, 0 warnings)
- ✅ Build successful
- ✅ Code follows CLAUDE.md standards
- ✅ Performance optimizations applied
- ✅ No `any` types
- ✅ No console statements (use logger)
- ✅ Proper error handling

#### Step 5: Update STATUS.md

```markdown
## US-XXX: [Title]

**Status**: ✅ Complete
**Completed**: YYYY-MM-DD
**Notes**: [Any important notes]
```

### Phase 3: Commit and Push

```bash
# Stage changes
git add .

# Commit with conventional format
git commit -m "feat(dashboard): implement US-XXX - [description]

- Acceptance criteria 1
- Acceptance criteria 2
- Tests added

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to feature branch
git push origin feature/dashboard-rework
```

## 🎯 User Story Implementation Order

### US-001: Database Layer - RPC Functions ⚙️

**Dependencies**: None (foundation)

**Key Tasks**:

1. Create `get_weekly_session_stats` RPC function
2. Create `get_monthly_activity_stats` RPC function
3. Test with sample data
4. Document in RPC_SIGNATURES.md

**Expected Outcome**: 2 working RPC functions returning correct data

**Command**: `/implement-userstory US-001`

---

### US-002: Type Definitions and Utilities 📐

**Dependencies**: US-001 (need RPC structure)

**Key Tasks**:

1. Create `types.ts` with interfaces
2. Create `week-utils.ts` for calendar week calculations
3. Create `month-utils.ts` for month calculations
4. Write unit tests for utilities

**Expected Outcome**: Type-safe interfaces and tested utility functions

**Command**: `/implement-userstory US-002`

---

### US-003: Data Layer - Analytics Hooks 🔌

**Dependencies**: US-001 (RPC functions), US-002 (types)

**Key Tasks**:

1. Create `analytics-utils.ts` with RPC callers
2. Create `use-weekly-sessions.ts` hook
3. Create `use-monthly-activity.ts` hook
4. Configure React Query caching

**Expected Outcome**: Working hooks with proper error handling and caching

**Command**: `/implement-userstory US-003`

---

### US-004: Weekly Session Pie Charts 📊

**Dependencies**: US-002 (types), US-003 (data hooks)

**Key Tasks**:

1. Create `SessionsByTypeChart.tsx` component
2. Use shadcn/ui PieChart
3. Implement 7 session types with colors
4. Add legend
5. Make responsive

**Expected Outcome**: Working pie chart component with legend

**Command**: `/implement-userstory US-004`

---

### US-005: Monthly Activity Metrics 📈

**Dependencies**: US-002 (types), US-003 (data hooks)

**Key Tasks**:

1. Create `MonthlyActivityCard.tsx` component
2. Display 5 metrics with icons
3. Make responsive grid
4. Apply React.memo

**Expected Outcome**: Metrics displayed in responsive cards

**Command**: `/implement-userstory US-005`

---

### US-006: Dashboard Page Integration 🏠

**Dependencies**: US-004 (charts), US-005 (metrics), US-003 (hooks)

**Key Tasks**:

1. Remove old dashboard content
2. Create new layout structure
3. Add 3-week pie charts
4. Add monthly metrics section
5. Implement month selector
6. Add lazy loading

**Expected Outcome**: Complete dashboard with all analytics

**Command**: `/implement-userstory US-006`

---

### US-007: Testing and Quality Assurance ✅

**Dependencies**: US-001 through US-006 (all implementation)

**Key Tasks**:

1. Write/verify utility tests
2. Write component tests
3. Write hook integration tests
4. Run full test suite
5. Verify lint passes
6. Verify build succeeds

**Expected Outcome**: 100% tests passing, 0 lint errors

**Command**: `/implement-userstory US-007`

---

### US-008: Production Readiness 🚀

**Dependencies**: US-001 through US-007 (everything complete)

**Key Tasks**:

1. Security audit (RLS policies)
2. Database optimization (indexes)
3. Performance optimization (bundle size, React.memo)
4. Error handling review
5. Documentation complete
6. Monitoring setup (if applicable)

**Expected Outcome**: Production-ready feature meeting all CLAUDE.md standards

**Command**: `/implement-userstory US-008`

## 🛠️ Common Patterns and Best Practices

### Database (US-001)

```sql
-- Always use server-side aggregation
-- Use COUNT(*) FILTER for grouping
-- Return consistent column names matching TypeScript types
```

### TypeScript (US-002)

```typescript
// Use snake_case for database fields
export interface WeeklySessionStats {
  week_start: string; // YYYY-MM-DD
  total_sessions: number;
  // ... matching database exactly
}
```

### Hooks (US-003)

```typescript
// Follow existing pattern
export const useWeeklySessions = (weekStart: string) => {
  return useQuery({
    queryKey: weeklySessionsKeys.week(weekStart),
    queryFn: () => getWeeklySessionStats(weekStart),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};
```

### Components (US-004, US-005)

```typescript
// Always memo complex components
export const SessionsByTypeChart = memo(function SessionsByTypeChart({
  data,
  title,
}: Props) {
  // Use useCallback for handlers
  const handleClick = useCallback(() => {}, []);

  return (
    <ChartContainer>
      <PieChart>{/* ... */}</PieChart>
    </ChartContainer>
  );
});
```

### Page Layout (US-006)

```typescript
// Lazy load heavy components
const SessionsByTypeChart = lazy(
  () => import("@/features/dashboard/components/SessionsByTypeChart")
);

// Handle loading states
{isLoading ? <Skeleton /> : <Chart data={data} />}
```

## 🚨 Common Pitfalls to Avoid

1. **❌ Skipping branch check** → Always verify feature branch first
2. **❌ Not reading dependencies** → Causes implementation issues
3. **❌ Using `any` types** → Type safety is critical
4. **❌ Client-side aggregation** → Always use server-side for performance
5. **❌ Missing React.memo** → Components will re-render unnecessarily
6. **❌ Hardcoding colors** → Use existing session type color scheme
7. **❌ Forgetting tests** → Tests are required, not optional
8. **❌ Console statements** → Use logger utility instead
9. **❌ Skipping lint/build** → Catches issues early
10. **❌ Not updating STATUS.md** → Lose track of progress

## 📊 Progress Tracking

Update STATUS.md after each milestone:

```markdown
## Current Status: US-XXX in progress

### Completed

- ✅ US-001: Database Layer
- ✅ US-002: Type Definitions

### In Progress

- 🔄 US-003: Analytics Hooks (50% complete)

### Pending

- ⏳ US-004: Pie Charts
- ⏳ US-005: Activity Metrics
  ...
```

## 🎯 Definition of Done

A user story is ONLY complete when:

- ✅ All acceptance criteria met
- ✅ Code follows CLAUDE.md standards
- ✅ Tests written and passing
- ✅ Lint check passes (0 errors)
- ✅ Build successful
- ✅ Performance optimizations applied
- ✅ Documentation updated
- ✅ STATUS.md updated
- ✅ Committed to feature branch

## 🔄 Iteration and Refinement

If issues arise:

1. **Document the issue** in STATUS.md
2. **Create a note** in the user story file
3. **Adjust approach** if needed
4. **Update acceptance criteria** if requirements change
5. **Communicate** blockers or questions

## ✅ Final Checklist (US-008)

Before marking feature complete:

- [ ] All 8 user stories complete
- [ ] Full test suite passing
- [ ] Lint and build successful
- [ ] Production readiness checklist complete
- [ ] Documentation complete
- [ ] Performance targets met
- [ ] Security audit complete
- [ ] Ready for PR to dev branch

---

**Ready to implement?** Start with `/implement-userstory US-001`!
