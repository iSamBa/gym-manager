# US-012: Comment Alert Integration

**Epic:** Member Profile Enhancement - Equipment & Referral Tracking
**Story ID:** US-012
**Priority:** P1 (Required)
**Complexity:** Small (~30 minutes)
**Dependencies:** US-009, US-010, US-011
**Status:** ✅ COMPLETED
**Completed:** 2025-10-08
**Implementation Notes:** Comment alerts integrated into MemberAlertsCard with urgency-based color coding and auto-refresh. All 8 acceptance criteria met.

---

## 📝 User Story

**As a** gym administrator or trainer
**I want** comments with due dates to appear as alerts on the member profile
**So that** I am reminded of important follow-ups and time-sensitive actions

---

## 💼 Business Value

**Why This Matters:**

- **Visibility:** Brings time-sensitive notes to staff attention
- **Accountability:** Ensures follow-ups don't get missed
- **Workflow:** Integrates comments into existing alert system
- **Automation:** Alerts automatically disappear after due date

**Impact:**

- Without this: Comments with due dates exist but aren't prominently displayed
- With this: Time-sensitive comments become actionable alerts

---

## ✅ Acceptance Criteria

### Update MemberAlertsCard

**File:** `src/features/members/components/MemberAlertsCard.tsx`

- [ ] **AC-001:** Import comment hooks and types:

  ```typescript
  import { useActiveCommentAlerts } from "@/features/members/hooks";
  import type { MemberComment } from "@/features/database/lib/types";
  import { MessageSquare } from "lucide-react";
  ```

- [ ] **AC-002:** Fetch active comment alerts:

  ```typescript
  export const MemberAlertsCard = memo(function MemberAlertsCard({
    member,
  }: MemberAlertsCardProps) {
    const { data: metrics } = useMemberActivityMetrics(member.id);
    const { data: commentAlerts = [] } = useActiveCommentAlerts(member.id);

    // ... rest of component
  });
  ```

- [ ] **AC-003:** Add comment alerts to alerts array:

  ```typescript
  const alerts = useMemo((): Alert[] => {
    const alertList: Alert[] = [];

    // Existing alerts (subscription, equipment, birthday, payments)
    // ... existing alert logic

    // Comment alerts (due date in the future)
    commentAlerts.forEach((comment) => {
      if (comment.due_date) {
        const dueDate = new Date(comment.due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determine alert type based on urgency
        const alertType = daysUntilDue <= 3 ? "critical" : "warning";

        alertList.push({
          id: `comment-${comment.id}`,
          type: alertType,
          icon: (
            <MessageSquare
              className={cn(
                "h-4 w-4",
                alertType === "critical"
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400"
              )}
            />
          ),
          title: comment.author,
          description: `${comment.body.substring(0, 100)}${comment.body.length > 100 ? "..." : ""} (Due: ${formatDate(dueDate)})`,
        });
      }
    });

    return alertList;
  }, [member, metrics, commentAlerts]);
  ```

- [ ] **AC-004:** Alert urgency logic:
  - Due in 3 days or less → `critical` (red)
  - Due in more than 3 days → `warning` (amber)
  - Past due date → Not shown (filtered by query)

- [ ] **AC-005:** Alert description format:
  - Show comment body (truncated to 100 chars if longer)
  - Show due date in readable format
  - Show author name as title

- [ ] **AC-006:** Comment body truncation:
  ```typescript
  const truncateComment = (body: string, maxLength: number = 100): string => {
    if (body.length <= maxLength) return body;
    return `${body.substring(0, maxLength)}...`;
  };
  ```

### Alert Ordering

- [ ] **AC-007:** Alerts should be ordered by priority:
  1. Critical alerts (past due or due within 3 days)
  2. Warning alerts (due within 7 days)
  3. Info alerts (all others)

  ```typescript
  // Sort alerts by priority
  const sortedAlerts = alertList.sort((a, b) => {
    const priorityOrder = { critical: 0, warning: 1 };
    return priorityOrder[a.type] - priorityOrder[b.type];
  });
  ```

### Date Formatting

- [ ] **AC-008:** Consistent date formatting:
  ```typescript
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  ```

---

## 🎯 Implementation Guide

### Step 1: Update MemberAlertsCard

1. Open `src/features/members/components/MemberAlertsCard.tsx`
2. Add import for `useActiveCommentAlerts` hook
3. Add import for `MemberComment` type
4. Add import for `MessageSquare` icon from lucide-react

### Step 2: Fetch Comment Alerts

Add the hook call at the top of the component:

```typescript
const { data: commentAlerts = [] } = useActiveCommentAlerts(member.id);
```

### Step 3: Integrate into Alerts Array

