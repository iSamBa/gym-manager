// Trainer-related types and interfaces

import type { ClassStatus, BookingStatus } from "./enums.types";
import type { EmergencyContact, UserProfile } from "./database.types";

// Trainer Specializations
export interface TrainerSpecialization {
  id: string;
  name: string;
  description?: string;
  certification_required: boolean;
  created_at: string;
}

// Trainers
export interface Trainer {
  id: string;
  date_of_birth?: string;
  hourly_rate?: number;
  commission_rate: number;
  max_clients_per_session: number;
  years_experience?: number;
  certifications?: string[];
  specializations?: string[];
  languages: string[];
  availability?: Record<string, unknown>;
  is_accepting_new_clients: boolean;
  emergency_contact?: EmergencyContact;
  insurance_policy_number?: string;
  background_check_date?: string;
  cpr_certification_expires?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Trainer with user profile and additional details
 * Used for comprehensive trainer display with relationship data
 */
export interface TrainerWithProfile extends Trainer {
  user_profile?: UserProfile;
  specializations_details?: TrainerSpecialization[];
  classes?: Class[];
}

// Classes
export interface Class {
  id: string;
  class_type_id: string;
  trainer_id: string;
  name: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: ClassStatus;
  max_participants?: number;
  current_participants: number;
  waitlist_count: number;
  room_location?: string;
  special_instructions?: string;
  price: number;
  cancellation_cutoff_hours: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Class with trainer and booking details
 * Used for comprehensive class display
 */
export interface ClassWithDetails extends Class {
  trainer?: Trainer & {
    user_profile?: UserProfile;
  };
  bookings?: ClassBooking[];
}

// Class Bookings
export interface ClassBooking {
  id: string;
  class_id: string;
  member_id: string;
  booking_status: BookingStatus;
  booking_date: string;
  payment_amount: number;
  is_drop_in: boolean;
  waitlist_position?: number;
  check_in_time?: string;
  no_show_marked_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
