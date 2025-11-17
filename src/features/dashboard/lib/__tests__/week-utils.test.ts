/**
 * Week Utilities Tests
 *
 * Tests for calendar week boundary calculations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getCalendarWeekBounds,
  getLastWeekBounds,
  getCurrentWeekBounds,
  getNextWeekBounds,
  formatWeekRange,
} from "../week-utils";

describe("week-utils", () => {
  beforeEach(() => {
    // Mock the system time to a known date for consistent tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getCalendarWeekBounds", () => {
    it("should return Monday as week start and Sunday as week end", () => {
      // Wednesday, January 1, 2025
      const date = new Date(2025, 0, 1); // Month is 0-indexed
      const result = getCalendarWeekBounds(date);

      // Week containing Jan 1, 2025 (Wednesday):
      // Monday Dec 30, 2024 - Sunday Jan 5, 2025
      expect(result).toEqual({
        week_start: "2024-12-30",
        week_end: "2025-01-05",
      });
    });

    it("should handle a Monday correctly", () => {
      // Monday, January 6, 2025
      const date = new Date(2025, 0, 6);
      const result = getCalendarWeekBounds(date);

      // Week should be Jan 6 - Jan 12, 2025
      expect(result).toEqual({
        week_start: "2025-01-06",
        week_end: "2025-01-12",
      });
    });

    it("should handle a Sunday correctly", () => {
      // Sunday, January 5, 2025
      const date = new Date(2025, 0, 5);
      const result = getCalendarWeekBounds(date);

      // Week should be Dec 30, 2024 - Jan 5, 2025
      expect(result).toEqual({
        week_start: "2024-12-30",
        week_end: "2025-01-05",
      });
    });

    it("should handle year boundary correctly", () => {
      // Tuesday, December 31, 2024
      const date = new Date(2024, 11, 31);
      const result = getCalendarWeekBounds(date);

      // Week containing Dec 31, 2024 (Tuesday):
      // Monday Dec 30, 2024 - Sunday Jan 5, 2025
      expect(result).toEqual({
        week_start: "2024-12-30",
        week_end: "2025-01-05",
      });
    });

    it("should handle month boundary correctly", () => {
      // Friday, March 1, 2024
      const date = new Date(2024, 2, 1);
      const result = getCalendarWeekBounds(date);

      // Week containing Mar 1, 2024 (Friday):
      // Monday Feb 26, 2024 - Sunday Mar 3, 2024
      expect(result).toEqual({
        week_start: "2024-02-26",
        week_end: "2024-03-03",
      });
    });

    it("should handle leap year correctly", () => {
      // Thursday, February 29, 2024 (leap year)
      const date = new Date(2024, 1, 29);
      const result = getCalendarWeekBounds(date);

      // Week containing Feb 29, 2024 (Thursday):
      // Monday Feb 26, 2024 - Sunday Mar 3, 2024
      expect(result).toEqual({
        week_start: "2024-02-26",
        week_end: "2024-03-03",
      });
    });
  });

  describe("getLastWeekBounds", () => {
    it("should return last week's bounds relative to current date", () => {
      // Set current date to Wednesday, January 15, 2025
      vi.setSystemTime(new Date(2025, 0, 15));

      const result = getLastWeekBounds();

      // Last week: Monday Jan 6 - Sunday Jan 12, 2025
      expect(result).toEqual({
        week_start: "2025-01-06",
        week_end: "2025-01-12",
      });
    });

    it("should handle year boundary for last week", () => {
      // Set current date to Thursday, January 2, 2025
      vi.setSystemTime(new Date(2025, 0, 2));

      const result = getLastWeekBounds();

      // Last week: Monday Dec 23, 2024 - Sunday Dec 29, 2024
      expect(result).toEqual({
        week_start: "2024-12-23",
        week_end: "2024-12-29",
      });
    });
  });

  describe("getCurrentWeekBounds", () => {
    it("should return current week's bounds", () => {
      // Set current date to Wednesday, January 15, 2025
      vi.setSystemTime(new Date(2025, 0, 15));

      const result = getCurrentWeekBounds();

      // Current week: Monday Jan 13 - Sunday Jan 19, 2025
      expect(result).toEqual({
        week_start: "2025-01-13",
        week_end: "2025-01-19",
      });
    });

    it("should return correct bounds when current day is Monday", () => {
      // Set current date to Monday, January 13, 2025
      vi.setSystemTime(new Date(2025, 0, 13));

      const result = getCurrentWeekBounds();

      // Current week: Monday Jan 13 - Sunday Jan 19, 2025
      expect(result).toEqual({
        week_start: "2025-01-13",
        week_end: "2025-01-19",
      });
    });

    it("should return correct bounds when current day is Sunday", () => {
      // Set current date to Sunday, January 19, 2025
      vi.setSystemTime(new Date(2025, 0, 19));

      const result = getCurrentWeekBounds();

      // Current week: Monday Jan 13 - Sunday Jan 19, 2025
      expect(result).toEqual({
        week_start: "2025-01-13",
        week_end: "2025-01-19",
      });
    });
  });

  describe("getNextWeekBounds", () => {
    it("should return next week's bounds relative to current date", () => {
      // Set current date to Wednesday, January 15, 2025
      vi.setSystemTime(new Date(2025, 0, 15));

      const result = getNextWeekBounds();

      // Next week: Monday Jan 20 - Sunday Jan 26, 2025
      expect(result).toEqual({
        week_start: "2025-01-20",
        week_end: "2025-01-26",
      });
    });

    it("should handle year boundary for next week", () => {
      // Set current date to Monday, December 30, 2024
      vi.setSystemTime(new Date(2024, 11, 30));

      const result = getNextWeekBounds();

      // Next week: Monday Jan 6 - Sunday Jan 12, 2025
      expect(result).toEqual({
        week_start: "2025-01-06",
        week_end: "2025-01-12",
      });
    });
  });

  describe("formatWeekRange", () => {
    it("should format week range in same month correctly", () => {
      const result = formatWeekRange("2025-01-06", "2025-01-12");
      expect(result).toBe("Jan 6 - 12, 2025");
    });

    it("should format week range across different months correctly", () => {
      const result = formatWeekRange("2024-12-30", "2025-01-05");
      expect(result).toBe("Dec 30 - Jan 5, 2025");
    });

    it("should format week range with single-digit days correctly", () => {
      const result = formatWeekRange("2025-01-01", "2025-01-07");
      expect(result).toBe("Jan 1 - 7, 2025");
    });

    it("should format week range at month boundary correctly", () => {
      const result = formatWeekRange("2024-02-26", "2024-03-03");
      expect(result).toBe("Feb 26 - Mar 3, 2024");
    });

    it("should format week range at year boundary correctly", () => {
      const result = formatWeekRange("2024-12-30", "2025-01-05");
      expect(result).toBe("Dec 30 - Jan 5, 2025");
    });

    it("should use the year from the end date", () => {
      // Week spanning year boundary
      const result = formatWeekRange("2024-12-30", "2025-01-05");
      expect(result).toContain("2025"); // Should show 2025, not 2024
    });
  });

  describe("Edge Cases and Integration", () => {
    it("should maintain consistency across all week functions", () => {
      // Set current date to Wednesday, January 15, 2025
      vi.setSystemTime(new Date(2025, 0, 15));

      const current = getCurrentWeekBounds();
      const last = getLastWeekBounds();
      const next = getNextWeekBounds();

      // Verify current week
      expect(current).toEqual({
        week_start: "2025-01-13",
        week_end: "2025-01-19",
      });

      // Verify last week is 7 days before current week start
      expect(last).toEqual({
        week_start: "2025-01-06",
        week_end: "2025-01-12",
      });

      // Verify next week is 7 days after current week end
      expect(next).toEqual({
        week_start: "2025-01-20",
        week_end: "2025-01-26",
      });
    });

    it("should handle the specific test case from requirements", () => {
      // Wednesday, January 1, 2025
      const date = new Date(2025, 0, 1);
      const result = getCalendarWeekBounds(date);

      // Should return Monday Dec 30, 2024 as week_start
      expect(result.week_start).toBe("2024-12-30");
      expect(result.week_end).toBe("2025-01-05");
    });
  });
});
