# US-004: Payment Processing E2E Tests

**Phase**: Phase 1 - Infrastructure + Critical E2E Tests (Week 2)
**Priority**: P0 (Must Have - CRITICAL)
**Estimated Effort**: 10 hours
**Dependencies**: US-001 (Infrastructure), US-002 (Auth), US-003 (Members)

---

## User Story

**As a** gym administrator
**I want** reliable e2e tests for payment processing
**So that** payment recording, refunds, and receipts work correctly without revenue loss

---

## Business Value

Payment processing is CRITICAL for revenue protection. Without reliable tests:

- Payments could fail to record correctly (revenue loss)
- Refunds could be processed incorrectly (financial discrepancies)
- Receipts could contain wrong data (compliance issues)
- Balance calculations could be incorrect (member disputes)

**Impact**: Protects revenue and financial data integrity

---

## Detailed Acceptance Criteria

###AC1: Record Payment for Subscription

- [ ] Test navigates to member profile with active subscription
- [ ] Test clicks "Record Payment" button
- [ ] Test fills payment amount (e.g., $50.00)
- [ ] Test selects payment method (Cash/Card/Transfer)
- [ ] Test adds optional payment notes
- [ ] Test clicks "Submit Payment" button
- [ ] Test verifies success toast: "Payment recorded successfully"
- [ ] Test verifies balance updated on profile
- [ ] Test verifies payment appears in payment history
- [ ] Test verifies payment date matches today

### AC2: Process Refund

- [ ] Test navigates to member with previous payment
- [ ] Test clicks payment row in history
- [ ] Test clicks "Refund" button
- [ ] Test fills refund amount (partial or full)
- [ ] Test enters refund reason (required)
- [ ] Test confirms refund in dialog
- [ ] Test verifies success toast: "Refund processed"
- [ ] Test verifies negative payment entry in history
- [ ] Test verifies balance recalculated correctly
- [ ] Test verifies refund reason stored

### AC3: Generate Receipt (PDF)

- [ ] Test navigates to payment in history
- [ ] Test clicks "Download Receipt" button
- [ ] Test verifies PDF download initiated
- [ ] Test verifies PDF contains: member name, amount, date, receipt number
- [ ] Test verifies PDF contains gym branding/logo
- [ ] Test verifies receipt number is unique and sequential
- [ ] Test verifies can download same receipt multiple times

### AC4: Validate Payment Amount

- [ ] Test attempts to record $0 payment
- [ ] Test verifies validation error: "Amount must be greater than 0"
- [ ] Test attempts negative amount (-$10)
- [ ] Test verifies validation error: "Amount cannot be negative"
- [ ] Test attempts amount exceeding subscription balance
- [ ] Test verifies warning: "Amount exceeds remaining balance"
- [ ] Test can still submit if admin confirms
- [ ] Test verifies decimal amounts handled correctly ($50.50)

### AC5: Balance Calculations

- [ ] Test records first payment of $30 for $100 subscription
- [ ] Test verifies balance shows $70 remaining
- [ ] Test records second payment of $50
- [ ] Test verifies balance shows $20 remaining
- [ ] Test records final payment of $20
- [ ] Test verifies balance shows $0 (Paid in Full)
- [ ] Test verifies subscription status updated if applicable

### AC6: Payment History Display

- [ ] Test navigates to member profile
- [ ] Test verifies payment history table visible
- [ ] Test verifies columns: Date, Amount, Method, Receipt, Actions
- [ ] Test verifies payments sorted by date (newest first)
- [ ] Test verifies positive amounts show as payments
- [ ] Test verifies negative amounts show as refunds with badge
- [ ] Test verifies can click receipt to download
- [ ] Test verifies pagination if >10 payments

### AC7: Multiple Payment Methods

- [ ] Test records payment with "Cash" method
- [ ] Test verifies method badge shows "Cash"
- [ ] Test records payment with "Card" method
- [ ] Test verifies method badge shows "Card"
- [ ] Test records payment with "Bank Transfer" method
- [ ] Test verifies all methods stored correctly

