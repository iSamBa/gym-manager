# Training Sessions Rework - Technical Architecture

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Training Sessions UI                     │
│  ┌────────────┬────────────┬────────────┐                   │
│  │ Machine 1  │ Machine 2  │ Machine 3  │                   │
│  │            │            │            │                   │
│  │ 09:00-09:30│ 09:00-09:30│ 09:00-09:30│                   │
│  │ 09:30-10:00│ 09:30-10:00│ 09:30-10:00│                   │
│  │ 10:00-10:30│ 10:00-10:30│ 10:00-10:30│                   │
│  │     ...    │     ...    │     ...    │                   │
│  │ 23:30-00:00│ 23:30-00:00│ 23:30-00:00│                   │
│  └────────────┴────────────┴────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   React Query + Hooks Layer                  │
│  • useTrainingSessions(filter by machine_id, date_range)    │
│  • useCreateSession(machine_id, member_id, time_slot)        │
│  • useMachines() - fetch all machines with availability      │
│  • useActiveCommentAlerts(member_id) - due date badges       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Layer                          │
│  Tables:                                                     │
│  • machines (id, machine_number, is_available)               │
│  • training_sessions (id, machine_id, member_id, trainer_id) │
│  • training_session_members (session_id, member_id)          │
│  • member_comments (id, member_id, due_date)                 │
│                                                              │
│  Functions:                                                  │
│  • create_training_session_with_members(...)                 │
│  • get_sessions_by_machine(machine_id, date)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### New Table: `machines`

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

-- Insert default machines
INSERT INTO machines (machine_number, name, is_available) VALUES
  (1, 'Machine 1', true),
  (2, 'Machine 2', true),
  (3, 'Machine 3', true);

-- RLS Policies
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view machines"
  ON machines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify machines"
  ON machines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

### Modified Table: `training_sessions`

**Changes:**

1. ❌ **REMOVE** `max_participants INTEGER` column
2. ✏️ **MODIFY** `trainer_id UUID` → `trainer_id UUID NULLABLE`
3. ➕ **ADD** `machine_id UUID REFERENCES machines(id)`

```sql
-- Migration
ALTER TABLE training_sessions
  DROP COLUMN max_participants,
  ALTER COLUMN trainer_id DROP NOT NULL,
  ADD COLUMN machine_id UUID REFERENCES machines(id);

-- Set default machine for existing sessions
UPDATE training_sessions
SET machine_id = (SELECT id FROM machines WHERE machine_number = 1)
WHERE machine_id IS NULL;

-- Make machine_id required going forward
ALTER TABLE training_sessions
  ALTER COLUMN machine_id SET NOT NULL;
```

### Updated View: `training_sessions_calendar`

```sql
CREATE OR REPLACE VIEW training_sessions_calendar AS
SELECT
  ts.id,
  ts.machine_id,
  m.machine_number,
  m.name AS machine_name,
  ts.trainer_id,
  ts.scheduled_start,
  ts.scheduled_end,
  ts.status,
  ts.session_type,
  ts.location,
  ts.notes,
  ts.created_at,
  ts.updated_at,
  -- Trainer info (may be null)
  up.first_name || ' ' || up.last_name AS trainer_name,
  -- Current participants (always 0 or 1)
  COUNT(tsm.id) FILTER (WHERE tsm.booking_status = 'confirmed') AS current_participants,
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
LEFT JOIN machines m ON ts.machine_id = m.id
LEFT JOIN trainers t ON ts.trainer_id = t.id
LEFT JOIN user_profiles up ON t.id = up.id
LEFT JOIN training_session_members tsm ON ts.id = tsm.session_id
LEFT JOIN members mem ON tsm.member_id = mem.id
GROUP BY ts.id, m.id, m.machine_number, m.name, up.first_name, up.last_name;
```

---

## 🔧 TypeScript Type Definitions

### Updated Types

