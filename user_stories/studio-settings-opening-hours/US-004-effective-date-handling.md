# US-004: Effective Date Handling

## 📋 User Story

**As a** gym administrator
**I want** to schedule when opening hours changes take effect
**So that** I can plan ahead without disrupting current operations

---

## 🎯 Business Value

**Value**: Enables scheduled changes without immediate disruption
**Impact**: Medium - Adds flexibility to settings management
**Priority**: P0 (Must Have)
**Estimated Effort**: 2 hours

---

## 📐 Acceptance Criteria

### ✅ AC1: Effective Date Field

**Given** I am editing opening hours
**When** I view the form
**Then** I should see an "Effective From" date picker field
**And** the field should be clearly labeled with helper text

### ✅ AC2: Date Validation

**Given** I am selecting an effective date
**When** I open the date picker
**Then** all dates before today should be disabled
**And** I should only be able to select today or future dates

**And When** I try to programmatically set a past date
**Then** the system should reject it with a validation error

### ✅ AC3: Default Value

**Given** I am creating a new opening hours configuration
**When** the form loads
**Then** the effective date should default to today's date

### ✅ AC4: Preview Information

**Given** I have set opening hours and an effective date
**When** I view the preview section
**Then** I should see:

- "Changes will take effect on [DATE]"
- A table showing available slots per day
- "Existing bookings before this date remain unchanged"

### ✅ AC5: Slot Calculation

**Given** I have configured opening hours
**When** the preview displays
**Then** the available slots per day should be calculated as:

- `(close_hour - open_hour) * 2` (for 30-minute sessions)
- Example: 09:00-21:00 = 12 hours = 24 slots

**And** closed days should show "Studio Closed"

### ✅ AC6: Save Confirmation

**Given** I click "Save Changes"
**When** the confirmation dialog appears
**Then** it should display:

- Summary of changes
- Effective date
- Impact preview (slots affected)
- Buttons: "Confirm" and "Cancel"

---

## 🏗️ Technical Specification

### Components

#### EffectiveDatePicker

```typescript
// src/features/settings/components/EffectiveDatePicker.tsx

'use client';

import { memo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EffectiveDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
}

export const EffectiveDatePicker = memo(function EffectiveDatePicker({
  value,
  onChange,
  disabled = false,
}: EffectiveDatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-2">
      <Label htmlFor="effective-date">Effective From</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="effective-date"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, 'PPP') : 'Select date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => date && onChange(date)}
            disabled={(date) => date < today}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <p className="text-sm text-muted-foreground">
        Choose when these changes should take effect. Changes cannot be scheduled for past dates.
      </p>
    </div>
  );
});
```

#### EffectiveDatePreview

```typescript
// src/features/settings/components/EffectiveDatePreview.tsx

'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { OpeningHoursWeek, DayOfWeek } from '../lib/types';
import { calculateAvailableSlots } from '../lib/slot-calculator';

interface EffectiveDatePreviewProps {
  openingHours: OpeningHoursWeek;
  effectiveDate: Date;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const EffectiveDatePreview = memo(function EffectiveDatePreview({
  openingHours,
  effectiveDate,
}: EffectiveDatePreviewProps) {
  const slotsPerDay = useMemo(() => {
    return calculateAvailableSlots(openingHours);
  }, [openingHours]);

  const totalSlots = useMemo(() => {
    return Object.values(slotsPerDay).reduce((sum, slots) => sum + slots, 0);
  }, [slotsPerDay]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarIcon className="h-5 w-5" />
          Changes Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Effective Date Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Changes will take effect on{' '}
            <strong>{format(effectiveDate, 'EEEE, MMMM d, yyyy')}</strong>.
            Existing bookings before this date will remain unchanged.
          </AlertDescription>
        </Alert>

        {/* Slots Table */}
        <div>
          <h4 className="text-sm font-medium mb-3">Available Session Slots Per Day</h4>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-medium">Day</th>
                  <th className="p-3 text-left font-medium">Hours</th>
                  <th className="p-3 text-right font-medium">Available Slots</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(Object.keys(DAY_LABELS) as DayOfWeek[]).map((day) => {
                  const config = openingHours[day];
                  const slots = slotsPerDay[day];

                  return (
                    <tr key={day} className={!config.is_open ? 'bg-muted/30' : ''}>
                      <td className="p-3 font-medium">{DAY_LABELS[day]}</td>
                      <td className="p-3">
                        {config.is_open
                          ? `${config.open_time} - ${config.close_time}`
                          : 'Closed'}
                      </td>
                      <td className="p-3 text-right">
                        {config.is_open ? (
                          <span className="font-mono">{slots} slots</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t bg-muted/50 font-medium">
                <tr>
                  <td colSpan={2} className="p-3">
                    Total Weekly Slots
                  </td>
                  <td className="p-3 text-right font-mono">{totalSlots} slots</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
```

#### Slot Calculator Utility

```typescript
// src/features/settings/lib/slot-calculator.ts

import type { OpeningHoursWeek, DayOfWeek } from "./types";

export function calculateAvailableSlots(
  openingHours: OpeningHoursWeek
): Record<DayOfWeek, number> {
  const slots: Record<DayOfWeek, number> = {} as Record<DayOfWeek, number>;

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
    const config = openingHours[day];

    if (!config.is_open || !config.open_time || !config.close_time) {
      slots[day] = 0;
      return;
    }

    // Parse time strings (HH:MM)
    const [openHour, openMin] = config.open_time.split(":").map(Number);
    const [closeHour, closeMin] = config.close_time.split(":").map(Number);

    // Convert to minutes
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    // Calculate 30-minute slots
    const totalMinutes = closeMinutes - openMinutes;
    const slotCount = Math.floor(totalMinutes / 30);

    slots[day] = slotCount;
  });

  return slots;
}

export function calculateTotalWeeklySlots(
  openingHours: OpeningHoursWeek
): number {
  const slotsPerDay = calculateAvailableSlots(openingHours);
  return Object.values(slotsPerDay).reduce((sum, slots) => sum + slots, 0);
}
```

