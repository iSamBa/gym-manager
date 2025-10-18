# US-003: Calendar Visual Indicators

**Feature:** Studio Planning Parameters & Visual Indicators
**Story ID:** US-003
**Priority:** P0 (Must Have)
**Estimated Effort:** 3 days
**Dependencies:** US-001 (Planning Settings), US-002 (Body Checkup Tracking)
**Status:** ✅ Completed (2025-10-18)

---

## 📖 User Story

**As a** gym trainer or staff member
**I want** to see visual icons in the calendar indicating when members need attention (subscription expiring, body checkup due, payment reminder)
**So that** I can proactively address member needs during their training sessions without checking multiple systems

---

## 💼 Business Value

**Why This Matters:**

- **Proactive Service** - Staff can address needs before members ask, improving experience
- **Revenue Protection** - Payment and subscription reminders reduce lapses and cancellations
- **Member Retention** - Timely checkups and renewals show you care about member progress
- **Operational Efficiency** - All relevant information visible at-a-glance in calendar view

**Expected Outcomes:**

- 90% reduction in missed subscription renewals
- 50% reduction in time spent checking member status
- Improved member satisfaction scores
- Increased revenue from timely payment reminders

---

## ✅ Acceptance Criteria

### AC-001: Subscription Expiration Icon

**Given** a member has a subscription that expires within X days (configured in US-001)
**And** I am viewing the calendar
**When** that member has a training session scheduled
**Then** I should see a **hourglass icon (pink/red)** displayed on their session
**And** when I hover over the icon, I should see a tooltip: "Subscription expires on [DATE] ([X] days remaining)"

**Given** the subscription expiration is more than X days away
**Then** the hourglass icon should NOT appear

### AC-002: Body Checkup Reminder Icon

**Given** a member has completed Y sessions since their last body checkup (Y = configured threshold from US-001)
**And** I am viewing the calendar
**When** that member has a training session scheduled
**Then** I should see a **scale/weight icon (gold/yellow)** displayed on their session
**And** when I hover over the icon, I should see a tooltip: "Body checkup due ([Y] sessions since last checkup)"

**Given** the member has not reached the session threshold
**Then** the scale icon should NOT appear

**Given** the member has never had a body checkup
**And** they have completed Y or more sessions total
**Then** the scale icon SHOULD appear

### AC-003: Payment Reminder Icon

**Given** it has been Z days since the member's last payment (Z = configured threshold from US-001)
**And** I am viewing the calendar
**When** that member has a training session scheduled
**Then** I should see a **coins/money icon (green)** displayed on their session
**And** when I hover over the icon, I should see a tooltip: "Payment due (last payment: [DATE], [Z] days ago)"

**Given** the last payment was less than Z days ago
**Then** the payment icon should NOT appear

### AC-004: Multiple Icons

**Given** a member meets criteria for 2 or 3 indicators simultaneously
**When** viewing their session in the calendar
**Then** ALL applicable icons should be displayed
**And** icons should be positioned to not overlap (horizontal layout)
**And** tooltips should work independently for each icon

### AC-005: No Icons Displayed

**Given** a member does not meet any indicator criteria
**When** viewing their session in the calendar
**Then** NO planning indicator icons should be displayed

### AC-006: Performance

**Given** the calendar displays 100+ sessions
**When** I load the calendar view
**Then** the page should load within 2 seconds
**And** there should be no visual lag when scrolling

---

## 🎨 UI/UX Requirements

### Icon Positioning on Calendar Events

```
┌─────────────────────────────────────────┐
│  10:00 AM - Training Session            │
│  John Doe                                │
│                           🏜️ ⚖️ 💰      │
└─────────────────────────────────────────┘
  ↑ Session details      ↑ Icons (top-right)
```

**Icon Specifications:**

- Size: 20x20px (or appropriate for calendar event size)
- Position: Top-right corner of calendar event
- Spacing: 4px gap between icons
- Order: Hourglass, Scale, Coins (left to right)
- Hover state: Slight scale effect (1.1x)

### Tooltip Design

```
┌─────────────────────────────────────────┐
│  Subscription expires on 2025-11-22     │
│  (35 days remaining)                    │
└─────────────────────────────────────────┘
```

**Tooltip Specifications:**

