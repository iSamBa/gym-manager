import React, { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import type {
  Machine,
  TimeSlot as TimeSlotType,
  TrainingSession,
} from "../lib/types";
import type { SessionType } from "@/features/database/lib/types";
import { useSessionAlerts } from "../hooks/use-session-alerts";
import { SessionNotificationBadge } from "./SessionNotificationBadge";
import {
  getSessionTypeColor,
  getSessionTypeBorderColor,
  getSessionTypeBadgeColor,
} from "../lib/session-colors";
import { Badge } from "@/components/ui/badge";
import { usePlanningSettings } from "@/features/settings/hooks/use-planning-settings";
import { calculatePlanningIndicators } from "../lib/planning-indicators";
import { PlanningIndicatorIcons } from "./PlanningIndicatorIcons";

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

    // Get planning settings
    const { settings } = usePlanningSettings();

    // Calculate planning indicators
    const planningIndicators = useMemo(() => {
      if (!session || !settings || !session.session_date) return null;

      const planningData = {
        subscriptionEndDate: session.subscription_end_date,
        latestPaymentDate: session.latest_payment_date,
        latestCheckupDate: session.latest_checkup_date,
        sessionsSinceCheckup: session.sessions_since_checkup,
        outstandingBalance: session.outstanding_balance,
      };

      return calculatePlanningIndicators(
        planningData,
        session.session_date,
        settings
      );
    }, [session, settings]);

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

    // Special styling for cancelled sessions
    const isCancelled = session.status === "cancelled";
    const sessionTypeColors = session.session_type
      ? getSessionTypeColor(session.session_type)
      : "bg-gray-500 text-white";
    const borderColor = session.session_type
      ? getSessionTypeBorderColor(session.session_type)
      : "border-gray-500";

    return (
      <div
        data-testid="time-slot"
        className={cn(
          "relative flex h-16 cursor-pointer flex-col gap-1 rounded border-l-4 p-2 transition-shadow hover:shadow-md",
          isCancelled
            ? "border-gray-300 bg-gray-100 text-gray-800 line-through"
            : cn(sessionTypeColors, borderColor)
        )}
        onClick={onClick}
      >
        {/* Top row: Member name + Planning icons + Session badge */}
        <div className="flex min-w-0 items-center gap-2">
          <div className="truncate text-base font-medium">{memberName}</div>

          {/* Planning indicator icons */}
          {planningIndicators && (
            <PlanningIndicatorIcons indicators={planningIndicators} />
          )}

          {/* Session type badge */}
          {session.session_type && (
            <Badge
              variant="secondary"
              className={cn(
                "ml-auto shrink-0 border text-xs",
                getSessionTypeBadgeColor(session.session_type)
              )}
            >
              {getSessionTypeLabel(session.session_type)}
            </Badge>
          )}
        </div>

        {/* Bottom row: Time label */}
        <div className="text-xs text-gray-600">{timeSlot.label}</div>

        {/* Notification badge - only show for non-completed sessions with alerts */}
        {showAlertBadge && <SessionNotificationBadge count={alertCount} />}
      </div>
    );
  }
);

TimeSlot.displayName = "TimeSlot";

/**
 * Gets display label for session type
 */
function getSessionTypeLabel(sessionType: SessionType): string {
  switch (sessionType) {
    case "trial":
      return "Trial";
    case "member":
      return "Member";
    case "contractual":
      return "Contract";
    case "multi_site":
      return "Guest";
    case "collaboration":
      return "Collab";
    case "makeup":
      return "Makeup";
    case "non_bookable":
      return "Blocked";
  }
}
