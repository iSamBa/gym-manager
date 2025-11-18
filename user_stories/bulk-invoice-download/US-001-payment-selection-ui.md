# US-001: Payment Selection UI

**Feature:** Bulk Invoice Download
**Story ID:** US-001
**Priority:** P0 (Must Have)
**Complexity:** Small
**Estimated Effort:** 2-3 hours

---

## User Story

**As a** gym administrator
**I want** to select multiple payments from the payments page using checkboxes
**So that** I can prepare to download multiple invoices in bulk

---

## Business Value

**Problem:**
Currently, admins can only view and download invoices one at a time. When they need to archive or export multiple invoices for accounting purposes, they must manually click each invoice, which is time-consuming and inefficient.

**Solution:**
Add checkbox selection to the payments table, allowing admins to select any number of payments for bulk operations. This is the foundation for the bulk invoice download feature.

**Value:**

- **Time Savings:** Reduces time spent on invoice management
- **Improved Workflow:** Streamlines accounting and administrative processes
- **Better UX:** Provides familiar multi-select interaction pattern
- **Scalability:** Enables future bulk operations beyond downloads

---

## Acceptance Criteria

### Functional Requirements

#### AC1: Checkbox Column Added

**Given** I am on the payments page
**When** I view the payments table
**Then** I should see a checkbox column as the first column
**And** the checkbox column should have a width of 48px (w-12)

#### AC2: Individual Selection

**Given** I am viewing the payments table
**When** I click a checkbox for a specific payment
**Then** that payment should be selected
**And** the checkbox should show a checked state
**When** I click the same checkbox again
**Then** the payment should be deselected
**And** the checkbox should show an unchecked state

#### AC3: Select All Functionality

**Given** I am viewing the payments table with multiple payments
**When** I click the checkbox in the table header
**Then** all payments on the current page should be selected
**And** all row checkboxes should show checked state
**When** I click the header checkbox again
**Then** all payments should be deselected
**And** all row checkboxes should show unchecked state

#### AC4: Selection State Persistence

**Given** I have selected one or more payments
**When** I remain on the same page without changing filters
**Then** the selection state should persist
**And** the checkboxes should remain in their selected/deselected state

#### AC5: Selection Cleared on Filter Change

**Given** I have selected one or more payments
**When** I change any filter (search term, method, status, date range)
**Then** all selections should be cleared
**And** all checkboxes should return to unchecked state

#### AC6: Selection Cleared on Pagination

**Given** I have selected one or more payments on page 1
**When** I navigate to page 2
**Then** all selections should be cleared
**And** checkboxes on page 2 should start unchecked

#### AC7: Accessibility

**Given** I am using keyboard navigation
**When** I tab through the payments table
**Then** I should be able to focus on each checkbox
**When** I press Space or Enter on a focused checkbox
**Then** the selection state should toggle
**And** each checkbox should have a descriptive aria-label

---

## Technical Requirements

### Implementation Details

#### 1. Selection State Management

**Type:** Local component state (React)

**Data Structure:**

```typescript
const [selectedPayments, setSelectedPayments] = useState<Set<string>>(
  new Set()
);
```

**Why Set?**

- O(1) lookup, insertion, deletion
- Natural deduplication
- Efficient for frequent updates
- Better than array for this use case

#### 2. Event Handlers

**handleSelectAll:**

```typescript
const handleSelectAll = useCallback(() => {
  if (selectedPayments.size === (data?.payments.length || 0)) {
    setSelectedPayments(new Set());
  } else {
    setSelectedPayments(new Set(data?.payments.map((p) => p.id) || []));
  }
}, [selectedPayments.size, data?.payments]);
```

**handleToggleSelect:**

```typescript
const handleToggleSelect = useCallback(
  (paymentId: string) => {
    const newSelection = new Set(selectedPayments);
    if (newSelection.has(paymentId)) {
      newSelection.delete(paymentId);
    } else {
      newSelection.add(paymentId);
    }
    setSelectedPayments(newSelection);
  },
  [selectedPayments]
);
```

