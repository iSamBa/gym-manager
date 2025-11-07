import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDailyStatistics } from "../use-training-sessions";
import { supabase } from "@/lib/supabase";
import type { ReactNode } from "react";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe("useDailyStatistics", () => {
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
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockWeekStart = new Date(2025, 0, 13); // Monday, January 13, 2025
  const mockWeekEnd = new Date(2025, 0, 19); // Sunday, January 19, 2025

  describe("Successful data fetching", () => {
    it("fetches statistics for date range", async () => {
      const mockData = [
        {
          day_date: "2025-01-13",
          total_count: 10,
          trial_count: 2,
          member_count: 5,
          contractual_count: 2,
          makeup_count: 1,
          multi_site_count: 0,
          collaboration_count: 0,
          non_bookable_count: 0,
        },
        {
          day_date: "2025-01-14",
          total_count: 12,
          trial_count: 3,
          member_count: 6,
          contractual_count: 2,
          makeup_count: 1,
          multi_site_count: 0,
          collaboration_count: 0,
          non_bookable_count: 0,
        },
        {
          day_date: "2025-01-15",
          total_count: 8,
          trial_count: 1,
          member_count: 4,
          contractual_count: 2,
          makeup_count: 1,
          multi_site_count: 0,
          collaboration_count: 0,
          non_bookable_count: 0,
        },
      ];

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      const { result } = renderHook(
        () => useDailyStatistics(mockWeekStart, mockWeekEnd),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.rpc).toHaveBeenCalledWith(
        "get_daily_session_statistics",
        {
          p_start_date: "2025-01-13",
          p_end_date: "2025-01-19",
        }
      );

      expect(result.current.data).toEqual([
        {
          date: "2025-01-13",
          total: 10,
          trial: 2,
          member: 5,
          contractual: 2,
          makeup: 1,
          multi_site: 0,
          collaboration: 0,
          non_bookable: 0,
        },
        {
          date: "2025-01-14",
          total: 12,
          trial: 3,
          member: 6,
          contractual: 2,
          makeup: 1,
          multi_site: 0,
          collaboration: 0,
          non_bookable: 0,
        },
        {
          date: "2025-01-15",
          total: 8,
          trial: 1,
          member: 4,
          contractual: 2,
          makeup: 1,
          multi_site: 0,
          collaboration: 0,
          non_bookable: 0,
        },
      ]);
    });

    it("handles empty results gracefully", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(
        () => useDailyStatistics(mockWeekStart, mockWeekEnd),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it("handles null data gracefully", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(
        () => useDailyStatistics(mockWeekStart, mockWeekEnd),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });

  describe("Error handling", () => {
    it("handles database errors", async () => {
      const mockError = {
        message: "Database connection failed",
        code: "PGRST116",
      };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(
        () => useDailyStatistics(mockWeekStart, mockWeekEnd),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain(
        "Failed to fetch daily statistics"
      );
      expect(result.current.error?.message).toContain(
        "Database connection failed"
      );
    });
  });

  describe("Data transformation", () => {
    it("transforms RPC response correctly", async () => {
      const mockRpcData = [
        {
          day_date: "2025-01-16",
          total_count: 15,
          trial_count: 3,
          member_count: 7,
          contractual_count: 3,
          makeup_count: 2,
          multi_site_count: 0,
          collaboration_count: 0,
          non_bookable_count: 0,
        },
      ];

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockRpcData,
        error: null,
      });

      const { result } = renderHook(
        () => useDailyStatistics(mockWeekStart, mockWeekEnd),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify field name transformation
      expect(result.current.data?.[0]).toEqual({
        date: "2025-01-16", // day_date → date
        total: 15, // total_count → total
        trial: 3, // trial_count → trial
        member: 7, // member_count → member
        contractual: 3, // contractual_count → contractual
        makeup: 2, // makeup_count → makeup
        multi_site: 0, // multi_site_count → multi_site
        collaboration: 0, // collaboration_count → collaboration
        non_bookable: 0, // non_bookable_count → non_bookable
      });
    });

    it("validates data integrity (sum of all types = total)", async () => {
      const mockData = [
        {
          day_date: "2025-01-13",
          total_count: 10,
          trial_count: 2,
          member_count: 5,
          contractual_count: 2,
          makeup_count: 1,
          multi_site_count: 0,
          collaboration_count: 0,
          non_bookable_count: 0,
        },
        {
          day_date: "2025-01-14",
          total_count: 15,
          trial_count: 3,
          member_count: 7,
          contractual_count: 3,
          makeup_count: 1,
          multi_site_count: 1,
          collaboration_count: 0,
          non_bookable_count: 0,
        },
      ];

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      const { result } = renderHook(
        () => useDailyStatistics(mockWeekStart, mockWeekEnd),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Validate each day's data
      result.current.data?.forEach((stat) => {
        const sum =
          stat.trial +
          stat.member +
          stat.contractual +
          stat.makeup +
          stat.multi_site +
          stat.collaboration +
          stat.non_bookable;
        expect(sum).toBe(stat.total);
      });
    });
  });

  describe("Cache configuration", () => {
    it("uses correct query key", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(
        () => useDailyStatistics(mockWeekStart, mockWeekEnd),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Check query key format
      const queryState = queryClient.getQueryState([
        "daily-statistics",
        "2025-01-13",
        "2025-01-19",
      ]);

      expect(queryState).toBeDefined();
    });

    it("updates when date range changes", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      });

      const { result, rerender } = renderHook(
        ({ start, end }: { start: Date; end: Date }) =>
          useDailyStatistics(start, end),
        {
          wrapper,
          initialProps: {
            start: mockWeekStart,
            end: mockWeekEnd,
          },
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const firstCallCount = vi.mocked(supabase.rpc).mock.calls.length;

      // Change date range
      const newWeekStart = new Date(2025, 0, 20); // Next Monday
      const newWeekEnd = new Date(2025, 0, 26); // Next Sunday

      rerender({ start: newWeekStart, end: newWeekEnd });

      await waitFor(() => {
        expect(vi.mocked(supabase.rpc).mock.calls.length).toBeGreaterThan(
          firstCallCount
        );
      });

      // Verify new query was made with updated dates
      expect(supabase.rpc).toHaveBeenLastCalledWith(
        "get_daily_session_statistics",
        {
          p_start_date: "2025-01-20",
          p_end_date: "2025-01-26",
        }
      );
    });
  });

  describe("Loading states", () => {
    it("shows loading state initially", () => {
      vi.mocked(supabase.rpc).mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      );

      const { result } = renderHook(
        () => useDailyStatistics(mockWeekStart, mockWeekEnd),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("clears loading state after successful fetch", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(
        () => useDailyStatistics(mockWeekStart, mockWeekEnd),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeDefined();
    });
  });
});
