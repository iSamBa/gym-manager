# US-002: Member Payment Selection UI

**Feature:** Bulk Invoice Download
**Story ID:** US-002
**Priority:** P0 (Must Have)
**Complexity:** Small
**Estimated Effort:** 2-3 hours

---

## User Story

**As a** gym administrator viewing a member's payment history
**I want** to select multiple payments using checkboxes
**So that** I can download invoices for specific payments related to that member

---

## Business Value

**Problem:**
When reviewing a specific member's account, admins often need to download multiple invoices for that member (e.g., for payment disputes, member requests, or accounting reconciliation). Currently, they must download each invoice individually.

**Solution:**
Extend the PaymentHistoryTable component (used in member details) to support checkbox selection, mirroring the functionality added to the main payments page in US-001.

**Value:**

- **Member-Specific Workflows:** Streamlines member account management
- **Contextual Actions:** Bulk operations in the context of a single member
- **Consistency:** Provides same UX pattern as main payments page
- **Flexibility:** Allows selecting specific payments for a member

---

## Acceptance Criteria

### Functional Requirements

#### AC1: Reusable Component Enhancement

**Given** the PaymentHistoryTable component exists
**When** I pass `showSelection={true}` prop
**Then** the table should display checkbox selection column
**And** the checkbox column should be the first column
**When** I pass `showSelection={false}` or omit the prop
**Then** the table should render without checkboxes (backward compatible)

#### AC2: Selection Props Interface

**Given** I am using PaymentHistoryTable with selection enabled
**When** I provide selection-related props
**Then** the component should accept:

- `selectedPayments?: Set<string>` - Current selection state
- `onToggleSelect?: (paymentId: string) => void` - Individual toggle handler
- `onSelectAll?: () => void` - Select all handler
- `showSelection?: boolean` - Enable/disable selection

#### AC3: Individual Selection in Member Context

**Given** I am viewing a member's payment history
**And** selection is enabled
**When** I click a checkbox for a specific payment
**Then** that payment should be selected
**And** the checkbox should show checked state
**When** I click the same checkbox again
**Then** the payment should be deselected

#### AC4: Select All in Member Context

**Given** I am viewing a member's payment history with multiple payments
**When** I click the checkbox in the table header
**Then** all of that member's payments should be selected
**When** I click the header checkbox again
**Then** all of that member's payments should be deselected

#### AC5: Independent Selection State

**Given** I have selected payments on the main payments page
**When** I navigate to a member's details page
**Then** the member's payment table should have independent selection state
**And** selections from the payments page should not affect member payments

#### AC6: Selection Persistence in Member Context

**Given** I have selected payments in a member's history
**When** I remain on the member details page
**Then** the selection should persist
**When** I navigate away and return to the member
**Then** the selection should be cleared (fresh state)

---

## Technical Requirements

### Implementation Details

#### 1. Update PaymentHistoryTable Props

**File:** `src/features/payments/components/PaymentHistoryTable.tsx`

**New Props Interface:**

```typescript
interface PaymentHistoryTableProps {
  payments: SubscriptionPaymentWithReceiptAndPlan[];
  isLoading?: boolean;
  showMemberColumn?: boolean;
  showSubscriptionColumn?: boolean;
  // NEW: Selection props
  showSelection?: boolean;
  selectedPayments?: Set<string>;
  onToggleSelect?: (paymentId: string) => void;
  onSelectAll?: () => void;
}
```

#### 2. Conditional Checkbox Column

**Table Header:**

```typescript
{showSelection && (
  <TableHead className="w-12">
    <Checkbox
      checked={
        selectedPayments?.size === payments.length &&
        payments.length > 0
      }
      onCheckedChange={onSelectAll}
      aria-label="Select all payments"
    />
  </TableHead>
)}
```

**Table Row:**

```typescript
{showSelection && (
  <TableCell>
    <Checkbox
      checked={selectedPayments?.has(payment.id) || false}
      onCheckedChange={() => onToggleSelect?.(payment.id)}
      aria-label={`Select payment ${payment.receipt_number}`}
    />
  </TableCell>
)}
```

#### 3. Parent Component Integration

**Find where PaymentHistoryTable is used** (likely member details page)

