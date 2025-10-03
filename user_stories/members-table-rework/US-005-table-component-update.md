# US-005: Table Component Updates for Enhanced Member Data

## User Story

**As a** gym manager or trainer
**I want** to see comprehensive member information in the members table
**So that** I can get a complete overview without navigating to detail pages

---

## Business Value

- **Efficiency**: 90% of information visible in table view
- **Reduced Clicks**: Fewer navigations to detail pages
- **Better Decision Making**: All relevant data at a glance

---

## Acceptance Criteria

### AC1: Add New Table Columns

**Given** I am viewing the members table
**When** the table renders
**Then** it should display these columns:

- Checkbox (existing)
- Member (Avatar + Name) (existing)
- Email (existing)
- Phone (existing)
- **NEW:** Gender
- **NEW:** Date of Birth
- **NEW:** Member Type
- Status (existing, make inline editable)
- **NEW:** Subscription End Date
- **NEW:** Last Session
- **NEW:** Next Session
- **NEW:** Remaining Sessions
- **NEW:** Scheduled Sessions
- **NEW:** Balance Due
- **NEW:** Last Payment
- Join Date (existing)
- Actions (existing)

### AC2: Responsive Column Visibility

**Given** I am viewing the table on different screen sizes
**When** the viewport width changes
**Then** columns should behave as follows:

- **Desktop (>1280px)**: Show all columns
- **Tablet (768px-1280px)**: Hide Gender, Date of Birth, Last Payment
- **Mobile (<768px)**: Show only Name, Status, Phone, Actions

### AC3: Column Sorting

**Given** I click on a sortable column header
**When** the sort is applied
**Then** it should:

- Sort server-side (not client-side)
- Toggle between ASC/DESC
- Show sort indicator icon
- Maintain sort while filtering

### AC4: Data Display

**Given** member data with various states
**When** rendering table cells
**Then** it should:

- Use helper components (DateCell, BalanceBadge, etc.)
- Handle NULL values gracefully (show "-" or "N/A")
- Format dates consistently
- Color-code badges appropriately
- Show tooltips on hover for badges

### AC5: Inline Status Editing

**Given** I have admin permissions
**When** I click on a member's status badge
**Then** it should:

- Show dropdown with status options
- Update status on selection
- Show loading state during update
- Update optimistically
- Rollback on error

### AC6: Performance

**Given** 1000+ members loaded
**When** I scroll through the table
**Then** it should:

- Render smoothly without lag
- Use React.memo for row components
- Use infinite scroll/pagination
- Load additional pages on demand

---

## Technical Implementation

### File: `src/features/members/components/AdvancedMemberTable.tsx`

**Key Changes:**

1. Update props to accept `MemberWithEnhancedDetails[]`
2. Add new table column headers
3. Add new table cells with helper components
4. Implement responsive column visibility
5. Update sort configuration for new columns

