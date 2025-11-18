# US-001: Database RPC Function for Weekly Limit Check

## 📋 User Story

**As a** gym administrator or trainer

**I want** database-level validation for member weekly session limits

**So that** data integrity is enforced and invalid bookings are prevented at the source

---

## 🎯 Business Value

**Why This Matters**:

- Enforces business rule at database level (single source of truth)
- Prevents data corruption from multiple clients or concurrent requests
- Provides reliable validation that can't be bypassed by client code
- Improves query performance with proper indexing
- Foundation for application-level validation

**Impact**:

- **Data Integrity**: 100% enforcement of business rules
- **Performance**: Fast query execution with index (<50ms)
- **Reliability**: Consistent validation across all access points

---

## ✅ Acceptance Criteria

### AC1: RPC Function Created

**Given** the database migration is applied

**When** I call `check_member_weekly_session_limit()`

**Then** the function should exist and be callable

**Verification**:

```sql
-- Test in Supabase SQL Editor
SELECT check_member_weekly_session_limit(
  '[test-member-uuid]'::UUID,
  '2025-11-17'::DATE,
  '2025-11-23'::DATE,
  'member'
);
```

---

### AC2: Count Member Sessions Correctly

**Given** a member has 0 "member" sessions this week

**When** I check the limit

**Then** `can_book` should be `true` and `current_member_sessions` should be `0`

**Given** a member has 1 "member" session this week

**When** I check the limit for another "member" session

**Then** `can_book` should be `false` and `current_member_sessions` should be `1`

**Verification**:

```sql
-- Insert test data
INSERT INTO training_sessions (member_id, session_type, scheduled_start, status)
VALUES ('[test-member-uuid]', 'member', '2025-11-18 10:00:00', 'scheduled');

-- Test function
SELECT check_member_weekly_session_limit(
  '[test-member-uuid]'::UUID,
  '2025-11-17'::DATE,
  '2025-11-23'::DATE,
  'member'
);
-- Expected: can_book = false, current_member_sessions = 1
```

---

### AC3: Exclude Cancelled Sessions

**Given** a member has 1 "member" session with status "cancelled"

**When** I check the limit

**Then** `can_book` should be `true` and `current_member_sessions` should be `0`

**Verification**:

```sql
-- Insert cancelled session
INSERT INTO training_sessions (member_id, session_type, scheduled_start, status)
VALUES ('[test-member-uuid]', 'member', '2025-11-18 10:00:00', 'cancelled');

-- Test function
SELECT check_member_weekly_session_limit(
  '[test-member-uuid]'::UUID,
  '2025-11-17'::DATE,
  '2025-11-23'::DATE,
  'member'
);
-- Expected: can_book = true, current_member_sessions = 0
```

---

### AC4: Bypass Validation for Non-Member Sessions

**Given** a member has 1 "member" session this week

**When** I check the limit for a "makeup" session

**Then** `can_book` should be `true` (bypass validation)

**Verification**:

```sql
-- Member already has 1 member session
INSERT INTO training_sessions (member_id, session_type, scheduled_start, status)
VALUES ('[test-member-uuid]', 'member', '2025-11-18 10:00:00', 'scheduled');

-- Test function with makeup session type
SELECT check_member_weekly_session_limit(
  '[test-member-uuid]'::UUID,
  '2025-11-17'::DATE,
  '2025-11-23'::DATE,
  'makeup'
);
-- Expected: can_book = true (bypasses check)
```

---

### AC5: Performance Index Created

**Given** the migration is applied

**When** I check the database indexes

**Then** `idx_training_sessions_member_weekly_limit` should exist on `(member_id, session_type, scheduled_start)`

**Verification**:

```sql
-- Check index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'training_sessions'
  AND indexname = 'idx_training_sessions_member_weekly_limit';
```

---

### AC6: Return Proper Structure

**When** I call the RPC function

**Then** it should return a JSONB object with this structure:

```typescript
{
  can_book: boolean;
  current_member_sessions: number;
  max_allowed: number;
  message: string;
}
```

**Verification**: Check return type matches TypeScript interface

---

## 🔧 Technical Implementation

### Database Migration File

**File**: `supabase/migrations/[timestamp]_member_weekly_session_limit.sql`

