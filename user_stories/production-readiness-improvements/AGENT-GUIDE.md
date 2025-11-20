# AGENT-GUIDE: Production Readiness & Code Quality Improvements

This guide provides a systematic workflow for implementing the production readiness improvements feature. Follow this guide sequentially for optimal results.

## 🎯 Implementation Philosophy

### Core Principles

1. **Sequential Implementation**: User stories have dependencies and must be completed in order
2. **Test-Driven**: Write/update tests before marking stories complete
3. **CLAUDE.md Compliance**: Every change must follow project standards
4. **Incremental Progress**: Commit after each user story completion
5. **Documentation-First**: Update docs as you implement

### Success Criteria

Each user story is complete ONLY when:

- ✅ All acceptance criteria met
- ✅ Tests passing (100% pass rate)
- ✅ Lint passing (0 errors, 0 warnings)
- ✅ Build successful
- ✅ TypeScript compiling with no errors
- ✅ STATUS.md updated
- ✅ Changes committed to git

---

## 📅 Implementation Roadmap

### Sprint 1: Critical Stability Fixes (Week 1 - 28 hours)

#### US-001: Add Error Boundaries to All Routes (8 hours)

**Dependencies**: None

**Implementation Steps**:

1. **Create Consolidated Error Boundary Component**

   ```bash
   # Location: src/components/feedback/AppErrorBoundary.tsx
   ```

   - Implement with feature-specific context
   - Add error logging to future monitoring service
   - Include recovery actions (reset, retry)
   - Add user-friendly error messages

2. **Add error.tsx to Each Route**
   Routes requiring error boundaries:
   - `/app/payments/error.tsx`
   - `/app/plans/error.tsx`
   - `/app/settings/error.tsx`
   - `/app/subscriptions/error.tsx`
   - `/app/trainers/error.tsx`
   - `/app/members/error.tsx`
   - `/app/dashboard/error.tsx`
   - `/app/equipment/error.tsx`
   - `/app/classes/error.tsx`

3. **Remove Duplicate Error Boundaries**
   - Deprecate `src/features/trainers/components/TrainerErrorBoundary.tsx`
   - Deprecate `src/features/members/components/MemberErrorBoundary.tsx`
   - Update all imports to use `AppErrorBoundary`

4. **Create Documentation**

   ```bash
   # Location: docs/ERROR-HANDLING-GUIDE.md
   ```

   - Document error boundary patterns
   - Provide usage examples
   - List best practices

5. **Testing**
   - Unit tests for `AppErrorBoundary`
   - Integration tests simulating errors in routes
   - Verify error logging functionality

6. **Verification Checklist**
   - [ ] All routes have error.tsx files
   - [ ] Consolidated error boundary created
   - [ ] Documentation complete
   - [ ] Tests passing
   - [ ] No console errors during error scenarios

7. **Commit**

   ```bash
   git add .
   git commit -m "feat(US-001): add error boundaries to all routes

   - Create consolidated AppErrorBoundary component
   - Add error.tsx to all major routes
   - Remove duplicate error boundary implementations
   - Add ERROR-HANDLING-GUIDE documentation

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

#### US-002: Add Loading States to All Routes (8 hours)

**Dependencies**: None

**Implementation Steps**:

1. **Create LoadingSkeleton Component Library**

   ```bash
   # Location: src/components/feedback/
   ```

   - `LoadingSkeleton.tsx` - Base component
   - `skeletons/TableSkeleton.tsx`
   - `skeletons/FormSkeleton.tsx`
   - `skeletons/CardSkeleton.tsx`
   - `skeletons/DetailPageSkeleton.tsx`
   - `skeletons/DashboardSkeleton.tsx`

2. **Implement Skeleton Variants**
   Each skeleton should:
   - Match actual content structure
   - Include shimmer animation
   - Be accessible (ARIA attributes)
   - Be customizable (count, className props)

3. **Add loading.tsx to Routes**
   Routes requiring loading states:
   - `/app/members/loading.tsx` (table)
   - `/app/members/[id]/loading.tsx` (detail page)
   - `/app/trainers/loading.tsx` (table)
   - `/app/trainers/[id]/loading.tsx` (detail page)
   - `/app/payments/loading.tsx` (table)
   - `/app/subscriptions/loading.tsx` (table)
   - `/app/plans/loading.tsx` (card)
   - `/app/dashboard/loading.tsx` (dashboard)
   - `/app/equipment/loading.tsx` (table)
   - `/app/classes/loading.tsx` (table)

4. **Testing**
   - Visual regression tests in Storybook
   - Verify ARIA labels
   - Test no layout shift when content loads

5. **Verification Checklist**
   - [ ] All routes have loading.tsx files
   - [ ] Skeleton component library created
   - [ ] Smooth animations implemented
   - [ ] Tests passing
   - [ ] No layout shift when content loads

6. **Commit**

   ```bash
   git add .
   git commit -m "feat(US-002): add loading states to all routes

   - Create LoadingSkeleton component library
   - Add loading.tsx to all data-fetching routes
   - Implement skeleton variants (table, form, card, etc.)
   - Add shimmer animations

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

