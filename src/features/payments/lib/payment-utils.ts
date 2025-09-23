import { supabase } from "@/lib/supabase";
import type {
  SubscriptionPaymentWithReceipt,
  RecordPaymentInput,
  MemberSubscriptionWithSnapshot,
  PaymentMethod,
} from "@/features/database/lib/types";

export const paymentUtils = {
  /**
   * Record a payment for a subscription
   */
  async recordPayment(
    input: RecordPaymentInput
  ): Promise<SubscriptionPaymentWithReceipt> {
    // Get the subscription to verify member_id
    const { data: subscription, error: subError } = await supabase
      .from("member_subscriptions")
      .select("member_id, total_amount_snapshot, paid_amount")
      .eq("id", input.subscription_id)
      .single();

    if (subError) throw subError;

    const paymentData = {
      subscription_id: input.subscription_id,
      member_id: subscription.member_id,
      amount: input.amount,
      payment_method: input.payment_method,
      payment_date: input.payment_date || new Date().toISOString(),
      payment_status: "completed" as const,
      reference_number: input.reference_number,
      notes: input.notes,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    };

    const { data, error } = await supabase
      .from("subscription_payments")
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;

    // Update subscription paid_amount
    await this.updateSubscriptionPaidAmount(input.subscription_id);

    return data as SubscriptionPaymentWithReceipt;
  },

  /**
   * Update the total paid amount for a subscription
   */
  async updateSubscriptionPaidAmount(subscriptionId: string) {
    // Calculate total paid from all completed payments
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

    return totalPaid;
  },

  /**
   * Get all payments for a subscription
   */
  async getSubscriptionPayments(
    subscriptionId: string
  ): Promise<SubscriptionPaymentWithReceipt[]> {
    const { data, error } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("subscription_id", subscriptionId)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data as SubscriptionPaymentWithReceipt[];
  },

  /**
   * Get all payments for a member across all subscriptions
   */
  async getMemberPayments(
    memberId: string
  ): Promise<SubscriptionPaymentWithReceipt[]> {
    const { data, error } = await supabase
      .from("subscription_payments")
      .select(
        `
        *,
        member_subscriptions!inner(plan_name_snapshot)
      `
      )
      .eq("member_id", memberId)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data as SubscriptionPaymentWithReceipt[];
  },

  /**
   * Calculate balance information for a subscription
   */
  calculateBalanceInfo(subscription: MemberSubscriptionWithSnapshot) {
    const totalAmount = subscription.total_amount_snapshot;
    const paidAmount = subscription.paid_amount;
    const balance = Math.max(0, totalAmount - paidAmount);
    const paidPercentage =
      totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    return {
      totalAmount,
      paidAmount,
      balance,
      paidPercentage,
      isFullyPaid: balance === 0,
      isOverpaid: paidAmount > totalAmount,
    };
  },

  /**
   * Process a refund for a payment
   */
  async processRefund(paymentId: string, refundAmount: number, reason: string) {
    const { data: payment, error: fetchError } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchError) throw fetchError;

    if (refundAmount > payment.amount) {
      throw new Error("Refund amount cannot exceed original payment amount");
    }

    const { data, error } = await supabase
      .from("subscription_payments")
      .update({
        refund_amount: refundAmount,
        refund_date: new Date().toISOString(),
        refund_reason: reason,
        payment_status:
          refundAmount === payment.amount ? "refunded" : "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (error) throw error;

    // Update subscription paid amount
    await this.updateSubscriptionPaidAmount(payment.subscription_id);

    return data as SubscriptionPaymentWithReceipt;
  },

  /**
   * Get payment statistics for reporting
   */
  async getPaymentStats(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from("subscription_payments")
      .select("amount, payment_method, payment_date")
      .gte("payment_date", startDate)
      .lte("payment_date", endDate)
      .eq("payment_status", "completed");

    if (error) throw error;

    const stats = {
      totalRevenue: data.reduce((sum, payment) => sum + payment.amount, 0),
      paymentCount: data.length,
      averagePayment:
        data.length > 0
          ? data.reduce((sum, payment) => sum + payment.amount, 0) / data.length
          : 0,
      paymentMethodBreakdown: data.reduce(
        (acc, payment) => {
          const method = payment.payment_method as PaymentMethod;
          acc[method] = (acc[method] || 0) + payment.amount;
          return acc;
        },
        {} as Record<PaymentMethod, number>
      ),
    };

    return stats;
  },
};
