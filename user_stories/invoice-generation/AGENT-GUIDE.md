# Invoice Generation System - AGENT IMPLEMENTATION GUIDE

## 🎯 Purpose

This guide provides a systematic workflow for implementing the Invoice Generation System feature. Follow this step-by-step process to ensure consistent, high-quality implementation.

## 🚨 MANDATORY PRE-FLIGHT CHECKS

### Before Starting ANY User Story

**1. Git Branch Verification** (CRITICAL)

```bash
# MUST be on feature branch
git branch --show-current
# Should show: feature/invoice-generation
```

**If not on feature branch:**

```bash
# STOP ALL WORK
git checkout dev
git pull origin dev
git checkout -b feature/invoice-generation
```

**2. Read Project Guidelines**

- ✅ Read `/CLAUDE.md` completely
- ✅ Review Performance Optimization Guidelines section
- ✅ Check Quick Reference Checklist for React components

**3. Verify Infrastructure**

```bash
# Check database migrations applied
# Check Supabase Storage bucket exists
# Verify TypeScript types compiled
npm run build
```

## 📋 Implementation Workflow

### Step 1: Understand the User Story

**For each user story (US-001, US-002, etc.):**

1. **Read the full user story file** (`US-XXX-*.md`)
2. **Understand business value** - Why does this matter?
3. **Review acceptance criteria** - What defines "done"?
4. **Check dependencies** - Are prerequisite stories complete?
5. **Estimate complexity** - Does it match your assessment?

### Step 2: Plan Technical Approach

**Before writing any code:**

1. **List files to create/modify**

   ```
   Example:
   - Create: src/features/settings/components/GeneralTab.tsx
   - Modify: src/features/settings/components/StudioSettingsLayout.tsx
   - Create: src/features/settings/hooks/use-general-settings.ts
   ```

2. **Identify existing patterns to follow**
   - Check similar components (OpeningHoursTab, PlanningTab)
   - Review existing hooks (use-studio-settings)
   - Study established API patterns

3. **Check performance requirements**
   - Will component be complex? → React.memo
   - Event handlers needed? → useCallback
   - Heavy computations? → useMemo
   - Large library imports? → Dynamic import

### Step 3: Implement Incrementally

**Follow TDD approach:**

1. **Write types first** (if needed beyond existing types)
2. **Write utility functions** (pure logic, easy to test)
3. **Write hooks** (data fetching, state management)
4. **Write components** (UI layer)
5. **Write tests** (unit → integration)

**Example Order for US-001:**

```
1. Verify GeneralSettings type exists ✅ (already done)
2. Create use-general-settings.ts hook
3. Create BusinessInfoForm.tsx
4. Create LogoUploadField.tsx
5. Create GeneralTab.tsx (compose above)
6. Update StudioSettingsLayout.tsx
7. Write tests for hook
8. Write tests for components
9. Integration test
```

### Step 4: Follow Code Standards

**TypeScript:**

- ❌ NEVER use `any` type
- ✅ Create interfaces for complex types
- ✅ Use strict null checks

**React Components:**

- ✅ Use `React.memo` for complex components
- ✅ Use `useCallback` for event handlers
- ✅ Use `useMemo` for expensive computations
- ✅ Destructure props for clarity
- ❌ NO inline object creation in JSX

**Styling:**

- ✅ ONLY use shadcn/ui components
- ✅ Use `cn()` utility for conditional classes
- ❌ NO custom CSS or styled-components

**Performance:**

- ✅ Dynamic imports for heavy libraries
- ✅ Server-side operations for database queries
- ✅ Lazy loading for large components
- ❌ NO client-side sorting/filtering on large datasets

**Logging:**

- ✅ Use `logger` utility from `@/lib/logger`
- ❌ NEVER use `console.log/warn/error`

### Step 5: Test Thoroughly

**Before marking story complete:**

1. **Unit Tests**

   ```bash
   npm test path/to/your-feature.test.ts
   ```

2. **Linting**

   ```bash
   npm run lint
   # MUST show 0 errors, 0 warnings
   ```

3. **Type Checking**

   ```bash
   npm run build
   # MUST compile successfully
   ```

4. **Manual Testing**
   - Test happy path
   - Test edge cases (empty data, errors, etc.)
   - Test on different screen sizes
   - Test with/without existing settings

### Step 6: Update Documentation

**After completing each user story:**

1. **Update STATUS.md**

   ```markdown
   ### US-001: General Settings Tab

   **Status:** ✅ Completed
   **Completed:** 2025-01-08
   **Notes:** All acceptance criteria met. Tests passing.
   ```

2. **Add implementation notes** (if needed)
   - Document any deviations from plan
   - Note any discovered edge cases
   - Record performance optimizations applied

### Step 7: Commit & Push

**Follow commit message format:**

```bash
git add .
git commit -m "feat(invoices): implement US-001 - general settings tab

- Add GeneralTab component with business info form
- Implement logo upload with preview
- Create use-general-settings hook
- Add validation and error handling
- Tests: 100% coverage

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin feature/invoice-generation
```

## 🔄 User Story Implementation Order

### Recommended Sequence

```
US-001 → US-002 → US-003 → US-004 → US-005 → US-006
  ↓        ↓        ↓        ↓        ↓        ↓
Settings Settings  PDF     Auto-    Viewing  Testing
General  Invoice  Engine  Generate
```

