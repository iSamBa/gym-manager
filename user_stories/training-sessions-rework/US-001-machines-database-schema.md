# US-001: Machines Database Schema

## 📋 User Story

**As a** gym administrator
**I want** a machines table to manage the 3 training machines
**So that** I can track machine availability and assign sessions to specific machines

---

## 💼 Business Value

- **Machine management**: Centralized tracking of gym equipment (3 machines)
- **Availability control**: Ability to disable machines for maintenance
- **Session assignment**: Link sessions to specific machines for resource allocation
- **Scalability**: Easy to add more machines in the future if needed

---

## ✅ Acceptance Criteria

### AC-1: Machines Table Created

- [ ] Table `machines` exists in public schema
- [ ] Primary key: `id UUID`
- [ ] Unique constraint on `machine_number`
- [ ] Default timestamps (created_at, updated_at)

### AC-2: Machine Number Constraint

- [ ] `machine_number` must be INTEGER
- [ ] CHECK constraint ensures value is 1, 2, or 3
- [ ] Attempting to insert machine_number outside range fails

### AC-3: Default Machines Inserted

- [ ] 3 machines automatically created during migration
- [ ] Machine 1: `machine_number = 1, name = "Machine 1", is_available = true`
- [ ] Machine 2: `machine_number = 2, name = "Machine 2", is_available = true`
- [ ] Machine 3: `machine_number = 3, name = "Machine 3", is_available = true`

### AC-4: Row Level Security Enabled

- [ ] RLS enabled on machines table
- [ ] **SELECT**: All authenticated users can view machines
- [ ] **INSERT/UPDATE/DELETE**: Only users with role='admin' can modify
- [ ] Non-admin users cannot change `is_available` status

### AC-5: Migration Rollback Safe

- [ ] Migration includes DROP TABLE IF EXISTS for rollback
- [ ] Rollback script provided in migration comments
- [ ] No foreign key dependencies prevent rollback

---

## 🗄️ Database Schema

### Table Structure

```sql
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT machine_number_range CHECK (machine_number IN (1, 2, 3))
);

-- Comment on table
COMMENT ON TABLE machines IS 'Tracks the 3 training machines available for session booking';

-- Comments on columns
COMMENT ON COLUMN machines.machine_number IS 'Unique machine identifier (1, 2, or 3)';
COMMENT ON COLUMN machines.is_available IS 'Whether the machine is available for booking (admin-controlled)';
```

### Default Data

```sql
INSERT INTO machines (machine_number, name, is_available) VALUES
  (1, 'Machine 1', true),
  (2, 'Machine 2', true),
  (3, 'Machine 3', true);
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view machines
CREATE POLICY "select_machines"
  ON machines
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can modify machines
CREATE POLICY "admin_modify_machines"
  ON machines
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
```

### Trigger for updated_at

```sql
CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 🛠️ Implementation Guide

### Step 1: Create Migration File

```bash
# Create new migration
# Use Supabase MCP tool: apply_migration

# Migration name: "create_machines_table"
```

### Step 2: Write Migration SQL

```sql
-- Migration: create_machines_table
-- Description: Create machines table for training session resource management

-- Create machines table
CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT machine_number_range CHECK (machine_number IN (1, 2, 3))
);

-- Add table and column comments
COMMENT ON TABLE machines IS 'Tracks the 3 training machines available for session booking';
COMMENT ON COLUMN machines.machine_number IS 'Unique machine identifier (1, 2, or 3)';
COMMENT ON COLUMN machines.is_available IS 'Whether the machine is available for booking (admin-controlled)';

-- Insert default machines
INSERT INTO machines (machine_number, name, is_available) VALUES
  (1, 'Machine 1', true),
  (2, 'Machine 2', true),
  (3, 'Machine 3', true)
ON CONFLICT (machine_number) DO NOTHING;

-- Enable RLS
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT for all authenticated users
CREATE POLICY "select_machines"
  ON machines
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: INSERT/UPDATE/DELETE for admin only
CREATE POLICY "admin_modify_machines"
  ON machines
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Rollback instructions (as comment):
-- DROP TABLE IF EXISTS machines CASCADE;
```

### Step 3: Apply Migration

```typescript
// Use Supabase MCP server
await mcp__supabase__apply_migration({
  name: "create_machines_table",
  query: `/* SQL from Step 2 */`,
});
```

### Step 4: Verify Migration

```typescript
// List tables to confirm machines table exists
const tables = await mcp__supabase__list_tables({ schemas: ["public"] });
console.log(tables.find((t) => t.name === "machines"));

// Verify default data
const { data } = await supabase
  .from("machines")
  .select("*")
  .order("machine_number");
