# US-001: Implement shadcn/ui Pagination Component

**Status:** 🔴 Not Started
**Priority:** P0 (Must Have)
**Complexity:** Medium
**Estimated Time:** 1-2 hours

---

## 📋 User Story

**As a** gym administrator
**I want** page-based pagination with navigation controls
**So that** I can efficiently browse through member lists and jump to specific pages

---

## 🎯 Business Value

### Current Problem

- "Load More" button requires multiple clicks to reach distant records
- No way to jump to specific pages
- No control over rows per page
- Inefficient for large member lists (100+ members)

### Expected Benefit

- Quick navigation to any page with First/Previous/Next/Last buttons
- Customizable rows per page (10, 20, 30, 50)
- Better user experience matching modern web applications
- Reduced clicks and time to find specific members

### Impact

- **Time Savings:** 50% reduction in navigation clicks
- **User Satisfaction:** Modern, expected pagination pattern
- **Scalability:** Handles large datasets efficiently

---

## ✅ Acceptance Criteria

### AC-1: Pagination Component Displays

**Given** I am viewing the members table
**When** the page loads
**Then** I should see a pagination component at the bottom with:

- "Rows per page" selector dropdown
- Current page indicator (e.g., "Page 1 of 7")
- Navigation buttons (First, Previous, Next, Last)
- Row selection counter (e.g., "0 of 68 row(s) selected")

### AC-2: Rows Per Page Selector Works

**Given** the pagination component is displayed
**When** I select a different rows per page option (10, 20, 30, 50)
**Then** the table should:

- Update to show the selected number of rows
- Reset to page 1
- Update the page count indicator

### AC-3: Page Navigation Works

**Given** I am on page 2 of 5
**When** I click navigation buttons
**Then**:

- "Next" button takes me to page 3
- "Previous" button takes me to page 1
- "First" button takes me to page 1
- "Last" button takes me to page 5

### AC-4: Navigation Button States

**Given** I am viewing the members table
**When** I am on the first page
**Then** "First" and "Previous" buttons should be disabled

**When** I am on the last page
**Then** "Next" and "Last" buttons should be disabled

### AC-5: Performance Maintained

**Given** the new pagination is implemented
**When** I navigate between pages
**Then**:

- Server-side pagination should still be used (not client-side filtering)
- Page transitions should take < 500ms
- Data should be fetched only for the current page
- Performance should match or exceed current "Load More" implementation

---

## 🔧 Technical Implementation

### Files to Modify

```
src/features/members/components/
└── MembersTable.tsx          [MODIFY] - Replace "Load More" with Pagination

src/features/members/hooks/
└── useMembers.ts             [POSSIBLY MODIFY] - Update for page-based queries

src/components/ui/
└── pagination.tsx            [INSTALL] - shadcn/ui component (if not exists)
```

### Implementation Steps

#### Step 1: Install shadcn/ui Pagination Component

```bash
# Check if pagination component exists
ls src/components/ui/pagination.tsx

# If not, install it
npx shadcn@latest add pagination
```

#### Step 2: Update MembersTable Component

```tsx
// src/features/members/components/MembersTable.tsx

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Add state for pagination
const [page, setPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(50);

// Update useMembers hook call
const { data, isLoading } = useMembers({
  page,
  limit: rowsPerPage,
  // ... other params
});

// Replace "Load More" button with Pagination component
<Pagination>
  <PaginationContent>
    {/* Row selection counter */}
    <div className="text-muted-foreground text-sm">
      {selectedCount} of {totalRows} row(s) selected.
    </div>

    {/* Rows per page selector */}
    <div className="flex items-center gap-2">
      <span className="text-sm">Rows per page</span>
      <Select
        value={String(rowsPerPage)}
        onValueChange={(value) => {
          setRowsPerPage(Number(value));
          setPage(1); // Reset to first page
        }}
      >
        <SelectTrigger className="w-[70px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="30">30</SelectItem>
          <SelectItem value="50">50</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Page indicator */}
    <div className="text-sm">
      Page {page} of {totalPages}
    </div>

    {/* Navigation buttons */}
    <PaginationItem>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(1)}
        disabled={page === 1}
      >
        First
      </Button>
    </PaginationItem>

    <PaginationPrevious
      onClick={() => setPage((p) => Math.max(1, p - 1))}
      disabled={page === 1}
    />

    <PaginationNext
      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      disabled={page === totalPages}
    />

    <PaginationItem>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(totalPages)}
        disabled={page === totalPages}
      >
        Last
      </Button>
    </PaginationItem>
  </PaginationContent>
</Pagination>;
```

