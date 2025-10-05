# US-004: Refactor Row Actions

**Status:** ✅ Completed
**Priority:** P0 (Must Have)
**Complexity:** Medium
**Estimated Time:** 2-3 hours
**Actual Time:** 3 hours
**Completed:** 2025-10-05

---

## 📋 User Story

**As a** gym staff member
**I want** quick action buttons for common tasks in the members table
**So that** I can add sessions or payments without navigating to the details view

---

## 🎯 Business Value

### Current Problem

- View action is redundant (clicking row already opens details)
- Edit and Delete actions should be in details view only (more context, safer)
- Common tasks (add session, add payment) require navigating to details first
- Extra clicks slow down staff workflow
- Cluttered action dropdown with redundant options

### Expected Benefit

- Streamlined actions focused on quick operations
- Reduced clicks for common tasks (add session/payment)
- Safer edit/delete operations (details view has more context)
- Improved staff efficiency for high-frequency tasks
- Cleaner, more purposeful action menu

### Impact

- **Time Savings:** 50% reduction in clicks for add session/payment
- **Safety:** Edit/Delete require viewing full details first
- **Efficiency:** Common tasks directly accessible from table
- **User Experience:** Clear, focused action options

---

## ✅ Acceptance Criteria

### AC-1: View Action Removed from Table

**Given** I am viewing the members table
**When** I look at the row actions
**Then** there should be no "View" action in the dropdown/menu

**And** clicking the row itself should still open the member details view

### AC-2: Edit Action Removed from Table

**Given** I am viewing the members table row actions
**When** I open the actions dropdown
**Then** there should be no "Edit" action visible

### AC-3: Delete Action Removed from Table

**Given** I am viewing the members table row actions
**When** I open the actions dropdown
**Then** there should be no "Delete" action visible

### AC-4: Add Session Quick Action Available

**Given** I am viewing the members table
**When** I look at the row actions
**Then** I should see an "Add Session" action

**And When** I click "Add Session"
**Then** it should open the add session modal/form for that specific member

### AC-5: Add Payment Quick Action Available

**Given** I am viewing the members table
**When** I look at the row actions
**Then** I should see an "Add Payment" action

**And When** I click "Add Payment"
**Then** it should open the add payment modal/form for that specific member

### AC-6: Edit and Delete Available in Details View

**Given** I have opened a member's details view
**When** I look at the available actions
**Then** I should see both "Edit" and "Delete" actions available

**And** these should be the primary way to edit or delete a member

### AC-7: Quick Actions Functionality

**Given** I click "Add Session" or "Add Payment" from table
**When** the modal/form opens
**Then**:

- The member should be pre-selected
- The form should be ready for data entry
- I can complete the action without navigating away
- On success, the table should refresh to show updated data

---

## 🔧 Technical Implementation

### Files to Modify

```
src/features/members/components/
├── MembersTable.tsx              [MODIFY] - Update row actions
├── AddSessionButton.tsx          [CREATE] - Add Session quick action
└── AddPaymentButton.tsx          [CREATE] - Add Payment quick action
```

### Files to Reference

```
src/features/sessions/
└── components/                   [REFERENCE] - Session form/modal

src/features/payments/
└── components/                   [REFERENCE] - Payment form/modal
```

### Implementation Steps

#### Step 1: Remove View, Edit, Delete Actions from Table

```tsx
// src/features/members/components/MembersTable.tsx

// Current row actions (example):
const rowActions = [
  {
    label: "View",
    icon: Eye,
    onClick: (member) => router.push(`/members/${member.id}`),
  },
  {
    label: "Edit",
    icon: Pencil,
    onClick: (member) => openEditModal(member),
  },
  {
    label: "Delete",
    icon: Trash,
    onClick: (member) => openDeleteDialog(member),
  },
];

// Updated row actions (remove above, add new):
const rowActions = [
  {
    label: "Add Session",
    icon: Calendar,
    onClick: (member) => openAddSessionModal(member),
  },
  {
    label: "Add Payment",
    icon: DollarSign,
    onClick: (member) => openAddPaymentModal(member),
  },
];
```

#### Step 2: Ensure Row Click Opens Details

