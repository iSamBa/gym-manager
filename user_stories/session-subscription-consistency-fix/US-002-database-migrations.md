# US-002: Database Schema Migrations

**Story ID**: US-002
**Feature**: Session-Subscription Consistency Fix
**Type**: Infrastructure
**Priority**: P0 (Must Have)
**Complexity**: Large
**Estimated Effort**: 6 hours

---

## User Story

**As a** developer
**I want** proper database constraints and foreign key relationships
**So that** the database prevents invalid data states and enforces data integrity

---

## Business Value

Database-level constraints are the **foundation** for preventing data corruption:

1. **Prevention > Detection**: Constraints prevent issues before they occur
2. **Data Integrity**: Invalid states become impossible, not just unlikely
3. **Fail Fast**: Application bugs caught immediately at database level
4. **Historical Context**: Sessions know which subscription they belong to
5. **Simplified Logic**: Application code doesn't need to enforce rules database already guarantees

**Without these constraints**, we rely entirely on application code being bug-free, which is unrealistic.

---

## Acceptance Criteria

### Must Have

- [ ] **AC-1**: `subscription_id` column added to `training_sessions` table (nullable initially)
- [ ] **AC-2**: All existing member/makeup/contractual sessions have `subscription_id` populated (backfilled)
- [ ] **AC-3**: Constraint enforces `subscription_id` NOT NULL for member/makeup/contractual session types
- [ ] **AC-4**: Foreign key constraint links `training_sessions.subscription_id` → `member_subscriptions.id`
- [ ] **AC-5**: Unique index prevents multiple active subscriptions per member
- [ ] **AC-6**: Check constraint validates `used_sessions <= total_sessions_snapshot`
- [ ] **AC-7**: Check constraint validates `remaining_sessions >= 0`
- [ ] **AC-8**: TypeScript types updated to include `subscription_id` field
- [ ] **AC-9**: Down migrations created for rollback capability
- [ ] **AC-10**: All migrations tested on development branch before production

### Nice to Have

- [ ] Migration includes comments explaining each change
- [ ] Backfill includes logging for audit trail
- [ ] Performance benchmarks for migration on large datasets

---

## Technical Scope

### Database Migrations

**Migration 1**: Add subscription_id column
**Migration 2**: Backfill subscription_id for existing sessions
**Migration 3**: Add session type constraint (subscription_id required for certain types)
**Migration 4**: Add foreign key constraint
**Migration 5**: Add unique active subscription index
**Migration 6**: Add check constraints for session counts

### TypeScript Type Updates

- `src/features/database/lib/types.ts` - Add `subscription_id: string | null` to `TrainingSession`

---

## Implementation Guide

### Step 1: Migration 1 - Add subscription_id Column

**Purpose**: Add column to store direct subscription reference

```sql
-- Migration: add_subscription_id_to_training_sessions
-- Date: YYYY-MM-DD

ALTER TABLE training_sessions
ADD COLUMN subscription_id UUID;

COMMENT ON COLUMN training_sessions.subscription_id IS
'Direct reference to the subscription this session belongs to.
Required for member/makeup/contractual sessions.
NULL for trial/guest sessions that do not consume subscription credits.';

-- Down migration
-- ALTER TABLE training_sessions DROP COLUMN subscription_id;
```

**Execution**:

```typescript
// Use Supabase MCP
await mcp__supabase__apply_migration({
  name: "add_subscription_id_to_training_sessions",
  query: `
    ALTER TABLE training_sessions
    ADD COLUMN subscription_id UUID;

    COMMENT ON COLUMN training_sessions.subscription_id IS
    'Direct reference to the subscription this session belongs to';
  `,
});
```

**Verification**:

```sql
-- Check column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'training_sessions' AND column_name = 'subscription_id';

-- Expected: subscription_id | uuid | YES
```

---

### Step 2: Migration 2 - Backfill subscription_id

**Purpose**: Populate subscription_id for all existing sessions

**Strategy**: Attribute sessions to member's active subscription, or most recent subscription if none active

