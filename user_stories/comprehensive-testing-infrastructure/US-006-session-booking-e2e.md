# US-006: Training Session Booking E2E Tests

**Phase**: Phase 1 - Infrastructure + Critical E2E Tests (Week 2)
**Priority**: P0 (Must Have)
**Estimated Effort**: 10 hours
**Dependencies**: US-001 (Infrastructure), US-002 (Auth), US-003 (Members), US-005 (Subscriptions)

---

## User Story

**As a** gym administrator
**I want** reliable e2e tests for training session booking
**So that** session scheduling, member assignments, and machine availability work correctly

---

## Business Value

Session booking is a core operational workflow. Without reliable tests:

- Double bookings could occur (trainer/machine conflicts)
- Session counts could decrement incorrectly
- Cancellations could fail to restore credits
- Machine availability could be out of sync

**Impact**: Ensures smooth daily gym operations and prevents scheduling conflicts

---

## Detailed Acceptance Criteria

### AC1: Book Training Session

- [ ] Test navigates to `/training-sessions/new`
- [ ] Test selects session date from calendar
- [ ] Test selects start time from dropdown
- [ ] Test selects end time (validates end > start)
- [ ] Test selects trainer from dropdown
- [ ] Test adds members to session (multiple selection)
- [ ] Test assigns machine (optional)
- [ ] Test adds session notes
- [ ] Test clicks "Create Session" button
- [ ] Test verifies success toast: "Session booked successfully"
- [ ] Test verifies redirect to sessions list
- [ ] Test verifies new session appears in calendar/list

### AC2: Cancel Training Session

- [ ] Test navigates to existing session details
- [ ] Test clicks "Cancel Session" button
- [ ] Test enters cancellation reason (required)
- [ ] Test confirms cancellation in dialog
- [ ] Test verifies success toast: "Session cancelled"
- [ ] Test verifies session status changed to "Cancelled"
- [ ] Test verifies member session credits restored
- [ ] Test verifies session still visible in history with "Cancelled" badge

### AC3: Prevent Double Booking - Trainer Conflict

- [ ] Test creates session for trainer "John" at 10:00-11:00 AM
- [ ] Test attempts to create second session for same trainer at 10:30-11:30 AM
- [ ] Test verifies validation error: "Trainer John is already booked at this time"
- [ ] Test verifies form submission blocked
- [ ] Test changes trainer to "Jane"
- [ ] Test verifies submission now allowed

### AC4: Prevent Double Booking - Machine Conflict

- [ ] Test creates session with machine "Machine 1" at 2:00-3:00 PM
- [ ] Test attempts to create second session with same machine at 2:30-3:30 PM
- [ ] Test verifies error: "Machine 1 is not available at this time"
- [ ] Test verifies form blocked
- [ ] Test changes machine to "Machine 2"
- [ ] Test verifies submission allowed

### AC5: Manage Machine Availability

- [ ] Test navigates to equipment/machines page
- [ ] Test finds "Machine 1" in list
- [ ] Test toggles "Available" switch to OFF
- [ ] Test verifies success toast: "Machine availability updated"
- [ ] Test navigates to new session form
- [ ] Test verifies "Machine 1" is disabled/unavailable in dropdown
- [ ] Test toggles machine back to available
- [ ] Test verifies machine now selectable

### AC6: Session Calendar View

- [ ] Test navigates to `/training-sessions`
- [ ] Test verifies calendar view displays
- [ ] Test creates 3 sessions on same day at different times
- [ ] Test verifies all 3 sessions appear on calendar
- [ ] Test clicks on session block
- [ ] Test verifies session details popover/modal shows
- [ ] Test verifies trainer, members, time displayed correctly

### AC7: Filter Sessions by Date Range

- [ ] Test navigates to training sessions page
- [ ] Test clicks date range picker
- [ ] Test selects "This Week"
- [ ] Test verifies only current week sessions displayed
- [ ] Test selects "Next Month"
- [ ] Test verifies future sessions displayed
- [ ] Test selects custom date range
- [ ] Test verifies only sessions in range shown

