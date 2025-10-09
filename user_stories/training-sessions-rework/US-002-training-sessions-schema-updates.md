# US-002: Training Sessions Schema Updates

## 📋 User Story

**As a** developer
**I want** to update the training_sessions table schema
**So that** sessions can be linked to machines with single-member capacity and optional trainer assignment

---

## 💼 Business Value

- **Simplified capacity**: Remove max_participants (always 1 member per session)
- **Flexible trainer assignment**: Make trainer_id nullable for session creation
- **Machine resource management**: Link sessions to specific machines
- **Data integrity**: Maintain existing session data during migration

---

## ✅ Acceptance Criteria

### AC-1: Remove Redundant Columns

- [ ] `max_participants` column dropped from `training_sessions` table
- [ ] `location` column dropped (redundant with machine_id)
- [ ] Current participants count remains (0 or 1)
- [ ] No application code references max_participants or location after migration

### AC-2: Make trainer_id Nullable

- [ ] `trainer_id` column constraint changed from NOT NULL to NULLABLE
- [ ] Existing sessions retain their trainer assignments
- [ ] New sessions can be created without trainer_id
- [ ] Trainer can be assigned later when session is completed

### AC-3: Add machine_id Column

- [ ] `machine_id UUID` column added to `training_sessions`
- [ ] Foreign key constraint: `REFERENCES machines(id)`
- [ ] ON DELETE behavior: RESTRICT (cannot delete machine with active sessions)
- [ ] Existing sessions assigned to default machine (Machine 1)
- [ ] Column becomes NOT NULL after default assignment

### AC-4: Update Table Constraints

- [ ] Remove any max_participants-related CHECK constraints
- [ ] current_participants CHECK remains (>= 0)
- [ ] Add index on machine_id for query performance

### AC-5: Data Migration Safe

- [ ] Existing sessions preserved with all data intact
- [ ] No data loss during migration
- [ ] Rollback script provided
- [ ] Migration is idempotent (can run multiple times safely)

---

## 🗄️ Database Schema Changes

### Before Migration

