import type {
  Member,
  TrainerWithProfile,
  SessionType,
  ReferralSource,
} from "@/features/database/lib/types";

// Machine interface (represents training machines in the gym)
export interface Machine {
  id: string;
  machine_number: 1 | 2 | 3;
  name: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// Time slot for the machine slot grid (30-minute intervals)
export interface TimeSlot {
  start: Date;
  end: Date;
  label: string; // e.g., "09:00 - 09:30"
  hour: number; // Hour of the day (0-23)
  minute: number; // Minute of the hour (0, 30)
}

// Participant in training session (from database view)
export interface SessionParticipant {
  id: string;
  name: string;
  email: string;
}

// Training session type matching database view
export interface TrainingSession {
  id: string;
  machine_id: string; // Required: Machine assignment
  machine_number?: 1 | 2 | 3; // Optional: From view join
  machine_name?: string; // Optional: From view join
  trainer_id: string | null; // Nullable: Trainer assigned at completion
  scheduled_start: string; // ISO string
  scheduled_end: string; // ISO string
  session_date?: string; // Date string (YYYY-MM-DD)
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  session_type: SessionType; // Session type from database
  notes: string | null;
  trainer_user_id?: string; // From calendar view
  trainer_name?: string; // From calendar view join
  participants?: SessionParticipant[]; // From calendar view (array of participants)
  created_at?: string;
  updated_at?: string;
  // Planning indicator data (optional, from get_sessions_with_planning_indicators)
  member_id?: string;
  subscription_end_date?: string | null;
  latest_payment_date?: string | null;
  latest_checkup_date?: string | null;
  sessions_since_checkup?: number | null;
  outstanding_balance?: number | null;

  // Guest information (for multi_site and collaboration sessions)
  guest_first_name?: string | null;
  guest_last_name?: string | null;
  guest_gym_name?: string | null;
  collaboration_details?: string | null;
}

// No separate progress notes - using simple notes field instead

// Extended session with relationships (overrides participants type)
export interface TrainingSessionWithDetails
  extends Omit<TrainingSession, "participants"> {
  trainer?: TrainerWithProfile;
  participants?: TrainingSessionMember[];
}

// Member participation in session
export interface TrainingSessionMember {
  id: string;
  session_id: string;
  member_id: string;
  booking_status: "confirmed" | "cancelled";
  created_at: string;
  member?: Member;
}

// Simplified form data types
export interface CreateSessionData {
  machine_id: string; // Required: Machine assignment
  trainer_id?: string | null; // Optional: Trainer assigned at completion
  scheduled_start: string;
  scheduled_end: string;
  session_type: SessionType;

  // Member selection (optional - not needed for guest sessions)
  member_id?: string;

  // Trial session - quick registration
  new_member_first_name?: string;
  new_member_last_name?: string;
  new_member_phone?: string;
  new_member_email?: string;
  new_member_gender?: "male" | "female";
  new_member_referral_source?: ReferralSource;

  // Guest session data (multi_site)
  guest_first_name?: string;
  guest_last_name?: string;
  guest_gym_name?: string;

  // Collaboration session data
  collaboration_details?: string;

  notes?: string;
}

export interface UpdateSessionData {
  machine_id?: string; // Optional: Change machine assignment
  trainer_id?: string | null; // Optional: Can clear trainer
  scheduled_start?: string;
  scheduled_end?: string;
  session_type?: SessionType;
  notes?: string;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  member_id?: string; // Single member (not array)

  // Guest fields (for updates)
  guest_first_name?: string;
  guest_last_name?: string;
  guest_gym_name?: string;
  collaboration_details?: string;
}

// API response types
export interface SessionAvailabilityCheck {
  available: boolean;
  conflicts: TrainingSession[];
  message?: string;
}

export interface BulkSessionOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

// Simplified filter and search types
export interface SessionFilters {
  machine_id?: string; // NEW: Filter by machine
  trainer_id?: string;
  member_id?: string; // Support filtering by member
  status?: "scheduled" | "completed" | "cancelled" | "all";
  date_range?: {
    start: Date;
    end: Date;
  };
}

// Studio session limit (for capacity management)
export interface StudioSessionLimit {
  current_count: number;
  max_allowed: number;
  can_book: boolean;
  percentage: number;
}

// Week range for session limit calculations (Monday-Sunday)
export interface WeekRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

// Daily session statistics for calendar views
export interface DailyStatistics {
  date: string; // YYYY-MM-DD format
  total: number; // Total non-cancelled sessions
  standard: number; // Count of standard sessions
  trial: number; // Count of trial sessions
}
