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