### AC8: Filter Sessions by Trainer

- [ ] Test creates sessions with 2 different trainers
- [ ] Test clicks trainer filter dropdown
- [ ] Test selects "Trainer John"
- [ ] Test verifies only John's sessions displayed
- [ ] Test selects "All Trainers"
- [ ] Test verifies all sessions return

### AC9: Add Member to Existing Session

- [ ] Test navigates to existing session details
- [ ] Test clicks "Add Member" button
- [ ] Test searches for member by name
- [ ] Test selects member from dropdown
- [ ] Test clicks "Add" button
- [ ] Test verifies member added to session
- [ ] Test verifies member's session count decremented
- [ ] Test verifies member appears in session details

### AC10: Remove Member from Session

- [ ] Test navigates to session with multiple members
- [ ] Test finds member in participants list
- [ ] Test clicks "Remove" button next to member
- [ ] Test confirms removal in dialog
- [ ] Test verifies member removed from session
- [ ] Test verifies member's session count restored
- [ ] Test verifies success toast: "Member removed from session"

---

## Technical Implementation

### Files to Create

#### 1. `e2e/sessions/create-session.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, testSupabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import {
  createTrainer,
  createMemberWithSubscription,
} from "../support/session-helpers";

test.describe("Training Sessions - Create Session", () => {
  let trainerId: string;
  let memberId: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    // Create trainer
    trainerId = await createTrainer({ name: "John Trainer" });

    // Create member with active subscription
    const { memberId: mid } = await createMemberWithSubscription({
      totalAmount: 100,
      paidAmount: 100,
      sessions: 12,
    });
    memberId = mid;

    await loginAsAdmin(page);
  });

  test("should book new training session", async ({ page }) => {
    await page.goto("/training-sessions/new");

    // Select date (today)
    await page.getByLabel(/date/i).click();
    await page.getByRole("button", { name: /today/i }).click();

    // Select time
    await page.getByLabel(/start time/i).click();
    await page.getByRole("option", { name: /10:00/i }).click();

    await page.getByLabel(/end time/i).click();
    await page.getByRole("option", { name: /11:00/i }).click();

    // Select trainer
    await page.getByLabel(/trainer/i).click();
    await page.getByRole("option", { name: /john trainer/i }).click();

    // Add member
    await page.getByLabel(/add member/i).fill("Test Member");
    await page.getByRole("option", { name: /test member/i }).click();

    // Add notes
    await page.getByLabel(/notes/i).fill("Regular training session");

    // Submit
    await page.getByRole("button", { name: /create session/i }).click();

    // Verify success
    await expect(page.getByText(/session booked successfully/i)).toBeVisible();

    // Verify redirect to sessions list
    await expect(page).toHaveURL(/\/training-sessions/);

    // Verify session in list
    await expect(page.getByText(/john trainer/i)).toBeVisible();
    await expect(page.getByText(/10:00.*11:00/i)).toBeVisible();
  });

  test("should validate time range", async ({ page }) => {
    await page.goto("/training-sessions/new");

    await page.getByLabel(/date/i).click();
    await page.getByRole("button", { name: /today/i }).click();

    // Set end time before start time
    await page.getByLabel(/start time/i).click();
    await page.getByRole("option", { name: /11:00/i }).click();

    await page.getByLabel(/end time/i).click();
    await page.getByRole("option", { name: /10:00/i }).click();

    // Try to submit
    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/end time must be after start time/i)
    ).toBeVisible();
  });

  test("should require trainer selection", async ({ page }) => {
    await page.goto("/training-sessions/new");

    await page.getByLabel(/date/i).click();
    await page.getByRole("button", { name: /today/i }).click();

    // Skip trainer selection
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(/trainer.*required/i)).toBeVisible();
  });
});
```

#### 2. `e2e/sessions/cancel-session.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { createSessionWithMembers } from "../support/session-helpers";

