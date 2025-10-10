import type { Member, TrainerWithProfile } from "@/features/database/lib/types";

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
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  session_type?: "trail" | "standard"; // Optional, may not be in all views
  notes: string | null;
  trainer_user_id?: string; // From calendar view
  trainer_name?: string; // From calendar view join
  participants?: SessionParticipant[]; // From calendar view (array of participants)
  created_at?: string;
  updated_at?: string;
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
  booking_status: "confirmed" | "cancelled" | "no_show" | "attended";
  created_at: string;
  member?: Member;
}

// Simplified form data types
export interface CreateSessionData {
  machine_id: string; // Required: Machine assignment
  trainer_id?: string | null; // Optional: Trainer assigned at completion
  scheduled_start: string;
  scheduled_end: string;
  session_type: "trail" | "standard";
  member_id: string; // Single member (not array)
  notes?: string;
}

export interface UpdateSessionData {
  machine_id?: string; // Optional: Change machine assignment
  trainer_id?: string | null; // Optional: Can clear trainer
  scheduled_start?: string;
  scheduled_end?: string;
  session_type?: "trail" | "standard";
  notes?: string;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  member_id?: string; // Single member (not array)
}

// Calendar view types
export type CalendarView = "month" | "week" | "day";

export interface CalendarViewState {
  currentView: CalendarView;
  currentDate: Date;
  selectedSession: TrainingSession | null;
}

// Training session calendar event (for react-big-calendar)
export interface TrainingSessionCalendarEvent extends TrainingSession {
  start: Date;
  end: Date;
  title: string;
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

// Utility functions for computed properties
export function getSessionDurationMinutes(session: TrainingSession): number {
  const start = new Date(session.scheduled_start);
  const end = new Date(session.scheduled_end);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

export function getSessionMemberNames(session: TrainingSession): string {
  if (!session.participants || session.participants.length === 0) {
    return "No members";
  }
  return session.participants.map((p) => p.name).join(", ");
}

export function getSessionMemberCount(session: TrainingSession): number {
  return session.participants?.length || 0;
}
