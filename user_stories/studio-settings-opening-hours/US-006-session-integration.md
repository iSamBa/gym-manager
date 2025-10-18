# US-006: Session Integration

## 📋 User Story

**As a** gym system
**I want** to generate time slots dynamically based on opening hours settings
**So that** available booking times automatically reflect the configured schedule

---

## 🎯 Business Value

**Value**: Completes the feature by connecting settings to session booking
**Impact**: High - Makes the feature functional end-to-end
**Priority**: P0 (Must Have)
**Estimated Effort**: 4 hours

---

## 📐 Acceptance Criteria

### ✅ AC1: Dynamic Slot Generation

**Given** opening hours are configured in the database
**When** the Training Sessions page loads
**Then** time slots should be generated dynamically based on the opening hours for that date
**And** slots should only appear during the configured opening hours

### ✅ AC2: Closed Day Handling

**Given** a specific day is marked as closed in settings
**When** a user navigates to that date in Training Sessions
**Then** the page should display "Studio Closed on [Date]"
**And** no time slots should be shown
**And** no bookings should be possible

### ✅ AC3: Opening Hours Caching

**Given** opening hours are fetched from the database
**When** the same date is accessed multiple times
**Then** the opening hours should be cached
**And** subsequent requests should use the cached data
**And** cache should be valid for 5 minutes

### ✅ AC4: Effective Date Handling

**Given** opening hours change on a future date
**When** viewing sessions before the effective date
**Then** old hours should be used for slot generation

**And When** viewing sessions on or after the effective date
**Then** new hours should be used for slot generation

### ✅ AC5: Fallback to Defaults

**Given** no opening hours are configured in the database
**When** generating time slots
**Then** the system should fall back to hardcoded defaults:

- Start: 09:00
- End: 24:00
- All days open

### ✅ AC6: Real-Time Updates

**Given** I have the Training Sessions page open
**When** admin saves new opening hours with today as effective date
**Then** I should see updated slots after refreshing
**And** React Query cache should be invalidated

---

## 🏗️ Technical Specification

### Refactored Slot Generator

```typescript
// src/features/training-sessions/lib/slot-generator.ts (refactored)

import { format, startOfDay, getDay } from "date-fns";
import type { TimeSlot } from "./types";
import { supabase } from "@/lib/supabase";

// Default configuration (fallback)
const DEFAULT_SLOT_CONFIG = {
  START_HOUR: 9,
  END_HOUR: 24,
  SLOT_DURATION_MINUTES: 30,
} as const;

const DAY_INDEX_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

interface TimeSlotConfig {
  START_HOUR: number;
  END_HOUR: number;
  SLOT_DURATION_MINUTES: number;
}

/**
 * Get time slot configuration for a specific date
 * Queries opening hours from database with caching
 */
export async function getTimeSlotConfig(
  date: Date
): Promise<TimeSlotConfig | null> {
  try {
    // Get active opening hours for this date
    const { data, error } = await supabase.rpc("get_active_opening_hours", {
      target_date: format(date, "yyyy-MM-dd"),
    });

    if (error) {
      console.error("Failed to fetch opening hours:", error);
      return DEFAULT_SLOT_CONFIG;
    }

    if (!data || Object.keys(data).length === 0) {
      // No settings found - use defaults
      return DEFAULT_SLOT_CONFIG;
    }

    // Get day of week
    const dayOfWeek = getDay(date);
    const dayName = DAY_INDEX_MAP[dayOfWeek];
    const dayConfig = data[dayName];

    if (!dayConfig || !dayConfig.is_open) {
      // Day is closed
      return null;
    }

    // Parse times
    const [openHour, openMin] = dayConfig.open_time.split(":").map(Number);
    const [closeHour, closeMin] = dayConfig.close_time.split(":").map(Number);

    return {
      START_HOUR: openHour,
      END_HOUR: closeHour,
      SLOT_DURATION_MINUTES: 30,
    };
  } catch (err) {
    console.error("Error getting time slot config:", err);
    return DEFAULT_SLOT_CONFIG;
  }
}

/**
 * Generates 30-minute time slots for a given day
 * Now async and fetches opening hours from database
 *
 * @param date - The date to generate slots for
 * @returns Array of TimeSlot objects, or empty array if day is closed
 */
export async function generateTimeSlots(
  date: Date = new Date()
): Promise<TimeSlot[]> {
  const config = await getTimeSlotConfig(date);

  // Day is closed
  if (config === null) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const baseDate = startOfDay(date);

  for (let hour = config.START_HOUR; hour < config.END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += config.SLOT_DURATION_MINUTES) {
      const start = new Date(baseDate);
      start.setHours(hour, minute, 0, 0);

      const end = new Date(start);
      end.setMinutes(start.getMinutes() + config.SLOT_DURATION_MINUTES);

      slots.push({
        start,
        end,
        label: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
        hour,
        minute,
      });
    }
  }

  return slots;
}

/**
 * Check if a time slot overlaps with a session time range
 */
export function isSlotOccupied(
  slot: TimeSlot,
  sessionStart: Date,
  sessionEnd: Date
): boolean {
  return (
    (slot.start >= sessionStart && slot.start < sessionEnd) ||
    (slot.end > sessionStart && slot.end <= sessionEnd) ||
    (slot.start <= sessionStart && slot.end >= sessionEnd)
  );
}
```

