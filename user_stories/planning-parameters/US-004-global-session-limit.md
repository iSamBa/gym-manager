# US-004: Global Studio Session Limit

**Feature:** Studio Planning Parameters & Visual Indicators
**Story ID:** US-004
**Priority:** P0 (Must Have)
**Estimated Effort:** 2 days
**Dependencies:** US-001 (Planning Settings)
**Status:** ✅ Completed
**Completed:** 2025-10-18
**Implementation Notes:** All backend validation, frontend UI, and tests implemented successfully. Database function uses scheduled_start::DATE for accurate week calculations.

---

## 📖 User Story

**As a** gym administrator
**I want** to enforce a maximum number of training sessions per week across the entire studio
**So that** we don't overbook our facility, maintain service quality, and prevent trainer burnout

---

## 💼 Business Value

**Why This Matters:**

- **Capacity Management** - Prevent overbooking beyond physical/staffing capacity
- **Service Quality** - Maintain trainer-to-member ratio for effective coaching
- **Staff Well-being** - Prevent trainer burnout from excessive sessions
- **Compliance** - Meet facility occupancy limits and safety regulations

**Expected Outcomes:**

- Zero instances of studio overbooking
- Improved member satisfaction (less crowded sessions)
- Better trainer performance (manageable workload)
- Clear visibility of weekly capacity utilization

---

## ✅ Acceptance Criteria

### AC-001: Session Count Calculation

**Given** it is Monday, October 18, 2025
**When** I check the studio session limit for the week
**Then** the system should count all sessions from Monday (Oct 18) through Sunday (Oct 24)
**And** include sessions with status: 'scheduled', 'completed'
**And** exclude sessions with status: 'cancelled'

### AC-002: Booking Prevention

**Given** the studio has reached the weekly session limit (e.g., 250/250)
**When** a user attempts to book a new session for this week
**Then** the booking form should display an alert: "Studio capacity reached for this week (250/250 sessions)"
**And** the booking button should be disabled
**And** the user should not be able to submit the booking

**Given** the studio is 1 session below the limit (e.g., 249/250)
**When** a user books a session
**Then** the booking should succeed
**And** the limit should now show (250/250)
**And** subsequent booking attempts should be blocked

### AC-003: Visual Indicator

**Given** I am viewing the session booking interface
**When** the studio is approaching or at capacity
**Then** I should see a visual indicator showing:

- Current session count / Maximum allowed
- Progress bar or percentage
- Color coding:
  - Green: 0-80% capacity (0-200 sessions for limit of 250)
  - Yellow: 80-95% capacity (200-237 sessions)
  - Red: 95-100% capacity (238-250 sessions)

### AC-004: Week Boundary Handling

**Given** it is Sunday at 11:59 PM
**And** the studio is at capacity (250/250)
**When** the clock turns to Monday 12:00 AM (new week)
**Then** the session count should reset to the number of sessions scheduled for the new week
**And** booking should be allowed again (up to the limit)

### AC-005: Multi-Week Booking

**Given** the studio is at capacity for the current week
**When** I attempt to book a session for NEXT week
**Then** the booking should be allowed if next week is not at capacity
**And** the session count should only include sessions for that specific week

### AC-006: Validation on Backend

**Given** a malicious user bypasses frontend validation
**When** they submit a booking request that would exceed the limit
**Then** the backend should reject the request
**And** return an error: "Studio capacity exceeded for this week"
**And** the session should NOT be created in the database

### AC-007: Admin Override (Optional)

**Given** I am logged in as an admin
**And** the studio is at capacity
**When** I need to book an emergency or priority session
**Then** I should have an option to "Override capacity limit"
**And** after confirming, the booking should succeed
**And** the system should log this override for auditing

---

## 🎨 UI/UX Requirements

### Session Limit Warning Component

```
┌─────────────────────────────────────────────────────┐
│  Studio Capacity                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                     │
│  Week of Oct 18 - Oct 24, 2025                      │
│                                                     │
│  [███████████████████████████████████████░░] 95%    │
│                                                     │
│  237 / 250 sessions booked                          │
│  (13 sessions remaining)                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**At Capacity (Red State):**

```
┌─────────────────────────────────────────────────────┐
│  ⚠️ Studio Capacity Reached                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                     │
│  Week of Oct 18 - Oct 24, 2025                      │
│                                                     │
│  [████████████████████████████████████████████] 100%│
│                                                     │
│  250 / 250 sessions booked                          │
│                                                     │
│  ⚠️ No additional bookings allowed this week.       │
│  Please book for next week or contact admin.        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Design Specifications

**Components to Use:**

- shadcn/ui Alert component
- shadcn/ui Progress component
- shadcn/ui Card component
- shadcn/ui Button (disabled state)

**Color Scheme:**

- Green (0-80%): `text-green-600`, `bg-green-100`, `border-green-300`
- Yellow (80-95%): `text-yellow-600`, `bg-yellow-100`, `border-yellow-300`
- Red (95-100%): `text-red-600`, `bg-red-100`, `border-red-300`

