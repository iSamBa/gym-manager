# US-003: Business Logic Fixes

**Story ID**: US-003
**Feature**: Session-Subscription Consistency Fix
**Type**: Enhancement
**Priority**: P0 (Must Have)
**Complexity**: Large
**Estimated Effort**: 8 hours

---

## User Story

**As a** developer
**I want** session creation, deletion, and counting logic to correctly use subscription_id
**So that** credits are consumed and restored accurately, and session counts are consistent

---

## Business Value

Correct business logic ensures:

1. **Accurate Credit Tracking**: Sessions consume credits from correct subscription
2. **Proper Restoration**: Deleted sessions restore credits to original subscription
3. **Consistent Counts**: Session math always adds up (completed + scheduled + remaining = total)
4. **Race Condition Prevention**: Transactions prevent overbooking
5. **Type Filtering**: Only subscription-relevant sessions count toward limits

**Impact**: Directly affects billing accuracy and user trust.

---

## Acceptance Criteria

### Must Have

- [ ] **AC-1**: Session creation stores `subscription_id` when booking member/makeup/contractual sessions
- [ ] **AC-2**: Session creation uses transaction to prevent race conditions
- [ ] **AC-3**: Session deletion restores credit to original subscription (via `subscription_id`)
- [ ] **AC-4**: Session deletion handles missing `subscription_id` gracefully (fallback with warning)
- [ ] **AC-5**: Session counting filters by `session_type` (exclude trial/guest/cancelled)
- [ ] **AC-6**: Remaining sessions queried directly from subscription table
- [ ] **AC-7**: Contractual session counting handles missing trial session edge case
- [ ] **AC-8**: All affected hooks updated and tested
- [ ] **AC-9**: Unit tests pass for all changed functions
- [ ] **AC-10**: Integration tests verify correct behavior end-to-end

### Nice to Have

- [ ] Retry logic for transaction conflicts
- [ ] Detailed logging for credit consumption/restoration
- [ ] Performance metrics for session operations

---

## Technical Scope

### Files to Modify

1. **`src/features/training-sessions/hooks/use-training-sessions.ts`** (lines 264-392, 688-808)
   - Update `createSession` to store subscription_id
   - Update `deleteSession` to restore to original subscription
   - Add transaction support

2. **`src/features/training-sessions/hooks/use-member-dialog-data.ts`** (lines 71-130)
   - Add session_type filtering
   - Query subscription for remaining_sessions

3. **`src/features/memberships/lib/subscription-utils.ts`** (lines 66-103)
   - Fix contractual counting edge case

4. **`src/features/database/lib/types.ts`**
   - Ensure TrainingSession includes subscription_id

---

## Implementation Guide

### Part 1: Update Session Creation Logic

**File**: `src/features/training-sessions/hooks/use-training-sessions.ts`

**Current Problem** (lines 264-290):

```typescript
// Step 1: Check
if (remainingSessions <= 0) throw new Error("No sessions");

// Step 2: Create
const { data: session } = await supabase
  .from("training_sessions")
  .insert(sessionData); // NO subscription_id!

// Step 3: Consume (race condition possible between steps)
await consumeSession(subscription.id);
```

**Fixed Version**:

```typescript
// lines 264-392 refactor
const createSession = async (sessionData: CreateSessionInput) => {
  const { member_id, session_type, ...rest } = sessionData;

  // Get active subscription if needed
  let subscriptionId: string | null = null;
  if (session_type in ["member", "makeup", "contractual"]) {
    const subscription =
      await subscriptionUtils.getMemberActiveSubscription(member_id);
    if (!subscription) {
      throw new Error("No active subscription found");
    }
    if (subscription.remaining_sessions <= 0) {
      throw new Error("No remaining sessions in subscription");
    }
    subscriptionId = subscription.id;
  }

  // Use transaction to prevent race condition
  const { data: session, error } = await supabase.rpc("create_session_atomic", {
    p_member_id: member_id,
    p_session_type: session_type,
    p_subscription_id: subscriptionId,
    p_session_data: rest,
  });

  if (error) throw error;

  return session;
};
```

**Database Function** (create via Supabase MCP):

```sql
CREATE OR REPLACE FUNCTION create_session_atomic(
  p_member_id UUID,
  p_session_type TEXT,
  p_subscription_id UUID,
  p_session_data JSONB
) RETURNS training_sessions AS $$
DECLARE
  v_session training_sessions;
BEGIN
  -- Insert session
  INSERT INTO training_sessions (
    member_id,
    session_type,
    subscription_id,
    -- ... other fields from p_session_data
  ) VALUES (
    p_member_id,
    p_session_type,
    p_subscription_id,
    -- ... extract from p_session_data
  ) RETURNING * INTO v_session;

  -- Consume credit if subscription-based
  IF p_subscription_id IS NOT NULL THEN
    UPDATE member_subscriptions
    SET used_sessions = used_sessions + 1,
        remaining_sessions = remaining_sessions - 1
    WHERE id = p_subscription_id
      AND remaining_sessions > 0;  -- Ensures we don't go negative

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No remaining sessions or subscription not found';
    END IF;
  END IF;

  RETURN v_session;
END;
$$ LANGUAGE plpgsql;
```

