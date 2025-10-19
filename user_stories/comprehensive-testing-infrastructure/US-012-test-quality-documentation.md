# US-012: Test Quality Improvements and Documentation

**Phase**: Phase 4 - Polish (Week 8)
**Priority**: P2 (Nice to Have)
**Estimated Effort**: 10 hours
**Dependencies**: US-001 through US-011 (All previous stories)

---

## User Story

**As a** developer
**I want** high-quality, maintainable tests and comprehensive testing documentation
**So that** the team can write and maintain tests effectively

---

## Business Value

Test quality and documentation ensure:

- Tests are readable and maintainable
- New team members can write tests quickly
- Flaky tests are eliminated
- Testing best practices are followed consistently

**Impact**: Reduces test maintenance cost and improves developer productivity

---

## Detailed Acceptance Criteria

### AC1: Refactor Flaky Tests

- [ ] Identify flaky tests (run 100 times, check success rate)
- [ ] Replace arbitrary timeouts with proper wait strategies
- [ ] Use Playwright auto-waiting instead of `setTimeout`
- [ ] Fix race conditions in test setup/teardown
- [ ] Ensure proper test isolation (no shared state)
- [ ] Document previously flaky tests and fixes applied
- [ ] Target: <1% flaky test rate

### AC2: Improve Test Readability

- [ ] Use descriptive test names (behavior, not implementation)
- [ ] Follow Arrange-Act-Assert pattern consistently
- [ ] Extract setup logic to helper functions
- [ ] Add comments for complex test scenarios
- [ ] Remove duplicate test code
- [ ] Use test.describe blocks for logical grouping
- [ ] Ensure consistent naming conventions

### AC3: Create TESTING.md Guide

- [ ] Document how to run tests (unit, integration, e2e)
- [ ] Explain test file organization
- [ ] Provide examples of good vs bad tests
- [ ] Document mocking strategies
- [ ] Explain when to use unit vs integration vs e2e tests
- [ ] Include troubleshooting section
- [ ] Add links to resources (Playwright, Vitest, Testing Library)

### AC4: Create e2e/README.md Playbook

- [ ] Document running e2e tests locally
- [ ] Explain test database setup
- [ ] Show how to debug failing tests (trace viewer, screenshots)
- [ ] Document CI/CD integration
- [ ] Provide examples of common test patterns
- [ ] List common errors and solutions
- [ ] Include playwright.config.ts explanation

### AC5: Create Test Factory Guide

- [ ] Document all available factories (Member, Subscription, Payment, etc.)
- [ ] Provide usage examples for each factory
- [ ] Explain factory customization (overrides parameter)
- [ ] Show how to create new factories
- [ ] Document factory best practices
- [ ] Include TypeScript types for factory outputs

### AC6: Performance Optimization

- [ ] Identify slow tests (>5 seconds)
- [ ] Optimize database seed operations
- [ ] Use parallel test execution where possible
- [ ] Reduce unnecessary data creation in tests
- [ ] Target: Unit tests <30s, E2E tests <10min, total CI <15min

### AC7: Coverage Reports

- [ ] Configure coverage thresholds (80% lines, 80% functions)
- [ ] Generate HTML coverage reports
- [ ] Add coverage badge to README
- [ ] Document how to view coverage locally
- [ ] Set up CI to fail on coverage regressions

---

## Technical Implementation

### Files to Create

#### 1. `docs/TESTING.md`

````markdown
# Testing Guide

## Overview

This application uses a three-tier testing strategy:

- **Unit Tests** (Vitest): Fast, isolated tests for functions and components
- **Integration Tests** (Vitest): Tests spanning multiple units with real dependencies
- **E2E Tests** (Playwright): Full user journey tests with real browser

## Running Tests

### Unit & Integration Tests

```bash
# Run all unit/integration tests
npm test

# Watch mode for development
npm run test:watch

# With coverage
npm run test:coverage

# Run specific test file
npm test src/features/members/__tests__/use-members.test.ts
```
````

### E2E Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npm run test:e2e e2e/auth/login.spec.ts

# Debug mode
npm run test:e2e:debug
```

## Test Organization

```
src/
├── features/
│   └── members/
│       ├── components/
│       │   ├── MemberForm.tsx
│       │   └── __tests__/
│       │       └── MemberForm.test.tsx
│       ├── hooks/
│       │   ├── use-members.ts
│       │   └── __tests__/
│       │       └── use-members.test.ts
│       └── lib/
│           ├── utils.ts
│           └── __tests__/
│               └── utils.test.ts
e2e/
├── auth/
│   ├── login.spec.ts
│   └── logout.spec.ts
├── members/
│   └── create-member.spec.ts
└── support/
    ├── database.ts
    └── auth-helpers.ts