#### US-003: Fix Environment Variable Validation (4 hours)

**Dependencies**: None

**Implementation Steps**:

1. **Audit Direct process.env Usage**

   ```bash
   grep -r "process\.env" src/ --exclude-dir=node_modules > env-audit.txt
   ```

   Review all instances and plan replacements

2. **Update middleware.ts**

   ```typescript
   // Replace process.env with validated env import
   import { env } from "@/lib/env";
   ```

3. **Update All Other Files**
   Replace every instance of direct `process.env` access

4. **Verify env.ts Has All Variables**
   Update `src/lib/env.ts` if new variables discovered

5. **Update .env.example**
   Ensure all required variables documented

6. **Testing**
   - Test build fails gracefully with missing env vars
   - Verify all features work with validated env access
   - No runtime errors

7. **Verification Checklist**
   - [ ] Zero direct `process.env` usages outside `/lib/env.ts`
   - [ ] Build validation working
   - [ ] Documentation updated
   - [ ] Tests passing

8. **Commit**

   ```bash
   git add .
   git commit -m "feat(US-003): fix environment variable validation

   - Replace all direct process.env with validated env object
   - Update middleware.ts environment access
   - Verify build-time validation for missing variables
   - Update .env.example

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

#### US-004: Remove TypeScript Suppressions and Console Statements (8 hours)

**Dependencies**: None

**Implementation Steps**:

1. **Fix TrainerCalendarView.tsx**
   - Remove `@ts-nocheck` directive
   - Define proper types for all props
   - Fix calendar data property types
   - Run `npx tsc --noEmit` to verify

2. **Audit Console Statements**

   ```bash
   grep -r "console\." src/ --exclude-dir=__tests__ --exclude-dir=node_modules
   ```

3. **Replace Console Statements**
   For each file:
   - Import logger utility
   - Replace console.log with logger.info
   - Replace console.error with logger.error
   - Replace console.warn with logger.warn

4. **Files to Update**:
   - `src/features/training-sessions/lib/session-limit-utils.ts`
   - `src/features/invoices/hooks/use-bulk-invoice-download.ts`
   - `src/features/invoices/lib/zip-utils.ts`
   - `src/features/memberships/lib/transaction-utils.ts`
   - All other files from audit

5. **Testing**
   - Run `npx tsc --noEmit` to verify no type errors
   - Run `npm run lint` to verify no console statements
   - Test logging works in development

6. **Verification Checklist**
   - [ ] Zero `@ts-nocheck` directives
   - [ ] Zero console statements (outside test files)
   - [ ] All type errors resolved
   - [ ] ESLint passing
   - [ ] TypeScript compiling without errors

7. **Commit**

   ```bash
   git add .
   git commit -m "feat(US-004): remove TypeScript suppressions and console statements

   - Fix TrainerCalendarView.tsx type errors
   - Replace all console statements with logger utility
   - Remove @ts-nocheck directive
   - Ensure ESLint and TypeScript pass

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

### Sprint 2: Performance Optimization (Weeks 2-3 - 40 hours)

#### US-005: Add React.memo to Large Components (8 hours)

**Dependencies**: None

**Implementation Steps**:

