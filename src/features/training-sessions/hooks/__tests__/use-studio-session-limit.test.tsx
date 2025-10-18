import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStudioSessionLimit } from "../use-studio-session-limit";
import * as sessionLimitUtils from "../../lib/session-limit-utils";

// Mock the session limit utilities
vi.mock("../../lib/session-limit-utils", () => ({
  checkStudioSessionLimit: vi.fn(),
  getWeekRange: vi.fn(),
}));

describe("useStudioSessionLimit", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock getWeekRange to return consistent values
    vi.mocked(sessionLimitUtils.getWeekRange).mockReturnValue({
      start: "2025-10-13",
      end: "2025-10-19",
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should fetch session limit data on mount", async () => {
    const mockLimit = {
      current_count: 237,
      max_allowed: 250,
      can_book: true,
      percentage: 94,
    };

    vi.mocked(sessionLimitUtils.checkStudioSessionLimit).mockResolvedValue(
      mockLimit
    );

    const { result } = renderHook(
      () => useStudioSessionLimit(new Date(2025, 9, 18)),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockLimit);
    expect(sessionLimitUtils.checkStudioSessionLimit).toHaveBeenCalledWith(
      new Date(2025, 9, 18)
    );
  });

  it("should use correct query key based on week range", async () => {
    const mockLimit = {
      current_count: 100,
      max_allowed: 250,
      can_book: true,
      percentage: 40,
    };

    vi.mocked(sessionLimitUtils.checkStudioSessionLimit).mockResolvedValue(
      mockLimit
    );

    const { result } = renderHook(
      () => useStudioSessionLimit(new Date(2025, 9, 18)),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify query key includes week range
    const queries = queryClient.getQueryCache().getAll();
    expect(queries[0].queryKey).toEqual([
      "studio-session-limit",
      "2025-10-13",
      "2025-10-19",
    ]);
  });

  it("should update data when date changes (different week)", async () => {
    const mockLimit1 = {
      current_count: 100,
      max_allowed: 250,
      can_book: true,
      percentage: 40,
    };

    const mockLimit2 = {
      current_count: 200,
      max_allowed: 250,
      can_book: true,
      percentage: 80,
    };

    vi.mocked(sessionLimitUtils.checkStudioSessionLimit)
      .mockResolvedValueOnce(mockLimit1)
      .mockResolvedValueOnce(mockLimit2);

    // First render with Oct 18
    const { result, rerender } = renderHook(
      ({ date }) => useStudioSessionLimit(date),
      {
        wrapper,
        initialProps: { date: new Date(2025, 9, 18) },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockLimit1);

    // Change to next week
    vi.mocked(sessionLimitUtils.getWeekRange).mockReturnValue({
      start: "2025-10-20",
      end: "2025-10-26",
    });

    rerender({ date: new Date(2025, 9, 25) });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockLimit2);
    });
  });

  it("should handle errors gracefully", async () => {
    const mockError = new Error("Database connection failed");

    vi.mocked(sessionLimitUtils.checkStudioSessionLimit).mockRejectedValue(
      mockError
    );

    const { result } = renderHook(
      () => useStudioSessionLimit(new Date(2025, 9, 18)),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it("should configure staleTime to 30 seconds", async () => {
    const mockLimit = {
      current_count: 100,
      max_allowed: 250,
      can_book: true,
      percentage: 40,
    };

    vi.mocked(sessionLimitUtils.checkStudioSessionLimit).mockResolvedValue(
      mockLimit
    );

    const { result } = renderHook(
      () => useStudioSessionLimit(new Date(2025, 9, 18)),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queries = queryClient.getQueryCache().getAll();
    const staleTime = queries[0].options.staleTime;

    expect(staleTime).toBe(30000);
  });
});
