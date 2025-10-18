"use client";

import { memo, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { OpeningHoursWeek, DayOfWeek } from "../lib/types";
import { DayOpeningHoursRow } from "./DayOpeningHoursRow";
import { BulkActionsToolbar } from "./BulkActionsToolbar";
import { validateOpeningHours } from "../lib/validation";

interface WeeklyOpeningHoursGridProps {
  value: OpeningHoursWeek;
  onChange: (value: OpeningHoursWeek) => void;
  disabled?: boolean;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
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
      open_time: "09:00",
      close_time: "23:45",
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
          {/* Column Headers */}
          <div className="grid grid-cols-[140px_1fr_1fr_80px] gap-4 px-4 pb-3">
            <div className="text-muted-foreground text-xs font-medium">Day</div>
            <div className="text-muted-foreground text-xs font-medium">
              Opening Time
            </div>
            <div className="text-muted-foreground text-xs font-medium">
              Closing Time
            </div>
            <div className="text-muted-foreground text-center text-xs font-medium">
              Open
            </div>
          </div>

          {/* Days */}
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
