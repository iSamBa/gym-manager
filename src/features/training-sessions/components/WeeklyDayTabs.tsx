"use client";

import React, { memo, useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, eachDayOfInterval, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { getLocalDateString, isToday } from "@/lib/date-utils";
import { useDailyStatistics } from "../hooks/use-daily-statistics";
import { getSessionTypeSolidColor } from "../lib/session-colors";
import { SESSION_TYPE_LABELS } from "../lib/constants";
import type { SessionType } from "@/features/database/lib/types";

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
 * Shows session distribution with color-coded badges for all 7 session types.
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
  // Calculate week end (Sunday)
  const weekEnd = useMemo(
    () => endOfWeek(weekStart, { weekStartsOn: 1 }),
    [weekStart]
  );

  // Fetch daily statistics for the week
  const { data: statistics, isLoading } = useDailyStatistics(
    weekStart,
    weekEnd
  );

  // Create lookup map for O(1) statistics access
  const statsMap = useMemo(() => {
    const map = new Map();
    statistics?.forEach((stat) => map.set(stat.date, stat));
    return map;
  }, [statistics]);

  // Calculate all 7 days of the week (Monday to Sunday)
  // weekStartsOn: 1 ensures Monday is the first day
  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: weekStart,
      end: weekEnd,
    });
  }, [weekStart, weekEnd]);

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
      <TabsList className="grid h-auto w-full grid-cols-7">
        {weekDays.map((day) => {
          const dateKey = getLocalDateString(day);
          const todayIndicator = isToday(day);
          const stats = statsMap.get(dateKey);

          return (
            <TabsTrigger
              key={dateKey}
              value={dateKey}
              className={cn(
                "flex min-h-[80px] flex-col items-center gap-1 py-4",
                todayIndicator &&
                  "border-primary bg-primary/10 text-primary font-semibold"
              )}
              aria-label={`Select ${format(day, "EEEE, MMMM d, yyyy")}`}
              data-today={todayIndicator ? "true" : undefined}
            >
              {/* Day name and date on the same line */}
              <div className="flex items-center gap-1">
                <span className="text-base font-semibold tracking-wide uppercase">
                  {format(day, "EEE")}
                </span>
                <span className="text-base leading-none font-semibold">
                  {format(day, "d")}
                </span>
              </div>

              {/* Statistics */}
              {isLoading ? (
                <div className="bg-muted h-6 w-12 animate-pulse rounded" />
              ) : stats ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-lg font-bold">
                    {stats.total} session{stats.total !== 1 ? "s" : ""}
                  </span>
                  {/* Color-coded badges for session types */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {(
                      [
                        "trial",
                        "member",
                        "contractual",
                        "makeup",
                        "multi_site",
                        "collaboration",
                        "non_bookable",
                      ] as SessionType[]
                    ).map((type) => {
                      const count = stats[type];
                      if (count === 0) return null;

                      const colorClass = getSessionTypeSolidColor(type);

                      return (
                        <div
                          key={type}
                          className={`${colorClass} rounded-md px-3 py-1 text-base font-bold`}
                          title={SESSION_TYPE_LABELS[type]}
                        >
                          {count}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg font-bold">0 sessions</span>
                </div>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
});
