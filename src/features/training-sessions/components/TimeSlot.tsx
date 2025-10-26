import React, { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
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
import { PlanningIndicatorBadges } from "./PlanningIndicatorBadges";

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
    // Determine display name based on session type
    let displayName = "Unknown Member";

    if (session.session_type === "non_bookable") {
      displayName = "Time Blocker";
    } else if (session.session_type === "multi_site") {
      // Multi-site guest session
      if (session.guest_first_name && session.guest_last_name) {
        displayName = `${session.guest_first_name} ${session.guest_last_name}`;
      } else {
        displayName = "Guest Session";
      }
    } else if (session.session_type === "collaboration") {
      // Collaboration session - show influencer name
      if (session.guest_first_name) {
        displayName = session.guest_first_name; // Influencer name
      } else {
        displayName = "Collaboration";
      }
    } else {
      // Regular member session
      displayName = session.participants?.[0]?.name || "Unknown Member";
    }

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

    // Check if this is a member session (has member data)
    const isMemberSession =
      session.session_type === "member" ||
      session.session_type === "trial" ||
      session.session_type === "contractual" ||
      session.session_type === "makeup";

    // Check if we have additional info to add bottom padding
    const hasAdditionalInfo =
      isMemberSession &&
      (session.vest_size ||
        session.hip_belt_size ||
        session.remaining_sessions !== null ||
        session.subscription_end_date);

    return (
      <div
        data-testid="time-slot"
        className={cn(
          "relative flex h-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded border-l-4 transition-shadow hover:shadow-md",
          hasAdditionalInfo ? "p-2 pb-3" : "p-2",
          isCancelled
            ? "border-gray-300 bg-gray-100 text-gray-800 line-through"
            : cn(sessionTypeColors, borderColor)
        )}
        onClick={onClick}
      >
        {/* Planning indicator icon badges - Top left */}
        {planningIndicators && (
          <div className="absolute top-2 left-2">
            <PlanningIndicatorBadges indicators={planningIndicators} />
          </div>
        )}

        {/* Session type badge - Top right */}
        {session.session_type && (
          <Badge
            variant="secondary"
            className={cn(
              "absolute top-2 right-2 shrink-0 border text-xs",
              getSessionTypeBadgeColor(session.session_type)
            )}
          >
            {getSessionTypeLabel(session.session_type)}
          </Badge>
        )}

        {/* Row 1: Member name (centered) */}
        <div className="w-full text-center">
          <div className="truncate text-base font-medium">{displayName}</div>
        </div>

        {/* Row 2 & 3: Equipment and subscription info (only for member sessions, centered) */}
        {isMemberSession && (
          <>
            {/* Row 2: Vest and hip size (centered, bold) */}
            {(session.vest_size || session.hip_belt_size) && (
              <div className="w-full text-center text-xs font-semibold">
                {session.vest_size && <span>V: {session.vest_size}</span>}
                {session.vest_size && session.hip_belt_size && <span> • </span>}
                {session.hip_belt_size && (
                  <span>H: {session.hip_belt_size}</span>
                )}
              </div>
            )}

            {/* Row 3: Remaining sessions and expiration date (centered) */}
            {(session.remaining_sessions !== null &&
              session.remaining_sessions !== undefined) ||
            session.subscription_end_date ? (
              <div className="w-full text-center text-xs">
                {session.remaining_sessions !== null &&
                  session.remaining_sessions !== undefined && (
                    <span className="font-bold">
                      {session.remaining_sessions}
                    </span>
                  )}
                {session.remaining_sessions !== null &&
                  session.remaining_sessions !== undefined &&
                  session.subscription_end_date && <span> - </span>}
                {session.subscription_end_date && (
                  <span>
                    {format(
                      parseISO(session.subscription_end_date),
                      "dd/MM/yyyy"
                    )}
                  </span>
                )}
              </div>
            ) : null}
          </>
        )}

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
      return "trial";
    case "member":
      return "member";
    case "contractual":
      return "contractual";
    case "multi_site":
      return "multi-site";
    case "collaboration":
      return "collab";
    case "makeup":
      return "make-up";
    case "non_bookable":
      return "non-bookable";
  }
}
