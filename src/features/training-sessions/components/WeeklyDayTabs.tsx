"use client";

import React, { memo, useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, eachDayOfInterval, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { getLocalDateString, isToday } from "@/lib/date-utils";

/**
 * Props for WeeklyDayTabs component
 */
export interface WeeklyDayTabsProps {
  /** Currently selected date */
  selectedDate: Date;
  /** Start of the week to display (Monday) */
  weekStart: Date;
  /** Callback when a day tab is clicked */
  onDateSelect: (date: Date) => void;
}

/**
 * WeeklyDayTabs Component
 *
 * Displays 7 day tabs (Monday through Sunday) for weekly navigation.
 * Highlights today with distinct styling and allows tab selection to change the selected date.
 *
 * Performance optimized with React.memo, useMemo, and useCallback.
 *
 * @component
 * @example
 * ```tsx
 * <WeeklyDayTabs
 *   selectedDate={selectedDate}
 *   weekStart={weekStart}
 *   onDateSelect={setSelectedDate}
 * />
 * ```
 */
export const WeeklyDayTabs = memo(function WeeklyDayTabs({
  selectedDate,
  weekStart,
  onDateSelect,
}: WeeklyDayTabsProps) {
  // Calculate all 7 days of the week (Monday to Sunday)
  // weekStartsOn: 1 ensures Monday is the first day
  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(weekStart, { weekStartsOn: 1 }),
    });
  }, [weekStart]);

  // Handle tab change - convert date string back to Date object
  const handleTabChange = useCallback(
    (value: string) => {
      // value is in YYYY-MM-DD format from getLocalDateString
      const newDate = parseISO(value);
      onDateSelect(newDate);
    },
    [onDateSelect]
  );

  return (
    <Tabs
      value={getLocalDateString(selectedDate)}
      onValueChange={handleTabChange}
    >
      <TabsList className="grid w-full grid-cols-7">
        {weekDays.map((day) => {
          const dateKey = getLocalDateString(day);
          const todayIndicator = isToday(day);

          return (
            <TabsTrigger
              key={dateKey}
              value={dateKey}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2",
                todayIndicator &&
                  "border-primary bg-primary/10 text-primary font-semibold"
              )}
              aria-label={`Select ${format(day, "EEEE, MMMM d, yyyy")}`}
            >
              {/* Day name (abbreviated: Mon, Tue, etc.) */}
              <span className="text-xs tracking-wide uppercase">
                {format(day, "EEE")}
              </span>
              {/* Day number (1-31) */}
              <span className="text-lg leading-none font-bold">
                {format(day, "d")}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
});