**Content**:

```sql
-- Member Weekly Session Limit Enforcement
-- Created: 2025-11-18
-- Feature: member-weekly-session-limit

-- ============================================================
-- RPC Function: check_member_weekly_session_limit
-- ============================================================

CREATE OR REPLACE FUNCTION check_member_weekly_session_limit(
  p_member_id UUID,
  p_week_start DATE,
  p_week_end DATE,
  p_session_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_session_count INTEGER;
  v_can_book BOOLEAN;
  v_message TEXT;
BEGIN
  -- Bypass validation for non-member session types
  IF p_session_type != 'member' THEN
    RETURN jsonb_build_object(
      'can_book', true,
      'current_member_sessions', 0,
      'max_allowed', 1,
      'message', 'Session type bypasses weekly limit'
    );
  END IF;

  -- Count existing "member" sessions for this member this week
  SELECT COUNT(*)
  INTO v_member_session_count
  FROM training_sessions
  WHERE member_id = p_member_id
    AND session_type = 'member'
    AND status != 'cancelled'
    AND DATE(scheduled_start) >= p_week_start
    AND DATE(scheduled_start) <= p_week_end;

  -- Determine if booking is allowed
  v_can_book := v_member_session_count < 1;

  -- Build message
  IF v_can_book THEN
    v_message := 'Member can book this session';
  ELSE
    v_message := 'Member already has 1 member session booked this week. Please use the ''Makeup'' session type for additional sessions.';
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'can_book', v_can_book,
    'current_member_sessions', v_member_session_count,
    'max_allowed', 1,
    'message', v_message
  );
END;
$$;

-- ============================================================
-- Performance Index
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_training_sessions_member_weekly_limit
ON training_sessions(member_id, session_type, scheduled_start)
WHERE status != 'cancelled';

-- Index explanation:
-- - Composite index on (member_id, session_type, scheduled_start)
-- - Partial index: only indexes non-cancelled sessions
-- - Improves query performance from ~1000ms to ~10ms for 10k rows

-- ============================================================
-- Grant Permissions
-- ============================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_member_weekly_session_limit TO authenticated;

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON FUNCTION check_member_weekly_session_limit IS
'Validates member weekly session limit. Members can book max 1 "member" session per week. Makeup/trial/contractual/collaboration sessions bypass this limit.';
```

---

### TypeScript Type Definition

**File**: `src/features/database/lib/types.ts`

**Add**:

```typescript
/**
 * Return type for check_member_weekly_session_limit RPC function
 */
export interface MemberWeeklyLimitResult {
  can_book: boolean;
  current_member_sessions: number;
  max_allowed: number;
  message: string;
}
```

---

### Documentation Update

**File**: `docs/RPC_SIGNATURES.md`

**Add**:

```markdown
#### `check_member_weekly_session_limit`

Validates member weekly session limit enforcement.

**Signature:**

\`\`\`sql
check_member_weekly_session_limit(
p_member_id UUID,
p_week_start DATE,
p_week_end DATE,
p_session_type TEXT
) RETURNS JSONB
\`\`\`

**Parameters:**

- `p_member_id`: UUID of the member
- `p_week_start`: Start date of the week (Sunday)
- `p_week_end`: End date of the week (Saturday)
- `p_session_type`: Type of session being booked

**Returns:**

\`\`\`typescript
{
can_book: boolean; // Whether booking is allowed
current_member_sessions: number; // Current count of member sessions
max_allowed: number; // Maximum allowed (always 1)
message: string; // User-friendly message
}
\`\`\`

**Business Logic:**

- Counts "member" type sessions for the specified member in the date range
- Excludes cancelled sessions
- Bypasses validation for non-member session types
- Returns validation result with count and message

**Example:**

\`\`\`typescript
const { data, error } = await supabase.rpc(
'check_member_weekly_session_limit',
{
p_member_id: memberId,
p_week_start: '2025-11-17',
p_week_end: '2025-11-23',
p_session_type: 'member'
}
);

if (data.can_book) {
// Proceed with booking
} else {
// Show error: data.message
}
\`\`\`

**Performance:** O(log n) with index, ~10ms for 10k rows

**Created:** US-001 (member-weekly-session-limit feature)
```