```typescript
// src/features/training-sessions/lib/types.ts

export interface Machine {
  id: string;
  machine_number: 1 | 2 | 3;
  name: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  machine_id: string;
  machine_number?: 1 | 2 | 3; // From view join
  machine_name?: string; // From view join
  trainer_id: string | null; // NULLABLE - optional until completion
  scheduled_start: string;
  scheduled_end: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  session_type?: "trail" | "standard";
  // REMOVED: max_participants
  current_participants: number; // Always 0 or 1

  notes: string | null;
  trainer_name?: string;
  participants?: SessionParticipant[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateSessionData {
  machine_id: string; // REQUIRED
  trainer_id?: string; // OPTIONAL - can be assigned later
  scheduled_start: string;
  scheduled_end: string;

  session_type: "trail" | "standard";
  member_id: string; // Single member, not array
  notes?: string;
}

export interface UpdateSessionData {
  machine_id?: string;
  trainer_id?: string | null; // Can assign or clear trainer
  scheduled_start?: string;
  scheduled_end?: string;

  session_type?: "trail" | "standard";
  notes?: string;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  member_id?: string; // Single member update
}

// New filter type
export interface SessionFilters {
  machine_id?: string; // NEW: Filter by specific machine
  trainer_id?: string;
  member_id?: string;
  status?: "scheduled" | "completed" | "cancelled" | "all";
  date_range?: {
    start: Date;
    end: Date;
  };
}

// Time slot generation
export interface TimeSlot {
  start: Date;
  end: Date;
  label: string; // "09:00 - 09:30"
  hour: number; // 9
  minute: number; // 0
}

// Notification badge data
export interface SessionAlert {
  session_id: string;
  member_id: string;
  alert_count: number; // Number of due-date comments
}
```

---

## ⚛️ React Component Structure

### Component Hierarchy

```
TrainingSessionsView
├── MachineSlotGrid
│   ├── MachineColumn (x3)
│   │   ├── MachineHeader
│   │   │   └── MachineAvailabilityToggle (admin only)
│   │   └── TimeSlot (x30)
│   │       ├── EmptySlot (clickable for booking)
│   │       └── BookedSlot
│   │           ├── MemberName
│   │           ├── SessionStatus (colored indicator)
│   │           └── SessionNotificationBadge (conditional)
│   └── TimeAxisLabels (9:00, 9:30, ..., 00:00)
└── SessionBookingDialog
    ├── MachineSelect
    ├── MemberSelect (single, not multi)
    ├── TimeSlotPicker
    └── TrainerSelect (optional)
```

### Key Components

#### `MachineSlotGrid.tsx`

```typescript
interface MachineSlotGridProps {
  selectedDate: Date;
  onSlotClick: (machine_id: string, timeSlot: TimeSlot) => void;
  onSessionClick: (session: TrainingSession) => void;
}

const MachineSlotGrid: React.FC<MachineSlotGridProps> = ({
  selectedDate,
  onSlotClick,
  onSessionClick,
}) => {
  const { data: machines } = useMachines();
  const { data: sessions } = useTrainingSessions({
    date_range: {
      start: startOfDay(selectedDate),
      end: endOfDay(selectedDate),
    },
  });

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {machines?.map((machine) => (
        <MachineColumn
          key={machine.id}
          machine={machine}
          timeSlots={timeSlots}
          sessions={sessions?.filter((s) => s.machine_id === machine.id)}
          onSlotClick={onSlotClick}
          onSessionClick={onSessionClick}
        />
      ))}
    </div>
  );
};
```

#### `TimeSlot.tsx`

```typescript
interface TimeSlotProps {
  machine: Machine;
  timeSlot: TimeSlot;
  session?: TrainingSession;
  alertCount?: number;
  onClick: () => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({
  machine,
  timeSlot,
  session,
  alertCount,
  onClick,
}) => {
  if (!session) {
    return (
      <div
        className="border rounded p-2 cursor-pointer hover:bg-gray-50"
        onClick={onClick}
      >
        <span className="text-xs text-gray-400">{timeSlot.label}</span>
      </div>
    );
  }

  const memberName = session.participants?.[0]?.name || "Unknown Member";

  return (
    <div
      className={cn(
        "border rounded p-2 cursor-pointer relative",
        getStatusColor(session.status)
      )}
      onClick={onClick}
    >
      <div className="font-medium text-sm">{memberName}</div>
      <div className="text-xs text-gray-500">{timeSlot.label}</div>
      {alertCount && alertCount > 0 && (
        <SessionNotificationBadge count={alertCount} />
      )}
    </div>
  );
};
```

#### `SessionNotificationBadge.tsx`

```typescript
interface SessionNotificationBadgeProps {
  count: number;
}

const SessionNotificationBadge: React.FC<SessionNotificationBadgeProps> = ({
  count,
}) => {
  return (
    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
      {count}
    </div>
  );
};
```

