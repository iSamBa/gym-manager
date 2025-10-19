# US-005: Subscription Management E2E Tests

**Phase**: Phase 1 - Infrastructure + Critical E2E Tests (Week 2)
**Priority**: P0 (Must Have)
**Estimated Effort**: 12 hours
**Dependencies**: US-001 (Infrastructure), US-002 (Auth), US-003 (Members), US-004 (Payments)

---

## User Story

**As a** gym administrator
**I want** reliable e2e tests for subscription management
**So that** subscription creation, upgrades, cancellations, and session tracking work correctly

---

## Business Value

Subscriptions are the core revenue model. Without reliable tests:

- Subscriptions could be created with incorrect data
- Upgrades could calculate credits incorrectly (member disputes)
- Cancellations could fail to update status properly
- Session tracking could decrement incorrectly (member dissatisfaction)

**Impact**: Protects subscription lifecycle and member satisfaction

---

## Detailed Acceptance Criteria

### AC1: Create New Subscription

- [ ] Test navigates to member profile without subscription
- [ ] Test clicks "Add Subscription" button
- [ ] Test selects subscription plan from dropdown
- [ ] Test verifies plan price auto-filled
- [ ] Test selects start date (today or future)
- [ ] Test verifies end date calculated automatically based on plan duration
- [ ] Test enters initial payment amount (optional)
- [ ] Test clicks "Create Subscription" button
- [ ] Test verifies success toast: "Subscription created successfully"
- [ ] Test verifies subscription appears on member profile
- [ ] Test verifies status shows "Active"
- [ ] Test verifies session count displays correctly

### AC2: Upgrade Subscription (Change Plan)

- [ ] Test navigates to member with active subscription
- [ ] Test clicks "Upgrade Subscription" or "Change Plan"
- [ ] Test selects new plan with higher price
- [ ] Test verifies credit calculation displayed: "Credit from current plan: $X"
- [ ] Test verifies new amount due shown
- [ ] Test enters reason for upgrade
- [ ] Test confirms upgrade in dialog
- [ ] Test verifies success toast: "Subscription upgraded"
- [ ] Test verifies new plan displayed on profile
- [ ] Test verifies credit applied to balance
- [ ] Test verifies session count updated to new plan's sessions

### AC3: Downgrade Subscription

- [ ] Test navigates to member with active subscription
- [ ] Test clicks "Change Plan"
- [ ] Test selects plan with lower price
- [ ] Test verifies warning: "Downgrade will not issue refund"
- [ ] Test verifies sessions adjusted to new plan
- [ ] Test confirms downgrade
- [ ] Test verifies new plan active
- [ ] Test verifies no refund issued (balance unchanged)

### AC4: Pause Subscription

- [ ] Test clicks "Pause Subscription" button
- [ ] Test selects pause reason from dropdown
- [ ] Test enters optional notes
- [ ] Test sets resume date (future date)
- [ ] Test confirms pause
- [ ] Test verifies status changed to "Paused"
- [ ] Test verifies pause reason stored
- [ ] Test verifies cannot book sessions while paused
- [ ] Test verifies resume date displayed

### AC5: Cancel Subscription

- [ ] Test clicks "Cancel Subscription" button
- [ ] Test selects cancellation reason
- [ ] Test enters cancellation notes (required)
- [ ] Test views final balance calculation
- [ ] Test confirms cancellation in dialog
- [ ] Test verifies status changed to "Cancelled"
- [ ] Test verifies cancellation date recorded
- [ ] Test verifies cannot book new sessions
- [ ] Test verifies member status updated if no other active subscriptions

### AC6: Track Session Usage

- [ ] Test views subscription with 12 sessions remaining
- [ ] Test books a training session for member
- [ ] Test returns to member profile
- [ ] Test verifies session count decremented to 11
- [ ] Test cancels the booked session
- [ ] Test verifies session count restored to 12
- [ ] Test books all remaining sessions
- [ ] Test verifies warning when 0 sessions remain

### AC7: Subscription Renewal

- [ ] Test navigates to member with expired subscription
- [ ] Test clicks "Renew Subscription" button
- [ ] Test verifies previous plan pre-selected
- [ ] Test can change plan before renewal
- [ ] Test sets new start date
- [ ] Test enters initial payment
- [ ] Test confirms renewal
- [ ] Test verifies new subscription created
- [ ] Test verifies old subscription remains in history

### AC8: View Subscription History

