# US-005: Conflict Detection

## 📋 User Story

**As a** gym administrator
**I want** to be warned about booking conflicts before changing opening hours
**So that** I don't accidentally schedule sessions outside operating hours

---

## 🎯 Business Value

**Value**: Prevents data loss and scheduling errors
**Impact**: High - Critical for data integrity
**Priority**: P0 (Must Have)
**Estimated Effort**: 4 hours

---

## 📐 Acceptance Criteria

### ✅ AC1: Conflict Detection on Save

**Given** I have edited opening hours and clicked "Save Changes"
**When** the system checks for conflicts
**Then** it should query all future training sessions from the effective date onwards

**And** it should identify sessions that:

- Start or end outside the new opening hours for that day
- Are scheduled on days that are now marked as closed

### ✅ AC2: No Conflicts - Success Path

**Given** no conflicts are found
**When** the conflict check completes
**Then** the settings should be saved immediately
**And** a success message should be displayed
**And** the settings page should refresh with new data

### ✅ AC3: Conflicts Found - Block Save

**Given** conflicts are detected
**When** the conflict check completes
**Then** the save operation should be blocked
**And** a conflict detection dialog should appear
**And** the dialog should display:

- Number of conflicting sessions
- Detailed list of conflicts (date, time, member, machine)
- Resolution instructions

### ✅ AC4: Conflict Dialog Display

**Given** the conflict dialog is open
**When** I view the conflict list
**Then** each conflict should show:

- Session date (e.g., "Monday, Jan 25, 2025")
- Session time (e.g., "21:30 - 22:00")
- Member name (or "Unbooked" if no member)
- Machine number
- Reason (e.g., "Outside new hours: 09:00 - 21:00")

### ✅ AC5: Conflict Dialog Actions

**Given** I am viewing the conflict dialog
**When** I want to resolve the conflicts
**Then** I should have these options:

- "Cancel Changes" button - Returns to editing without saving
- "View Sessions" button - Opens Training Sessions page with date filter applied
- Close icon (X) - Same as "Cancel Changes"

### ✅ AC6: Resolution Workflow

**Given** I clicked "View Sessions" in the conflict dialog
**When** I am redirected to the Training Sessions page
**Then** the page should be filtered to show:

- Only the dates with conflicts
- All sessions on those dates highlighted

**And When** I resolve all conflicts (cancel/reschedule sessions)
**And** I return to Settings and try saving again
**Then** the save should succeed with no conflicts

### ✅ AC7: Closed Day Conflicts

**Given** I have marked a day as "Closed"
**And** there are existing sessions scheduled on that day after the effective date
**When** the conflict check runs
**Then** those sessions should be flagged as conflicts
**And** the reason should be "Studio closed on this day"

---

## 🏗️ Technical Specification

### Conflict Detection Hook

```typescript
// src/features/settings/hooks/use-conflict-detection.ts

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { OpeningHoursWeek } from "../lib/types";
import { format, parse, getDay } from "date-fns";

export interface SessionConflict {
  session_id: string;
  date: string; // ISO date
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  member_name: string | null;
  machine_number: number;
  reason: string;
}

const DAY_INDEX_MAP: Record<number, keyof OpeningHoursWeek> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

export function useConflictDetection(
  newHours: OpeningHoursWeek,
  effectiveDate: Date,
  enabled: boolean = false
) {
  return useQuery({
    queryKey: ["conflict-detection", newHours, effectiveDate],
    queryFn: () => checkConflicts(newHours, effectiveDate),
    enabled,
  });
}

async function checkConflicts(
  newHours: OpeningHoursWeek,
  effectiveDate: Date
): Promise<SessionConflict[]> {
  // Fetch all training sessions from effective date onwards
  const { data: sessions, error } = await supabase
    .from("training_sessions")
    .select(
      `
      id,
      scheduled_start,
      scheduled_end,
      machine_id,
      machines (machine_number),
      training_session_members (
        member:members (first_name, last_name)
      )
    `
    )
    .gte("scheduled_start", effectiveDate.toISOString())
    .not("status", "eq", "cancelled");

  if (error) throw error;

  const conflicts: SessionConflict[] = [];

  sessions?.forEach((session) => {
    const sessionDate = new Date(session.scheduled_start);
    const dayOfWeek = getDay(sessionDate);
    const dayName = DAY_INDEX_MAP[dayOfWeek];
    const dayConfig = newHours[dayName];

    // Format session times
    const sessionStartTime = format(new Date(session.scheduled_start), "HH:mm");
    const sessionEndTime = format(new Date(session.scheduled_end), "HH:mm");

    // Check if day is closed
    if (!dayConfig.is_open) {
      conflicts.push({
        session_id: session.id,
        date: format(sessionDate, "yyyy-MM-dd"),
        start_time: session.scheduled_start,
        end_time: session.scheduled_end,
        member_name: getMemberName(session.training_session_members),
        machine_number: session.machines?.machine_number || 0,
        reason: "Studio closed on this day",
      });
      return;
    }

    // Check if session is outside new hours
    const openTime = dayConfig.open_time || "00:00";
    const closeTime = dayConfig.close_time || "23:59";

    if (sessionStartTime < openTime || sessionEndTime > closeTime) {
      conflicts.push({
        session_id: session.id,
        date: format(sessionDate, "yyyy-MM-dd"),
        start_time: session.scheduled_start,
        end_time: session.scheduled_end,
        member_name: getMemberName(session.training_session_members),
        machine_number: session.machines?.machine_number || 0,
        reason: `Outside new hours: ${openTime} - ${closeTime}`,
      });
    }
  });

  return conflicts;
}

function getMemberName(members: any[]): string | null {
  if (!members || members.length === 0) return null;
  const member = members[0]?.member;
  if (!member) return null;
  return `${member.first_name} ${member.last_name}`;
}
```

