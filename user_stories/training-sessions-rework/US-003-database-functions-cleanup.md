# US-003: Database Functions Cleanup

## 📋 User Story

**As a** developer
**I want** to update database functions and views to work with the new schema
**So that** trainer availability checks are removed and machine_id is properly handled

---

## 💼 Business Value

- **Remove obsolete logic**: Trainer availability checks no longer needed
- **Update views**: Include machine data in calendar views
- **Simpler functions**: Fewer parameters and validations
- **Better performance**: Removed unnecessary subqueries

---

## ✅ Acceptance Criteria

### AC-1: Update `create_training_session_with_members` Function

- [x] Add `p_machine_id` parameter (required)
- [x] Make `p_trainer_id` parameter optional (NULL allowed)
- [x] Remove `p_max_participants` parameter
- [x] Remove trainer availability validation logic
- [x] Function creates sessions with machine_id

### AC-2: Update `training_sessions_calendar` View

- [x] Include machine_id in SELECT
- [x] Join with machines table to get machine_number and name
- [x] Remove max_participants from output
- [x] Handle nullable trainer_id in joins

### AC-3: Remove Trainer Availability Functions

- [x] Drop `check_trainer_availability` function (if exists)
- [x] Remove any availability-related helper functions
- [x] Clean up obsolete validation functions

### AC-4: Update Other Dependent Functions

- [x] Update any session-related stored procedures
- [x] Ensure all functions handle nullable trainer_id
- [x] Remove max_participants references

---

## 🛠️ Implementation Guide

### Updated Function: `create_training_session_with_members`

```sql
CREATE OR REPLACE FUNCTION create_training_session_with_members(
  p_machine_id UUID,  -- NEW: Required parameter
  p_trainer_id UUID DEFAULT NULL,  -- MODIFIED: Now optional
  p_scheduled_start TIMESTAMPTZ,
  p_scheduled_end TIMESTAMPTZ,
  p_location TEXT,
  -- REMOVED: p_max_participants
  p_member_ids UUID[],  -- Should only contain 1 member ID
  p_notes TEXT DEFAULT NULL,
  p_session_type TEXT DEFAULT 'standard'
)
RETURNS JSON AS $$
DECLARE
  v_session_id UUID;
  v_member_id UUID;
BEGIN
  -- Validation: Ensure machine exists and is available
  IF NOT EXISTS (
    SELECT 1 FROM machines
    WHERE id = p_machine_id
    AND is_available = true
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Machine is not available for booking'
    );
  END IF;

  -- Validation: Only 1 member allowed per session
  IF array_length(p_member_ids, 1) > 1 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only 1 member allowed per session'
    );
  END IF;

  -- REMOVED: Trainer availability check (obsolete)

  -- Create training session
  INSERT INTO training_sessions (
    machine_id,
    trainer_id,
    scheduled_start,
    scheduled_end,
    location,
    status,
    session_type,
    notes,
    current_participants
  ) VALUES (
    p_machine_id,
    p_trainer_id,  -- Can be NULL
    p_scheduled_start,
    p_scheduled_end,
    p_location,
    'scheduled',
    p_session_type,
    p_notes,
    array_length(p_member_ids, 1)  -- 0 or 1
  )
  RETURNING id INTO v_session_id;

  -- Add member to session (if provided)
  IF array_length(p_member_ids, 1) > 0 THEN
    FOREACH v_member_id IN ARRAY p_member_ids LOOP
      INSERT INTO training_session_members (
        session_id,
        member_id,
        booking_status
      ) VALUES (
        v_session_id,
        v_member_id,
        'confirmed'
      );
    END LOOP;
  END IF;

  RETURN json_build_object(
    'success', true,
    'session_id', v_session_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Updated View: `training_sessions_calendar`

```sql
CREATE OR REPLACE VIEW training_sessions_calendar AS
SELECT
  ts.id,
  ts.machine_id,
  m.machine_number,
  m.name AS machine_name,
  m.is_available AS machine_available,
  ts.trainer_id,
  ts.scheduled_start,
  ts.scheduled_end,
  ts.status,
  ts.session_type,
  ts.location,
  ts.notes,
  ts.created_at,
  ts.updated_at,
  -- Trainer info (may be NULL)
  COALESCE(up.first_name || ' ' || up.last_name, 'Unassigned') AS trainer_name,
  -- Current participants (always 0 or 1)
  COUNT(tsm.id) FILTER (WHERE tsm.booking_status = 'confirmed')::INTEGER AS current_participants,
  -- Participants array
  COALESCE(
    json_agg(
      json_build_object(
        'id', tsm.member_id,
        'name', mem.first_name || ' ' || mem.last_name,
        'email', mem.email
      )
    ) FILTER (WHERE tsm.booking_status = 'confirmed'),
    '[]'::json
  ) AS participants
