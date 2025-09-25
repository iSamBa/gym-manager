import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentUtils } from "../lib/payment-utils";
import type { RecordPaymentInput } from "@/features/database/lib/types";
import { subscriptionKeys } from "@/features/memberships/hooks/use-subscriptions";
import { toast } from "sonner";

type PaymentFilters = Record<string, unknown>;

// Query key factory for payment-related queries
export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  allPayments: (filters: PaymentFilters) =>
    [...paymentKeys.lists(), "all", filters] as const,
  subscription: (subscriptionId: string) =>
    [...paymentKeys.all, "subscription", subscriptionId] as const,
  member: (memberId: string) =>
    [...paymentKeys.all, "member", memberId] as const,
  stats: (startDate: string, endDate: string) =>
    [...paymentKeys.all, "stats", startDate, endDate] as const,
};

/**
 * Get payments for a specific subscription
 */
export function useSubscriptionPayments(subscriptionId: string) {
  return useQuery({
    queryKey: paymentKeys.subscription(subscriptionId),
    queryFn: () => paymentUtils.getSubscriptionPayments(subscriptionId),
    enabled: !!subscriptionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get all payments for a member
 */
export function useMemberPayments(memberId: string) {
  return useQuery({
    queryKey: paymentKeys.member(memberId),
    queryFn: () => paymentUtils.getMemberPayments(memberId),
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get payment statistics for a date range
 */
export function usePaymentStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: paymentKeys.stats(startDate, endDate),
    queryFn: () => paymentUtils.getPaymentStats(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes for stats
  });
}

/**
 * Record a new payment
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RecordPaymentInput) =>
      paymentUtils.recordPayment(input),

    onSuccess: (data, variables) => {
      // Invalidate payment queries
      queryClient.invalidateQueries({
        queryKey: paymentKeys.subscription(variables.subscription_id),
      });

      // Get member_id from the returned data or fetch it
      if (data.member_id) {
        queryClient.invalidateQueries({
          queryKey: paymentKeys.member(data.member_id),
        });
      }

      // Invalidate all payments queries
      queryClient.invalidateQueries({
        queryKey: paymentKeys.lists(),
      });

      // Invalidate subscription queries to update paid amount
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(variables.subscription_id),
      });

      toast.success("Payment Recorded", {
        description: `Payment of $${variables.amount.toFixed(2)} recorded successfully. Receipt: ${data.receipt_number}`,
      });
    },

    onError: (error) => {
      toast.error("Payment Failed", {
        description:
          error instanceof Error ? error.message : "Failed to record payment",
      });
    },
  });
}

/**
 * Process a refund
 */
export function useProcessRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      refundAmount,
      reason,
    }: {
      paymentId: string;
      refundAmount: number;
      reason: string;
    }) => paymentUtils.processRefund(paymentId, refundAmount, reason),

    onSuccess: (data) => {
      // Invalidate payment queries
      queryClient.invalidateQueries({
        queryKey: paymentKeys.subscription(data.subscription_id),
      });

      queryClient.invalidateQueries({
        queryKey: paymentKeys.member(data.member_id),
      });

      // Invalidate all payments queries
      queryClient.invalidateQueries({
        queryKey: paymentKeys.lists(),
      });

      // Invalidate subscription queries
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(data.subscription_id),
      });

      toast.success("Refund Processed", {
        description: `Refund of $${data.refund_amount?.toFixed(2) || "0.00"} has been processed.`,
      });
    },

    onError: (error) => {
      console.error("Refund mutation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process refund";

      toast.error("Refund Failed", {
        description: errorMessage,
        duration: 5000, // Show error longer
      });
    },
  });
}
