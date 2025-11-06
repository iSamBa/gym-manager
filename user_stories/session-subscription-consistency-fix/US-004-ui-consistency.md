# US-004: UI Consistency Updates

**Story ID**: US-004
**Feature**: Session-Subscription Consistency Fix
**Type**: Enhancement
**Priority**: P1 (Should Have)
**Complexity**: Medium
**Estimated Effort**: 4 hours

---

## User Story

**As an** administrator
**I want** consistent session counts displayed across all UI components
**So that** I can trust the data I see and make informed decisions

---

## Business Value

UI consistency is critical for user trust:

1. **Data Integrity**: All views show same numbers (no discrepancies)
2. **User Confidence**: Accurate counts build trust in the system
3. **Decision Making**: Admins rely on these numbers for planning
4. **Error Detection**: Inconsistent UI reveals underlying data issues
5. **Professional Appearance**: Polished UI reflects system quality

**Without consistency**: Users question the entire system's reliability.

---

## Acceptance Criteria

### Must Have

- [ ] **AC-1**: All components query subscription directly for `remaining_sessions`
- [ ] **AC-2**: SessionStatsCards displays accurate session counts
- [ ] **AC-3**: MemberDetailsTab uses standardized counting logic from `use-member-dialog-data`
- [ ] **AC-4**: All components apply session type filtering consistently
- [ ] **AC-5**: Session math verifiable on screen: completed + scheduled + remaining = total
- [ ] **AC-6**: Manual testing checklist 100% passed
- [ ] **AC-7**: No console errors or warnings
- [ ] **AC-8**: Edge cases handled gracefully (no subscription, zero remaining)

### Nice to Have

- [ ] Loading states for session counts
- [ ] Visual indicator when session count approaches limit
- [ ] Validation badge showing integrity status (dev mode)

---

## Technical Scope

### Files to Modify

1. **`src/features/training-sessions/components/SessionStatsCards.tsx`**
   - Remove reliance on session data having remaining_sessions
   - Query subscription directly

2. **`src/features/training-sessions/components/forms/MemberDetailsTab.tsx`**
   - Use `useMemberDialogData` hook for all session counts
   - Ensure consistency with SessionStatsCards

3. **`src/features/members/components/MemberSessionsTable.tsx`** (if applicable)
   - Apply session type filtering
   - Show subscription reference if relevant

---

## Implementation Guide

### Part 1: Update SessionStatsCards Component

**File**: `src/features/training-sessions/components/SessionStatsCards.tsx`

**Current Issue**: May rely on session data to have `remaining_sessions` field

**Fixed Version**:

```typescript
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";

interface SessionStatsCardsProps {
  memberId: string;
  completedCount: number;
  scheduledCount: number;
}

export function SessionStatsCards({
  memberId,
  completedCount,
  scheduledCount
}: SessionStatsCardsProps) {
  const supabase = createClient();

  // Query subscription for remaining sessions
  const { data: subscription } = useQuery({
    queryKey: ["member-subscription-stats", memberId],
    queryFn: async () => {
      const { data } = await supabase
        .from("member_subscriptions")
        .select("remaining_sessions, total_sessions_snapshot")
        .eq("member_id", memberId)
        .eq("status", "active")
        .maybeSingle();
      return data;
    }
  });

  const remainingSessions = subscription?.remaining_sessions ?? null;
  const totalSessions = subscription?.total_sessions_snapshot ?? null;

  // Verify math adds up (for debugging/validation)
  const isConsistent = totalSessions !== null &&
    (completedCount + scheduledCount + remainingSessions === totalSessions);

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Sessions Done"
        value={completedCount}
        icon={CheckCircle}
        variant="success"
      />
      <StatCard
        title="Scheduled"
        value={scheduledCount}
        icon={Calendar}
        variant="info"
      />
      <StatCard
        title="Remaining"
        value={remainingSessions ?? "N/A"}
        icon={HourglassIcon}
        variant={remainingSessions === 0 ? "warning" : "default"}
      />
      <StatCard
        title="Total"
        value={totalSessions ?? "N/A"}
        icon={Target}
        variant="default"
      />

      {/* Optional: Show validation indicator in dev mode */}
      {process.env.NODE_ENV === "development" && !isConsistent && (
        <div className="col-span-4 text-xs text-amber-600">
          ⚠️ Count mismatch: {completedCount} + {scheduledCount} + {remainingSessions} ≠ {totalSessions}
        </div>
      )}
    </div>
  );
}
```

---

### Part 2: Update MemberDetailsTab Component

**File**: `src/features/training-sessions/components/forms/MemberDetailsTab.tsx`

**Current Issue** (line 199): May use `session.remaining_sessions` from RPC data

**Fixed Version**:

```typescript
import { useMemberDialogData } from "@/features/training-sessions/hooks/use-member-dialog-data";

export function MemberDetailsTab({ memberId, sessionId }: MemberDetailsTabProps) {
  // Use standardized hook for all session counts
  const {
    completedSessions,
    scheduledSessions,
    remainingSessions,
    totalSessions
  } = useMemberDialogData(memberId, sessionId);

  // ... rest of component

  return (
    <div className="space-y-6">
      {/* Member information */}
      <MemberInfoSection member={member} />

      {/* Session stats */}
      <SessionStatsCards
        memberId={memberId}
        completedCount={completedSessions}
        scheduledCount={scheduledSessions}
      />

      {/* Subscription info */}
      {totalSessions !== null && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-2">Active Subscription</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Sessions:</span>
              <span className="ml-2 font-medium">{totalSessions}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining:</span>
              <span className="ml-2 font-medium">{remainingSessions}</span>
            </div>
          </div>
          {remainingSessions === 0 && (
            <Alert variant="warning" className="mt-2">
              No remaining sessions. Please renew subscription.
            </Alert>
          )}
        </div>
      )}

      {/* Outstanding balance */}
      <OutstandingBalanceSection memberId={memberId} />
    </div>
  );
}
```

