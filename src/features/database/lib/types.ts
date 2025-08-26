// Database types generated from schema
// This file contains TypeScript types for all database entities

// Enums
export type UserRole = "admin" | "trainer";
export type MemberStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "expired"
  | "pending";
export type Gender = "male" | "female";
export type EquipmentStatus =
  | "active"
  | "maintenance"
  | "out_of_order"
  | "retired";
export type MaintenanceStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";
export type MaintenanceType =
  | "routine"
  | "repair"
  | "inspection"
  | "calibration"
  | "deep_clean";
export type PlanType =
  | "basic"
  | "premium"
  | "vip"
  | "student"
  | "senior"
  | "corporate";
export type BillingCycle =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "annual";
export type SubscriptionStatus =
  | "active"
  | "paused"
  | "cancelled"
  | "expired"
  | "pending";
export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";
export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "online"
  | "check";
export type ClassDifficulty =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "all_levels";
export type ClassStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";
export type BookingStatus =
  | "confirmed"
  | "waitlisted"
  | "cancelled"
  | "no_show"
  | "attended";
export type SessionType =
  | "personal_training"
  | "small_group"
  | "consultation"
  | "assessment";

// Address interface for JSON field
export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// Emergency contact interface for JSON field
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

// Access hours interface for JSON field
export interface AccessHours {
  all_day?: boolean;
  from?: string; // "HH:MM" format
  to?: string; // "HH:MM" format
}

// Member presence interface for real-time tracking
export interface MemberPresence {
  userId: string;
  username: string;
  action: "viewing" | "editing";
  timestamp: Date;
}

// User Profiles
export interface UserProfile {
  id: string;
  role: UserRole;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  hire_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Members
export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: Address;
  profile_picture_url?: string;
  status: MemberStatus;
  join_date: string;
  notes?: string;
  medical_conditions?: string;
  fitness_goals?: string;
  preferred_contact_method: string;
  marketing_consent: boolean;
  waiver_signed: boolean;
  waiver_signed_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MemberEmergencyContact {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Equipment
export interface EquipmentCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  equipment_number: string;
  name: string;
  brand?: string;
  model?: string;
  category_id?: string;
  description?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expires?: string;
  status: EquipmentStatus;
  location?: string;
  max_weight?: number;
  specifications?: Record<string, unknown>;
  usage_instructions?: string;
  safety_notes?: string;
  qr_code_url?: string;
  image_urls?: string[];
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_interval_days: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentMaintenanceLog {
  id: string;
  equipment_id: string;
  maintenance_type: MaintenanceType;
  status: MaintenanceStatus;
  scheduled_date: string;
  completed_date?: string;
  assigned_to?: string;
  performed_by?: string;
  title: string;
  description?: string;
  work_performed?: string;
  parts_replaced?: string[];
  parts_cost?: number;
  labor_hours?: number;
  labor_cost?: number;
  total_cost?: number;
  notes?: string;
  next_maintenance_date?: string;
  images?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Subscriptions
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  plan_type: PlanType;
  price: number;
  billing_cycle: BillingCycle;
  currency: string;
  features?: string[];
  max_classes_per_month?: number;
  max_personal_training_sessions?: number;
  includes_guest_passes: number;
  access_hours?: AccessHours;
  signup_fee: number;
  cancellation_fee: number;
  freeze_fee: number;
  contract_length_months?: number;
  auto_renew: boolean;
  is_active: boolean;
  sort_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MemberSubscription {
  id: string;
  member_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date?: string;
  next_billing_date?: string;
  billing_cycle: BillingCycle;
  price: number;
  currency: string;
  signup_fee_paid: number;
  auto_renew: boolean;
  renewal_count: number;
  pause_start_date?: string;
  pause_end_date?: string;
  pause_reason?: string;
  cancellation_date?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  member_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_date?: string;
  due_date: string;
  description?: string;
  invoice_number?: string;
  transaction_id?: string;
  payment_processor?: string;
  metadata?: Record<string, unknown>;
  late_fee: number;
  discount_amount: number;
  discount_reason?: string;
  refund_amount: number;
  refund_date?: string;
  refund_reason?: string;
  notes?: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentReminder {
  id: string;
  payment_id: string;
  member_id: string;
  reminder_date: string;
  reminder_type: string;
  status: string;
  sent_at?: string;
  message_content?: string;
  created_at: string;
}

// Trainers and Classes
export interface TrainerSpecialization {
  id: string;
  name: string;
  description?: string;
  certification_required: boolean;
  created_at: string;
}

export interface Trainer {
  id: string;
  trainer_code: string;
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

export interface ClassType {
  id: string;
  name: string;
  description?: string;
  difficulty: ClassDifficulty;
  duration_minutes: number;
  max_participants: number;
  min_participants: number;
  equipment_needed?: string[];
  room_requirements?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

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

export interface TrainerSession {
  id: string;
  trainer_id: string;
  member_id: string;
  session_type: SessionType;
  date: string;
  start_time: string;
  end_time: string;
  status: ClassStatus;
  price: number;
  payment_status: PaymentStatus;
  location?: string;
  goals?: string;
  workout_plan?: string;
  notes?: string;
  member_feedback?: string;
  trainer_notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  member_id: string;
  check_in_time: string;
  check_out_time?: string;
  class_id?: string;
  trainer_session_id?: string;
  location?: string;
  notes?: string;
  created_at: string;
}

// Joined types for queries with relations
export interface MemberWithSubscription extends Member {
  subscription?: MemberSubscription & {
    plan?: SubscriptionPlan;
  };
  emergency_contacts?: MemberEmergencyContact[];
}

export interface ClassWithDetails extends Class {
  class_type?: ClassType;
  trainer?: Trainer & {
    user_profile?: UserProfile;
  };
  bookings?: ClassBooking[];
}

export interface EquipmentWithCategory extends Equipment {
  category?: EquipmentCategory;
  maintenance_logs?: EquipmentMaintenanceLog[];
}

export interface TrainerWithProfile extends Trainer {
  user_profile?: UserProfile;
  specializations_details?: TrainerSpecialization[];
  sessions?: TrainerSession[];
  classes?: Class[];
}

// Database function return types
export interface MembershipStats {
  total_members: number;
  active_members: number;
  new_members_this_month: number;
  churn_rate: number;
}

export interface RevenueStats {
  total_revenue: number;
  monthly_recurring_revenue: number;
  average_revenue_per_member: number;
  outstanding_payments: number;
}

export interface ClassStats {
  total_classes_this_month: number;
  average_attendance_rate: number;
  most_popular_classes: Array<{
    class_type: string;
    booking_count: number;
  }>;
}

export interface EquipmentStats {
  total_equipment: number;
  equipment_needing_maintenance: number;
  equipment_out_of_order: number;
  upcoming_maintenance: EquipmentMaintenanceLog[];
}
