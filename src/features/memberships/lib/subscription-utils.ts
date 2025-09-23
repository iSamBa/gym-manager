import { supabase } from "@/lib/supabase";
import type {
  MemberSubscriptionWithSnapshot,
  CreateSubscriptionInput,
  UpgradeSubscriptionInput,
  RecordPaymentInput,
} from "@/features/database/lib/types";
import {
  getPlanById,
  getMemberActiveSubscription,
  getMemberSubscriptionHistory,
} from "@/features/database/lib/subscription-db-utils";

export const subscriptionUtils = {
  /**
   * Create a new subscription with plan details snapshotted
   */
  async createSubscriptionWithSnapshot(input: CreateSubscriptionInput) {
    const plan = await getPlanById(input.plan_id);

    if (!plan) {
      throw new Error("Plan not found");
    }

    const subscriptionData = {
      member_id: input.member_id,
      plan_id: input.plan_id,

      // Snapshot plan details at time of purchase
      plan_name_snapshot: plan.name,
      total_sessions_snapshot: plan.sessions_count,
      total_amount_snapshot: plan.price,
      duration_days_snapshot: plan.contract_length_months
        ? plan.contract_length_months * 30
        : 30,

      // Set initial values
      start_date: input.start_date || new Date().toISOString(),
      end_date: input.start_date
        ? new Date(
            new Date(input.start_date).getTime() +
              (plan.contract_length_months
                ? plan.contract_length_months * 30
                : 30) *
                24 *
                60 *
                60 *
                1000
          ).toISOString()
        : new Date(
            Date.now() +
              (plan.contract_length_months
                ? plan.contract_length_months * 30
                : 30) *
                24 *
                60 *
                60 *
                1000
          ).toISOString(),

      status: "active" as const,
      used_sessions: 0,
      paid_amount: input.initial_payment_amount || 0,
      notes: input.notes,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    };

    const { data, error } = await supabase
      .from("member_subscriptions")
      .insert(subscriptionData)
      .select()
      .single();

    if (error) throw error;

    // Record initial payment if provided
    if (input.initial_payment_amount && input.initial_payment_amount > 0) {
      await this.recordPayment({
        subscription_id: data.id,
        amount: input.initial_payment_amount,
        payment_method: input.payment_method || "cash",
        payment_date: input.start_date || new Date().toISOString(),
        notes: "Initial payment for subscription",
      });
    }

    return data as MemberSubscriptionWithSnapshot;
  },

  /**
   * Consume a session from an active subscription
   */
  async consumeSession(subscriptionId: string) {
    // Get current subscription state
    const { data: subscription, error: fetchError } = await supabase
      .from("member_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single();

    if (fetchError) throw fetchError;

    const sub = subscription as MemberSubscriptionWithSnapshot;

    // Validate session consumption
    if (sub.status !== "active") {
      throw new Error("Cannot consume session from inactive subscription");
    }

    if (sub.used_sessions >= sub.total_sessions_snapshot) {
      throw new Error("No sessions remaining in subscription");
    }

    // Increment used sessions
    const newUsedSessions = sub.used_sessions + 1;
    const isCompleted = newUsedSessions >= sub.total_sessions_snapshot;

    const { data, error } = await supabase
      .from("member_subscriptions")
      .update({
        used_sessions: newUsedSessions,
        status: isCompleted ? "expired" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data as MemberSubscriptionWithSnapshot;
  },

  /**
   * Calculate upgrade credit from remaining sessions
   */
  calculateUpgradeCredit(subscription: MemberSubscriptionWithSnapshot): number {
    const remainingSessions =
      subscription.total_sessions_snapshot - subscription.used_sessions;
    if (remainingSessions <= 0) return 0;

    const pricePerSession =
      subscription.total_amount_snapshot / subscription.total_sessions_snapshot;
    return remainingSessions * pricePerSession;
  },

  /**
   * Upgrade subscription to a new plan
   */
  async upgradeSubscription(input: UpgradeSubscriptionInput) {
    const currentSub = await supabase
      .from("member_subscriptions")
      .select("*")
      .eq("id", input.current_subscription_id)
      .single();

    if (currentSub.error) throw currentSub.error;

    const newPlan = await getPlanById(input.new_plan_id);
    if (!newPlan) {
      throw new Error("New plan not found");
    }

    const credit = this.calculateUpgradeCredit(
      currentSub.data as MemberSubscriptionWithSnapshot
    );

    if (credit !== input.credit_amount) {
      throw new Error("Credit amount mismatch");
    }

    // Create new subscription
    const newSubscription = await this.createSubscriptionWithSnapshot({
      member_id: currentSub.data.member_id,
      plan_id: input.new_plan_id,
      start_date: input.effective_date || new Date().toISOString(),
      initial_payment_amount: Math.max(0, newPlan.price - credit),
      notes: `Upgraded from ${currentSub.data.plan_name_snapshot}. Credit applied: $${credit.toFixed(2)}`,
    });

    // Mark old subscription as upgraded
    await supabase
      .from("member_subscriptions")
      .update({
        status: "cancelled" as const, // Use existing enum value until 'upgraded' is added
        upgraded_to_id: newSubscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.current_subscription_id);

    return newSubscription;
  },

  /**
   * Pause an active subscription
   */
  async pauseSubscription(subscriptionId: string, reason?: string) {
    const { data, error } = await supabase
      .from("member_subscriptions")
      .update({
        status: "paused",
        pause_start_date: new Date().toISOString(),
        pause_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)
      .eq("status", "active")
      .select()
      .single();

    if (error) throw error;
    return data as MemberSubscriptionWithSnapshot;
  },

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId: string) {
    const { data, error } = await supabase
      .from("member_subscriptions")
      .update({
        status: "active",
        pause_end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)
      .eq("status", "paused")
      .select()
      .single();

    if (error) throw error;
    return data as MemberSubscriptionWithSnapshot;
  },

  /**
   * Record a payment for a subscription
   */
  async recordPayment(input: RecordPaymentInput) {
    const { data, error } = await supabase
      .from("subscription_payments")
      .insert({
        subscription_id: input.subscription_id,
        amount: input.amount,
        payment_method: input.payment_method,
        payment_date: input.payment_date || new Date().toISOString(),
        payment_status: "completed",
        reference_number: input.reference_number,
        notes: input.notes,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Update subscription paid_amount
    await this.updateSubscriptionPaidAmount(input.subscription_id);

    return data;
  },

  /**
   * Update the total paid amount for a subscription
   */
  async updateSubscriptionPaidAmount(subscriptionId: string) {
    // Calculate total paid from all payments
    const { data: payments, error: paymentsError } = await supabase
      .from("subscription_payments")
      .select("amount")
      .eq("subscription_id", subscriptionId)
      .eq("payment_status", "completed");

    if (paymentsError) throw paymentsError;

    const totalPaid = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const { error } = await supabase
      .from("member_subscriptions")
      .update({
        paid_amount: totalPaid,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (error) throw error;
  },

  /**
   * Get subscription with computed fields
   */
  async getSubscriptionWithDetails(subscriptionId: string) {
    const { data: subscription, error } = await supabase
      .from("member_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single();

    if (error) throw error;

    const sub = subscription as MemberSubscriptionWithSnapshot;

    // Add computed fields
    sub.remaining_sessions = Math.max(
      0,
      sub.total_sessions_snapshot - sub.used_sessions
    );
    sub.balance_due = Math.max(0, sub.total_amount_snapshot - sub.paid_amount);
    sub.completion_percentage =
      (sub.used_sessions / sub.total_sessions_snapshot) * 100;

    // Calculate days remaining
    if (sub.end_date) {
      const daysRemaining = Math.ceil(
        (new Date(sub.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      sub.days_remaining = Math.max(0, daysRemaining);
    }

    return sub;
  },

  /**
   * Get member's active subscription - wrapper around database util
   */
  getMemberActiveSubscription,

  /**
   * Get member's subscription history - wrapper around database util
   */
  getMemberSubscriptionHistory,
};