---

## 🔄 Data Flow

### 1. Loading Sessions for a Day

```typescript
// User selects date (default: today)
const [selectedDate, setSelectedDate] = useState(new Date());

// Fetch sessions for selected date
const { data: sessions } = useTrainingSessions({
  date_range: {
    start: startOfDay(selectedDate),
    end: endOfDay(selectedDate),
  },
});

// Fetch machines
const { data: machines } = useMachines();

// For each session, check member alerts
const { data: alerts } = useActiveCommentAlerts(session.participants[0]?.id);
```

### 2. Creating a New Session

```typescript
// User clicks empty slot → opens dialog
const handleSlotClick = (machine_id: string, timeSlot: TimeSlot) => {
  setBookingDialog({
    open: true,
    machine_id,
    scheduled_start: timeSlot.start.toISOString(),
    scheduled_end: timeSlot.end.toISOString(),
  });
};

// User fills form and submits
const { mutateAsync: createSession } = useCreateTrainingSession();
await createSession({
  machine_id: bookingData.machine_id,
  member_id: selectedMember.id, // Single member
  trainer_id: selectedTrainer?.id || null, // Optional
  scheduled_start: bookingData.scheduled_start,
  scheduled_end: bookingData.scheduled_end,
  location: "Main Gym",
  session_type: "standard",
});
```

### 3. Completing a Session (Assigning Trainer)

```typescript
// Admin marks session as complete
const { mutateAsync: updateSession } = useUpdateTrainingSession();
await updateSession({
  id: session.id,
  data: {
    status: "completed",
    trainer_id: selectedTrainer.id, // NOW required
  },
});

// Backend decrements member's remaining_sessions
// Subscription query cache invalidated
```

### 4. Toggling Machine Availability

```typescript
// Admin clicks toggle (requires admin role)
const { mutateAsync: updateMachine } = useUpdateMachine();
await updateMachine({
  id: machine.id,
  data: {
    is_available: !machine.is_available,
  },
});

// UI grays out unavailable machine column
// Can't book new sessions on unavailable machines
```

---

## 📅 Time Slot Generation Logic

### Implementation

```typescript
// src/features/training-sessions/lib/slot-generator.ts

export const TIME_SLOT_CONFIG = {
  START_HOUR: 9, // 9:00 AM
  END_HOUR: 24, // 00:00 (midnight next day)
  SLOT_DURATION_MINUTES: 30,
} as const;

export function generateTimeSlots(date: Date = new Date()): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const baseDate = startOfDay(date);

  for (
    let hour = TIME_SLOT_CONFIG.START_HOUR;
    hour < TIME_SLOT_CONFIG.END_HOUR;
    hour++
  ) {
    for (
      let minute = 0;
      minute < 60;
      minute += TIME_SLOT_CONFIG.SLOT_DURATION_MINUTES
    ) {
      const start = new Date(baseDate);
      start.setHours(hour, minute, 0, 0);

      const end = new Date(start);
      end.setMinutes(
        start.getMinutes() + TIME_SLOT_CONFIG.SLOT_DURATION_MINUTES
      );

      slots.push({
        start,
        end,
        label: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
        hour,
        minute,
      });
    }
  }

  return slots; // 30 slots total
}
```

### Verification

```typescript
const slots = generateTimeSlots(new Date("2025-01-15"));
console.log(slots.length); // 30
console.log(slots[0].label); // "09:00 - 09:30"
console.log(slots[29].label); // "23:30 - 00:00"
```

---

## 🔔 Due-Date Notification Logic

### Query Strategy

```typescript
// For each session, fetch member alerts
const { data: alerts } = useQuery({
  queryKey: ["session-alerts", session.id],
  queryFn: async () => {
    const member_id = session.participants?.[0]?.id;
    if (!member_id) return null;

    // Fetch comments with due_date >= session.scheduled_start
    const { data } = await supabase
      .from("member_comments")
      .select("id, due_date")
      .eq("member_id", member_id)
      .not("due_date", "is", null)
      .gte("due_date", session.scheduled_start);

    return {
      session_id: session.id,
      member_id,
      alert_count: data?.length || 0,
    };
  },
  enabled: !!session.participants?.[0]?.id,
});
```

### Display Logic

