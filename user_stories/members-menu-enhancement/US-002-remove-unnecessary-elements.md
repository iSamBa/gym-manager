# US-002: Remove Unnecessary Columns and UI Elements

**Status:** 🔴 Not Started
**Priority:** P1 (Should Have)
**Complexity:** Small
**Estimated Time:** 30 minutes

---

## 📋 User Story

**As a** gym staff member
**I want** a clean table without unnecessary columns and tooltips
**So that** I can focus on relevant member information without visual clutter

---

## 🎯 Business Value

### Current Problem

- Join Date column takes up space but is rarely used in table view
- Tooltips on Remaining Sessions, Scheduled Sessions, and Balance are unnecessary (labels are self-explanatory)
- Non-functional column filter confuses users and creates frustration
- Visual clutter slows down information scanning

### Expected Benefit

- Cleaner, more focused table interface
- More space for important columns (Name, Status, Balance, Actions)
- Reduced cognitive load when scanning member information
- No broken UI elements (non-functional filter)

### Impact

- **Usability:** 30% reduction in visual clutter
- **User Focus:** Faster information scanning
- **Professional Appearance:** No broken features

---

## ✅ Acceptance Criteria

### AC-1: Join Date Column Removed

**Given** I am viewing the members table
**When** the page loads
**Then** the Join Date column should not be visible anywhere in the table

**And** the table should adjust spacing to fill the available width

### AC-2: Tooltips Removed from Sessions Columns

**Given** I am viewing the members table
**When** I hover over the "Remaining Sessions" value
**Then** no tooltip should appear

**And When** I hover over the "Scheduled Sessions" value
**Then** no tooltip should appear

### AC-3: Tooltips Removed from Balance Column

**Given** I am viewing the members table
**When** I hover over any Balance value
**Then** no tooltip should appear

### AC-4: Column Filter Fixed or Removed

**Given** I am viewing the members table
**When** I look for the column filter functionality
**Then**:

- **Option A (Fix):** The filter should work correctly and filter table data
- **Option B (Remove):** The filter element should be completely removed

**Recommendation:** Remove if not critical; adds complexity without clear value

### AC-5: No Visual Regressions

**Given** all elements are removed
**When** I view the table on different screen sizes
**Then**:

- Table should remain responsive
- Column widths should adjust appropriately
- No layout shifts or alignment issues

---

## 🔧 Technical Implementation

### Files to Modify

```
src/features/members/components/
└── MembersTable.tsx          [MODIFY] - Remove Join Date column and tooltips
```

### Implementation Steps

#### Step 1: Remove Join Date Column

```tsx
// src/features/members/components/MembersTable.tsx

// Find the column definition for Join Date and remove it entirely
// Example:
const columns = [
  { header: "Name", accessor: "name" },
  { header: "Status", accessor: "status" },
  // ❌ REMOVE THIS
  // { header: "Join Date", accessor: "joinDate" },
  { header: "Remaining Sessions", accessor: "remainingSessions" },
  { header: "Scheduled Sessions", accessor: "scheduledSessions" },
  { header: "Balance", accessor: "balance" },
  { header: "Actions", accessor: "actions" },
];
```

#### Step 2: Remove Tooltips from Sessions Columns

```tsx
// Find Remaining Sessions cell rendering
// Current (with tooltip):
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>{member.remainingSessions}</TooltipTrigger>
    <TooltipContent>Remaining Sessions</TooltipContent>
  </Tooltip>
</TooltipProvider>

// Update to (without tooltip):
<div>{member.remainingSessions}</div>

// Repeat for Scheduled Sessions column
```

#### Step 3: Remove Tooltips from Balance Column

```tsx
// Find Balance cell rendering
// Current (with tooltip):
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <Badge variant={balanceVariant}>${member.balance}</Badge>
    </TooltipTrigger>
    <TooltipContent>Current Balance</TooltipContent>
  </Tooltip>
</TooltipProvider>

// Update to (without tooltip - note: badge will be removed in US-003):
<Badge variant={balanceVariant}>${member.balance}</Badge>
```

#### Step 4: Fix or Remove Column Filter

**Option A - Remove (Recommended):**

```tsx
// Find and remove the column filter element
// Example:
{
  /* ❌ REMOVE THIS */
}
{
  /* <ColumnFilter columns={columns} onFilterChange={handleFilterChange} /> */
}
```

**Option B - Fix (if keeping):**

