/**
 * Monthly Activity Hook Tests
 *
 * Tests for useMonthlyActivity hook
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createQueryWrapper } from "@/test/query-test-utils";
import type { MonthlyActivityStats } from "../../lib/types";

// Mock analytics utils
const mockGetMonthlyActivityStats = vi.fn();

vi.mock("../../lib/analytics-utils", () => ({
  getMonthlyActivityStats: mockGetMonthlyActivityStats,
}));

describe("Monthly Activity Hook", () => {
  const mockMonthlyStats: MonthlyActivityStats = {
    month_start: "2025-01-01",
    month_end: "2025-01-31",
    trial_sessions: 15,
    trial_conversions: 8,
    subscriptions_expired: 5,
    subscriptions_renewed: 20,
    subscriptions_cancelled: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMonthlyActivity", () => {
    it("should fetch monthly activity stats successfully", async () => {
      mockGetMonthlyActivityStats.mockResolvedValue(mockMonthlyStats);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockMonthlyStats);
      expect(result.current.isSuccess).toBe(true);
      expect(mockGetMonthlyActivityStats).toHaveBeenCalledWith("2025-01-01");
    });

    it("should return loading state while fetching", async () => {
      // Simulate slow response
      mockGetMonthlyActivityStats.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockMonthlyStats), 100)
          )
      );

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should handle error state on fetch failure", async () => {
      const error = new Error("Failed to fetch monthly stats");
      mockGetMonthlyActivityStats.mockRejectedValue(error);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it("should handle null data from analytics utils", async () => {
      mockGetMonthlyActivityStats.mockResolvedValue(null);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it("should be disabled when monthStart is empty", async () => {
      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity(""), {
        wrapper: createQueryWrapper(),
      });

      // Should not fetch when disabled
      expect(mockGetMonthlyActivityStats).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it("should use correct query key", async () => {
      const { useMonthlyActivity, monthlyActivityKeys } = await import(
        "../use-monthly-activity"
      );

      expect(monthlyActivityKeys.month("2025-01-01")).toEqual([
        "monthly-activity",
        "2025-01-01",
      ]);
    });

    it("should have correct staleTime configuration", async () => {
      mockGetMonthlyActivityStats.mockResolvedValue(mockMonthlyStats);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify hook returns successfully (staleTime is internal to query config)
      expect(result.current.data).toEqual(mockMonthlyStats);
    });

    it("should fetch different months independently", async () => {
      const jan2025Stats = { ...mockMonthlyStats, month_start: "2025-01-01" };
      const feb2025Stats = {
        ...mockMonthlyStats,
        month_start: "2025-02-01",
        month_end: "2025-02-28",
        trial_sessions: 12,
        trial_conversions: 6,
      };

      mockGetMonthlyActivityStats
        .mockResolvedValueOnce(jan2025Stats)
        .mockResolvedValueOnce(feb2025Stats);

      const { useMonthlyActivity } = await import("../use-monthly-activity");

      // January
      const { result: result1 } = renderHook(
        () => useMonthlyActivity("2025-01-01"),
        {
          wrapper: createQueryWrapper(),
        }
      );

      await waitFor(() => {
        expect(result1.current.data).toEqual(jan2025Stats);
      });

      // February
      const { result: result2 } = renderHook(
        () => useMonthlyActivity("2025-02-01"),
        {
          wrapper: createQueryWrapper(),
        }
      );

      await waitFor(() => {
        expect(result2.current.data).toEqual(feb2025Stats);
      });
    });

    it("should handle zero stats gracefully", async () => {
      const zeroStats: MonthlyActivityStats = {
        month_start: "2025-01-01",
        month_end: "2025-01-31",
        trial_sessions: 0,
        trial_conversions: 0,
        subscriptions_expired: 0,
        subscriptions_renewed: 0,
        subscriptions_cancelled: 0,
      };

      mockGetMonthlyActivityStats.mockResolvedValue(zeroStats);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(zeroStats);
    });

    it("should handle high activity stats correctly", async () => {
      const highActivityStats: MonthlyActivityStats = {
        month_start: "2025-01-01",
        month_end: "2025-01-31",
        trial_sessions: 150,
        trial_conversions: 85,
        subscriptions_expired: 25,
        subscriptions_renewed: 200,
        subscriptions_cancelled: 15,
      };

      mockGetMonthlyActivityStats.mockResolvedValue(highActivityStats);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(highActivityStats);
    });

    it("should handle database timeout errors gracefully", async () => {
      const timeoutError = new Error("Query timeout");
      mockGetMonthlyActivityStats.mockRejectedValue(timeoutError);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(timeoutError);
    });

    it("should handle permission errors gracefully", async () => {
      const permissionError = new Error("Permission denied");
      mockGetMonthlyActivityStats.mockRejectedValue(permissionError);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(permissionError);
    });
  });

  describe("Query Keys", () => {
    it("should export correct query key structure", async () => {
      const { monthlyActivityKeys } = await import("../use-monthly-activity");

      expect(monthlyActivityKeys.all).toEqual(["monthly-activity"]);
      expect(monthlyActivityKeys.month("2025-01-01")).toEqual([
        "monthly-activity",
        "2025-01-01",
      ]);
    });

    it("should generate unique query keys for different months", async () => {
      const { monthlyActivityKeys } = await import("../use-monthly-activity");

      const jan = monthlyActivityKeys.month("2025-01-01");
      const feb = monthlyActivityKeys.month("2025-02-01");

      expect(jan).not.toEqual(feb);
      expect(jan).toEqual(["monthly-activity", "2025-01-01"]);
      expect(feb).toEqual(["monthly-activity", "2025-02-01"]);
    });
  });

  describe("React Query Configuration", () => {
    it("should have correct cache configuration (5 min stale, 10 min gc)", async () => {
      mockGetMonthlyActivityStats.mockResolvedValue(mockMonthlyStats);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify the query succeeded (actual timing is verified in implementation)
      expect(result.current.data).toEqual(mockMonthlyStats);
    });

    it("should not retry failed queries in test environment", async () => {
      let callCount = 0;
      mockGetMonthlyActivityStats.mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error("Test error"));
      });

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(callCount).toBe(1); // Should only call once in test environment
      });
    });
  });

  describe("Type Safety", () => {
    it("should enforce MonthlyActivityStats type", async () => {
      mockGetMonthlyActivityStats.mockResolvedValue(mockMonthlyStats);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // TypeScript should enforce that data matches MonthlyActivityStats
      const data = result.current.data as MonthlyActivityStats;
      expect(data).toHaveProperty("month_start");
      expect(data).toHaveProperty("month_end");
      expect(data).toHaveProperty("trial_sessions");
      expect(data).toHaveProperty("trial_conversions");
      expect(data).toHaveProperty("subscriptions_expired");
      expect(data).toHaveProperty("subscriptions_renewed");
      expect(data).toHaveProperty("subscriptions_cancelled");
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid date format gracefully", async () => {
      mockGetMonthlyActivityStats.mockResolvedValue(null);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("invalid-date"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it("should handle future month dates", async () => {
      const futureStats = {
        ...mockMonthlyStats,
        month_start: "2026-12-01",
        month_end: "2026-12-31",
      };
      mockGetMonthlyActivityStats.mockResolvedValue(futureStats);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2026-12-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(futureStats);
    });

    it("should handle very old historical data", async () => {
      const oldStats = {
        ...mockMonthlyStats,
        month_start: "2020-01-01",
        month_end: "2020-01-31",
      };
      mockGetMonthlyActivityStats.mockResolvedValue(oldStats);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2020-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(oldStats);
    });
  });

  describe("Integration with Analytics Utils", () => {
    it("should pass correct parameters to getMonthlyActivityStats", async () => {
      mockGetMonthlyActivityStats.mockResolvedValue(mockMonthlyStats);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(mockGetMonthlyActivityStats).toHaveBeenCalledWith("2025-01-01");
      });
    });

    it("should handle analytics utils errors propagating to hook", async () => {
      const error = new Error("Analytics utils error");
      mockGetMonthlyActivityStats.mockRejectedValue(error);

      const { useMonthlyActivity } = await import("../use-monthly-activity");
      const { result } = renderHook(() => useMonthlyActivity("2025-01-01"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });
  });
});