```sql
-- Migration: backfill_subscription_id_training_sessions
-- Date: YYYY-MM-DD

-- Backfill for member/makeup/contractual sessions
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

-- If no active subscription, use most recent subscription
UPDATE training_sessions ts
SET subscription_id = (
  SELECT ms.id
  FROM member_subscriptions ms
  WHERE ms.member_id = ts.member_id
  ORDER BY ms.created_at DESC
  LIMIT 1
)
WHERE ts.subscription_id IS NULL
  AND ts.session_type IN ('member', 'makeup', 'contractual');

-- Log backfill results
DO $$
DECLARE
  backfilled_count INTEGER;
  still_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backfilled_count
  FROM training_sessions
  WHERE subscription_id IS NOT NULL
    AND session_type IN ('member', 'makeup', 'contractual');

  SELECT COUNT(*) INTO still_null_count
  FROM training_sessions
  WHERE subscription_id IS NULL
    AND session_type IN ('member', 'makeup', 'contractual');

  RAISE NOTICE 'Backfill complete: % sessions updated, % still NULL',
    backfilled_count, still_null_count;
END $$;
```

**Verification**:

```sql
-- Check backfill success
SELECT
  session_type,
  COUNT(*) FILTER (WHERE subscription_id IS NOT NULL) as with_subscription,
  COUNT(*) FILTER (WHERE subscription_id IS NULL) as without_subscription
FROM training_sessions
WHERE session_type IN ('member', 'makeup', 'contractual')
GROUP BY session_type;

-- All member/makeup/contractual should have subscription_id
```

**Edge Cases**:

- Sessions where member has no subscriptions → Manual review needed
- Sessions where member was deleted → Consider deleting these sessions
- Very old sessions → May attribute to wrong subscription if member had multiple over time

---

### Step 3: Migration 3 - Add Session Type Constraint

**Purpose**: Ensure member/makeup/contractual sessions always have subscription

```sql
-- Migration: add_session_subscription_constraint
-- Date: YYYY-MM-DD

ALTER TABLE training_sessions
ADD CONSTRAINT session_subscription_required
CHECK (
  (session_type IN ('member', 'makeup', 'contractual') AND subscription_id IS NOT NULL)
  OR (session_type NOT IN ('member', 'makeup', 'contractual'))
);

-- Down migration
-- ALTER TABLE training_sessions DROP CONSTRAINT session_subscription_required;
```

**Test Constraint**:

```sql
-- This should FAIL
INSERT INTO training_sessions (member_id, session_type, subscription_id)
VALUES ('some-uuid', 'member', NULL);
-- Expected: ERROR: new row violates check constraint "session_subscription_required"

-- This should SUCCEED
INSERT INTO training_sessions (member_id, session_type, subscription_id)
VALUES ('some-uuid', 'trial', NULL);
```

---

### Step 4: Migration 4 - Add Foreign Key Constraint

**Purpose**: Enforce referential integrity between sessions and subscriptions

```sql
-- Migration: add_session_subscription_fk
-- Date: YYYY-MM-DD

ALTER TABLE training_sessions
ADD CONSTRAINT fk_training_sessions_subscription
FOREIGN KEY (subscription_id)
REFERENCES member_subscriptions(id)
ON DELETE SET NULL;  -- If subscription deleted, set sessions to NULL (or CASCADE if prefer)

-- Down migration
-- ALTER TABLE training_sessions DROP CONSTRAINT fk_training_sessions_subscription;
```

**Verification**:

```sql
-- Check FK exists
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'training_sessions'
  AND kcu.column_name = 'subscription_id';
```

**Test Constraint**:

```sql
-- This should FAIL
INSERT INTO training_sessions (member_id, session_type, subscription_id)
VALUES ('some-uuid', 'member', 'non-existent-subscription-id');
-- Expected: ERROR: insert or update on table "training_sessions" violates foreign key constraint
```

---

### Step 5: Migration 5 - Unique Active Subscription Index

**Purpose**: Prevent multiple active subscriptions per member

```sql
-- Migration: unique_active_subscription_per_member
-- Date: YYYY-MM-DD

CREATE UNIQUE INDEX idx_one_active_subscription_per_member
ON member_subscriptions(member_id)
WHERE status = 'active';

COMMENT ON INDEX idx_one_active_subscription_per_member IS
'Ensures each member can have at most one active subscription at any time.
Partial index only applies to rows where status = ''active''.';

-- Down migration
-- DROP INDEX idx_one_active_subscription_per_member;
```

**Verification**:

