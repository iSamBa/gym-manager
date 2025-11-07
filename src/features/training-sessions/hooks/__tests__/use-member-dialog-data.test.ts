import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { useMemberDialogData } from "../use-training-sessions";
import * as useMembersModule from "@/features/members/hooks/use-members";
import * as useSubscriptionsModule from "@/features/memberships/hooks/use-subscriptions";
import { supabase } from "@/lib/supabase";

// Mock modules
vi.mock("@/features/members/hooks/use-members");
vi.mock("@/features/memberships/hooks/use-subscriptions");
vi.mock("@/lib/supabase");

describe("useMemberDialogData", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    QueryClientProvider({ client: queryClient, children });

  it("should return initial loading state", () => {
    vi.mocked(useMembersModule.useMember).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    vi.mocked(useSubscriptionsModule.useActiveSubscription).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    const { result } = renderHook(() => useMemberDialogData("member-1"), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("should fetch and return member details", async () => {
    const mockMember = {
      id: "member-1",
      first_name: "John",
      last_name: "Doe",
      phone: "+1234567890",
      uniform_size: "L",
      vest_size: "V2",
      hip_belt_size: "V1",
    };

    vi.mocked(useMembersModule.useMember).mockReturnValue({
      data: mockMember,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useSubscriptionsModule.useActiveSubscription).mockReturnValue({
      data: {
        id: "sub-1",
        start_date: "2025-10-01",
        end_date: "2025-11-01",
      },
      isLoading: false,
      error: null,
    } as any);

    // Mock Supabase queries for sessions
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "training_session_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [], error: null }),
          in: vi.fn().mockReturnThis(),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useMemberDialogData("member-1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.member.first_name).toBe("John");
    expect(result.current.member.last_name).toBe("Doe");
    expect(result.current.member.phone).toBe("+1234567890");
    expect(result.current.member.uniform_size).toBe("L");
  });

  it("should return default session stats when queries are not enabled", async () => {
    vi.mocked(useMembersModule.useMember).mockReturnValue({
      data: { id: "member-1" },
      isLoading: false,
      error: null,
    } as any);

    // No active subscription means queries won't run
    vi.mocked(useSubscriptionsModule.useActiveSubscription).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useMemberDialogData("member-1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // When no subscription, session stats should be 0
    expect(result.current.sessionStats.done).toBe(0);
    expect(result.current.sessionStats.scheduled).toBe(0);
  });

  it("should handle member with no active subscription", async () => {
    vi.mocked(useMembersModule.useMember).mockReturnValue({
      data: { id: "member-1", first_name: "John" },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useSubscriptionsModule.useActiveSubscription).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useMemberDialogData("member-1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessionStats.done).toBe(0);
    expect(result.current.sessionStats.scheduled).toBe(0);
  });

  it("should handle errors gracefully", async () => {
    const mockError = new Error("Failed to fetch member");

    vi.mocked(useMembersModule.useMember).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    } as any);

    vi.mocked(useSubscriptionsModule.useActiveSubscription).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useMemberDialogData("member-1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe("Failed to fetch member");
  });

  it("should return empty data for undefined memberId", () => {
    vi.mocked(useMembersModule.useMember).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useSubscriptionsModule.useActiveSubscription).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useMemberDialogData(undefined), {
      wrapper,
    });

    expect(result.current.member).toEqual({
      phone: undefined,
      first_name: undefined,
      last_name: undefined,
      uniform_size: undefined,
      vest_size: undefined,
      hip_belt_size: undefined,
    });
    expect(result.current.sessionStats).toEqual({
      done: 0,
      scheduled: 0,
    });
  });
});
