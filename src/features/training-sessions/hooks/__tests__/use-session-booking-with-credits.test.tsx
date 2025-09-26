import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock Supabase client creation
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(),
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  })),
}));

// Mock dependencies
vi.mock("@/features/memberships/lib/subscription-utils");
vi.mock("@/features/memberships/lib/notification-utils");
vi.mock("@/lib/supabase");
vi.mock("sonner");

import { useSessionBookingWithCredits } from "../use-session-booking-with-credits";
import { subscriptionUtils } from "@/features/memberships/lib/subscription-utils";
import { notificationUtils } from "@/features/memberships/lib/notification-utils";
import { supabase } from "@/lib/supabase";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("useSessionBookingWithCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock supabase.rpc for session creation
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true, session_id: "session-123" },
      error: null,
    });
  });

  it("should successfully book session with valid subscription", async () => {
    const mockActiveSubscription = { id: "sub-123" };
    const mockSubscriptionDetails = {
      id: "sub-123",
      status: "active",
      remaining_sessions: 5,
      balance_due: 0,
    };

    // Mock successful subscription checks
    vi.mocked(subscriptionUtils.getMemberActiveSubscription).mockResolvedValue(
      mockActiveSubscription as any
    );
    vi.mocked(subscriptionUtils.getSubscriptionWithDetails).mockResolvedValue(
      mockSubscriptionDetails as any
    );
    vi.mocked(subscriptionUtils.consumeSession).mockResolvedValue(
      mockSubscriptionDetails as any
    );

    const { result } = renderHook(() => useSessionBookingWithCredits(), {
      wrapper: createWrapper(),
    });

    const input = {
      memberId: "member-123",
      trainerId: "trainer-456",
      sessionDate: "2024-01-15",
      sessionTime: "10:00",
      sessionType: "standard" as const,
    };

    result.current.mutate(input);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(subscriptionUtils.consumeSession).toHaveBeenCalledWith("sub-123");
  });

  it("should throw error when no active subscription found", async () => {
    vi.mocked(subscriptionUtils.getMemberActiveSubscription).mockResolvedValue(
      null
    );

    const { result } = renderHook(() => useSessionBookingWithCredits(), {
      wrapper: createWrapper(),
    });

    const input = {
      memberId: "member-123",
      trainerId: "trainer-456",
      sessionDate: "2024-01-15",
      sessionTime: "10:00",
      sessionType: "standard" as const,
    };

    result.current.mutate(input);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain(
      "No active subscription found"
    );
  });

  it("should send payment alert for outstanding balance", async () => {
    const mockActiveSubscription = { id: "sub-123" };
    const mockSubscriptionDetails = {
      id: "sub-123",
      status: "active",
      remaining_sessions: 5,
      balance_due: 150.5,
    };

    vi.mocked(subscriptionUtils.getMemberActiveSubscription).mockResolvedValue(
      mockActiveSubscription as any
    );
    vi.mocked(subscriptionUtils.getSubscriptionWithDetails).mockResolvedValue(
      mockSubscriptionDetails as any
    );
    vi.mocked(subscriptionUtils.consumeSession).mockResolvedValue(
      mockSubscriptionDetails as any
    );
    vi.mocked(notificationUtils.sendPaymentAlert).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSessionBookingWithCredits(), {
      wrapper: createWrapper(),
    });

    const input = {
      memberId: "member-123",
      trainerId: "trainer-456",
      sessionDate: "2024-01-15",
      sessionTime: "10:00",
      sessionType: "standard" as const,
    };

    result.current.mutate(input);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(notificationUtils.sendPaymentAlert).toHaveBeenCalledWith({
      memberId: "member-123",
      trainerId: "trainer-456",
      subscriptionId: "sub-123",
      balance: 150.5,
      sessionDate: "2024-01-15",
    });
  });

  it("should throw error when no sessions remaining", async () => {
    const mockActiveSubscription = { id: "sub-123" };
    const mockSubscriptionDetails = {
      id: "sub-123",
      status: "active",
      remaining_sessions: 0,
      balance_due: 0,
    };

    vi.mocked(subscriptionUtils.getMemberActiveSubscription).mockResolvedValue(
      mockActiveSubscription as any
    );
    vi.mocked(subscriptionUtils.getSubscriptionWithDetails).mockResolvedValue(
      mockSubscriptionDetails as any
    );

    const { result } = renderHook(() => useSessionBookingWithCredits(), {
      wrapper: createWrapper(),
    });

    const input = {
      memberId: "member-123",
      trainerId: "trainer-456",
      sessionDate: "2024-01-15",
      sessionTime: "10:00",
      sessionType: "standard" as const,
    };

    result.current.mutate(input);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain("No sessions remaining");
  });
});