### AC8: Refund Validation

- [ ] Test attempts refund amount greater than original payment
- [ ] Test verifies error: "Refund cannot exceed payment amount"
- [ ] Test attempts refund without reason
- [ ] Test verifies error: "Refund reason is required"
- [ ] Test attempts refund on already refunded payment
- [ ] Test verifies error: "Payment already refunded"

---

## Technical Implementation

### Files to Create

#### 1. `e2e/payments/record-payment.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, testSupabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { createMemberWithSubscription } from "../support/payment-helpers";

test.describe("Payments - Record Payment", () => {
  let memberId: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    // Create member with active subscription ($100, unpaid)
    const data = await createMemberWithSubscription({
      totalAmount: 100,
      paidAmount: 0,
    });
    memberId = data.memberId;

    await loginAsAdmin(page);
  });

  test("should record payment and update balance", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    // Click record payment
    await page.getByRole("button", { name: /record payment/i }).click();

    // Fill payment form
    await page.getByLabel(/amount/i).fill("50.00");
    await page.getByLabel(/payment method/i).click();
    await page.getByRole("option", { name: /cash/i }).click();
    await page.getByLabel(/notes/i).fill("Initial payment");

    // Submit
    await page.getByRole("button", { name: /submit payment/i }).click();

    // Verify success
    await expect(
      page.getByText(/payment recorded successfully/i)
    ).toBeVisible();

    // Verify balance updated
    await expect(page.getByText(/balance.*\$50\.00/i)).toBeVisible();

    // Verify payment in history
    await expect(
      page.getByRole("row", { name: /\$50\.00.*cash/i })
    ).toBeVisible();
  });

  test("should validate payment amount", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    await page.getByRole("button", { name: /record payment/i }).click();

    // Try to submit with $0
    await page.getByLabel(/amount/i).fill("0");
    await page.getByRole("button", { name: /submit/i }).click();

    await expect(page.getByText(/amount must be greater than/i)).toBeVisible();

    // Try negative amount
    await page.getByLabel(/amount/i).fill("-10");
    await page.getByRole("button", { name: /submit/i }).click();

    await expect(page.getByText(/amount cannot be negative/i)).toBeVisible();
  });

  test("should handle overpayment warning", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    await page.getByRole("button", { name: /record payment/i }).click();

    // Enter amount exceeding balance
    await page.getByLabel(/amount/i).fill("150.00");

    // Should show warning
    await expect(page.getByText(/exceeds remaining balance/i)).toBeVisible();

    // Can still submit with confirmation
    await page.getByRole("button", { name: /submit anyway/i }).click();

    await expect(page.getByText(/payment recorded/i)).toBeVisible();
  });
});
```

#### 2. `e2e/payments/refunds.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { createMemberWithPayment } from "../support/payment-helpers";

