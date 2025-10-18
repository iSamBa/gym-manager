"use client";

import { memo } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getStartOfDay } from "@/lib/date-utils";

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
  // Tomorrow is the minimum selectable date (today is not allowed)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-2">
      <Label htmlFor="effective-date">Effective From</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="effective-date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => date && onChange(date)}
            disabled={(date) => date < tomorrow}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <p className="text-muted-foreground text-sm">
        Choose when these changes should take effect. Changes must be scheduled
        for tomorrow or later.
      </p>
    </div>
  );
});