test.describe("Training Sessions - Cancel Session", () => {
  let sessionId: string;
  let memberId: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    // Create session with member
    const data = await createSessionWithMembers({
      memberCount: 1,
      sessionsRemaining: 12,
    });
    sessionId = data.sessionId;
    memberId = data.memberIds[0];

    await loginAsAdmin(page);
  });

  test("should cancel session and restore credits", async ({ page }) => {
    // Navigate to session details
    await page.goto(`/training-sessions/${sessionId}`);

    // Verify initial session count (11 after booking)
    await expect(page.getByText(/11.*sessions remaining/i)).toBeVisible();

    // Cancel session
    await page.getByRole("button", { name: /cancel session/i }).click();

    // Enter reason
    await page.getByLabel(/cancellation reason/i).fill("Member called in sick");

    // Confirm
    await page.getByRole("button", { name: /confirm/i }).click();

    // Verify success
    await expect(page.getByText(/session cancelled/i)).toBeVisible();

    // Verify status updated
    await expect(page.getByText(/cancelled/i)).toBeVisible();

    // Navigate to member profile
    await page.goto(`/members/${memberId}`);

    // Verify session count restored to 12
    await expect(page.getByText(/12.*sessions remaining/i)).toBeVisible();
  });

  test("should require cancellation reason", async ({ page }) => {
    await page.goto(`/training-sessions/${sessionId}`);

    await page.getByRole("button", { name: /cancel/i }).click();

    // Try to submit without reason
    await page.getByRole("button", { name: /confirm/i }).click();

    await expect(page.getByText(/reason.*required/i)).toBeVisible();
  });
});
```

#### 3. `e2e/sessions/prevent-double-booking.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { createTrainer, createSession } from "../support/session-helpers";

test.describe("Training Sessions - Prevent Double Booking", () => {
  let trainer1Id: string;
  let trainer2Id: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    trainer1Id = await createTrainer({ name: "John" });
    trainer2Id = await createTrainer({ name: "Jane" });

    await loginAsAdmin(page);
  });

  test("should prevent trainer double booking", async ({ page }) => {
    // Create first session: 10:00-11:00 with John
    await createSession({
      trainerId: trainer1Id,
      date: "2025-01-15",
      startTime: "10:00",
      endTime: "11:00",
    });

    // Try to create overlapping session
    await page.goto("/training-sessions/new");

    await page.getByLabel(/date/i).fill("2025-01-15");
    await page.getByLabel(/start time/i).click();
    await page.getByRole("option", { name: /10:30/i }).click();
    await page.getByLabel(/end time/i).click();
    await page.getByRole("option", { name: /11:30/i }).click();

    // Select same trainer
    await page.getByLabel(/trainer/i).click();
    await page.getByRole("option", { name: /john/i }).click();

    // Should show error
    await expect(page.getByText(/john.*already booked/i)).toBeVisible();

    // Submit button should be disabled
    await expect(page.getByRole("button", { name: /create/i })).toBeDisabled();
  });

  test("should allow booking different trainer at same time", async ({
    page,
  }) => {
    // Create session with John
    await createSession({
      trainerId: trainer1Id,
      date: "2025-01-15",
      startTime: "10:00",
      endTime: "11:00",
    });

    // Book same time with Jane
    await page.goto("/training-sessions/new");

    await page.getByLabel(/date/i).fill("2025-01-15");
    await page.getByLabel(/start time/i).click();
    await page.getByRole("option", { name: /10:00/i }).click();
    await page.getByLabel(/end time/i).click();
    await page.getByRole("option", { name: /11:00/i }).click();

    // Select Jane (different trainer)
    await page.getByLabel(/trainer/i).click();
    await page.getByRole("option", { name: /jane/i }).click();

    // Should not show error
    await expect(page.getByText(/already booked/i)).not.toBeVisible();

    // Can submit
    await expect(
      page.getByRole("button", { name: /create/i })
    ).not.toBeDisabled();
  });
});
```

#### 4. `e2e/sessions/machine-availability.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, testSupabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";

