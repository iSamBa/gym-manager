import { supabase } from "@/lib/supabase";
import type {
  SubscriptionPaymentWithReceipt,
  RecordPaymentInput,
  MemberSubscriptionWithSnapshot,
  PaymentMethod,
  PaymentStatus,
} from "@/features/database/lib/types";

type PaymentWithMember = {
  id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  receipt_number: string;
  payment_date: string;
  refund_amount?: number;
  member_id: string;
  subscription_id?: string;
  members?: {
    first_name: string;
    last_name: string;
  };
};

export const paymentUtils = {
  /**
   * Record a payment for a subscription or standalone payment
   */
  async recordPayment(
    input: RecordPaymentInput
  ): Promise<SubscriptionPaymentWithReceipt> {
    let memberId = input.member_id;

    // If subscription_id is provided, get member_id from subscription
    if (input.subscription_id) {
      const { data: subscription, error: subError } = await supabase
        .from("member_subscriptions")
        .select("member_id, total_amount_snapshot, paid_amount")
        .eq("id", input.subscription_id)
        .single();

      if (subError) throw subError;
      memberId = subscription.member_id;
    }

    // Ensure we have a member_id (either from subscription or directly provided)
    if (!memberId) {
      throw new Error("member_id is required for standalone payments");
    }

    const paymentData = {
      subscription_id: input.subscription_id || null,
      member_id: memberId,
      amount: input.amount,
      payment_method: input.payment_method,
      payment_date: input.payment_date || new Date().toISOString(),
      payment_status: "completed" as const,
      due_date: input.subscription_id ? new Date().toISOString() : null, // Only set due_date for subscription payments
      reference_number: input.reference_number,
      notes: input.notes,
      // Note: created_by column doesn't exist in subscription_payments table
    };

    console.log("Payment data being inserted:", paymentData);

    const { data, error } = await supabase
      .from("subscription_payments")
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(
        `Database error: ${error.message || error.code || "Unknown error"}`
      );
    }

    // Update subscription paid_amount only if this payment is linked to a subscription
    if (input.subscription_id) {
      await this.updateSubscriptionPaidAmount(input.subscription_id);
    }

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
   * Get all payments with filtering and pagination
   */
  async getAllPayments(
    params: {
      search?: string;
      paymentMethod?: PaymentMethod;
      paymentStatus?: PaymentStatus;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const {
      search,
      paymentMethod,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = params;

    let query = supabase.from("subscription_payments").select(
      `
        id,
        amount,
        payment_method,
        payment_status,
        receipt_number,
        payment_date,
        refund_amount,
        member_id,
        subscription_id,
        members!inner(
          first_name,
          last_name
        )
      `,
      { count: "exact" }
    );

    // Apply filters
    if (search) {
      query = query.or(
        `members.first_name.ilike.%${search}%,members.last_name.ilike.%${search}%,receipt_number.ilike.%${search}%`
      );
    }

    if (paymentMethod) {
      query = query.eq("payment_method", paymentMethod);
    }

    if (paymentStatus) {
      query = query.eq("payment_status", paymentStatus);
    }

    if (startDate) {
      query = query.gte("payment_date", startDate);
    }

    if (endDate) {
      query = query.lte("payment_date", endDate);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .order("payment_date", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform the data to match the expected interface
    const payments =
      (data as PaymentWithMember[])?.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        receipt_number: payment.receipt_number,
        payment_date: payment.payment_date,
        member: {
          first_name: payment.members?.first_name || "Unknown",
          last_name: payment.members?.last_name || "Member",
        },
      })) || [];

    // Calculate summary
    const { data: summaryData, error: summaryError } = await supabase
      .from("subscription_payments")
      .select("amount, refund_amount, payment_status");

    if (summaryError) throw summaryError;

    const summary = {
      totalRevenue: summaryData
        .filter((p) => p.payment_status === "completed")
        .reduce((sum, p) => sum + p.amount, 0),
      totalRefunded: summaryData.reduce(
        (sum, p) => sum + (p.refund_amount || 0),
        0
      ),
      paymentCount: summaryData.length,
    };

    return {
      payments,
      totalCount: count || 0,
      summary,
    };
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
