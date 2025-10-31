# US-005: Validation & Monitoring System

**Story ID**: US-005
**Feature**: Session-Subscription Consistency Fix
**Type**: Enhancement
**Priority**: P2 (Nice to Have)
**Complexity**: Medium
**Estimated Effort**: 5 hours

---

## User Story

**As a** system maintainer
**I want** automated validation to detect and alert on data inconsistencies
**So that** I can catch issues early and maintain data integrity over time

---

## Business Value

Validation and monitoring provide long-term protection:

1. **Early Detection**: Catch issues before they propagate
2. **Regression Prevention**: Detect when new bugs are introduced
3. **Audit Trail**: Track data integrity over time
4. **Confidence**: Prove system is working correctly
5. **Proactive Maintenance**: Fix issues before users notice

**Without validation**: We only discover issues when users complain.

---

## Acceptance Criteria

### Must Have

- [ ] **AC-1**: Validation utility function created (`validateSessionIntegrity`)
- [ ] **AC-2**: Validation hook created (`useSessionIntegrityValidator`)
- [ ] **AC-3**: Database function created (`check_session_integrity`)
- [ ] **AC-4**: Validation checks: completed + scheduled + remaining = total
- [ ] **AC-5**: Validation returns detailed breakdown on failure
- [ ] **AC-6**: Integration tests verify validation detects inconsistencies
- [ ] **AC-7**: Validation runs without performance impact (<100ms)
- [ ] **AC-8**: Hook integrated in member details view (optional display)

### Nice to Have

- [ ] Admin panel showing integrity status for all members
- [ ] Scheduled job to run validation nightly
- [ ] Email alerts for critical integrity violations
- [ ] Historical tracking of integrity over time
- [ ] Automated repair suggestions

---

## Technical Scope

### Files to Create

1. **`src/features/training-sessions/lib/session-validator.ts`**
   - Core validation logic
   - `validateSessionIntegrity()` function

2. **`src/features/training-sessions/hooks/use-session-integrity-validator.ts`**
   - React hook wrapper
   - Real-time validation in UI

3. **`src/features/training-sessions/__tests__/session-integrity.test.ts`**
   - Comprehensive test coverage
   - Edge case testing

### Database Objects to Create

- Database function: `check_session_integrity(member_id UUID) RETURNS JSON`

---

## Implementation Guide

### Part 1: Create Validation Utility

**File**: `src/features/training-sessions/lib/session-validator.ts`

```typescript
import { createClient } from "@/lib/supabase-server";

export interface SessionIntegrityResult {
  valid: boolean;
  memberId: string;
  subscriptionId: string | null;
  expected: number;
  actual: number;
  breakdown: {
    completed: number;
    scheduled: number;
    remaining: number;
  };
  message: string;
  issues?: string[];
}

/**
 * Validates that session counts add up correctly for a member
 * @param memberId - UUID of member to validate
 * @returns Detailed validation result
 */
export async function validateSessionIntegrity(
  memberId: string
): Promise<SessionIntegrityResult> {
  const supabase = createClient();

  // Get active subscription
  const { data: subscription } = await supabase
    .from("member_subscriptions")
    .select("id, total_sessions_snapshot, remaining_sessions, used_sessions")
    .eq("member_id", memberId)
    .eq("status", "active")
    .maybeSingle();

  // No active subscription = valid (nothing to validate)
  if (!subscription) {
    return {
      valid: true,
      memberId,
      subscriptionId: null,
      expected: 0,
      actual: 0,
      breakdown: { completed: 0, scheduled: 0, remaining: 0 },
      message: "No active subscription to validate",
    };
  }

  // Count completed sessions (member/makeup/contractual only)
  const { count: completedCount } = await supabase
    .from("training_sessions")
    .select("*", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("subscription_id", subscription.id) // Only from this subscription
    .eq("status", "completed")
    .in("session_type", ["member", "makeup", "contractual"]);

  // Count scheduled sessions
  const { count: scheduledCount } = await supabase
    .from("training_sessions")
    .select("*", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("subscription_id", subscription.id)
    .in("status", ["scheduled", "in_progress"])
    .in("session_type", ["member", "makeup", "contractual"]);

  const completed = completedCount || 0;
  const scheduled = scheduledCount || 0;
  const remaining = subscription.remaining_sessions;

  const expected = subscription.total_sessions_snapshot;
  const actual = completed + scheduled + remaining;

  const valid = actual === expected;

  // Collect specific issues
  const issues: string[] = [];
  if (!valid) {
    issues.push(`Expected ${expected} total, got ${actual}`);
    if (remaining < 0) {
      issues.push(`Negative remaining sessions: ${remaining}`);
    }
    if (subscription.used_sessions !== completed + scheduled) {
      issues.push(
        `used_sessions (${subscription.used_sessions}) doesn't match actual usage (${completed + scheduled})`
      );
    }
  }

  return {
    valid,
    memberId,
    subscriptionId: subscription.id,
    expected,
    actual,
    breakdown: { completed, scheduled, remaining },
    message: valid
      ? "Session integrity check passed"
      : `Session count mismatch: ${completed} + ${scheduled} + ${remaining} = ${actual} (expected ${expected})`,
    issues: valid ? undefined : issues,
  };
}

