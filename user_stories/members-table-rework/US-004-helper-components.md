# US-004: Helper Components for Enhanced Member Table

## User Story

**As a** frontend developer
**I want** reusable helper components for displaying member data
**So that** I can maintain consistent formatting and styling across the table

---

## Business Value

- **Consistency**: Unified display logic for dates, sessions, balances
- **Reusability**: Components can be used in other views
- **Maintainability**: Single source of truth for formatting

---

## Acceptance Criteria

### AC1: DateCell Component

**Given** I have a date string (ISO format or null)
**When** I render `<DateCell date={dateString} />`
**Then** it should:

- Display formatted date (e.g., "Jan 15, 2024")
- Show "-" or "N/A" for null dates
- Support optional custom format
- Use consistent typography

### AC2: SessionCountBadge Component

**Given** I have a session count number
**When** I render `<SessionCountBadge count={number} />`
**Then** it should:

- Display count with icon
- Use color coding (green: >5, yellow: 1-5, red: 0)
- Show hover tooltip with details
- Support optional label

### AC3: BalanceBadge Component

**Given** I have a balance due amount
**When** I render `<BalanceBadge amount={number} />`
**Then** it should:

- Display formatted currency (e.g., "$100.00")
- Use green for paid ($0.00)
- Use red for outstanding balance (>$0.00)
- Show hover tooltip
- Support custom currency symbol

### AC4: MemberTypeBadge Component

**Given** I have a member type ('full' | 'trial')
**When** I render `<MemberTypeBadge type={memberType} />`
**Then** it should:

- Display "Full Member" or "Trial Member"
- Use distinct colors/icons for each type
- Show compact version in table
- Support variant prop

---

## Technical Implementation

### File: `src/features/members/components/cells/DateCell.tsx`

```typescript
import { memo } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateCellProps {
  /** ISO date string or null */
  date: string | null;
  /** Optional custom format */
  format?: "short" | "long" | "relative";
  /** Show icon */
  showIcon?: boolean;
  /** Custom empty text */
  emptyText?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays formatted date with consistent styling
 * Handles null values gracefully
 */
export const DateCell = memo(function DateCell({
  date,
  format = "short",
  showIcon = false,
  emptyText = "-",
  className,
}: DateCellProps) {
  if (!date) {
    return <span className={cn("text-muted-foreground text-sm", className)}>{emptyText}</span>;
  }

  const formattedDate = formatDate(date, format);

  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)}>
      {showIcon && <Calendar className="h-3.5 w-3.5 text-muted-foreground" />}
      <span>{formattedDate}</span>
    </div>
  );
});

function formatDate(dateString: string, format: "short" | "long" | "relative"): string {
  const date = new Date(dateString);

  switch (format) {
    case "short":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    case "long":
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    case "relative":
      return getRelativeTimeString(date);
    default:
      return date.toLocaleDateString();
  }
}

function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return formatDate(date.toISOString(), "short");
}
```

### File: `src/features/members/components/cells/SessionCountBadge.tsx`

```typescript
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionCountBadgeProps {
  /** Number of sessions */
  count: number;
  /** Optional label */
  label?: string;
  /** Show tooltip */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays session count with color coding
 * Green: >5, Yellow: 1-5, Red/Gray: 0
 */
export const SessionCountBadge = memo(function SessionCountBadge({
  count,
  label,
  showTooltip = true,
  className,
}: SessionCountBadgeProps) {
  const variant = getVariant(count);
  const colorClass = getColorClass(count);

  const badge = (
    <Badge variant={variant} className={cn("gap-1", colorClass, className)}>
      <Calendar className="h-3 w-3" />
      <span>{count}</span>
      {label && <span className="ml-1 text-xs">{label}</span>}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText(count)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

function getVariant(count: number): "default" | "secondary" | "outline" {
  if (count === 0) return "secondary";
  if (count <= 5) return "outline";
  return "default";
}

function getColorClass(count: number): string {
  if (count === 0) return "bg-gray-100 text-gray-600";
  if (count <= 5) return "border-yellow-500 text-yellow-700";
  return "bg-green-100 text-green-700";
}

function getTooltipText(count: number): string {
  if (count === 0) return "No sessions scheduled";
  if (count === 1) return "1 session scheduled";
  return `${count} sessions scheduled`;
}
```

### File: `src/features/members/components/cells/BalanceBadge.tsx`

```typescript
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface BalanceBadgeProps {
  /** Balance amount */
  amount: number;
  /** Currency symbol */
  currency?: string;
  /** Show tooltip */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays balance with color coding
 * Green: $0.00 (paid), Red: >$0.00 (outstanding)
 */
export const BalanceBadge = memo(function BalanceBadge({
  amount,
  currency = "$",
  showTooltip = true,
  className,
}: BalanceBadgeProps) {
  const isPaid = amount <= 0;
  const variant = isPaid ? "default" : "destructive";
  const colorClass = isPaid ? "bg-green-100 text-green-700" : "";

  const formattedAmount = `${currency}${Math.abs(amount).toFixed(2)}`;

  const badge = (
    <Badge variant={variant} className={cn("gap-1", colorClass, className)}>
      <DollarSign className="h-3 w-3" />
      <span>{formattedAmount}</span>
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{isPaid ? "Fully paid" : `Outstanding balance: ${formattedAmount}`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
```

### File: `src/features/members/components/cells/MemberTypeBadge.tsx`

