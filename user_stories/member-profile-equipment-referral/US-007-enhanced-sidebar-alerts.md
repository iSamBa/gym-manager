# US-007: Enhanced Sidebar & Alerts

**Epic:** Member Profile Enhancement - Equipment & Referral Tracking
**Story ID:** US-007
**Priority:** P0 (Must Have)
**Complexity:** Medium (~90 minutes)
**Dependencies:** ✅ US-005 (Profile Header), ✅ US-006 (Information Cards)
**Status:** 🟡 PENDING

---

## 📝 User Story

**As a** gym staff member
**I want** to see key activity metrics and operational alerts in the sidebar
**So that** I can quickly identify important member information and issues that need attention

---

## 💼 Business Value

**Why This Matters:**

- **Operational Awareness:** Alerts highlight critical issues (missing uniform, expiring subscription)
- **Quick Insights:** Activity metrics provide instant member engagement snapshot
- **Proactive Service:** Staff can address issues before member asks
- **Time Savings:** No need to navigate to separate pages for metrics/alerts

**Impact:**

- Without this: Staff miss critical member issues, reactive service
- With this: Proactive identification of issues, better member experience

---

## ✅ Acceptance Criteria

### Enhanced Activity Card

- [ ] **AC-001:** Create `EnhancedActivityCard` component extending current Activity Summary with:
  - Card header: "Activity Summary" with Activity icon
  - Member Since (existing - formatted date)
  - Account Created (existing - formatted date)
  - Sessions This Month (new - calculated from DB)
  - Last Session (new - formatted date from DB)
  - Payment Status (new - "Current" or "Overdue")

- [ ] **AC-002:** Sessions This Month calculation:
  - Query: COUNT from `training_session_members` WHERE:
    - `member_id` = current member
    - `attendance_status` = 'attended'
    - Month and year = current month/year
  - Display: "X sessions this month"

- [ ] **AC-003:** Last Session calculation:
  - Query: MAX(`check_in_time`) from `training_session_members` WHERE:
    - `member_id` = current member
    - `attendance_status` = 'attended'
  - Display: Formatted date (e.g., "Jan 15, 2025")
  - Empty state: "No sessions yet"

- [ ] **AC-004:** Payment Status calculation:
  - Query: COUNT from `subscription_payments` WHERE:
    - `member_id` = current member
    - `payment_status` IN ('pending', 'failed')
    - `due_date` < CURRENT_DATE
  - Display: "Current" (green badge) if count = 0
  - Display: "Overdue" (red badge) if count > 0

### Member Alerts Card

- [ ] **AC-005:** Create `MemberAlertsCard` component with:
  - Card header: "Alerts" with AlertCircle icon
  - List of relevant alerts (see AC-006 through AC-009)
  - Each alert shows: Icon, title, description
  - Alert colors: Amber for warnings, Red for critical
  - Empty state: "✓ No alerts" (green text) when all clear

- [ ] **AC-006:** Expiring Subscription Alert:
  - Condition: `subscription.end_date - CURRENT_DATE <= 7 days`
  - Icon: Calendar (amber)
  - Title: "Subscription Expiring Soon"
  - Description: "Renews in X days" (calculated)
  - Only shown if member has active subscription

- [ ] **AC-007:** Missing Equipment Alert:
  - Condition: `member.uniform_received = false`
  - Icon: Package (amber)
  - Title: "Uniform Not Received"
  - Description: "Member has not received uniform yet"

- [ ] **AC-008:** Upcoming Birthday Alert:
  - Condition: Birthday within next 7 days (check month/day only)
  - Icon: Cake (amber)
  - Title: "Birthday Coming Up"
  - Description: "Birthday on [date]" (formatted as "MMM DD")

- [ ] **AC-009:** Outstanding Payments Alert:
  - Condition: Has overdue payments (from Payment Status query)
  - Icon: DollarSign (red - critical)
  - Title: "Outstanding Payments"
  - Description: "X overdue payment(s)" (count)

### Design & Styling

- [ ] **AC-010:** Alert styling consistency:
  - Warning alerts: `bg-amber-50 border-l-4 border-amber-400 p-4`
  - Critical alerts: `bg-red-50 border-l-4 border-red-400 p-4`
  - Icon color matches border color
  - Title: `font-medium text-sm`
  - Description: `text-sm text-muted-foreground`

- [ ] **AC-011:** Card styling:
  - Follows existing card design (p-6 padding)
  - Alerts stacked vertically with gap-3
  - Empty state: Center-aligned, green checkmark icon
  - Responsive: Maintains layout on all screen sizes

### Performance & Technical

- [ ] **AC-012:** Efficient data fetching:
  - Use existing member data from `useMemberWithSubscription` hook
  - Create `useMemberActivityMetrics` hook for sessions/payments data
  - Client-side alert calculation (no additional DB calls)
  - `useMemo` for all calculations

