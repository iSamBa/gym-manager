# Session-Subscription Consistency Fix - Technical Documentation

## Table of Contents

- [Problem Analysis](#problem-analysis)
- [Current Architecture Issues](#current-architecture-issues)
- [Proposed Solution](#proposed-solution)
- [Database Schema Changes](#database-schema-changes)
- [Business Logic Changes](#business-logic-changes)
- [UI/UX Changes](#uiux-changes)
- [Technical Architecture](#technical-architecture)
- [Performance Considerations](#performance-considerations)
- [Risk Assessment](#risk-assessment)
- [Testing Strategy](#testing-strategy)

---

## Problem Analysis

### Critical Finding: No Direct Subscription Link

Training sessions currently link to subscriptions only **implicitly** through `member_id`:

```
training_sessions.member_id → members.id
members.id → member_subscriptions.member_id (WHERE status='active')
```

**Problems**:

- Cannot query "which sessions belong to this subscription"
- If member has sequential subscriptions, attribution is ambiguous
- Deleting sessions must look up member → active sub → restore credit (fragile)
- Historical data loses subscription context when subscription expires

### Critical Finding: No Database Constraints

The code **assumes** one active subscription per member, but database allows:

```sql
-- Nothing prevents this!
INSERT INTO member_subscriptions (member_id, status) VALUES ('uuid1', 'active');
INSERT INTO member_subscriptions (member_id, status) VALUES ('uuid1', 'active');
```

**Risk**: Data corruption if application logic fails, leading to incorrect counts.

### Critical Finding: Session Counting Inconsistencies

Three different sources with different logic:

1. **`use-member-dialog-data.ts`**: Counts completed/scheduled from database
2. **`subscription.remaining_sessions`**: Calculated field (`total - used`)
3. **RPC `get_sessions_with_planning_indicators`**: Returns remaining from subscription

**Problem**: Math doesn't always add up due to:

- Different timeframes (all-time vs subscription period)
- Missing session type filtering (trial/guest counted incorrectly)
- Cancelled sessions unaccounted for

### Impact Analysis

| Issue                         | Severity | Impact                              | Frequency               |
| ----------------------------- | -------- | ----------------------------------- | ----------------------- |
| Multiple active subscriptions | Critical | Data corruption, incorrect counts   | Rare (prevented by UI)  |
| Missing subscription_id link  | High     | Historical data loss, fragile logic | Always                  |
| Session count mismatch        | High     | User confusion, billing errors      | Common                  |
| Race condition in booking     | Medium   | Overbooking beyond limit            | Rare (concurrent users) |
| Wrong credit restoration      | Medium   | Credits to wrong subscription       | Occasional              |

---

## Current Architecture Issues

### Issue 1: Implicit Relationship

**Current**:

```typescript
// Session creation (use-training-sessions.ts:264-290)
const activeSubscription = await getMemberActiveSubscription(memberId);
// Session stored WITHOUT subscription.id reference
await supabase.from("training_sessions").insert({
  member_id: memberId,
  // NO subscription_id field!
});
```

**Problem**: Sessions don't "know" which subscription they belong to.

### Issue 2: Race Condition

**Current**:

```typescript
// Step 1: Check
if (remainingSessions <= 0) throw new Error("No sessions");

// Step 2: Create (another user could book between steps!)
await createSession();

// Step 3: Consume
await consumeSession(subscriptionId);
```

**Problem**: Two users can both pass check, both create session, both consume → overbooking.

### Issue 3: Credit Restoration Bug

**Current** (use-training-sessions.ts:760-776):

```typescript
// Deleting session from old subscription
const activeSub = await getMemberActiveSubscription(memberId); // WRONG!
await restoreSessionCredit(activeSub.id); // Credit goes to NEW subscription
```

**Problem**: If subscription changed between creation and deletion, credit goes to wrong place.

### Issue 4: Mixed Session Types

**Current**:

```typescript
// Counts ALL sessions (use-member-dialog-data.ts:83-89)
.eq("booking_status", "confirmed")
.eq("status", "completed")
// NO filter for session_type!
```

**Problem**: Trial and guest sessions incorrectly counted toward subscription.

---

## Proposed Solution

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Phase 1: Discovery                         │
│  Audit existing data, identify inconsistencies              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Phase 2: Foundation                         │
│  Add subscription_id column, backfill, add constraints      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Phase 3: Core Fixes                         │
│  Fix creation/deletion logic, standardize counting          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Phase 4: UI Updates                         │
│  Standardize display, ensure consistency                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Phase 5: Prevention                         │
│  Validation system, monitoring, alerts                      │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Direct Relationships**: Sessions explicitly reference subscriptions
2. **Database Integrity**: Constraints prevent invalid states
3. **Consistent Counting**: Single source of truth for session math
4. **Idempotent Operations**: Session creation/deletion can be retried safely
5. **Validation First**: Detect issues before they propagate

---

## Database Schema Changes

### Change 1: Add subscription_id Column

```sql
ALTER TABLE training_sessions
ADD COLUMN subscription_id UUID REFERENCES member_subscriptions(id);

COMMENT ON COLUMN training_sessions.subscription_id IS
'Direct reference to the subscription this session is associated with.
NULL for trial/guest sessions that do not consume subscription credits.';
```

**Migration Strategy**:

1. Add nullable column
2. Backfill existing sessions
3. Add constraint (NOT NULL for member/makeup/contractual)
4. Add foreign key

**Backfill Logic**:

```sql
UPDATE training_sessions ts
SET subscription_id = (
  SELECT ms.id
  FROM member_subscriptions ms
  WHERE ms.member_id = ts.member_id
    AND ms.status = 'active'
  ORDER BY ms.created_at DESC
  LIMIT 1
)
WHERE ts.subscription_id IS NULL
  AND ts.session_type IN ('member', 'makeup', 'contractual');
```

### Change 2: Unique Active Subscription Constraint

```sql
CREATE UNIQUE INDEX idx_one_active_subscription_per_member
ON member_subscriptions(member_id)
WHERE status = 'active';
```

**Effect**: Prevents application bugs from creating multiple active subscriptions.

### Change 3: Data Validation Constraints

```sql
ALTER TABLE member_subscriptions
ADD CONSTRAINT used_sessions_within_total
CHECK (used_sessions <= total_sessions_snapshot);

ALTER TABLE member_subscriptions
ADD CONSTRAINT remaining_sessions_nonnegative
CHECK (remaining_sessions >= 0);
```

**Effect**: Database rejects invalid state transitions.

### Change 4: Session Type Constraint

```sql
ALTER TABLE training_sessions
ADD CONSTRAINT session_subscription_required
CHECK (
  (session_type IN ('member', 'makeup', 'contractual') AND subscription_id IS NOT NULL)
  OR (session_type IN ('trial', 'guest'))
);
```

**Effect**: Ensures member/makeup/contractual sessions always have subscription.

### New Database Schema Diagram

```
member_subscriptions
├── id (PK)
├── member_id (FK → members.id)
├── status (active|expired|cancelled)
├── total_sessions_snapshot
├── used_sessions
└── remaining_sessions (computed)
    ↓ [1:N relationship]
training_sessions
├── id (PK)
├── member_id (FK → members.id)
├── subscription_id (FK → member_subscriptions.id) ← NEW!
├── session_type (member|trial|guest|makeup|contractual)
└── status (scheduled|completed|cancelled)

CONSTRAINTS:
- UNIQUE (member_id) WHERE status='active' on member_subscriptions
- CHECK (used_sessions <= total_sessions_snapshot)
- CHECK (session_type needs subscription_id if member/makeup/contractual)
```

---

## Business Logic Changes

### Change 1: Session Creation

**Before**:

```typescript
const subscription = await getActiveSubscription(memberId);
await createSession({ member_id: memberId });
await consumeSession(subscription.id);
```

**After**:

```typescript
const subscription = await getActiveSubscription(memberId);

// Store subscription_id directly
await createSession({
  member_id: memberId,
  subscription_id: subscription.id, // NEW!
});

// Consume in same transaction (prevents race condition)
await consumeSession(subscription.id);
```

### Change 2: Session Deletion

**Before**:

```typescript
// Restore to CURRENT active subscription (wrong!)
const activeSub = await getActiveSubscription(session.member_id);
await restoreCredit(activeSub.id);
```

**After**:

```typescript
// Restore to ORIGINAL subscription (correct!)
if (session.subscription_id) {
  await restoreCredit(session.subscription_id);
} else {
  // Fallback for legacy data
  console.warn("Session missing subscription_id");
  const activeSub = await getActiveSubscription(session.member_id);
  if (activeSub) await restoreCredit(activeSub.id);
}
```

### Change 3: Session Counting

**Before**:

```typescript
// Count ALL sessions
const completed = await supabase
  .from("training_sessions")
  .eq("member_id", memberId)
  .eq("status", "completed");
```

**After**:

```typescript
// Count only subscription sessions
const completed = await supabase
  .from("training_sessions")
  .eq("member_id", memberId)
  .eq("status", "completed")
  .in("session_type", ["member", "makeup", "contractual"]) // NEW!
  .not("status", "eq", "cancelled"); // NEW!
```

### Change 4: Contractual Counting Edge Case

**Before**:

```typescript
// Fails if no trial session exists
const { data: trialSession } = await supabase
  .from("training_sessions")
  .eq("session_type", "trial")
  .maybeSingle();

const startDate = trialSession.scheduled_start; // ERROR if null!
```

**After**:

```typescript
const { data: trialSession } = await supabase
  .from("training_sessions")
  .eq("session_type", "trial")
  .maybeSingle();

// Fallback chain
const startDate =
  trialSession?.scheduled_start || member.join_date || subscription.start_date; // Always have a valid date
```

---

## UI/UX Changes

### Minimal Visual Changes

This feature primarily fixes **data accuracy**, not UI appearance. Users will see:

**Before Fix**:

- Sessions Done: 8 (includes trial + cancelled)
- Scheduled: 3
- Remaining: 5
- Total: 10
- **Math doesn't add up**: 8 + 3 + 5 ≠ 10

**After Fix**:

- Sessions Done: 6 (excludes trial + cancelled)
- Scheduled: 3
- Remaining: 1
- Total: 10
- **Math is correct**: 6 + 3 + 1 = 10

### New UI Element (Optional - Phase 5)

**Integrity Warning Badge** (dev mode or admin):

```tsx
{
  !integrityCheck.valid && (
    <Alert variant="warning">
      Session count mismatch detected: Expected {integrityCheck.expected}, Got{" "}
      {integrityCheck.actual}
    </Alert>
  );
}
```

---

## Technical Architecture

### Affected Files

#### Database Layer

- **Supabase Migrations**: 4 new migrations
- `src/features/database/lib/types.ts`: Add subscription_id to TrainingSession

#### Business Logic Layer

- `src/features/training-sessions/hooks/use-training-sessions.ts`: Creation/deletion logic
- `src/features/training-sessions/hooks/use-member-dialog-data.ts`: Counting logic
- `src/features/memberships/lib/subscription-utils.ts`: Contractual counting

#### UI Layer

- `src/features/training-sessions/components/SessionStatsCards.tsx`: Display
- `src/features/training-sessions/components/forms/MemberDetailsTab.tsx`: Display
- `src/features/members/components/MemberSessionsTable.tsx`: Filtering

#### Validation Layer (New)

- `src/features/training-sessions/lib/session-validator.ts`: Validation logic
- `src/features/training-sessions/hooks/use-session-integrity-validator.ts`: React hook
- `src/features/training-sessions/__tests__/session-integrity.test.ts`: Tests

### Data Flow Diagram

**Session Creation Flow**:

```
User clicks "Book Session"
    ↓
useTrainingSessions.createSession()
    ↓
getActiveSubscription(memberId)
    ↓
[Validation: remaining > 0]
    ↓
BEGIN TRANSACTION
    ↓
INSERT training_sessions (subscription_id = sub.id)
    ↓
UPDATE member_subscriptions SET used_sessions++
    ↓
COMMIT TRANSACTION
    ↓
UI updates with new counts
```

**Session Deletion Flow**:

```
User clicks "Delete Session"
    ↓
useTrainingSessions.deleteSession()
    ↓
[Check: session.subscription_id exists]
    ↓
BEGIN TRANSACTION
    ↓
UPDATE member_subscriptions SET used_sessions--
  WHERE id = session.subscription_id
    ↓
DELETE training_sessions WHERE id = session.id
    ↓
COMMIT TRANSACTION
    ↓
UI updates with restored credit
```

---

## Performance Considerations

### Migration Performance

**Backfill Operation**:

- **Concern**: Updating thousands of sessions could be slow
- **Solution**: Batch updates (1000 rows at a time)
- **Estimate**: ~0.1s per 1000 rows = 10s for 100k sessions

**Index Creation**:

- **Concern**: Unique index on large table
- **Solution**: CREATE INDEX CONCURRENTLY (PostgreSQL)
- **Estimate**: ~1s per 10k subscriptions

### Query Performance

**New Queries**:

```sql
-- Added to session counting
WHERE session_type IN ('member', 'makeup', 'contractual')
-- Uses existing session_type index (btree)

-- Added to validation
WHERE subscription_id = $1
-- New index recommended: CREATE INDEX idx_sessions_subscription ON training_sessions(subscription_id)
```

**Impact**: Negligible (<5ms increase per query)

### Transaction Overhead

**Session Creation**:

- **Before**: 2 queries (INSERT + UPDATE)
- **After**: 2 queries in transaction (INSERT + UPDATE with lock)
- **Overhead**: ~2-3ms for transaction BEGIN/COMMIT

**Recommendation**: Acceptable tradeoff for data integrity.

---

## Risk Assessment

### High-Risk Areas

1. **Backfill Accuracy** (Phase 2)
   - **Risk**: Incorrect subscription attribution for historical sessions
   - **Mitigation**: Audit first (Phase 1), verify backfill results before proceeding

2. **Data Migration** (Phase 2)
   - **Risk**: Migration fails mid-way, corrupts data
   - **Mitigation**: Test on dev branch, have rollback scripts, backup production

3. **Logic Regression** (Phase 3)
   - **Risk**: New bugs introduced while fixing old ones
   - **Mitigation**: Comprehensive test coverage, gradual rollout

### Medium-Risk Areas

4. **Transaction Deadlocks** (Phase 3)
   - **Risk**: Concurrent session operations cause deadlocks
   - **Mitigation**: Proper transaction ordering, retry logic

5. **Performance Degradation** (Phase 3)
   - **Risk**: New queries/indexes slow down operations
   - **Mitigation**: Query analysis, index optimization, monitoring

### Low-Risk Areas

6. **UI Breakage** (Phase 4)
   - **Risk**: Components fail to render
   - **Mitigation**: TypeScript catches most issues, manual testing

### Risk Mitigation Strategy

| Phase | Risk Level | Rollback Time | Recovery Procedure |
| ----- | ---------- | ------------- | ------------------ |
| 1     | None       | N/A           | Read-only audit    |
| 2     | High       | 15 min        | Down migrations    |
| 3     | Medium     | 5 min         | Git revert         |
| 4     | Low        | 2 min         | Git revert         |
| 5     | Low        | 1 min         | Disable validation |

---

## Testing Strategy

### Phase 1: Manual Audit

- Review audit output
- Verify query accuracy
- Check performance on real data

### Phase 2: Migration Testing

- **Dev branch**: Test all migrations
- **Constraint testing**: Try to violate constraints
- **Backfill verification**: Sample check 100 sessions
- **Performance testing**: Time migration on production-size dataset

### Phase 3: Unit & Integration Tests

**Unit Tests**:

```typescript
describe("Session Creation", () => {
  it("stores subscription_id when creating member session");
  it("does not require subscription_id for trial session");
  it("throws error if no remaining sessions");
});

describe("Session Deletion", () => {
  it("restores credit to original subscription");
  it("handles missing subscription_id gracefully");
});

describe("Session Counting", () => {
  it("excludes trial sessions from subscription count");
  it("excludes cancelled sessions from count");
  it("completed + scheduled + remaining = total");
});
```

**Integration Tests**:

```typescript
describe("Session Lifecycle", () => {
  it("create → delete → credit restored correctly");
  it("concurrent bookings do not exceed limit");
  it("subscription expiry prevents new bookings");
});
```

### Phase 4: Manual UI Testing

**Checklist**:

- [ ] Member with active subscription displays correct counts
- [ ] Creating session updates counts in real-time
- [ ] Deleting session updates counts in real-time
- [ ] Trial session does not affect subscription count
- [ ] Guest session does not affect subscription count
- [ ] No console errors or warnings
- [ ] Math always adds up: done + scheduled + remaining = total

### Phase 5: End-to-End Validation

**Automated Validation**:

```bash
# Run integrity check on all members
npm run validate:session-integrity

# Expected: 100% pass rate
```

**Manual Spot Checks**:

- Check 10 random members
- Verify math is correct
- Confirm no anomalies

---

## Rollback Procedures

### Immediate Rollback (Critical Issues)

**If catastrophic failure in production**:

```sql
-- Phase 2 rollback: Drop constraints and column
DROP INDEX IF EXISTS idx_one_active_subscription_per_member;
ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS session_subscription_required;
ALTER TABLE training_sessions DROP COLUMN IF EXISTS subscription_id;
ALTER TABLE member_subscriptions DROP CONSTRAINT IF EXISTS used_sessions_within_total;
```

**Time estimate**: 30 seconds

### Code Rollback (Bugs)

**If logic errors discovered**:

```bash
git revert <commit-hash>
git push origin feature/session-subscription-consistency-fix --force
```

**Time estimate**: 2 minutes

### Partial Rollback (Specific Phase)

Can roll back any phase independently:

- Phase 2 ← Phase 3: Keep schema, revert logic
- Phase 3 ← Phase 4: Keep logic, revert UI
- Phase 4 ← Phase 5: Keep UI, disable validation

---

## Success Metrics

### Technical Metrics

- **Data Integrity**: 0 constraint violations after migration
- **Session Math Accuracy**: 100% of members pass integrity check
- **Test Coverage**: >90% for affected code
- **Performance**: <5% increase in query time
- **Build Success**: 0 TypeScript errors

### Business Metrics

- **User Complaints**: No increase in session-related support tickets
- **Billing Accuracy**: Credit restoration working correctly
- **System Stability**: No increase in errors/exceptions
- **Developer Velocity**: Faster debugging of session issues

---

## Future Enhancements (Out of Scope)

**Potential follow-ups**:

1. Session audit log (track every credit consumption/restoration)
2. Admin dashboard for integrity monitoring
3. Automated data repair for detected inconsistencies
4. Session transfer between subscriptions
5. Bulk integrity validation scheduled job

---

## References

- **Original Analysis**: Comprehensive audit findings document
- **Database Schema**: `src/features/database/lib/types.ts`
- **RPC Functions**: `docs/RPC_SIGNATURES.md`
- **Date Handling**: `CLAUDE.md` section on Date Handling Standards
- **Testing**: `CLAUDE.md` section on Testing Best Practices

---

**For implementation details, see [AGENT-GUIDE.md](./AGENT-GUIDE.md)**