**Rationale:**

- **US-001 & US-002:** Foundation - settings infrastructure needed by all
- **US-003:** Core engine - can be tested independently
- **US-004:** Integration - depends on US-003
- **US-005:** UI completion - depends on US-004
- **US-006:** Quality - tests entire system

### Parallel Work Opportunities

**Can work in parallel:**

- US-001 and US-002 (independent settings tabs)

**Must be sequential:**

- US-003 depends on US-001, US-002 (needs settings to generate PDFs)
- US-004 depends on US-003 (needs PDF engine)
- US-005 depends on US-004 (needs invoices to exist)
- US-006 depends on all (tests complete system)

## 🚧 Common Pitfalls & Solutions

### Pitfall 1: Skipping Infrastructure Verification

**Problem:** Assuming database/storage is ready
**Solution:** Always verify with SQL queries or Storage checks

### Pitfall 2: Not Following Existing Patterns

**Problem:** Creating inconsistent component structure
**Solution:** Study `OpeningHoursTab.tsx` before building new tabs

### Pitfall 3: Missing Performance Optimizations

**Problem:** Unnecessary re-renders, large bundles
**Solution:** Use Performance Checklist from CLAUDE.md

### Pitfall 4: Incomplete Testing

**Problem:** Skipping edge cases or error scenarios
**Solution:** Test matrix: happy path + errors + edge cases

### Pitfall 5: Poor Error Handling

**Problem:** App crashes on API failures
**Solution:** Use try/catch, loading states, error messages

## 📊 Progress Tracking

### After Each User Story

**Update STATUS.md:**

```markdown
## Implementation Progress

- [x] US-001: General Settings Tab - ✅ Completed (2025-01-08)
- [ ] US-002: Invoice Settings Tab - 🚧 In Progress
- [ ] US-003: Invoice PDF Generation - ⏸️ Not Started
```

**Run Health Checks:**

```bash
npm run lint        # 0 errors, 0 warnings
npm test           # All passing
npm run build      # Successful compile
```

## ✅ Definition of Done

**A user story is complete when:**

1. ✅ All acceptance criteria met
2. ✅ Code follows CLAUDE.md guidelines
3. ✅ Performance checklist applied
4. ✅ Unit tests written and passing
5. ✅ Integration tests passing (if applicable)
6. ✅ Linting: 0 errors, 0 warnings
7. ✅ Build: Successful compilation
8. ✅ Manual testing: All scenarios work
9. ✅ STATUS.md updated
10. ✅ Code committed with proper message

## 🆘 When Stuck

### Debugging Checklist

**TypeScript Errors:**

1. Check types.ts for interface definitions
2. Verify import paths
3. Run `npm run build` for detailed errors

**Component Not Rendering:**

1. Check React DevTools
2. Verify props passed correctly
3. Check for console errors (in browser)

**API/Database Errors:**

1. Check Supabase logs (`mcp__supabase__get_logs`)
2. Verify RLS policies
3. Test query in Supabase SQL editor

**Storage Upload Failing:**

1. Check bucket exists
2. Verify storage policies
3. Check file size/format

### Getting Help

1. **Review existing code** - Similar features already implemented
2. **Check documentation** - CLAUDE.md has troubleshooting section
3. **Read error messages** - They're usually descriptive
4. **Use logger** - Add debug logs strategically

## 🎯 Quality Standards

### Code Quality Metrics

| Metric            | Target         | Command                   |
| ----------------- | -------------- | ------------------------- |
| Test Coverage     | >80%           | `npm run test:coverage`   |
| ESLint Errors     | 0              | `npm run lint`            |
| TypeScript Errors | 0              | `npm run build`           |
| Component Size    | <300 lines     | `wc -l ComponentName.tsx` |
| Hook Count        | <4 per feature | `ls hooks/`               |

### Performance Targets

| Metric           | Target            | Check With       |
| ---------------- | ----------------- | ---------------- |
| React Re-renders | <30% unnecessary  | React DevTools   |
| Database Queries | <5 per page       | Network tab      |
| Bundle Size      | No increase >50KB | `npm run build`  |
| First Load       | <3s               | Browser DevTools |

## 📝 Implementation Checklist Template

**Use this for each user story:**

```markdown
## US-XXX Implementation Checklist

### Pre-Implementation

- [ ] Read user story completely
- [ ] Verify on feature branch
- [ ] Check dependencies complete
- [ ] Plan technical approach
- [ ] Identify files to create/modify

### Implementation

- [ ] Types defined (if needed)
- [ ] Utilities created & tested
- [ ] Hooks created & tested
- [ ] Components created
- [ ] Integration complete
- [ ] Performance optimizations applied

### Testing

- [ ] Unit tests written
- [ ] Unit tests passing
- [ ] Integration tests written
- [ ] Integration tests passing
- [ ] Manual testing complete
- [ ] Edge cases tested

### Quality

- [ ] Linting: 0 errors, 0 warnings
- [ ] Build: Successful
- [ ] No console statements
- [ ] No `any` types
- [ ] Follows code standards

### Documentation

- [ ] STATUS.md updated
- [ ] Implementation notes added
- [ ] Code committed
- [ ] Branch pushed

### Done ✅
```

---

## 🚀 Ready to Implement?

**Start with:**

```bash
/implement-userstory US-001
```

**Good luck! Follow this guide and you'll build a production-quality feature.** 🎉
