import { supabase } from "@/lib/supabase";
import type {
  SubscriptionPaymentWithReceipt,
  RecordPaymentInput,
  MemberSubscriptionWithSnapshot,
  PaymentMethod,
  PaymentStatus,
} from "@/features/database/lib/types";

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
   * Get total refund amount for a payment
   */
  async getPaymentRefundTotal(paymentId: string): Promise<number> {
    const { data: refunds, error } = await supabase
      .from("subscription_payments")
      .select("amount")
      .eq("refunded_payment_id", paymentId)
      .eq("is_refund", true);

    if (error) throw error;

    return refunds.reduce(
      (total, refund) => total + Math.abs(refund.amount),
      0
    );
  },

  /**
   * Process a refund for a payment by creating a new negative amount entry
   */
  async processRefund(paymentId: string, refundAmount: number, reason: string) {
    console.log("Processing refund:", { paymentId, refundAmount, reason });

    // Get the original payment
    const { data: originalPayment, error: fetchError } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchError) {
      console.error("Error fetching original payment:", fetchError);
      throw fetchError;
    }

    console.log("Original payment found:", originalPayment);

    if (originalPayment.is_refund) {
      throw new Error("Cannot refund a refund entry");
    }

    // Get total amount already refunded
    const totalRefunded = await this.getPaymentRefundTotal(paymentId);
    const maxRefundAmount = originalPayment.amount - totalRefunded;

    console.log("Refund calculations:", {
      originalAmount: originalPayment.amount,
      totalRefunded,
      maxRefundAmount,
      requestedRefund: refundAmount,
    });

    if (refundAmount > maxRefundAmount) {
      const error = `Refund amount cannot exceed remaining refundable amount: $${maxRefundAmount.toFixed(2)}`;
      console.error("Validation error:", error);
      throw new Error(error);
    }

    if (refundAmount <= 0) {
      const error = "Refund amount must be greater than 0";
      console.error("Validation error:", error);
      throw new Error(error);
    }

    // Create a new refund entry with negative amount
    const refundData = {
      subscription_id: originalPayment.subscription_id,
      member_id: originalPayment.member_id,
      amount: -refundAmount, // Negative amount for refund
      payment_method: originalPayment.payment_method,
      payment_date: new Date().toISOString(),
      payment_status: "completed" as const,
      description: `Refund for payment ${originalPayment.receipt_number}`,
      refund_reason: reason,
      is_refund: true,
      refunded_payment_id: paymentId,
      refund_metadata: {
        original_payment_id: paymentId,
        original_receipt: originalPayment.receipt_number,
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
      },
    };

    console.log("Creating refund entry with data:", refundData);

    const { data: refundEntry, error: refundError } = await supabase
      .from("subscription_payments")
      .insert(refundData)
      .select()
      .single();

    if (refundError) {
      console.error("Error creating refund entry:", refundError);
      throw refundError;
    }

    console.log("Refund entry created:", refundEntry);

    // Update subscription paid amount if this refund affects a subscription
    if (originalPayment.subscription_id) {
      await this.updateSubscriptionPaidAmount(originalPayment.subscription_id);
    }

    return refundEntry as SubscriptionPaymentWithReceipt;
  },

  /**
   * Get refund information for a payment
   */
  async getPaymentRefundInfo(paymentId: string) {
    const { data: refunds, error } = await supabase
      .from("subscription_payments")
      .select("id, amount, payment_date, refund_reason, receipt_number")
      .eq("refunded_payment_id", paymentId)
      .eq("is_refund", true)
      .order("payment_date", { ascending: false });

    if (error) throw error;

    const totalRefunded = refunds.reduce(
      (total, refund) => total + Math.abs(refund.amount),
      0
    );

    return {
      refunds,
      totalRefunded,
      hasRefunds: refunds.length > 0,
    };
  },

  /**
   * Get payments with their associated refunds
   */
  async getPaymentWithRefunds(paymentId: string) {
    const { data: payment, error: paymentError } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError) throw paymentError;

    const refundInfo = await this.getPaymentRefundInfo(paymentId);

    return {
      ...payment,
      refunds: refundInfo.refunds,
      totalRefunded: refundInfo.totalRefunded,
      netAmount: payment.amount - refundInfo.totalRefunded,
      isPartiallyRefunded:
        refundInfo.totalRefunded > 0 &&
        refundInfo.totalRefunded < payment.amount,
      isFullyRefunded: refundInfo.totalRefunded >= payment.amount,
    };
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
        is_refund,
        refunded_payment_id,
        refund_metadata,
        description,
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
      data?.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        receipt_number: payment.receipt_number,
        payment_date: payment.payment_date,
        is_refund: payment.is_refund,
        refunded_payment_id: payment.refunded_payment_id,
        description: payment.description,
        member: {
          first_name: Array.isArray(payment.members)
            ? payment.members[0]?.first_name || "Unknown"
            : "Unknown",
          last_name: Array.isArray(payment.members)
            ? payment.members[0]?.last_name || "Member"
            : "Member",
        },
      })) || [];

    // Calculate summary
    const { data: summaryData, error: summaryError } = await supabase
      .from("subscription_payments")
      .select("amount, refund_amount, payment_status, is_refund");

    if (summaryError) throw summaryError;

    const originalPayments = summaryData.filter(
      (p) => !p.is_refund && p.payment_status === "completed"
    );
    const refundPayments = summaryData.filter(
      (p) => p.is_refund && p.payment_status === "completed"
    );

    const summary = {
      totalRevenue: originalPayments.reduce((sum, p) => sum + p.amount, 0),
      totalRefunded: Math.abs(
        refundPayments.reduce((sum, p) => sum + p.amount, 0)
      ), // abs because refunds are negative
      paymentCount: originalPayments.length,
      refundCount: refundPayments.length,
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