```typescript
import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { MemberAvatar } from "./MemberAvatar";
import { MemberStatusBadge } from "./MemberStatusBadge";
import {
  DateCell,
  SessionCountBadge,
  BalanceBadge,
  MemberTypeBadge,
} from "./cells";
import { cn } from "@/lib/utils";
import type { MemberWithEnhancedDetails, MemberStatus } from "@/features/database/lib/types";
import type { MemberFilters } from "@/features/database/lib/utils";

// Extended sort fields to include new columns
type SortField =
  | "name"
  | "email"
  | "status"
  | "join_date"
  | "phone"
  | "gender"
  | "date_of_birth"
  | "member_type"
  | "subscription_end_date"
  | "balance_due"
  | "last_payment_date";

interface AdvancedMemberTableProps {
  members?: MemberWithEnhancedDetails[]; // Updated type
  isLoading?: boolean;
  error?: Error | null;
  onEdit?: (member: MemberWithEnhancedDetails) => void;
  onView?: (member: MemberWithEnhancedDetails) => void;
  onMemberClick?: (member: MemberWithEnhancedDetails) => void;
  onMemberHover?: (member: MemberWithEnhancedDetails) => void;
  enableInfiniteScroll?: boolean;
  showActions?: boolean;
  className?: string;
}

const AdvancedMemberTable = memo(function AdvancedMemberTable({
  members = [],
  isLoading,
  error,
  onEdit,
  onView,
  onMemberClick,
  onMemberHover,
  enableInfiniteScroll = true,
  showActions = true,
  className,
}: AdvancedMemberTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: "asc" | "desc";
  }>({
    field: "name",
    direction: "asc",
  });

  const handleSort = useCallback((field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const SortButton = memo(function SortButton({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium hover:bg-transparent"
        onClick={() => handleSort(field)}
      >
        <span className="flex items-center gap-1">
          {children}
          {sortConfig.field === field ? (
            sortConfig.direction === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          )}
        </span>
      </Button>
    );
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">Failed to load members</p>
        <Button variant="outline">Try Again</Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {showActions && (
                <TableHead className="w-12">
                  <Checkbox aria-label="Select all members" />
                </TableHead>
              )}
              <TableHead className="min-w-[200px]">
                <SortButton field="name">Member</SortButton>
              </TableHead>
              <TableHead className="min-w-[200px]">
                <SortButton field="email">Email</SortButton>
              </TableHead>
              <TableHead>Phone</TableHead>

              {/* NEW COLUMNS */}
              <TableHead className="hidden xl:table-cell">
                <SortButton field="gender">Gender</SortButton>
              </TableHead>
              <TableHead className="hidden xl:table-cell">
                <SortButton field="date_of_birth">DOB</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="member_type">Type</SortButton>
              </TableHead>

              {/* Existing */}
              <TableHead>
                <SortButton field="status">Status</SortButton>
              </TableHead>

              {/* NEW COLUMNS */}
              <TableHead className="hidden lg:table-cell">
                <SortButton field="subscription_end_date">Sub End</SortButton>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Last Session</TableHead>
              <TableHead className="hidden lg:table-cell">Next Session</TableHead>
              <TableHead className="hidden lg:table-cell">Remaining</TableHead>
              <TableHead className="hidden lg:table-cell">Scheduled</TableHead>
              <TableHead className="hidden lg:table-cell">
                <SortButton field="balance_due">Balance</SortButton>
              </TableHead>
              <TableHead className="hidden xl:table-cell">
                <SortButton field="last_payment_date">Last Payment</SortButton>
              </TableHead>

              {/* Existing */}
              <TableHead>
                <SortButton field="join_date">Join Date</SortButton>
              </TableHead>
              {showActions && (
                <TableHead className="w-[120px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={17}
                  className="py-12 text-center text-muted-foreground"
                >
                  No members found
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow
                  key={member.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => onMemberClick?.(member)}
                  onMouseEnter={() => onMemberHover?.(member)}
                >
                  {showActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox aria-label={`Select ${member.first_name}`} />
                    </TableCell>
                  )}

                  {/* Member Name */}
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <MemberAvatar member={member} size="sm" />
                      <span className="font-medium">
                        {member.first_name} {member.last_name}
                      </span>
                    </div>
                  </TableCell>

                  {/* Email */}
                  <TableCell>
                    <div className="text-sm">{member.email}</div>
                  </TableCell>

                  {/* Phone */}
                  <TableCell>
                    <div className="text-muted-foreground text-sm">
                      {member.phone || "-"}
                    </div>
                  </TableCell>

                  {/* Gender */}
                  <TableCell className="hidden xl:table-cell">
                    <span className="capitalize text-sm">
                      {member.gender || "-"}
                    </span>
                  </TableCell>

                  {/* Date of Birth */}
                  <TableCell className="hidden xl:table-cell">
                    <DateCell date={member.date_of_birth} />
                  </TableCell>

                  {/* Member Type */}
                  <TableCell>
                    <MemberTypeBadge type={member.member_type as "full" | "trial"} />
                  </TableCell>

                  {/* Status */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <MemberStatusBadge
                      status={member.status}
                      memberId={member.id}
                      readonly={!showActions}
                    />
                  </TableCell>

                  {/* Subscription End Date */}
                  <TableCell className="hidden lg:table-cell">
                    <DateCell
                      date={member.active_subscription?.end_date || null}
                    />
                  </TableCell>

                  {/* Last Session */}
                  <TableCell className="hidden lg:table-cell">
                    <DateCell
                      date={member.session_stats?.last_session_date || null}
                      format="short"
                    />
                  </TableCell>

                  {/* Next Session */}
                  <TableCell className="hidden lg:table-cell">
                    <DateCell
                      date={member.session_stats?.next_session_date || null}
                      format="relative"
                    />
                  </TableCell>

                  {/* Remaining Sessions */}
                  <TableCell className="hidden lg:table-cell">
                    <SessionCountBadge
                      count={member.active_subscription?.remaining_sessions || 0}
                    />
                  </TableCell>

                  {/* Scheduled Sessions */}
                  <TableCell className="hidden lg:table-cell">
                    <SessionCountBadge
                      count={member.session_stats?.scheduled_sessions_count || 0}
                    />
                  </TableCell>

                  {/* Balance Due */}
                  <TableCell className="hidden lg:table-cell">
                    <BalanceBadge
                      amount={member.active_subscription?.balance_due || 0}
                    />
                  </TableCell>

                  {/* Last Payment */}
                  <TableCell className="hidden xl:table-cell">
                    <DateCell date={member.last_payment_date} />
                  </TableCell>

                  {/* Join Date */}
                  <TableCell>
                    <DateCell date={member.join_date} />
                  </TableCell>

                  {/* Actions */}
                  {showActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {/* Existing action buttons */}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

export { AdvancedMemberTable };
```

---

## Testing Criteria

### Unit Tests

