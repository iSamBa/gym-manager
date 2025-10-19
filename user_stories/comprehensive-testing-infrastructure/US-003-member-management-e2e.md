# US-003: Member Management E2E Tests

**Phase**: Phase 1 - Infrastructure + Critical E2E Tests (Week 1-2)
**Priority**: P0 (Must Have)
**Estimated Effort**: 12 hours
**Dependencies**: US-001 (Infrastructure), US-002 (Auth Tests)

---

## User Story

**As a** gym administrator
**I want** reliable e2e tests for member management operations
**So that** member CRUD, search, filtering, and exports work correctly in production

---

## Business Value

Member management is the core of the gym business. Without reliable tests:

- New members could fail to be created correctly
- Search/filter could return wrong results
- Status updates could corrupt member data
- Export functionality could expose incomplete/wrong data

**Impact**: Protects member data integrity and admin workflows

---

## Detailed Acceptance Criteria

### AC1: Create New Member

- [ ] Test navigates to `/members/new`
- [ ] Test fills all required fields (first name, last name, email, phone, join date)
- [ ] Test fills optional fields (uniform size, vest size, belt size)
- [ ] Test selects member type and referral source
- [ ] Test checks waiver signed checkbox
- [ ] Test clicks "Create Member" button
- [ ] Test verifies redirect to member profile `/members/[id]`
- [ ] Test verifies success toast message
- [ ] Test navigates to `/members` and verifies new member appears in list

### AC2: Edit Existing Member

- [ ] Test navigates to existing member profile `/members/[id]`
- [ ] Test clicks "Edit" button
- [ ] Test modifies first name, phone number, and status
- [ ] Test clicks "Save Changes" button
- [ ] Test verifies success toast message
- [ ] Test verifies profile page shows updated data
- [ ] Test navigates to `/members` list and verifies changes reflected

### AC3: Search Members

- [ ] Test navigates to `/members`
- [ ] Test types member name in search input
- [ ] Test verifies filtered results show only matching members
- [ ] Test types phone number in search
- [ ] Test verifies partial matches work (e.g., "555" matches "+1555...")
- [ ] Test clears search and verifies all members return
- [ ] Test searches for non-existent member and verifies empty state

### AC4: Filter Members by Status

- [ ] Test navigates to `/members`
- [ ] Test clicks status filter dropdown
- [ ] Test selects "Active" status
- [ ] Test verifies only active members displayed
- [ ] Test verifies status badges show "Active"
- [ ] Test selects "Inactive" status
- [ ] Test verifies only inactive members displayed
- [ ] Test selects "All" and verifies all members return

### AC5: Filter Members by Type

- [ ] Test clicks member type filter
- [ ] Test selects "Full" type
- [ ] Test verifies only full members displayed
- [ ] Test selects "Part-time" type
- [ ] Test verifies only part-time members displayed
- [ ] Test combines with status filter (e.g., Active + Full)
- [ ] Test verifies combined filters work correctly

### AC6: Pagination

- [ ] Test seeds database with 30 members
- [ ] Test navigates to `/members`
- [ ] Test verifies first page shows 20 members (or configured limit)
- [ ] Test clicks "Next" button
- [ ] Test verifies second page shows remaining members
- [ ] Test verifies page indicator shows "Page 2 of 2"
- [ ] Test clicks "Previous" button and verifies first page

### AC7: Sort Members

- [ ] Test clicks "Join Date" column header
- [ ] Test verifies members sorted by join date ascending
- [ ] Test clicks "Join Date" again
- [ ] Test verifies members sorted descending
- [ ] Test sorts by "Name" alphabetically
- [ ] Test sorts by "Status"

### AC8: Export Members to CSV

- [ ] Test navigates to `/members`
- [ ] Test applies filters (e.g., Active members only)
- [ ] Test clicks "Export" or "Download CSV" button
- [ ] Test verifies download initiated
- [ ] Test verifies CSV file contains correct data
- [ ] Test verifies CSV includes all visible columns
- [ ] Test verifies filtered data exported (not all members)

### AC9: Bulk Status Update

- [ ] Test selects multiple members via checkboxes
- [ ] Test clicks "Bulk Actions" dropdown
- [ ] Test selects "Update Status"
- [ ] Test selects "Inactive" from status dropdown
- [ ] Test confirms action in dialog
- [ ] Test verifies success toast shows "X members updated"
- [ ] Test verifies all selected members now show "Inactive" badge

### AC10: View Member Details

- [ ] Test clicks on member name in list
- [ ] Test verifies redirect to `/members/[id]`
- [ ] Test verifies all member fields displayed correctly
- [ ] Test verifies profile sections: Personal Info, Subscriptions, Payments, Comments
- [ ] Test verifies active subscription displayed (if exists)
- [ ] Test verifies payment history shown
- [ ] Test verifies can add/edit comments

---

## Technical Implementation

### Files to Create

#### 1. `e2e/members/create-member.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, seedTestData } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { MemberFactory } from "../../src/test/factories/member-factory";

