# AGENT GUIDE: Systematic Implementation Workflow

This guide provides a systematic workflow for implementing the comprehensive testing infrastructure feature using the `/implement-userstory` command.

---

## 🎯 Purpose

This guide is designed for:

- **Claude Code agents** implementing user stories systematically
- **Developers** following a structured implementation process
- **Project managers** tracking progress through phases

---

## 📋 Implementation Rules

### MANDATORY Pre-Work Check (Before EVERY User Story)

**⚠️ CRITICAL: Check git branch status BEFORE any implementation work!**

```bash
# 1. Check current branch
git branch --show-current

# 2. Verify you're on a feature branch
# ✅ ALLOWED: feature/* or bugfix/*
# ❌ FORBIDDEN: dev or main

# 3. If NOT on feature branch, create one:
git checkout dev
git pull origin dev
git checkout -b feature/testing-infrastructure-US-XXX
```

**DO NOT SKIP THIS CHECK!** Database migrations and code changes MUST happen on feature branches.

---

## 🗺️ User Story Dependencies

### Phase 1: Infrastructure + Critical E2E Tests (Weeks 1-2)

```
US-001 (Foundation)
  ├──> US-002 (Auth E2E)
  ├──> US-003 (Members E2E)
  ├──> US-004 (Payments E2E)
  ├──> US-005 (Subscriptions E2E)
  └──> US-006 (Sessions E2E)
```

**Critical Path**: US-001 MUST be completed before any other story.
**Parallelization**: US-002 through US-006 can be done in parallel after US-001.

### Phase 2: Unit Test Coverage (Weeks 3-4)

```
US-007 (Trainers Unit Tests)
US-008 (Dashboard/Plans Unit Tests)
```

**Parallelization**: These can be done in parallel.

### Phase 3: Integration Tests (Weeks 5-6)

```
US-009 (Database Integration Tests)
US-010 (Workflow Integration Tests)
```

**Parallelization**: These can be done in parallel.

### Phase 4: Polish (Weeks 7-8)

```
US-011 (Edge Cases)
  └──> US-012 (Documentation & Quality)
```

**Sequential**: US-012 should follow US-011 for best results.

---

## 🚀 Implementation Workflow

### Step 1: Select User Story

**Start with US-001** (foundation). After that, follow dependency order above.

```bash
# View user story
open user_stories/comprehensive-testing-infrastructure/US-001-playwright-infrastructure.md

# Or use the implement command
/implement-userstory US-001
```

### Step 2: Read User Story Thoroughly

**Before coding, read and understand:**

- [ ] User story description (As a... I want... So that...)
- [ ] Business value (why this matters)
- [ ] All acceptance criteria (AC1, AC2, AC3, etc.)
- [ ] Technical implementation section (files to create/modify)
- [ ] Definition of done checklist

### Step 3: Create Feature Branch (if not already on one)

```bash
# Check current branch
git branch --show-current

# If on dev/main, create feature branch
git checkout -b feature/testing-US-001-playwright-infrastructure
```

### Step 4: Implement Acceptance Criteria

Work through acceptance criteria **in order**:

#### For US-001 (Example Process):

1. **AC1: Playwright Installation and Configuration**

   ```bash
   npm install -D @playwright/test
   npx playwright install
   # Create playwright.config.ts (see user story for template)
   ```

2. **AC2: Test Database Setup**
   - Create Supabase test project
   - Configure environment variables
   - Test connection

3. **AC3: Database Reset Utilities**
   - Create e2e/support/database.ts
   - Implement resetDatabase()
   - Implement seedTestData()

4. **AC4-AC8**: Continue with remaining acceptance criteria

#### Verification After Each AC:

```bash
# Test that what you implemented works
npm run test:e2e # (for e2e stories)
npm test         # (for unit test stories)
```

### Step 5: Run All Tests

**Before marking story complete:**

```bash
# Run unit tests
npm test

# Run e2e tests (once playwright configured)
npm run test:e2e

# Run linting
npm run lint

# Build project
npm run build
```

**All must pass** before proceeding.

### Step 6: Verify Definition of Done