```sql
-- Check index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'member_subscriptions'
  AND indexname = 'idx_one_active_subscription_per_member';
```

**Test Constraint**:

```sql
-- Assuming member 'test-uuid' already has one active subscription
-- This should FAIL
INSERT INTO member_subscriptions (member_id, status, total_sessions_snapshot)
VALUES ('test-uuid', 'active', 10);
-- Expected: ERROR: duplicate key value violates unique constraint "idx_one_active_subscription_per_member"

-- This should SUCCEED (different status)
INSERT INTO member_subscriptions (member_id, status, total_sessions_snapshot)
VALUES ('test-uuid', 'expired', 10);
```

---

### Step 6: Migration 6 - Check Constraints for Session Counts

**Purpose**: Validate session count calculations

```sql
-- Migration: add_session_count_constraints
-- Date: YYYY-MM-DD

-- Constraint 1: used_sessions cannot exceed total
ALTER TABLE member_subscriptions
ADD CONSTRAINT used_sessions_within_total
CHECK (used_sessions <= total_sessions_snapshot);

-- Constraint 2: remaining_sessions cannot be negative
ALTER TABLE member_subscriptions
ADD CONSTRAINT remaining_sessions_nonnegative
CHECK (remaining_sessions >= 0);

-- Down migration
-- ALTER TABLE member_subscriptions DROP CONSTRAINT used_sessions_within_total;
-- ALTER TABLE member_subscriptions DROP CONSTRAINT remaining_sessions_nonnegative;
```

**Pre-Migration Validation**:

```sql
-- Check for violations BEFORE adding constraint
SELECT id, member_id, used_sessions, total_sessions_snapshot
FROM member_subscriptions
WHERE used_sessions > total_sessions_snapshot;

SELECT id, member_id, remaining_sessions
FROM member_subscriptions
WHERE remaining_sessions < 0;

-- Fix any violations before applying constraint
```

**Test Constraints**:

```sql
-- This should FAIL
UPDATE member_subscriptions
SET used_sessions = 15
WHERE total_sessions_snapshot = 10;
-- Expected: ERROR: new row violates check constraint "used_sessions_within_total"

-- This should FAIL
UPDATE member_subscriptions
SET remaining_sessions = -5;
-- Expected: ERROR: new row violates check constraint "remaining_sessions_nonnegative"
```

---

### Step 7: Update TypeScript Types

**File**: `src/features/database/lib/types.ts`

```typescript
export interface TrainingSession {
  id: string;
  member_id: string;
  session_type: SessionType;
  status: SessionStatus;
  booking_status: BookingStatus;
  scheduled_start: string;
  scheduled_end: string | null;
  subscription_id: string | null; // ← ADD THIS
  counted_in_subscription_id: string | null;
  // ... other existing fields
}
```

**Verification**:

```bash
# TypeScript should compile without errors
npm run build

# No type errors
npx tsc --noEmit
```

---

## Testing Requirements

### Pre-Migration Testing (Development Branch)

1. **Create test subscriptions**:
   - Member with 1 active subscription
   - Member with 2 active subscriptions (should be prevented after migration)
   - Member with expired subscription

2. **Create test sessions**:
   - Member session (needs subscription)
   - Trial session (no subscription needed)
   - Orphaned session (member deleted)

3. **Test backfill**:
   - Run backfill migration
   - Verify all member sessions have subscription_id
   - Verify trial sessions remain NULL

4. **Test constraints**:
   - Try inserting session without subscription_id → should fail
   - Try creating 2nd active subscription → should fail
   - Try setting used_sessions > total → should fail

### Post-Migration Verification

```sql
-- Verification Checklist

-- 1. Column exists and has correct type
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'training_sessions' AND column_name = 'subscription_id';

-- 2. Backfill successful (no NULLs for member/makeup/contractual)
SELECT COUNT(*)
FROM training_sessions
WHERE session_type IN ('member', 'makeup', 'contractual')
  AND subscription_id IS NULL;
-- Expected: 0

-- 3. Constraints exist
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('training_sessions', 'member_subscriptions')
  AND constraint_name IN (
    'session_subscription_required',
    'fk_training_sessions_subscription',
    'used_sessions_within_total',
    'remaining_sessions_nonnegative'
  );

-- 4. Index exists
SELECT indexname FROM pg_indexes
WHERE indexname = 'idx_one_active_subscription_per_member';

-- 5. No data integrity violations
SELECT * FROM member_subscriptions
WHERE used_sessions > total_sessions_snapshot
   OR remaining_sessions < 0;
-- Expected: 0 rows
```

