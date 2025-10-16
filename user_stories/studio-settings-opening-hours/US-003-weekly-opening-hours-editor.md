# US-003: Weekly Opening Hours Editor

## 📋 User Story

**As a** gym administrator
**I want** an intuitive weekly schedule editor
**So that** I can easily set different opening hours for each day of the week

---

## 🎯 Business Value

**Value**: Provides core UI for configuring opening hours
**Impact**: High - Primary interface for the feature
**Priority**: P0 (Must Have)
**Estimated Effort**: 5 hours

---

## 📐 Acceptance Criteria

### ✅ AC1: Weekly Grid Display

**Given** I am on the Opening Hours tab
**When** the page loads
**Then** I should see a weekly grid with 7 rows (Monday through Sunday)
**And** each row should display:

- Day name (e.g., "Monday")
- Toggle switch (Open/Closed)
- Opening time picker
- Closing time picker

### ✅ AC2: Day Toggle Functionality

**Given** I am viewing a day row
**When** I toggle the switch to "Closed"
**Then** the time pickers should be disabled and grayed out
**And** the times should be cleared (set to null)

**And When** I toggle back to "Open"
**Then** the time pickers should be enabled
**And** default times should be populated (09:00 - 21:00)

### ✅ AC3: Time Picker Functionality

**Given** a day is marked as "Open"
**When** I click the opening time picker
**Then** I should see a dropdown with hours (00-23) and minutes (00, 15, 30, 45)

**And When** I select a time
**Then** the selected time should be displayed in HH:MM format

### ✅ AC4: Real-Time Validation

**Given** I have set an opening time
**When** I set a closing time that is before or equal to the opening time
**Then** I should see an inline error message: "Closing time must be after opening time"
**And** the row should be highlighted in red
**And** the "Save Changes" button should be disabled

### ✅ AC5: Bulk Actions - Apply to Weekdays

**Given** I have configured Monday's hours
**When** I click "Apply to Weekdays" in the bulk actions toolbar
**Then** Monday's settings should be copied to Tuesday through Friday
**And** Saturday and Sunday should remain unchanged
**And** a confirmation toast should appear

### ✅ AC6: Bulk Actions - Apply to All Days

**Given** I have configured Monday's hours
**When** I click "Apply to All Days"
**Then** Monday's settings should be copied to all 7 days
**And** a confirmation toast should appear

### ✅ AC7: Bulk Actions - Reset to Defaults

**Given** I have made changes to the weekly schedule
**When** I click "Reset to Defaults"
**Then** all days should be set to:

- Open: true
- Opening time: 09:00
- Closing time: 24:00
  **And** a confirmation toast should appear

### ✅ AC8: Component Performance

**Given** the grid is rendered
**When** I interact with time pickers and toggles
**Then** there should be no noticeable lag (< 100ms response time)
**And** React DevTools should show < 30% unnecessary re-renders

---

## 🏗️ Technical Specification

### Component Structure

```
WeeklyOpeningHoursGrid
├── BulkActionsToolbar
│   ├── Button: "Apply to Weekdays"
│   ├── Button: "Apply to All Days"
│   └── Button: "Reset to Defaults"
└── DayOpeningHoursRow (x7)
    ├── Label: Day name
    ├── Switch: is_open toggle
    ├── TimePicker: open_time
    └── TimePicker: close_time
```

### WeeklyOpeningHoursGrid Component

```typescript
// src/features/settings/components/WeeklyOpeningHoursGrid.tsx

'use client';

import { memo, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { OpeningHoursWeek, DayOfWeek } from '../lib/types';
import { DayOpeningHoursRow } from './DayOpeningHoursRow';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { validateOpeningHours } from '../lib/validation';

interface WeeklyOpeningHoursGridProps {
  value: OpeningHoursWeek;
  onChange: (value: OpeningHoursWeek) => void;
  disabled?: boolean;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const WeeklyOpeningHoursGrid = memo(function WeeklyOpeningHoursGrid({
  value,
  onChange,
  disabled = false,
}: WeeklyOpeningHoursGridProps) {
  // Validate all days
  const validationErrors = useMemo(() => {
    return validateOpeningHours(value);
  }, [value]);

  // Handle day change
  const handleDayChange = useCallback(
    (day: DayOfWeek, dayValue: OpeningHoursWeek[DayOfWeek]) => {
      onChange({
        ...value,
        [day]: dayValue,
      });
    },
    [value, onChange]
  );

  // Bulk action: Apply Monday to weekdays
  const handleApplyToWeekdays = useCallback(() => {
    const mondayConfig = value.monday;
    onChange({
      ...value,
      tuesday: { ...mondayConfig },
      wednesday: { ...mondayConfig },
      thursday: { ...mondayConfig },
      friday: { ...mondayConfig },
    });
  }, [value, onChange]);

  // Bulk action: Apply Monday to all days
  const handleApplyToAllDays = useCallback(() => {
    const mondayConfig = value.monday;
    const newValue: OpeningHoursWeek = {} as OpeningHoursWeek;

    DAYS_OF_WEEK.forEach((day) => {
      newValue[day] = { ...mondayConfig };
    });

    onChange(newValue);
  }, [value, onChange]);

  // Bulk action: Reset to defaults
  const handleResetToDefaults = useCallback(() => {
    const defaultConfig = {
      is_open: true,
      open_time: '09:00',
      close_time: '24:00',
    };

    const newValue: OpeningHoursWeek = {} as OpeningHoursWeek;

    DAYS_OF_WEEK.forEach((day) => {
      newValue[day] = { ...defaultConfig };
    });

    onChange(newValue);
  }, [onChange]);

  return (
    <div className="space-y-4">
      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        onApplyToWeekdays={handleApplyToWeekdays}
        onApplyToAllDays={handleApplyToAllDays}
        onResetToDefaults={handleResetToDefaults}
        disabled={disabled}
      />

      {/* Weekly Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => (
              <DayOpeningHoursRow
                key={day}
                day={day}
                dayLabel={DAY_LABELS[day]}
                config={value[day]}
                onChange={(dayValue) => handleDayChange(day, dayValue)}
                error={validationErrors[day]}
                disabled={disabled}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
```

