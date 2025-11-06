// TypeScript types for Studio Settings

export interface OpeningHoursDay {
  is_open: boolean;
  open_time: string | null; // "HH:MM" format or null if closed
  close_time: string | null; // "HH:MM" format or null if closed
}

export interface OpeningHoursWeek {
  monday: OpeningHoursDay;
  tuesday: OpeningHoursDay;
  wednesday: OpeningHoursDay;
  thursday: OpeningHoursDay;
  friday: OpeningHoursDay;
  saturday: OpeningHoursDay;
  sunday: OpeningHoursDay;
}

export interface StudioSettings {
  id: string;
  setting_key: string;
  setting_value: OpeningHoursWeek | unknown;
  effective_from: string | null; // ISO date string or null for immediate effect
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// Planning Settings Types
export interface PlanningSettings {
  id: string;
  subscription_warning_days: number;
  body_checkup_sessions: number;
  payment_reminder_days: number;
  max_sessions_per_week: number;
  inactivity_months: number;
  created_at: string;
  updated_at: string;
}

export interface UpdatePlanningSettingsInput {
  subscription_warning_days?: number;
  body_checkup_sessions?: number;
  payment_reminder_days?: number;
  max_sessions_per_week?: number;
  inactivity_months?: number;
}

// Multi-Site Session Types
export interface MultiSiteSession {
  id: string;
  scheduled_start: string; // ISO timestamp
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_gym_name: string | null;
  trainer_id: string | null;
  trainer_name?: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  session_date: string; // YYYY-MM-DD
  session_time: string; // HH:MM
}

export interface MultiSiteSessionFilters {
  search?: string; // Search by member name
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  origin_studio?: string; // Filter by gym name
}

export interface MultiSiteSessionExportData {
  date: string;
  full_name: string;
  origin_studio: string;
}
