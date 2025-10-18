# AGENT-GUIDE: Date Handling Standardization

## 🤖 Implementation Workflow

This guide provides step-by-step instructions for implementing the Date Handling Standardization feature systematically.

---

## 📋 Pre-Implementation Checklist

Before starting ANY user story:

- [ ] Read START-HERE.md completely
- [ ] Understand the date vs timestamp distinction
- [ ] Review the problem patterns
- [ ] Check git status (clean working directory recommended)
- [ ] Ensure on correct branch (create feature branch if needed)

---

## 🎯 Implementation Order (MANDATORY)

**DO NOT deviate from this order without good reason:**

### Phase 1: Foundation (US-001)

Create the core utility library that all other stories depend on.

**Time**: 2-3 hours
**Blocking**: Yes - All other stories depend on this

```bash
/implement-userstory US-001
```

**Verification Checklist:**

- [ ] `src/lib/date-utils.ts` created
- [ ] `src/lib/__tests__/date-utils.test.ts` created
- [ ] All tests pass (`npm test src/lib/__tests__/date-utils.test.ts`)
- [ ] 100% code coverage
- [ ] Functions exported correctly

**DO NOT PROCEED** until US-001 is complete and tests pass.

---

### Phase 2: Critical Bug Fixes (US-002, US-003)

Fix the most critical bugs affecting users.

**Time**: 3-4 hours
**Blocking**: Yes - Must verify fixes before continuing

#### Step 1: Settings API (US-002)

```bash
/implement-userstory US-002
```

**Focus Areas:**

- `src/features/settings/lib/settings-api.ts`
- `fetchActiveSettings()` function
- `fetchScheduledSettings()` function
- Related tests

**Verification:**

- [ ] Scheduled changes display correctly
- [ ] Tests pass with different timezone mocks
- [ ] No more "disappearing scheduled changes" bug

#### Step 2: Member & Subscription Utils (US-003)

```bash
/implement-userstory US-003
```

**Focus Areas:**

- `src/features/members/lib/database-utils.ts`
- `src/features/memberships/lib/subscription-utils.ts`
- All `.toISOString()` calls for date columns
- Database insert/update operations

**Verification:**

- [ ] Member join_date uses correct format
- [ ] Subscription start_date/end_date use correct format
- [ ] No ISO timestamps stored in date columns
- [ ] Tests verify date format

---

### Phase 3: Quality Gate (US-006 Partial)

Run tests to verify critical fixes before proceeding.

```bash
# Run all tests
npm test

# Run specific test suites
npm test src/features/settings
npm test src/features/members
npm test src/features/memberships
```

**Quality Gate Criteria:**

- [ ] All tests pass
- [ ] No console errors related to dates
- [ ] Manual verification: Create scheduled change, check it displays
- [ ] Manual verification: Create member, check join_date correct

**If ANY test fails, STOP and fix before continuing.**

---

### Phase 4: User-Facing Fixes (US-004)

Fix frontend components that users interact with.

**Time**: 1-2 hours

```bash
/implement-userstory US-004
```

**Focus Areas:**

- `src/features/settings/components/OpeningHoursTab.tsx` (partially fixed)
- `src/features/settings/components/EffectiveDatePicker.tsx`
- Any component with `.setHours(0,0,0,0)` pattern
- Date picker components

**Verification:**

- [ ] Date comparisons work in all timezones
- [ ] UI displays correct dates
- [ ] No visual bugs or flickering
- [ ] Date pickers allow correct date selection

---

### Phase 5: Integration (US-005)

Fix cross-feature integrations.

**Time**: 2 hours

```bash
/implement-userstory US-005
```

**Focus Areas:**

- `src/features/training-sessions/hooks/use-conflict-detection.ts`
- `src/features/training-sessions/hooks/use-session-alerts.ts`
- `src/features/memberships/lib/notification-utils.ts`
- Integration between features

**Verification:**

- [ ] Training session conflicts detected correctly
- [ ] Session alerts trigger at correct times
- [ ] Notifications sent with correct dates
- [ ] Cross-feature date handling consistent

---

### Phase 6: Final Testing (US-006 Complete)

Comprehensive testing across all scenarios.

**Time**: 1-2 hours

```bash
/implement-userstory US-006
```

**Testing Checklist:**

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing in different timezones (GMT, GMT+12, GMT-12)
- [ ] Regression test: Scheduled changes display correctly
- [ ] Performance: No degradation from date-utils
- [ ] Browser console: No date-related warnings

**Manual Test Scenarios:**

1. **Create Scheduled Change**:
   - Set effective date to tomorrow
   - Verify it shows in "Scheduled Changes"
   - Change system time/timezone, refresh
   - Verify still shows correctly

2. **Create Member**:
   - Create member with today's join date
   - Verify join date stored as YYYY-MM-DD
   - Verify displays correctly in UI

3. **Create Subscription**:
   - Create subscription starting today
   - Verify start/end dates stored correctly
   - Verify date calculations work

---

### Phase 7: Documentation (US-007)

Update developer documentation.

**Time**: 1 hour

```bash
/implement-userstory US-007
```

