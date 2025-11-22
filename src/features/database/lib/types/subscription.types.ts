// Subscription and payment-related types

import type {
  SubscriptionStatus,
  PaymentStatus,
  PaymentMethod,
} from "./enums.types";

// Subscription Plans
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

/**
 * Enhanced subscription plan with session tracking capabilities
 * Extends the base SubscriptionPlan with session count
 */
export interface SubscriptionPlanWithSessions extends SubscriptionPlan {
  /** Number of sessions included in this plan */
  sessions_count: number;
}

// Member Subscriptions
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

// Subscription Payments
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