```

## Writing Good Tests

### ✅ Good Test Example

```typescript
describe("useMemberAnalytics", () => {
  it("should calculate total active members correctly", async () => {
    // Arrange: Set up test data
    await seedMembers([
      { status: "active" },
      { status: "active" },
      { status: "inactive" },
    ]);

    // Act: Execute the function
    const { result } = renderHook(() => useMemberAnalytics());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert: Verify outcome
    expect(result.current.data.activeMembers).toBe(2);
  });
});
```

### ❌ Bad Test Example

```typescript
it("test 1", async () => {
  const result = doSomething();
  expect(result.data.value).toBe(123);
  expect(result.error).toBeFalsy();
  // Too vague, tests multiple things, unclear purpose
});
```

## When to Use Which Test Type

| Scenario                                           | Test Type   | Why                           |
| -------------------------------------------------- | ----------- | ----------------------------- |
| Pure function (date formatting, calculations)      | Unit        | Fast, simple, no dependencies |
| React component rendering                          | Unit        | Isolated from backend         |
| Database query building                            | Unit        | Mock database, test logic     |
| Form submission to API                             | Integration | Test real API call            |
| Multi-step workflow (create member → subscription) | Integration | Test component interaction    |
| Login → Dashboard → Logout                         | E2E         | Test full user journey        |

## Mocking Strategies

### Unit Tests: Mock External Dependencies

```typescript
vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabaseClient,
}));
```

### Integration Tests: Use Test Database

```typescript
import { testSupabase } from "@/test/test-supabase";
// Real database calls to test DB
```

### E2E Tests: No Mocks

```typescript
// Test real application with real backend
```

## Troubleshooting

### Flaky Tests

- **Problem**: Test passes sometimes, fails others
- **Solution**: Remove arbitrary timeouts, use `waitFor`, ensure test isolation

### Slow Tests

- **Problem**: Tests take >5 seconds
- **Solution**: Reduce seeded data, use factories, parallelize where possible

### Test Hangs

- **Problem**: Test never completes
- **Solution**: Check for missing `await`, infinite loops, unresolved promises

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

````

#### 2. `e2e/README.md`
```markdown
# E2E Testing Playbook

## Setup

1. **Install Playwright**
   ```bash
   npm install
   npx playwright install
````

2. **Configure Test Database**

   ```bash
   cp .env.test.local.example .env.test.local
   # Edit .env.test.local with test database credentials
   ```

3. **Run Tests**
   ```bash
   npm run test:e2e
   ```

## Debugging Failed Tests

### View Trace

```bash
npx playwright show-trace trace.zip
```

### View Screenshots

Failed tests automatically capture screenshots:

```
playwright-report/screenshots/
```

### Debug Mode

```bash
npm run test:e2e:debug
```

This opens Playwright Inspector with step-by-step execution.

## Common Patterns

### Login Before Test

```typescript
import { loginAsAdmin } from "../support/auth-helpers";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});
```

### Create Test Data

```typescript
import { createMemberWithSubscription } from "../support/payment-helpers";

const { memberId } = await createMemberWithSubscription({
  totalAmount: 100,
  paidAmount: 50,
});
```

## Common Errors

### Error: "Timeout 30000ms exceeded"

**Cause**: Element not found or page didn't load
**Solution**: Check selector, increase timeout, verify page loaded

### Error: "Element is not visible"

**Cause**: Element hidden by CSS or not yet rendered
**Solution**: Wait for element with `waitForSelector`, check CSS

### Error: "Database error: duplicate key"

**Cause**: Test data not cleaned up
**Solution**: Ensure `resetDatabase()` in `beforeEach`

## Test Database

Tests use isolated Supabase project.

**Reset between tests:**

```typescript
beforeEach(async () => {
  await resetDatabase();
  await seedTestData();
});
```

**Never use production database for tests!**

````

#### 3. `src/test/factories/README.md`
```markdown
# Test Data Factories

Factories generate realistic test data using [@faker-js/faker](https://fakerjs.dev/).

## Available Factories

### MemberFactory
```typescript
import { MemberFactory } from '@/test/factories/member-factory';

// Generate random member
const member = MemberFactory.build();

// Override specific fields
const activeMember = MemberFactory.build({ status: 'active' });

// Pre-configured variations
const active = MemberFactory.buildActive();
const inactive = MemberFactory.buildInactive();
const expired = MemberFactory.buildExpired();
````

### SubscriptionFactory

```typescript
import { SubscriptionFactory } from "@/test/factories/subscription-factory";

const subscription = SubscriptionFactory.build({
  total_amount_snapshot: 100,
  paid_amount: 50,
});
```

### PaymentFactory

```typescript
import { PaymentFactory } from "@/test/factories/payment-factory";

const payment = PaymentFactory.build({ amount: 50.0 });
```

## Creating New Factories

1. Create file: `src/test/factories/{entity}-factory.ts`
2. Import types and faker
3. Implement `build()` method
4. Export factory object

```typescript
import { faker } from "@faker-js/faker";
import type { Trainer } from "@/features/database/lib/types";

export const TrainerFactory = {
  build: (overrides: Partial<Trainer> = {}) => ({
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    specializations: ["strength_training"],
    is_active: true,
    ...overrides,
  }),
};
```

## Best Practices

- ✅ Use factories instead of hardcoded test data
- ✅ Override only fields relevant to test
- ✅ Create factory variations for common scenarios
- ❌ Don't create factories with complex business logic
- ❌ Don't include database IDs (auto-generated)

````

---

## Testing Requirements

1. **Run Flaky Test Detection**
   ```bash
   # Run each test 100 times
   for i in {1..100}; do npm test; done | grep -c "PASS"
````

2. **Measure Test Performance**

   ```bash
   npm test -- --reporter=verbose
   # Check for tests >5 seconds
   ```

3. **Verify Documentation**
   - Have teammate follow TESTING.md from scratch
   - Verify all commands work
   - Check for unclear instructions

---

## Definition of Done

- [ ] All 7 acceptance criteria met
- [ ] Flaky tests fixed (<1% failure rate over 100 runs)
- [ ] Test readability improved (peer review confirms)
- [ ] TESTING.md guide created and reviewed
- [ ] e2e/README.md playbook created
- [ ] Test factory guide created
- [ ] Performance optimized (CI <15min)
- [ ] Coverage thresholds configured and passing
- [ ] Coverage reports generated in CI
- [ ] All documentation reviewed by team
- [ ] Code reviewed and approved

---

## Dependencies

**Requires**: All previous user stories (US-001 through US-011)

---

This completes the 8-week comprehensive testing plan!
