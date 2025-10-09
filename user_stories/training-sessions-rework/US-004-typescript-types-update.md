# US-004: TypeScript Types Update

## 📋 User Story

**As a** developer
**I want** TypeScript interfaces updated to match the new database schema
**So that** the codebase has type safety for machine-based sessions

---

## ✅ Acceptance Criteria

### AC-1: Update TrainingSession Interface

- [x] Add `machine_id: string` property
- [x] Add optional `machine_number?: 1 | 2 | 3` from view
- [x] Add optional `machine_name?: string` from view
- [x] Change `trainer_id: string | null` (nullable)
- [x] Remove `max_participants` property
- [x] `current_participants` remains (always 0 or 1)

### AC-2: Create Machine Interface

- [x] New `Machine` interface created
- [x] Properties: id, machine_number, name, is_available, timestamps

### AC-3: Update CreateSessionData

- [x] Add `machine_id: string` (required)
- [x] Change `trainer_id?: string` (optional)
- [x] Remove `max_participants`
- [x] Change `member_ids` to `member_id` (single string)

### AC-4: Update SessionFilters

- [x] Add `machine_id?: string` filter option

---

## 🛠️ Implementation

### File: `src/features/training-sessions/lib/types.ts`

```typescript
// Machine interface (NEW)
export interface Machine {
  id: string;
  machine_number: 1 | 2 | 3;
  name: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// Updated TrainingSession interface
export interface TrainingSession {
  id: string;
  machine_id: string; // NEW: Required
  machine_number?: 1 | 2 | 3; // NEW: From view join
  machine_name?: string; // NEW: From view join
  trainer_id: string | null; // MODIFIED: Now nullable
  scheduled_start: string;
  scheduled_end: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  session_type?: "trail" | "standard";
  // REMOVED: max_participants
  current_participants: number; // 0 or 1
  location: string | null;
  notes: string | null;
  trainer_name?: string;
  participants?: SessionParticipant[];
  created_at?: string;
  updated_at?: string;
}

// Updated CreateSessionData
export interface CreateSessionData {
  machine_id: string; // NEW: Required
  trainer_id?: string | null; // MODIFIED: Optional
  scheduled_start: string;
  scheduled_end: string;
  location: string;
  session_type: "trail" | "standard";
  member_id: string; // MODIFIED: Single member, not array
  notes?: string;
}

// Updated UpdateSessionData
export interface UpdateSessionData {
  machine_id?: string;
  trainer_id?: string | null; // Can clear trainer
  scheduled_start?: string;
  scheduled_end?: string;
  location?: string;
  session_type?: "trail" | "standard";
  notes?: string;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  member_id?: string; // Single member
}

// Updated SessionFilters
export interface SessionFilters {
  machine_id?: string; // NEW: Filter by machine
  trainer_id?: string;
  member_id?: string;
  status?: "scheduled" | "completed" | "cancelled" | "all";
  date_range?: {
    start: Date;
    end: Date;
  };
}
```

---

## 🧪 Testing

```typescript
describe("TypeScript Types", () => {
  it("Machine interface has correct shape", () => {
    const machine: Machine = {
      id: "uuid",
      machine_number: 1,
      name: "Machine 1",
      is_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(machine).toBeDefined();
  });

  it("TrainingSession allows null trainer_id", () => {
    const session: TrainingSession = {
      id: "uuid",
      machine_id: "machine-uuid",
      trainer_id: null, // Should compile
      scheduled_start: new Date().toISOString(),
      scheduled_end: new Date().toISOString(),
      status: "scheduled",
      current_participants: 0,
      location: null,
      notes: null,
    };
    expect(session.trainer_id).toBeNull();
  });

  it("CreateSessionData requires machine_id", () => {
    const data: CreateSessionData = {
      machine_id: "machine-uuid", // Required
      // trainer_id optional
      scheduled_start: new Date().toISOString(),
      scheduled_end: new Date().toISOString(),
      location: "Main Gym",
      session_type: "standard",
      member_id: "member-uuid",
    };
    expect(data.machine_id).toBeDefined();
  });
});
```

---

## 🎯 Definition of Done

- [x] All interfaces updated
- [x] No TypeScript errors
- [x] Type tests passing
- [x] Code review approved

**Estimated Effort:** 1 hour
