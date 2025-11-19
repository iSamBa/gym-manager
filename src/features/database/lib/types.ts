// Database types generated from schema
// This file contains TypeScript types for all database entities

// Enums
export type UserRole = "admin" | "trainer" | "member";
export type MemberType = "trial" | "full" | "collaboration";
export type MemberStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "expired"
  | "pending";
export type Gender = "male" | "female";
export type PartnershipType =
  | "influencer"
  | "corporate"
  | "brand"
  | "media"
  | "other";
export type EquipmentStatus =
  | "active"
  | "maintenance"
  | "out_of_order"
  | "retired";
// MaintenanceStatus - REMOVED: maintenance system not implemented
// MaintenanceType - REMOVED: maintenance system not implemented
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
// ClassDifficulty - REMOVED: classes table has no difficulty column
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
  | "trial" // Try-out session for new members (creates trial member)
  | "member" // Regular member session (renamed from 'standard')
  | "contractual" // Contract signing session (trial members only)
  | "multi_site" // Member from another gym in group (guest)
  | "collaboration" // Commercial partnership/influencer (guest)
  | "makeup" // Additional session (bypasses weekly limit)
  | "non_bookable"; // Time blocker (no member needed)
export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled";

// Member Profile Enhancement - Equipment & Referral Tracking
export type UniformSize = "XS" | "S" | "M" | "L" | "XL";
export type VestSize =
  | "V1"
  | "V2"
  | "V2_SMALL_EXT"
  | "V2_LARGE_EXT"
  | "V2_DOUBLE_EXT";
export type HipBeltSize = "V1" | "V2";
export type ReferralSource =
  | "instagram"
  | "member_referral"
  | "website_ib"
  | "prospection"
  | "studio"
  | "phone"
  | "chatbot";
export type TrainingPreference = "mixed" | "women_only";

// Address interface for JSON field
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// Business address interface for general settings
export interface BusinessAddress {
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

// Emergency contact interface for JSON field
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

// General Settings (for studio-wide configuration)
export interface GeneralSettings {
  business_name: string;
  business_address: BusinessAddress;
  tax_id: string; // ICE number
  phone: string;
  email: string;
  logo_url?: string; // Path to logo in Supabase Storage
}

// Invoice Settings (invoice-specific configuration)
export interface InvoiceSettings {
  vat_rate: number; // Percentage (e.g., 20 for 20%)
  invoice_footer_notes?: string; // Optional custom footer text
  auto_generate: boolean; // Auto-generate invoice on payment
}

// Collaboration partnership details (for collaboration members)
export interface CollaborationPartnership {
  company_name: string | null;
  partnership_type: PartnershipType | null;
  contract_start_date: string | null; // YYYY-MM-DD
  contract_end_date: string | null; // YYYY-MM-DD
  notes: string | null;
}

// Enhanced Subscription Types from Epic 1

/**
 * Enhanced subscription plan with session tracking capabilities
 * Extends the base SubscriptionPlan with session count
 */
export interface SubscriptionPlanWithSessions extends SubscriptionPlan {
  /** Number of sessions included in this plan */
  sessions_count: number;
}

/**
 * Member subscription with snapshot data preserved from plan at time of purchase
 * Includes tracking and computed fields for session management
 */
export interface MemberSubscriptionWithSnapshot extends MemberSubscription {
  // Snapshot fields from plan at time of purchase
  /** Plan name at time of purchase (preserved) */
  plan_name_snapshot: string;
  /** Total sessions at time of purchase (preserved) */
  total_sessions_snapshot: number;
  /** Total amount at time of purchase (preserved) */
  total_amount_snapshot: number;
  /** Duration in days at time of purchase (preserved) */
  duration_days_snapshot: number;

  // Tracking fields
  /** Number of sessions used by the member */
  used_sessions: number;
  /** Amount paid so far */
  paid_amount: number;
  /** Reference to upgraded subscription if applicable */
  upgraded_to_id?: string;

  // Computed fields (from database or client-side)
  /** Calculated remaining sessions (total - used) */
  remaining_sessions?: number;
  /** Amount still owed */
  balance_due?: number;
  /** Percentage of subscription completed */
  completion_percentage?: number;
  /** Days remaining in subscription */
  days_remaining?: number;