test.describe("Member Management - Create Member", () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase();
    await seedTestData();
    await loginAsAdmin(page);
  });

  test("should create new member with all required fields", async ({
    page,
  }) => {
    await page.goto("/members/new");

    const memberData = MemberFactory.build();

    // Fill form
    await page.getByLabel(/first name/i).fill(memberData.first_name);
    await page.getByLabel(/last name/i).fill(memberData.last_name);
    await page.getByLabel(/email/i).fill(memberData.email);
    await page.getByLabel(/phone/i).fill(memberData.phone);

    // Select member type
    await page.getByLabel(/member type/i).click();
    await page.getByRole("option", { name: /full/i }).click();

    // Select referral source
    await page.getByLabel(/referral source/i).click();
    await page.getByRole("option", { name: /website/i }).click();

    // Check waiver
    await page.getByLabel(/waiver signed/i).check();

    // Submit
    await page.getByRole("button", { name: /create member/i }).click();

    // Verify redirect to profile
    await expect(page).toHaveURL(/\/members\/[a-f0-9-]+/);

    // Verify success toast
    await expect(page.getByText(/member created successfully/i)).toBeVisible();

    // Verify data on profile page
    await expect(page.getByText(memberData.first_name)).toBeVisible();
    await expect(page.getByText(memberData.email)).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/members/new");

    // Try to submit empty form
    await page.getByRole("button", { name: /create member/i }).click();

    // Verify validation errors
    await expect(page.getByText(/first name.*required/i)).toBeVisible();
    await expect(page.getByText(/last name.*required/i)).toBeVisible();
    await expect(page.getByText(/email.*required/i)).toBeVisible();
  });

  test("should validate email format", async ({ page }) => {
    await page.goto("/members/new");

    await page.getByLabel(/email/i).fill("invalid-email");
    await page.getByLabel(/first name/i).click(); // Trigger blur

    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });
});
```

#### 2. `e2e/members/search-filter.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, testSupabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { MemberFactory } from "../../src/test/factories/member-factory";

test.describe("Member Management - Search & Filter", () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    // Create test members with specific data
    await testSupabase
      .from("members")
      .insert([
        MemberFactory.build({
          first_name: "John",
          last_name: "Doe",
          status: "active",
        }),
        MemberFactory.build({
          first_name: "Jane",
          last_name: "Smith",
          status: "inactive",
        }),
        MemberFactory.build({
          first_name: "Bob",
          last_name: "Johnson",
          status: "active",
        }),
      ]);

    await loginAsAdmin(page);
  });

  test("should search members by name", async ({ page }) => {
    await page.goto("/members");

    // Wait for members to load
    await expect(page.getByText("John Doe")).toBeVisible();

    // Search for "John"
    await page.getByPlaceholder(/search/i).fill("John");

    // Should show only John Doe
    await expect(page.getByText("John Doe")).toBeVisible();
    await expect(page.getByText("Jane Smith")).not.toBeVisible();
    await expect(page.getByText("Bob Johnson")).not.toBeVisible();
  });

  test("should filter by status", async ({ page }) => {
    await page.goto("/members");

    // Click status filter
    await page.getByLabel(/status/i).click();
    await page.getByRole("option", { name: /^active$/i }).click();

    // Should show only active members
    await expect(page.getByText("John Doe")).toBeVisible();
    await expect(page.getByText("Bob Johnson")).toBeVisible();
    await expect(page.getByText("Jane Smith")).not.toBeVisible();
  });

  test("should combine search and filter", async ({ page }) => {
    await page.goto("/members");

    // Apply status filter
    await page.getByLabel(/status/i).click();
    await page.getByRole("option", { name: /active/i }).click();

    // Search within filtered results
    await page.getByPlaceholder(/search/i).fill("John");

    // Should show only John Doe (active + name match)
    await expect(page.getByText("John Doe")).toBeVisible();
    await expect(page.getByText("Bob Johnson")).not.toBeVisible();
  });

  test("should show empty state when no matches", async ({ page }) => {
    await page.goto("/members");

    await page.getByPlaceholder(/search/i).fill("NonExistentMember");

    await expect(page.getByText(/no members found/i)).toBeVisible();
  });
});
```

#### 3. `e2e/members/edit-member.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, testSupabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { MemberFactory } from "../../src/test/factories/member-factory";

test.describe("Member Management - Edit Member", () => {
  let memberId: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    // Create test member
    const { data } = await testSupabase
      .from("members")
      .insert(
        MemberFactory.build({ first_name: "Original", last_name: "Name" })
      )
      .select()
      .single();

    memberId = data.id;
    await loginAsAdmin(page);
  });

  test("should edit member details", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    // Click edit button
    await page.getByRole("button", { name: /edit/i }).click();

    // Modify fields
    await page.getByLabel(/first name/i).fill("Updated");
    await page.getByLabel(/phone/i).fill("+1987654321");

    // Save changes
    await page.getByRole("button", { name: /save/i }).click();

    // Verify success
    await expect(page.getByText(/updated successfully/i)).toBeVisible();

    // Verify changes reflected
    await expect(page.getByText("Updated")).toBeVisible();
    await expect(page.getByText("+1987654321")).toBeVisible();
  });

  test("should update member status", async ({ page }) => {
    await page.goto(`/members/${memberId}`);

    await page.getByRole("button", { name: /edit/i }).click();

    // Change status
    await page.getByLabel(/status/i).click();
    await page.getByRole("option", { name: /inactive/i }).click();

    await page.getByRole("button", { name: /save/i }).click();

    // Verify status badge updated
    await expect(page.getByText(/inactive/i)).toBeVisible();
  });
});
```

#### 4. `e2e/members/bulk-operations.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, testSupabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { MemberFactory } from "../../src/test/factories/member-factory";