Open the user story and check **Definition of Done** section. Example from US-001:

- [ ] All 8 acceptance criteria met
- [ ] Playwright installed and configured
- [ ] Test database created and migrations applied
- [ ] Database reset/seed utilities working
- [ ] Test data factories created
- [ ] Smoke test passing locally
- [ ] CI workflow created and verified
- [ ] Documentation complete
- [ ] Code reviewed and approved

**Check each item** before marking story complete.

### Step 7: Commit Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat(testing): Implement US-001 Playwright infrastructure

- Install and configure Playwright with Next.js 15.5
- Create test Supabase project and database setup
- Implement database reset/seed utilities
- Create test data factories (Member, Subscription, Payment)
- Add CI/CD workflow for e2e tests
- Create smoke test to verify setup

Closes US-001

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push -u origin feature/testing-US-001-playwright-infrastructure
```

### Step 8: Update STATUS.md

```bash
# Open STATUS.md
open user_stories/comprehensive-testing-infrastructure/STATUS.md

# Mark US-001 as completed
# Update milestone progress
# Note any blockers or issues
```

### Step 9: Move to Next Story

**Check dependency graph** above and select next story:

- If US-001 complete → Choose any of US-002 through US-006
- If Phase 1 complete → Choose US-007 or US-008
- And so on...

---

## 📊 Progress Tracking

### Daily Checklist

At the start of each work session:

1. [ ] Check git branch status
2. [ ] Pull latest changes: `git checkout dev && git pull origin dev`
3. [ ] Review STATUS.md for current progress
4. [ ] Select next user story based on dependencies
5. [ ] Create new feature branch for that story

At the end of each work session:

1. [ ] Commit all changes
2. [ ] Push to remote
3. [ ] Update STATUS.md
4. [ ] Run full test suite to verify nothing broken

### Weekly Milestones

**Week 1**:

- [ ] US-001 complete (Playwright infrastructure)
- [ ] US-002 complete (Auth e2e tests)
- [ ] US-003 complete (Members e2e tests)

**Week 2**:

- [ ] US-004 complete (Payments e2e tests)
- [ ] US-005 complete (Subscriptions e2e tests)
- [ ] US-006 complete (Sessions e2e tests)
- [ ] **Milestone 1**: All critical e2e tests complete

**Week 3**:

- [ ] US-007 complete (Trainers unit tests)

**Week 4**:

- [ ] US-008 complete (Dashboard/Plans unit tests)
- [ ] **Milestone 2**: Unit test coverage >85%

**Week 5**:

- [ ] US-009 complete (Database integration tests)

**Week 6**:

- [ ] US-010 complete (Workflow integration tests)
- [ ] **Milestone 3**: Integration tests complete

**Week 7**:

- [ ] US-011 complete (Edge cases)

**Week 8**:

- [ ] US-012 complete (Documentation)
- [ ] **Milestone 4**: Feature COMPLETE

---

## 🔥 Handling Blockers

### Common Blockers and Solutions

#### Blocker: Test Database Setup Fails

**User Story**: US-001
**Solution**:

1. Verify Supabase test project created
2. Check environment variables in `.env.test.local`
3. Verify service role key has admin permissions
4. Test connection with simple query

#### Blocker: Playwright Tests Flaky

**User Stories**: US-002 through US-006
**Solution**:

1. Remove arbitrary `setTimeout` calls
2. Use Playwright's auto-waiting
3. Use semantic selectors (`getByRole`, `getByLabel`)
4. Ensure database reset in `beforeEach`
5. Add proper wait conditions

#### Blocker: Unit Test Coverage Not Improving

**User Stories**: US-007, US-008
**Solution**:

1. Run coverage report: `npm run test:coverage`
2. Identify untested files in coverage report
3. Prioritize business logic (hooks, utils) over UI components
4. Mock external dependencies (Supabase, API calls)

#### Blocker: CI Pipeline Timeout

**All User Stories**
**Solution**:

1. Parallelize tests where possible
2. Reduce seeded test data
3. Use faster test database
4. Split unit and e2e tests into separate jobs

### Escalation Process

If blocked for >2 hours:

1. **Document the blocker** in STATUS.md
2. **Try alternative approaches** (see user story Implementation Notes)
3. **Ask for help** (user, team lead, or skip and return later)
4. **Move to different user story** if possible (check dependencies)

---

## ✅ Quality Checklist (Before Marking Story Complete)

### Code Quality

- [ ] All acceptance criteria met
- [ ] All tests passing (unit, integration, e2e)
- [ ] No console errors or warnings
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors

### Test Quality

- [ ] Tests are readable (descriptive names, AAA pattern)
- [ ] Tests are isolated (no shared state between tests)
- [ ] Tests are reliable (no flaky tests - run 10 times successfully)
- [ ] Tests are fast (<5 seconds for unit, <30 seconds for e2e)
- [ ] Test coverage improved (check with `npm run test:coverage`)

### Documentation Quality

- [ ] Code comments added for complex logic
- [ ] README/documentation updated if needed
- [ ] User story Definition of Done checked
- [ ] STATUS.md updated with completion

### Git Quality

- [ ] Commits are descriptive
- [ ] Feature branch used (not dev/main)
- [ ] Changes pushed to remote
- [ ] No merge conflicts with dev

---

## 🎓 Testing Best Practices

### E2E Tests (Playwright)

**✅ DO:**

- Use semantic selectors: `getByRole`, `getByLabel`, `getByText`
- Wait for navigation: `await page.waitForURL(/\/members/)`
- Reset database before each test
- Use auth helpers: `loginAsAdmin(page)`
- Test real user workflows (no shortcuts)

**❌ DON'T:**

- Use CSS selectors (`.css-abc123`)
- Use arbitrary timeouts (`setTimeout(5000)`)
- Share state between tests
- Mock Supabase in e2e tests
- Skip database cleanup

### Unit Tests (Vitest)

**✅ DO:**

- Mock external dependencies (Supabase, API)
- Test one thing per test
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Test edge cases (null, undefined, empty arrays)

**❌ DON'T:**

- Test implementation details (internal state)
- Make real API calls
- Test multiple scenarios in one test
- Skip error scenarios
- Hardcode IDs or dates

### Integration Tests

**✅ DO:**

- Use test database (not mocks)
- Test real queries and transactions
- Verify side effects (cache updates, database changes)
- Clean up after tests

**❌ DON'T:**

- Use production database
- Skip transaction rollback tests
- Assume query results order
- Ignore error handling

---

## 🚦 When to Move Forward

### Story is READY for next phase if:

- ✅ All acceptance criteria met
- ✅ Definition of done checklist complete
- ✅ All tests passing (100% success rate)
- ✅ Code committed and pushed
- ✅ STATUS.md updated

### Story is NOT READY if:

- ❌ Any acceptance criteria incomplete
- ❌ Tests failing or flaky
- ❌ Linting errors present
- ❌ Build failing
- ❌ Documentation incomplete

**Don't rush!** It's better to fully complete one story than partially complete multiple stories.

---

## 📚 Additional Resources

- **CLAUDE.md**: Project standards and conventions
- **docs/TROUBLESHOOTING.md**: Common errors and solutions
- **Playwright Docs**: https://playwright.dev/
- **Vitest Docs**: https://vitest.dev/
- **Testing Library**: https://testing-library.com/

---

## 🎯 Success Metrics

Track these metrics as you progress:

| Metric             | Start   | Target              | Check With              |
| ------------------ | ------- | ------------------- | ----------------------- |
| Overall Coverage   | 38.6%   | 80%+                | `npm run test:coverage` |
| E2E Coverage       | 0%      | 100% critical paths | Count e2e test files    |
| Trainers Coverage  | 0%      | 85%+                | Coverage report         |
| Dashboard Coverage | <30%    | 85%+                | Coverage report         |
| Plans Coverage     | <30%    | 85%+                | Coverage report         |
| CI Pipeline Time   | N/A     | <15 min             | GitHub Actions          |
| Flaky Test Rate    | Unknown | <1%                 | Run tests 100 times     |

---

**Ready to start? Begin with US-001 and follow this systematic workflow for each user story!**

Good luck! 🚀