---

### Part 3: Update MemberSessionsTable (Optional)

**File**: `src/features/members/components/MemberSessionsTable.tsx`

**Enhancement**: Show subscription reference, filter appropriately

```typescript
export function MemberSessionsTable({ memberId }: MemberSessionsTableProps) {
  const { data: sessions } = useQuery({
    queryKey: ["member-sessions", memberId],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_sessions")
        .select(`
          *,
          subscription:member_subscriptions(id, total_sessions_snapshot)
        `)
        .eq("member_id", memberId)
        .order("scheduled_start", { ascending: false });
      return data;
    }
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Subscription</TableHead> {/* New column */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions?.map((session) => (
          <TableRow key={session.id}>
            <TableCell>{formatDate(session.scheduled_start)}</TableCell>
            <TableCell>
              <Badge variant={getSessionTypeBadge(session.session_type)}>
                {session.session_type}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadge(session.status)}>
                {session.status}
              </Badge>
            </TableCell>
            <TableCell>
              {session.subscription ? (
                <span className="text-xs text-muted-foreground">
                  {session.subscription.total_sessions_snapshot}-session plan
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  No subscription
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## Manual Testing Checklist

### Scenario 1: Member with Active Subscription

**Setup**:

- Member has 10-session subscription
- 4 sessions completed
- 2 sessions scheduled
- 4 remaining

**Test**:

- [ ] SessionStatsCards shows: Done=4, Scheduled=2, Remaining=4, Total=10
- [ ] MemberDetailsTab shows same numbers
- [ ] Math adds up: 4 + 2 + 4 = 10
- [ ] All views consistent

### Scenario 2: Member Without Subscription

**Setup**:

- Member has no active subscription
- Has trial sessions only

**Test**:

- [ ] Remaining sessions shows "N/A"
- [ ] Total sessions shows "N/A"
- [ ] Trial sessions not counted toward subscription
- [ ] No errors in console

### Scenario 3: Zero Remaining Sessions

**Setup**:

- Member has used all sessions
- Remaining = 0

**Test**:

- [ ] Remaining shows 0 (not "N/A")
- [ ] Warning indicator displayed
- [ ] Cannot book new session (validation prevents it)
- [ ] Math still adds up

### Scenario 4: Session Lifecycle Updates

**Setup**:

- Member with active subscription

**Test**:

- [ ] Book new session → Remaining decrements immediately
- [ ] Delete session → Remaining increments immediately
- [ ] Complete session → Done increments, Scheduled decrements
- [ ] Cancel session → Not counted in any category
- [ ] All views update in real-time

### Scenario 5: Edge Cases

**Test**:

- [ ] Member with expired subscription shows correctly
- [ ] Member with future-dated subscription handled
- [ ] Member with negative remaining (legacy data) displays warning
- [ ] Very large session counts (100+) display correctly

---

## Testing Requirements

### Manual UI Testing

**Required**: Complete above checklist before marking story done

**Browser testing**:

- [ ] Chrome
- [ ] Firefox
- [ ] Safari (if applicable)

**Responsive testing**:

- [ ] Desktop (1920x1080)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

### Console Checks

```bash
# Open browser console during testing
# Verify:
- [ ] No React errors
- [ ] No hydration mismatches
- [ ] No key prop warnings
- [ ] No useEffect dependency warnings
```

### Performance Check

```bash
# React DevTools Profiler
# Record interaction: book session → cancel session
# Verify:
- [ ] Minimal re-renders (<10)
- [ ] Components memoized properly
- [ ] No unnecessary re-fetches
```

---

## Definition of Done

- [ ] All components updated with standardized logic
- [ ] SessionStatsCards queries subscription directly
- [ ] MemberDetailsTab uses `useMemberDialogData`
- [ ] Manual testing checklist 100% passed
- [ ] All scenarios tested and working
- [ ] No console errors or warnings
- [ ] Edge cases handled gracefully
- [ ] TypeScript build passes
- [ ] Code committed with proper message

---

## Dependencies

**Blocked By**: US-003 (needs fixed counting logic)

**Blocks**: None (can deploy independently after US-003)

---

## Risks & Mitigation

| Risk                  | Mitigation                                      |
| --------------------- | ----------------------------------------------- |
| UI regression         | Manual testing checklist, screenshot comparison |
| Performance issues    | React DevTools profiling, memo optimization     |
| Mobile display issues | Responsive testing, breakpoint verification     |

---

## Related Documentation

- [useMemberDialogData Hook](../../../src/features/training-sessions/hooks/use-member-dialog-data.ts)
- [SessionStatsCards Component](../../../src/features/training-sessions/components/SessionStatsCards.tsx)
- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - See "US-004: UI Consistency Updates"

---

## Commit Message Template

```bash
git add src/features/training-sessions/components/ src/features/members/components/
git commit -m "refactor(ui): standardize session count display across components [US-004]

UI consistency improvements:
- SessionStatsCards now queries subscription directly for remaining_sessions
- MemberDetailsTab uses useMemberDialogData for all counts
- All components apply consistent session type filtering
- Edge cases handled gracefully (no subscription, zero remaining)
- Added validation indicator in dev mode
- Manual testing checklist completed

No breaking changes. All tests passing."
```

---

**Status**: 🔴 Not Started
**Last Updated**: 2025-10-31