```tsx
// Verify row click handler exists and works
const handleRowClick = (member: Member) => {
  router.push(`/members/${member.id}`);
  // Or navigate to details view
};

<TableRow
  className="hover:bg-muted/50 cursor-pointer"
  onClick={() => handleRowClick(member)}
>
  {/* Table cells */}
</TableRow>;
```

#### Step 3: Create AddSessionButton Component

```tsx
// src/features/members/components/AddSessionButton.tsx

"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddSessionForm } from "@/features/sessions/components/AddSessionForm";
import { Member } from "../types";

interface AddSessionButtonProps {
  member: Member;
  onSuccess?: () => void;
}

export function AddSessionButton({ member, onSuccess }: AddSessionButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.(); // Refresh table data
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Calendar className="mr-2 h-4 w-4" />
          Add Session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Session for {member.name}</DialogTitle>
          <DialogDescription>
            Schedule a new session for this member
          </DialogDescription>
        </DialogHeader>
        <AddSessionForm
          memberId={member.id}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

#### Step 4: Create AddPaymentButton Component

```tsx
// src/features/members/components/AddPaymentButton.tsx

"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddPaymentForm } from "@/features/payments/components/AddPaymentForm";
import { Member } from "../types";

interface AddPaymentButtonProps {
  member: Member;
  onSuccess?: () => void;
}

