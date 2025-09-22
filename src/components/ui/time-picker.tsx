"use client";

import * as React from "react";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  value?: string; // Format: "HH:MM"
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  className,
}: TimePickerProps) {
  // Generate hour options (00-23)
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  // Generate minute options (00, 15, 30, 45)
  const minutes = ["00", "15", "30", "45"];

  const [selectedHour, selectedMinute] = value ? value.split(":") : ["", ""];

  const handleHourChange = (hour: string) => {
    const newTime = `${hour}:${selectedMinute || "00"}`;
    onChange?.(newTime);
  };

  const handleMinuteChange = (minute: string) => {
    const newTime = `${selectedHour || "00"}:${minute}`;
    onChange?.(newTime);
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Clock className="text-muted-foreground h-4 w-4" />
      <Select
        value={selectedHour}
        onValueChange={handleHourChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-20">
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((hour) => (
            <SelectItem key={hour} value={hour}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select
        value={selectedMinute}
        onValueChange={handleMinuteChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-20">
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((minute) => (
            <SelectItem key={minute} value={minute}>
              {minute}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
