# US-001: Playwright and Test Database Infrastructure

**Phase**: Phase 1 - Infrastructure + Critical E2E Tests (Week 1)
**Priority**: P0 (Must Have)
**Estimated Effort**: 16 hours
**Dependencies**: None (Foundation story)

---

## User Story

**As a** developer
**I want** Playwright e2e testing framework and isolated test database configured
**So that** we can write reliable end-to-end tests without affecting production data

---

## Business Value

This story establishes the foundation for all e2e testing. Without this infrastructure:

- Cannot write or run any e2e tests
- Risk of test data contaminating production database
- No automated validation of critical user journeys
- High risk of production bugs in payment/subscription flows

**Impact**: Enables $0 → 100% e2e coverage for critical business workflows

---

## Detailed Acceptance Criteria

### AC1: Playwright Installation and Configuration

- [ ] Playwright installed (`@playwright/test` in devDependencies)
- [ ] Playwright browsers installed (Chromium, Firefox, WebKit)
- [ ] `playwright.config.ts` created with Next.js 15.5 configuration
- [ ] Config includes: baseURL, trace viewer, screenshots on failure
- [ ] Parallel execution configured (4 workers locally, 1 in CI)
- [ ] Test timeout set to 30 seconds
- [ ] `e2e/` directory created for test files

### AC2: Test Database Setup

- [ ] Separate Supabase project created for testing (not production)
- [ ] All database migrations applied to test database
- [ ] `.env.test.local` file created with test database credentials
- [ ] Environment variables documented in `.env.test.local.example`
- [ ] Service role key configured for admin operations
- [ ] Database connection verified with simple query

### AC3: Database Reset Utilities

- [ ] `e2e/support/database.ts` created with reset functions
- [ ] `resetDatabase()` function truncates all tables in correct order
- [ ] `seedTestData()` function creates baseline fixtures (admin user, test member)
- [ ] Reset script respects foreign key constraints
- [ ] Reset completes in <2 seconds
- [ ] Seed data includes: 1 admin user, 1 test member, 1 plan

### AC4: Test Data Factories

- [ ] `src/test/factories/` directory created
- [ ] `@faker-js/faker` installed for realistic test data
- [ ] `MemberFactory.ts` created with build methods
- [ ] `SubscriptionFactory.ts` created
- [ ] `PaymentFactory.ts` created
- [ ] Factory pattern documented with examples
- [ ] Factories generate valid data matching database constraints

### AC5: CI/CD Integration

- [ ] `.github/workflows/e2e-tests.yml` created
- [ ] Workflow runs on PR to `dev` and `main` branches
- [ ] Test database configured in CI environment
- [ ] Playwright browsers cached for faster CI runs
- [ ] Test failures block PR merging
- [ ] Playwright reports uploaded as artifacts
- [ ] CI pipeline runs in <10 minutes

### AC6: First Smoke Test

- [ ] `e2e/smoke.spec.ts` created to verify setup
- [ ] Test navigates to homepage successfully
- [ ] Test can reset database without errors
- [ ] Test can seed database without errors
- [ ] Test passes locally and in CI
- [ ] Test runs in all configured browsers (Chromium, Firefox, WebKit)

### AC7: Package Scripts

- [ ] `npm run test:e2e` - Run all e2e tests
- [ ] `npm run test:e2e:ui` - Open Playwright UI
- [ ] `npm run test:e2e:debug` - Debug mode with --debug flag
- [ ] `npm run test:e2e:report` - Show test report
- [ ] Scripts documented in package.json and README

### AC8: Documentation

- [ ] `e2e/README.md` created with setup instructions
- [ ] Running tests locally documented
- [ ] Debugging failed tests documented
- [ ] Test database setup process documented
- [ ] Environment variables explained
- [ ] Common errors and solutions listed

---

## Technical Implementation

### Files to Create

#### 1. `playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: [
    ["html"],
    ["json", { outputFile: "playwright-report/results.json" }],
    ["list"],
  ],

  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

#### 2. `e2e/support/database.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.TEST_SUPABASE_URL!;
const supabaseKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!;

export const testSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Reset database by truncating all tables in correct order
 * Respects foreign key constraints
 */
export async function resetDatabase() {
  const tables = [
    "training_session_members",
    "training_sessions",
    "subscription_payments",
    "member_subscriptions",
    "member_comments",
    "members",
    "trainers",
    "subscription_plans",
    "equipment",
    "opening_hours",
    "planning_parameters",
  ];

  for (const table of tables) {
    await testSupabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
  }
}

/**
 * Seed database with baseline test data
 */
export async function seedTestData() {
  // Create admin user
  const { data: admin } = await testSupabase
    .from("user_profiles")
    .insert({
      email: "admin@test.gym",
      role: "admin",
      is_active: true,
    })
    .select()
    .single();

  // Create test plan
  const { data: plan } = await testSupabase
    .from("subscription_plans")
    .insert({
      name: "Test Monthly Plan",
      price: 50.0,
      sessions_count: 12,
      duration_days: 30,
      is_active: true,
    })
    .select()
    .single();

  // Create test member
  const { data: member } = await testSupabase
    .from("members")
    .insert({
      first_name: "Test",
      last_name: "Member",
      email: "test.member@example.com",
      phone: "+1234567890",
      status: "active",
      join_date: "2025-01-01",
      member_type: "full",
      uniform_size: "M",
      vest_size: "V2",
      hip_belt_size: "V2",
      referral_source: "website_ib",
      waiver_signed: true,
      marketing_consent: true,
    })
    .select()
    .single();

  return { admin, plan, member };
}
```

#### 3. `src/test/factories/member-factory.ts`

```typescript
import { faker } from "@faker-js/faker";
import type { Member } from "@/features/database/lib/types";

