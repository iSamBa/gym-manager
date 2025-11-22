// Member-related types and interfaces

import type {
  MemberStatus,
  MemberType,
  Gender,
  UniformSize,
  VestSize,
  HipBeltSize,
  ReferralSource,
  TrainingPreference,
} from "./enums.types";
import type { Address } from "./database.types";
import type {
  MemberSubscription,
  SubscriptionPlan,
} from "./subscription.types";

// Core Member interface
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

/**
 * Member with subscription relationship
 * Used for queries that include subscription information
 */
export interface MemberWithSubscription extends Member {
  subscription?: MemberSubscription & {
    plan?: SubscriptionPlan;
  };
  last_payment_date?: string | null;
}

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
