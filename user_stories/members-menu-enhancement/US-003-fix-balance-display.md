# US-003: Fix Balance Display Issues

**Status:** ✅ Completed
**Priority:** P0 (Must Have)
**Complexity:** Small
**Estimated Time:** 1 hour

---

## 📋 User Story

**As a** gym administrator
**I want** properly formatted balance displays with clear visual indicators
**So that** I can quickly identify members with outstanding balances

---

## 🎯 Business Value

### Current Problem

- Double dollar sign bug (`$$250.00`) looks unprofessional
- Badge component makes text too small and hard to read
- Color coding exists but presentation is suboptimal
- Reduces credibility and user confidence in the system

### Expected Benefit

- Professional appearance with proper formatting (`$250.00`)
- Full-size, readable balance text
- Clear visual indicators with colored backgrounds
- Improved quick scanning for balance status

### Impact

- **Professional Appearance:** Bug-free display
- **Readability:** 50% larger text (removing badge)
- **User Efficiency:** Faster balance status identification
- **System Credibility:** Polished, error-free interface

---

## ✅ Acceptance Criteria

### AC-1: Single Dollar Sign Display

**Given** I am viewing a member's balance in the table
**When** the balance is displayed
**Then** the dollar sign should appear exactly once (e.g., `$250.00`, not `$$250.00`)

**And** this should apply to:

- Positive balances (e.g., `$250.00`)
- Negative balances (e.g., `-$50.00`)
- Zero balances (e.g., `$0.00`)

### AC-2: Badge Removed, Background Color Added

**Given** I am viewing a member's balance
**When** the balance is displayed
**Then**:

- The badge component should not be used
- The balance should be displayed as regular text
- The cell should have a subtle colored background

### AC-3: Positive Balance Styling

**Given** a member has a positive balance (> $0)
**When** the balance is displayed
**Then**:

- Background color: light green (e.g., `bg-green-50` or `#f0fdf4`)
- Text color: dark green (e.g., `text-green-700` or `#15803d`)
- Format: `$250.00`

### AC-4: Negative Balance Styling

**Given** a member has a negative balance (< $0)
**When** the balance is displayed
**Then**:

- Background color: light red (e.g., `bg-red-50` or `#fef2f2`)
- Text color: dark red (e.g., `text-red-700` or `#b91c1c`)
- Format: `-$50.00` (negative sign before dollar sign)

### AC-5: Zero Balance Styling

**Given** a member has a zero balance (= $0)
**When** the balance is displayed
**Then**:

- Background color: light gray (e.g., `bg-gray-50` or `#f9fafb`)
- Text color: medium gray (e.g., `text-gray-600` or `#4b5563`)
- Format: `$0.00`

### AC-6: Text Readability

**Given** any balance is displayed
**When** I view the table
**Then**:

- Text should be full-size (not reduced by badge styling)
- Text should be easily readable at normal viewing distance
- Contrast ratio should meet WCAG AA standards (4.5:1 minimum)

---

## 🔧 Technical Implementation

### Files to Modify

```
src/features/members/components/
└── MembersTable.tsx          [MODIFY] - Balance cell rendering
```

### Implementation Steps

#### Step 1: Create Balance Formatter Utility

```typescript
// Add to MembersTable.tsx or create separate utility file

interface BalanceStyles {
  backgroundColor: string;
  textColor: string;
}

function getBalanceStyles(balance: number): BalanceStyles {
  if (balance > 0) {
    return {
      backgroundColor: "bg-green-50",
      textColor: "text-green-700",
    };
  } else if (balance < 0) {
    return {
      backgroundColor: "bg-red-50",
      textColor: "text-red-700",
    };
  } else {
    return {
      backgroundColor: "bg-gray-50",
      textColor: "text-gray-600",
    };
  }
}

function formatBalance(balance: number): string {
  const absBalance = Math.abs(balance);
  const formatted = absBalance.toFixed(2);

  if (balance < 0) {
    return `-$${formatted}`;
  }
  return `$${formatted}`;
}
```