- [ ] Test navigates to member with multiple subscriptions
- [ ] Test clicks "Subscription History" tab
- [ ] Test verifies all subscriptions listed
- [ ] Test verifies most recent subscription first
- [ ] Test verifies each subscription shows: plan, dates, status, amount
- [ ] Test can expand subscription to see payments
- [ ] Test can view cancelled subscriptions with reason

### AC9: Handle Scheduled Changes

- [ ] Test creates subscription with future start date
- [ ] Test verifies status shows "Scheduled"
- [ ] Test verifies subscription not yet active
- [ ] Test advances system date to start date (mock or wait)
- [ ] Test verifies status changed to "Active"
- [ ] Test verifies can now book sessions

### AC10: Subscription Validation

- [ ] Test attempts subscription with end date before start date
- [ ] Test verifies error: "End date must be after start date"
- [ ] Test attempts subscription with negative price
- [ ] Test verifies error prevented
- [ ] Test attempts duplicate active subscription
- [ ] Test verifies warning: "Member already has active subscription"

---

## Technical Implementation

### Files to Create

#### 1. `e2e/subscriptions/create-subscription.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, testSupabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { MemberFactory } from "../../src/test/factories/member-factory";

test.describe("Subscriptions - Create Subscription", () => {
  let memberId: string;
  let planId: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    // Create member
    const { data: member } = await testSupabase
      .from("members")
      .insert(MemberFactory.build())
      .select()
      .single();
    memberId = member.id;

    // Create plan
    const { data: plan } = await testSupabase
      .from("subscription_plans")
      .insert({
        name: "Monthly Plan",
        price: 100.0,
        sessions_count: 12,
        duration_days: 30,
        is_active: true,
      })
      .select()
      .single();
    planId = plan.id;

    await loginAsAdmin(page);
  });

  test("should create new subscription", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    // Click add subscription
    await page.getByRole("button", { name: /add subscription/i }).click();

    // Select plan
    await page.getByLabel(/plan/i).click();
    await page.getByRole("option", { name: /monthly plan/i }).click();

    // Verify price auto-filled
    await expect(page.getByLabel(/price/i)).toHaveValue("100.00");

    // Select start date (today)
    await page.getByLabel(/start date/i).click();
    await page.getByRole("button", { name: /today/i }).click();

    // Enter initial payment
    await page.getByLabel(/initial payment/i).fill("50.00");

    // Submit
    await page.getByRole("button", { name: /create subscription/i }).click();

    // Verify success
    await expect(
      page.getByText(/subscription created successfully/i)
    ).toBeVisible();

    // Verify subscription on profile
    await expect(page.getByText(/monthly plan/i)).toBeVisible();
    await expect(page.getByText(/active/i)).toBeVisible();
    await expect(page.getByText(/12.*sessions/i)).toBeVisible();
    await expect(page.getByText(/balance.*\$50\.00/i)).toBeVisible();
  });

  test("should calculate end date automatically", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    await page.getByRole("button", { name: /add subscription/i }).click();

    await page.getByLabel(/plan/i).click();
    await page.getByRole("option", { name: /monthly plan/i }).click();

    // Select start date: 2025-01-01
    await page.getByLabel(/start date/i).fill("2025-01-01");

    // Verify end date calculated: 2025-01-31 (30 days duration)
    await expect(page.getByLabel(/end date/i)).toHaveValue("2025-01-31");
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    await page.getByRole("button", { name: /add subscription/i }).click();

    // Try to submit without selecting plan
    await page.getByRole("button", { name: /create subscription/i }).click();

    await expect(page.getByText(/plan.*required/i)).toBeVisible();
  });
});
```

#### 2. `e2e/subscriptions/upgrade-downgrade.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { createMemberWithSubscription } from "../support/payment-helpers";
import { testSupabase } from "../support/database";

