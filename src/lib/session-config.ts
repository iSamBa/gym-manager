export const SESSION_CONFIG = {
  // Session durations in milliseconds
  DEFAULT_SESSION: 8 * 60 * 60 * 1000, // 8 hours
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REMEMBER_ME_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
  WARNING_BEFORE_LOGOUT: 5 * 60 * 1000, // 5 minutes
  ACTIVITY_CHECK_INTERVAL: 60 * 1000, // Check every minute
} as const;

export const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
] as const;

export type ActivityEvent = (typeof ACTIVITY_EVENTS)[number];