  // Member information (when joined)
  /** Member details when subscription is fetched with member info */
  members?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };
}

/**
 * Subscription payment with receipt tracking
 * Extends SubscriptionPayment with auto-generated receipt numbers
 */
export interface SubscriptionPaymentWithReceipt extends SubscriptionPayment {
  /** Auto-generated receipt number (format: RCPT-YYYY-XXXX) */
  receipt_number: string;
  /** Optional external reference number */
  reference_number?: string;
}

/**
 * Subscription payment with receipt and subscription details
 * Used when displaying payments with plan information
 */
export interface SubscriptionPaymentWithReceiptAndPlan
  extends SubscriptionPaymentWithReceipt {
  /** Subscription details with plan name snapshot */
  member_subscriptions?: {
    plan_name_snapshot: string;
  };
}

// Form/Input types

/**
 * Input data for creating a new subscription
 */
export interface CreateSubscriptionInput {
  /** ID of the member subscribing */
  member_id: string;
  /** ID of the subscription plan */
  plan_id: string;
  /** Optional custom start date (defaults to today) */
  start_date?: string;
  /** Optional initial payment amount */
  initial_payment_amount?: number;
  /** Payment method for initial payment */
  payment_method?: PaymentMethod;
  /** Whether to include signup fees (for new subscriptions) */
  include_signup_fee?: boolean;
  /** Amount of signup fee paid */
  signup_fee_paid?: number;
  /** Optional notes about the subscription */
  notes?: string;
}

/**
 * Input data for recording a payment
 */
export interface RecordPaymentInput {
  /** ID of the subscription being paid for (optional for standalone payments) */
  subscription_id?: string;
  /** ID of the member (required for standalone payments, optional if subscription_id provided) */
  member_id?: string;
  /** Payment amount */
  amount: number;
  /** Method of payment */
  payment_method: PaymentMethod;
  /** Optional payment date (defaults to today) */
  payment_date?: string;
  /** Optional external reference number */
  reference_number?: string;
  /** Optional payment notes */
  notes?: string;
}

/**
 * Input data for upgrading a subscription
 */
export interface UpgradeSubscriptionInput {
  /** ID of the current subscription to upgrade */
  current_subscription_id: string;
  /** ID of the new plan to upgrade to */
  new_plan_id: string;
  /** Credit amount from current subscription */
  credit_amount: number;
  /** Optional effective date for upgrade */
  effective_date?: string;
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
  email: string | null;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: Address;
  profile_picture_url?: string;
  status: MemberStatus;
  join_date: string;
  member_type: MemberType;
  notes?: string;
  medical_conditions?: string;
  fitness_goals?: string;
  preferred_contact_method: string;
  marketing_consent: boolean;
  waiver_signed: boolean;
  waiver_signed_date?: string;
  // Equipment & Referral Tracking (US-001)
  uniform_size: UniformSize;
  uniform_received: boolean;
  vest_size: VestSize;
  hip_belt_size: HipBeltSize;
  referral_source: ReferralSource;
  referred_by_member_id?: string;
  training_preference?: TrainingPreference;
  // Partnership fields (for collaboration members)
  partnership_company?: string | null;
  partnership_type?: string | null;
  partnership_contract_start?: string | null;
  partnership_contract_end?: string | null;
  partnership_notes?: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Partial Member interface matching the fields typically returned in subscription queries
 * Used when only basic member information is needed for display/selection
 */
export interface PartialMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone?: string;
}

// Equipment
// EquipmentCategory table has been removed - equipment categorization not used

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

// EquipmentMaintenanceLog table has been removed - maintenance system not implemented

// Subscriptions
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  signup_fee: number;
  duration_months: number;
  is_active: boolean;
  is_collaboration_plan: boolean;
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
  price: number;
  signup_fee_paid: number;
  renewal_count: number;
  pause_start_date?: string;
  pause_end_date?: string;
  pause_reason?: string;
  cancellation_date?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  notes?: string;
  plan_name_snapshot?: string;
  total_sessions_snapshot?: number;
  total_amount_snapshot?: number;
  duration_days_snapshot?: number;
  used_sessions?: number;
  paid_amount?: number;
  upgraded_to_id?: string;
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
  // New refund system fields
  refunded_payment_id?: string; // References original payment for refunds
  is_refund: boolean; // True if this is a refund entry with negative amount
  refund_metadata?: Record<string, unknown>; // Additional refund details
  notes?: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
}