**Add Selection State:**

```typescript
const [selectedPayments, setSelectedPayments] = useState<Set<string>>(
  new Set()
);

const handleSelectAll = useCallback(() => {
  if (selectedPayments.size === payments.length) {
    setSelectedPayments(new Set());
  } else {
    setSelectedPayments(new Set(payments.map((p) => p.id)));
  }
}, [selectedPayments.size, payments]);

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

const handleClearSelection = useCallback(() => {
  setSelectedPayments(new Set());
}, []);
```

**Pass Props to Table:**

```typescript
<PaymentHistoryTable
  payments={payments}
  isLoading={isLoading}
  showSelection={true}
  selectedPayments={selectedPayments}
  onToggleSelect={handleToggleSelect}
  onSelectAll={handleSelectAll}
/>
```

### File Changes

**Modified:**

- `src/features/payments/components/PaymentHistoryTable.tsx`
- Member details page (wherever PaymentHistoryTable is rendered)

**Changes Required:**

1. Update Props interface for PaymentHistoryTable
2. Add conditional checkbox columns
3. Handle optional selection props gracefully
4. Add selection state to parent page
5. Wire up handlers to table component

---

## Dependencies

### Upstream Dependencies

- **US-001:** Payment Selection UI (establishes pattern)

### Downstream Dependencies

- **US-004:** ZIP Download UI (uses selection from both pages)

### External Dependencies

- shadcn/ui Checkbox component (already installed)
- PaymentHistoryTable component (existing)

---

## Testing Requirements

### Unit Tests

**Test File:** `src/features/payments/components/__tests__/PaymentHistoryTable.test.tsx`

**Test Cases:**

```typescript
describe("PaymentHistoryTable with Selection", () => {
  it("should not show checkboxes when showSelection is false");
  it("should show checkboxes when showSelection is true");
  it("should call onToggleSelect when row checkbox clicked");
  it("should call onSelectAll when header checkbox clicked");
  it("should handle undefined selection props gracefully");
});
```

### Integration Tests

**Not required for this story** (UI integration tested manually)

### Manual Testing Scenarios

#### Test 1: Backward Compatibility

1. Find PaymentHistoryTable usage without selection props
2. ✅ Verify table renders normally without checkboxes
3. ✅ Verify no console errors

#### Test 2: Enable Selection

1. Navigate to member details page
2. ✅ Verify checkbox column appears
3. ✅ Verify header checkbox present

#### Test 3: Individual Selection

1. Navigate to member with 5+ payments
2. Click checkbox for first payment
3. ✅ Verify only that checkbox is checked
4. Click checkbox for third payment
5. ✅ Verify both first and third are checked

#### Test 4: Select All

1. Navigate to member with 10+ payments
2. Click header checkbox
3. ✅ Verify all row checkboxes checked
4. Click header checkbox again
5. ✅ Verify all checkboxes unchecked

#### Test 5: Independent State

1. Go to main payments page
2. Select 3 payments
3. Navigate to member details
4. ✅ Verify member payment table has no selections
5. Select 2 payments in member table
6. Go back to main payments page
7. ✅ Verify main page still has original 3 selected

#### Test 6: Selection Across Multiple Members

1. Navigate to Member A details
2. Select 2 payments
3. Navigate to Member B details
4. ✅ Verify Member B table has no selections
5. Select 1 payment for Member B
6. Return to Member A details
7. ✅ Verify Member A has fresh state (no selections)

#### Test 7: Props Optional Check

1. Check other uses of PaymentHistoryTable
2. ✅ Verify tables without selection props still work
3. ✅ Verify no TypeScript errors

---

## Definition of Done

### Code Quality