### Opening Hours Hook with Caching

```typescript
// src/features/settings/hooks/use-opening-hours.ts

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import type { OpeningHoursWeek } from "../lib/types";

export function useOpeningHours(date: Date) {
  return useQuery({
    queryKey: ["opening-hours", format(date, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_active_opening_hours", {
        target_date: format(date, "yyyy-MM-dd"),
      });

      if (error) throw error;

      return data as OpeningHoursWeek;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

### Updated MachineSlotGrid

```typescript
// src/features/training-sessions/components/MachineSlotGrid.tsx (updated)

import React, { useMemo, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { startOfDay, endOfDay, format } from 'date-fns';
import { useMachines } from '../hooks/use-machines';
import { useTrainingSessions } from '../hooks/use-training-sessions';
import { generateTimeSlots } from '../lib/slot-generator';
import { MachineColumn } from './MachineColumn';
import type { TimeSlot, TrainingSession } from '../lib/types';

interface MachineSlotGridProps {
  selectedDate: Date;
  onSlotClick: (machine_id: string, timeSlot: TimeSlot) => void;
  onSessionClick: (session: TrainingSession) => void;
}

export const MachineSlotGrid: React.FC<MachineSlotGridProps> = ({
  selectedDate,
  onSlotClick,
  onSessionClick,
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  // Fetch machines and sessions
  const { data: machines, isLoading: machinesLoading } = useMachines();
  const { data: sessions, isLoading: sessionsLoading } = useTrainingSessions({
    date_range: {
      start: startOfDay(selectedDate),
      end: endOfDay(selectedDate),
    },
  });

  // Generate time slots asynchronously
  useEffect(() => {
    let mounted = true;

    async function loadSlots() {
      setIsLoadingSlots(true);
      try {
        const slots = await generateTimeSlots(selectedDate);
        if (mounted) {
          setTimeSlots(slots);
        }
      } catch (error) {
        console.error('Failed to generate time slots:', error);
      } finally {
        if (mounted) {
          setIsLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      mounted = false;
    };
  }, [selectedDate]);

  const isLoading = machinesLoading || sessionsLoading || isLoadingSlots;

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground mt-2 text-sm">
              Loading machine grid...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Studio closed on this day
  if (timeSlots.length === 0) {
    return (
      <Card className="p-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Studio is closed on {format(selectedDate, 'EEEE, MMMM d, yyyy')}.
            No training sessions available.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  // No machines configured
  if (!machines || machines.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              No machines configured. Please contact your administrator.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Time axis labels */}
      <div className="flex flex-col gap-1 pt-12">
        {timeSlots.map((slot, index) => (
          <div
            key={index}
            className="text-muted-foreground flex h-16 items-center text-xs"
            style={{ minWidth: '70px' }}
          >
            {slot.label.split(' - ')[0]}
          </div>
        ))}
      </div>

      {/* Machine columns */}
      <div className="grid flex-1 grid-cols-3 gap-4">
        {machines.map((machine) => (
          <MachineColumn
            key={machine.id}
            machine={machine}
            timeSlots={timeSlots}
            sessions={
              sessions?.filter((s) => s.machine_id === machine.id) || []
            }
            onSlotClick={onSlotClick}
            onSessionClick={onSessionClick}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## 🔧 Implementation Steps

1. **Refactor slot-generator.ts**
   - Make `generateTimeSlots()` async
   - Create `getTimeSlotConfig()` function
   - Query database for opening hours
   - Handle closed days (return null or empty array)
   - Add fallback to default configuration

2. **Create useOpeningHours Hook**
   - Create React Query hook with caching
   - Query key includes date for proper cache separation

3. **Update MachineSlotGrid**
   - Convert to async slot loading
   - Add loading state for slots
   - Display "Studio Closed" message when no slots
   - Handle errors gracefully

4. **Update SessionBookingDialog** (if needed)
   - Ensure it handles async slot generation
   - Add loading states

5. **Invalidate Cache on Settings Save**
   - When settings are saved, invalidate `['opening-hours']` query
   - Force refresh of Training Sessions view

6. **Write Tests**
   - Test slot generation with various opening hours
   - Test closed day handling
   - Test effective date logic
   - Test caching behavior
   - Test fallback to defaults

7. **Performance Testing**
   - Measure slot generation time (target < 50ms)
   - Check for memory leaks
   - Verify cache hit rate

---

## 🧪 Testing Checklist

- [ ] Slots generated correctly based on database settings
- [ ] Closed days display "Studio Closed" message
- [ ] No slots shown on closed days
- [ ] Effective date respected (old hours before, new hours after)
- [ ] Caching works (check Network tab - no repeated queries)
- [ ] Fallback to defaults when no settings exist
- [ ] Cache invalidated when settings change
- [ ] Performance meets targets (< 50ms slot generation)
- [ ] No memory leaks in slot generation
- [ ] All edge cases handled (midnight, etc.)
- [ ] All tests passing

---

## 📊 Definition of Done

- [ ] slot-generator.ts refactored to async
- [ ] getTimeSlotConfig() function created
- [ ] useOpeningHours hook created with caching
- [ ] MachineSlotGrid updated for async slots
- [ ] Closed day handling implemented
- [ ] Fallback to defaults working
- [ ] Cache invalidation on settings save
- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Performance tests passing
- [ ] STATUS.md updated

---

## 🔗 Related User Stories

- **Depends On**: US-005 (Conflict Detection)
- **Blocks**: US-007 (Testing & Edge Cases)

---

## 📚 References

- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - Phase 6
- [React Query Caching](https://tanstack.com/query/latest/docs/react/guides/caching)
- [Async/Await Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

---

**Story ID**: US-006
**Created**: 2025-10-16
**Status**: ✅ Completed
**Completed**: 2025-10-17
**Depends On**: US-005
**Implementation Notes**: Refactored slot generation to async, querying opening hours from database. Added useOpeningHours hook with React Query caching (5-min stale time). MachineSlotGrid now handles async slot loading with loading states and "Studio Closed" message for closed days. All 14 slot-generator tests + 14 MachineSlotGrid tests passing. Total 971/971 tests passing. Build successful.

**Manual Testing**: User verified "Studio is closed on Sunday, October 19, 2025. No training sessions available." message displays correctly when navigating to closed day. Visual confirmation matches automated test expectations.