// PaymentReminder table has been removed - feature not implemented

// Invoices
export interface Invoice {
  id: string;
  invoice_number: string; // Format: DDMMYYYY-XX (e.g., 01052025-01)
  payment_id?: string; // Reference to subscription_payments
  member_id: string;
  subscription_id?: string;
  issue_date: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  // Business info snapshot (from general settings at time of generation)
  business_name?: string;
  business_address?: BusinessAddress;
  business_tax_id?: string;
  business_phone?: string;
  business_email?: string;
  business_logo_url?: string;
  // Invoice configuration snapshot
  vat_rate?: number;
  footer_notes?: string;
  // File storage
  pdf_url?: string; // Path to PDF in Supabase Storage
  status: InvoiceStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Invoice with member details
 * Used when displaying invoices with customer information
 */
export interface InvoiceWithMember extends Invoice {
  members?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

/**
 * Invoice with payment details
 * Used when displaying invoices with payment information
 */
export interface InvoiceWithPayment extends Invoice {
  subscription_payments?: SubscriptionPayment;
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

// ClassType table has been removed - class typing system not used

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

// TrainerSession table has been removed - duplicate of training_sessions

// AttendanceLog table has been removed - attendance system not implemented

// Joined types for queries with relations
export interface MemberWithSubscription extends Member {
  subscription?: MemberSubscription & {
    plan?: SubscriptionPlan;
  };
  last_payment_date?: string | null;
}

// ClassWithDetails simplified - ClassType removed
export interface ClassWithDetails extends Class {
  trainer?: Trainer & {
    user_profile?: UserProfile;
  };
  bookings?: ClassBooking[];
}

// EquipmentWithCategory simplified - category and maintenance removed
// Type alias since no additional fields are needed
export type EquipmentWithCategory = Equipment;

export interface TrainerWithProfile extends Trainer {
  user_profile?: UserProfile;
  specializations_details?: TrainerSpecialization[];
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
  equipment_out_of_order: number;
  // Maintenance tracking removed
}

// Enhanced Member Types for Members Table Rework (US-002)

/**
 * Subscription details for enhanced member view
 * Aggregated from active member_subscriptions
 */
export interface MemberSubscriptionDetails {
  /** Subscription end date */
  end_date: string;
  /** Remaining sessions from subscription */
  remaining_sessions: number;
  /** Outstanding balance (total_amount_snapshot - paid_amount) */
  balance_due: number;
}

/**
 * Session statistics for enhanced member view
 * Aggregated from training_session_members and training_sessions
 */
export interface MemberSessionStats {
  /** Date of last completed/attended session */
  last_session_date: string | null;
  /** Date of next scheduled session */
  next_session_date: string | null;
  /** Count of upcoming confirmed/waitlisted sessions */
  scheduled_sessions_count: number;
}

/**
 * Enhanced member data with subscription, session, and payment info
 * Used for comprehensive member table display
 */
export interface MemberWithEnhancedDetails extends Member {
  /** Active subscription details (null if no active subscription) */
  active_subscription?: MemberSubscriptionDetails | null;
  /** Session statistics (null if no sessions) */
  session_stats?: MemberSessionStats | null;
  /** Date of last completed payment (null if no payments) */
  last_payment_date: string | null;
}

// Member Comments (US-009)

/**
 * Member comment with optional due date for alerts
 * Comments with due_date appear as alerts until the date passes
 */
export interface MemberComment {
  id: string;
  member_id: string;
  author: string;
  body: string;
  due_date?: string;
  created_by?: string;
  created_by_system?: boolean; // True if comment was created by automated system
  created_at: string;
  updated_at: string;
}

// Member Weekly Session Limit (US-001)

/**
 * Return type for check_member_weekly_session_limit RPC function
 * Validates member weekly session limit enforcement
 */
export interface MemberWeeklyLimitResult {
  can_book: boolean;
  current_member_sessions: number;
  max_allowed: number;
  message: string;
}