FROM training_sessions ts
INNER JOIN machines m ON ts.machine_id = m.id  -- Always has machine
LEFT JOIN trainers t ON ts.trainer_id = t.id  -- Trainer may be NULL
LEFT JOIN user_profiles up ON t.id = up.id
LEFT JOIN training_session_members tsm ON ts.id = tsm.session_id
LEFT JOIN members mem ON tsm.member_id = mem.id
GROUP BY ts.id, m.id, m.machine_number, m.name, m.is_available, up.first_name, up.last_name;
```

### Remove Obsolete Functions

```sql
-- Drop trainer availability check function
DROP FUNCTION IF EXISTS check_trainer_availability(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

-- Drop any other availability-related functions
DROP FUNCTION IF EXISTS get_trainer_conflicts(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS validate_trainer_schedule(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
```

---

## 🧪 Testing Strategy

### Function Tests

```typescript
describe("create_training_session_with_members", () => {
  it("creates session with machine_id and nullable trainer", async () => {
    const { data } = await supabase.rpc(
      "create_training_session_with_members",
      {
        p_machine_id: machine1.id,
        p_trainer_id: null, // No trainer
        p_scheduled_start: "2025-01-15T10:00:00Z",
        p_scheduled_end: "2025-01-15T10:30:00Z",
        p_location: "Main Gym",
        p_member_ids: [member1.id],
        p_session_type: "standard",
      }
    );

    expect(data.success).toBe(true);
    expect(data.session_id).toBeDefined();
  });

  it("rejects session on unavailable machine", async () => {
    // Disable machine
    await supabase
      .from("machines")
      .update({ is_available: false })
      .eq("id", machine1.id);

    const { data } = await supabase.rpc(
      "create_training_session_with_members",
      {
        p_machine_id: machine1.id,
        p_member_ids: [member1.id],
        // ... other params
      }
    );

    expect(data.success).toBe(false);
    expect(data.error).toContain("not available");
  });

  it("rejects session with multiple members", async () => {
    const { data } = await supabase.rpc(
      "create_training_session_with_members",
      {
        p_machine_id: machine1.id,
        p_member_ids: [member1.id, member2.id], // 2 members
        // ... other params
      }
    );

    expect(data.success).toBe(false);
    expect(data.error).toContain("Only 1 member");
  });

  it("no longer checks trainer availability", async () => {
    // Create overlapping session with same trainer
    await createSession({
      trainer_id: trainer1.id,
      scheduled_start: "2025-01-15T10:00:00Z",
      scheduled_end: "2025-01-15T10:30:00Z",
    });

    // Should allow overlapping session (no availability check)
    const { data } = await supabase.rpc(
      "create_training_session_with_members",
      {
        p_machine_id: machine2.id, // Different machine
        p_trainer_id: trainer1.id, // Same trainer
        p_scheduled_start: "2025-01-15T10:00:00Z",
        p_scheduled_end: "2025-01-15T10:30:00Z",
        p_member_ids: [member2.id],
      }
    );

    expect(data.success).toBe(true); // Should succeed
  });
});
```

### View Tests

```typescript
describe("training_sessions_calendar view", () => {
  it("includes machine data", async () => {
    const { data } = await supabase
      .from("training_sessions_calendar")
      .select("*")
      .limit(1)
      .single();

    expect(data).toHaveProperty("machine_id");
    expect(data).toHaveProperty("machine_number");
    expect(data).toHaveProperty("machine_name");
    expect(data).toHaveProperty("machine_available");
  });

  it("handles null trainer_id", async () => {
    // Create session without trainer
    const session = await createSessionWithoutTrainer();

    const { data } = await supabase
      .from("training_sessions_calendar")
      .select("*")
      .eq("id", session.id)
      .single();

    expect(data.trainer_id).toBeNull();
    expect(data.trainer_name).toBe("Unassigned");
  });

  it("does not include max_participants", async () => {
    const { data } = await supabase
      .from("training_sessions_calendar")
      .select("*")
      .limit(1)
      .single();

    expect(data).not.toHaveProperty("max_participants");
  });
});
```

---

## 📊 Verification Checklist

- [ ] `create_training_session_with_members` function updated
- [ ] Function accepts machine_id parameter
- [ ] Function accepts nullable trainer_id
- [ ] Function rejects multiple members
- [ ] Function validates machine availability
- [ ] Trainer availability check removed
- [ ] `training_sessions_calendar` view updated
- [ ] View includes machine data
- [ ] View handles null trainer_id
- [ ] Obsolete functions dropped
- [ ] All function tests passing
- [ ] All view tests passing

---

## 🔗 Dependencies

### Depends On

- ✅ US-001: Machines Database Schema
- ✅ US-002: Training Sessions Schema Updates

### Required For

- ⏳ US-005: Hooks API Modifications (calls updated functions)
- ⏳ US-009: Session Booking Form Update (uses updated function signature)

---

## 🎯 Definition of Done

- [x] Functions updated with new parameters
- [x] Views updated to include machine data
- [x] Trainer availability logic removed
- [x] Obsolete functions dropped
- [x] All tests passing
- [x] Documentation updated
- [x] Code review approved

---

**Estimated Effort:** 2-3 hours
**Actual Effort:** TBD
**Completed:** Not yet
