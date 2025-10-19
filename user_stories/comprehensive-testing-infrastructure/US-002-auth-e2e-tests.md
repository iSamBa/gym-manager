# US-002: Authentication E2E Tests

**Phase**: Phase 1 - Infrastructure + Critical E2E Tests (Week 1)
**Priority**: P0 (Must Have)
**Estimated Effort**: 8 hours
**Dependencies**: US-001 (Playwright Infrastructure)

---

## User Story

**As a** developer
**I want** comprehensive e2e tests for authentication flows
**So that** login, logout, and session management work reliably in production

---

## Business Value

Authentication is the gateway to the entire application. Without reliable auth tests:

- Users could be locked out of the system
- Session hijacking vulnerabilities could go undetected
- Multi-tab session synchronization could break
- Middleware protection could fail silently

**Impact**: Protects 100% of application features (all require auth)

---

## Detailed Acceptance Criteria

### AC1: Login Flow with Valid Credentials

- [ ] Test navigates to `/` (homepage)
- [ ] Test fills email input with valid credentials
- [ ] Test fills password input with valid password
- [ ] Test clicks "Sign In" button
- [ ] Test verifies redirect to `/dashboard` or `/members`
- [ ] Test verifies user session cookie is set
- [ ] Test verifies "Welcome back" or user email is displayed

### AC2: Login Flow with Invalid Credentials

- [ ] Test navigates to `/login`
- [ ] Test fills email with valid format but wrong credentials
- [ ] Test fills password with incorrect password
- [ ] Test clicks "Sign In" button
- [ ] Test verifies error message: "The email or password you entered is incorrect"
- [ ] Test verifies user stays on login page
- [ ] Test verifies no session cookie is set
- [ ] Test verifies form fields are not cleared (allow retry)

### AC3: Logout Flow

- [ ] Test logs in successfully first
- [ ] Test clicks user menu or logout button
- [ ] Test clicks "Sign Out" option
- [ ] Test verifies redirect to `/login` or `/`
- [ ] Test verifies session cookie is cleared
- [ ] Test verifies cannot access `/members` (redirects to login)
- [ ] Test verifies cannot access `/dashboard` (redirects to login)

### AC4: Session Management Across Tabs

- [ ] Test logs in successfully in first tab
- [ ] Test opens second tab in same browser context
- [ ] Test navigates to `/members` in second tab
- [ ] Test verifies user is still authenticated (no redirect to login)
- [ ] Test logs out in first tab
- [ ] Test refreshes second tab
- [ ] Test verifies second tab redirects to login
- [ ] Test verifies "session expired" message shown

### AC5: Protected Route Middleware

- [ ] Test navigates to `/members` without logging in
- [ ] Test verifies redirect to `/login`
- [ ] Test verifies URL includes return path (`?returnUrl=/members`)
- [ ] Test logs in with valid credentials
- [ ] Test verifies redirect back to `/members`
- [ ] Test repeats for `/payments`, `/trainers`, `/subscriptions`

### AC6: Session Expiry Handling

- [ ] Test logs in successfully
- [ ] Test mocks session expiry (simulate time passing or invalidate token)
- [ ] Test navigates to a protected route
- [ ] Test verifies "Your session has expired. Please log in again" message
- [ ] Test verifies redirect to `/login`
- [ ] Test verifies can log in again successfully

### AC7: Tab Focus Validation

- [ ] Test logs in successfully
- [ ] Test simulates tab losing focus (minimize window or switch tabs)
- [ ] Test waits 30 seconds
- [ ] Test simulates tab regaining focus
- [ ] Test verifies session is still valid (no logout)
- [ ] Test verifies user can still interact with app

### AC8: Password Field Security

- [ ] Test verifies password input has `type="password"`
- [ ] Test verifies password is masked with bullets/asterisks
- [ ] Test verifies password cannot be copy-pasted (optional browser behavior)
- [ ] Test verifies "Show password" toggle works (if exists)

---

## Technical Implementation

### Files to Create

#### 1. `e2e/auth/login.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, seedTestData } from "../support/database";

test.describe("Authentication - Login Flow", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await seedTestData();
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.goto("/");

    // Fill login form
    await page.getByLabel(/email/i).fill("admin@test.gym");
    await page.getByLabel(/password/i).fill("TestPassword123!");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Verify redirect to dashboard/members
    await expect(page).toHaveURL(/\/(dashboard|members)/);

    // Verify welcome message or user indicator
    await expect(page.getByText(/welcome|admin@test.gym/i)).toBeVisible();

    // Verify session cookie exists
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name.includes("auth"));
    expect(sessionCookie).toBeDefined();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel(/email/i).fill("admin@test.gym");
    await page.getByLabel(/password/i).fill("WrongPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Verify error message
    await expect(page.getByText(/email or password.*incorrect/i)).toBeVisible();

    // Verify still on login page
    await expect(page).toHaveURL(/\/($|login)/);

    // Verify no session cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name.includes("auth"));
    expect(sessionCookie?.value).toBeFalsy();
  });

  test("should preserve form fields on error", async ({ page }) => {
    await page.goto("/");

    const testEmail = "admin@test.gym";
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill("WrongPassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for error
    await expect(page.getByText(/incorrect/i)).toBeVisible();

    // Verify email field still has value
    await expect(page.getByLabel(/email/i)).toHaveValue(testEmail);
  });
});
```

#### 2. `e2e/auth/logout.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, seedTestData } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";

