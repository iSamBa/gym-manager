"use client";

import { memo, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import type { OpeningHoursDay } from "../lib/types";

interface DayOpeningHoursRowProps {
  day: string;
  dayLabel: string;
  config: OpeningHoursDay;
  onChange: (config: OpeningHoursDay) => void;
  error?: string;
  disabled?: boolean;
}

export const DayOpeningHoursRow = memo(function DayOpeningHoursRow({
  day: _day, // Kept for interface compatibility but not used
  dayLabel,
  config,
  onChange,
  error,
  disabled = false,
}: DayOpeningHoursRowProps) {
  const handleToggle = useCallback(
    (checked: boolean) => {
      if (!checked) {
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
          open_time: "09:00",
          close_time: "21:00",
        });
      }
    },
    [onChange]
  );

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
          "grid grid-cols-[140px_1fr_1fr_80px] items-center gap-4 rounded-lg border p-4",
          error && "border-destructive bg-destructive/5",
          !config.is_open && "bg-muted/50"
        )}
      >
        {/* Day Label */}
        <Label className="text-sm font-medium">{dayLabel}</Label>

        {/* Opening Time */}
        <TimePicker
          value={config.open_time || ""}
          onChange={handleOpenTimeChange}
          disabled={!config.is_open || disabled}
        />

        {/* Closing Time */}
        <TimePicker
          value={config.close_time || ""}
          onChange={handleCloseTimeChange}
          disabled={!config.is_open || disabled}
        />

        {/* Open Checkbox */}
        <div className="flex items-center justify-center">
          <Checkbox
            checked={config.is_open}
            onCheckedChange={handleToggle}
            disabled={disabled}
            aria-label={`Toggle ${dayLabel}`}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-destructive ml-[140px] text-sm">{error}</p>}
    </div>
  );
});