1. **Identify Large Components**
   Components >500 lines to optimize:
   - `TrainerForm.tsx` (840 lines)
   - `ProgressiveMemberForm.tsx` (790 lines)
   - `ProgressiveTrainerForm.tsx` (675 lines)
   - `AdvancedTrainerTable.tsx` (659 lines)
   - `/app/payments/page.tsx` (652 lines)
   - `BulkActionToolbar.tsx` (628 lines)

2. **Apply React.memo Pattern**
   For each component:

   ```typescript
   import { memo } from "react";

   export const ComponentName = memo(function ComponentName(props) {
     // Component logic
   });

   ComponentName.displayName = "ComponentName";
   ```

3. **Wrap Event Handlers in useCallback**

   ```typescript
   const handleEvent = useCallback(() => {
     // handler logic
   }, [dependencies]);
   ```

4. **Add useMemo for Expensive Computations**

   ```typescript
   const processedData = useMemo(() => expensiveOperation(data), [data]);
   ```

5. **Measure Performance**
   - Use React DevTools Profiler before/after
   - Document re-render reduction
   - Verify 30%+ improvement

6. **Testing**
   - Test functionality unchanged
   - Performance benchmarks show improvement
   - All tests passing

7. **Verification Checklist**
   - [ ] All components >500 lines use React.memo
   - [ ] Event handlers wrapped in useCallback
   - [ ] Expensive computations memoized
   - [ ] 30%+ reduction in unnecessary re-renders
   - [ ] Tests passing

8. **Commit**

---

#### US-006: Move Client-Side Operations to Server-Side (16 hours)

**Dependencies**: None

**Implementation Steps**:

1. **Audit Client-Side Operations**
   Identify all client-side filtering/sorting in:
   - `use-training-sessions.ts`
   - `use-members.ts`
   - `use-payments.ts`
   - Component files (MemberPayments, etc.)

2. **Refactor use-training-sessions.ts**
   Move to query parameters:
   - Trainer filtering
   - Status filtering
   - Date range filtering

3. **Refactor use-members.ts**
   Move to query parameters:
   - Member type filtering
   - Status filtering
   - Search functionality

4. **Refactor use-payments.ts**
   Move to query parameters:
   - Date range filtering
   - Status filtering

5. **Update Components**
   Update components to use server-side filtering:
   - `MemberPayments.tsx`
   - `ProgressiveMemberForm.tsx`
   - `ReferralEditor.tsx`

6. **Performance Testing**
   - Test with large datasets (1000+ records)
   - Verify query performance <100ms
   - Document improvements

7. **Verification Checklist**
   - [ ] All filtering moved to database queries
   - [ ] No client-side operations on large datasets
   - [ ] Query performance <100ms average
   - [ ] Tests passing
   - [ ] Performance benchmarks improved

8. **Commit**

---

#### US-007: Implement Dynamic Imports for Heavy Libraries (8 hours)

**Dependencies**: US-002 (loading states needed for fallbacks)

**Implementation Steps**:

1. **Identify Static Imports**
   Chart libraries in:
   - `SessionsByTypeChart.tsx`
   - `SubscriptionMetricsChart.tsx`
   - `TrialMetricsChart.tsx`
   - `CancellationsChart.tsx`

2. **Convert to Dynamic Imports**

   ```typescript
   import { lazy, Suspense } from 'react';

   const ChartComponent = lazy(() =>
     import('recharts').then(m => ({ default: m.LineChart }))
   );

   export function MyChart() {
     return (
       <Suspense fallback={<LoadingSkeleton variant="card" />}>
         <ChartComponent data={data} />
       </Suspense>
     );
   }
   ```

3. **Add Loading Fallbacks**
   Use LoadingSkeleton components from US-002

4. **Measure Bundle Size**
   - Run bundle analyzer
   - Document size reduction
   - Verify <300 KB per route

5. **Testing**
   - Test lazy loading works in production build
   - Verify loading fallbacks display correctly
   - Performance metrics improved

6. **Verification Checklist**
   - [ ] All chart libraries dynamically imported
   - [ ] Bundle size <300 KB per route
   - [ ] Loading fallbacks implemented
   - [ ] Tests passing
   - [ ] Build size reduced by ~400KB

7. **Commit**

---

#### US-008: Optimize Bundle Size and Add Virtual Scrolling (8 hours)

**Dependencies**: None

**Implementation Steps**:

