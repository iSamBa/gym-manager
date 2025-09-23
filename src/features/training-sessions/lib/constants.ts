// Session status options (simplified - no categories)
export const SESSION_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

// Common session durations (for reference)
export const COMMON_DURATIONS = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
] as const;

// Calendar view mode configuration
export const CALENDAR_VIEW_MODES = {
  standard: "standard",
  compact: "compact",
} as const;

export type CalendarViewMode =
  (typeof CALENDAR_VIEW_MODES)[keyof typeof CALENDAR_VIEW_MODES];

// Session visibility configuration
export const SESSION_VISIBILITY_CONFIG = {
  minHeights: {
    standard: {
      veryShort: 45, // ≤15 minutes
      short: 45, // 16-30 minutes
      normal: 0, // >30 minutes (proportional)
    },
    compact: {
      veryShort: 60, // ≤15 minutes
      short: 50, // 16-30 minutes
      normal: 40, // >30 minutes minimum
    },
  },
  thresholds: {
    veryShort: 15, // minutes
    short: 30, // minutes
  },
} as const;

// Calendar configuration
export const CALENDAR_CONFIG = {
  defaultView: "week" as const,
  defaultViewMode: CALENDAR_VIEW_MODES.standard as CalendarViewMode,
  views: ["month", "week", "day"] as const,
  step: 15, // 15-minute intervals
  timeslots: 4, // 4 slots per hour (15-minute intervals)
  min: new Date(2024, 0, 1, 9, 0), // 9:00 AM
  max: new Date(2024, 0, 1, 22, 0), // 10:00 PM
  scrollToTime: new Date(2024, 0, 1, 9, 0), // Scroll to 9:00 AM
  formats: {
    timeGutterFormat: "HH:mm",
    eventTimeRangeFormat: (
      { start, end }: { start: Date; end: Date },
      culture?: string,
      localizer?: {
        format: (date: Date, format: string, culture?: string) => string;
      }
    ) => {
      return `${localizer?.format(start, "HH:mm", culture) || start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${localizer?.format(end, "HH:mm", culture) || end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
    },
  },
} as const;

// Simplified form field constants
export const FORM_FIELDS = {
  trainer_id: "trainer_id",
  scheduled_start: "scheduled_start",
  scheduled_end: "scheduled_end",
  location: "location",
  max_participants: "max_participants",
  member_ids: "member_ids",
  notes: "notes",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  TRAINER_NOT_AVAILABLE: "Trainer is not available at the selected time",
  SESSION_CONFLICT: "This time slot conflicts with an existing session",
  MAX_PARTICIPANTS_EXCEEDED: "Maximum number of participants exceeded",
  INVALID_TIME_SLOT: "Invalid time slot selected",
  PAST_DATE_SELECTED: "Cannot schedule sessions in the past",
  MEMBER_ALREADY_BOOKED: "One or more members are already booked for this time",
  TRAINER_MAX_CAPACITY: "Exceeds trainer maximum clients per session",
} as const;
