import { supabase } from "@/lib/supabase";
import type {
  SubscriptionPlan,
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
 * Retrieves all subscription plans (both active and inactive) ordered by name
 * @returns Promise<SubscriptionPlanWithSessions[]> Array of all plans
 */
export async function getAllPlans(): Promise<SubscriptionPlanWithSessions[]> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data as SubscriptionPlanWithSessions[];
}

/**
 * Retrieves all active subscription plans ordered by name
 * @returns Promise<SubscriptionPlanWithSessions[]> Array of active plans
 */
export async function getActivePlans(): Promise<
  SubscriptionPlanWithSessions[]
> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

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

/**
 * Creates a new subscription plan
 * @param planData - The plan data to create
 * @returns Promise<SubscriptionPlan> The created plan
 */
export async function createSubscriptionPlan(
  planData: Omit<SubscriptionPlan, "id" | "created_at" | "updated_at">
): Promise<SubscriptionPlan> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .insert([planData])
    .select()
    .single();

  if (error) throw error;
  return data as SubscriptionPlan;
}

/**
 * Updates an existing subscription plan
 * @param planId - The ID of the plan to update
 * @param planData - The plan data to update
 * @returns Promise<SubscriptionPlan> The updated plan
 */
export async function updateSubscriptionPlan(
  planId: string,
  planData: Partial<SubscriptionPlan>
): Promise<SubscriptionPlan> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .update({ ...planData, updated_at: new Date().toISOString() })
    .eq("id", planId)
    .select()
    .single();

  if (error) throw error;
  return data as SubscriptionPlan;
}

/**
 * Deletes a subscription plan
 * @param planId - The ID of the plan to delete
 * @returns Promise<void>
 */
export async function deleteSubscriptionPlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from("subscription_plans")
    .delete()
    .eq("id", planId);

  if (error) throw error;
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

/**
 * Retrieves all subscriptions across all members with filtering and pagination
 * @param params - Filter and pagination parameters
 * @returns Promise<{subscriptions: MemberSubscriptionWithSnapshot[], totalCount: number}> Paginated subscriptions
 */
export async function getAllSubscriptions({
  search,
  status,
  page = 1,
  limit = 20,
}: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{
  subscriptions: MemberSubscriptionWithSnapshot[];
  totalCount: number;
}> {
  let query = supabase
    .from("member_subscriptions")
    .select(
      `
      *,
      members!inner(
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  // Apply status filter
  if (status) {
    query = query.eq("status", status);
  }

  // Apply search filter (search in member name or plan name)
  if (search) {
    query = query.or(
      `plan_name_snapshot.ilike.%${search}%,members.first_name.ilike.%${search}%,members.last_name.ilike.%${search}%`
    );
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    subscriptions: data as MemberSubscriptionWithSnapshot[],
    totalCount: count || 0,
  };
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