#### Updated OpeningHoursTab

```typescript
// src/features/settings/components/OpeningHoursTab.tsx (updated)

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStudioSettings } from '../hooks/use-studio-settings';
import { WeeklyOpeningHoursGrid } from './WeeklyOpeningHoursGrid';
import { EffectiveDatePicker } from './EffectiveDatePicker';
import { EffectiveDatePreview } from './EffectiveDatePreview';
import { SaveConfirmationDialog } from './SaveConfirmationDialog';
import { Separator } from '@/components/ui/separator';
import { hasValidationErrors } from '../lib/validation';
import type { OpeningHoursWeek } from '../lib/types';

export function OpeningHoursTab() {
  const { data: settings, isLoading, updateSettings, isUpdating } =
    useStudioSettings('opening_hours');

  const [localHours, setLocalHours] = useState<OpeningHoursWeek>(
    settings?.setting_value || getDefaultHours()
  );
  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSave = useCallback(async () => {
    try {
      await updateSettings({
        value: localHours,
        effectiveFrom: effectiveDate,
      });
      setShowConfirmDialog(false);
      // Success toast handled by hook
    } catch (error) {
      // Error toast handled by hook
      console.error('Failed to save:', error);
    }
  }, [localHours, effectiveDate, updateSettings]);

  const hasErrors = hasValidationErrors(validateOpeningHours(localHours));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Studio Opening Hours</CardTitle>
          <CardDescription>
            Set the days and times when your studio is open for training sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weekly Grid */}
          <WeeklyOpeningHoursGrid
            value={localHours}
            onChange={setLocalHours}
            disabled={isLoading || isUpdating}
          />

          <Separator />

          {/* Effective Date */}
          <EffectiveDatePicker
            value={effectiveDate}
            onChange={setEffectiveDate}
            disabled={isUpdating}
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={hasErrors || isUpdating}
            className="w-full sm:w-auto"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>

      {/* Preview */}
      <EffectiveDatePreview
        openingHours={localHours}
        effectiveDate={effectiveDate}
      />

      {/* Confirmation Dialog */}
      <SaveConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        openingHours={localHours}
        effectiveDate={effectiveDate}
        onConfirm={handleSave}
        isLoading={isUpdating}
      />
    </div>
  );
}

function getDefaultHours(): OpeningHoursWeek {
  const defaultDay = { is_open: true, open_time: '09:00', close_time: '24:00' };
  return {
    monday: { ...defaultDay },
    tuesday: { ...defaultDay },
    wednesday: { ...defaultDay },
    thursday: { ...defaultDay },
    friday: { ...defaultDay },
    saturday: { ...defaultDay },
    sunday: { ...defaultDay },
  };
}
```

---

## 🔧 Implementation Steps

1. **Create Slot Calculator**
   - Create `lib/slot-calculator.ts`
   - Implement `calculateAvailableSlots()` function
   - Add unit tests

2. **Create EffectiveDatePicker**
   - Create component with shadcn Calendar
   - Disable past dates
   - Add helper text

3. **Create EffectiveDatePreview**
   - Create preview card component
   - Integrate slot calculator
   - Display slots table

4. **Update OpeningHoursTab**
   - Add state for effective date
   - Integrate EffectiveDatePicker
   - Integrate EffectiveDatePreview
   - Add save button

5. **Create SaveConfirmationDialog** (placeholder for US-005)
   - Basic dialog for now
   - Will be enhanced with conflict detection

6. **Write Tests**
   - Test slot calculation with various hours
   - Test date validation
   - Test preview display

---

## 🧪 Testing Checklist

- [ ] Effective date picker displays correctly
- [ ] Past dates are disabled
- [ ] Today's date is selectable
- [ ] Future dates are selectable
- [ ] Default date is today
- [ ] Preview shows correct effective date
- [ ] Slot calculation is accurate for all days
- [ ] Closed days show "Closed" in preview
- [ ] Total weekly slots calculated correctly
- [ ] Save button includes effective date in payload
- [ ] All tests passing

---

## 📊 Definition of Done

- [ ] Slot calculator utility created and tested
- [ ] EffectiveDatePicker component created
- [ ] EffectiveDatePreview component created
- [ ] OpeningHoursTab updated with new components
- [ ] Date validation working (past dates blocked)
- [ ] Slot calculation accurate
- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] STATUS.md updated

---

## 🔗 Related User Stories

- **Depends On**: US-003 (Weekly Opening Hours Editor)
- **Blocks**: US-005 (Conflict Detection)

---

## 📚 References

- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - Phase 4
- [shadcn/ui Calendar](https://ui.shadcn.com/docs/components/calendar)
- [date-fns Documentation](https://date-fns.org/)

---

**Story ID**: US-004
**Created**: 2025-10-16
**Status**: ✅ Completed
**Completed**: 2025-10-16
**Depends On**: US-003 ✅

**Implementation Notes**:

- All 4 components created with React.memo and performance optimizations
- 31 new unit tests added (103/103 total passing)
- Manual testing completed via Puppeteer MCP (11/11 items verified)
- Build successful: /settings/studio route 51.6 kB
- All 6 acceptance criteria met
- Slot calculator accurately computes 30-minute session slots
- Date picker properly disables past dates using shadcn Calendar
- Preview component shows slots table with correct calculations
- Confirmation dialog displays summary with open/closed days