- [ ] **AC-013:** Performance optimizations:
  - `React.memo` on both card components
  - `useCallback` for any handlers
  - `useMemo` for alert list generation
  - No unnecessary re-renders

---

## 🔧 Technical Implementation

### Step 1: Create useMemberActivityMetrics Hook

**File:** `src/features/members/hooks/use-member-activity-metrics.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface ActivityMetrics {
  sessionsThisMonth: number;
  lastSessionDate: Date | null;
  overduePaymentsCount: number;
}

export function useMemberActivityMetrics(memberId: string) {
  return useQuery({
    queryKey: ["member-activity-metrics", memberId],
    queryFn: async (): Promise<ActivityMetrics> => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Sessions this month
      const { count: sessionsCount } = await supabase
        .from("training_session_members")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .eq("attendance_status", "attended")
        .gte(
          "check_in_time",
          new Date(currentYear, currentMonth, 1).toISOString()
        )
        .lt(
          "check_in_time",
          new Date(currentYear, currentMonth + 1, 1).toISOString()
        );

      // Last session
      const { data: lastSession } = await supabase
        .from("training_session_members")
        .select("check_in_time")
        .eq("member_id", memberId)
        .eq("attendance_status", "attended")
        .order("check_in_time", { ascending: false })
        .limit(1)
        .single();

      // Overdue payments
      const { count: overdueCount } = await supabase
        .from("subscription_payments")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .in("payment_status", ["pending", "failed"])
        .lt("due_date", new Date().toISOString().split("T")[0]);

      return {
        sessionsThisMonth: sessionsCount || 0,
        lastSessionDate: lastSession?.check_in_time
          ? new Date(lastSession.check_in_time)
          : null,
        overduePaymentsCount: overdueCount || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
```

### Step 2: Create EnhancedActivityCard

**File:** `src/features/members/components/EnhancedActivityCard.tsx`

```tsx
"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, DollarSign } from "lucide-react";
import { useMemberActivityMetrics } from "@/features/members/hooks";
import type { Member } from "@/features/database/lib/types";

interface EnhancedActivityCardProps {
  member: Member;
}

export const EnhancedActivityCard = memo(function EnhancedActivityCard({
  member,
}: EnhancedActivityCardProps) {
  const { data: metrics } = useMemberActivityMetrics(member.id);

  const formatDate = useMemo(
    () =>
      (date: Date): string => {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      },
    []
  );

  const paymentStatus = useMemo(() => {
    if (!metrics) return null;
    return metrics.overduePaymentsCount > 0 ? "overdue" : "current";
  }, [metrics]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Activity Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Member Since */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Member Since</span>
          <span>{formatDate(new Date(member.join_date))}</span>
        </div>

        {/* Account Created */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Account Created</span>
          <span>{formatDate(new Date(member.created_at))}</span>
        </div>

        {/* Sessions This Month */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sessions This Month</span>
          <span className="font-medium">
            {metrics?.sessionsThisMonth ?? "—"}
          </span>
        </div>

        {/* Last Session */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Last Session</span>
          <span>
            {metrics?.lastSessionDate
              ? formatDate(metrics.lastSessionDate)
              : "No sessions yet"}
          </span>
        </div>

        {/* Payment Status */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Payment Status</span>
          {paymentStatus && (
            <Badge
              variant={paymentStatus === "current" ? "default" : "destructive"}
              className="text-xs"
            >
              {paymentStatus === "current" ? "Current" : "Overdue"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
```

### Step 3: Create MemberAlertsCard

**File:** `src/features/members/components/MemberAlertsCard.tsx`