**Placement:**

- Above booking form
- On calendar view (optional - global indicator)
- In admin dashboard (capacity overview)

---

## 🔧 Technical Implementation

### Database Function

**Function:** `check_studio_session_limit(week_start DATE, week_end DATE)`

```sql
CREATE OR REPLACE FUNCTION check_studio_session_limit(
  p_week_start DATE,
  p_week_end DATE
)
RETURNS TABLE (
  current_count INTEGER,
  max_allowed INTEGER,
  can_book BOOLEAN,
  percentage INTEGER
) AS $$
DECLARE
  v_current_count INTEGER;
  v_max_allowed INTEGER;
  v_percentage INTEGER;
BEGIN
  -- Get max allowed from settings
  SELECT max_sessions_per_week INTO v_max_allowed
  FROM studio_planning_settings
  LIMIT 1;

  -- Count sessions in this week (exclude cancelled)
  SELECT COUNT(*) INTO v_current_count
  FROM training_sessions
  WHERE session_date >= p_week_start
    AND session_date <= p_week_end
    AND status != 'cancelled';

  -- Calculate percentage
  v_percentage := (v_current_count * 100) / NULLIF(v_max_allowed, 0);

  RETURN QUERY SELECT
    v_current_count,
    v_max_allowed,
    (v_current_count < v_max_allowed) AS can_book,
    v_percentage;
END;
$$ LANGUAGE plpgsql;
```

### TypeScript Types

**File:** `src/features/training-sessions/types.ts` (add to existing)

```typescript
export interface StudioSessionLimit {
  current_count: number;
  max_allowed: number;
  can_book: boolean;
  percentage: number;
}

export interface WeekRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}
```

### Utility Functions

**File:** `src/features/training-sessions/lib/session-limit-utils.ts`

```typescript
import { supabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date-utils";
import type { StudioSessionLimit, WeekRange } from "../types";

/**
 * Get the start and end dates of the week containing the given date.
 * Week is Monday-Sunday.
 */
export function getWeekRange(date: Date): WeekRange {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday

  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: getLocalDateString(monday),
    end: getLocalDateString(sunday),
  };
}

/**
 * Check if studio has reached weekly session limit.
 */
export async function checkStudioSessionLimit(
  date: Date
): Promise<StudioSessionLimit> {
  const weekRange = getWeekRange(date);

  const { data, error } = await supabase.rpc("check_studio_session_limit", {
    p_week_start: weekRange.start,
    p_week_end: weekRange.end,
  });

  if (error) throw error;

  return (
    data[0] || {
      current_count: 0,
      max_allowed: 0,
      can_book: false,
      percentage: 0,
    }
  );
}

/**
 * Get color scheme based on capacity percentage.
 */
export function getCapacityColorScheme(percentage: number): {
  text: string;
  bg: string;
  border: string;
  variant: "default" | "warning" | "error";
} {
  if (percentage >= 95) {
    return {
      text: "text-red-600",
      bg: "bg-red-100",
      border: "border-red-300",
      variant: "error",
    };
  } else if (percentage >= 80) {
    return {
      text: "text-yellow-600",
      bg: "bg-yellow-100",
      border: "border-yellow-300",
      variant: "warning",
    };
  } else {
    return {
      text: "text-green-600",
      bg: "bg-green-100",
      border: "border-green-300",
      variant: "default",
    };
  }
}
```

### React Hook

**File:** `src/features/training-sessions/hooks/use-studio-session-limit.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import {
  checkStudioSessionLimit,
  getWeekRange,
} from "../lib/session-limit-utils";

export function useStudioSessionLimit(date: Date) {
  const weekRange = getWeekRange(date);

  return useQuery({
    queryKey: ["studio-session-limit", weekRange.start, weekRange.end],
    queryFn: () => checkStudioSessionLimit(date),
    staleTime: 30000, // Revalidate every 30 seconds
  });
}
```

### UI Component

**File:** `src/features/training-sessions/components/SessionLimitWarning.tsx`