---

### Part 2: Update Session Deletion Logic

**File**: `src/features/training-sessions/hooks/use-training-sessions.ts`

**Current Problem** (lines 735-778):

```typescript
// Restore to CURRENT active subscription (WRONG!)
const activeSub = await getMemberActiveSubscription(session.member_id);
await restoreSessionCredit(activeSub.id);
```

**Fixed Version**:

```typescript
// lines 688-808 refactor
const deleteSession = async (sessionId: string) => {
  // Get session details
  const { data: session } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) throw new Error("Session not found");

  // Determine which subscription to restore credit to
  let subscriptionToRestore: string | null = null;

  if (
    session.session_type === "contractual" &&
    session.counted_in_subscription_id
  ) {
    // Contractual sessions: use counted_in_subscription_id
    subscriptionToRestore = session.counted_in_subscription_id;
  } else if (session.subscription_id) {
    // Member/makeup sessions: use subscription_id (NEW!)
    subscriptionToRestore = session.subscription_id;
  } else {
    // Fallback for legacy data (no subscription_id)
    console.warn(
      `Session ${sessionId} missing subscription_id, using active subscription as fallback`
    );
    const activeSub = await subscriptionUtils.getMemberActiveSubscription(
      session.member_id
    );
    if (activeSub) {
      subscriptionToRestore = activeSub.id;
    }
  }

  // Delete session and restore credit in transaction
  if (subscriptionToRestore) {
    const { error } = await supabase.rpc("delete_session_atomic", {
      p_session_id: sessionId,
      p_subscription_id: subscriptionToRestore,
    });

    if (error) throw error;
  } else {
    // Trial/guest sessions - just delete
    await supabase.from("training_sessions").delete().eq("id", sessionId);
  }

  return { success: true };
};
```

**Database Function**:

```sql
CREATE OR REPLACE FUNCTION delete_session_atomic(
  p_session_id UUID,
  p_subscription_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Restore credit
  UPDATE member_subscriptions
  SET used_sessions = used_sessions - 1,
      remaining_sessions = remaining_sessions + 1
  WHERE id = p_subscription_id;

  -- Delete session
  DELETE FROM training_sessions
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;
```

---

### Part 3: Fix Session Counting Logic

**File**: `src/features/training-sessions/hooks/use-member-dialog-data.ts`

**Current Problem** (lines 83-89, 106-112):

```typescript
// Counts ALL sessions (includes trial/guest)
.eq("booking_status", "confirmed")
.eq("training_sessions.status", "completed")
// NO session_type filter!
```

**Fixed Version**:

```typescript
// lines 71-130 refactor
export function useMemberDialogData(memberId: string, sessionId: string) {
  // ... existing code ...

  // Fetch remaining sessions from subscription
  const { data: subscription } = useQuery({
    queryKey: ["member-active-subscription", memberId],
    queryFn: async () => {
      const { data } = await supabase
        .from("member_subscriptions")
        .select("remaining_sessions, total_sessions_snapshot")
        .eq("member_id", memberId)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
  });

  // Count completed sessions (FILTER by type and exclude cancelled)
  const { data: completedSessions } = useQuery({
    queryKey: ["member-completed-sessions", memberId],
    queryFn: async () => {
      const { count } = await supabase
        .from("training_sessions")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .eq("booking_status", "confirmed")
        .eq("status", "completed")
        .in("session_type", ["member", "makeup", "contractual"]) // ADD FILTER
        .neq("status", "cancelled"); // EXCLUDE cancelled

      return count || 0;
    },
  });

  // Count scheduled sessions (FILTER by type)
  const { data: scheduledSessions } = useQuery({
    queryKey: ["member-scheduled-sessions", memberId],
    queryFn: async () => {
      const { count } = await supabase
        .from("training_sessions")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .in("booking_status", ["confirmed", "waitlisted"])
        .in("status", ["scheduled", "in_progress"])
        .in("session_type", ["member", "makeup", "contractual"]) // ADD FILTER
        .gte("scheduled_start", new Date().toISOString());

      return count || 0;
    },
  });

  return {
    completedSessions,
    scheduledSessions,
    remainingSessions: subscription?.remaining_sessions ?? null,
    totalSessions: subscription?.total_sessions_snapshot ?? null,
  };
}
```

---

### Part 4: Fix Contractual Session Counting

**File**: `src/features/memberships/lib/subscription-utils.ts`

**Current Problem** (lines 69-79):

```typescript
// Find member's LAST trial session
const { data: trialSession } = await supabase
  .from("training_sessions")
  .eq("session_type", "trial")
  .order("scheduled_start", { ascending: false })
  .limit(1)
  .maybeSingle();

// If NO trial session, this fails!
const startDate = trialSession.scheduled_start; // ERROR if null
```

**Fixed Version**:

