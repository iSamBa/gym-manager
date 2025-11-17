/**
 * Analytics Utilities Tests
 *
 * Tests for dashboard analytics utility functions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WeeklySessionStats, MonthlyActivityStats } from "../types";

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
};

vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));

// Mock logger
const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}));

describe("Dashboard Analytics Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWeeklySessionStats", () => {
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

    it("should fetch weekly session stats successfully", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [mockWeeklyStats],
        error: null,
      });

      const { getWeeklySessionStats } = await import("../analytics-utils");
      const result = await getWeeklySessionStats("2025-01-13");

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "get_weekly_session_stats",
        {
          p_week_start_date: "2025-01-13",
        }
      );
      expect(result).toEqual(mockWeeklyStats);
    });

    it("should return null when RPC returns empty array", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const { getWeeklySessionStats } = await import("../analytics-utils");
      const result = await getWeeklySessionStats("2025-01-13");

      expect(result).toBeNull();
    });

    it("should return null when RPC returns null data", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const { getWeeklySessionStats } = await import("../analytics-utils");
      const result = await getWeeklySessionStats("2025-01-13");

      expect(result).toBeNull();
    });

    it("should handle RPC error and log it", async () => {
      const error = new Error("Database connection failed");
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error,
      });

      const { getWeeklySessionStats } = await import("../analytics-utils");
      const result = await getWeeklySessionStats("2025-01-13");

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error fetching weekly session stats:",
        {
          error,
          weekStartDate: "2025-01-13",
        }
      );
    });

    it("should handle exception during RPC call", async () => {
      const error = new Error("Network error");
      mockSupabase.rpc.mockRejectedValue(error);

      const { getWeeklySessionStats } = await import("../analytics-utils");
      const result = await getWeeklySessionStats("2025-01-13");

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Database error in getWeeklySessionStats:",
        { error }
      );
    });

    it("should handle different week start dates", async () => {
      const differentStats = { ...mockWeeklyStats, week_start: "2025-01-20" };
      mockSupabase.rpc.mockResolvedValue({
        data: [differentStats],
        error: null,
      });

      const { getWeeklySessionStats } = await import("../analytics-utils");
      const result = await getWeeklySessionStats("2025-01-20");

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "get_weekly_session_stats",
        {
          p_week_start_date: "2025-01-20",
        }
      );
      expect(result).toEqual(differentStats);
    });
  });

  describe("getMonthlyActivityStats", () => {
    const mockMonthlyStats: MonthlyActivityStats = {
      month_start: "2025-01-01",
      month_end: "2025-01-31",
      trial_sessions: 15,
      trial_conversions: 8,
      subscriptions_expired: 5,
      subscriptions_renewed: 20,
      subscriptions_cancelled: 3,
    };

    it("should fetch monthly activity stats successfully", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [mockMonthlyStats],
        error: null,
      });

      const { getMonthlyActivityStats } = await import("../analytics-utils");
      const result = await getMonthlyActivityStats("2025-01-01");

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "get_monthly_activity_stats",
        {
          p_month_start_date: "2025-01-01",
        }
      );
      expect(result).toEqual(mockMonthlyStats);
    });

    it("should return null when RPC returns empty array", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const { getMonthlyActivityStats } = await import("../analytics-utils");
      const result = await getMonthlyActivityStats("2025-01-01");

      expect(result).toBeNull();
    });

    it("should return null when RPC returns null data", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const { getMonthlyActivityStats } = await import("../analytics-utils");
      const result = await getMonthlyActivityStats("2025-01-01");

      expect(result).toBeNull();
    });

    it("should handle RPC error and log it", async () => {
      const error = new Error("Permission denied");
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error,
      });

      const { getMonthlyActivityStats } = await import("../analytics-utils");
      const result = await getMonthlyActivityStats("2025-01-01");

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error fetching monthly activity stats:",
        {
          error,
          monthStartDate: "2025-01-01",
        }
      );
    });

    it("should handle exception during RPC call", async () => {
      const error = new Error("Timeout");
      mockSupabase.rpc.mockRejectedValue(error);

      const { getMonthlyActivityStats } = await import("../analytics-utils");
      const result = await getMonthlyActivityStats("2025-01-01");

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Database error in getMonthlyActivityStats:",
        { error }
      );
    });

    it("should handle different month start dates", async () => {
      const differentStats = { ...mockMonthlyStats, month_start: "2025-02-01" };
      mockSupabase.rpc.mockResolvedValue({
        data: [differentStats],
        error: null,
      });

      const { getMonthlyActivityStats } = await import("../analytics-utils");
      const result = await getMonthlyActivityStats("2025-02-01");

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "get_monthly_activity_stats",
        {
          p_month_start_date: "2025-02-01",
        }
      );
      expect(result).toEqual(differentStats);
    });

    it("should handle edge case with zero stats", async () => {
      const zeroStats: MonthlyActivityStats = {
        month_start: "2025-01-01",
        month_end: "2025-01-31",
        trial_sessions: 0,
        trial_conversions: 0,
        subscriptions_expired: 0,
        subscriptions_renewed: 0,
        subscriptions_cancelled: 0,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [zeroStats],
        error: null,
      });

      const { getMonthlyActivityStats } = await import("../analytics-utils");
      const result = await getMonthlyActivityStats("2025-01-01");

      expect(result).toEqual(zeroStats);
    });
  });

  describe("Error Handling Integration", () => {
    it("should never use console.log for errors", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      const consoleErrorSpy = vi.spyOn(console, "error");

      mockSupabase.rpc.mockRejectedValue(new Error("Test error"));

      const { getWeeklySessionStats, getMonthlyActivityStats } = await import(
        "../analytics-utils"
      );

      await getWeeklySessionStats("2025-01-13");
      await getMonthlyActivityStats("2025-01-01");

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