---

## Performance Considerations

### Migration Timing

- **Add column**: Instant (no data rewrite in PostgreSQL)
- **Backfill**: Depends on dataset size
  - 10k sessions: ~1 second
  - 100k sessions: ~10 seconds
  - 1M sessions: ~2 minutes
- **Add index**: ~1 second per 10k subscriptions
- **Add constraints**: Instant (validates existing data first)

### Locking

- **Backfill UPDATE**: Locks rows being updated (consider batching if >100k rows)
- **Index creation**: Use `CREATE INDEX CONCURRENTLY` to avoid table lock (if supported)
- **Constraint addition**: Acquires ACCESS EXCLUSIVE lock briefly

### Recommendations

- Run migrations during low-traffic window
- Use batched updates for large backfills:
  ```sql
  -- Batch approach
  DO $$
  BEGIN
    LOOP
      UPDATE training_sessions ts
      SET subscription_id = (...)
      WHERE ts.id IN (
        SELECT id FROM training_sessions
        WHERE subscription_id IS NULL
        LIMIT 1000
      );
      EXIT WHEN NOT FOUND;
      COMMIT;
    END LOOP;
  END $$;
  ```

---

## Rollback Plan

### Immediate Rollback (If Migration Fails)

```sql
-- Reverse migrations in order
DROP INDEX IF EXISTS idx_one_active_subscription_per_member;
ALTER TABLE member_subscriptions DROP CONSTRAINT IF EXISTS remaining_sessions_nonnegative;
ALTER TABLE member_subscriptions DROP CONSTRAINT IF EXISTS used_sessions_within_total;
ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS fk_training_sessions_subscription;
ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS session_subscription_required;
ALTER TABLE training_sessions DROP COLUMN IF EXISTS subscription_id;
```

### Data Recovery

- Backfill is deterministic (can re-run safely)
- No data loss from adding constraints (only prevents new invalid data)
- Audit data before and after to compare

---

## Definition of Done

- [ ] All 6 migrations applied successfully
- [ ] Backfill completed with 100% success rate
- [ ] All constraints functioning as expected
- [ ] TypeScript types updated
- [ ] Build passes: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] Post-migration verification queries all pass
- [ ] Down migrations tested and confirmed working
- [ ] STATUS.md updated with migration results
- [ ] Committed with proper message format

---

## Dependencies

**Blocked By**: US-001 (need audit results to understand data state)

**Blocks**:

- US-003 (business logic needs subscription_id column)
- US-004 (UI updates rely on correct data structure)
- US-005 (validation needs constraints)

---

## Risks & Mitigation

| Risk                                      | Likelihood | Impact | Mitigation                                       |
| ----------------------------------------- | ---------- | ------ | ------------------------------------------------ |
| Backfill assigns wrong subscription       | Medium     | High   | Audit results guide logic; manual review samples |
| Migration fails mid-way                   | Low        | High   | Test on dev branch; have rollback script ready   |
| Performance degradation                   | Low        | Medium | Monitor query times; add indexes if needed       |
| Constraint prevents legitimate operations | Low        | High   | Thoroughly test edge cases before production     |

---

## Related Documentation

- [README.md](./README.md) - See "Database Schema Changes" section
- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - See "US-002: Database Schema Migrations"
- [STATUS.md](./STATUS.md) - Update after completion

---

## Commit Message Template

```bash
git add src/features/database/lib/types.ts
git commit -m "feat(database): add subscription_id and integrity constraints [US-002]

Database migrations:
- Added subscription_id column to training_sessions
- Backfilled subscription_id for existing sessions
- Added check constraint requiring subscription_id for member/makeup/contractual
- Added foreign key constraint to member_subscriptions
- Added unique index preventing multiple active subscriptions per member
- Added check constraints for session count validation
- Updated TypeScript types

All migrations tested on dev branch.
Down migrations included for rollback capability.

Breaking change: Database schema modified.
Backward compatible: Nullable column added first, then populated."
```

---

**Status**: 🔴 Not Started
**Last Updated**: 2025-10-31