```typescript
// lines 66-103 refactor
export async function countContractualSessions(
  memberId: string,
  subscriptionId: string
): Promise<number> {
  const supabase = createClient();

  // Get member join date for fallback
  const { data: member } = await supabase
    .from("members")
    .select("join_date")
    .eq("id", memberId)
    .single();

  if (!member) throw new Error("Member not found");

  // Try to find last trial session
  const { data: trialSession } = await supabase
    .from("training_sessions")
    .select("scheduled_start")
    .eq("member_id", memberId)
    .eq("session_type", "trial")
    .order("scheduled_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fallback chain: trial session → member join date → subscription start
  const startDate =
    trialSession?.scheduled_start ||
    member.join_date ||
    new Date().toISOString(); // Last resort: today

  // Count contractual sessions since startDate
  const { count } = await supabase
    .from("training_sessions")
    .select("*", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("session_type", "contractual")
    .eq("status", "completed")
    .gte("scheduled_start", startDate);

  return count || 0;
}
```

---

## Testing Requirements

### Unit Tests

**File**: `src/features/training-sessions/__tests__/use-training-sessions.test.ts`

```typescript
describe("Session Creation", () => {
  it("stores subscription_id when creating member session", async () => {
    const session = await createSession({
      member_id: "test-member",
      session_type: "member",
      // ...
    });
    expect(session.subscription_id).toBe(mockSubscription.id);
  });

  it("does not require subscription_id for trial session", async () => {
    const session = await createSession({
      member_id: "test-member",
      session_type: "trial",
      // ...
    });
    expect(session.subscription_id).toBeNull();
  });

  it("throws error if no remaining sessions", async () => {
    mockSubscription.remaining_sessions = 0;
    await expect(createSession({...})).rejects.toThrow("No remaining sessions");
  });
});

describe("Session Deletion", () => {
  it("restores credit to original subscription", async () => {
    const session = { id: "s1", subscription_id: "sub1" };
    await deleteSession(session.id);
    // Verify subscription "sub1" has credit restored
  });

  it("handles missing subscription_id gracefully", async () => {
    const session = { id: "s1", subscription_id: null, member_id: "m1" };
    // Should not throw, should use fallback
    await expect(deleteSession(session.id)).resolves.not.toThrow();
  });
});

describe("Session Counting", () => {
  it("excludes trial sessions from subscription count", async () => {
    // Create 1 member session, 1 trial session
    const count = await countCompletedSessions(memberId);
    expect(count).toBe(1); // Only member session counted
  });

  it("excludes cancelled sessions from count", async () => {
    // Create 1 completed, 1 cancelled
    const count = await countCompletedSessions(memberId);
    expect(count).toBe(1); // Only completed counted
  });

  it("math adds up: completed + scheduled + remaining = total", async () => {
    const data = await useMemberDialogData(memberId, sessionId);
    const sum = data.completedSessions + data.scheduledSessions + data.remainingSessions;
    expect(sum).toBe(data.totalSessions);
  });
});
```

### Integration Tests

**File**: `src/features/training-sessions/__tests__/session-lifecycle.test.ts`

```typescript
describe("Session Lifecycle Integration", () => {
  it("complete flow: create → delete → credit restored", async () => {
    const initialRemaining = subscription.remaining_sessions;

    // Create session
    const session = await createSession({...});
    expect(subscription.remaining_sessions).toBe(initialRemaining - 1);

    // Delete session
    await deleteSession(session.id);
    expect(subscription.remaining_sessions).toBe(initialRemaining);
  });

  it("concurrent bookings do not exceed limit", async () => {
    subscription.remaining_sessions = 1;

    // Try to book 2 sessions simultaneously
    const results = await Promise.allSettled([
      createSession({...}),
      createSession({...})
    ]);

    // One should succeed, one should fail
    const succeeded = results.filter(r => r.status === "fulfilled").length;
    expect(succeeded).toBe(1);
  });
});
```

---

## Definition of Done

- [ ] All files updated with new logic
- [ ] Session creation stores subscription_id
- [ ] Session deletion restores to correct subscription
- [ ] Session counting filters by type
- [ ] Contractual counting handles edge cases
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No TypeScript errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Manual testing completed
- [ ] STATUS.md updated
- [ ] Code committed with proper message

---

## Dependencies

**Blocked By**: US-002 (needs subscription_id column)

**Blocks**: US-004 (UI relies on correct logic)

---

## Risks & Mitigation

| Risk                    | Mitigation                               |
| ----------------------- | ---------------------------------------- |
| Transaction deadlocks   | Proper lock ordering, retry logic        |
| Regression bugs         | Comprehensive test coverage              |
| Performance degradation | Benchmark before/after, optimize queries |

---

## Commit Message Template

```bash
git add src/features/training-sessions/ src/features/memberships/
git commit -m "fix(sessions): implement subscription_id tracking and fix credit restoration [US-003]

Business logic fixes:
- Session creation now stores subscription_id for member/makeup/contractual
- Session deletion restores credit to original subscription (via subscription_id)
- Session counting filters by type (excludes trial/guest/cancelled)
- Contractual counting handles missing trial session edge case
- Added transaction support to prevent race conditions
- Remaining sessions queried directly from subscription table

Breaking change: Session creation/deletion logic modified.
All tests updated and passing."
```

---

**Status**: 🔴 Not Started
**Last Updated**: 2025-10-31