1. **Install Dependencies**

   ```bash
   npm install --save-dev @next/bundle-analyzer
   npm install @tanstack/react-virtual
   ```

2. **Configure Bundle Analyzer**
   Update `next.config.js`

3. **Run Bundle Analysis**

   ```bash
   ANALYZE=true npm run build
   ```

   Document findings

4. **Implement Virtual Scrolling**
   For large tables:
   - Members table
   - Training sessions table
   - Payments table
   - Equipment table

5. **Virtual Scrolling Pattern**

   ```typescript
   import { useVirtualizer } from "@tanstack/react-virtual";

   const virtualizer = useVirtualizer({
     count: data.length,
     getScrollElement: () => parentRef.current,
     estimateSize: () => 50,
     overscan: 5,
   });
   ```

6. **Performance Testing**
   - Test with 1000+ items
   - Verify 60fps scrolling
   - Measure before/after metrics

7. **Verification Checklist**
   - [ ] Bundle analyzer configured
   - [ ] Virtual scrolling implemented for all large tables
   - [ ] All routes <300 KB bundle size
   - [ ] Smooth 60fps scrolling
   - [ ] Tests passing

8. **Commit**

---

### Sprint 3: Code Quality & Organization (Weeks 4-5 - 48 hours)

#### US-009: Remove TypeScript `any` Types with Proper Interfaces (24 hours)

**Dependencies**: None

**Implementation Steps**:

1. **Audit `any` Type Usage**

   ```bash
   grep -r ": any" src/ --exclude-dir=node_modules | wc -l
   ```

   Target: 92 files → 0 files

2. **Create Type Organization Structure**

   ```bash
   mkdir -p src/features/database/lib/types
   ```

   Create modular type files:
   - `database.types.ts`
   - `member.types.ts`
   - `trainer.types.ts`
   - `session.types.ts`
   - `payment.types.ts`
   - `subscription.types.ts`
   - `enums.types.ts`
   - `index.ts` (barrel export)

3. **Migrate Types from types.ts**
   Split 711-line file into logical modules

4. **Fix High-Priority Files First**
   - `use-members.ts`
   - `ProgressiveMemberForm.tsx`
   - `SessionBookingDialog.tsx`
   - `BusinessInfoForm.tsx`

5. **Create Proper Interfaces**
   Replace every `any` with specific interface:

   ```typescript
   interface MemberFormData {
     first_name: string;
     last_name: string;
     email: string | null;
     // ... all fields explicitly typed
   }
   ```

6. **Enable TypeScript Strict Mode**
   If not already enabled in `tsconfig.json`

7. **Testing**
   - Run `npx tsc --noEmit`
   - Verify IDE autocomplete works
   - All tests still pass

8. **Verification Checklist**
   - [ ] Zero `any` types in production code
   - [ ] Types organized into logical modules
   - [ ] TypeScript strict mode enabled
   - [ ] IDE autocomplete working
   - [ ] Tests passing

9. **Commit**

---

#### US-010: Consolidate Hooks Per 4-Hook Rule (24 hours)

**Dependencies**: None

**Implementation Steps**:

1. **Audit Current Hooks**

   ```bash
   find src/features -name "use-*.ts" | sort > hooks-audit.txt
   ```

   Current: 99 hooks → Target: ~48 hooks

2. **Plan Consolidation by Feature**

   **Members (25 → 4)**:
   - `use-members.ts` (CRUD + search + export)
   - `use-member-form.ts` (form state + validation)
   - `use-member-filters.ts` (filter state + URL sync)
   - `use-member-analytics.ts` (stats + charts)

   **Trainers (17 → 4)**:
   - `use-trainers.ts`
   - `use-trainer-form.ts`
   - `use-trainer-filters.ts`
   - `use-trainer-schedule.ts`

   **Subscriptions (15 → 4)**:
   - Similar pattern

3. **Implement Consolidated Hooks**

   ```typescript
   // src/features/members/hooks/use-members.ts
   export function useMembers(options?: UseMembersOptions) {
     // Consolidate all member-related functionality
     const query = useInfiniteQuery(...);
     const create = useCreateMember();
     const update = useUpdateMember();
     // ... more mutations

     return {
       // Query state
       members: query.data,
       // Mutations
       createMember: create.mutateAsync,
       updateMember: update.mutateAsync,
       // Actions
       exportToCSV: useCallback(...),
       search: useCallback(...),
     };
   }
   ```

