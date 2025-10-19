import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import React from "react";
import { subscriptionUtils } from "../../lib/subscription-utils";
import {
  useSubscriptionPlans,
  useSubscriptionPlan,
  useActiveSubscription,
  useMemberSubscriptionHistory,
  useSubscriptionDetails,
  useCreateSubscription,
  useUpgradeSubscription,
  usePauseSubscription,
  useResumeSubscription,
  useConsumeSession,
  useRecordPayment,
} from "../use-subscriptions";
import type {
  SubscriptionPlanWithSessions,
  MemberSubscriptionWithSnapshot,
  CreateSubscriptionInput,
  UpgradeSubscriptionInput,
  RecordPaymentInput,
} from "@/features/database/lib/types";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../lib/subscription-utils", () => ({
  subscriptionUtils: {
    createSubscriptionWithSnapshot: vi.fn(),
    upgradeSubscription: vi.fn(),
    pauseSubscription: vi.fn(),
    resumeSubscription: vi.fn(),
    consumeSession: vi.fn(),
    recordPayment: vi.fn(),
    getSubscriptionWithDetails: vi.fn(),
    getMemberActiveSubscription: vi.fn(),
    getMemberSubscriptionHistory: vi.fn(),
  },
}));

vi.mock("@/features/database/lib/subscription-db-utils", () => ({
  getAllPlans: vi.fn(),
  getActivePlans: vi.fn(),
  getPlanById: vi.fn(),
  createSubscriptionPlan: vi.fn(),
  updateSubscriptionPlan: vi.fn(),
  deleteSubscriptionPlan: vi.fn(),
}));

const mockSubscriptionUtils = vi.mocked(subscriptionUtils);
const mockToast = vi.mocked(toast);

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