test.describe("Payments - Refunds", () => {
  let memberId: string;
  let paymentId: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    // Create member with completed payment
    const data = await createMemberWithPayment({
      paymentAmount: 50,
    });
    memberId = data.memberId;
    paymentId = data.paymentId;

    await loginAsAdmin(page);
  });

  test("should process full refund", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    // Find payment in history and click refund
    const paymentRow = page.getByRole("row", { name: /\$50\.00/i });
    await paymentRow.getByRole("button", { name: /refund/i }).click();

    // Fill refund form
    await page.getByLabel(/refund amount/i).fill("50.00");
    await page.getByLabel(/reason/i).fill("Customer request");

    // Confirm
    await page.getByRole("button", { name: /confirm refund/i }).click();

    // Verify success
    await expect(page.getByText(/refund processed/i)).toBeVisible();

    // Verify negative entry in history
    await expect(page.getByRole("row", { name: /-\$50\.00/i })).toBeVisible();
    await expect(page.getByText(/refund/i)).toBeVisible();

    // Verify balance updated
    await expect(page.getByText(/balance.*\$50\.00/i)).toBeVisible();
  });

  test("should process partial refund", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    const paymentRow = page.getByRole("row", { name: /\$50\.00/i });
    await paymentRow.getByRole("button", { name: /refund/i }).click();

    // Partial refund
    await page.getByLabel(/refund amount/i).fill("20.00");
    await page.getByLabel(/reason/i).fill("Partial refund");

    await page.getByRole("button", { name: /confirm/i }).click();

    // Verify partial refund entry
    await expect(page.getByRole("row", { name: /-\$20\.00/i })).toBeVisible();

    // Balance should reflect partial refund
    await expect(page.getByText(/balance.*\$20\.00/i)).toBeVisible();
  });

  test("should validate refund amount", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    const paymentRow = page.getByRole("row", { name: /\$50\.00/i });
    await paymentRow.getByRole("button", { name: /refund/i }).click();

    // Try to refund more than payment
    await page.getByLabel(/refund amount/i).fill("100.00");
    await page.getByLabel(/reason/i).fill("Test");
    await page.getByRole("button", { name: /confirm/i }).click();

    await expect(page.getByText(/cannot exceed payment amount/i)).toBeVisible();
  });

  test("should require refund reason", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    const paymentRow = page.getByRole("row", { name: /\$50\.00/i });
    await paymentRow.getByRole("button", { name: /refund/i }).click();

    await page.getByLabel(/refund amount/i).fill("50.00");
    // Don't fill reason
    await page.getByRole("button", { name: /confirm/i }).click();

    await expect(page.getByText(/reason.*required/i)).toBeVisible();
  });
});
```

#### 3. `e2e/payments/receipts.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { createMemberWithPayment } from "../support/payment-helpers";

test.describe("Payments - Receipts", () => {
  let memberId: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    const data = await createMemberWithPayment({ paymentAmount: 50 });
    memberId = data.memberId;

    await loginAsAdmin(page);
  });

  test("should generate and download receipt PDF", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    // Click download receipt button
    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: /download receipt/i })
      .first()
      .click();
    const download = await downloadPromise;

    // Verify PDF downloaded
    expect(download.suggestedFilename()).toMatch(/receipt.*\.pdf/i);

    // Verify file exists and is not empty
    const path = await download.path();
    const fs = require("fs");
    const fileStats = fs.statSync(path);
    expect(fileStats.size).toBeGreaterThan(1000); // PDF should be >1KB
  });

  test("should display unique receipt numbers", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    // Check receipt number format
    const receiptNumber = page.getByText(/REC-\d{8}-\d{4}/i);
    await expect(receiptNumber).toBeVisible();

    // Receipt number should be unique (format: REC-YYYYMMDD-####)
    const receiptText = await receiptNumber.textContent();
    expect(receiptText).toMatch(/REC-\d{8}-\d{4}/);
  });

  test("should allow downloading same receipt multiple times", async ({
    page,
  }) => {
    await page.goto(`/members/${memberId}`);

    // Download first time
    const download1 = page.waitForEvent("download");
    await page
      .getByRole("button", { name: /download receipt/i })
      .first()
      .click();
    const file1 = await download1;
    const filename1 = file1.suggestedFilename();

    // Download again
    const download2 = page.waitForEvent("download");
    await page
      .getByRole("button", { name: /download receipt/i })
      .first()
      .click();
    const file2 = await download2;
    const filename2 = file2.suggestedFilename();

    // Should be same receipt (same filename/content)
    expect(filename1).toBe(filename2);
  });
});
```

#### 4. `e2e/support/payment-helpers.ts`

```typescript
import { testSupabase } from "./database";
import { MemberFactory } from "../../src/test/factories/member-factory";