#### Step 2: Update Balance Cell Rendering

```tsx
// src/features/members/components/MembersTable.tsx

// Current implementation (with badge and double $):
<Badge variant={getBalanceVariant(member.balance)}>
  ${member.balance} {/* ❌ May cause $$ if member.balance already has $ */}
</Badge>;

// New implementation (with colored background):
const balanceStyles = getBalanceStyles(member.balance);

<TableCell>
  <div
    className={cn(
      "rounded-md px-3 py-1 text-sm font-medium",
      balanceStyles.backgroundColor,
      balanceStyles.textColor
    )}
  >
    {formatBalance(member.balance)}
  </div>
</TableCell>;
```

#### Step 3: Remove Badge Component

```tsx
// Remove Badge import if not used elsewhere in MembersTable
// Before:
import { Badge } from "@/components/ui/badge";

// After (if not used elsewhere):
// Remove this import
```

#### Step 4: Fix Double Dollar Sign Bug

Ensure the balance value from the database is a number, not a string with `$`:

```typescript
// Check data fetching/transformation
// Ensure balance is stored/retrieved as number
const member = {
  // ...
  balance: 250.0, // ✅ Number
  // NOT: balance: "$250.00", // ❌ String with $
};

// If balance comes as string with $, clean it:
const cleanBalance =
  typeof balance === "string"
    ? parseFloat(balance.replace(/[$,]/g, ""))
    : balance;
```

### Example Final Implementation

```tsx
// Balance cell rendering
const BalanceCell = memo(function BalanceCell({ balance }: { balance: number }) {
  const styles = getBalanceStyles(balance);
  const formattedBalance = formatBalance(balance);

  return (
    <div
      className={cn(
        "px-3 py-1 rounded-md text-sm font-medium",
        styles.backgroundColor,
        styles.textColor
      )}
    >
      {formattedBalance}
    </div>
  );
});

// In table column definition:
{
  accessorKey: "balance",
  header: "Balance",
  cell: ({ row }) => <BalanceCell balance={row.original.balance} />,
}
```

---

## 🧪 Testing Requirements

### Unit Tests

```typescript
describe("Balance Display", () => {
  describe("formatBalance", () => {
    it("formats positive balance correctly", () => {
      expect(formatBalance(250.5)).toBe("$250.50");
    });

    it("formats negative balance correctly", () => {
      expect(formatBalance(-50.75)).toBe("-$50.75");
    });

    it("formats zero balance correctly", () => {
      expect(formatBalance(0)).toBe("$0.00");
    });

    it("shows single dollar sign only", () => {
      const formatted = formatBalance(100);
      const dollarCount = (formatted.match(/\$/g) || []).length;
      expect(dollarCount).toBe(1);
    });
  });

  describe("getBalanceStyles", () => {
    it("returns green styles for positive balance", () => {
      const styles = getBalanceStyles(100);
      expect(styles.backgroundColor).toBe("bg-green-50");
      expect(styles.textColor).toBe("text-green-700");
    });

    it("returns red styles for negative balance", () => {
      const styles = getBalanceStyles(-50);
      expect(styles.backgroundColor).toBe("bg-red-50");
      expect(styles.textColor).toBe("text-red-700");
    });

    it("returns gray styles for zero balance", () => {
      const styles = getBalanceStyles(0);
      expect(styles.backgroundColor).toBe("bg-gray-50");
      expect(styles.textColor).toBe("text-gray-600");
    });
  });

  describe("BalanceCell", () => {
    it("renders balance with colored background", () => {
      render(<BalanceCell balance={250} />);
      const cell = screen.getByText("$250.00");
      expect(cell).toHaveClass("bg-green-50", "text-green-700");
    });

    it("does not use Badge component", () => {
      const { container } = render(<BalanceCell balance={250} />);
      // Badge typically has specific class or role
      expect(container.querySelector('[role="status"]')).not.toBeInTheDocument();
    });

    it("renders full-size text", () => {
      const { container } = render(<BalanceCell balance={250} />);
      const text = screen.getByText("$250.00");
      // Badge reduces text size, ensure it's normal size
      expect(text).toHaveClass("text-sm"); // or whatever normal size
      expect(text).not.toHaveClass("text-xs"); // smaller badge size
    });
  });
});
```

