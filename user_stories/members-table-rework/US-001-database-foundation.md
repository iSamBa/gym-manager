# US-001: Database Foundation for Enhanced Members Table

## User Story

**As a** system developer
**I want** to create a database function that efficiently retrieves member details with subscription, session, and payment data
**So that** the members table can display comprehensive information with optimal performance

---

## Business Value

- **Performance**: Single query instead of multiple client-side queries
- **Scalability**: Server-side aggregations handle large datasets efficiently
- **Maintainability**: Centralized data logic in database layer

---

## Acceptance Criteria

### AC1: Database Function Creation

**Given** I have admin access to Supabase
**When** I create the `get_members_with_details()` function
**Then** it should:

- Accept filter parameters (status, search, member_type, limit, offset, orderBy, orderDirection)
- Return member base data (id, first_name, last_name, email, phone, date_of_birth, gender, status, join_date, member_type)
- Include active subscription data (end_date, remaining_sessions, total_amount_snapshot, paid_amount)
- Include session statistics (last_session_date, next_session_date, scheduled_sessions_count)
- Include last payment date
- Calculate balance_due as (total_amount_snapshot - paid_amount)
- Support server-side sorting by specified fields
- Support pagination with limit/offset

### AC2: Performance Optimization

**Given** the database function is created
**When** I query for 1000+ members
**Then** it should:

- Execute in < 500ms
- Use appropriate indexes
- Minimize JOIN operations
- Use efficient aggregations

### AC3: Data Accuracy

**Given** a member with subscription and sessions
**When** I call the function
**Then** it should return:

- Correct remaining_sessions from active subscription
- Accurate scheduled_sessions_count (only upcoming confirmed/waitlisted sessions)
- Correct last_session_date (most recent completed/attended session)
- Correct next_session_date (earliest upcoming confirmed session)
- Accurate balance_due calculation

### AC4: Index Creation

**Given** the function uses specific query patterns
**When** I create supporting indexes
**Then** indexes should exist on:

- `members.status`
- `members.member_type`
- `members.join_date`
- `member_subscriptions(member_id, status, end_date)`
- `training_session_members(member_id, booking_status, attendance_status)`
- `training_sessions(scheduled_start, status)`
- `subscription_payments(member_id, payment_date, payment_status)`

---

## Technical Implementation

### Database Function Signature

```sql
CREATE OR REPLACE FUNCTION get_members_with_details(
  p_status text[] DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_member_type text DEFAULT NULL,
  p_has_active_subscription boolean DEFAULT NULL,
  p_has_upcoming_sessions boolean DEFAULT NULL,
  p_has_outstanding_balance boolean DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_order_by text DEFAULT 'name',
  p_order_direction text DEFAULT 'asc'
)
RETURNS TABLE (
  -- Member fields
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  date_of_birth date,
  gender text,
  status text,
  join_date date,
  member_type text,
  profile_picture_url text,
  created_at timestamptz,
  updated_at timestamptz,

  -- Subscription fields
  subscription_end_date date,
  remaining_sessions integer,
  balance_due numeric,

  -- Session fields
  last_session_date timestamptz,
  next_session_date timestamptz,
  scheduled_sessions_count integer,

  -- Payment fields
  last_payment_date date
)
```

### Required Indexes

```sql
-- Migration file: add_members_table_indexes.sql

-- Members table indexes
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_member_type ON members(member_type);
CREATE INDEX IF NOT EXISTS idx_members_join_date ON members(join_date DESC);
CREATE INDEX IF NOT EXISTS idx_members_search ON members USING gin(
  to_tsvector('english', first_name || ' ' || last_name || ' ' || email)
);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_member_subscriptions_member_status
  ON member_subscriptions(member_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_member_subscriptions_end_date
  ON member_subscriptions(end_date DESC) WHERE status = 'active';

-- Session members indexes
CREATE INDEX IF NOT EXISTS idx_training_session_members_member
  ON training_session_members(member_id, booking_status, attendance_status);

-- Training sessions indexes
CREATE INDEX IF NOT EXISTS idx_training_sessions_scheduled
  ON training_sessions(scheduled_start) WHERE status IN ('scheduled', 'in_progress');

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_subscription_payments_member_date
  ON subscription_payments(member_id, payment_date DESC)
  WHERE payment_status = 'completed';
```

---

## Testing Criteria

### Unit Tests (Database Function)

**Test 1: Basic Member Retrieval**

```sql
-- Should return all members with null aggregations if no related data
SELECT * FROM get_members_with_details(p_limit := 10);
-- Verify: Returns 10 members max
-- Verify: All member fields populated
-- Verify: Subscription/session/payment fields NULL for members without data
```

