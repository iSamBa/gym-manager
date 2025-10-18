import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOpeningHours } from "../use-opening-hours";
import { supabase } from "@/lib/supabase";
import type { OpeningHoursWeek } from "../../lib/types";
import React from "react";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe("useOpeningHours", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const mockOpeningHours: OpeningHoursWeek = {
    monday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    wednesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
    sunday: { is_open: false, open_time: null, close_time: null },
  };

  it("should fetch opening hours successfully", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockOpeningHours,
      error: null,
    } as any);

    const testDate = new Date("2025-01-15");
    const { result } = renderHook(() => useOpeningHours(testDate), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockOpeningHours);
    expect(supabase.rpc).toHaveBeenCalledWith("get_active_opening_hours", {
      target_date: "2025-01-15",
    });
  });

  it("should handle null response (no settings found)", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: null,
    } as any);

    const testDate = new Date("2025-01-15");
    const { result } = renderHook(() => useOpeningHours(testDate), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it("should handle error from RPC call", async () => {
    const mockError = new Error("Failed to fetch opening hours");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: mockError,
    } as any);

    const testDate = new Date("2025-01-15");
    const { result } = renderHook(() => useOpeningHours(testDate), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it("should cache results for the same date", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockOpeningHours,
      error: null,
    } as any);

    const testDate = new Date("2025-01-15");

    // First call
    const { result: result1 } = renderHook(() => useOpeningHours(testDate), {
      wrapper,
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    // Second call with same date
    const { result: result2 } = renderHook(() => useOpeningHours(testDate), {
      wrapper,
    });

    // Should immediately have data from cache
    expect(result2.current.data).toEqual(mockOpeningHours);

    // RPC should only be called once due to caching
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it("should use different cache keys for different dates", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockOpeningHours,
      error: null,
    } as any);

    const date1 = new Date("2025-01-15");
    const date2 = new Date("2025-01-16");

    // First call with date1
    const { result: result1 } = renderHook(() => useOpeningHours(date1), {
      wrapper,
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    // Second call with date2
    const { result: result2 } = renderHook(() => useOpeningHours(date2), {
      wrapper,
    });

    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true);
    });

    // RPC should be called twice (different dates = different cache keys)
    expect(supabase.rpc).toHaveBeenCalledTimes(2);
    expect(supabase.rpc).toHaveBeenNthCalledWith(
      1,
      "get_active_opening_hours",
      {
        target_date: "2025-01-15",
      }
    );
    expect(supabase.rpc).toHaveBeenNthCalledWith(
      2,
      "get_active_opening_hours",
      {
        target_date: "2025-01-16",
      }
    );
  });

  it("should format date correctly", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockOpeningHours,
      error: null,
    } as any);

    // Test with different date formats
    const testDate = new Date(2025, 0, 15, 14, 30, 0); // Jan 15, 2025, 14:30
    renderHook(() => useOpeningHours(testDate), { wrapper });

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith("get_active_opening_hours", {
        target_date: "2025-01-15",
      });
    });
  });

  it("should handle closed days correctly", async () => {
    const closedDayHours: OpeningHoursWeek = {
      ...mockOpeningHours,
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: closedDayHours,
      error: null,
    } as any);

    const testDate = new Date("2025-01-15");
    const { result } = renderHook(() => useOpeningHours(testDate), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.sunday.is_open).toBe(false);
    expect(result.current.data?.sunday.open_time).toBeNull();
    expect(result.current.data?.sunday.close_time).toBeNull();
  });

  it("should have correct staleTime and gcTime", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockOpeningHours,
      error: null,
    } as any);

    const testDate = new Date("2025-01-15");
    const { result } = renderHook(() => useOpeningHours(testDate), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Data should be considered fresh for 5 minutes
    expect(result.current.isStale).toBe(false);
  });
});
