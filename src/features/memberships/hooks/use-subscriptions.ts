import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionUtils } from "../lib/subscription-utils";
import {
  getActivePlans,
  getPlanById,
} from "@/features/database/lib/subscription-db-utils";
import type {
  CreateSubscriptionInput,
  UpgradeSubscriptionInput,
  RecordPaymentInput,
} from "@/features/database/lib/types";
import { toast } from "sonner";

// Query key factory for consistent cache management
export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  lists: () => [...subscriptionKeys.all, "list"] as const,
  plans: () => [...subscriptionKeys.all, "plans"] as const,
  detail: (id: string) => [...subscriptionKeys.all, "detail", id] as const,

  // Member-specific keys
  memberSubscriptions: (memberId: string) =>
    [...subscriptionKeys.all, "member", memberId] as const,
  memberActive: (memberId: string) =>
    [...subscriptionKeys.memberSubscriptions(memberId), "active"] as const,
  memberHistory: (memberId: string) =>
    [...subscriptionKeys.memberSubscriptions(memberId), "history"] as const,
};

/**
 * Get all available subscription plans
 */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: getActivePlans,
    staleTime: 10 * 60 * 1000, // 10 minutes - plans don't change often
  });
}

/**
 * Get a single subscription plan
 */
export function useSubscriptionPlan(planId: string) {
  return useQuery({
    queryKey: [...subscriptionKeys.plans(), planId],
    queryFn: () => getPlanById(planId),
    enabled: !!planId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get member's active subscription
 */
export function useActiveSubscription(memberId: string) {
  return useQuery({
    queryKey: subscriptionKeys.memberActive(memberId),
    queryFn: () => subscriptionUtils.getMemberActiveSubscription(memberId),
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000, // 2 minutes - active subscription changes more frequently
  });
}

/**
 * Get member's subscription history
 */
export function useMemberSubscriptionHistory(memberId: string) {
  return useQuery({
    queryKey: subscriptionKeys.memberHistory(memberId),
    queryFn: () => subscriptionUtils.getMemberSubscriptionHistory(memberId),
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get subscription with computed details
 */
export function useSubscriptionDetails(subscriptionId: string) {
  return useQuery({
    queryKey: subscriptionKeys.detail(subscriptionId),
    queryFn: () => subscriptionUtils.getSubscriptionWithDetails(subscriptionId),
    enabled: !!subscriptionId,
    staleTime: 1 * 60 * 1000, // 1 minute - details change frequently
  });
}

/**
 * Create a new subscription
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSubscriptionInput) =>
      subscriptionUtils.createSubscriptionWithSnapshot(input),

    onSuccess: (data, variables) => {
      // Invalidate member's subscription queries
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.memberSubscriptions(variables.member_id),
      });

      toast.success("Subscription Created", {
        description: `New subscription for ${data.plan_name_snapshot} has been created.`,
      });
    },

    onError: (error) => {
      toast.error("Failed to Create Subscription", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    },
  });
}

/**
 * Upgrade an existing subscription
 */
export function useUpgradeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpgradeSubscriptionInput) =>
      subscriptionUtils.upgradeSubscription(input),

    onSuccess: (data, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.memberSubscriptions(data.member_id),
      });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(variables.current_subscription_id),
      });

      toast.success("Subscription Upgraded", {
        description: `Successfully upgraded to ${data.plan_name_snapshot}.`,
      });
    },

    onError: (error) => {
      toast.error("Failed to Upgrade Subscription", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    },
  });
}

/**
 * Pause a subscription
 */
export function usePauseSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subscriptionId,
      reason,
    }: {
      subscriptionId: string;
      reason?: string;
    }) => subscriptionUtils.pauseSubscription(subscriptionId, reason),

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.memberSubscriptions(data.member_id),
      });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(data.id),
      });

      toast.success("Subscription Paused", {
        description: "The subscription has been paused successfully.",
      });
    },

    onError: (error) => {
      toast.error("Failed to Pause Subscription", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    },
  });
}

/**
 * Resume a paused subscription
 */
export function useResumeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: string) =>
      subscriptionUtils.resumeSubscription(subscriptionId),

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.memberSubscriptions(data.member_id),
      });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(data.id),
      });

      toast.success("Subscription Resumed", {
        description: "The subscription has been resumed successfully.",
      });
    },

    onError: (error) => {
      toast.error("Failed to Resume Subscription", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    },
  });
}

/**
 * Consume a session from subscription
 */
export function useConsumeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: string) =>
      subscriptionUtils.consumeSession(subscriptionId),

    onSuccess: (data) => {
      // Update the subscription cache
      queryClient.setQueryData(subscriptionKeys.detail(data.id), data);

      // Invalidate member queries
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.memberSubscriptions(data.member_id),
      });

      if (data.status === "expired") {
        toast.info("Subscription Completed", {
          description:
            "All sessions have been used. Consider renewing the subscription.",
        });
      }
    },

    onError: (error) => {
      toast.error("Session Not Consumed", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    },
  });
}

/**
 * Record a payment for subscription
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RecordPaymentInput) =>
      subscriptionUtils.recordPayment(input),

    onSuccess: (data, variables) => {
      // Invalidate subscription details to refresh paid amount
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(variables.subscription_id),
      });

      toast.success("Payment Recorded", {
        description: `Payment of $${variables.amount.toFixed(2)} has been recorded. Receipt: ${data.receipt_number}`,
      });
    },

    onError: (error) => {
      toast.error("Failed to Record Payment", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    },
  });
}