**Test 2: Active Subscription Filtering**

```sql
SELECT * FROM get_members_with_details(
  p_has_active_subscription := true,
  p_limit := 100
);
-- Verify: All returned members have subscription_end_date IS NOT NULL
-- Verify: All returned members have active subscriptions
```

**Test 3: Session Statistics Accuracy**

```sql
-- Given: Member with 3 completed sessions, 2 upcoming sessions
-- When: Query for this member
SELECT * FROM get_members_with_details() WHERE id = '{member_id}';
-- Then: scheduled_sessions_count = 2
-- Then: last_session_date = date of most recent completed session
-- Then: next_session_date = date of earliest upcoming session
```

**Test 4: Balance Calculation**

```sql
-- Given: Member with subscription (total_amount: 1000, paid_amount: 600)
-- When: Query for this member
SELECT balance_due FROM get_members_with_details() WHERE id = '{member_id}';
-- Then: balance_due = 400.00
```

**Test 5: Search Functionality**

```sql
SELECT * FROM get_members_with_details(p_search := 'john');
-- Verify: Returns members with 'john' in first_name, last_name, or email
-- Verify: Case-insensitive search
```

**Test 6: Sorting**

```sql
-- Test ascending
SELECT * FROM get_members_with_details(
  p_order_by := 'join_date',
  p_order_direction := 'asc'
);
-- Verify: Results ordered by join_date ascending

-- Test descending
SELECT * FROM get_members_with_details(
  p_order_by := 'name',
  p_order_direction := 'desc'
);
-- Verify: Results ordered by name descending
```

**Test 7: Pagination**

```sql
-- Page 1
SELECT * FROM get_members_with_details(p_limit := 20, p_offset := 0);
-- Page 2
SELECT * FROM get_members_with_details(p_limit := 20, p_offset := 20);
-- Verify: Different results, no overlap
```

### Performance Tests

**Test 8: Large Dataset Performance**

```sql
-- Given: 1000+ members in database
-- When: Execute function
EXPLAIN ANALYZE
SELECT * FROM get_members_with_details(p_limit := 20);
-- Then: Execution time < 500ms
-- Then: Uses indexes (verify in query plan)
```

**Test 9: Complex Filtering Performance**

```sql
EXPLAIN ANALYZE
SELECT * FROM get_members_with_details(
  p_status := ARRAY['active', 'pending'],
  p_member_type := 'full',
  p_has_active_subscription := true,
  p_has_upcoming_sessions := true,
  p_search := 'test',
  p_limit := 20
);
-- Then: Execution time < 500ms even with multiple filters
```

---

## Test Data Setup

### Sample Data Requirements

```sql
-- Create test members with various scenarios:

-- Member 1: Full member, active subscription, upcoming sessions, payments
INSERT INTO members (first_name, last_name, email, member_type, status)
VALUES ('John', 'Doe', 'john@example.com', 'full', 'active');

-- Member 2: Trial member, no subscription
INSERT INTO members (first_name, last_name, email, member_type, status)
VALUES ('Jane', 'Smith', 'jane@example.com', 'trial', 'active');

-- Member 3: Member with completed sessions but no upcoming
-- Member 4: Member with outstanding balance
-- Member 5: Member with fully paid subscription
-- etc.
```

---

## Definition of Done

- [x] Database function `get_members_with_details()` created via migration
- [x] All required indexes created and verified
- [x] Function accepts all specified parameters
- [x] Function returns all required fields
- [x] All acceptance criteria met
- [x] All unit tests pass (9/9)
- [x] Performance tests meet < 500ms requirement (207ms basic, 10ms with filters)
- [x] Query execution plan reviewed and optimized
- [x] Migration applied to development database
- [x] Documentation updated with function usage examples
- [x] Code review completed
- [x] Supabase advisors show no security/performance warnings (search_path secured)

---

## Notes

### Edge Cases to Handle

1. Members with no subscriptions (return NULL for subscription fields)
2. Members with multiple active subscriptions (use most recent)
3. Sessions with NULL scheduled_start (exclude from aggregations)
4. Deleted/cancelled sessions (exclude from counts)
5. Refunded payments (exclude from last_payment_date)

### Dependencies

- Supabase database access
- Existing tables: `members`, `member_subscriptions`, `training_sessions`, `training_session_members`, `subscription_payments`

### Risks

- Complex JOINs may impact performance (mitigated with indexes)
- Function may need optimization after initial deployment (monitor with Supabase Performance Insights)

---

## Related User Stories

- US-002: Type Definitions for Enhanced Member Data
- US-003: API Layer Integration
- US-004: Table Component Updates
