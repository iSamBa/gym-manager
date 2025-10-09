# US-010: Machine Availability Admin Controls

## 📋 User Story

**As a** gym administrator
**I want** controls to enable/disable machines
**So that** I can prevent bookings when machines are under maintenance

---

## ✅ Acceptance Criteria

### AC-1: Admin Toggle Control

- [x] Toggle switch in machine column header
- [x] Only visible to admin role users
- [x] Instantly updates machine availability
- [x] Optimistic UI update

### AC-2: Visual Feedback

- [x] Disabled machines have gray overlay
- [x] "Unavailable" badge displayed
- [x] Slots in disabled column not clickable
- [x] Tooltip explains why machine is disabled

### AC-3: Booking Prevention

- [x] Cannot create new sessions on disabled machine
- [x] Form disables disabled machines in dropdown
- [x] API validates machine availability
- [x] Error message if attempting to book unavailable machine

### AC-4: Existing Sessions Preserved

- [x] Disabling machine doesn't cancel existing sessions
- [x] Existing sessions remain visible and editable
- [x] Only new bookings are prevented

---

## 🛠️ Implementation

### Component: `MachineAvailabilityToggle`

```typescript
// src/features/training-sessions/components/MachineAvailabilityToggle.tsx

import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateMachine } from "../hooks/use-machines";
import { toast } from "sonner";
import type { Machine } from "../lib/types";

interface MachineAvailabilityToggleProps {
  machine: Machine;
}

export const MachineAvailabilityToggle: React.FC<MachineAvailabilityToggleProps> = ({
  machine,
}) => {
  const { user } = useAuth();
  const { mutateAsync: updateMachine, isPending } = useUpdateMachine();

  const isAdmin = user?.role === "admin";

  if (!isAdmin) return null; // Only show to admins

  const handleToggle = async () => {
    try {
      await updateMachine({
        id: machine.id,
        data: {
          is_available: !machine.is_available,
        },
      });

      toast.success(
        machine.is_available
          ? `${machine.name} disabled for bookings`
          : `${machine.name} enabled for bookings`
      );
    } catch (error) {
      toast.error("Failed to update machine availability");
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <Switch
            checked={machine.is_available}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
          <Label className="text-xs">
            {machine.is_available ? "Available" : "Disabled"}
          </Label>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {machine.is_available
          ? "Click to disable bookings (maintenance mode)"
          : "Click to enable bookings"}
      </TooltipContent>
    </Tooltip>
  );
};
```

### Update MachineColumn Header

```typescript
// Update MachineColumn to include toggle

import { MachineAvailabilityToggle } from "./MachineAvailabilityToggle";

export const MachineColumn = memo<MachineColumnProps>(({ machine, ... }) => {
  return (
    <Card className={cn(!machine.is_available && "opacity-50 bg-gray-50")}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{machine.name}</span>
          <div className="flex items-center gap-2">
            {!machine.is_available && (
              <Badge variant="secondary">Unavailable</Badge>
            )}
            <MachineAvailabilityToggle machine={machine} />
          </div>
        </CardTitle>
      </CardHeader>
      {/* ... rest of component */}
    </Card>
  );
});
```

### API Validation

```sql
-- Update create_training_session_with_members function
CREATE OR REPLACE FUNCTION create_training_session_with_members(...)
RETURNS JSON AS $$
BEGIN
  -- Validation: Ensure machine is available
  IF NOT EXISTS (
    SELECT 1 FROM machines
    WHERE id = p_machine_id
    AND is_available = true
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'This machine is currently unavailable for bookings'
    );
  END IF;

  -- ... rest of function
END;
$$ LANGUAGE plpgsql;
```

---

## 🧪 Testing

```typescript
describe("MachineAvailabilityToggle", () => {
  it("is visible only to admin users", () => {
    // Non-admin user
    const { rerender } = render(
      <MachineAvailabilityToggle machine={machine1} />
    );
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();

    // Admin user
    mockAuth({ role: "admin" });
    rerender(<MachineAvailabilityToggle machine={machine1} />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("toggles machine availability", async () => {
    mockAuth({ role: "admin" });
    const { user } = renderWithUser(
      <MachineAvailabilityToggle machine={machine1} />
    );

    const toggle = screen.getByRole("switch");
    expect(toggle).toBeChecked(); // Initially available

    await user.click(toggle);

    await waitFor(() => {
      expect(updateMachineMock).toHaveBeenCalledWith({
        id: machine1.id,
        data: { is_available: false },
      });
    });
  });

  it("prevents booking on disabled machine", async () => {
    // Disable machine
    await updateMachine(machine1.id, { is_available: false });

    // Attempt to create session
    const result = await createSession({
      machine_id: machine1.id,
      member_id: member1.id,
      // ... other params
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("unavailable");
  });

  it("preserves existing sessions when disabling machine", async () => {
    // Create session
    const session = await createSession({
      machine_id: machine1.id,
      member_id: member1.id,
    });

    // Disable machine
    await updateMachine(machine1.id, { is_available: false });

    // Verify session still exists
    const { data } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("id", session.id)
      .single();

    expect(data).toBeDefined();
    expect(data.status).not.toBe("cancelled");
  });
});
```

---

## 🎯 Definition of Done

- [x] Toggle component created
- [x] Only visible to admins
- [x] Updates machine availability
- [x] Visual feedback working
- [x] Booking prevention enforced
- [x] Existing sessions preserved
- [x] Tests passing
- [x] Code review approved

**Estimated Effort:** 2-3 hours
