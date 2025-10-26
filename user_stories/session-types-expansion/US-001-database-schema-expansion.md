# US-001: Database Schema Expansion

## User Story

**As a** gym administrator
**I want** the database to support 7 session types with guest information fields
**So that** I can track different session scenarios including guest visits and collaborations

---

## Business Value

**Priority**: P0 (Must Have)
**Complexity**: Small
**Estimated Time**: 45 minutes

### Impact

- Enables financial tracking of multi-site visits
- Supports commercial partnerships
- Provides foundation for all other session type features
- Ensures data integrity through constraints

---

## Acceptance Criteria

### AC-1: Session Type Enum Expanded

**Given** the training_sessions table exists
**When** I check the session_type constraint
**Then** it should allow: 'trial', 'member', 'contractual', 'multi_site', 'collaboration', 'makeup', 'non_bookable'

**Verification**:

```sql
SELECT constraint_definition
FROM pg_constraint
WHERE conname = 'training_sessions_session_type_check';
-- Should show all 7 types
```

### AC-2: Existing Data Migrated

**Given** existing sessions have 'standard' or 'trail' types
**When** the migration completes
**Then** all 'standard' → 'member' and all 'trail' → 'trial'

**Verification**:

```sql
SELECT session_type, COUNT(*)
FROM training_sessions
GROUP BY session_type;
-- Should show 'member' count = 547, no 'standard' or 'trail'
```

### AC-3: Guest Fields Added

**Given** the training_sessions table
**When** I describe the table
**Then** columns exist: guest_first_name, guest_last_name, guest_gym_name, collaboration_details

**Verification**:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'training_sessions'
AND column_name IN ('guest_first_name', 'guest_last_name', 'guest_gym_name', 'collaboration_details');
-- Should return 4 rows, all TEXT, all nullable
```

### AC-4: Data Integrity Constraints

**Given** a multi_site session is created
**When** guest fields are missing
**Then** the insert should fail with constraint violation

**And Given** a collaboration session is created
**When** collaboration_details is missing
**Then** the insert should fail with constraint violation

**Verification**:

```sql
-- Should fail
INSERT INTO training_sessions (session_type, machine_id, scheduled_start, scheduled_end)
VALUES ('multi_site', '...', NOW(), NOW() + interval '30 minutes');

-- Should succeed
INSERT INTO training_sessions (
  session_type, machine_id, scheduled_start, scheduled_end,
  guest_first_name, guest_last_name, guest_gym_name
) VALUES (
  'multi_site', '...', NOW(), NOW() + interval '30 minutes',
  'John', 'Doe', 'Partner Gym'
);
```

### AC-5: Indexes Created

**Given** the migration completes
**When** I check table indexes
**Then** indexes exist on session_type and guest_gym_name

**Verification**:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'training_sessions'
AND indexname IN ('idx_training_sessions_session_type', 'idx_training_sessions_guest_gym');
-- Should return 2 rows
```

---

## Technical Implementation

### Migration File

**Name**: `fix_trial_and_expand_session_types.sql`

**Steps**:

1. Drop existing session_type constraint
2. Migrate 'standard' → 'member'
3. Migrate 'trail' → 'trial' (typo fix)
4. Add new constraint with all 7 types
5. Add 4 guest columns (TEXT, nullable)
6. Add multi_site constraint (requires 3 guest fields)
7. Add collaboration constraint (requires details field)
8. Add column comments
9. Create indexes

### Database Changes

```sql
-- Drop old constraint
ALTER TABLE training_sessions
DROP CONSTRAINT IF EXISTS training_sessions_session_type_check;

-- Migrate data
UPDATE training_sessions SET session_type = 'member' WHERE session_type = 'standard';
UPDATE training_sessions SET session_type = 'trial' WHERE session_type = 'trail';

-- Add new constraint
ALTER TABLE training_sessions
ADD CONSTRAINT training_sessions_session_type_check
CHECK (session_type = ANY (ARRAY[
  'trial'::text, 'member'::text, 'contractual'::text,
  'multi_site'::text, 'collaboration'::text,
  'makeup'::text, 'non_bookable'::text
]));

-- Add guest columns
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS guest_first_name TEXT,
ADD COLUMN IF NOT EXISTS guest_last_name TEXT,
ADD COLUMN IF NOT EXISTS guest_gym_name TEXT,
ADD COLUMN IF NOT EXISTS collaboration_details TEXT;

-- Add constraints
ALTER TABLE training_sessions
ADD CONSTRAINT multi_site_requires_guest_data
CHECK (
  (session_type = 'multi_site' AND
   guest_first_name IS NOT NULL AND
   guest_last_name IS NOT NULL AND
   guest_gym_name IS NOT NULL)
  OR session_type != 'multi_site'
);

ALTER TABLE training_sessions
ADD CONSTRAINT collaboration_requires_details
CHECK (
  (session_type = 'collaboration' AND collaboration_details IS NOT NULL)
  OR session_type != 'collaboration'
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_training_sessions_session_type
ON training_sessions(session_type);

CREATE INDEX IF NOT EXISTS idx_training_sessions_guest_gym
ON training_sessions(guest_gym_name)
WHERE guest_gym_name IS NOT NULL;
```

---

## Testing Requirements

### Database Tests

**File**: Not required (verified through Supabase MCP)

**Manual Verification**:

```bash
# Check constraint
mcp__supabase__execute_sql "
  SELECT constraint_definition
  FROM pg_constraint
  WHERE conname = 'training_sessions_session_type_check'
"

# Check data migration
mcp__supabase__execute_sql "
  SELECT session_type, COUNT(*)
  FROM training_sessions
  GROUP BY session_type
"

# Check columns
mcp__supabase__execute_sql "
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'training_sessions'
  AND column_name LIKE 'guest%' OR column_name = 'collaboration_details'
"
```

---

## Dependencies

**Depends On**: None
**Blocks**: US-002, US-003, US-004, US-005, US-006, US-007, US-008

---

## Definition of Done

- [x] Migration script created
- [x] Migration applied to database
- [x] All 7 session types in constraint
- [x] All 547 existing sessions migrated to 'member'
- [x] Guest fields added (4 columns)
- [x] Data integrity constraints added (2 constraints)
- [x] Indexes created (2 indexes)
- [x] Column comments added
- [x] Verification queries successful
- [x] No existing sessions broken

---

## Notes

**Completed**: 2025-10-26
**Issues Encountered**: Initial migration failed due to constraint order (needed to drop before UPDATE)
**Resolution**: Reordered migration steps - drop constraint first

**Impact**:

- 547 rows migrated successfully
- No downtime required
- Backwards compatible (existing API still works)