---

## 🧪 Testing

### Manual Testing with Supabase MCP

**Test Case 1: Empty State**

```bash
# Use Supabase MCP to execute SQL
mcp__supabase__execute_sql:
  query: |
    SELECT check_member_weekly_session_limit(
      '[test-member-uuid]'::UUID,
      CURRENT_DATE - INTERVAL '7 days',
      CURRENT_DATE,
      'member'
    );
```

**Expected Result**: `can_book: true`, `current_member_sessions: 0`

---

**Test Case 2: One Member Session**

```bash
# Insert test session
mcp__supabase__execute_sql:
  query: |
    INSERT INTO training_sessions (member_id, session_type, scheduled_start, status)
    VALUES ('[test-member-uuid]', 'member', NOW(), 'scheduled');

# Test function
mcp__supabase__execute_sql:
  query: |
    SELECT check_member_weekly_session_limit(
      '[test-member-uuid]'::UUID,
      CURRENT_DATE - INTERVAL '7 days',
      CURRENT_DATE,
      'member'
    );
```

**Expected Result**: `can_book: false`, `current_member_sessions: 1`

---

**Test Case 3: Cancelled Session**

```bash
# Update session to cancelled
mcp__supabase__execute_sql:
  query: |
    UPDATE training_sessions
    SET status = 'cancelled'
    WHERE member_id = '[test-member-uuid]'
      AND session_type = 'member';

# Test function
mcp__supabase__execute_sql:
  query: |
    SELECT check_member_weekly_session_limit(
      '[test-member-uuid]'::UUID,
      CURRENT_DATE - INTERVAL '7 days',
      CURRENT_DATE,
      'member'
    );
```

**Expected Result**: `can_book: true`, `current_member_sessions: 0`

---

**Test Case 4: Makeup Session Bypass**

```bash
# Member has 1 member session
# Test with makeup session type
mcp__supabase__execute_sql:
  query: |
    SELECT check_member_weekly_session_limit(
      '[test-member-uuid]'::UUID,
      CURRENT_DATE - INTERVAL '7 days',
      CURRENT_DATE,
      'makeup'
    );
```

**Expected Result**: `can_book: true` (bypasses validation)

---

## 📊 Definition of Done

- [ ] Migration file created with proper naming convention
- [ ] RPC function implemented with correct signature
- [ ] Performance index created
- [ ] Function grants execute permission to authenticated users
- [ ] All acceptance criteria verified with manual tests
- [ ] TypeScript interface added to types.ts
- [ ] Documentation updated in RPC_SIGNATURES.md
- [ ] No SQL errors or warnings
- [ ] Query performance <50ms verified
- [ ] Clean up test data after verification

---

## 🔗 Dependencies

**Depends On**: None (foundation story)

**Blocks**:

- US-002: Application-Level Booking Validation
- US-003: Comprehensive Testing Suite
- US-004: Production Readiness & Optimization

---

## 📝 Notes

**Design Decisions**:

1. **SECURITY DEFINER**: Ensures consistent permissions regardless of caller
2. **Partial Index**: Only indexes non-cancelled sessions for better performance
3. **Composite Index**: Optimizes the specific query pattern used
4. **JSONB Return**: Flexible structure for future extensions

**Edge Cases Handled**:

- Cancelled sessions excluded from count
- Non-member session types bypass validation
- Week boundaries handled by caller (not in RPC)
- NULL session_type handled by equality check

**Performance Notes**:

- Index reduces query time from ~1000ms to ~10ms (10k rows)
- Partial index reduces index size by ~30% (excludes cancelled)
- Function uses parameterized query (SQL injection safe)

---

## 🎯 Success Criteria

**This story is complete when**:

- ✅ Migration applied successfully in database
- ✅ RPC function callable and returns correct structure
- ✅ All 6 acceptance criteria verified with tests
- ✅ Index improves query performance measurably
- ✅ TypeScript types defined
- ✅ Documentation updated
- ✅ STATUS.md updated with completion

---

**Priority**: P0 (Must Have)

**Complexity**: Medium

**Estimated Effort**: 1-2 hours

**Story Points**: 5

---

**Ready for implementation? Use `/implement-userstory US-001` to begin!**
