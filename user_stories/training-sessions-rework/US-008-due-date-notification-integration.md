# US-008: Due-Date Notification Integration

## 📋 User Story

**As a** gym administrator
**I want** notification badges on sessions when members have upcoming due dates
**So that** I can remind members about payments or renewals during their session

---

## ✅ Acceptance Criteria

### AC-1: Notification Badge Component

- [ ] SessionNotificationBadge component created
- [ ] Displays count of due-date alerts
- [ ] Red circular badge design
- [ ] Positioned top-right of session slot

### AC-2: Due-Date Query Logic

- [ ] Query member_comments for member with due_date
- [ ] Filter: due_date >= session.scheduled_start
- [ ] Count number of matching comments
- [ ] Cache results for performance

### AC-3: Badge Display Logic

- [ ] Only shows if alert_count > 0
- [ ] Only on sessions before or on due_date
- [ ] Sessions after due_date have no badge
- [ ] Badge updates when comments change

---

## 🛠️ Implementation

### Hook: `useSessionAlerts`

```typescript
// src/features/training-sessions/hooks/use-session-alerts.ts

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useSessionAlerts(sessionId: string, memberId?: string) {
  return useQuery({
    queryKey: ["session-alerts", sessionId, memberId],
    queryFn: async () => {
      if (!memberId) return null;

      // Get session to check scheduled_start
      const { data: session } = await supabase
        .from("training_sessions")
        .select("scheduled_start")
        .eq("id", sessionId)
        .single();

      if (!session) return null;

      // Query member_comments with due_date >= session date
      const { data: comments } = await supabase
        .from("member_comments")
        .select("id, due_date")
        .eq("member_id", memberId)
        .not("due_date", "is", null)
        .gte("due_date", session.scheduled_start);

      return {
        session_id: sessionId,
        member_id: memberId,
        alert_count: comments?.length || 0,
      };
    },
    enabled: !!memberId,
    staleTime: 60000, // Cache for 1 minute
  });
}
```

### Component: `SessionNotificationBadge`

```typescript
// src/features/training-sessions/components/SessionNotificationBadge.tsx

import React from "react";
import { Bell } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SessionNotificationBadgeProps {
  count: number;
}

export const SessionNotificationBadge: React.FC<SessionNotificationBadgeProps> = ({
  count,
}) => {
  if (count === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shadow-lg cursor-help">
          {count}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{count} upcoming reminder{count > 1 ? "s" : ""}</p>
      </TooltipContent>
    </Tooltip>
  );
};
```

### Integration in TimeSlot

```typescript
// Update TimeSlot component to include alerts

import { useSessionAlerts } from "../hooks/use-session-alerts";
import { SessionNotificationBadge } from "./SessionNotificationBadge";

export const TimeSlot = memo<TimeSlotProps>(({ session, ... }) => {
  const memberId = session?.participants?.[0]?.id;
  const { data: alerts } = useSessionAlerts(session?.id || "", memberId);

  return (
    <div className="...">
      {/* Session content */}
      <div className="font-medium text-sm">{memberName}</div>
      <div className="text-xs text-gray-600">{timeSlot.label}</div>

      {/* Notification badge */}
      {alerts && <SessionNotificationBadge count={alerts.alert_count} />}
    </div>
  );
});
```

---

## 🧪 Testing

```typescript
describe("useSessionAlerts", () => {
  it("returns alert count for member with due-date comments", async () => {
    // Create member with due-date comment
    const member = await createMember();
    await createComment({
      member_id: member.id,
      body: "Payment reminder",
      due_date: "2025-01-20", // Future date
    });

    const session = await createSession({
      member_id: member.id,
      scheduled_start: "2025-01-15T10:00:00Z", // Before due_date
    });

    const { result } = renderHook(() =>
      useSessionAlerts(session.id, member.id)
    );

    await waitFor(() => {
      expect(result.current.data?.alert_count).toBe(1);
    });
  });

  it("returns 0 for session after due_date", async () => {
    const member = await createMember();
    await createComment({
      member_id: member.id,
      due_date: "2025-01-10", // Past date
    });

    const session = await createSession({
      member_id: member.id,
      scheduled_start: "2025-01-15T10:00:00Z", // After due_date
    });

    const { result } = renderHook(() =>
      useSessionAlerts(session.id, member.id)
    );

    await waitFor(() => {
      expect(result.current.data?.alert_count).toBe(0);
    });
  });
});

describe("SessionNotificationBadge", () => {
  it("renders badge with count", () => {
    render(<SessionNotificationBadge count={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not render when count is 0", () => {
    const { container } = render(<SessionNotificationBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });
});
```

---

## 🎯 Definition of Done

- [ ] useSessionAlerts hook created
- [ ] Badge component created
- [ ] Integrated in TimeSlot
- [ ] Query logic correct (due_date >= session date)
- [ ] Tests passing
- [ ] Code review approved

**Estimated Effort:** 2-3 hours