export const MemberFactory = {
  build: (
    overrides: Partial<Member> = {}
  ): Omit<Member, "id" | "created_at" | "updated_at"> => ({
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number("+1##########"),
    status: "active",
    join_date: faker.date.past({ years: 1 }).toISOString().split("T")[0],
    member_type: "full",
    uniform_size: faker.helpers.arrayElement(["S", "M", "L", "XL"]),
    vest_size: faker.helpers.arrayElement(["V1", "V2", "V3", "V4"]),
    hip_belt_size: faker.helpers.arrayElement(["V1", "V2", "V3", "V4"]),
    referral_source: "website_ib",
    uniform_received: faker.datatype.boolean(),
    marketing_consent: true,
    waiver_signed: true,
    preferred_contact_method: "email",
    birth_date: null,
    notes: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    ...overrides,
  }),

  buildActive: () => MemberFactory.build({ status: "active" }),
  buildInactive: () => MemberFactory.build({ status: "inactive" }),
  buildExpired: () => MemberFactory.build({ status: "expired" }),
};
```

#### 4. `e2e/smoke.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, seedTestData } from "./support/database";

test.describe("Smoke Tests - Infrastructure Verification", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await seedTestData();
  });

  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Gym Manager/);
  });

  test("should reset database without errors", async () => {
    await expect(resetDatabase()).resolves.not.toThrow();
  });

  test("should seed database without errors", async () => {
    const data = await seedTestData();
    expect(data.admin).toBeDefined();
    expect(data.plan).toBeDefined();
    expect(data.member).toBeDefined();
  });
});
```

#### 5. `.env.test.local.example`

```bash
# Test Database Configuration
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=your-test-anon-key
TEST_SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key

# Test Application URL
TEST_BASE_URL=http://localhost:3000

# Note: Create .env.test.local with actual values (git ignored)
```

#### 6. `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main]

jobs:
  e2e:
    name: End-to-End Tests
    timeout-minutes: 15
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          TEST_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          TEST_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
          TEST_BASE_URL: http://localhost:3000

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Files to Modify

#### `package.json` (add scripts)

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@faker-js/faker": "^9.2.0"
  }
}
```

---

## Testing Requirements

### Verification Steps

1. **Local Setup Verification**

   ```bash
   # Install dependencies
   npm install

   # Install Playwright browsers
   npx playwright install

   # Run smoke tests
   npm run test:e2e e2e/smoke.spec.ts
   ```

2. **Database Reset Verification**

   ```bash
   # Run multiple times to ensure idempotency
   npm run test:e2e e2e/smoke.spec.ts
   npm run test:e2e e2e/smoke.spec.ts
   ```

3. **CI Integration Verification**
   - Create PR with test files
   - Verify workflow runs automatically
   - Check that test failures block merge
   - Verify Playwright reports are uploaded

4. **Test Data Factory Verification**
   ```typescript
   // In a test file
   const member = MemberFactory.build();
   console.log(member); // Should have valid, realistic data
   ```

---

## Definition of Done

- [x] All 8 acceptance criteria met
- [ ] Playwright installed and configured
- [ ] Test database created and migrations applied
- [ ] Database reset/seed utilities working
- [ ] Test data factories created for Member, Subscription, Payment
- [ ] Smoke test passing locally
- [ ] Smoke test passing in CI
- [ ] CI workflow created and verified
- [ ] `e2e/README.md` documentation complete
- [ ] `.env.test.local.example` created
- [ ] Package scripts added and tested
- [ ] Code reviewed and approved
- [ ] No flaky tests (runs 10 times successfully)
- [ ] CI pipeline completes in <10 minutes

---

## Implementation Notes

### Best Practices

1. **Test Isolation**: Each test must have isolated data via database reset
2. **No Arbitrary Waits**: Use Playwright's auto-waiting instead of `setTimeout`
3. **Semantic Selectors**: Use `getByRole`, `getByLabel`, not CSS classes
4. **Retry Strategy**: Configure retries for CI (2 retries) but not locally

### Common Pitfalls

- ❌ **Don't** use production database for tests
- ❌ **Don't** hardcode test data IDs (use factories)
- ❌ **Don't** share state between tests
- ❌ **Don't** skip database cleanup between tests

### Performance Considerations

- Database reset must be fast (<2 seconds)
- Use service role key for direct database access
- Truncate tables instead of deleting rows individually
- Seed only minimal required data

### Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Faker.js Documentation](https://fakerjs.dev/)

---

## Dependencies

**None** - This is the foundation story that all other test stories depend on.

## Blocks

- US-002 (Auth E2E Tests)
- US-003 (Member Management E2E)
- US-004 (Payment Processing E2E)
- US-005 (Subscription Management E2E)
- US-006 (Session Booking E2E)

All e2e test stories require this infrastructure to be completed first.