test.describe("Authentication - Logout Flow", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await seedTestData();
  });

  test("should logout and clear session", async ({ page }) => {
    // Login first
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/(dashboard|members)/);

    // Logout
    await page.getByRole("button", { name: /menu|account/i }).click();
    await page.getByRole("menuitem", { name: /sign out|logout/i }).click();

    // Verify redirect to login
    await expect(page).toHaveURL(/\/($|login)/);

    // Verify session cleared
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name.includes("auth"));
    expect(sessionCookie?.value).toBeFalsy();

    // Verify cannot access protected routes
    await page.goto("/members");
    await expect(page).toHaveURL(/\/($|login)/);
  });
});
```

#### 3. `e2e/auth/session-management.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, seedTestData } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";

test.describe("Authentication - Session Management", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await seedTestData();
  });

  test("should maintain session across tabs", async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Login in first tab
    await loginAsAdmin(page1);
    await expect(page1).toHaveURL(/\/(dashboard|members)/);

    // Navigate to protected route in second tab
    await page2.goto("/members");

    // Should not redirect to login (session shared)
    await expect(page2).toHaveURL("/members");
    await expect(page2.getByText(/members|active/i)).toBeVisible();

    // Logout in first tab
    await page1.getByRole("button", { name: /menu|account/i }).click();
    await page1.getByRole("menuitem", { name: /sign out/i }).click();

    // Refresh second tab
    await page2.reload();

    // Should redirect to login
    await expect(page2).toHaveURL(/\/($|login)/);
  });
});
```

#### 4. `e2e/auth/middleware-protection.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, seedTestData } from "../support/database";

test.describe("Authentication - Middleware Protection", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await seedTestData();
  });

  const protectedRoutes = [
    "/members",
    "/members/new",
    "/trainers",
    "/payments",
    "/subscriptions",
    "/training-sessions",
    "/dashboard",
  ];

  for (const route of protectedRoutes) {
    test(`should protect ${route} and redirect to login`, async ({ page }) => {
      await page.goto(route);

      // Should redirect to login
      await expect(page).toHaveURL(/\/($|login)/);

      // Should include return URL
      const url = page.url();
      expect(url).toContain(encodeURIComponent(route));
    });
  }

  test("should redirect back after login", async ({ page }) => {
    const targetRoute = "/members";

    // Try to access protected route
    await page.goto(targetRoute);
    await expect(page).toHaveURL(/\/($|login)/);

    // Login
    await page.getByLabel(/email/i).fill("admin@test.gym");
    await page.getByLabel(/password/i).fill("TestPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect back to original route
    await expect(page).toHaveURL(targetRoute);
  });
});
```

#### 5. `e2e/support/auth-helpers.ts`

```typescript
import { Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  await page.goto("/");
  await page.getByLabel(/email/i).fill("admin@test.gym");
  await page.getByLabel(/password/i).fill("TestPassword123!");
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect
  await page.waitForURL(/\/(dashboard|members)/, { timeout: 5000 });
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: /menu|account/i }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await page.waitForURL(/\/($|login)/, { timeout: 5000 });
}

export async function assertAuthenticated(page: Page) {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((c) => c.name.includes("auth"));
  if (!sessionCookie?.value) {
    throw new Error("User is not authenticated");
  }
}

export async function assertNotAuthenticated(page: Page) {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((c) => c.name.includes("auth"));
  if (sessionCookie?.value) {
    throw new Error("User should not be authenticated");
  }
}
```

---

## Testing Requirements

### Verification Steps

1. **Run auth tests locally**

   ```bash
   npm run test:e2e e2e/auth/
   ```

2. **Verify all tests pass in all browsers**

   ```bash
   npm run test:e2e e2e/auth/ --project=chromium
   npm run test:e2e e2e/auth/ --project=firefox
   npm run test:e2e e2e/auth/ --project=webkit
   ```

3. **Check test reliability (run 5 times)**

   ```bash
   for i in {1..5}; do npm run test:e2e e2e/auth/; done
   ```

4. **Verify CI integration**
   - Create PR with auth tests
   - Check that all tests pass in CI
   - Verify test reports are generated

---

## Definition of Done

- [ ] All 8 acceptance criteria met
- [ ] Login with valid credentials test passing
- [ ] Login with invalid credentials test passing
- [ ] Logout flow test passing
- [ ] Session management across tabs test passing
- [ ] Middleware protection tests passing for all routes
- [ ] Session expiry handling test passing
- [ ] Tab focus validation test passing
- [ ] Auth helper utilities created and documented
- [ ] Tests pass locally (100% success rate)
- [ ] Tests pass in CI (100% success rate)
- [ ] Tests run in <2 minutes total
- [ ] No flaky tests (10 consecutive runs successful)
- [ ] Code reviewed and approved

---

## Implementation Notes

### Best Practices

1. **Use Auth Helpers**: Reuse `loginAsAdmin()` instead of duplicating login code
2. **Semantic Selectors**: Use `getByRole`, `getByLabel` for accessibility
3. **Wait for Navigation**: Always wait for URL changes with `waitForURL`
4. **Test Real Behavior**: Don't mock Supabase auth, test the real flow

### Common Pitfalls

- ❌ **Don't** hardcode test user credentials in multiple files
- ❌ **Don't** use `page.goto()` and immediately check URL (wait for redirect)
- ❌ **Don't** rely on timing (use `waitForSelector`, not `setTimeout`)
- ❌ **Don't** share authenticated context between tests (reset each time)

### Security Considerations

- Test that passwords are never logged or exposed
- Verify session cookies are httpOnly
- Test that expired sessions cannot access protected routes
- Verify CSRF protection (if implemented)

### Resources

- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [Supabase Auth Testing](https://supabase.com/docs/guides/auth/testing)
- [Next.js Middleware Testing](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## Dependencies

**Requires**: US-001 (Playwright Infrastructure) to be completed first

## Blocks

All other e2e tests (US-003 through US-006) depend on auth helpers from this story