export async function createMemberWithSubscription(options: {
  totalAmount: number;
  paidAmount: number;
}) {
  // Create member
  const { data: member } = await testSupabase
    .from("members")
    .insert(MemberFactory.build())
    .select()
    .single();

  // Create plan
  const { data: plan } = await testSupabase
    .from("subscription_plans")
    .insert({
      name: "Test Plan",
      price: options.totalAmount,
      sessions_count: 12,
      duration_days: 30,
      is_active: true,
    })
    .select()
    .single();

  // Create subscription
  const { data: subscription } = await testSupabase
    .from("member_subscriptions")
    .insert({
      member_id: member.id,
      plan_id: plan.id,
      start_date: "2025-01-01",
      end_date: "2025-01-31",
      status: "active",
      total_amount_snapshot: options.totalAmount,
      paid_amount: options.paidAmount,
      remaining_sessions: 12,
    })
    .select()
    .single();

  return {
    memberId: member.id,
    planId: plan.id,
    subscriptionId: subscription.id,
  };
}

export async function createMemberWithPayment(options: {
  paymentAmount: number;
}) {
  const { memberId, subscriptionId } = await createMemberWithSubscription({
    totalAmount: options.paymentAmount,
    paidAmount: 0,
  });

  // Create payment
  const { data: payment } = await testSupabase
    .from("subscription_payments")
    .insert({
      subscription_id: subscriptionId,
      amount: options.paymentAmount,
      payment_method: "cash",
      payment_date: new Date().toISOString().split("T")[0],
      receipt_number: `REC-${Date.now()}`,
    })
    .select()
    .single();

  // Update subscription paid amount
  await testSupabase
    .from("member_subscriptions")
    .update({ paid_amount: options.paymentAmount })
    .eq("id", subscriptionId);

  return {
    memberId,
    subscriptionId,
    paymentId: payment.id,
  };
}
```

---

## Testing Requirements

### Verification Steps

1. **Run payment tests locally**

   ```bash
   npm run test:e2e e2e/payments/
   ```

2. **Verify financial calculations**
   - Test multiple payments totaling subscription amount
   - Test overpayments
   - Test refunds after partial payments
   - Verify balance always correct

3. **Verify PDF generation**
   - Download receipt and manually inspect
   - Verify all required fields present
   - Test with different payment amounts/methods

4. **Test edge cases**
   - Zero balance subscriptions
   - Fully refunded payments
   - Multiple refunds on same payment

---

## Definition of Done

- [ ] All 8 acceptance criteria met
- [ ] Record payment test passing
- [ ] Refund tests passing (full, partial)
- [ ] Receipt generation test passing
- [ ] Payment validation tests passing
- [ ] Balance calculation tests passing
- [ ] Payment history display tests passing
- [ ] Multiple payment methods test passing
- [ ] Refund validation tests passing
- [ ] Payment helpers created and documented
- [ ] Tests pass in all browsers
- [ ] Tests run in <4 minutes
- [ ] No flaky tests (10 runs successful)
- [ ] Financial accuracy verified manually
- [ ] Code reviewed and approved

---

## Implementation Notes

### Best Practices

1. **Test Financial Accuracy**: Always verify balance calculations
2. **Use Helper Functions**: Reuse `createMemberWithSubscription` for setup
3. **Test Real Payments**: Don't mock payment API
4. **Verify Audit Trail**: Check payment history after every action

### Common Pitfalls

- ❌ **Don't** skip decimal validation (test $50.50, not just $50)
- ❌ **Don't** assume balance calculations (always verify)
- ❌ **Don't** test only successful paths (test validation errors)
- ❌ **Don't** skip refund edge cases (already refunded, partial, etc.)

### Critical Validations

- Payment amounts must be > $0
- Refund amounts cannot exceed payment
- Balance must always equal: total - paid
- Receipt numbers must be unique
- All payments must have method and date

---

## Dependencies

**Requires**:

- US-001 (Playwright Infrastructure)
- US-002 (Auth Tests)
- US-003 (Member Management - for creating test members)

## Blocks

US-005 (Subscription Management - uses payment functionality)