- [x] Code follows CLAUDE.md standards
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Props properly typed with optional modifiers
- [x] Backward compatible (doesn't break existing usage)
- [x] No console.log statements

### Functionality

- [x] Checkbox selection works in member context
- [x] Select all works correctly
- [x] Selection state is independent per member
- [x] Existing PaymentHistoryTable usage not affected
- [x] Selection handlers work as expected

### Component Design

- [x] Props interface is clean and logical
- [x] Conditional rendering uses proper patterns
- [x] Optional chaining for safe prop access
- [x] Component remains reusable

### Testing

- [x] All manual test scenarios pass
- [x] Backward compatibility verified
- [x] Tested with multiple members
- [x] Tested with varying payment counts (1, 5, 10, 20)

### Documentation

- [x] Props interface documented
- [x] Component usage examples clear
- [x] Selection behavior documented

### Git

- [x] Changes committed with proper message
- [x] Commit message: `feat(payments): add checkbox selection to member payment history (US-002)`
- [x] Pushed to feature branch

---

## Implementation Notes

### Design Decisions

**Why Optional Props?**
The component is used in multiple places. Making selection props optional ensures backward compatibility and allows gradual adoption.

**Why Pass Handlers Instead of State?**
This keeps PaymentHistoryTable as a presentational component. Selection logic remains in the parent, making the component more flexible and testable.

**Why Set for selectedPayments?**
Consistent with US-001 and provides O(1) lookup performance.

### Reusability Pattern

```typescript
// Usage 1: Without selection (existing)
<PaymentHistoryTable payments={payments} />

// Usage 2: With selection (new)
<PaymentHistoryTable
  payments={payments}
  showSelection={true}
  selectedPayments={selectedIds}
  onToggleSelect={handleToggle}
  onSelectAll={handleSelectAll}
/>
```

### Edge Cases Handled

**1. Empty Payments Array:**

```typescript
// Header checkbox logic
checked={
  selectedPayments?.size === payments.length &&
  payments.length > 0  // Prevent checked state when empty
}
```

**2. Undefined Selection Props:**

```typescript
// Safe property access
checked={selectedPayments?.has(payment.id) || false}
onCheckedChange={() => onToggleSelect?.(payment.id)}
```

**3. Component Unmount:**
Selection state lives in parent, so it's properly cleaned up when navigating away.

### Future Enhancements

**P2 Features (not in this story):**

- Filter member payments before selection
- "Select Unpaid Only" quick action
- Persistent selection across member navigation (complex, may not be desirable)

---

## Rollback Plan

**If issues arise:**

1. **Partial Rollback:**

   ```typescript
   // Set showSelection={false} in parent component
   // Keeps code but disables feature
   ```

2. **Component Rollback:**

   ```bash
   git checkout HEAD~1 -- src/features/payments/components/PaymentHistoryTable.tsx
   ```

3. **Full Rollback:**
   ```bash
   git revert <commit-hash>
   ```

---

## Success Metrics

### Immediate Metrics

- Component renders with and without selection props
- No TypeScript compilation errors
- No runtime errors in console

### User Experience Metrics

- Selection behavior feels consistent with US-001
- No confusion about which payments are selected
- Clear visual feedback

### Development Metrics

- Story completed within 2-3 hour estimate
- No bugs in backward compatibility
- Clean integration with US-004

### Code Quality Metrics

- Props interface is intuitive
- Component remains simple and focused
- Easy to test and maintain

---

## References

### Related Files

- `src/features/payments/components/PaymentHistoryTable.tsx` - Main implementation
- `src/app/payments/page.tsx` - US-001 reference implementation
- Member details page - Integration point

### Similar Patterns

- US-001: Payment Selection UI - Establishes selection pattern
- AdvancedMemberTable - Another table with selection

### Component Patterns

- **Optional Props Pattern:** Makes features opt-in
- **Controlled Component Pattern:** Parent controls state
- **Conditional Rendering:** Shows features based on props

### Standards

- CLAUDE.md - Component Guidelines
- CLAUDE.md - TypeScript Standards
- React Best Practices - Prop drilling vs. composition

---

**Story Status:** ✅ Completed
**Last Updated:** 2025-11-18
**Completed:** 2025-11-18
**Assigned To:** Implementation Agent
**Depends On:** US-001

**Implementation Notes:**

- Extended PaymentHistoryTable with optional selection props (backward compatible)
- Added conditional checkbox column (first column when showSelection=true)
- Integrated selection state into MemberPayments component
- All event handlers use useCallback for optimization
- Selection state uses Set<string> for O(1) performance
- All automated tests passed (linting, build, type check)
- Implementation follows same pattern as US-001
