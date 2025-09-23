import { supabase } from "@/lib/supabase";
import type {
  SubscriptionPlanWithSessions,
  MemberSubscriptionWithSnapshot,
  SubscriptionPaymentWithReceipt,
} from "./types";

/**
 * Database utility functions for subscription management
 * Uses the standard Supabase client for runtime queries
 */

// Plan operations
/**
 * Retrieves all active subscription plans ordered by sort_order
 * @returns Promise<SubscriptionPlanWithSessions[]> Array of active plans
 */
export async function getActivePlans(): Promise<
  SubscriptionPlanWithSessions[]
> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data as SubscriptionPlanWithSessions[];
}

/**
 * Retrieves a specific subscription plan by ID
 * @param planId - The ID of the plan to retrieve
 * @returns Promise<SubscriptionPlanWithSessions> The subscription plan
 */
export async function getPlanById(
  planId: string
): Promise<SubscriptionPlanWithSessions | null> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (error) throw error;
  return data as SubscriptionPlanWithSessions;
}

// Subscription operations
/**
 * Retrieves the active subscription for a member
 * @param memberId - The ID of the member
 * @returns Promise<MemberSubscriptionWithSnapshot | null> Active subscription or null if none found
 */
export async function getMemberActiveSubscription(
  memberId: string
): Promise<MemberSubscriptionWithSnapshot | null> {
  const { data, error } = await supabase
    .from("member_subscriptions")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "active")
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
  return data as MemberSubscriptionWithSnapshot | null;
}

/**
 * Retrieves the subscription history for a member
 * @param memberId - The ID of the member
 * @returns Promise<MemberSubscriptionWithSnapshot[]> Array of member subscriptions
 */
export async function getMemberSubscriptionHistory(
  memberId: string
): Promise<MemberSubscriptionWithSnapshot[]> {
  const { data, error } = await supabase
    .from("member_subscriptions")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as MemberSubscriptionWithSnapshot[];
}

// Payment operations
/**
 * Retrieves all payments for a specific subscription
 * @param subscriptionId - The ID of the subscription
 * @returns Promise<SubscriptionPaymentWithReceipt[]> Array of payments for the subscription
 */
export async function getSubscriptionPayments(
  subscriptionId: string
): Promise<SubscriptionPaymentWithReceipt[]> {
  const { data, error } = await supabase
    .from("subscription_payments")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("payment_date", { ascending: false });

  if (error) throw error;
  return data as SubscriptionPaymentWithReceipt[];
}

/**
 * Retrieves all payments for a member across all subscriptions
 * @param memberId - The ID of the member
 * @returns Promise<SubscriptionPaymentWithReceipt[]> Array of all member payments
 */
export async function getMemberAllPayments(
  memberId: string
): Promise<SubscriptionPaymentWithReceipt[]> {
  const { data, error } = await supabase
    .from("subscription_payments")
    .select("*")
    .eq("member_id", memberId)
    .order("payment_date", { ascending: false });

  if (error) throw error;
  return data as SubscriptionPaymentWithReceipt[];
}
