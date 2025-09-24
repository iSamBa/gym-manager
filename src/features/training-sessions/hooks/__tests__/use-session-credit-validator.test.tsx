import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSessionCreditValidator } from "../use-session-credit-validator";
import { subscriptionUtils } from "@/features/memberships/lib/subscription-utils";

// Mock subscription utils
vi.mock("@/features/memberships/lib/subscription-utils", () => ({
  subscriptionUtils: {
    getMemberActiveSubscription: vi.fn(),
    getSubscriptionWithDetails: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("useSessionCreditValidator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return disabled query when no member selected", async () => {
    const { result } = renderHook(() => useSessionCreditValidator(""), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Query should be disabled when no memberId
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should return error when no active subscription found", async () => {
    vi.mocked(subscriptionUtils.getMemberActiveSubscription).mockResolvedValue(
      null
    );

    const { result } = renderHook(
      () => useSessionCreditValidator("member-123"),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      canBook: false,
      subscription: null,
      warnings: [],
      errors: ["No active subscription found"],
      remainingSessions: 0,
      hasOutstandingBalance: false,
      balanceAmount: 0,
    });
  });

  it("should return successful validation for valid subscription", async () => {
    const mockActiveSubscription = { id: "sub-123" };
    const mockSubscriptionDetails = {
      id: "sub-123",
      status: "active",
      remaining_sessions: 5,
      balance_due: 0,
      days_remaining: 15,
    };

    vi.mocked(subscriptionUtils.getMemberActiveSubscription).mockResolvedValue(
      mockActiveSubscription as any
    );
    vi.mocked(subscriptionUtils.getSubscriptionWithDetails).mockResolvedValue(
      mockSubscriptionDetails as any
    );

    const { result } = renderHook(
      () => useSessionCreditValidator("member-123"),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      canBook: true,
      subscription: mockSubscriptionDetails,
      warnings: [],
      errors: [],
      remainingSessions: 5,
      hasOutstandingBalance: false,
      balanceAmount: 0,
    });
  });

  it("should return warnings for low sessions", async () => {
    const mockActiveSubscription = { id: "sub-123" };
    const mockSubscriptionDetails = {
      id: "sub-123",
      status: "active",
      remaining_sessions: 2,
      balance_due: 0,
      days_remaining: 15,
    };

    vi.mocked(subscriptionUtils.getMemberActiveSubscription).mockResolvedValue(
      mockActiveSubscription as any
    );
    vi.mocked(subscriptionUtils.getSubscriptionWithDetails).mockResolvedValue(
      mockSubscriptionDetails as any
    );

    const { result } = renderHook(
      () => useSessionCreditValidator("member-123"),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.warnings).toContain(
      "Only 2 session(s) remaining. Consider renewing soon."
    );
    expect(result.current.data?.canBook).toBe(true);
  });

  it("should return error for no remaining sessions", async () => {
    const mockActiveSubscription = { id: "sub-123" };
    const mockSubscriptionDetails = {
      id: "sub-123",
      status: "active",
      remaining_sessions: 0,
      balance_due: 0,
      days_remaining: 15,
    };

    vi.mocked(subscriptionUtils.getMemberActiveSubscription).mockResolvedValue(
      mockActiveSubscription as any
    );
    vi.mocked(subscriptionUtils.getSubscriptionWithDetails).mockResolvedValue(
      mockSubscriptionDetails as any
    );

    const { result } = renderHook(
      () => useSessionCreditValidator("member-123"),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.errors).toContain(
      "No sessions remaining in subscription"
    );
    expect(result.current.data?.canBook).toBe(false);
  });
});