### DayOpeningHoursRow Component

```typescript
// src/features/settings/components/DayOpeningHoursRow.tsx

'use client';

import { memo, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import { cn } from '@/lib/utils';
import type { OpeningHoursDay } from '../lib/types';

interface DayOpeningHoursRowProps {
  day: string;
  dayLabel: string;
  config: OpeningHoursDay;
  onChange: (config: OpeningHoursDay) => void;
  error?: string;
  disabled?: boolean;
}

export const DayOpeningHoursRow = memo(function DayOpeningHoursRow({
  day,
  dayLabel,
  config,
  onChange,
  error,
  disabled = false,
}: DayOpeningHoursRowProps) {
  const handleToggle = useCallback(() => {
    if (config.is_open) {
      // Closing - clear times
      onChange({
        is_open: false,
        open_time: null,
        close_time: null,
      });
    } else {
      // Opening - set default times
      onChange({
        is_open: true,
        open_time: '09:00',
        close_time: '21:00',
      });
    }
  }, [config.is_open, onChange]);

  const handleOpenTimeChange = useCallback(
    (time: string) => {
      onChange({
        ...config,
        open_time: time,
      });
    },
    [config, onChange]
  );

  const handleCloseTimeChange = useCallback(
    (time: string) => {
      onChange({
        ...config,
        close_time: time,
      });
    },
    [config, onChange]
  );

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'grid grid-cols-[140px_80px_1fr_1fr] items-center gap-4 rounded-lg border p-4',
          error && 'border-destructive bg-destructive/5',
          !config.is_open && 'bg-muted/50'
        )}
      >
        {/* Day Label */}
        <Label className="text-sm font-medium">{dayLabel}</Label>

        {/* Open/Closed Toggle */}
        <div className="flex items-center gap-2">
          <Switch
            checked={config.is_open}
            onCheckedChange={handleToggle}
            disabled={disabled}
            aria-label={`Toggle ${dayLabel}`}
          />
          <span className="text-sm text-muted-foreground">
            {config.is_open ? 'Open' : 'Closed'}
          </span>
        </div>

        {/* Opening Time */}
        <div>
          <Label htmlFor={`${day}-open-time`} className="text-xs text-muted-foreground">
            Opening Time
          </Label>
          <TimePicker
            id={`${day}-open-time`}
            value={config.open_time || ''}
            onChange={handleOpenTimeChange}
            disabled={!config.is_open || disabled}
            className="mt-1"
          />
        </div>

        {/* Closing Time */}
        <div>
          <Label htmlFor={`${day}-close-time`} className="text-xs text-muted-foreground">
            Closing Time
          </Label>
          <TimePicker
            id={`${day}-close-time`}
            value={config.close_time || ''}
            onChange={handleCloseTimeChange}
            disabled={!config.is_open || disabled}
            className="mt-1"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive ml-[140px]">{error}</p>
      )}
    </div>
  );
});
```

### BulkActionsToolbar Component