- Background: Dark gray with slight transparency
- Text: White, 12px font size
- Padding: 8px
- Border radius: 4px
- Arrow pointing to icon
- Delay: 300ms on hover

### Design Specifications

**Components to Use:**

- shadcn/ui Tooltip component
- Custom icon component (PlanningIndicatorIcons)
- Icons: Use emojis or lucide-react icons
  - Hourglass: ⏳ or `Hourglass` from lucide
  - Scale: ⚖️ or `Scale` from lucide
  - Coins: 💰 or `Coins` from lucide

**Styling:**

- Icons should be clearly visible against event background
- Use drop shadow if needed for visibility
- Responsive: Icons may stack vertically on mobile

---

## 🔧 Technical Implementation

### Calculation Utilities

**File:** `src/features/calendar/lib/planning-indicators.ts`

```typescript
import { compareDates, getLocalDateString } from "@/lib/date-utils";
import type { Member, TrainingSession, PlanningSettings } from "@/types";

export interface IndicatorFlags {
  showSubscriptionWarning: boolean;
  showBodyCheckupReminder: boolean;
  showPaymentReminder: boolean;
  subscriptionExpiryDate?: string;
  subscriptionDaysRemaining?: number;
  sessionsSinceCheckup?: number;
  lastPaymentDate?: string;
  daysSincePayment?: number;
}

export function calculatePlanningIndicators(
  member: Member & {
    subscription_end_date?: string | null;
    latest_body_checkup_date?: string | null;
    sessions_since_checkup?: number;
    latest_payment_date?: string | null;
  },
  session: TrainingSession,
  settings: PlanningSettings
): IndicatorFlags {
  const today = getLocalDateString(new Date());
  const sessionDate = session.session_date;

  // 1. Subscription Warning
  let showSubscriptionWarning = false;
  let subscriptionDaysRemaining: number | undefined;
  let subscriptionExpiryDate: string | undefined;

  if (member.subscription_end_date) {
    const endDate = member.subscription_end_date;
    const daysUntilExpiry = daysBetween(sessionDate, endDate);

    if (
      daysUntilExpiry >= 0 &&
      daysUntilExpiry <= settings.subscription_warning_days
    ) {
      showSubscriptionWarning = true;
      subscriptionDaysRemaining = daysUntilExpiry;
      subscriptionExpiryDate = endDate;
    }
  }

  // 2. Body Checkup Reminder
  let showBodyCheckupReminder = false;
  let sessionsSinceCheckup: number | undefined;

  if (member.sessions_since_checkup !== undefined) {
    if (member.sessions_since_checkup >= settings.body_checkup_sessions) {
      showBodyCheckupReminder = true;
      sessionsSinceCheckup = member.sessions_since_checkup;
    }
  }

  // 3. Payment Reminder
  let showPaymentReminder = false;
  let daysSincePayment: number | undefined;
  let lastPaymentDate: string | undefined;

  if (member.latest_payment_date) {
    const daysSince = daysBetween(member.latest_payment_date, sessionDate);

    if (daysSince >= settings.payment_reminder_days) {
      showPaymentReminder = true;
      daysSincePayment = daysSince;
      lastPaymentDate = member.latest_payment_date;
    }
  }

  return {
    showSubscriptionWarning,
    showBodyCheckupReminder,
    showPaymentReminder,
    subscriptionExpiryDate,
    subscriptionDaysRemaining,
    sessionsSinceCheckup,
    lastPaymentDate,
    daysSincePayment,
  };
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
```

### Data Fetching Enhancement

**File:** `src/features/calendar/hooks/use-calendar-sessions.ts` (modify existing)

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TrainingSession } from "@/types";

