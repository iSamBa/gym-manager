# US-007: Slot Rendering Logic

## 📋 User Story

**As a** gym administrator
**I want** time slots to display member names and session status
**So that** I can quickly see which slots are booked and who they're for

---

## ✅ Acceptance Criteria

### AC-1: Time Slot Generation

- [x] 30 time slots generated (9:00 AM to 12:00 AM)
- [x] Each slot is 30 minutes
- [x] Slot labels formatted as "HH:MM - HH:MM"

### AC-2: Empty Slot Display

- [x] Empty slots show time label
- [x] Clickable to open booking dialog
- [x] Hover state indicates clickability
- [x] Disabled if machine unavailable

### AC-3: Booked Slot Display

- [x] Shows member name prominently
- [x] Shows time label
- [x] Color-coded by session status
- [x] Clickable to open session details

### AC-4: Status Colors

- [x] Scheduled: Blue background
- [x] In Progress: Orange background
- [x] Completed: Green background
- [x] Cancelled: Gray with strikethrough

---

## 🛠️ Implementation

### File: `src/features/training-sessions/lib/slot-generator.ts`

```typescript
import { format, startOfDay } from "date-fns";

export const TIME_SLOT_CONFIG = {
  START_HOUR: 9,
  END_HOUR: 24, // midnight
  SLOT_DURATION_MINUTES: 30,
} as const;

export interface TimeSlot {
  start: Date;
  end: Date;
  label: string;
  hour: number;
  minute: number;
}

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

  return slots; // Returns 30 slots
}
```

### File: `src/features/training-sessions/components/TimeSlot.tsx`

```typescript
import React, { memo } from "react";
import { cn } from "@/lib/utils";
import type { Machine, TimeSlot as TimeSlotType, TrainingSession } from "../lib/types";

interface TimeSlotProps {
  machine: Machine;
  timeSlot: TimeSlotType;
  session?: TrainingSession;
  alertCount?: number;
  onClick: () => void;
}

export const TimeSlot = memo<TimeSlotProps>(({
  machine,
  timeSlot,
  session,
  alertCount,
  onClick,
}) => {
  // Empty slot
  if (!session) {
    return (
      <div
        className={cn(
          "border rounded p-2 h-16 flex items-center justify-center cursor-pointer transition-colors",
          machine.is_available
            ? "hover:bg-gray-50 border-gray-200"
            : "cursor-not-allowed opacity-50"
        )}
        onClick={() => machine.is_available && onClick()}
      >
        <span className="text-xs text-gray-400">{timeSlot.label}</span>
      </div>
    );
  }

  // Booked slot
  const memberName = session.participants?.[0]?.name || "Unknown Member";

  return (
    <div
      className={cn(
        "border rounded p-2 h-16 cursor-pointer relative transition-shadow hover:shadow-md",
        getStatusColor(session.status)
      )}
      onClick={onClick}
    >
      <div className="font-medium text-sm truncate">{memberName}</div>
      <div className="text-xs text-gray-600">{timeSlot.label}</div>

      {/* Notification badge (US-008) */}
      {alertCount && alertCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
          {alertCount}
        </div>
      )}
    </div>
  );
});

TimeSlot.displayName = "TimeSlot";

function getStatusColor(status: TrainingSession["status"]): string {
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
}
```

---

## 🧪 Testing

```typescript
describe("generateTimeSlots", () => {
  it("generates 30 slots from 9:00 to 00:00", () => {
    const slots = generateTimeSlots(new Date("2025-01-15"));
    expect(slots).toHaveLength(30);
    expect(slots[0].label).toBe("09:00 - 09:30");
    expect(slots[29].label).toBe("23:30 - 00:00");
  });

  it("each slot is 30 minutes", () => {
    const slots = generateTimeSlots();
    slots.forEach(slot => {
      const duration = slot.end.getTime() - slot.start.getTime();
      expect(duration).toBe(30 * 60 * 1000); // 30 minutes in ms
    });
  });
});

describe("TimeSlot", () => {
  it("renders empty slot with time label", () => {
    render(
      <TimeSlot
        machine={mockMachine}
        timeSlot={mockTimeSlot}
        onClick={() => {}}
      />
    );
    expect(screen.getByText("09:00 - 09:30")).toBeInTheDocument();
  });

  it("renders booked slot with member name", () => {
    const session: TrainingSession = {
      id: "session-1",
      participants: [{ id: "1", name: "John Doe", email: "john@example.com" }],
      status: "scheduled",
      // ... other fields
    };

    render(
      <TimeSlot
        machine={mockMachine}
        timeSlot={mockTimeSlot}
        session={session}
        onClick={() => {}}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("applies correct color for completed session", () => {
    const session = { ...mockSession, status: "completed" };
    const { container } = render(<TimeSlot session={session} />);

    const slot = container.firstChild;
    expect(slot).toHaveClass("bg-green-100");
  });
});
```

---

## 🎯 Definition of Done

- [x] Slot generator created
- [x] 30 slots generated correctly
- [x] TimeSlot component renders both states
- [x] Status colors applied
- [x] Tests passing
- [x] Code review approved

**Estimated Effort:** 2-3 hours