test.describe("Member Management - Bulk Operations", () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    // Create multiple test members
    await testSupabase
      .from("members")
      .insert([
        MemberFactory.build({ first_name: "Member1", status: "active" }),
        MemberFactory.build({ first_name: "Member2", status: "active" }),
        MemberFactory.build({ first_name: "Member3", status: "active" }),
      ]);

    await loginAsAdmin(page);
  });

  test("should update status for multiple members", async ({ page }) => {
    await page.goto("/members");

    // Select first two members
    const checkboxes = page.getByRole("checkbox", { name: /select member/i });
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    // Open bulk actions
    await page.getByRole("button", { name: /bulk actions/i }).click();
    await page.getByRole("menuitem", { name: /update status/i }).click();

    // Select new status
    await page.getByLabel(/new status/i).click();
    await page.getByRole("option", { name: /inactive/i }).click();

    // Confirm
    await page.getByRole("button", { name: /confirm/i }).click();

    // Verify success
    await expect(page.getByText(/2 members updated/i)).toBeVisible();

    // Verify status badges updated
    const inactiveBadges = page.getByText(/inactive/i);
    await expect(inactiveBadges).toHaveCount(2);
  });
});
```

#### 5. `e2e/members/export.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { resetDatabase, testSupabase } from "../support/database";
import { loginAsAdmin } from "../support/auth-helpers";
import { MemberFactory } from "../../src/test/factories/member-factory";

test.describe("Member Management - Export", () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase();

    await testSupabase
      .from("members")
      .insert([
        MemberFactory.build({ first_name: "Export1", status: "active" }),
        MemberFactory.build({ first_name: "Export2", status: "inactive" }),
      ]);

    await loginAsAdmin(page);
  });

  test("should export filtered members to CSV", async ({ page }) => {
    await page.goto("/members");

    // Apply filter
    await page.getByLabel(/status/i).click();
    await page.getByRole("option", { name: /active/i }).click();

    // Start download
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /export|download/i }).click();
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain(".csv");

    // Read and verify CSV content
    const path = await download.path();
    const fs = require("fs");
    const csvContent = fs.readFileSync(path, "utf-8");

    // Should include Export1 (active) but not Export2 (inactive)
    expect(csvContent).toContain("Export1");
    expect(csvContent).not.toContain("Export2");
  });
});
```

---

## Testing Requirements

### Verification Steps

1. **Run member tests locally**

   ```bash
   npm run test:e2e e2e/members/
   ```

2. **Verify with real data**
   - Manually create a member through UI
   - Run edit tests on that member
   - Verify data consistency

3. **Test pagination with large dataset**

   ```bash
   # Seed 50 members
   npm run test:e2e e2e/members/pagination.spec.ts
   ```

4. **Verify export functionality**
   - Check CSV file format
   - Verify all columns included
   - Test with different filters

---

## Definition of Done

- [ ] All 10 acceptance criteria met
- [ ] Create member test passing
- [ ] Edit member test passing
- [ ] Search tests passing
- [ ] Filter tests passing (status, type)
- [ ] Pagination tests passing
- [ ] Sort tests passing
- [ ] Export CSV test passing
- [ ] Bulk operations test passing
- [ ] View details test passing
- [ ] Tests pass in all browsers
- [ ] Tests run in <5 minutes
- [ ] No flaky tests (10 runs successful)
- [ ] Code reviewed and approved

---

## Implementation Notes

### Best Practices

1. **Use Factories**: Generate test data with MemberFactory
2. **Seed Specific Data**: Create members with known attributes for testing
3. **Test Real Interactions**: Don't mock member API calls
4. **Wait for UI Updates**: Use `waitForSelector` after actions

### Common Pitfalls

- ❌ **Don't** assume list order without explicit sorting
- ❌ **Don't** hardcode member IDs (use seeded data)
- ❌ **Don't** test with single member (test edge cases: 0, 1, many)
- ❌ **Don't** skip CSV validation (verify actual file content)

### Performance Considerations

- Seed only required members (don't create 1000 for pagination test)
- Use database inserts instead of UI for bulk seeding
- Clear database between tests to avoid slowdown

---

## Dependencies

**Requires**:

- US-001 (Playwright Infrastructure)
- US-002 (Auth Tests - uses loginAsAdmin helper)

## Blocks

None - this is a standalone feature test suite