export function useCalendarSessions(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["calendar-sessions", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select(
          `
          *,
          member:members!inner (
            id,
            name,
            email,
            subscription_end_date,
            subscriptions (
              end_date
            ),
            payments (
              payment_date
            )
          )
        `
        )
        .gte("session_date", startDate)
        .lte("session_date", endDate)
        .order("session_date", { ascending: true });

      if (error) throw error;

      // Enrich with planning data
      const enrichedSessions = await Promise.all(
        data.map(async (session) => {
          // Get latest payment date
          const latestPayment = session.member.payments?.sort((a, b) =>
            b.payment_date.localeCompare(a.payment_date)
          )[0];

          // Get body checkup data
          const { data: checkupData } = await supabase.rpc(
            "get_latest_body_checkup",
            {
              p_member_id: session.member.id,
            }
          );

          return {
            ...session,
            member: {
              ...session.member,
              subscription_end_date:
                session.member.subscriptions?.[0]?.end_date || null,
              latest_payment_date: latestPayment?.payment_date || null,
              latest_body_checkup_date: checkupData?.[0]?.checkup_date || null,
              sessions_since_checkup:
                checkupData?.[0]?.sessions_since_checkup || 0,
            },
          };
        })
      );

      return enrichedSessions;
    },
  });
}
```

**⚠️ Performance Note:** The above implementation has N+1 query issues. In production, use a single SQL query with JOINs or a database function to fetch all data efficiently.

**Optimized version:**

```sql
CREATE OR REPLACE FUNCTION get_calendar_sessions_with_indicators(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  -- session fields
  id UUID,
  member_id UUID,
  session_date DATE,
  -- member fields
  member_name TEXT,
  subscription_end_date DATE,
  latest_payment_date DATE,
  latest_checkup_date DATE,
  sessions_since_checkup INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.id,
    ts.member_id,
    ts.session_date,
    m.name AS member_name,
    s.end_date AS subscription_end_date,
    p.payment_date AS latest_payment_date,
    bc.checkup_date AS latest_checkup_date,
    (SELECT COUNT(*) FROM training_sessions
     WHERE member_id = ts.member_id
       AND session_date > COALESCE(bc.checkup_date, '1900-01-01'::DATE)
       AND status = 'completed') AS sessions_since_checkup
  FROM training_sessions ts
  INNER JOIN members m ON ts.member_id = m.id
  LEFT JOIN LATERAL (
    SELECT end_date FROM subscriptions WHERE member_id = m.id ORDER BY end_date DESC LIMIT 1
  ) s ON true
  LEFT JOIN LATERAL (
    SELECT payment_date FROM payments WHERE member_id = m.id ORDER BY payment_date DESC LIMIT 1
  ) p ON true
  LEFT JOIN LATERAL (
    SELECT checkup_date FROM member_body_checkups WHERE member_id = m.id ORDER BY checkup_date DESC LIMIT 1
  ) bc ON true
  WHERE ts.session_date >= p_start_date
    AND ts.session_date <= p_end_date
  ORDER BY ts.session_date;
END;
$$ LANGUAGE plpgsql;
```

### Icon Component

**File:** `src/features/calendar/components/PlanningIndicatorIcons.tsx`

```typescript
import { memo } from "react";
import { Hourglass, Scale, Coins } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { IndicatorFlags } from "../lib/planning-indicators";

interface PlanningIndicatorIconsProps {
  indicators: IndicatorFlags;
}

export const PlanningIndicatorIcons = memo(function PlanningIndicatorIcons({
  indicators,
}: PlanningIndicatorIconsProps) {
  const {
    showSubscriptionWarning,
    showBodyCheckupReminder,
    showPaymentReminder,
    subscriptionExpiryDate,
    subscriptionDaysRemaining,
    sessionsSinceCheckup,
    lastPaymentDate,
    daysSincePayment,
  } = indicators;

  // Don't render anything if no indicators
  if (
    !showSubscriptionWarning &&
    !showBodyCheckupReminder &&
    !showPaymentReminder
  ) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* Subscription Warning */}
        {showSubscriptionWarning && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help hover:scale-110 transition-transform">
                <Hourglass className="w-5 h-5 text-red-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Subscription expires on {subscriptionExpiryDate}
              </p>
              <p className="text-xs">
                ({subscriptionDaysRemaining} days remaining)
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Body Checkup Reminder */}
        {showBodyCheckupReminder && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help hover:scale-110 transition-transform">
                <Scale className="w-5 h-5 text-yellow-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Body checkup due</p>
              <p className="text-xs">
                ({sessionsSinceCheckup} sessions since last checkup)
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Payment Reminder */}
        {showPaymentReminder && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help hover:scale-110 transition-transform">
                <Coins className="w-5 h-5 text-green-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Payment due</p>
              <p className="text-xs">
                Last payment: {lastPaymentDate} ({daysSincePayment} days ago)
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
});
```

### Calendar Integration

**File:** `src/features/calendar/components/CalendarEvent.tsx` (modify existing)

```typescript
import { useMemo } from "react";
import { usePlanningSettings } from "@/features/studio-settings/hooks/use-planning-settings";
import { calculatePlanningIndicators } from "../lib/planning-indicators";
import { PlanningIndicatorIcons } from "./PlanningIndicatorIcons";
import type { TrainingSession } from "@/types";

interface CalendarEventProps {
  session: TrainingSession;
  // ... other props
}

export function CalendarEvent({ session, ...props }: CalendarEventProps) {
  const { settings } = usePlanningSettings();

  const indicators = useMemo(() => {
    if (!settings || !session.member) return null;
    return calculatePlanningIndicators(session.member, session, settings);
  }, [session, settings]);

  return (
    <div className="calendar-event">
      {/* Existing event content */}
      <div className="event-header">
        <span>{session.member.name}</span>
        {indicators && <PlanningIndicatorIcons indicators={indicators} />}
      </div>
      {/* ... rest of event */}
    </div>
  );
}
```

---

## 🧪 Testing Requirements

### Unit Tests

**File:** `src/features/calendar/lib/__tests__/planning-indicators.test.ts`

Test cases:

- ✅ Subscription warning shows when within threshold
- ✅ Subscription warning doesn't show when outside threshold
- ✅ Subscription warning doesn't show if no end_date
- ✅ Body checkup reminder shows when threshold reached
- ✅ Body checkup reminder shows even if no prior checkup
- ✅ Body checkup reminder doesn't show when below threshold
- ✅ Payment reminder shows when days exceeded
- ✅ Payment reminder doesn't show when below threshold
- ✅ Payment reminder doesn't show if no prior payment
- ✅ Multiple indicators can be active simultaneously
- ✅ All indicators false returns correct flags

### Component Tests

**File:** `src/features/calendar/components/__tests__/PlanningIndicatorIcons.test.tsx`

Test cases:

- ✅ Renders nothing when no indicators active
- ✅ Renders hourglass icon when subscription warning active
- ✅ Renders scale icon when body checkup reminder active
- ✅ Renders coins icon when payment reminder active
- ✅ Renders all 3 icons when all active
- ✅ Tooltips display correct information
- ✅ Icons have correct colors and sizes

### Integration Tests

Manual testing checklist:

1. Configure planning settings (US-001)
2. Create test members with various scenarios:
   - Member A: Subscription expires in 10 days
   - Member B: 8 sessions since last checkup
   - Member C: Last payment 30 days ago
   - Member D: All three conditions met
   - Member E: None of the conditions met
3. Schedule sessions for all members
4. View calendar
5. Verify correct icons appear for each member
6. Hover over icons, verify tooltips
7. Test on different calendar views (day, week, month)

Performance testing:

- Load calendar with 100+ sessions
- Verify page loads within 2 seconds
- Check console for excessive re-renders
- Use React DevTools Profiler

---

## 📋 Definition of Done

- [ ] `planning-indicators.ts` utility implemented and tested
- [ ] `PlanningIndicatorIcons` component implemented and tested
- [ ] Calendar query enhanced to fetch planning data
- [ ] Database function for efficient data fetching (optional but recommended)
- [ ] Icons integrated into calendar events
- [ ] Tooltips display correct information
- [ ] Performance optimized (React.memo, useMemo)
- [ ] All unit tests pass (100% coverage for utils)
- [ ] Component tests pass (80%+ coverage)
- [ ] Manual testing completed successfully
- [ ] Verified with US-001 settings changes (icons update dynamically)
- [ ] Code reviewed and approved
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

---

## 🔗 Related User Stories

- **Depends on:** US-001 (Planning Settings), US-002 (Body Checkup Tracking)
- **Blocks:** None
- **Related to:** US-004, US-005 (other planning features)

---

## 📝 Notes

- This is the most visible feature to end users - UI polish is critical
- Performance is crucial - use memoization and database-level aggregations
- Consider adding setting to enable/disable specific indicator types
- Future enhancement: Color customization for icons
- Future enhancement: Click icon to take action (e.g., log checkup, process payment)

---

**Ready to implement?** → See AGENT-GUIDE.md for step-by-step implementation workflow!