4. **Create Barrel Exports**

   ```typescript
   // src/features/members/hooks/index.ts
   export * from "./use-members";
   export * from "./use-member-form";
   export * from "./use-member-filters";
   export * from "./use-member-analytics";
   ```

5. **Update All Imports**
   Update component imports to use consolidated hooks

6. **Remove Deprecated Hook Files**
   Delete old specialized hooks

7. **Update Tests**
   Update all hook tests for new signatures

8. **Verification Checklist**
   - [ ] Members: 25 hooks → 4 hooks
   - [ ] Trainers: 17 hooks → 4 hooks
   - [ ] All features follow 4-hook rule
   - [ ] Barrel exports created
   - [ ] Tests passing
   - [ ] Documentation updated

9. **Commit**

---

#### US-011: Setup Monitoring and Complete Documentation (16 hours)

**Dependencies**: None

**Implementation Steps**:

1. **Install Sentry**

   ```bash
   npm install --save @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

2. **Configure Sentry**
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - Configure source maps
   - Test error reporting

3. **Setup Performance Monitoring**
   - Configure Core Web Vitals tracking
   - Add custom performance marks
   - Setup database query monitoring
   - Configure alert rules

4. **Create Documentation**

   **docs/DATABASE-INDEXES.md**:
   - List all current indexes
   - Explain rationale for each
   - Document query patterns

   **docs/PERFORMANCE-BENCHMARKS.md**:
   - Define performance targets
   - Document measurement methods
   - Include benchmark tests

   **docs/MONITORING-SETUP.md**:
   - Sentry configuration guide
   - Alert rule documentation
   - Debugging with source maps

   **docs/COMPONENT-PATTERNS.md**:
   - Standard component structure
   - React.memo usage guidelines
   - Performance best practices

5. **Document Database Indexes**
   Review all database indexes and document purpose

6. **Testing**
   - Test Sentry error capture in staging
   - Verify performance metrics logged
   - Documentation review

7. **Verification Checklist**
   - [ ] Sentry configured and tested
   - [ ] Performance monitoring active
   - [ ] All documentation complete
   - [ ] Monitoring alerts configured
   - [ ] Tests passing

8. **Commit**

---

### Sprint 4: Final Production Readiness (Week 6 - 16 hours)

#### US-012: Production Readiness Audit & Final Optimization (16 hours)

**Dependencies**: ALL previous user stories (US-001 through US-011)

**Implementation Steps**:

1. **Security Audit**
   - [ ] Verify RLS policies documented
   - [ ] Test input validation
   - [ ] Audit environment variables
   - [ ] Security vulnerability scan
   - [ ] Rate limiting verification

2. **Database Optimization Audit**
   - [ ] Verify all indexes documented
   - [ ] Check for N+1 queries
   - [ ] Verify transactions implemented
   - [ ] Measure query performance (<100ms)
   - [ ] Test pagination

3. **Performance Audit**
   - [ ] Run bundle analyzer
   - [ ] Measure Core Web Vitals
   - [ ] Test with 1000+ records
   - [ ] Verify React.memo coverage
   - [ ] Check dynamic imports

4. **Error Handling Audit**
   - [ ] Verify all routes have error boundaries
   - [ ] Check all loading states
   - [ ] Test error scenarios
   - [ ] Verify error logging

5. **Code Quality Audit**

   ```bash
   npm run lint        # Must pass
   npm test           # Must pass 100%
   npm run build      # Must succeed
   npx tsc --noEmit   # Must pass
   ```

6. **Create Performance Benchmark Suite**

   ```typescript
   // src/__tests__/performance-benchmarks.test.ts
   describe("Production Performance Benchmarks", () => {
     it("should load members page under 200ms", async () => {
       // Benchmark test
     });
   });
   ```

7. **Create Pre-Production Checklist Script**

   ```bash
   # scripts/pre-production-check.sh
   #!/bin/bash
   echo "Running pre-production checks..."
   npx tsc --noEmit || exit 1
   npm run lint || exit 1
   npm test || exit 1
   npm run build || exit 1
   echo "✅ All checks passed!"
   ```

8. **Manual QA Testing**
   - Test all major user flows
   - Test error scenarios
   - Test loading states
   - Performance testing

9. **Documentation Review**
   - Verify all docs complete
   - Update README if needed
   - Check CLAUDE.md compliance

10. **Final Metrics Verification**
    Calculate final scores:
    - Production Readiness: Should be 90%+
    - Security Score: Should be 98%+
    - Performance Score: Should be 90%+
    - Code Quality: Should be 95%+
    - Type Safety: Should be 98%+

11. **Verification Checklist**
    Complete the full Production Readiness Checklist from CLAUDE.md

12. **Commit**

    ```bash
    git add .
    git commit -m "feat(US-012): production readiness audit and final optimization

    - Complete security audit
    - Verify all performance targets met
    - Create benchmark test suite
    - Add pre-production check script
    - Final documentation review

    Production readiness: 90%+
    Security score: 98%+
    Performance score: 90%+

    🤖 Generated with Claude Code
    Co-Authored-By: Claude <noreply@anthropic.com>"
    ```

---

## 🔄 Status Tracking Workflow

### After Each User Story

1. **Update STATUS.md**

   ```markdown
   ## US-XXX: [Title] ✅

   - **Status**: Completed
   - **Completed**: 2024-01-XX
   - **Effort**: X hours
   - **Key Changes**:
     - Change 1
     - Change 2
   - **Performance Impact**: +X% improvement
   - **Notes**: Any learnings or issues
   ```

2. **Run Verification**

   ```bash
   npm run lint
   npm test
   npm run build
   npx tsc --noEmit
   ```

3. **Commit**
   Follow commit message format in each user story

4. **Push to Remote** (regularly)
   ```bash
   git push origin feature/production-readiness-improvements
   ```

---

## 🚫 Common Mistakes to Avoid

### 1. Skipping Dependencies

❌ **Wrong**: Starting US-007 before completing US-002
✅ **Right**: Following dependency order listed in each user story

### 2. Not Updating STATUS.md

❌ **Wrong**: Completing story without updating documentation
✅ **Right**: Update STATUS.md immediately after completion

### 3. Incomplete Testing

❌ **Wrong**: Only running `npm test`
✅ **Right**: Run full verification suite (lint + test + build + tsc)

### 4. Large Commits

❌ **Wrong**: Committing multiple user stories at once
✅ **Right**: One commit per user story

### 5. Not Following CLAUDE.md

❌ **Wrong**: Using console.log or any types
✅ **Right**: Always follow CLAUDE.md standards

---

## ✅ Definition of Done

A user story is ONLY complete when ALL of these are true:

- [ ] All acceptance criteria met (check user story file)
- [ ] All implementation steps completed
- [ ] Tests written and passing (100% pass rate)
- [ ] `npm run lint` passes (0 errors, 0 warnings)
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] STATUS.md updated with completion details
- [ ] Changes committed with proper message format
- [ ] Manual testing completed for changed functionality
- [ ] Documentation updated if needed

---

## 🆘 Troubleshooting

### Build Failures

1. Check error message carefully
2. Review `docs/TROUBLESHOOTING.md`
3. Verify all dependencies installed: `npm install`
4. Clear build cache: `rm -rf .next`

### Test Failures

1. Read test error messages completely
2. Check if tests need updating for new patterns
3. Verify test data is correct
4. Run single test: `npm test -- path/to/test.ts`

### Type Errors

1. Run `npx tsc --noEmit` for detailed errors
2. Check type definitions in `types/` directory
3. Verify imports are correct
4. Don't use `@ts-ignore` - fix the underlying issue

### Performance Issues

1. Use React DevTools Profiler
2. Check for missing React.memo
3. Verify useCallback on event handlers
4. Review `docs/PERFORMANCE-BENCHMARKS.md`

---

## 🎯 Next Steps

1. Verify you're on correct feature branch
2. Read START-HERE.md if you haven't
3. Start with US-001: `cat US-001-add-error-boundaries.md`
4. Follow implementation steps systematically
5. Update STATUS.md after each completion
6. Commit and move to next story

---

**Good luck! Follow this guide systematically for success.**