```tsx
"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Calendar,
  Package,
  Cake,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { useMemberActivityMetrics } from "@/features/members/hooks";
import type { Member } from "@/features/database/lib/types";
import { cn } from "@/lib/utils";

interface MemberAlertsCardProps {
  member: Member;
}

interface Alert {
  id: string;
  type: "warning" | "critical";
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const MemberAlertsCard = memo(function MemberAlertsCard({
  member,
}: MemberAlertsCardProps) {
  const { data: metrics } = useMemberActivityMetrics(member.id);

  const alerts = useMemo((): Alert[] => {
    const alertList: Alert[] = [];

    // Expiring subscription
    if (member.subscription?.end_date) {
      const endDate = new Date(member.subscription.end_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
        alertList.push({
          id: "expiring-subscription",
          type: "warning",
          icon: <Calendar className="h-4 w-4 text-amber-600" />,
          title: "Subscription Expiring Soon",
          description: `Renews in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`,
        });
      }
    }

    // Missing equipment
    if (!member.uniform_received) {
      alertList.push({
        id: "missing-uniform",
        type: "warning",
        icon: <Package className="h-4 w-4 text-amber-600" />,
        title: "Uniform Not Received",
        description: "Member has not received uniform yet",
      });
    }

    // Upcoming birthday
    if (member.date_of_birth) {
      const today = new Date();
      const birthDate = new Date(member.date_of_birth);
      const thisYearBirthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      );

      const daysUntilBirthday = Math.ceil(
        (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilBirthday >= 0 && daysUntilBirthday <= 7) {
        alertList.push({
          id: "upcoming-birthday",
          type: "warning",
          icon: <Cake className="h-4 w-4 text-amber-600" />,
          title: "Birthday Coming Up",
          description: `Birthday on ${thisYearBirthday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        });
      }
    }

    // Outstanding payments
    if (metrics && metrics.overduePaymentsCount > 0) {
      alertList.push({
        id: "outstanding-payments",
        type: "critical",
        icon: <DollarSign className="h-4 w-4 text-red-600" />,
        title: "Outstanding Payments",
        description: `${metrics.overduePaymentsCount} overdue payment${metrics.overduePaymentsCount !== 1 ? "s" : ""}`,
      });
    }

    return alertList;
  }, [member, metrics]);

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>No alerts</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-4 w-4" />
          Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "rounded-md border-l-4 p-4",
              alert.type === "warning"
                ? "border-amber-400 bg-amber-50"
                : "border-red-400 bg-red-50"
            )}
          >
            <div className="flex items-start gap-3">
              {alert.icon}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-muted-foreground text-sm">
                  {alert.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
```

### Step 4: Update Component Exports

**File:** `src/features/members/components/index.ts`

```typescript
export { EnhancedActivityCard } from "./EnhancedActivityCard";
export { MemberAlertsCard } from "./MemberAlertsCard";
```

**File:** `src/features/members/hooks/index.ts`

```typescript
export { useMemberActivityMetrics } from "./use-member-activity-metrics";
```

### Step 5: Update page.tsx Sidebar

Replace existing Activity Summary card with new components in sidebar:

```tsx
{
  /* Sidebar */
}
<div className="space-y-6">
  {/* Subscription Status - Keep existing */}
  <Card>...</Card>

  {/* Enhanced Activity Summary */}
  <EnhancedActivityCard member={member} />

  {/* Member Alerts */}
  <MemberAlertsCard member={member} />
</div>;
```

---

## 🧪 Testing Checklist

### Alert Logic Tests

- [ ] Expiring subscription alert shows when <= 7 days
- [ ] Expiring subscription alert hidden when > 7 days
- [ ] Missing uniform alert shows when uniform_received = false
- [ ] Upcoming birthday alert shows when within 7 days
- [ ] Outstanding payments alert shows when overdue exists
- [ ] "No alerts" state shows when all conditions clear

### Metrics Calculation Tests

- [ ] Sessions this month counts correctly
- [ ] Sessions this month = 0 when no sessions
- [ ] Last session shows correct date
- [ ] Last session shows "No sessions yet" when none
- [ ] Payment status "Current" when no overdue
- [ ] Payment status "Overdue" when has overdue

### Visual Tests

- [ ] Alert colors correct (amber for warning, red for critical)
- [ ] Icons aligned properly
- [ ] Empty state styled correctly
- [ ] Cards fit in sidebar layout
- [ ] Responsive on all screen sizes

### Performance Tests

- [ ] React.memo prevents unnecessary re-renders
- [ ] useMemo used for all calculations
- [ ] Hook doesn't cause excessive DB calls
- [ ] Data refreshes appropriately (60s interval)

---

## 📂 Files to Create/Modify

### Create:

- `src/features/members/hooks/use-member-activity-metrics.ts`
- `src/features/members/components/EnhancedActivityCard.tsx`
- `src/features/members/components/MemberAlertsCard.tsx`

### Modify:

- `src/app/members/[id]/page.tsx` (replace Activity Summary in sidebar)
- `src/features/members/components/index.ts` (add exports)
- `src/features/members/hooks/index.ts` (add hook export)

---

## ✅ Definition of Done

This user story is DONE when:

- [ ] All 13 acceptance criteria met
- [ ] Hook and 2 card components created
- [ ] All alert conditions working correctly
- [ ] All metrics calculating correctly
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Linting passes
- [ ] React.memo and useMemo applied
- [ ] Manually tested with various member states
- [ ] STATUS.md updated

---

## 🔗 Related User Stories

- **Depends on:** US-005 (Profile Header), US-006 (Information Cards)
- **Completes:** Sidebar enhancement
- **Enables:** Complete member profile redesign

---

**Next Steps After Completion:**

1. Mark US-007 as COMPLETED in STATUS.md
2. Test alerts with various member scenarios
3. Move to US-008 (Testing & Polish)