**handleClearSelection:**

```typescript
const handleClearSelection = useCallback(() => {
  setSelectedPayments(new Set());
}, []);
```

#### 3. Clear Selection on Changes

```typescript
useEffect(() => {
  setSelectedPayments(new Set());
}, [searchTerm, methodFilter, statusFilter, dateRange, currentPage]);
```

#### 4. UI Components

**Import:**

```typescript
import { Checkbox } from "@/components/ui/checkbox";
```

**Header Checkbox:**

```typescript
<TableHead className="w-12">
  <Checkbox
    checked={
      selectedPayments.size === (data?.payments.length || 0) &&
      (data?.payments.length || 0) > 0
    }
    onCheckedChange={handleSelectAll}
    aria-label="Select all payments"
  />
</TableHead>
```

**Row Checkbox:**

```typescript
<TableCell>
  <Checkbox
    checked={selectedPayments.has(payment.id)}
    onCheckedChange={() => handleToggleSelect(payment.id)}
    aria-label={`Select payment ${payment.receipt_number}`}
  />
</TableCell>
```

### File Changes

**Modified:**

- `src/app/payments/page.tsx`

**Changes Required:**

1. Add import for Checkbox component
2. Add selection state (useState)
3. Add event handlers (useCallback)
4. Add useEffect for clearing selection
5. Add checkbox column to table structure
6. Export handlers for future use (US-004)

---

## Dependencies

### Upstream Dependencies

- None (first user story in sequence)

### Downstream Dependencies

- **US-002:** Member Payment Selection UI (similar pattern)
- **US-004:** ZIP Download UI (uses selection state)

### External Dependencies

- shadcn/ui Checkbox component (already installed)
- React hooks (useState, useCallback, useEffect)

---

## Testing Requirements

### Unit Tests

**Not required for this story** (simple UI state management)

### Integration Tests

**Not required for this story** (will be covered in US-004)

### Manual Testing Scenarios

#### Test 1: Basic Selection

1. Navigate to /payments
2. Click checkbox for first payment
3. ✅ Verify checkbox shows checked
4. Click checkbox again
5. ✅ Verify checkbox shows unchecked

#### Test 2: Select All

1. Navigate to /payments with 10+ payments
2. Click header checkbox
3. ✅ Verify all row checkboxes show checked
4. Click header checkbox again
5. ✅ Verify all row checkboxes show unchecked

#### Test 3: Partial Selection

1. Navigate to /payments
2. Select 3 random payments
3. ✅ Verify only those 3 show checked
4. Click header checkbox
5. ✅ Verify all payments now selected

#### Test 4: Filter Change Clears Selection

1. Navigate to /payments
2. Select 5 payments
3. Change payment method filter
4. ✅ Verify all selections cleared

#### Test 5: Page Change Clears Selection

1. Navigate to /payments (page 1)
2. Select 5 payments
3. Go to page 2
4. ✅ Verify no selections on page 2
5. Go back to page 1
6. ✅ Verify selections still cleared

#### Test 6: Search Clears Selection

1. Navigate to /payments
2. Select 3 payments
3. Enter search term
4. ✅ Verify selections cleared

#### Test 7: Date Range Clears Selection

1. Navigate to /payments
2. Select 4 payments
3. Change date range
4. ✅ Verify selections cleared

#### Test 8: Keyboard Navigation

1. Tab to first checkbox
2. Press Space
3. ✅ Verify selection toggles
4. Tab through remaining checkboxes
5. ✅ Verify all checkboxes are focusable

---

## Definition of Done

### Code Quality

- [x] Code follows CLAUDE.md standards
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Event handlers use useCallback
- [x] Set used for selection state (not array)
- [x] No console.log statements

### Functionality

- [x] Individual selection works correctly
- [x] Select all works correctly
- [x] Selection clears on filter changes
- [x] Selection clears on pagination
- [x] Checkboxes visually indicate state