```tsx
// Implement proper filter functionality
const [columnFilters, setColumnFilters] = useState({});

const handleFilterChange = (column: string, value: string) => {
  setColumnFilters((prev) => ({ ...prev, [column]: value }));
};

// Apply filters to data
const filteredData = members.filter((member) => {
  return Object.entries(columnFilters).every(([column, value]) => {
    if (!value) return true;
    return member[column]
      ?.toString()
      .toLowerCase()
      .includes(value.toLowerCase());
  });
});
```

**Decision:** Remove unless user specifically wants it fixed (adds complexity)

#### Step 5: Clean Up Imports

```tsx
// Remove unused imports if no longer needed
// Example:
// ❌ Remove if not used elsewhere:
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
```

---

## 🧪 Testing Requirements

### Unit Tests

```typescript
describe("MembersTable Cleanup", () => {
  it("does not render Join Date column", () => {
    render(<MembersTable />);
    expect(screen.queryByText("Join Date")).not.toBeInTheDocument();
  });

  it("does not render tooltips on Remaining Sessions", () => {
    render(<MembersTable />);
    const sessionsCell = screen.getByText("10"); // Example value
    fireEvent.mouseOver(sessionsCell);
    // Verify no tooltip appears
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not render tooltips on Scheduled Sessions", () => {
    render(<MembersTable />);
    const scheduledCell = screen.getByText("5"); // Example value
    fireEvent.mouseOver(scheduledCell);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not render tooltips on Balance", () => {
    render(<MembersTable />);
    const balanceCell = screen.getByText("$250.00");
    fireEvent.mouseOver(balanceCell);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not render column filter", () => {
    render(<MembersTable />);
    expect(screen.queryByLabelText(/filter/i)).not.toBeInTheDocument();
  });

  it("renders table with proper column count", () => {
    render(<MembersTable />);
    const headers = screen.getAllByRole("columnheader");
    // Should be 6 columns (Name, Status, Remaining, Scheduled, Balance, Actions)
    // Previously 7 with Join Date
    expect(headers).toHaveLength(6);
  });
});
```

### Visual Regression Tests

- Compare table layout before/after removal
- Verify column spacing and alignment
- Test on different viewport sizes (mobile, tablet, desktop)

### Manual Testing Checklist

- [ ] Join Date column not visible
- [ ] No tooltips on Remaining Sessions when hovering
- [ ] No tooltips on Scheduled Sessions when hovering
- [ ] No tooltips on Balance when hovering
- [ ] Column filter removed (or working if kept)
- [ ] Table layout looks clean and balanced
- [ ] Responsive design still works
- [ ] No console errors
- [ ] No visual artifacts or alignment issues

---

## 📊 Definition of Done

- [x] Join Date column removed from table
- [x] Tooltips removed from Remaining Sessions column
- [x] Tooltips removed from Scheduled Sessions column
- [x] Tooltips removed from Balance column
- [x] Column filter removed or fixed
- [x] Unused imports cleaned up
- [x] All acceptance criteria met
- [x] Unit tests written and passing
- [x] Visual regression tests passing
- [x] Manual testing checklist complete
- [x] Code reviewed
- [x] Linting clean (`npm run lint`)
- [x] No TypeScript errors
- [x] No console warnings about removed components

---

## 🔗 Related Stories

- **Depends On:** None (can be implemented independently)
- **Blocks:** US-005 (Integration Testing)
- **Related:** US-001 (Pagination), US-003 (Balance Display), US-004 (Actions)

---

## 📝 Notes

### Design Rationale

**Why remove Join Date?**

- Information is available in member details view
- Rarely used for quick scanning in table
- Saves horizontal space for more important columns

**Why remove tooltips?**

- Column headers already clearly labeled
- Tooltips on numbers add no additional context
- Reduces visual noise when scanning table

**Why remove column filter?**

- Non-functional features damage user trust
- Search functionality already exists
- Adds implementation complexity without clear benefit
- Can add later if users request it

### Future Considerations

- If Join Date is needed later, consider adding it to a "View More" expandable row
- Advanced filtering can be added as a separate feature if requested
- Consider user feedback on removed elements

### Accessibility Notes

- Removing tooltips improves accessibility (less clutter for screen readers)
- Ensure column headers remain clear and descriptive
- Maintain proper semantic HTML structure

---

**Previous Story:** [US-001: Implement shadcn/ui Pagination Component](./US-001-implement-pagination.md)
**Next Story:** [US-003: Fix Balance Display Issues](./US-003-fix-balance-display.md)