export function AddPaymentButton({ member, onSuccess }: AddPaymentButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.(); // Refresh table data
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <DollarSign className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment for {member.name}</DialogTitle>
          <DialogDescription>
            Record a new payment from this member
          </DialogDescription>
        </DialogHeader>
        <AddPaymentForm
          memberId={member.id}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

#### Step 5: Integrate Quick Actions into Table

```tsx
// src/features/members/components/MembersTable.tsx

import { AddSessionButton } from "./AddSessionButton";
import { AddPaymentButton } from "./AddPaymentButton";

// In actions column cell:
{
  accessorKey: "actions",
  header: "Actions",
  cell: ({ row }) => {
    const member = row.original;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <AddSessionButton
              member={member}
              onSuccess={() => refetch()} // Refresh table
            />
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <AddPaymentButton
              member={member}
              onSuccess={() => refetch()} // Refresh table
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
}
```

#### Step 6: Verify Edit/Delete in Details View

```tsx
// Check member details page (e.g., src/app/members/[id]/page.tsx)
// Ensure Edit and Delete actions are present

// Example:
<div className="flex gap-2">
  <Button onClick={() => setEditMode(true)}>
    <Pencil className="mr-2 h-4 w-4" />
    Edit
  </Button>
  <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
    <Trash className="mr-2 h-4 w-4" />
    Delete
  </Button>
</div>
```

---

## 🧪 Testing Requirements

### Unit Tests

```typescript
describe("MembersTable Row Actions", () => {
  it("does not show View action in row actions", () => {
    render(<MembersTable />);
    const actionButton = screen.getAllByRole("button", { name: /open menu/i })[0];
    fireEvent.click(actionButton);

    expect(screen.queryByText("View")).not.toBeInTheDocument();
  });

  it("does not show Edit action in row actions", () => {
    render(<MembersTable />);
    const actionButton = screen.getAllByRole("button", { name: /open menu/i })[0];
    fireEvent.click(actionButton);

    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("does not show Delete action in row actions", () => {
    render(<MembersTable />);
    const actionButton = screen.getAllByRole("button", { name: /open menu/i })[0];
    fireEvent.click(actionButton);

    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("shows Add Session action in row actions", () => {
    render(<MembersTable />);
    const actionButton = screen.getAllByRole("button", { name: /open menu/i })[0];
    fireEvent.click(actionButton);

    expect(screen.getByText("Add Session")).toBeInTheDocument();
  });

  it("shows Add Payment action in row actions", () => {
    render(<MembersTable />);
    const actionButton = screen.getAllByRole("button", { name: /open menu/i })[0];
    fireEvent.click(actionButton);

    expect(screen.getByText("Add Payment")).toBeInTheDocument();
  });

  it("opens member details when row is clicked", () => {
    const mockPush = vi.fn();
    vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

    render(<MembersTable />);
    const row = screen.getByText("John Doe").closest("tr");
    fireEvent.click(row);

    expect(mockPush).toHaveBeenCalledWith("/members/123");
  });
});

describe("AddSessionButton", () => {
  it("opens dialog when clicked", () => {
    render(<AddSessionButton member={mockMember} />);
    const button = screen.getByText("Add Session");
    fireEvent.click(button);

    expect(screen.getByText(/Add Session for/i)).toBeInTheDocument();
  });

  it("calls onSuccess when session is added", async () => {
    const onSuccess = vi.fn();
    render(<AddSessionButton member={mockMember} onSuccess={onSuccess} />);

    // Open dialog, fill form, submit
    fireEvent.click(screen.getByText("Add Session"));
    // ... submit form ...

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});

describe("AddPaymentButton", () => {
  it("opens dialog when clicked", () => {
    render(<AddPaymentButton member={mockMember} />);
    const button = screen.getByText("Add Payment");
    fireEvent.click(button);

    expect(screen.getByText(/Add Payment for/i)).toBeInTheDocument();
  });

  it("calls onSuccess when payment is added", async () => {
    const onSuccess = vi.fn();
    render(<AddPaymentButton member={mockMember} onSuccess={onSuccess} />);

    // Open dialog, fill form, submit
    fireEvent.click(screen.getByText("Add Payment"));
    // ... submit form ...

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});
```

### Integration Tests

- Test Add Session flow: open modal, fill form, submit, verify table refresh
- Test Add Payment flow: open modal, fill form, submit, verify balance update
- Test row click navigation to details view
- Verify Edit/Delete available in details view

### Manual Testing Checklist

- [x] Row actions dropdown shows only Add Session and Add Payment
- [x] View action not present in row dropdown
- [x] Edit action not present in row dropdown
- [x] Delete action not present in row dropdown
- [x] Clicking row opens member details
- [x] Add Session button opens session form with member pre-selected
- [x] Add Payment button opens payment form with member pre-selected
- [x] Add Session form submission works and refreshes table
- [x] Add Payment form submission works and updates balance
- [x] Edit action available in member details view
- [x] Delete action available in member details view
- [x] Quick actions work from different pages (with pagination)

---

## 📊 Definition of Done

- [x] View, Edit, Delete actions removed from table row dropdown
- [x] AddSessionButton component created and functional
- [x] AddPaymentButton component created and functional
- [x] Quick actions integrated into MembersTable
- [x] Row click navigation to details verified
- [x] Edit and Delete actions verified in details view
- [x] Table refreshes after successful session/payment addition
- [x] All acceptance criteria met
- [x] Unit tests written and passing
- [x] Integration tests passing
- [x] Manual testing checklist complete
- [x] Code reviewed
- [x] Linting clean (`npm run lint`)
- [x] No TypeScript errors
- [x] Performance tested (no slowdown from modal rendering)

---

## 🔗 Related Stories

- **Depends On:** None (can be implemented independently)
- **Blocks:** US-005 (Integration Testing)
- **Related:** US-001 (pagination should work with quick actions), US-002, US-003

---

## 📝 Notes

### Design Rationale

**Why remove View from table?**

- Clicking the row already opens details
- Redundant action clutters menu
- Reduces cognitive load

**Why move Edit/Delete to details only?**

- Safer: viewing full context before editing/deleting
- Reduces accidental deletions
- Follows principle of progressive disclosure

**Why Add Session/Payment as quick actions?**

- Most frequent operations for members
- Significantly reduces workflow clicks
- Keeps staff in table view for efficiency

### Implementation Considerations

**Session/Payment Forms:**

- Reuse existing form components (don't duplicate)
- Pre-fill member information
- Handle validation and error states
- Show success feedback

**Table Refresh:**

- Use React Query's `refetch()` or `invalidateQueries()`
- Optimistic updates for better UX (optional)
- Show loading state during refresh

**Modal State:**

- Keep modals local to button components
- Clean up state on close
- Prevent multiple modals opening simultaneously

### Future Enhancements

- Add bulk session/payment actions
- Quick edit inline (for simple fields)
- Keyboard shortcuts for quick actions
- Action history/audit log

---

**Previous Story:** [US-003: Fix Balance Display Issues](./US-003-fix-balance-display.md)
**Next Story:** [US-005: Integration Testing and Polish](./US-005-integration-testing.md)
