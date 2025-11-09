import { createClient } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export interface CreateSubscriptionWithPaymentParams {
  member_id: string;
  plan_id: string;
  payment_amount: number;
  payment_method: "cash" | "card" | "bank_transfer" | "online" | "check";
  payment_date?: string;
}

export interface CreateSubscriptionWithPaymentResult {
  success: boolean;
  subscription_id: string;
  payment_id: string;
  message: string;
}

export interface ProcessRefundParams {
  payment_id: string;
  refund_amount: number;
  refund_reason: string;
  cancel_subscription?: boolean;
}

export interface ProcessRefundResult {
  success: boolean;
  refund_id: string;
  payment_id: string;
  refund_amount: number;
  subscription_cancelled: boolean;
  message: string;
}

/**
 * Creates subscription and payment in a single atomic transaction.
 *
 * This function uses a PostgreSQL RPC function to ensure that:
 * 1. Subscription is created
 * 2. Payment is recorded
 * 3. Member status is updated (trial -> full conversion)
 *
 * All operations succeed together or rollback on any failure.
 *
 * @param params - Subscription and payment details
 * @returns Result object with subscription_id and payment_id
 * @throws Error if transaction fails
 *
 * @example
 * ```typescript
 * const result = await createSubscriptionWithPayment({
 *   member_id: "uuid",
 *   plan_id: "uuid",
 *   payment_amount: 100.00,
 *   payment_method: "card"
 * });
 * console.log(result.subscription_id, result.payment_id);
 * ```
 */
export async function createSubscriptionWithPayment(
  params: CreateSubscriptionWithPaymentParams
): Promise<CreateSubscriptionWithPaymentResult> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc(
      "create_subscription_with_payment",
      {
        p_member_id: params.member_id,
        p_plan_id: params.plan_id,
        p_payment_amount: params.payment_amount,
        p_payment_method: params.payment_method,
        p_payment_date:
          params.payment_date || new Date().toISOString().split("T")[0],
      }
    );

    if (error) {
      logger.error("Failed to create subscription with payment", {
        error,
        params,
      });
      throw new Error(`Transaction failed: ${error.message}`);
    }

    if (!data || !data.success) {
      logger.error("RPC returned unsuccessful result", { data, params });
      throw new Error("Transaction failed: Unexpected response from database");
    }

    logger.info("Subscription created with payment", { result: data });
    return data as CreateSubscriptionWithPaymentResult;
  } catch (error) {
    logger.error("Exception in createSubscriptionWithPayment", {
      error,
      params,
    });
    throw error;
  }
}

/**
 * Processes refund and optionally cancels subscription in a single atomic transaction.
 *
 * This function uses a PostgreSQL RPC function to ensure that:
 * 1. Payment is marked as refunded
 * 2. Refund amount and reason are recorded
 * 3. Associated subscription is optionally cancelled
 *
 * All operations succeed together or rollback on any failure.
 *
 * Validation:
 * - Payment must be in 'completed' status
 * - Refund amount must not exceed original payment amount
 * - Payment record must exist
 *
 * @param params - Refund details and cancellation flag
 * @returns Result object with refund confirmation
 * @throws Error if transaction fails or validation fails
 *
 * @example
 * ```typescript
 * const result = await processRefundWithTransaction({
 *   payment_id: "uuid",
 *   refund_amount: 100.00,
 *   refund_reason: "Customer request",
 *   cancel_subscription: true
 * });
 * console.log(result.subscription_cancelled);
 * ```
 */
export async function processRefundWithTransaction(
  params: ProcessRefundParams
): Promise<ProcessRefundResult> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc(
      "process_refund_with_transaction",
      {
        p_payment_id: params.payment_id,
        p_refund_amount: params.refund_amount,
        p_refund_reason: params.refund_reason,
        p_cancel_subscription: params.cancel_subscription ?? true,
      }
    );

    if (error) {
      logger.error("Failed to process refund", { error, params });
      throw new Error(`Refund failed: ${error.message}`);
    }

    if (!data || !data.success) {
      logger.error("RPC returned unsuccessful result", { data, params });
      throw new Error("Refund failed: Unexpected response from database");
    }

    logger.info("Refund processed successfully", { result: data });
    return data as ProcessRefundResult;
  } catch (error) {
    logger.error("Exception in processRefundWithTransaction", {
      error,
      params,
    });
    throw error;
  }
}