test.describe("Training Sessions - Machine Availability", () => {
  let machineId: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    // Create machine
    const { data: machine } = await testSupabase
      .from("equipment")
      .insert({
        name: "Machine 1",
        type: "training_machine",
        is_available: true,
      })
      .select()
      .single();
    machineId = machine.id;

    await loginAsAdmin(page);
  });

  test("should toggle machine availability", async ({ page }) => {
    await page.goto("/equipment");

    // Find machine and toggle availability
    const machineRow = page.getByRole("row", { name: /machine 1/i });
    await machineRow.getByRole("switch", { name: /available/i }).click();

    // Verify success
    await expect(page.getByText(/availability updated/i)).toBeVisible();

    // Navigate to session booking
    await page.goto("/training-sessions/new");

    // Machine should not be selectable
    await page.getByLabel(/machine/i).click();
    await expect(
      page.getByRole("option", { name: /machine 1/i })
    ).toBeDisabled();
  });

  test("should show available machines only", async ({ page }) => {
    // Create second machine (available)
    await testSupabase.from("equipment").insert({
      name: "Machine 2",
      type: "training_machine",
      is_available: true,
    });

    // Set Machine 1 to unavailable
    await testSupabase
      .from("equipment")
      .update({ is_available: false })
      .eq("id", machineId);

    await page.goto("/training-sessions/new");

    await page.getByLabel(/machine/i).click();

    // Machine 1 should not appear or be disabled
    // Machine 2 should be available
    await expect(
      page.getByRole("option", { name: /machine 2/i })
    ).toBeEnabled();
  });
});
```

#### 5. `e2e/sessions/calendar-view.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { createSession, createTrainer } from "../support/session-helpers";

test.describe("Training Sessions - Calendar View", () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    const trainerId = await createTrainer({ name: "John" });

    // Create multiple sessions on same day
    await createSession({
      trainerId,
      date: "2025-01-15",
      startTime: "09:00",
      endTime: "10:00",
    });

    await createSession({
      trainerId,
      date: "2025-01-15",
      startTime: "14:00",
      endTime: "15:00",
    });

    await createSession({
      trainerId,
      date: "2025-01-15",
      startTime: "16:00",
      endTime: "17:00",
    });

    await loginAsAdmin(page);
  });

  test("should display all sessions in calendar", async ({ page }) => {
    await page.goto("/training-sessions");

    // Navigate to January 15, 2025
    await page.getByLabel(/next month/i).click(); // Adjust based on current date

    // Find January 15 in calendar
    const dayCell = page.getByRole("gridcell", { name: "15" });

    // Should show 3 session indicators/blocks
    const sessionBlocks = dayCell.locator(".session-block"); // Adjust selector
    await expect(sessionBlocks).toHaveCount(3);
  });

  test("should show session details on click", async ({ page }) => {
    await page.goto("/training-sessions");

    // Click on first session block
    await page.locator(".session-block").first().click();

    // Should show popover/modal with details
    await expect(page.getByText(/john/i)).toBeVisible();
    await expect(page.getByText(/09:00.*10:00/i)).toBeVisible();
  });
});
```

#### 6. `e2e/support/session-helpers.ts`

```typescript
import { testSupabase } from "./database";
import { MemberFactory } from "../../src/test/factories/member-factory";

export async function createTrainer(options: { name: string }) {
  const { data } = await testSupabase
    .from("trainers")
    .insert({
      first_name: options.name.split(" ")[0],
      last_name: options.name.split(" ")[1] || "Trainer",
      email: `${options.name.toLowerCase().replace(" ", ".")}@gym.test`,
      specializations: ["strength_training"],
      is_active: true,
    })
    .select()
    .single();

  return data.id;
}

