import type { SessionType } from "@/features/database/lib/types";

// Session type labels for display
export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  trial: "Trial",
  member: "Member",
  contractual: "Contractual",
  makeup: "Make-up",
  multi_site: "Multi-Site",
  collaboration: "Collaboration",
  non_bookable: "Non-Bookable",
};

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