#### Step 3: Update useMembers Hook (if needed)

```tsx
// src/features/members/hooks/useMembers.ts

// Check current implementation - if using infinite query, might need to switch to regular query
// Current implementation likely already supports page/limit parameters

export function useMembers({ page = 1, limit = 50, ...filters }) {
  return useQuery({
    queryKey: ["members", { page, limit, ...filters }],
    queryFn: () => fetchMembers({ page, limit, ...filters }),
  });
}
```

#### Step 4: Update API Call (if needed)

Ensure the Supabase query supports pagination:

```typescript
// Example pagination query
const { data, error, count } = await supabase
  .from("members")
  .select("*", { count: "exact" })
  .range((page - 1) * limit, page * limit - 1);

return {
  members: data,
  totalCount: count,
  totalPages: Math.ceil(count / limit),
};
```

### Design Reference

Follow the shadcn/ui table pagination example:
https://ui.shadcn.com/docs/components/table

Visual reference from user's screenshot:

- Left side: "0 of 68 row(s) selected"
- Center: "Rows per page" dropdown + "Page 1 of 7"
- Right side: Navigation buttons (<<, <, >, >>)

---

## 🧪 Testing Requirements

### Unit Tests

```typescript
describe("MembersTable Pagination", () => {
  it("displays pagination component", () => {
    render(<MembersTable />);
    expect(screen.getByText(/Rows per page/i)).toBeInTheDocument();
    expect(screen.getByText(/Page \d+ of \d+/i)).toBeInTheDocument();
  });

  it("changes rows per page", () => {
    render(<MembersTable />);
    const selector = screen.getByRole("combobox");
    fireEvent.change(selector, { target: { value: "20" } });
    expect(selector).toHaveValue("20");
  });

  it("disables First/Previous on first page", () => {
    render(<MembersTable />);
    expect(screen.getByText("First")).toBeDisabled();
    expect(screen.getByLabelText("Previous")).toBeDisabled();
  });

  it("disables Next/Last on last page", () => {
    // Mock data to simulate last page
    render(<MembersTable />);
    // Navigate to last page
    expect(screen.getByText("Last")).toBeDisabled();
    expect(screen.getByLabelText("Next")).toBeDisabled();
  });
});
```

### Integration Tests

- Test pagination with realistic data (100+ members)
- Verify server-side fetching (only current page loaded)
- Test navigation between pages
- Test rows per page change resets to page 1
- Verify performance (< 500ms page transitions)

### Manual Testing Checklist

- [ ] Pagination component displays correctly
- [ ] Rows per page selector works (10, 20, 30, 50)
- [ ] First/Previous buttons disabled on first page
- [ ] Next/Last buttons disabled on last page
- [ ] Page navigation works in both directions
- [ ] Page indicator updates correctly
- [ ] Row selection counter displays
- [ ] Performance matches current implementation
- [ ] No visual regressions

---

## 📊 Definition of Done

- [x] shadcn/ui Pagination component installed
- [x] "Load More" button removed from MembersTable
- [x] Pagination component integrated and functional
- [x] All acceptance criteria met
- [x] Unit tests written and passing
- [x] Integration tests passing
- [x] Manual testing checklist complete
- [x] Performance benchmarks met (≤ current implementation)
- [x] Code reviewed
- [x] Linting clean (`npm run lint`)
- [x] No TypeScript errors
- [x] No console errors in browser

---

## 🔗 Related Stories

- **Blocks:** US-005 (Integration Testing)
- **Related:** US-002, US-003, US-004 (all table improvements)

---

## 📝 Notes

### Performance Considerations

- Maintain server-side pagination (do not load all members)
- Use React.memo for pagination component if re-rendering is an issue
- Consider caching previous pages for faster back navigation

### Accessibility

- Ensure navigation buttons have proper ARIA labels
- Keyboard navigation should work (Tab, Enter)
- Screen readers should announce page changes

### Edge Cases

- Single page (< rowsPerPage members) - disable all navigation
- Empty table - show pagination but all disabled
- Error state - show error message, hide pagination

---

**Next Story:** [US-002: Remove Unnecessary Columns and UI Elements](./US-002-remove-unnecessary-elements.md)