### Accessibility

- [x] All checkboxes have aria-labels
- [x] Keyboard navigation works
- [x] Focus indicators visible

### Testing

- [x] All manual test scenarios pass
- [x] Tested with various table sizes (1, 10, 50 payments)
- [x] Tested with all filter combinations

### Documentation

- [x] Code is self-documenting
- [x] Complex logic has inline comments
- [x] Selection state clearly named

### Git

- [x] Changes committed with proper message format
- [x] Commit message: `feat(payments): add checkbox selection to payments table (US-001)`
- [x] Pushed to feature branch

---

## Implementation Notes

### Performance Considerations

**Why Set over Array:**

```typescript
// Array (O(n) operations)
const isSelected = selectedIds.includes(paymentId); // O(n)
const newSelection = [...selectedIds, paymentId]; // O(n)

// Set (O(1) operations)
const isSelected = selectedIds.has(paymentId); // O(1)
selectedIds.add(paymentId); // O(1)
```

For 100+ payments, Set provides significantly better performance.

**Why useCallback:**
Event handlers are passed to child components (checkboxes). Without useCallback, handlers would be recreated on every render, causing unnecessary re-renders of all checkbox components.

### UX Considerations

**Header Checkbox State:**

- Checked: When all payments on page are selected
- Unchecked: When no payments are selected
- Indeterminate: Could be added for partial selection (future enhancement)

**Clear on Filter:**
This prevents confusion where users select payments, filter the table, and then forget which payments were originally selected.

### Future Enhancements

**P2 Features (not in this story):**

- Indeterminate state for header checkbox when partial selection
- "Select All Across Pages" (select all filtered results, not just current page)
- Persistent selection across pagination (advanced, would require different UX)
- Selection count indicator (implemented in US-004)

---

## Rollback Plan

**If issues arise:**

1. **Partial Rollback:**

   ```typescript
   // Comment out checkbox column
   // Keep state management for easy re-enable
   ```

2. **Full Rollback:**

   ```bash
   git revert <commit-hash>
   ```

3. **Feature Flag (if needed):**
   ```typescript
   const ENABLE_SELECTION =
     process.env.NEXT_PUBLIC_ENABLE_PAYMENT_SELECTION === "true";
   ```

---

## Success Metrics

### Immediate Metrics

- Selection state updates in <16ms (single frame)
- No console errors or warnings
- All checkboxes render correctly

### User Experience Metrics

- Selection behavior feels natural and predictable
- No lag when selecting/deselecting
- Clear visual feedback for all states

### Development Metrics

- Story completed within 2-3 hour estimate
- Zero bugs reported during QA
- Clean integration with US-004

---

## References

### Related Files

- `src/app/payments/page.tsx` - Main implementation file
- `src/components/ui/checkbox.tsx` - Checkbox component (shadcn/ui)
- `src/features/members/components/AdvancedMemberTable.tsx` - Similar selection pattern

### Design Patterns

- **Controlled Component Pattern:** Selection state is controlled by parent
- **Set Data Structure:** Efficient O(1) operations for large selections
- **useCallback Pattern:** Memoized event handlers prevent unnecessary re-renders

### Standards

- CLAUDE.md - Performance Optimization Guidelines
- CLAUDE.md - Component Guidelines
- CLAUDE.md - TypeScript Standards

---

**Story Status:** ✅ Completed
**Last Updated:** 2025-11-18
**Completed:** 2025-11-18
**Assigned To:** Implementation Agent

**Implementation Notes:**

- Added checkbox selection to payments table (first column)
- Implemented selection state using Set<string> for O(1) performance
- All event handlers use useCallback for optimization
- useEffect clears selections on filter/pagination changes
- All automated tests passed (linting, build, type check)
- Manual tests verified via Puppeteer automation
- Checkboxes render correctly with proper accessibility (aria-labels)