```typescript
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberTypeBadgeProps {
  /** Member type */
  type: "full" | "trial";
  /** Badge size */
  size?: "sm" | "md";
  /** Show icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays member type with distinct styling
 * Full: Blue, Trial: Purple
 */
export const MemberTypeBadge = memo(function MemberTypeBadge({
  type,
  size = "sm",
  showIcon = true,
  className,
}: MemberTypeBadgeProps) {
  const isFull = type === "full";
  const Icon = isFull ? UserCheck : UserPlus;
  const label = isFull ? "Full" : "Trial";
  const colorClass = isFull
    ? "bg-blue-100 text-blue-700 border-blue-200"
    : "bg-purple-100 text-purple-700 border-purple-200";

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        colorClass,
        size === "sm" && "text-xs py-0.5",
        className
      )}
    >
      {showIcon && <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />}
      <span>{label}</span>
    </Badge>
  );
});
```

### File: `src/features/members/components/cells/index.ts`

```typescript
export { DateCell } from "./DateCell";
export { SessionCountBadge } from "./SessionCountBadge";
export { BalanceBadge } from "./BalanceBadge";
export { MemberTypeBadge } from "./MemberTypeBadge";
```

---

## Testing Criteria

### Unit Tests

**Test 1: DateCell - Null Handling**

```typescript
import { render, screen } from '@testing-library/react';
import { DateCell } from './DateCell';

it('should show empty text for null date', () => {
  render(<DateCell date={null} emptyText="No date" />);
  expect(screen.getByText('No date')).toBeInTheDocument();
});

it('should show default "-" for null date', () => {
  render(<DateCell date={null} />);
  expect(screen.getByText('-')).toBeInTheDocument();
});
```

**Test 2: DateCell - Formatting**

```typescript
it('should format date in short format', () => {
  render(<DateCell date="2024-01-15T10:00:00Z" format="short" />);
  expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
});

it('should format date in long format', () => {
  render(<DateCell date="2024-01-15T10:00:00Z" format="long" />);
  expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
});
```

**Test 3: SessionCountBadge - Color Coding**

```typescript
it('should use green color for >5 sessions', () => {
  const { container } = render(<SessionCountBadge count={10} />);
  expect(container.firstChild).toHaveClass('bg-green-100');
});

it('should use yellow color for 1-5 sessions', () => {
  const { container } = render(<SessionCountBadge count={3} />);
  expect(container.firstChild).toHaveClass('border-yellow-500');
});

it('should use gray color for 0 sessions', () => {
  const { container } = render(<SessionCountBadge count={0} />);
  expect(container.firstChild).toHaveClass('bg-gray-100');
});
```

**Test 4: BalanceBadge - Paid vs Outstanding**

```typescript
it('should show green badge for paid balance', () => {
  const { container } = render(<BalanceBadge amount={0} />);
  expect(container.firstChild).toHaveClass('bg-green-100');
  expect(screen.getByText('$0.00')).toBeInTheDocument();
});

it('should show red badge for outstanding balance', () => {
  const { container } = render(<BalanceBadge amount={150.50} />);
  expect(container.firstChild).toHaveClass('destructive');
  expect(screen.getByText('$150.50')).toBeInTheDocument();
});
```

**Test 5: MemberTypeBadge - Types**

```typescript
it('should show blue badge for full member', () => {
  const { container } = render(<MemberTypeBadge type="full" />);
  expect(container.firstChild).toHaveClass('bg-blue-100');
  expect(screen.getByText('Full')).toBeInTheDocument();
});

it('should show purple badge for trial member', () => {
  const { container } = render(<MemberTypeBadge type="trial" />);
  expect(container.firstChild).toHaveClass('bg-purple-100');
  expect(screen.getByText('Trial')).toBeInTheDocument();
});
```

### Visual Tests (Storybook)

**Story 1: DateCell Variants**

```typescript
export const DateCellVariants: Story = {
  render: () => (
    <div className="space-y-2">
      <DateCell date="2024-01-15T10:00:00Z" format="short" />
      <DateCell date="2024-01-15T10:00:00Z" format="long" />
      <DateCell date="2024-01-15T10:00:00Z" format="relative" />
      <DateCell date={null} />
      <DateCell date="2024-01-15T10:00:00Z" showIcon />
    </div>
  ),
};
```

**Story 2: SessionCountBadge Variants**

```typescript
export const SessionBadgeVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <SessionCountBadge count={0} />
      <SessionCountBadge count={3} />
      <SessionCountBadge count={10} />
      <SessionCountBadge count={5} label="sessions" />
    </div>
  ),
};
```

---

## Definition of Done

- [ ] `DateCell` component created and exported
- [ ] `SessionCountBadge` component created and exported
- [ ] `BalanceBadge` component created and exported
- [ ] `MemberTypeBadge` component created and exported
- [ ] All components use shadcn/ui primitives only
- [ ] All components wrapped in `React.memo`
- [ ] All unit tests pass (8/8)
- [ ] Storybook stories created for all components
- [ ] TypeScript compilation succeeds
- [ ] Components under 150 lines each
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Code review completed

---

## Notes

### Design Decisions

**Why separate cell components?**

- Reusability across different tables/views
- Single Responsibility Principle
- Easier to test and maintain

**Why use tooltips?**

- Provides additional context without cluttering UI
- Improves UX for dense tables
- Accessible with keyboard navigation

**Why memo all components?**

- Table may re-render frequently (sorting, filtering)
- Prevents unnecessary re-renders of static cells
- Follows performance optimization guidelines

### Dependencies

- shadcn/ui components (Badge, Tooltip)
- lucide-react icons
- US-002: Types for member data

### Risks

- None - isolated components

---

## Related User Stories

- US-005: Table Component Updates
- US-006: Filters and Column Visibility