**Test Suite 1: Column Rendering**

```typescript
it('should render all columns in desktop view', () => {
  const mockMembers: MemberWithEnhancedDetails[] = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      gender: 'male',
      date_of_birth: '1990-01-01',
      member_type: 'full',
      status: 'active',
      join_date: '2024-01-01',
      active_subscription: {
        end_date: '2024-12-31',
        remaining_sessions: 10,
        balance_due: 100,
      },
      session_stats: {
        last_session_date: '2024-01-15T10:00:00Z',
        next_session_date: '2024-01-20T14:00:00Z',
        scheduled_sessions_count: 3,
      },
      last_payment_date: '2024-01-01',
    },
  ];

  render(<AdvancedMemberTable members={mockMembers} />);

  // Verify all columns are rendered
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('john@example.com')).toBeInTheDocument();
  expect(screen.getByText('male')).toBeInTheDocument();
  // ... verify all other columns
});
```

**Test Suite 2: NULL Value Handling**

```typescript
it('should handle members with no subscription', () => {
  const mockMembers: MemberWithEnhancedDetails[] = [
    {
      id: '1',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      status: 'active',
      join_date: '2024-01-01',
      active_subscription: null,
      session_stats: null,
      last_payment_date: null,
    },
  ];

  render(<AdvancedMemberTable members={mockMembers} />);

  // Verify NULL values show placeholders
  const cells = screen.getAllByText('-');
  expect(cells.length).toBeGreaterThan(0);
});
```

**Test Suite 3: Sorting**

```typescript
it('should call sort handler when clicking sortable column', () => {
  const mockMembers: MemberWithEnhancedDetails[] = [];
  render(<AdvancedMemberTable members={mockMembers} />);

  const nameHeader = screen.getByText('Member');
  fireEvent.click(nameHeader);

  // Verify sort state changed (check for sort icons)
  expect(screen.getByTestId('sort-asc-icon')).toBeInTheDocument();
});
```

**Test Suite 4: Responsive Behavior**

```typescript
it('should hide columns on tablet', () => {
  // Mock window.matchMedia
  global.innerWidth = 800;

  render(<AdvancedMemberTable members={mockMembers} />);

  // Verify xl columns are hidden
  const genderColumn = screen.queryByText('Gender');
  expect(genderColumn).toHaveClass('hidden');
});
```

**Test Suite 5: Performance - React.memo**

```typescript
it('should not re-render when props unchanged', () => {
  const { rerender } = render(<AdvancedMemberTable members={mockMembers} />);

  const renderSpy = vi.spyOn(React, 'createElement');
  const callCount = renderSpy.mock.calls.length;

  // Re-render with same props
  rerender(<AdvancedMemberTable members={mockMembers} />);

  // Verify component did not re-render
  expect(renderSpy.mock.calls.length).toBe(callCount);
});
```

### Integration Tests

**Test Suite 6: End-to-End Table Display**

```typescript
it('should display complete member information', async () => {
  // Setup: Create test member with all data
  const testMember = await createTestMemberWithAllData();

  render(<MembersPage />);

  await waitFor(() => {
    expect(screen.getByText(testMember.email)).toBeInTheDocument();
  });

  // Verify all enhanced data is displayed
  expect(screen.getByText('Full')).toBeInTheDocument(); // Member type
  expect(screen.getByText(/sessions/)).toBeInTheDocument(); // Session count
  expect(screen.getByText(/\$/)).toBeInTheDocument(); // Balance
});
```

---

## Definition of Done

- [ ] All new table columns added
- [ ] Helper components integrated (DateCell, BalanceBadge, etc.)
- [ ] Responsive column visibility implemented
- [ ] Sorting works for all new columns
- [ ] NULL values handled gracefully
- [ ] Status badge remains inline editable
- [ ] All unit tests pass (5 test suites)
- [ ] Integration test passes
- [ ] Performance: Table renders <500ms with 1000+ members
- [ ] Accessibility: All columns have proper headers
- [ ] TypeScript compilation succeeds
- [ ] Component under 700 lines (split if needed)
- [ ] Code review completed
- [ ] Visual QA on desktop/tablet/mobile

---

## Notes

### Design Decisions

**Why responsive column hiding?**

- Prevents horizontal scroll hell on mobile
- Maintains usability across devices
- Follows mobile-first design principles

**Why server-side sorting?**

- Efficient for large datasets
- Consistent with performance guidelines
- Reduces client-side memory usage

**Why keep actions column?**

- Detail view still needed for complete information
- Editing requires form validation
- Deleting requires confirmation

### Dependencies

- US-002: Type definitions
- US-003: API integration
- US-004: Helper components

### Risks

- Wide table may be overwhelming (mitigated with column visibility controls in US-006)
- Performance with many columns (mitigated with React.memo and virtualization)

---

## Related User Stories

- US-004: Helper Components
- US-006: Filters and Column Visibility
- US-007: Testing and Polish
