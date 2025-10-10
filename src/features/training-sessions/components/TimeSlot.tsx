import React, { memo } from "react";
import { cn } from "@/lib/utils";
import type {
  Machine,
  TimeSlot as TimeSlotType,
  TrainingSession,
} from "../lib/types";
import { useSessionAlerts } from "../hooks/use-session-alerts";
import { SessionNotificationBadge } from "./SessionNotificationBadge";

interface TimeSlotProps {
  machine: Machine;
  timeSlot: TimeSlotType;
  session?: TrainingSession;
  onClick: () => void;
}

/**
 * TimeSlot component - renders a single 30-minute slot
 * Displays member names for booked sessions and applies status-based colors
 */
export const TimeSlot = memo<TimeSlotProps>(
  ({ machine, timeSlot, session, onClick }) => {
    // Get notification alerts for this session
    const memberId = session?.participants?.[0]?.id;
    const { data: alerts = [] } = useSessionAlerts(
      session?.id,
      memberId,
      session?.scheduled_start
    );

    // Empty slot
    if (!session) {
      return (
        <div
          data-testid="time-slot"
          className={cn(
            "flex h-16 cursor-pointer items-center justify-center rounded border p-2 transition-colors",
            machine.is_available
              ? "border-gray-200 hover:bg-gray-50"
              : "cursor-not-allowed opacity-50"
          )}
          onClick={() => machine.is_available && onClick()}
        >
          <span className="text-xs text-gray-400">{timeSlot.label}</span>
        </div>
      );
    }

    // Booked slot
    const memberName = session.participants?.[0]?.name || "Unknown Member";
    const alertCount = alerts.length;
    const showAlertBadge = session.status !== "completed" && alertCount > 0;

    return (
      <div
        data-testid="time-slot"
        className={cn(
          "relative h-16 cursor-pointer rounded border p-2 transition-shadow hover:shadow-md",
          getStatusColor(session.status)
        )}
        onClick={onClick}
      >
        <div className="truncate text-sm font-medium">{memberName}</div>
        <div className="text-xs text-gray-600">{timeSlot.label}</div>

        {/* Notification badge - only show for non-completed sessions with alerts */}
        {showAlertBadge && <SessionNotificationBadge count={alertCount} />}
      </div>
    );
  }
);

TimeSlot.displayName = "TimeSlot";

function getStatusColor(status: TrainingSession["status"]): string {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 border-blue-300 text-blue-800";
    case "in_progress":
      return "bg-orange-100 border-orange-300 text-orange-800";
    case "completed":
      return "bg-green-100 border-green-300 text-green-800";
    case "cancelled":
      return "bg-gray-100 border-gray-300 text-gray-500 line-through";
  }
}