```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { useStudioSessionLimit } from "../hooks/use-studio-session-limit";
import { getCapacityColorScheme, getWeekRange } from "../lib/session-limit-utils";

interface SessionLimitWarningProps {
  date: Date;
}

export function SessionLimitWarning({ date }: SessionLimitWarningProps) {
  const { data: limit, isLoading } = useStudioSessionLimit(date);
  const weekRange = getWeekRange(date);

  if (isLoading || !limit) return null;

  const colorScheme = getCapacityColorScheme(limit.percentage);
  const isAtCapacity = !limit.can_book;

  return (
    <Alert
      variant={isAtCapacity ? "destructive" : "default"}
      className={`${colorScheme.bg} ${colorScheme.border}`}
    >
      {isAtCapacity && <AlertTriangle className="h-4 w-4" />}
      <AlertTitle>
        {isAtCapacity ? "Studio Capacity Reached" : "Studio Capacity"}
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-2 mt-2">
          <p className="text-sm">
            Week of {weekRange.start} - {weekRange.end}
          </p>

          <Progress value={limit.percentage} className="w-full" />

          <p className={`text-sm font-semibold ${colorScheme.text}`}>
            {limit.current_count} / {limit.max_allowed} sessions booked
            {!isAtCapacity && ` (${limit.max_allowed - limit.current_count} remaining)`}
          </p>

          {isAtCapacity && (
            <p className="text-sm mt-2">
              ⚠️ No additional bookings allowed this week. Please book for next
              week or contact admin.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

### Integration with Booking Form

**File:** `src/features/training-sessions/components/SessionBookingForm.tsx` (modify existing)

```typescript
import { SessionLimitWarning } from "./SessionLimitWarning";
import { useStudioSessionLimit } from "../hooks/use-studio-session-limit";

export function SessionBookingForm({ selectedDate, ...props }) {
  const { data: limit } = useStudioSessionLimit(selectedDate);

  const canBook = limit?.can_book ?? true;

  return (
    <div className="space-y-4">
      <SessionLimitWarning date={selectedDate} />

      <form onSubmit={handleSubmit}>
        {/* Form fields */}

        <Button type="submit" disabled={!canBook}>
          {canBook ? "Book Session" : "Capacity Reached"}
        </Button>
      </form>
    </div>
  );
}
```

### Backend Validation

**File:** `src/app/api/training-sessions/book/route.ts` (or equivalent API endpoint)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkStudioSessionLimit } from "@/features/training-sessions/lib/session-limit-utils";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { session_date, member_id, trainer_id } = body;

  // Validate session limit
  const limit = await checkStudioSessionLimit(new Date(session_date));
  if (!limit.can_book) {
    return NextResponse.json(
      { error: "Studio capacity exceeded for this week" },
      { status: 400 }
    );
  }

  // Proceed with booking
  const { data, error } = await supabase
    .from("training_sessions")
    .insert({
      member_id,
      trainer_id,
      session_date,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

---

## 🧪 Testing Requirements

### Unit Tests

**File:** `src/features/training-sessions/lib/__tests__/session-limit-utils.test.ts`

Test cases:

- ✅ `getWeekRange` returns correct Monday-Sunday for any date
- ✅ `getWeekRange` handles Sunday correctly (should be end of week, not start)
- ✅ `getWeekRange` handles year boundaries
- ✅ `checkStudioSessionLimit` returns correct count
- ✅ `checkStudioSessionLimit` excludes cancelled sessions
- ✅ `getCapacityColorScheme` returns green for 0-79%
- ✅ `getCapacityColorScheme` returns yellow for 80-94%
- ✅ `getCapacityColorScheme` returns red for 95-100%

**File:** `src/features/training-sessions/hooks/__tests__/use-studio-session-limit.test.ts`

Test cases:

- ✅ Hook fetches session limit on mount
- ✅ Hook revalidates every 30 seconds
- ✅ Hook updates when date changes

### Integration Tests

Manual testing checklist:

1. Configure max sessions to 10 (for easy testing)
2. Book 8 sessions for current week
3. Verify capacity indicator shows 8/10 (green/yellow)
4. Book 2 more sessions (total 10/10)
5. Verify capacity indicator shows 10/10 (red)
6. Verify "Book Session" button is disabled
7. Try booking another session → Should be blocked
8. Cancel 1 session
9. Verify capacity updates to 9/10
10. Verify booking button is re-enabled
11. Book session for NEXT week → Should succeed

Backend validation:

- Use API testing tool (Postman/curl)
- Bypass frontend, send direct POST request
- Verify backend rejects when limit reached

---

## 📋 Definition of Done

- [ ] Database function `check_studio_session_limit` created and tested
- [ ] Utility functions implemented and tested
- [ ] `useStudioSessionLimit` hook implemented and tested
- [ ] `SessionLimitWarning` component implemented and tested
- [ ] Component integrated into booking form
- [ ] Booking button disabled when limit reached
- [ ] Backend validation implemented
- [ ] All unit tests pass (100% coverage)
- [ ] Manual testing completed successfully
- [ ] Tested edge cases: Week boundaries, cancelled sessions, concurrent bookings
- [ ] Code reviewed and approved
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

---

## 🔗 Related User Stories

- **Depends on:** US-001 (Planning Settings)
- **Blocks:** None
- **Related to:** US-003 (Calendar indicators), US-005 (Auto-inactivation)

---

## 📝 Notes

- Week definition: Monday-Sunday (configurable in future enhancement)
- Cancelled sessions do NOT count toward limit
- Consider adding admin override capability for emergencies
- Future enhancement: Different limits for different membership tiers
- Future enhancement: Trainer-specific session limits

---

**Ready to implement?** → See AGENT-GUIDE.md for step-by-step implementation workflow!