```sql
training_sessions (
  id UUID PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES trainers(id),  -- NOT NULL
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  max_participants INTEGER DEFAULT 1 CHECK (max_participants > 0),  -- TO REMOVE
  current_participants INTEGER DEFAULT 0 CHECK (current_participants >= 0),
  notes TEXT,
  location TEXT,
  session_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### After Migration

```sql
training_sessions (
  id UUID PRIMARY KEY,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE RESTRICT,  -- NEW
  trainer_id UUID REFERENCES trainers(id),  -- NOW NULLABLE
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  -- max_participants REMOVED
  -- location REMOVED (redundant with machine_id)
  current_participants INTEGER DEFAULT 0 CHECK (current_participants >= 0),
  notes TEXT,
  session_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

---

## 🛠️ Implementation Guide

### Step 1: Create Migration SQL

```sql
-- Migration: update_training_sessions_schema_for_machines
-- Description: Add machine_id, remove max_participants, make trainer_id nullable

-- Step 1: Add machine_id column (nullable initially for data migration)
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS machine_id UUID REFERENCES machines(id) ON DELETE RESTRICT;

-- Step 2: Assign all existing sessions to Machine 1 (default)
UPDATE training_sessions
SET machine_id = (SELECT id FROM machines WHERE machine_number = 1 LIMIT 1)
WHERE machine_id IS NULL;

-- Step 3: Make machine_id NOT NULL after default assignment
ALTER TABLE training_sessions
ALTER COLUMN machine_id SET NOT NULL;

-- Step 4: Add index on machine_id for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_machine_id
ON training_sessions(machine_id);

-- Step 5: Make trainer_id nullable
ALTER TABLE training_sessions
ALTER COLUMN trainer_id DROP NOT NULL;

-- Step 6: Remove max_participants and location columns
ALTER TABLE training_sessions
DROP COLUMN IF EXISTS max_participants,
DROP COLUMN IF EXISTS location;

-- Step 7: Add column comments
COMMENT ON COLUMN training_sessions.machine_id IS 'Machine assigned to this session (1, 2, or 3)';
COMMENT ON COLUMN training_sessions.trainer_id IS 'Trainer assigned to session (optional until completion)';

-- Rollback instructions (as comment):
-- ALTER TABLE training_sessions DROP COLUMN IF EXISTS machine_id;
-- ALTER TABLE training_sessions ADD COLUMN max_participants INTEGER DEFAULT 1 CHECK (max_participants > 0);
-- ALTER TABLE training_sessions ADD COLUMN location TEXT;
-- ALTER TABLE training_sessions ALTER COLUMN trainer_id SET NOT NULL;
```

### Step 2: Apply Migration

```typescript
// Use Supabase MCP server
await mcp__supabase__apply_migration({
  name: "update_training_sessions_schema_for_machines",
  query: `/* SQL from Step 1 */`,
});
```

### Step 3: Verify Migration

```typescript
// Check schema changes
const tables = await mcp__supabase__list_tables({ schemas: ["public"] });
const sessionsTable = tables.find((t) => t.name === "training_sessions");

// Verify columns
console.log(sessionsTable.columns.find((c) => c.name === "machine_id")); // Should exist
console.log(sessionsTable.columns.find((c) => c.name === "max_participants")); // Should be undefined
console.log(
  sessionsTable.columns.find((c) => c.name === "trainer_id").is_nullable
); // Should be true

// Verify all sessions have machine_id
const { data } = await supabase
  .from("training_sessions")
  .select("id, machine_id")
  .is("machine_id", null);

console.log(data.length); // Should be 0
```

---

## 🧪 Testing Strategy

### Schema Validation Tests

```typescript
// Test file: src/features/training-sessions/__tests__/database/sessions-schema-update.test.ts

describe("Training Sessions Schema Updates", () => {
  it("has machine_id column with foreign key to machines", async () => {
    const { data } = await supabase
      .from("training_sessions")
      .select("machine_id")
      .limit(1);

    expect(data[0]).toHaveProperty("machine_id");
    expect(typeof data[0].machine_id).toBe("string");
  });

  it("does not have max_participants column", async () => {
    const { data } = await supabase
      .from("training_sessions")
      .select("*")
      .limit(1);

    expect(data[0]).not.toHaveProperty("max_participants");
  });

  it("allows null trainer_id", async () => {
    const { error } = await supabase.from("training_sessions").insert({
      machine_id: "(SELECT id FROM machines WHERE machine_number = 1)",
      trainer_id: null, // Should be allowed
      scheduled_start: new Date().toISOString(),
      scheduled_end: new Date(Date.now() + 1800000).toISOString(),
      status: "scheduled",
    });

    expect(error).toBeNull();
  });

  it("enforces machine_id foreign key constraint", async () => {
    const { error } = await supabase.from("training_sessions").insert({
      machine_id: "00000000-0000-0000-0000-000000000000", // Invalid UUID
      scheduled_start: new Date().toISOString(),
      scheduled_end: new Date(Date.now() + 1800000).toISOString(),
    });

    expect(error).toBeTruthy();
    expect(error.code).toBe("23503"); // Foreign key violation
  });
});
```

### Data Migration Tests

```typescript
describe("Training Sessions Data Migration", () => {
  it("assigns default machine to existing sessions", async () => {
    // Get machine 1 ID
    const { data: machines } = await supabase
      .from("machines")
      .select("id")
      .eq("machine_number", 1)
      .single();

    // Check all old sessions have machine_id = machine 1
    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("machine_id, created_at")
      .lt("created_at", MIGRATION_TIMESTAMP);

    sessions.forEach((session) => {
      expect(session.machine_id).toBe(machines.id);
    });
  });

  it("preserves all existing session data", async () => {
    // Get session count before migration
    const countBefore = await getSessionCount();

    // Run migration
    await runMigration();

    // Get session count after migration
    const countAfter = await getSessionCount();

    expect(countAfter).toBe(countBefore);
  });
});
```

### Manual Verification

```sql
-- Verify column changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'training_sessions'
ORDER BY ordinal_position;

-- Verify foreign key constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'training_sessions'
  AND constraint_type = 'FOREIGN KEY';

-- Verify all sessions have machine_id
SELECT COUNT(*) AS total_sessions,
       COUNT(machine_id) AS sessions_with_machine
FROM training_sessions;
-- Both counts should be equal

-- Verify sessions with null trainer_id (should be allowed now)
SELECT COUNT(*) AS sessions_without_trainer
FROM training_sessions
WHERE trainer_id IS NULL;

-- Verify max_participants is gone
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'training_sessions'
  AND column_name = 'max_participants';
-- Should return no rows
```

---

## 📊 Verification Checklist

Before marking this story complete, verify:

- [ ] Migration applied successfully
- [ ] machine_id column exists and is NOT NULL
- [ ] Foreign key to machines table enforced
- [ ] Index on machine_id created
- [ ] All existing sessions have machine_id assigned
- [ ] trainer_id is now nullable
- [ ] max_participants column removed
- [ ] No application code references max_participants
- [ ] All existing session data preserved
- [ ] Unit tests passing
- [ ] Manual SQL verification successful

---

## 🔗 Dependencies

### Depends On

- ✅ US-001: Machines Database Schema (machines table must exist)

### Required For

- ⏳ US-003: Database Functions Cleanup (functions reference new schema)
- ⏳ US-004: TypeScript Types Update (types match new schema)
- ⏳ US-005: Hooks API Modifications (queries use machine_id)

---

## ⚠️ Breaking Changes

### For Backend Code

- ❌ **max_participants** no longer exists - remove all references
- ❌ **location** no longer exists - remove all references (use machine_id instead)
- ⚠️ **trainer_id** can now be null - handle null checks
- ➕ **machine_id** is required - update create/update mutations

### Migration Impact

- **Existing sessions**: All assigned to Machine 1 by default
- **Trainer assignments**: All preserved as-is
- **Participants**: No change (max was already 1 in practice)

---

## 🎯 Definition of Done

- [ ] Migration file created and applied
- [ ] machine_id column added with foreign key
- [ ] trainer_id made nullable
- [ ] max_participants removed
- [ ] Index created on machine_id
- [ ] All existing sessions migrated successfully
- [ ] Schema verification tests passing
- [ ] Data migration tests passing
- [ ] Manual SQL verification completed
- [ ] Documentation updated
- [ ] Code review approved

---

## 📝 Notes

### Design Decisions

**Why make trainer_id nullable?**

- Allows session creation without trainer assignment
- Trainer can be assigned when session is marked complete
- Matches real-world workflow: book slot → complete session → assign trainer

**Why default to Machine 1?**

- Safe default for existing data
- Admins can reassign to correct machines post-migration
- Alternative: distribute evenly across 3 machines (more complex, same outcome)

**Why ON DELETE RESTRICT?**

- Prevents accidentally deleting machines with active sessions
- Forces admin to reassign or cancel sessions first
- Data integrity over convenience

---

**Estimated Effort:** 2-3 hours
**Actual Effort:** TBD
**Completed:** Not yet
