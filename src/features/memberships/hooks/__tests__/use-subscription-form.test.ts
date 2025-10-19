import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSubscriptionForm } from "../use-subscription-form";
import type { SubscriptionPlanWithSessions } from "@/features/database/lib/types";
import { formatForDatabase } from "@/lib/date-utils";

// Mock the useSubscriptionPlans hook
vi.mock("../use-subscriptions", () => ({
  useSubscriptionPlans: vi.fn(),
}));

const mockPlans: SubscriptionPlanWithSessions[] = [
  {
    id: "plan-basic",
    name: "Basic Plan",
    price: 50,
    sessions_count: 5,
    contract_length_months: 1,
    description: "Basic membership",
    plan_type: "basic",
    billing_cycle: "monthly",
    currency: "USD",
    includes_guest_passes: 1,
    signup_fee: 0,
    cancellation_fee: 0,
    freeze_fee: 0,
    auto_renew: true,
    is_active: true,
    sort_order: 1,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "plan-premium",
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
    sort_order: 2,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

describe("useSubscriptionForm", () => {
  beforeEach(async () => {
    vi.resetAllMocks();

    // Mock useSubscriptionPlans to return test data
    const { useSubscriptionPlans } = await import("../use-subscriptions");
    vi.mocked(useSubscriptionPlans).mockReturnValue({
      data: mockPlans,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with default form data", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      expect(result.current.formData).toEqual({
        planId: "",
        startDate: expect.any(Date),
        initialPayment: 0,
        paymentMethod: "cash",
        notes: "",
      });
    });

    it("should return null for session info when no plan selected", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      expect(result.current.sessionInfo).toBeNull();
    });

    it("should return null for balance info when no plan selected", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      expect(result.current.balanceInfo).toBeNull();
    });

    it("should show validation errors for empty form", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      expect(result.current.validation.isValid).toBe(false);
      expect(result.current.validation.errors).toContain(
        "Please select a subscription plan"
      );
    });
  });

  describe("form data updates", () => {
    it("should update form data when updateFormData is called", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      act(() => {
        result.current.updateFormData({
          planId: "plan-basic",
          initialPayment: 25,
          paymentMethod: "card",
        });
      });

      expect(result.current.formData.planId).toBe("plan-basic");
      expect(result.current.formData.initialPayment).toBe(25);
      expect(result.current.formData.paymentMethod).toBe("card");
    });

    it("should partially update form data", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      const initialStartDate = result.current.formData.startDate;

      act(() => {
        result.current.updateFormData({ planId: "plan-premium" });
      });

      expect(result.current.formData.planId).toBe("plan-premium");
      expect(result.current.formData.startDate).toBe(initialStartDate); // Should remain unchanged
      expect(result.current.formData.initialPayment).toBe(0); // Should remain unchanged
    });
  });

  describe("selected plan", () => {
    it("should return selected plan when planId is set", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      act(() => {
        result.current.updateFormData({ planId: "plan-premium" });
      });

      expect(result.current.selectedPlan).toEqual(mockPlans[1]);
    });

    it("should return undefined when planId is not found", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      act(() => {
        result.current.updateFormData({ planId: "nonexistent-plan" });
      });

      expect(result.current.selectedPlan).toBeUndefined();
    });
  });

  describe("session info", () => {
    it("should calculate session info for selected plan", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      act(() => {
        result.current.updateFormData({ planId: "plan-premium" });
      });

      expect(result.current.sessionInfo).toEqual({
        totalSessions: 10,
        pricePerSession: 10, // 100 / 10
        duration: 30,
      });
    });

    it("should handle plans with different session counts", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      act(() => {
        result.current.updateFormData({ planId: "plan-basic" });
      });

      expect(result.current.sessionInfo).toEqual({
        totalSessions: 5,
        pricePerSession: 10, // 50 / 5
        duration: 30,
      });
    });
  });

  describe("balance info", () => {
    it("should calculate balance info with partial payment", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      act(() => {
        result.current.updateFormData({
          planId: "plan-premium",
          initialPayment: 60,
        });
      });

      expect(result.current.balanceInfo).toEqual({
        totalPrice: 100,
        initialPayment: 60,
        remainingBalance: 40,
        isFullyPaid: false,
      });
    });

    it("should calculate balance info with full payment", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      act(() => {
        result.current.updateFormData({
          planId: "plan-premium",
          initialPayment: 100,
        });
      });

      expect(result.current.balanceInfo).toEqual({
        totalPrice: 100,
        initialPayment: 100,
        remainingBalance: 0,
        isFullyPaid: true,
      });
    });

    it("should calculate balance info with overpayment", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      act(() => {
        result.current.updateFormData({
          planId: "plan-premium",
          initialPayment: 120,
        });
      });

      expect(result.current.balanceInfo).toEqual({
        totalPrice: 100,
        initialPayment: 120,
        remainingBalance: 0, // Should not be negative
        isFullyPaid: true,
      });
    });
  });

  describe("validation", () => {
    it("should validate required plan selection", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      expect(result.current.validation.isValid).toBe(false);
      expect(result.current.validation.errors).toContain(
        "Please select a subscription plan"
      );
    });

    it("should validate negative initial payment", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      act(() => {
        result.current.updateFormData({
          planId: "plan-premium",
          initialPayment: -10,
        });
      });

      expect(result.current.validation.isValid).toBe(false);
      expect(result.current.validation.errors).toContain(
        "Initial payment cannot be negative"
      );
    });

    it("should validate payment exceeding plan price", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      act(() => {
        result.current.updateFormData({
          planId: "plan-basic",
          initialPayment: 100, // Exceeds plan price of 50
        });
      });

      expect(result.current.validation.isValid).toBe(false);
      expect(result.current.validation.errors).toContain(
        "Initial payment cannot exceed plan price"
      );
    });

    it("should be valid with correct data", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      act(() => {
        result.current.updateFormData({
          planId: "plan-premium",
          initialPayment: 50,
        });
      });

      expect(result.current.validation.isValid).toBe(true);
      expect(result.current.validation.errors).toHaveLength(0);
    });
  });

  describe("buildCreateInput", () => {
    it("should build correct CreateSubscriptionInput", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      const testDate = new Date("2024-02-01T10:00:00Z");

      act(() => {
        result.current.updateFormData({
          planId: "plan-premium",
          startDate: testDate,
          initialPayment: 50,
          paymentMethod: "card",
          notes: "Test subscription",
        });
      });

      const input = result.current.buildCreateInput();

      expect(input).toEqual({
        member_id: "member-123",
        plan_id: "plan-premium",
        start_date: formatForDatabase(testDate),
        initial_payment_amount: 50,
        payment_method: "card",
        notes: "Test subscription",
      });
    });

    it("should exclude empty notes", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      act(() => {
        result.current.updateFormData({
          planId: "plan-premium",
          notes: "", // Empty notes
        });
      });

      const input = result.current.buildCreateInput();

      expect(input.notes).toBeUndefined();
    });
  });

  describe("resetForm", () => {
    it("should reset form to default state", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      // First, modify the form
      act(() => {
        result.current.updateFormData({
          planId: "plan-premium",
          initialPayment: 50,
          paymentMethod: "card",
          notes: "Test notes",
        });
      });

      // Verify it was modified
      expect(result.current.formData.planId).toBe("plan-premium");
      expect(result.current.formData.initialPayment).toBe(50);

      // Reset the form
      act(() => {
        result.current.resetForm();
      });

      // Verify it was reset
      expect(result.current.formData.planId).toBe("");
      expect(result.current.formData.initialPayment).toBe(0);
      expect(result.current.formData.paymentMethod).toBe("cash");
      expect(result.current.formData.notes).toBe("");
      expect(result.current.formData.startDate).toEqual(expect.any(Date));
    });
  });

  describe("loading state", () => {
    it("should reflect loading state from useSubscriptionPlans", async () => {
      const { useSubscriptionPlans } = vi.mocked(
        await import("../use-subscriptions")
      );
      useSubscriptionPlans.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      expect(result.current.isLoadingPlans).toBe(true);
    });

    it("should reflect loaded state from useSubscriptionPlans", async () => {
      const { useSubscriptionPlans } = vi.mocked(
        await import("../use-subscriptions")
      );
      useSubscriptionPlans.mockReturnValue({
        data: mockPlans,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubscriptionForm("member-123"), {
        wrapper,
      });

      expect(result.current.isLoadingPlans).toBe(false);
    });
  });
});