test.describe("Subscriptions - Upgrade & Downgrade", () => {
  let memberId: string;
  let subscriptionId: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    // Create member with basic plan ($50, 8 sessions)
    const { memberId: mid, subscriptionId: sid } =
      await createMemberWithSubscription({
        planName: "Basic Plan",
        price: 50,
        sessions: 8,
        paidAmount: 50, // Fully paid
      });

    memberId = mid;
    subscriptionId = sid;

    // Create premium plan for upgrade
    await testSupabase.from("subscription_plans").insert({
      name: "Premium Plan",
      price: 100.0,
      sessions_count: 16,
      duration_days: 30,
      is_active: true,
    });

    await loginAsAdmin(page);
  });

  test("should upgrade subscription with credit", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    // Click upgrade
    await page.getByRole("button", { name: /upgrade|change plan/i }).click();

    // Select premium plan
    await page.getByLabel(/new plan/i).click();
    await page.getByRole("option", { name: /premium plan/i }).click();

    // Verify credit calculation shown
    // Current plan fully paid ($50), should get some credit
    await expect(page.getByText(/credit.*\$/i)).toBeVisible();

    // Verify new amount due
    await expect(page.getByText(/new amount due/i)).toBeVisible();

    // Enter reason
    await page.getByLabel(/reason/i).fill("Upgrading for more sessions");

    // Confirm
    await page.getByRole("button", { name: /confirm upgrade/i }).click();

    // Verify success
    await expect(page.getByText(/subscription upgraded/i)).toBeVisible();

    // Verify new plan active
    await expect(page.getByText(/premium plan/i)).toBeVisible();
    await expect(page.getByText(/16.*sessions/i)).toBeVisible();
  });

  test("should downgrade subscription with warning", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    // Create cheaper plan
    await testSupabase.from("subscription_plans").insert({
      name: "Starter Plan",
      price: 30.0,
      sessions_count: 4,
      duration_days: 30,
      is_active: true,
    });

    await page.reload();

    await page.getByRole("button", { name: /change plan/i }).click();

    // Select cheaper plan
    await page.getByLabel(/new plan/i).click();
    await page.getByRole("option", { name: /starter plan/i }).click();

    // Verify downgrade warning
    await expect(page.getByText(/downgrade.*not.*refund/i)).toBeVisible();

    // Confirm downgrade
    await page.getByRole("button", { name: /confirm/i }).click();

    // Verify new plan
    await expect(page.getByText(/starter plan/i)).toBeVisible();
    await expect(page.getByText(/4.*sessions/i)).toBeVisible();
  });
});
```

#### 3. `e2e/subscriptions/pause-cancel.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { createMemberWithSubscription } from "../support/payment-helpers";

test.describe("Subscriptions - Pause & Cancel", () => {
  let memberId: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    const { memberId: mid } = await createMemberWithSubscription({
      totalAmount: 100,
      paidAmount: 50,
    });
    memberId = mid;

    await loginAsAdmin(page);
  });

  test("should pause subscription", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    // Click pause
    await page.getByRole("button", { name: /pause subscription/i }).click();

    // Select reason
    await page.getByLabel(/reason/i).click();
    await page.getByRole("option", { name: /medical/i }).click();

    // Enter notes
    await page.getByLabel(/notes/i).fill("Medical leave for 2 weeks");

    // Set resume date
    await page.getByLabel(/resume date/i).click();
    // Select date 14 days from now
    await page.getByRole("button", { name: /\d+/ }).nth(14).click();

    // Confirm
    await page.getByRole("button", { name: /confirm pause/i }).click();

    // Verify success
    await expect(page.getByText(/subscription paused/i)).toBeVisible();

    // Verify status updated
    await expect(page.getByText(/paused/i)).toBeVisible();

    // Verify resume date shown
    await expect(page.getByText(/resume.*\d{4}-\d{2}-\d{2}/i)).toBeVisible();
  });

  test("should cancel subscription", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    // Click cancel
    await page.getByRole("button", { name: /cancel subscription/i }).click();

    // Select reason
    await page.getByLabel(/cancellation reason/i).click();
    await page.getByRole("option", { name: /moving away/i }).click();

    // Enter notes (required)
    await page.getByLabel(/notes/i).fill("Relocating to another city");

    // Verify final balance shown
    await expect(page.getByText(/final balance.*\$50\.00/i)).toBeVisible();

    // Confirm
    await page.getByRole("button", { name: /confirm cancellation/i }).click();

    // Verify success
    await expect(page.getByText(/subscription cancelled/i)).toBeVisible();

    // Verify status updated
    await expect(page.getByText(/cancelled/i)).toBeVisible();

    // Verify cancellation reason stored
    await expect(page.getByText(/moving away/i)).toBeVisible();
  });

  test("should require cancellation notes", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    await page.getByRole("button", { name: /cancel subscription/i }).click();

    await page.getByLabel(/reason/i).click();
    await page.getByRole("option", { name: /other/i }).click();

    // Try to submit without notes
    await page.getByRole("button", { name: /confirm/i }).click();

    await expect(page.getByText(/notes.*required/i)).toBeVisible();
  });
});
```

#### 4. `e2e/subscriptions/session-tracking.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { createMemberWithSubscription } from "../support/payment-helpers";