const mockPlan: SubscriptionPlanWithSessions = {
  id: "plan-123",
  name: "Premium Plan",
  price: 100,
  sessions_count: 10,
  contract_length_months: 1,
  description: "Premium membership",
  plan_type: "premium",
  billing_cycle: "monthly",
  currency: "USD",
  includes_guest_passes: 2,
  signup_fee: 0,
  cancellation_fee: 0,
  freeze_fee: 0,
  auto_renew: true,
  is_active: true,
  sort_order: 1,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockSubscription: MemberSubscriptionWithSnapshot = {
  id: "sub-123",
  member_id: "member-123",
  plan_id: "plan-123",
  status: "active",
  start_date: "2024-01-01T00:00:00Z",
  end_date: "2024-02-01T00:00:00Z",
  billing_cycle: "monthly",
  price: 100,
  currency: "USD",
  signup_fee_paid: 0,
  auto_renew: true,
  renewal_count: 0,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  plan_name_snapshot: "Premium Plan",
  total_sessions_snapshot: 10,
  total_amount_snapshot: 100,
  duration_days_snapshot: 30,
  used_sessions: 5,
  paid_amount: 80,
};

describe("useSubscriptions hooks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("useSubscriptionPlans", () => {
    it("should fetch and return subscription plans", async () => {
      const mockPlans = [mockPlan];
      const { getAllPlans } = await import(
        "@/features/database/lib/subscription-db-utils"
      );
      vi.mocked(getAllPlans).mockResolvedValue(mockPlans);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionPlans(), { wrapper });

      await waitFor(
        () => {
          expect(result.current.isSuccess).toBe(true);
        },
        { timeout: 3000 }
      );

      expect(result.current.data).toEqual(mockPlans);
      expect(getAllPlans).toHaveBeenCalledTimes(1);
    });

    it("should handle errors when fetching plans", async () => {
      const { getAllPlans } = await import(
        "@/features/database/lib/subscription-db-utils"
      );
      vi.mocked(getAllPlans).mockRejectedValue(new Error("Database error"));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionPlans(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error("Database error"));
    });
  });

  describe("useSubscriptionPlan", () => {
    it("should fetch specific plan by ID", async () => {
      const { getPlanById } = await import(
        "@/features/database/lib/subscription-db-utils"
      );
      vi.mocked(getPlanById).mockResolvedValue(mockPlan);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionPlan("plan-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPlan);
      expect(getPlanById).toHaveBeenCalledWith("plan-123");
    });

    it("should not fetch when planId is empty", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionPlan(""), { wrapper });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("useActiveSubscription", () => {
    it("should fetch member active subscription", async () => {
      mockSubscriptionUtils.getMemberActiveSubscription.mockResolvedValue(
        mockSubscription
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => useActiveSubscription("member-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSubscription);
      expect(
        mockSubscriptionUtils.getMemberActiveSubscription
      ).toHaveBeenCalledWith("member-123");
    });

    it("should not fetch when memberId is empty", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useActiveSubscription(""), {
        wrapper,
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("useMemberSubscriptionHistory", () => {
    it("should fetch member subscription history", async () => {
      const mockHistory = [mockSubscription];
      mockSubscriptionUtils.getMemberSubscriptionHistory.mockResolvedValue(
        mockHistory
      );

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useMemberSubscriptionHistory("member-123"),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockHistory);
      expect(
        mockSubscriptionUtils.getMemberSubscriptionHistory
      ).toHaveBeenCalledWith("member-123");
    });
  });

  describe("useSubscriptionDetails", () => {
    it("should fetch subscription with computed details", async () => {
      const mockDetailsSubscription = {
        ...mockSubscription,
        remaining_sessions: 5,
        balance_due: 20,
        completion_percentage: 50,
        days_remaining: 15,
      };
      mockSubscriptionUtils.getSubscriptionWithDetails.mockResolvedValue(
        mockDetailsSubscription
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionDetails("sub-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDetailsSubscription);
      expect(
        mockSubscriptionUtils.getSubscriptionWithDetails
      ).toHaveBeenCalledWith("sub-123");
    });
  });

  describe("useCreateSubscription", () => {
    it("should create subscription and show success toast", async () => {
      mockSubscriptionUtils.createSubscriptionWithSnapshot.mockResolvedValue(
        mockSubscription
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateSubscription(), { wrapper });

      const input: CreateSubscriptionInput = {
        member_id: "member-123",
        plan_id: "plan-123",
        initial_payment_amount: 50,
        payment_method: "cash",
      };

      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(
        mockSubscriptionUtils.createSubscriptionWithSnapshot
      ).toHaveBeenCalledWith(input);
      expect(mockToast.success).toHaveBeenCalledWith("Subscription Created", {
        description: "New subscription for Premium Plan has been created.",
      });
    });

    it("should handle errors and show error toast", async () => {
      const error = new Error("Failed to create subscription");
      mockSubscriptionUtils.createSubscriptionWithSnapshot.mockRejectedValue(
        error
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateSubscription(), { wrapper });

      const input: CreateSubscriptionInput = {
        member_id: "member-123",
        plan_id: "plan-123",
      };

      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to Create Subscription",
        {
          description: "Failed to create subscription",
        }
      );
    });
  });

  describe("useUpgradeSubscription", () => {
    it("should upgrade subscription and show success toast", async () => {
      const upgradedSubscription = {
        ...mockSubscription,
        plan_name_snapshot: "VIP Plan",
      };
      mockSubscriptionUtils.upgradeSubscription.mockResolvedValue(
        upgradedSubscription
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpgradeSubscription(), {
        wrapper,
      });

      const input: UpgradeSubscriptionInput = {
        current_subscription_id: "sub-123",
        new_plan_id: "plan-456",
        credit_amount: 40,
      };

      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSubscriptionUtils.upgradeSubscription).toHaveBeenCalledWith(
        input
      );
      expect(mockToast.success).toHaveBeenCalledWith("Subscription Upgraded", {
        description: "Successfully upgraded to VIP Plan.",
      });
    });

    it("should handle upgrade errors", async () => {
      const error = new Error("Credit amount mismatch");
      mockSubscriptionUtils.upgradeSubscription.mockRejectedValue(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpgradeSubscription(), {
        wrapper,
      });

      const input: UpgradeSubscriptionInput = {
        current_subscription_id: "sub-123",
        new_plan_id: "plan-456",
        credit_amount: 40,
      };

      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to Upgrade Subscription",
        {
          description: "Credit amount mismatch",
        }
      );
    });
  });

  describe("usePauseSubscription", () => {
    it("should pause subscription and show success toast", async () => {
      const pausedSubscription = {
        ...mockSubscription,
        status: "paused" as const,
      };
      mockSubscriptionUtils.pauseSubscription.mockResolvedValue(
        pausedSubscription
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => usePauseSubscription(), { wrapper });

      result.current.mutate({ subscriptionId: "sub-123", reason: "Vacation" });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSubscriptionUtils.pauseSubscription).toHaveBeenCalledWith(
        "sub-123",
        "Vacation"
      );
      expect(mockToast.success).toHaveBeenCalledWith("Subscription Paused", {
        description: "The subscription has been paused successfully.",
      });
    });
  });

  describe("useResumeSubscription", () => {
    it("should resume subscription and show success toast", async () => {
      const resumedSubscription = {
        ...mockSubscription,
        status: "active" as const,
      };
      mockSubscriptionUtils.resumeSubscription.mockResolvedValue(
        resumedSubscription
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => useResumeSubscription(), { wrapper });

      result.current.mutate("sub-123");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSubscriptionUtils.resumeSubscription).toHaveBeenCalledWith(
        "sub-123"
      );
      expect(mockToast.success).toHaveBeenCalledWith("Subscription Resumed", {
        description: "The subscription has been resumed successfully.",
      });
    });
  });

  describe("useConsumeSession", () => {
    it("should consume session and update cache", async () => {
      const consumedSubscription = { ...mockSubscription, used_sessions: 6 };
      mockSubscriptionUtils.consumeSession.mockResolvedValue(
        consumedSubscription
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => useConsumeSession(), { wrapper });

      result.current.mutate("sub-123");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSubscriptionUtils.consumeSession).toHaveBeenCalledWith(
        "sub-123"
      );
    });

    it("should show completion toast when subscription is completed", async () => {
      const completedSubscription = {
        ...mockSubscription,
        status: "expired" as const,
        used_sessions: 10,
      };
      mockSubscriptionUtils.consumeSession.mockResolvedValue(
        completedSubscription
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => useConsumeSession(), { wrapper });

      result.current.mutate("sub-123");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockToast.info).toHaveBeenCalledWith("Subscription Completed", {
        description:
          "All sessions have been used. Consider renewing the subscription.",
      });
    });

    it("should handle errors when consuming session", async () => {
      const error = new Error("No sessions remaining");
      mockSubscriptionUtils.consumeSession.mockRejectedValue(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useConsumeSession(), { wrapper });

      result.current.mutate("sub-123");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith("Session Not Consumed", {
        description: "No sessions remaining",
      });
    });
  });

  describe("useRecordPayment", () => {
    it("should record payment and show success toast", async () => {
      const mockPayment = {
        id: "payment-123",
        subscription_id: "sub-123",
        member_id: "member-123",
        amount: 50,
        currency: "USD",
        payment_method: "cash" as const,
        payment_status: "completed" as const,
        due_date: "2024-01-01T00:00:00Z",
        late_fee: 0,
        discount_amount: 0,
        refund_amount: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        receipt_number: "RCPT-2024-0001",
      };

      mockSubscriptionUtils.recordPayment.mockResolvedValue(mockPayment);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useRecordPayment(), { wrapper });

      const input: RecordPaymentInput = {
        subscription_id: "sub-123",
        amount: 50,
        payment_method: "cash",
      };

      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSubscriptionUtils.recordPayment).toHaveBeenCalledWith(input);
      expect(mockToast.success).toHaveBeenCalledWith("Payment Recorded", {
        description:
          "Payment of $50.00 has been recorded. Receipt: RCPT-2024-0001",
      });
    });

    it("should handle payment errors", async () => {
      const error = new Error("Payment processing failed");
      mockSubscriptionUtils.recordPayment.mockRejectedValue(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useRecordPayment(), { wrapper });

      const input: RecordPaymentInput = {
        subscription_id: "sub-123",
        amount: 50,
        payment_method: "cash",
      };

      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith("Failed to Record Payment", {
        description: "Payment processing failed",
      });
    });
  });
});
