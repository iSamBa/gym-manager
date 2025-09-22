"use client";

import * as React from "react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { DatePicker } from "./date-picker";
import { TimePicker } from "./time-picker";

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value
  );
  const [selectedTime, setSelectedTime] = React.useState<string>(
    value ? format(value, "HH:mm") : ""
  );

  // Update internal state when value prop changes
  React.useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setSelectedTime(format(value, "HH:mm"));
    } else {
      setSelectedDate(undefined);
      setSelectedTime("");
    }
  }, [value]);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);

    if (date && selectedTime) {
      const [hours, minutes] = selectedTime.split(":");
      const newDateTime = new Date(date);
      newDateTime.setHours(parseInt(hours, 10));
      newDateTime.setMinutes(parseInt(minutes, 10));
      newDateTime.setSeconds(0);
      newDateTime.setMilliseconds(0);

      onChange?.(newDateTime);
    } else if (!date) {
      onChange?.(undefined);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);

    if (selectedDate && time) {
      const [hours, minutes] = time.split(":");
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(parseInt(hours, 10));
      newDateTime.setMinutes(parseInt(minutes, 10));
      newDateTime.setSeconds(0);
      newDateTime.setMilliseconds(0);

      onChange?.(newDateTime);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2",
        className
      )}
    >
      <div className="w-full sm:w-[60%]">
        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          placeholder="Pick a date"
          disabled={disabled}
        />
      </div>
      <div className="w-full sm:w-[40%]">
        <TimePicker
          value={selectedTime}
          onChange={handleTimeChange}
          placeholder="Select time"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