test.describe("Subscriptions - Session Tracking", () => {
  let memberId: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    const { memberId: mid } = await createMemberWithSubscription({
      totalAmount: 100,
      paidAmount: 100,
      sessions: 12,
    });
    memberId = mid;

    await loginAsAdmin(page);
  });

  test("should decrement sessions when booking", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    // Verify initial session count
    await expect(page.getByText(/12.*sessions remaining/i)).toBeVisible();

    // Book a session
    await page.goto("/training-sessions/new");

    // Fill session form (simplified)
    await page.getByLabel(/date/i).click();
    await page.getByRole("button", { name: /today/i }).click();

    // Add member to session
    await page.getByLabel(/add member/i).click();
    await page.getByRole("option", { name: /test.*member/i }).click();

    await page.getByRole("button", { name: /create session/i }).click();

    // Return to member profile
    await page.goto(`/members/${memberId}`);

    // Verify session count decremented
    await expect(page.getByText(/11.*sessions remaining/i)).toBeVisible();
  });

  test("should restore sessions when cancelling booking", async ({ page }) => {
    // First, book a session to set up test
    // (implementation depends on your app flow)

    await page.goto(`/members/${memberId}`);

    // Should show 11 sessions after booking
    await expect(page.getByText(/11.*sessions/i)).toBeVisible();

    // Navigate to sessions and cancel
    await page.goto("/training-sessions");

    // Find and cancel session
    await page
      .getByRole("button", { name: /cancel.*session/i })
      .first()
      .click();
    await page.getByRole("button", { name: /confirm/i }).click();

    // Return to member profile
    await page.goto(`/members/${memberId}`);

    // Verify session count restored
    await expect(page.getByText(/12.*sessions/i)).toBeVisible();
  });

  test("should warn when no sessions remaining", async ({ page }) => {
    // Update subscription to 0 sessions
    // (setup code)

    await page.goto("/training-sessions/new");

    // Try to book session for member with 0 sessions
    await page.getByLabel(/add member/i).fill("test member");

    // Should show warning
    await expect(page.getByText(/no sessions remaining/i)).toBeVisible();

    // Submit button should be disabled
    await expect(page.getByRole("button", { name: /create/i })).toBeDisabled();
  });
});
```

---

## Testing Requirements

### Verification Steps

1. **Run subscription tests locally**

   ```bash
   npm run test:e2e e2e/subscriptions/
   ```

2. **Verify subscription lifecycle**
   - Create → Active → Pause → Resume → Cancel
   - Create → Upgrade → Active
   - Create → Complete all sessions → Expired

3. **Verify credit calculations**
   - Test upgrade from $50 plan to $100 plan
   - Verify credit applied correctly
   - Test with various paid amounts

4. **Test session tracking**
   - Book 12 sessions and verify count reaches 0
   - Cancel sessions and verify restoration
   - Test edge case: 1 session remaining

---

## Definition of Done

- [ ] All 10 acceptance criteria met
- [ ] Create subscription test passing
- [ ] Upgrade subscription test passing
- [ ] Downgrade subscription test passing
- [ ] Pause subscription test passing
- [ ] Cancel subscription test passing
- [ ] Session tracking tests passing
- [ ] Subscription renewal test passing
- [ ] View subscription history test passing
- [ ] Scheduled changes test passing
- [ ] Subscription validation tests passing
- [ ] Subscription helpers created
- [ ] Tests pass in all browsers
- [ ] Tests run in <6 minutes
- [ ] No flaky tests (10 runs successful)
- [ ] Credit calculations verified manually
- [ ] Code reviewed and approved

---

## Implementation Notes

### Best Practices

1. **Test Full Lifecycle**: Create → Active → Pause/Cancel
2. **Verify Credit Math**: Always check upgrade credit calculations
3. **Test Session Tracking**: Ensure counts accurate after booking/cancelling
4. **Use Realistic Data**: Test with actual subscription durations

### Common Pitfalls

- ❌ **Don't** skip credit calculation tests (complex business logic)
- ❌ **Don't** forget to test session restoration on cancellation
- ❌ **Don't** test only happy paths (test pause, cancel, upgrade failures)
- ❌ **Don't** assume date calculations (test leap years, month boundaries)

### Critical Validations

- Subscription end date must be after start date
- Credit calculations must be accurate
- Session count cannot go negative
- Cannot create duplicate active subscriptions
- Pause requires future resume date

---

## Dependencies

**Requires**:

- US-001 (Playwright Infrastructure)
- US-002 (Auth Tests)
- US-003 (Member Management)
- US-004 (Payment Processing - for initial payments)

## Blocks

US-006 (Session Booking - uses session tracking logic)