/**
 * Validates multiple members in batch
 * @param memberIds - Array of member UUIDs
 * @returns Array of validation results
 */
export async function validateMembersIntegrity(
  memberIds: string[]
): Promise<SessionIntegrityResult[]> {
  const results = await Promise.all(
    memberIds.map((id) => validateSessionIntegrity(id))
  );
  return results;
}

/**
 * Get summary statistics for validation results
 */
export function getIntegritySummary(results: SessionIntegrityResult[]) {
  const total = results.length;
  const valid = results.filter((r) => r.valid).length;
  const invalid = total - valid;
  const validPercentage = total > 0 ? ((valid / total) * 100).toFixed(1) : "0";

  return {
    total,
    valid,
    invalid,
    validPercentage: `${validPercentage}%`,
    invalidMembers: results.filter((r) => !r.valid).map((r) => r.memberId),
  };
}
```

---

### Part 2: Create Validation Hook

**File**: `src/features/training-sessions/hooks/use-session-integrity-validator.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import {
  validateSessionIntegrity,
  type SessionIntegrityResult,
} from "../lib/session-validator";

export interface UseSessionIntegrityValidatorOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * React hook to validate session integrity for a member
 * @param memberId - UUID of member to validate
 * @param options - Query options
 */
export function useSessionIntegrityValidator(
  memberId: string,
  options: UseSessionIntegrityValidatorOptions = {}
) {
  const { enabled = true, refetchInterval } = options;

  const query = useQuery<SessionIntegrityResult>({
    queryKey: ["session-integrity", memberId],
    queryFn: () => validateSessionIntegrity(memberId),
    enabled,
    refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    ...query,
    isValid: query.data?.valid ?? null,
    integrityResult: query.data,
    hasIssues: query.data?.valid === false,
  };
}

/**
 * Hook to validate multiple members
 */
export function useBatchIntegrityValidator(memberIds: string[]) {
  return useQuery({
    queryKey: ["session-integrity-batch", memberIds],
    queryFn: async () => {
      const { validateMembersIntegrity, getIntegritySummary } = await import(
        "../lib/session-validator"
      );
      const results = await validateMembersIntegrity(memberIds);
      const summary = getIntegritySummary(results);
      return { results, summary };
    },
    enabled: memberIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

---

### Part 3: Create Database Function

**SQL Function**:

```sql
-- Migration: create_session_integrity_function
-- Date: YYYY-MM-DD

CREATE OR REPLACE FUNCTION check_session_integrity(p_member_id UUID)
RETURNS JSON AS $$
DECLARE
  v_subscription member_subscriptions;
  v_completed INTEGER;
  v_scheduled INTEGER;
  v_actual INTEGER;
  v_valid BOOLEAN;
BEGIN
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM member_subscriptions
  WHERE member_id = p_member_id
    AND status = 'active'
  LIMIT 1;

  -- No active subscription
  IF v_subscription IS NULL THEN
    RETURN json_build_object(
      'valid', true,
      'message', 'No active subscription'
    );
  END IF;

  -- Count completed sessions
  SELECT COUNT(*) INTO v_completed
  FROM training_sessions
  WHERE member_id = p_member_id
    AND subscription_id = v_subscription.id
    AND status = 'completed'
    AND session_type IN ('member', 'makeup', 'contractual');

  -- Count scheduled sessions
  SELECT COUNT(*) INTO v_scheduled
  FROM training_sessions
  WHERE member_id = p_member_id
    AND subscription_id = v_subscription.id
    AND status IN ('scheduled', 'in_progress')
    AND session_type IN ('member', 'makeup', 'contractual');

  v_actual := v_completed + v_scheduled + v_subscription.remaining_sessions;
  v_valid := (v_actual = v_subscription.total_sessions_snapshot);

  RETURN json_build_object(
    'valid', v_valid,
    'subscription_id', v_subscription.id,
    'expected', v_subscription.total_sessions_snapshot,
    'actual', v_actual,
    'breakdown', json_build_object(
      'completed', v_completed,
      'scheduled', v_scheduled,
      'remaining', v_subscription.remaining_sessions
    ),
    'message', CASE
      WHEN v_valid THEN 'Integrity check passed'
      ELSE 'Session count mismatch: ' || v_completed || ' + ' || v_scheduled || ' + ' || v_subscription.remaining_sessions || ' = ' || v_actual || ' (expected ' || v_subscription.total_sessions_snapshot || ')'
    END
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_session_integrity IS
'Validates that session counts add up correctly for a member.
Returns JSON with validation result and detailed breakdown.';

-- Down migration
-- DROP FUNCTION IF EXISTS check_session_integrity(UUID);
```

---

### Part 4: Integration with UI (Optional)

**Display Validation Status in Member Details**:

```typescript
// In MemberDetailsTab.tsx (optional addition)
import { useSessionIntegrityValidator } from "@/features/training-sessions/hooks/use-session-integrity-validator";

export function MemberDetailsTab({ memberId }: MemberDetailsTabProps) {
  // ... existing code ...

  // Add validation (only in development mode by default)
  const { integrityResult, isLoading: validating } = useSessionIntegrityValidator(
    memberId,
    { enabled: process.env.NODE_ENV === "development" }
  );

  return (
    <div>
      {/* ... existing content ... */}

      {/* Show validation status in dev mode */}
      {process.env.NODE_ENV === "development" && integrityResult && (
        <Alert variant={integrityResult.valid ? "success" : "destructive"}>
          <AlertTitle>
            {integrityResult.valid ? "✓ Integrity Check Passed" : "⚠️ Integrity Issue Detected"}
          </AlertTitle>
          {!integrityResult.valid && (
            <AlertDescription>
              <p>{integrityResult.message}</p>
              {integrityResult.issues && (
                <ul className="list-disc list-inside mt-2 text-sm">
                  {integrityResult.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          )}
        </Alert>
      )}
    </div>
  );
}
```

---

## Testing Requirements

### Unit Tests

**File**: `src/features/training-sessions/__tests__/session-validator.test.ts`

```typescript
import { validateSessionIntegrity } from "../lib/session-validator";

describe("Session Integrity Validation", () => {
  it("returns valid when session counts add up", async () => {
    // Setup: member with 10 total, 4 done, 3 scheduled, 3 remaining
    const result = await validateSessionIntegrity("test-member-id");

    expect(result.valid).toBe(true);
    expect(result.expected).toBe(10);
    expect(result.actual).toBe(10);
    expect(result.breakdown).toEqual({
      completed: 4,
      scheduled: 3,
      remaining: 3,
    });
  });

  it("returns invalid when session counts don't add up", async () => {
    // Setup: manipulated data with mismatch
    const result = await validateSessionIntegrity("test-member-id");

    expect(result.valid).toBe(false);
    expect(result.issues).toContain(expect.stringContaining("Expected"));
  });

  it("handles member with no active subscription", async () => {
    const result = await validateSessionIntegrity("no-subscription-member");

    expect(result.valid).toBe(true);
    expect(result.message).toContain("No active subscription");
  });

  it("detects negative remaining sessions", async () => {
    // Setup: subscription with remaining_sessions = -2
    const result = await validateSessionIntegrity("negative-remaining");

    expect(result.valid).toBe(false);
    expect(result.issues).toContain(
      expect.stringContaining("Negative remaining")
    );
  });

  it("detects used_sessions mismatch", async () => {
    // Setup: used_sessions doesn't match completed + scheduled
    const result = await validateSessionIntegrity("mismatch-member");

    expect(result.valid).toBe(false);
    expect(result.issues).toContain(expect.stringContaining("used_sessions"));
  });
});

describe("Batch Validation", () => {
  it("validates multiple members", async () => {
    const memberIds = ["member1", "member2", "member3"];
    const { validateMembersIntegrity, getIntegritySummary } = await import(
      "../lib/session-validator"
    );

    const results = await validateMembersIntegrity(memberIds);
    const summary = getIntegritySummary(results);

    expect(results).toHaveLength(3);
    expect(summary.total).toBe(3);
    expect(summary.valid).toBeGreaterThanOrEqual(0);
  });
});
```

### Integration Tests

**File**: `src/features/training-sessions/__tests__/session-integrity.test.ts`

```typescript
describe("Session Integrity End-to-End", () => {
  it("validates after session creation", async () => {
    const memberId = await createTestMember();
    const subscriptionId = await createTestSubscription(memberId, 10);

    // Create sessions
    await createSession({ member_id: memberId, session_type: "member" });
    await createSession({ member_id: memberId, session_type: "member" });

    // Validate
    const result = await validateSessionIntegrity(memberId);

    expect(result.valid).toBe(true);
    expect(result.breakdown.completed).toBe(0);
    expect(result.breakdown.scheduled).toBe(2);
    expect(result.breakdown.remaining).toBe(8);
  });

  it("validates after session deletion", async () => {
    // ... create and then delete session ...
    const result = await validateSessionIntegrity(memberId);

    expect(result.valid).toBe(true);
    // Verify credit restored correctly
  });
});
```

---

## Performance Considerations

### Query Optimization

- Validation queries use indexes on `member_id`, `subscription_id`, `status`
- Batch validation uses Promise.all for parallel execution
- Results cached with 5-minute staleTime

### Expected Performance

- Single validation: <50ms
- Batch (100 members): <5 seconds
- Database function: <20ms

### Monitoring

```typescript
// Add performance tracking
const startTime = performance.now();
const result = await validateSessionIntegrity(memberId);
const duration = performance.now() - startTime;

if (duration > 100) {
  console.warn(`Slow validation: ${duration}ms for member ${memberId}`);
}
```

---

## Definition of Done

- [ ] Validation utility created and working
- [ ] Validation hook created and integrated
- [ ] Database function created and tested
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Performance < 100ms per validation
- [ ] Documentation updated
- [ ] Code committed with proper message

---

## Dependencies

**Blocked By**:

- US-002 (needs correct database structure)
- US-003 (needs correct counting logic)

**Blocks**: None (enhancement feature)

---

## Future Enhancements

**Out of scope for this story, but potential follow-ups**:

1. **Admin Dashboard**: Show integrity status for all members
2. **Scheduled Validation**: Nightly cron job to validate all members
3. **Email Alerts**: Notify admin when critical issues detected
4. **Automated Repair**: Suggest or apply fixes for common issues
5. **Historical Tracking**: Store validation results over time
6. **Performance Dashboard**: Track validation performance metrics

---

## Commit Message Template

```bash
git add src/features/training-sessions/lib/session-validator.ts
git add src/features/training-sessions/hooks/use-session-integrity-validator.ts
git add src/features/training-sessions/__tests__/session-integrity.test.ts
git commit -m "feat(validation): add session integrity validation system [US-005]

Validation system:
- Created validateSessionIntegrity utility function
- Created useSessionIntegrityValidator React hook
- Added database function check_session_integrity
- Comprehensive test coverage (unit + integration)
- Performance optimized (<100ms per validation)
- Optional display in member details view (dev mode)

Non-blocking enhancement - does not affect existing functionality.
All tests passing."
```

---

**Status**: 🔴 Not Started
**Last Updated**: 2025-10-31