export async function createSession(options: {
  trainerId: string;
  date: string;
  startTime: string;
  endTime: string;
  machineId?: string;
}) {
  const { data } = await testSupabase
    .from("training_sessions")
    .insert({
      trainer_id: options.trainerId,
      scheduled_date: options.date,
      scheduled_start: `${options.date}T${options.startTime}:00`,
      scheduled_end: `${options.date}T${options.endTime}:00`,
      machine_id: options.machineId || null,
      status: "scheduled",
    })
    .select()
    .single();

  return data.id;
}

export async function createSessionWithMembers(options: {
  memberCount: number;
  sessionsRemaining: number;
}) {
  const trainerId = await createTrainer({ name: "Test Trainer" });

  const sessionId = await createSession({
    trainerId,
    date: "2025-01-15",
    startTime: "10:00",
    endTime: "11:00",
  });

  const memberIds: string[] = [];

  for (let i = 0; i < options.memberCount; i++) {
    // Create member with subscription
    const { data: member } = await testSupabase
      .from("members")
      .insert(MemberFactory.build())
      .select()
      .single();

    // Create subscription
    const { data: subscription } = await testSupabase
      .from("member_subscriptions")
      .insert({
        member_id: member.id,
        plan_id: "...", // Assume plan exists
        remaining_sessions: options.sessionsRemaining - 1, // Already used 1
        status: "active",
      })
      .select()
      .single();

    // Add member to session
    await testSupabase.from("training_session_members").insert({
      session_id: sessionId,
      member_id: member.id,
    });

    memberIds.push(member.id);
  }

  return { sessionId, memberIds };
}
```

---

## Testing Requirements

### Verification Steps

1. **Run session tests locally**

   ```bash
   npm run test:e2e e2e/sessions/
   ```

2. **Verify double booking prevention**
   - Test with overlapping times (10:00-11:00 vs 10:30-11:30)
   - Test with exact same times
   - Test with adjacent times (10:00-11:00 vs 11:00-12:00) - should allow

3. **Verify session credit restoration**
   - Book session (12 → 11)
   - Cancel session (11 → 12)
   - Verify member profile reflects changes

4. **Test calendar rendering**
   - Create 10 sessions in one month
   - Verify all appear correctly
   - Test navigation between months

---

## Definition of Done

- [ ] All 10 acceptance criteria met
- [ ] Book session test passing
- [ ] Cancel session test passing
- [ ] Prevent trainer double booking test passing
- [ ] Prevent machine double booking test passing
- [ ] Machine availability management test passing
- [ ] Calendar view test passing
- [ ] Filter sessions tests passing
- [ ] Add/remove member tests passing
- [ ] Session helpers created
- [ ] Tests pass in all browsers
- [ ] Tests run in <5 minutes
- [ ] No flaky tests (10 runs successful)
- [ ] Code reviewed and approved

---

## Implementation Notes

### Best Practices

1. **Test Conflict Detection**: Verify both trainer and machine conflicts
2. **Verify Credit Tracking**: Always check member session counts
3. **Use Helper Functions**: Reuse session creation utilities
4. **Test Calendar Logic**: Verify sessions appear on correct dates

### Common Pitfalls

- ❌ **Don't** skip time zone tests (sessions at midnight)
- ❌ **Don't** forget to test credit restoration on cancellation
- ❌ **Don't** assume calendar rendering (test with multiple sessions)
- ❌ **Don't** skip edge cases (same start/end time, back-to-back sessions)

### Critical Validations

- End time must be after start time
- Cannot book past dates
- Trainer cannot be double booked
- Machine cannot be double booked
- Member must have sessions remaining
- Session credits restore on cancellation

---

## Dependencies

**Requires**:

- US-001 (Playwright Infrastructure)
- US-002 (Auth Tests)
- US-003 (Member Management)
- US-005 (Subscriptions - for session tracking)

This completes Phase 1 critical e2e tests!
