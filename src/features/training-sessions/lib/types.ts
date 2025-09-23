import type { Member, TrainerWithProfile } from "@/features/database/lib/types";

// Simplified training session type
export interface TrainingSession {
  id: string;
  trainer_id: string;
  scheduled_start: string; // ISO string
  scheduled_end: string; // ISO string
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  session_type: "trail" | "standard";
  max_participants: number;
  current_participants: number;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// No separate progress notes - using simple notes field instead

// Extended session with relationships
export interface TrainingSessionWithDetails extends TrainingSession {
  trainer?: TrainerWithProfile;
  participants?: TrainingSessionMember[];
}

// Calendar-specific event format (simplified)
export interface TrainingSessionCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  trainer_name: string;
  participant_count: number;
  max_participants: number;
  location: string | null;
  status: string;
  session_category?: string;
  resource?: {
    trainer_id: string;
    session: TrainingSession;
  };
}

// Member participation in session
export interface TrainingSessionMember {
  id: string;
  session_id: string;
  member_id: string;
  booking_status: "confirmed" | "waitlisted" | "cancelled";
  created_at: string;
  member?: Member;
}

// Simplified form data types
export interface CreateSessionData {
  trainer_id: string;
  scheduled_start: string;
  scheduled_end: string;
  location: string;
  session_type: "trail" | "standard";
  max_participants: number;
  member_ids: string[];
  notes?: string;
}

export interface UpdateSessionData {
  scheduled_start?: string;
  scheduled_end?: string;
  location?: string;
  session_type?: "trail" | "standard";
  max_participants?: number;
  notes?: string;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
}

// Calendar view types
export type CalendarView = "month" | "week" | "day";

export interface CalendarViewState {
  currentView: CalendarView;
  currentDate: Date;
  selectedSession: TrainingSession | null;
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
  trainer_id?: string;
  status?: "scheduled" | "completed" | "cancelled" | "all";
  date_range?: {
    start: Date;
    end: Date;
  };
  location?: string;
}

// Simplified history and analytics types
export interface SessionHistoryEntry {
  session_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  location: string | null;
  trainer_name: string;
  participant_count: number;
  max_participants: number;
  attendance_rate: number;
  duration_minutes: number;
  session_category: string;
  notes?: string;
}

export interface SessionAnalytics {
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  average_attendance_rate: number;
  most_popular_time_slots: Array<{
    time_slot: string;
    session_count: number;
  }>;
  trainer_utilization: Array<{
    trainer_id: string;
    trainer_name: string;
    sessions_count: number;
    utilization_rate: number;
  }>;
  session_trends: Array<{
    period: string;
    session_count: number;
    attendance_rate: number;
    revenue: number;
  }>;
  session_types: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  hourly_distribution: Array<{
    hour: number;
    session_count: number;
    utilization_rate: number;
  }>;
  trainer_performance: Array<{
    trainer_id: string;
    trainer_name: string;
    session_count: number;
    attendance_rate: number;
    revenue: number;
  }>;
}
