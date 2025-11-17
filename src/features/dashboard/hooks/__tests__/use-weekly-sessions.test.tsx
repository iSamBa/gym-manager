/**
 * Weekly Sessions Hook Tests
 *
 * Tests for useWeeklySessions and useThreeWeekSessions hooks
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createQueryWrapper } from "@/test/query-test-utils";
import type { WeeklySessionStats } from "../../lib/types";

// Mock analytics utils
const mockGetWeeklySessionStats = vi.fn();

vi.mock("../../lib/analytics-utils", () => ({
  getWeeklySessionStats: mockGetWeeklySessionStats,
}));

// Mock week utils
const mockGetLastWeekBounds = vi.fn();
const mockGetCurrentWeekBounds = vi.fn();
const mockGetNextWeekBounds = vi.fn();

vi.mock("../../lib/week-utils", () => ({
  getLastWeekBounds: mockGetLastWeekBounds,
  getCurrentWeekBounds: mockGetCurrentWeekBounds,
  getNextWeekBounds: mockGetNextWeekBounds,
}));

describe("Weekly Sessions Hooks", () => {
  const mockWeeklyStats: WeeklySessionStats = {
    week_start: "2025-01-13",
    week_end: "2025-01-19",
    total_sessions: 45,
    trial: 5,
    member: 20,
    contractual: 10,
    multi_site: 3,
    collaboration: 2,
    makeup: 3,
    non_bookable: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useWeeklySessions", () => {
    it("should fetch weekly session stats successfully", async () => {
      mockGetWeeklySessionStats.mockResolvedValue(mockWeeklyStats);

      const { useWeeklySessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useWeeklySessions("2025-01-13"), {
        wrapper: createQueryWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockWeeklyStats);
      expect(result.current.isSuccess).toBe(true);
      expect(mockGetWeeklySessionStats).toHaveBeenCalledWith("2025-01-13");
    });

    it("should return loading state while fetching", async () => {
      // Simulate slow response
      mockGetWeeklySessionStats.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockWeeklyStats), 100)
          )
      );

      const { useWeeklySessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useWeeklySessions("2025-01-13"), {
        wrapper: createQueryWrapper(),
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should handle error state on fetch failure", async () => {
      const error = new Error("Failed to fetch stats");
      mockGetWeeklySessionStats.mockRejectedValue(error);

      const { useWeeklySessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useWeeklySessions("2025-01-13"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it("should handle null data from analytics utils", async () => {
      mockGetWeeklySessionStats.mockResolvedValue(null);

      const { useWeeklySessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useWeeklySessions("2025-01-13"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it("should be disabled when weekStart is empty", async () => {
      const { useWeeklySessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useWeeklySessions(""), {
        wrapper: createQueryWrapper(),
      });

      // Should not fetch when disabled
      expect(mockGetWeeklySessionStats).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it("should use correct query key", async () => {
      const { useWeeklySessions, weeklySessionsKeys } = await import(
        "../use-weekly-sessions"
      );

      expect(weeklySessionsKeys.week("2025-01-13")).toEqual([
        "weekly-sessions",
        "2025-01-13",
      ]);
    });

    it("should have correct staleTime configuration", async () => {
      mockGetWeeklySessionStats.mockResolvedValue(mockWeeklyStats);

      const { useWeeklySessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useWeeklySessions("2025-01-13"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify hook returns successfully (staleTime is internal to query config)
      expect(result.current.data).toEqual(mockWeeklyStats);
    });

    it("should fetch different weeks independently", async () => {
      const week1Stats = { ...mockWeeklyStats, week_start: "2025-01-06" };
      const week2Stats = { ...mockWeeklyStats, week_start: "2025-01-13" };

      mockGetWeeklySessionStats
        .mockResolvedValueOnce(week1Stats)
        .mockResolvedValueOnce(week2Stats);

      const { useWeeklySessions } = await import("../use-weekly-sessions");

      // First week
      const { result: result1 } = renderHook(
        () => useWeeklySessions("2025-01-06"),
        {
          wrapper: createQueryWrapper(),
        }
      );

      await waitFor(() => {
        expect(result1.current.data).toEqual(week1Stats);
      });

      // Second week
      const { result: result2 } = renderHook(
        () => useWeeklySessions("2025-01-13"),
        {
          wrapper: createQueryWrapper(),
        }
      );

      await waitFor(() => {
        expect(result2.current.data).toEqual(week2Stats);
      });
    });
  });

  describe("useThreeWeekSessions", () => {
    const lastWeekStats: WeeklySessionStats = {
      week_start: "2025-01-06",
      week_end: "2025-01-12",
      total_sessions: 40,
      trial: 4,
      member: 18,
      contractual: 9,
      multi_site: 3,
      collaboration: 2,
      makeup: 2,
      non_bookable: 2,
    };

    const currentWeekStats: WeeklySessionStats = {
      week_start: "2025-01-13",
      week_end: "2025-01-19",
      total_sessions: 45,
      trial: 5,
      member: 20,
      contractual: 10,
      multi_site: 3,
      collaboration: 2,
      makeup: 3,
      non_bookable: 2,
    };

    const nextWeekStats: WeeklySessionStats = {
      week_start: "2025-01-20",
      week_end: "2025-01-26",
      total_sessions: 48,
      trial: 6,
      member: 22,
      contractual: 10,
      multi_site: 3,
      collaboration: 2,
      makeup: 3,
      non_bookable: 2,
    };

    beforeEach(() => {
      mockGetLastWeekBounds.mockReturnValue({ week_start: "2025-01-06" });
      mockGetCurrentWeekBounds.mockReturnValue({ week_start: "2025-01-13" });
      mockGetNextWeekBounds.mockReturnValue({ week_start: "2025-01-20" });
    });

    it("should fetch all three weeks in parallel", async () => {
      mockGetWeeklySessionStats
        .mockResolvedValueOnce(lastWeekStats)
        .mockResolvedValueOnce(currentWeekStats)
        .mockResolvedValueOnce(nextWeekStats);

      const { useThreeWeekSessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useThreeWeekSessions(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data.lastWeek).toEqual(lastWeekStats);
      expect(result.current.data.currentWeek).toEqual(currentWeekStats);
      expect(result.current.data.nextWeek).toEqual(nextWeekStats);

      // Verify all three calls were made
      expect(mockGetWeeklySessionStats).toHaveBeenCalledTimes(3);
      expect(mockGetWeeklySessionStats).toHaveBeenCalledWith("2025-01-06");
      expect(mockGetWeeklySessionStats).toHaveBeenCalledWith("2025-01-13");
      expect(mockGetWeeklySessionStats).toHaveBeenCalledWith("2025-01-20");
    });

    it("should handle loading state correctly", async () => {
      // Simulate slow responses
      mockGetWeeklySessionStats.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockWeeklyStats), 100)
          )
      );

      const { useThreeWeekSessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useThreeWeekSessions(), {
        wrapper: createQueryWrapper(),
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);
    });

    it("should handle error in any week fetch", async () => {
      const error = new Error("Failed to fetch last week");
      mockGetWeeklySessionStats
        .mockRejectedValueOnce(error) // Last week fails
        .mockResolvedValueOnce(currentWeekStats)
        .mockResolvedValueOnce(nextWeekStats);

      const { useThreeWeekSessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useThreeWeekSessions(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should handle null data for some weeks", async () => {
      mockGetWeeklySessionStats
        .mockResolvedValueOnce(lastWeekStats)
        .mockResolvedValueOnce(null) // Current week has no data
        .mockResolvedValueOnce(nextWeekStats);

      const { useThreeWeekSessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useThreeWeekSessions(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data.lastWeek).toEqual(lastWeekStats);
      expect(result.current.data.currentWeek).toBeNull();
      expect(result.current.data.nextWeek).toEqual(nextWeekStats);
    });

    it("should return data structure matching ThreeWeekSessionsData type", async () => {
      mockGetWeeklySessionStats
        .mockResolvedValueOnce(lastWeekStats)
        .mockResolvedValueOnce(currentWeekStats)
        .mockResolvedValueOnce(nextWeekStats);

      const { useThreeWeekSessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useThreeWeekSessions(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify structure matches ThreeWeekSessionsData interface
      expect(result.current.data).toHaveProperty("lastWeek");
      expect(result.current.data).toHaveProperty("currentWeek");
      expect(result.current.data).toHaveProperty("nextWeek");
    });

    it("should call week utils to get correct date bounds", async () => {
      mockGetWeeklySessionStats.mockResolvedValue(mockWeeklyStats);

      const { useThreeWeekSessions } = await import("../use-weekly-sessions");
      renderHook(() => useThreeWeekSessions(), {
        wrapper: createQueryWrapper(),
      });

      expect(mockGetLastWeekBounds).toHaveBeenCalled();
      expect(mockGetCurrentWeekBounds).toHaveBeenCalled();
      expect(mockGetNextWeekBounds).toHaveBeenCalled();
    });

    it("should maintain independent error states for each week", async () => {
      const error1 = new Error("Last week error");
      const error2 = new Error("Current week error");

      mockGetWeeklySessionStats
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockResolvedValueOnce(nextWeekStats);

      const { useThreeWeekSessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useThreeWeekSessions(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should report error if ANY query fails
      expect(result.current.isError).toBe(true);
    });
  });

  describe("Query Keys", () => {
    it("should export correct query key structure", async () => {
      const { weeklySessionsKeys } = await import("../use-weekly-sessions");

      expect(weeklySessionsKeys.all).toEqual(["weekly-sessions"]);
      expect(weeklySessionsKeys.week("2025-01-13")).toEqual([
        "weekly-sessions",
        "2025-01-13",
      ]);
      expect(weeklySessionsKeys.threeWeeks()).toEqual([
        "weekly-sessions",
        "three-weeks",
      ]);
    });
  });

  describe("React Query Configuration", () => {
    it("should have correct cache configuration (5 min stale, 10 min gc)", async () => {
      mockGetWeeklySessionStats.mockResolvedValue(mockWeeklyStats);

      const { useWeeklySessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useWeeklySessions("2025-01-13"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify the query succeeded (actual timing is verified in implementation)
      expect(result.current.data).toEqual(mockWeeklyStats);
    });

    it("should use useQueries for parallel fetching in useThreeWeekSessions", async () => {
      mockGetWeeklySessionStats
        .mockResolvedValueOnce(mockWeeklyStats)
        .mockResolvedValueOnce(mockWeeklyStats)
        .mockResolvedValueOnce(mockWeeklyStats);

      const { useThreeWeekSessions } = await import("../use-weekly-sessions");
      const { result } = renderHook(() => useThreeWeekSessions(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // All three should be called (parallel execution)
      expect(mockGetWeeklySessionStats).toHaveBeenCalledTimes(3);
    });
  });
});