```typescript
// Only show badge if:
// 1. Session has a member
// 2. Member has due_date comments
// 3. due_date >= session date

{alertCount > 0 && <SessionNotificationBadge count={alertCount} />}
```

---

## 🎨 Styling Guidelines

### Machine Column States

```typescript
// Available machine
className = "border-2 border-green-500 bg-white";

// Unavailable machine (admin toggled off)
className = "border-2 border-gray-300 bg-gray-100 opacity-50";
```

### Session Status Colors

```typescript
const getStatusColor = (status: TrainingSession["status"]) => {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 border-blue-300 text-blue-800";
    case "in_progress":
      return "bg-orange-100 border-orange-300 text-orange-800";
    case "completed":
      return "bg-green-100 border-green-300 text-green-800";
    case "cancelled":
      return "bg-gray-100 border-gray-300 text-gray-500 line-through";
  }
};
```

---

## 🔒 RLS Policies

### Machines Table

```sql
-- SELECT: All authenticated users
CREATE POLICY "select_machines"
ON machines FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Admin only
CREATE POLICY "admin_modify_machines"
ON machines FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

### Training Sessions (Updated)

```sql
-- No changes to existing RLS policies
-- Sessions remain admin/trainer accessible
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// slot-generator.test.ts
describe("generateTimeSlots", () => {
  it("generates 30 slots from 9:00 to 00:00", () => {
    const slots = generateTimeSlots();
    expect(slots).toHaveLength(30);
    expect(slots[0].label).toBe("09:00 - 09:30");
    expect(slots[29].label).toBe("23:30 - 00:00");
  });
});

// MachineSlotGrid.test.tsx
describe("MachineSlotGrid", () => {
  it("renders 3 machine columns", () => {
    render(<MachineSlotGrid selectedDate={new Date()} />);
    expect(screen.getAllByTestId("machine-column")).toHaveLength(3);
  });

  it("disables unavailable machines", () => {
    const machines = [
      { id: "1", machine_number: 1, is_available: false },
    ];
    render(<MachineSlotGrid machines={machines} />);
    expect(screen.getByTestId("machine-1")).toHaveClass("opacity-50");
  });
});
```

### Integration Tests

```typescript
// session-booking.test.ts
describe("Session Booking Flow", () => {
  it("creates session with member and optional trainer", async () => {
    // Click empty slot
    // Fill booking form
    // Submit without trainer
    // Verify session created with trainer_id = null
  });

  it("shows notification badge for due-date alerts", async () => {
    // Create session for member with due_date comment
    // Verify badge appears with correct count
  });
});
```

---

## 📈 Performance Optimizations

### 1. Memoization

```typescript
// Generate slots once per date
const timeSlots = useMemo(
  () => generateTimeSlots(selectedDate),
  [selectedDate]
);

// Filter sessions by machine
const machineSessions = useMemo(
  () => sessions?.filter((s) => s.machine_id === machine.id),
  [sessions, machine.id]
);
```

### 2. Query Optimization

```typescript
// Fetch only sessions for current day
queryKey: ["training-sessions", { date: selectedDate.toDateString() }];

// Batch alert queries
const memberIds = sessions.map((s) => s.participants[0]?.id).filter(Boolean);
// Use single query with IN clause
```

### 3. Component Optimization

```typescript
// Memo slot components to prevent re-renders
const TimeSlot = memo(TimeSlotComponent);
const MachineColumn = memo(MachineColumnComponent);
```

---

## 🚀 Deployment Considerations

### Database Migration Checklist

- [ ] Backup existing `training_sessions` table
- [ ] Create `machines` table
- [ ] Insert 3 default machines
- [ ] Add `machine_id` column to `training_sessions`
- [ ] Assign default machine to existing sessions
- [ ] Remove `max_participants` column
- [ ] Make `trainer_id` nullable
- [ ] Update views and functions
- [ ] Test rollback scenario

### Feature Flags (Optional)

```typescript
// Gradual rollout option
const USE_MACHINE_GRID = process.env.NEXT_PUBLIC_ENABLE_MACHINE_GRID === "true";

return USE_MACHINE_GRID ? <MachineSlotGrid /> : <TrainingSessionCalendar />;
```

---

This architecture provides a solid foundation for the Training Sessions Rework feature with clear separation of concerns, type safety, and performance optimizations.