### Conflict Detection Dialog

```typescript
// src/features/settings/components/ConflictDetectionDialog.tsx

'use client';

import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { SessionConflict } from '../hooks/use-conflict-detection';
import { useRouter } from 'next/navigation';

interface ConflictDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: SessionConflict[];
}

export const ConflictDetectionDialog = memo(function ConflictDetectionDialog({
  open,
  onOpenChange,
  conflicts,
}: ConflictDetectionDialogProps) {
  const router = useRouter();

  const handleViewSessions = () => {
    // Get unique dates with conflicts
    const conflictDates = [...new Set(conflicts.map((c) => c.date))];

    // Navigate to training sessions with date filter
    const dateParam = conflictDates[0]; // Start with first conflict date
    router.push(`/training-sessions?date=${dateParam}&highlight=conflicts`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Booking Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            Found {conflicts.length} session{conflicts.length !== 1 ? 's' : ''} that
            conflict with the new opening hours. These must be resolved before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              To proceed, you must cancel or reschedule the conflicting sessions listed below.
            </AlertDescription>
          </Alert>

          {/* Conflicts Table */}
          <div className="max-h-[400px] overflow-y-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b bg-muted">
                <tr>
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Time</th>
                  <th className="p-3 text-left font-medium">Member</th>
                  <th className="p-3 text-center font-medium">Machine</th>
                  <th className="p-3 text-left font-medium">Issue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {conflicts.map((conflict) => {
                  const date = parseISO(conflict.date);
                  const startTime = format(parseISO(conflict.start_time), 'HH:mm');
                  const endTime = format(parseISO(conflict.end_time), 'HH:mm');

                  return (
                    <tr key={conflict.session_id} className="hover:bg-muted/50">
                      <td className="p-3 font-medium">
                        {format(date, 'EEE, MMM d, yyyy')}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {startTime} - {endTime}
                      </td>
                      <td className="p-3">
                        {conflict.member_name || (
                          <span className="text-muted-foreground">Unbooked</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {conflict.machine_number}
                      </td>
                      <td className="p-3 text-xs text-destructive">
                        {conflict.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel Changes
          </Button>
          <Button
            onClick={handleViewSessions}
            className="w-full sm:w-auto"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View & Resolve Sessions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
```

### Updated OpeningHoursTab with Conflict Detection

```typescript
// src/features/settings/components/OpeningHoursTab.tsx (updated)

const handleSaveClick = useCallback(() => {
  // Trigger conflict detection
  refetch(); // Triggers useConflictDetection query
}, [refetch]);

const {
  data: conflicts,
  isLoading: checkingConflicts,
  refetch,
} = useConflictDetection(
  localHours,
  effectiveDate,
  false // Manually triggered
);

useEffect(() => {
  if (conflicts !== undefined && !checkingConflicts) {
    if (conflicts.length === 0) {
      // No conflicts - proceed with save
      handleSave();
    } else {
      // Conflicts found - show dialog
      setShowConflictDialog(true);
    }
  }
}, [conflicts, checkingConflicts]);
```

---

## 🔧 Implementation Steps

1. **Create Conflict Detection Hook**
   - Create `hooks/use-conflict-detection.ts`
   - Implement query logic to find conflicting sessions
   - Add helper functions for date/time comparison

2. **Create Conflict Dialog**
   - Create `ConflictDetectionDialog.tsx`
   - Display conflicts table
   - Add navigation to Training Sessions

3. **Update OpeningHoursTab**
   - Integrate conflict detection before save
   - Show conflict dialog when conflicts found
   - Allow save only when no conflicts

4. **Add Training Sessions Filter** (if not exists)
   - Support date query parameter
   - Support highlight query parameter

5. **Write Tests**
   - Test conflict detection with various scenarios
   - Test dialog display
   - Test navigation to Training Sessions

---

## 🧪 Testing Checklist

- [ ] Conflict detection finds sessions outside new hours
- [ ] Conflict detection finds sessions on closed days
- [ ] No conflicts found - save proceeds normally
- [ ] Conflicts found - save is blocked
- [ ] Conflict dialog displays all conflicts correctly
- [ ] "Cancel Changes" closes dialog without saving
- [ ] "View Sessions" navigates with correct filters
- [ ] Resolving conflicts allows save to succeed
- [ ] Edge case: Session spans midnight
- [ ] Edge case: Effective date is today (checks only future sessions)
- [ ] All tests passing

---

## 📊 Definition of Done

- [ ] Conflict detection hook created and tested
- [ ] Conflict detection dialog created
- [ ] Integration with save flow complete
- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Edge cases handled
- [ ] STATUS.md updated

---

## 🔗 Related User Stories

- **Depends On**: US-004 (Effective Date Handling)
- **Blocks**: US-006 (Session Integration)

---

## 📚 References

- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - Phase 5
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog)
- [Supabase Queries](https://supabase.com/docs/reference/javascript/select)

---

**Story ID**: US-005
**Created**: 2025-10-16
**Status**: Not Started
**Depends On**: US-004