Add comment alert generation logic to the `useMemo` block that creates the alerts array. Place it after existing alerts but before the return statement.

### Step 4: Test Alert Display

```typescript
// Test scenarios:
// 1. Comment due tomorrow (should be critical)
// 2. Comment due in 5 days (should be warning)
// 3. Comment due in past (should not appear)
// 4. Long comment body (should truncate)
```

---

## 🧪 Testing Checklist

### Functional Testing

- [ ] Comments with future due dates appear as alerts
- [ ] Comments with past due dates do NOT appear
- [ ] Comments without due dates do NOT appear in alerts
- [ ] Alert type is "critical" when due in 3 days or less
- [ ] Alert type is "warning" when due in more than 3 days
- [ ] Comment body truncates at 100 characters
- [ ] Due date displays in correct format
- [ ] Author name displays as alert title
- [ ] Alerts refresh when comments are added/updated/deleted
- [ ] Multiple comment alerts can coexist with other alert types

### Visual Testing

- [ ] Comment alerts have MessageSquare icon
- [ ] Critical alerts are red (text-red-600/dark:text-red-400)
- [ ] Warning alerts are amber (text-amber-600/dark:text-amber-400)
- [ ] Alert formatting matches existing alerts
- [ ] Long comment bodies don't break layout
- [ ] Alerts are responsive on mobile

### Edge Cases

- [ ] Member with 10+ comment alerts
- [ ] Comment due today (0 days)
- [ ] Comment due tomorrow (1 day)
- [ ] Comment due in exactly 3 days
- [ ] Very long comment body (500+ characters)
- [ ] Comment with special characters in body
- [ ] Multiple comments with same due date

### Integration Testing

- [ ] Adding comment with due date creates alert immediately
- [ ] Updating comment due date updates alert
- [ ] Deleting comment removes alert
- [ ] Alert disappears automatically after due date passes
- [ ] Comment alerts sort correctly with other alert types

---

## 🚀 Performance Considerations

**Must follow CLAUDE.md guidelines:**

- ✅ useMemo for alerts array computation
- ✅ useActiveCommentAlerts has refetchInterval: 60000 (1 min)
- ✅ Query caching prevents excessive database calls
- ✅ Truncation happens in render, not stored in database
- ✅ Component remains under 250 lines

---

## 📝 Notes

### Alert Lifecycle

```
Comment Created          Comment Past Due
with due_date      →     Alert Disappears
     ↓                          ↑
Shows in Alerts    →     Still in Comments
(until due date)         (permanent record)
```

### Future Enhancements

- Add "Dismiss" button for alerts (mark as acknowledged)
- Add snooze functionality (postpone due date)
- Add link from alert to comment in comments section
- Add notification email/SMS for critical alerts
- Add alert history (track when alerts were seen)

### Alert Priority Examples

| Due Date   | Days Until | Alert Type | Color |
| ---------- | ---------- | ---------- | ----- |
| Yesterday  | -1         | None       | N/A   |
| Today      | 0          | Critical   | Red   |
| Tomorrow   | 1          | Critical   | Red   |
| In 3 days  | 3          | Critical   | Red   |
| In 4 days  | 4          | Warning    | Amber |
| In 7 days  | 7          | Warning    | Amber |
| In 30 days | 30         | Warning    | Amber |
| Past (any) | Negative   | None       | N/A   |

---

## 🔍 Code Example

### Complete Alert Integration

```typescript
// In MemberAlertsCard.tsx
const alerts = useMemo((): Alert[] => {
  const alertList: Alert[] = [];

  // ... existing alerts (subscription, equipment, birthday, payments)

  // Comment-based alerts
  commentAlerts.forEach((comment) => {
    if (!comment.due_date) return;

    const dueDate = new Date(comment.due_date);
    const today = new Date();
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only show alerts for future dates
    if (daysUntilDue < 0) return;

    const alertType = daysUntilDue <= 3 ? "critical" : "warning";
    const iconColor =
      alertType === "critical"
        ? "text-red-600 dark:text-red-400"
        : "text-amber-600 dark:text-amber-400";

    alertList.push({
      id: `comment-${comment.id}`,
      type: alertType,
      icon: <MessageSquare className={cn("h-4 w-4", iconColor)} />,
      title: comment.author,
      description: `${comment.body.substring(0, 100)}${comment.body.length > 100 ? "..." : ""} (Due: ${formatDate(dueDate)})`,
    });
  });

  // Sort by priority (critical first)
  return alertList.sort((a, b) => {
    const priorityOrder = { critical: 0, warning: 1 };
    return priorityOrder[a.type] - priorityOrder[b.type];
  });
}, [member, metrics, commentAlerts]);
```