### Visual Tests

Create test cases with different balance values:

- Positive: $250.00, $1,000.50, $0.01
- Negative: -$50.00, -$500.75, -$0.01
- Zero: $0.00

Verify:

- Single dollar sign
- Correct colors
- Readable text size
- Proper contrast

### Manual Testing Checklist

- [x] Column header shows "Balance Due" for clarity
- [x] Positive balance displays with RED background and RED text (member owes)
- [x] Negative balance displays with GREEN background and GREEN text (member overpaid)
- [x] Zero balance displays with GRAY background and GRAY text (fully paid)
- [x] Dollar sign appears exactly once for all balances
- [x] Negative sign appears before dollar sign (e.g., `-$50.00`)
- [x] Text is full-size and easily readable
- [x] No badge component visible
- [x] Colors have sufficient contrast (WCAG AA)
- [x] Layout looks clean and professional
- [x] No console errors

---

## 📊 Definition of Done

- [x] formatBalance utility function created and tested
- [x] getBalanceStyles utility function created and tested
- [x] Inline balance rendering implemented (replaced BalanceBadge)
- [x] Badge component removed from balance display
- [x] Double dollar sign bug fixed
- [x] Colored backgrounds applied correctly (RED/GREEN/GRAY)
- [x] Balance color logic corrected (positive=red, negative=green)
- [x] Column header changed to "Balance Due" for clarity
- [x] All acceptance criteria met
- [x] Unit tests written and passing (16 tests, 859 total)
- [x] Manual testing checklist complete
- [x] Accessibility verified (color contrast)
- [x] Linting clean (0 errors, 9 pre-existing warnings)
- [x] Build successful (0 errors)
- [x] No TypeScript errors

**Completion Date:** 2025-10-05

---

## 🔗 Related Stories

- **Depends On:** None (can be implemented independently)
- **Blocks:** US-005 (Integration Testing)
- **Related:** US-002 (tooltip removal from balance), US-001, US-004

---

## 📝 Notes

### Design Rationale

**Why colored backgrounds instead of badge?**

- Maintains full text size for better readability
- Still provides clear visual indicator
- More modern, subtle appearance
- Aligns with user preference from planning session

**Why these specific colors?**

- Green: Positive balance (credit to gym)
- Red: Negative balance (debt to member)
- Gray: Zero balance (neutral state)
- Light backgrounds with dark text ensure readability

### Accessibility Considerations

- **Color alone not sufficient:** Use negative sign for negative balances (not just color)
- **Contrast:** Ensure minimum 4.5:1 ratio for WCAG AA compliance
- **Text size:** Full-size text aids readability for all users
- **Screen readers:** Balance should read as "$250.00" or "negative $50.00"

### Edge Cases

- Very large balances (e.g., $10,000+): Ensure formatting handles commas if needed
- Very small balances (e.g., $0.01): Ensure two decimal places always shown
- Null/undefined balance: Handle gracefully (show $0.00 or "N/A")

### Future Enhancements

- Add currency symbol configuration for international use
- Implement thousands separator for large amounts
- Consider hover tooltip showing detailed breakdown (if needed later)

---

**Previous Story:** [US-002: Remove Unnecessary Columns and UI Elements](./US-002-remove-unnecessary-elements.md)
**Next Story:** [US-004: Refactor Row Actions](./US-004-refactor-row-actions.md)