console.log(data); // Should show 3 machines
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Test file: src/features/training-sessions/__tests__/database/machines-schema.test.ts

describe("Machines Table Schema", () => {
  it("has 3 default machines", async () => {
    const { data } = await supabase.from("machines").select("*");
    expect(data).toHaveLength(3);
    expect(data.map((m) => m.machine_number)).toEqual([1, 2, 3]);
  });

  it("enforces machine_number range constraint", async () => {
    const { error } = await supabase.from("machines").insert({
      machine_number: 4, // Invalid
      name: "Machine 4",
    });
    expect(error).toBeTruthy();
    expect(error.message).toContain("machine_number_range");
  });

  it("prevents duplicate machine numbers", async () => {
    const { error } = await supabase.from("machines").insert({
      machine_number: 1, // Duplicate
      name: "Duplicate Machine",
    });
    expect(error).toBeTruthy();
    expect(error.code).toBe("23505"); // Unique violation
  });
});
```

### RLS Policy Tests

```typescript
describe("Machines RLS Policies", () => {
  it("allows authenticated users to SELECT machines", async () => {
    // Login as non-admin user
    const { data } = await supabase.from("machines").select("*");
    expect(data).toHaveLength(3);
  });

  it("prevents non-admin from updating machines", async () => {
    // Login as non-admin user
    const { error } = await supabase
      .from("machines")
      .update({ is_available: false })
      .eq("machine_number", 1);

    expect(error).toBeTruthy();
    expect(error.code).toBe("42501"); // Insufficient privilege
  });

  it("allows admin to update machine availability", async () => {
    // Login as admin user
    const { error } = await supabase
      .from("machines")
      .update({ is_available: false })
      .eq("machine_number", 1);

    expect(error).toBeNull();
  });
});
```

### Manual Verification

```sql
-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'machines'
ORDER BY ordinal_position;

-- Verify constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'machines';

-- Verify RLS policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'machines';

-- Verify default data
SELECT * FROM machines ORDER BY machine_number;
```

---

## 📊 Verification Checklist

Before marking this story complete, verify:

- [ ] Migration applied successfully without errors
- [ ] Table `machines` exists in public schema
- [ ] 3 machines inserted with correct data
- [ ] Unique constraint on `machine_number` enforced
- [ ] CHECK constraint allows only 1, 2, 3 values
- [ ] RLS enabled on table
- [ ] SELECT policy allows authenticated users
- [ ] Modify policy restricts to admin role only
- [ ] `updated_at` trigger works correctly
- [ ] All unit tests passing
- [ ] Manual SQL verification successful

---

## 🔗 Dependencies

### Depends On

- ✅ `user_profiles` table exists (for RLS policy check)
- ✅ `update_updated_at_column()` function exists

### Required For

- ⏳ US-002: Training Sessions Schema Updates (needs machines.id for foreign key)
- ⏳ US-006: Machine Slot Grid Component (needs machines table for rendering)
- ⏳ US-010: Machine Availability Admin Controls (needs machines.is_available)

---

## 🎯 Definition of Done

- [ ] Migration file created and applied
- [ ] Table created with correct schema
- [ ] 3 default machines inserted
- [ ] RLS policies created and tested
- [ ] Constraints enforced (unique, check)
- [ ] Updated_at trigger working
- [ ] Unit tests written and passing
- [ ] Manual verification completed
- [ ] Code review approved
- [ ] Documentation updated

---

## 📝 Notes

### Design Decisions

**Why hardcode 3 machines?**

- Current business requirement is exactly 3 machines
- CHECK constraint makes this explicit and prevents errors
- Easy to modify constraint if business needs change

**Why separate table instead of enum?**

- Allows storing metadata (is_available, name)
- Easier to add new attributes in future
- Better for joins with training_sessions

**Why admin-only modifications?**

- Machine availability affects booking capacity
- Should be controlled process (not self-service)
- Prevents accidental disabling of machines

---

**Estimated Effort:** 1-2 hours
**Actual Effort:** 30 minutes
**Completed:** 2025-10-09
**Status:** ✅ Completed

## Implementation Notes

Successfully created machines table with all required features:

- Table created with UUID primary key, machine_number (1-3), name, is_available, and timestamps
- 3 machines inserted with default data
- RLS policies configured: SELECT for authenticated, INSERT/UPDATE/DELETE for admin only
- Constraints enforced: UNIQUE on machine_number, CHECK for values 1, 2, 3
- updated_at trigger integrated
- All acceptance criteria verified
- Migration is rollback-safe with CASCADE support

**Migration Name:** `create_machines_table`
**Supabase Advisor Check:** No security issues detected for machines table
