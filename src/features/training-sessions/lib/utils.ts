import { format, parseISO, isAfter, isBefore, isEqual } from "date-fns";
import { SESSION_VISIBILITY_CONFIG, type CalendarViewMode } from "./constants";
import type {
  TrainingSession,
  TrainingSessionWithDetails,
  SessionHistoryEntry,
  CreateSessionData,
} from "./types";

// Date/time utilities
export const formatSessionTime = (start: string, end: string): string => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`;
};

export const formatSessionDate = (date: string): string => {
  return format(parseISO(date), "MMM dd, yyyy");
};

export const calculateSessionDuration = (
  start: string,
  end: string
): number => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)); // minutes
};

// Extended type for sessions with trainer name (from database views)
interface SessionWithTrainerName extends TrainingSession {
  trainer_name?: string;
  session_category?: string;
}

// NOTE: Calendar functionality is deprecated and will be removed in US-006
// Keeping this as a stub to prevent breaking existing code
export const transformSessionToCalendarEvent = (
  session: TrainingSession | TrainingSessionWithDetails | SessionWithTrainerName
): Record<string, unknown> => {
  // Deprecated: Calendar events being replaced with machine slot grid
  // Return minimal structure to prevent breaks until US-006 cleanup
  return {
    id: session.id,
    title: session.trainer_name || "Session",
    start: parseISO(session.scheduled_start),
    end: parseISO(session.scheduled_end),
    trainer_name: session.trainer_name,
    participant_count: session.current_participants,
    status: session.status,
  };
};

// Validation utilities
export const isTimeSlotAvailable = (
  newStart: string,
  newEnd: string,
  existingSessions: TrainingSession[],
  excludeSessionId?: string
): boolean => {
  const newStartDate = parseISO(newStart);
  const newEndDate = parseISO(newEnd);

  return !existingSessions.some((session) => {
    if (excludeSessionId && session.id === excludeSessionId) {
      return false;
    }

    if (session.status === "cancelled") {
      return false;
    }

    const existingStart = parseISO(session.scheduled_start);
    const existingEnd = parseISO(session.scheduled_end);

    // Check for overlap
    return (
      (isAfter(newStartDate, existingStart) &&
        isBefore(newStartDate, existingEnd)) ||
      (isAfter(newEndDate, existingStart) &&
        isBefore(newEndDate, existingEnd)) ||
      (isBefore(newStartDate, existingStart) &&
        isAfter(newEndDate, existingEnd)) ||
      isEqual(newStartDate, existingStart) ||
      isEqual(newEndDate, existingEnd)
    );
  });
};

export const getSessionConflicts = (
  newStart: string,
  newEnd: string,
  existingSessions: TrainingSession[],
  excludeSessionId?: string
): TrainingSession[] => {
  const newStartDate = parseISO(newStart);
  const newEndDate = parseISO(newEnd);

  return existingSessions.filter((session) => {
    if (excludeSessionId && session.id === excludeSessionId) {
      return false;
    }

    if (session.status === "cancelled") {
      return false;
    }

    const existingStart = parseISO(session.scheduled_start);
    const existingEnd = parseISO(session.scheduled_end);

    // Check for overlap
    return (
      (isAfter(newStartDate, existingStart) &&
        isBefore(newStartDate, existingEnd)) ||
      (isAfter(newEndDate, existingStart) &&
        isBefore(newEndDate, existingEnd)) ||
      (isBefore(newStartDate, existingStart) &&
        isAfter(newEndDate, existingEnd)) ||
      isEqual(newStartDate, existingStart) ||
      isEqual(newEndDate, existingEnd)
    );
  });
};

// Form data utilities (simplified)
export const prepareSessionData = (
  formData: CreateSessionData
): CreateSessionData => {
  return {
    ...formData,
    // Validation of start/end times handled by Zod schemas
  };
};

// Session status utilities
export const getSessionStatusColor = (status: string): string => {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
    case "in_progress":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  }
};

// Session category utilities
export const getSessionCategoryColor = (category: string): string => {
  switch (category?.toLowerCase()) {
    case "trial":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
    case "standard":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
    case "premium":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
    case "group":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300";
    case "personal":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  }
};

// History and analytics utilities
export const calculateAttendanceRate = (
  currentParticipants: number,
  maxParticipants: number
): number => {
  if (maxParticipants === 0) return 0;
  return Math.round((currentParticipants / maxParticipants) * 100);
};

export const groupSessionsByDate = (
  sessions: SessionHistoryEntry[]
): Record<string, SessionHistoryEntry[]> => {
  return sessions.reduce(
    (groups, session) => {
      const date = format(parseISO(session.scheduled_start), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
      return groups;
    },
    {} as Record<string, SessionHistoryEntry[]>
  );
};

// Dynamic minimum height calculation utilities
export const calculateSessionMinHeight = (
  durationMinutes: number,
  viewMode: CalendarViewMode = "standard"
): number => {
  const config = SESSION_VISIBILITY_CONFIG.minHeights[viewMode];
  const thresholds = SESSION_VISIBILITY_CONFIG.thresholds;

  if (durationMinutes <= thresholds.veryShort) {
    return config.veryShort;
  } else if (durationMinutes <= thresholds.short) {
    return config.short;
  } else {
    return config.normal;
  }
};

// NOTE: Calendar functionality is deprecated (US-006)
// Keeping as stub for backwards compatibility
export const createEventPropGetter = (
  viewMode: CalendarViewMode = "standard",
  currentView: string = "week"
) => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any, // Deprecated: was TrainingSessionCalendarEvent
    start: Date,
    end: Date,
    _isSelected: boolean // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    // Calendar being replaced with machine slot grid
    if (currentView === "month") {
      return {
        style: {},
        className: "",
      };
    }

    const durationMinutes = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60)
    );
    const minHeight = calculateSessionMinHeight(durationMinutes, viewMode);
    const displayClass = getSessionDisplayClass(durationMinutes, viewMode);

    return {
      style: {
        minHeight: minHeight > 0 ? `${minHeight}px` : undefined,
        height:
          minHeight > 0 ? `max(${minHeight}px, 100%) !important` : undefined,
      },
      className: displayClass,
    };
  };
};

// Legacy function - kept for backwards compatibility but will be removed
export const getSessionDynamicStyle = (
  start: Date,
  end: Date,
  viewMode: CalendarViewMode = "standard"
): React.CSSProperties => {
  const durationMinutes = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60)
  );
  const minHeight = calculateSessionMinHeight(durationMinutes, viewMode);

  return {
    minHeight: minHeight > 0 ? `${minHeight}px` : "auto",
    height: minHeight > 0 ? `max(${minHeight}px, 100%)` : "100%",
  };
};

export const getSessionDisplayClass = (
  durationMinutes: number,
  viewMode: CalendarViewMode = "standard"
): string => {
  const thresholds = SESSION_VISIBILITY_CONFIG.thresholds;
  const baseClass = viewMode === "compact" ? "event-compact" : "event-standard";

  if (durationMinutes <= thresholds.veryShort) {
    return `${baseClass} event-very-short`;
  } else if (durationMinutes <= thresholds.short) {
    return `${baseClass} event-short`;
  } else {
    return `${baseClass} event-normal`;
  }
};