**Documentation Tasks:**

- [ ] Update CLAUDE.md with date handling section
- [ ] Create migration guide for developers
- [ ] Add JSDoc comments to all date-utils functions
- [ ] Create README in date-utils explaining usage
- [ ] Update troubleshooting guides if needed

---

## 🔧 Implementation Guidelines

### When Implementing Each User Story

1. **Read the user story completely**
   - Understand acceptance criteria
   - Review technical scope
   - Check dependencies

2. **Create todo list**
   - Break story into tasks
   - Use TodoWrite tool to track progress

3. **Implement systematically**
   - One acceptance criterion at a time
   - Write tests as you go
   - Run tests frequently

4. **Verify before marking complete**
   - All acceptance criteria met
   - All tests pass
   - No regressions introduced
   - Code reviewed

5. **Update STATUS.md**
   - Mark story as complete
   - Note any blockers or issues
   - Update progress percentage

### Code Review Checklist

Before marking any story complete:

- [ ] All imports use `@/lib/date-utils`
- [ ] No `new Date().toISOString().split("T")[0]` for user-facing dates
- [ ] No `.setHours(0,0,0,0)` + `.getTime()` comparisons
- [ ] Database operations use correct format function
- [ ] Tests added/updated
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code follows existing patterns

### Testing Standards

**Unit Tests:**

- Test each date-utils function independently
- Include edge cases (timezones, DST, leap years)
- Mock Date for consistent test results

**Integration Tests:**

- Test cross-feature date handling
- Verify database queries return correct results
- Test with different timezone mocks

**Manual Testing:**

- Test in at least 3 different timezones
- Verify UI displays correct dates
- Check database for correct date formats

---

## 🚨 Common Pitfalls to Avoid

### ❌ DON'T: Skip US-001

```bash
# Wrong order
/implement-userstory US-002  # ❌ Will fail - date-utils doesn't exist
```

### ❌ DON'T: Mix old and new patterns

```typescript
// ❌ Bad - mixing patterns
const today = getLocalDateString(); // New pattern
const tomorrow = new Date().toISOString().split("T")[0]; // Old pattern
```

### ❌ DON'T: Use wrong format for column type

```typescript
// ❌ Bad - using timestamp format for date column
start_date: new Date().toISOString(); // Wrong!

// ✅ Good - using date format for date column
start_date: formatForDatabase(new Date());
```

### ❌ DON'T: Forget to update tests

```typescript
// ❌ Bad - tests still use old pattern
const today = new Date().toISOString().split("T")[0];
```

---

## 📊 Progress Tracking

Update STATUS.md after each story:

```markdown
## Progress

- [x] US-001: Core Date Utility Library (Complete - 2024-10-18)
- [x] US-002: Settings API Date Handling (Complete - 2024-10-18)
- [ ] US-003: Member & Subscription Utils Migration (In Progress)
- [ ] US-004: Frontend Components Date Handling (Not Started)
- [ ] US-005: Training Sessions & Conflict Detection (Not Started)
- [ ] US-006: Testing & Validation (Not Started)
- [ ] US-007: Documentation & Standards (Not Started)

**Progress**: 28% (2/7 stories complete)
```

---

## 🎯 Definition of Done

The feature is complete when:

### Code Complete

- [ ] All 7 user stories implemented
- [ ] All files in scope migrated to use date-utils
- [ ] Zero old patterns remaining (`toISOString().split("T")[0]` for user dates)
- [ ] All tests passing

### Quality Assurance

- [ ] 100% test coverage for date-utils
- [ ] Integration tests passing
- [ ] Manual testing complete in 3+ timezones
- [ ] No regressions identified

### Documentation

- [ ] CLAUDE.md updated
- [ ] Migration guide created
- [ ] All functions have JSDoc comments
- [ ] STATUS.md shows 100% complete

### Verification

- [ ] Scheduled changes display correctly
- [ ] Member join dates correct
- [ ] Subscription dates correct
- [ ] No date-related bugs in production
- [ ] Developer feedback positive

---

## 🆘 Troubleshooting

### Problem: Tests failing after US-001

**Solution**: Verify date-utils exports are correct:

```typescript
// src/lib/date-utils.ts
export function getLocalDateString(date: Date = new Date()): string {
  // ...
}
```

### Problem: Dates still off by 1 day

**Solution**: Check you're using `getLocalDateString()` not `.toISOString().split("T")[0]`

### Problem: Database storing wrong format

**Solution**: Verify column type and use correct format function:

- `date` column → `formatForDatabase()`
- `timestamptz` column → `formatTimestampForDatabase()`

### Problem: Scheduled changes still disappearing

**Solution**: Verify you're using `compareDates()` for string comparisons, not Date object `.getTime()`

---

## 📞 Getting Help

If you encounter issues:

1. Review the user story acceptance criteria
2. Check CLAUDE.md for existing patterns
3. Review README.md for architecture decisions
4. Check test files for usage examples
5. Review comprehensive analysis report in START-HERE.md

---

**Ready to implement?** Start with:

```bash
/implement-userstory US-001
```
