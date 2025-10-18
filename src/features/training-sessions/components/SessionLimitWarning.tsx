import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { useStudioSessionLimit } from "../hooks/use-studio-session-limit";
import {
  getCapacityColorScheme,
  getWeekRange,
} from "../lib/session-limit-utils";

interface SessionLimitWarningProps {
  date: Date;
}

/**
 * Displays studio capacity warning with visual indicators.
 *
 * Shows:
 * - Week range (Monday-Sunday)
 * - Progress bar with color coding (green/yellow/red)
 * - Current count / Maximum allowed
 * - Remaining slots
 * - Warning message when at capacity
 *
 * Color coding:
 * - Green (0-79%): Safe capacity
 * - Yellow (80-94%): Approaching capacity
 * - Red (95-100%): At or near capacity
 *
 * @param date - The date to check capacity for (determines which week)
 *
 * @example
 * <SessionLimitWarning date={new Date()} />
 */
export function SessionLimitWarning({ date }: SessionLimitWarningProps) {
  const { data: limit, isLoading } = useStudioSessionLimit(date);
  const weekRange = getWeekRange(date);

  if (isLoading || !limit) return null;

  const colorScheme = getCapacityColorScheme(limit.percentage);
  const isAtCapacity = !limit.can_book;
  const remaining = limit.max_allowed - limit.current_count;

  return (
    <Alert
      variant={isAtCapacity ? "destructive" : "default"}
      className={`${colorScheme.bg} ${colorScheme.border}`}
    >
      {isAtCapacity && <AlertTriangle className="h-4 w-4" />}
      <AlertTitle className="!text-gray-950">
        {isAtCapacity ? "⚠️ Studio Capacity Reached" : "Studio Capacity"}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          <p className="text-sm !text-gray-950">
            Week of {weekRange.start} - {weekRange.end}
          </p>

          <Progress value={limit.percentage} className="w-full" />

          <p className="text-sm font-semibold !text-gray-950">
            {limit.current_count} / {limit.max_allowed} sessions booked
            {!isAtCapacity && ` (${remaining} remaining)`}
          </p>

          {isAtCapacity && (
            <p className="mt-2 text-sm !text-gray-950">
              ⚠️ No additional bookings allowed this week. Please book for next
              week or contact admin.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