```typescript
// src/features/settings/components/BulkActionsToolbar.tsx

'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CopyPlus, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface BulkActionsToolbarProps {
  onApplyToWeekdays: () => void;
  onApplyToAllDays: () => void;
  onResetToDefaults: () => void;
  disabled?: boolean;
}

export const BulkActionsToolbar = memo(function BulkActionsToolbar({
  onApplyToWeekdays,
  onApplyToAllDays,
  onResetToDefaults,
  disabled = false,
}: BulkActionsToolbarProps) {
  const handleApplyToWeekdays = () => {
    onApplyToWeekdays();
    toast.success('Applied Monday hours to weekdays');
  };

  const handleApplyToAllDays = () => {
    onApplyToAllDays();
    toast.success('Applied Monday hours to all days');
  };

  const handleResetToDefaults = () => {
    onResetToDefaults();
    toast.success('Reset to default hours');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Quick Actions:</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <Copy className="mr-2 h-4 w-4" />
            Apply Monday to...
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleApplyToWeekdays}>
            <Copy className="mr-2 h-4 w-4" />
            Weekdays (Tue-Fri)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleApplyToAllDays}>
            <CopyPlus className="mr-2 h-4 w-4" />
            All Days
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={handleResetToDefaults}
        disabled={disabled}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset to Defaults
      </Button>
    </div>
  );
});
```

### Validation Logic

```typescript
// src/features/settings/lib/validation.ts

import type { OpeningHoursWeek, DayOfWeek } from "./types";

export function validateOpeningHours(
  hours: OpeningHoursWeek
): Partial<Record<DayOfWeek, string>> {
  const errors: Partial<Record<DayOfWeek, string>> = {};

  const days: DayOfWeek[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  days.forEach((day) => {
    const config = hours[day];

    if (config.is_open) {
      // Check times exist
      if (!config.open_time || !config.close_time) {
        errors[day] = "Opening and closing times are required";
        return;
      }

      // Check time format
      const timeRegex = /^\d{2}:\d{2}$/;
      if (
        !timeRegex.test(config.open_time) ||
        !timeRegex.test(config.close_time)
      ) {
        errors[day] = "Invalid time format (expected HH:MM)";
        return;
      }

      // Check close time > open time
      if (config.close_time <= config.open_time) {
        errors[day] = "Closing time must be after opening time";
        return;
      }
    }
  });

  return errors;
}

export function hasValidationErrors(
  errors: Partial<Record<DayOfWeek, string>>
): boolean {
  return Object.keys(errors).length > 0;
}
```

---

## 🔧 Implementation Steps

1. **Create Validation Logic**
   - Create `src/features/settings/lib/validation.ts`
   - Implement `validateOpeningHours()` function

2. **Create BulkActionsToolbar**
   - Create component file
   - Implement dropdown menu with actions
   - Add toast notifications

3. **Create DayOpeningHoursRow**
   - Create component file
   - Integrate Switch and TimePicker components
   - Add validation error display
   - Wrap in React.memo for performance

4. **Create WeeklyOpeningHoursGrid**
   - Create component file
   - Render 7 day rows
   - Integrate BulkActionsToolbar
   - Add validation with useMemo
   - Wrap in React.memo

5. **Integrate into OpeningHoursTab**
   - Import WeeklyOpeningHoursGrid
   - Replace placeholder with grid
   - Add local state management

6. **Write Tests**
   - Test validation logic
   - Test component rendering
   - Test bulk actions
   - Test time picker interactions

7. **Performance Check**
   - Use React DevTools Profiler
   - Verify < 30% unnecessary re-renders

---

## 🧪 Testing Checklist

- [ ] Grid displays all 7 days
- [ ] Day toggle on/off works correctly
- [ ] Times cleared when day set to closed
- [ ] Default times populated when day opened
- [ ] Time picker shows correct options
- [ ] Validation errors display inline
- [ ] "Apply to Weekdays" copies Monday to Tue-Fri only
- [ ] "Apply to All Days" copies Monday to all 7 days
- [ ] "Reset to Defaults" sets all days to 09:00-24:00
- [ ] Toast notifications appear for bulk actions
- [ ] Save button disabled when validation errors exist
- [ ] Component performance meets targets
- [ ] Mobile responsive layout works

---

## 📊 Definition of Done

- [ ] Validation logic implemented and tested
- [ ] BulkActionsToolbar component created
- [ ] DayOpeningHoursRow component created
- [ ] WeeklyOpeningHoursGrid component created
- [ ] All components use React.memo
- [ ] Event handlers use useCallback
- [ ] Validation uses useMemo
- [ ] Integrated into OpeningHoursTab
- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] Performance checks passing
- [ ] Mobile responsive
- [ ] STATUS.md updated

---

## 🔗 Related User Stories

- **Depends On**: US-002 (Settings Page Foundation)
- **Blocks**: US-004 (Effective Date Handling)

---

## 📚 References

- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - Phase 3
- [CLAUDE.md](../../CLAUDE.md) - Performance optimization
- [shadcn/ui Switch](https://ui.shadcn.com/docs/components/switch)
- [shadcn/ui DropdownMenu](https://ui.shadcn.com/docs/components/dropdown-menu)

---

**Story ID**: US-003
**Created**: 2025-10-16
**Status**: Not Started
**Depends On**: US-002
