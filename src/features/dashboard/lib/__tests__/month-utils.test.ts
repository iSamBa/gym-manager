/**
 * Month Utilities Tests
 *
 * Tests for month boundary calculations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getMonthBounds,
  getCurrentMonthBounds,
  getPreviousMonthBounds,
  getNextMonthBounds,
  formatMonth,
  getMonthBoundsFromString,
} from "../month-utils";

describe("month-utils", () => {
  beforeEach(() => {
    // Mock the system time to a known date for consistent tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getMonthBounds", () => {
    it("should return first and last day of month", () => {
      // January 15, 2025
      const date = new Date(2025, 0, 15);
      const result = getMonthBounds(date);

      expect(result).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });
    });

    it("should handle first day of month correctly", () => {
      // January 1, 2025
      const date = new Date(2025, 0, 1);
      const result = getMonthBounds(date);

      expect(result).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });
    });

    it("should handle last day of month correctly", () => {
      // January 31, 2025
      const date = new Date(2025, 0, 31);
      const result = getMonthBounds(date);

      expect(result).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });
    });

    it("should handle February in non-leap year", () => {
      // February 15, 2025 (not a leap year)
      const date = new Date(2025, 1, 15);
      const result = getMonthBounds(date);

      expect(result).toEqual({
        month_start: "2025-02-01",
        month_end: "2025-02-28",
      });
    });

    it("should handle February in leap year", () => {
      // February 15, 2024 (leap year)
      const date = new Date(2024, 1, 15);
      const result = getMonthBounds(date);

      expect(result).toEqual({
        month_start: "2024-02-01",
        month_end: "2024-02-29",
      });
    });

    it("should handle months with 30 days", () => {
      // April 15, 2025 (30 days)
      const date = new Date(2025, 3, 15);
      const result = getMonthBounds(date);

      expect(result).toEqual({
        month_start: "2025-04-01",
        month_end: "2025-04-30",
      });
    });

    it("should handle December correctly", () => {
      // December 15, 2025
      const date = new Date(2025, 11, 15);
      const result = getMonthBounds(date);

      expect(result).toEqual({
        month_start: "2025-12-01",
        month_end: "2025-12-31",
      });
    });
  });

  describe("getCurrentMonthBounds", () => {
    it("should return current month's bounds", () => {
      // Set current date to January 15, 2025
      vi.setSystemTime(new Date(2025, 0, 15));

      const result = getCurrentMonthBounds();

      expect(result).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });
    });

    it("should return correct bounds on first day of month", () => {
      // Set current date to January 1, 2025
      vi.setSystemTime(new Date(2025, 0, 1));

      const result = getCurrentMonthBounds();

      expect(result).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });
    });

    it("should return correct bounds on last day of month", () => {
      // Set current date to January 31, 2025
      vi.setSystemTime(new Date(2025, 0, 31));

      const result = getCurrentMonthBounds();

      expect(result).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });
    });

    it("should handle leap year February correctly", () => {
      // Set current date to February 15, 2024 (leap year)
      vi.setSystemTime(new Date(2024, 1, 15));

      const result = getCurrentMonthBounds();

      expect(result).toEqual({
        month_start: "2024-02-01",
        month_end: "2024-02-29",
      });
    });
  });

  describe("getPreviousMonthBounds", () => {
    it("should return previous month's bounds", () => {
      // Set current date to February 15, 2025
      vi.setSystemTime(new Date(2025, 1, 15));

      const result = getPreviousMonthBounds();

      // Previous month is January 2025
      expect(result).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });
    });

    it("should handle year boundary correctly", () => {
      // Set current date to January 15, 2025
      vi.setSystemTime(new Date(2025, 0, 15));

      const result = getPreviousMonthBounds();

      // Previous month is December 2024
      expect(result).toEqual({
        month_start: "2024-12-01",
        month_end: "2024-12-31",
      });
    });

    it("should handle leap year transition", () => {
      // Set current date to March 15, 2024
      vi.setSystemTime(new Date(2024, 2, 15));

      const result = getPreviousMonthBounds();

      // Previous month is February 2024 (leap year)
      expect(result).toEqual({
        month_start: "2024-02-01",
        month_end: "2024-02-29",
      });
    });

    it("should handle transition from 31-day to 30-day month", () => {
      // Set current date to May 15, 2025
      vi.setSystemTime(new Date(2025, 4, 15));

      const result = getPreviousMonthBounds();

      // Previous month is April 2025 (30 days)
      expect(result).toEqual({
        month_start: "2025-04-01",
        month_end: "2025-04-30",
      });
    });
  });

  describe("getNextMonthBounds", () => {
    it("should return next month's bounds", () => {
      // Set current date to January 15, 2025
      vi.setSystemTime(new Date(2025, 0, 15));

      const result = getNextMonthBounds();

      // Next month is February 2025
      expect(result).toEqual({
        month_start: "2025-02-01",
        month_end: "2025-02-28",
      });
    });

    it("should handle year boundary correctly", () => {
      // Set current date to December 15, 2024
      vi.setSystemTime(new Date(2024, 11, 15));

      const result = getNextMonthBounds();

      // Next month is January 2025
      expect(result).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });
    });

    it("should handle transition to leap year February", () => {
      // Set current date to January 15, 2024
      vi.setSystemTime(new Date(2024, 0, 15));

      const result = getNextMonthBounds();

      // Next month is February 2024 (leap year)
      expect(result).toEqual({
        month_start: "2024-02-01",
        month_end: "2024-02-29",
      });
    });

    it("should handle transition from 31-day to 30-day month", () => {
      // Set current date to March 15, 2025
      vi.setSystemTime(new Date(2025, 2, 15));

      const result = getNextMonthBounds();

      // Next month is April 2025 (30 days)
      expect(result).toEqual({
        month_start: "2025-04-01",
        month_end: "2025-04-30",
      });
    });
  });

  describe("formatMonth", () => {
    it("should format month correctly", () => {
      const result = formatMonth("2025-01-01");
      expect(result).toBe("January 2025");
    });

    it("should handle all months correctly", () => {
      expect(formatMonth("2025-01-15")).toBe("January 2025");
      expect(formatMonth("2025-02-15")).toBe("February 2025");
      expect(formatMonth("2025-03-15")).toBe("March 2025");
      expect(formatMonth("2025-04-15")).toBe("April 2025");
      expect(formatMonth("2025-05-15")).toBe("May 2025");
      expect(formatMonth("2025-06-15")).toBe("June 2025");
      expect(formatMonth("2025-07-15")).toBe("July 2025");
      expect(formatMonth("2025-08-15")).toBe("August 2025");
      expect(formatMonth("2025-09-15")).toBe("September 2025");
      expect(formatMonth("2025-10-15")).toBe("October 2025");
      expect(formatMonth("2025-11-15")).toBe("November 2025");
      expect(formatMonth("2025-12-15")).toBe("December 2025");
    });

    it("should handle year changes correctly", () => {
      expect(formatMonth("2024-12-01")).toBe("December 2024");
      expect(formatMonth("2025-01-01")).toBe("January 2025");
    });

    it("should work with first day of month", () => {
      const result = formatMonth("2025-01-01");
      expect(result).toBe("January 2025");
    });

    it("should work with last day of month", () => {
      const result = formatMonth("2025-01-31");
      expect(result).toBe("January 2025");
    });

    it("should work with mid-month dates", () => {
      const result = formatMonth("2025-01-15");
      expect(result).toBe("January 2025");
    });
  });

  describe("getMonthBoundsFromString", () => {
    it("should parse date string and return month bounds", () => {
      const result = getMonthBoundsFromString("2025-01-15");

      expect(result).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });
    });

    it("should handle first day of month", () => {
      const result = getMonthBoundsFromString("2025-01-01");

      expect(result).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });
    });

    it("should handle last day of month", () => {
      const result = getMonthBoundsFromString("2025-01-31");

      expect(result).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });
    });

    it("should handle leap year February", () => {
      const result = getMonthBoundsFromString("2024-02-15");

      expect(result).toEqual({
        month_start: "2024-02-01",
        month_end: "2024-02-29",
      });
    });

    it("should handle non-leap year February", () => {
      const result = getMonthBoundsFromString("2025-02-15");

      expect(result).toEqual({
        month_start: "2025-02-01",
        month_end: "2025-02-28",
      });
    });

    it("should handle December correctly", () => {
      const result = getMonthBoundsFromString("2025-12-15");

      expect(result).toEqual({
        month_start: "2025-12-01",
        month_end: "2025-12-31",
      });
    });
  });

  describe("Edge Cases and Integration", () => {
    it("should maintain consistency across all month functions", () => {
      // Set current date to February 15, 2025
      vi.setSystemTime(new Date(2025, 1, 15));

      const current = getCurrentMonthBounds();
      const previous = getPreviousMonthBounds();
      const next = getNextMonthBounds();

      // Verify current month
      expect(current).toEqual({
        month_start: "2025-02-01",
        month_end: "2025-02-28",
      });

      // Verify previous month (January)
      expect(previous).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });

      // Verify next month (March)
      expect(next).toEqual({
        month_start: "2025-03-01",
        month_end: "2025-03-31",
      });
    });

    it("should handle year boundary transition", () => {
      // Set current date to January 1, 2025
      vi.setSystemTime(new Date(2025, 0, 1));

      const current = getCurrentMonthBounds();
      const previous = getPreviousMonthBounds();

      expect(current).toEqual({
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      });

      expect(previous).toEqual({
        month_start: "2024-12-01",
        month_end: "2024-12-31",
      });
    });

    it("should roundtrip through formatMonth and getMonthBoundsFromString", () => {
      const originalBounds = {
        month_start: "2025-01-01",
        month_end: "2025-01-31",
      };

      // Format the month
      const formatted = formatMonth(originalBounds.month_start);
      expect(formatted).toBe("January 2025");

      // Parse back to bounds
      const parsedBounds = getMonthBoundsFromString(originalBounds.month_start);
      expect(parsedBounds).toEqual(originalBounds);
    });

    it("should handle all edge cases for leap years", () => {
      // Leap year (2024)
      const leapYear = getMonthBounds(new Date(2024, 1, 15));
      expect(leapYear.month_end).toBe("2024-02-29");

      // Non-leap year (2025)
      const nonLeapYear = getMonthBounds(new Date(2025, 1, 15));
      expect(nonLeapYear.month_end).toBe("2025-02-28");

      // Century year not divisible by 400 (e.g., 2100 is not a leap year)
      const century = getMonthBounds(new Date(2100, 1, 15));
      expect(century.month_end).toBe("2100-02-28");

      // Century year divisible by 400 (e.g., 2000 is a leap year)
      const centuryLeap = getMonthBounds(new Date(2000, 1, 15));
      expect(centuryLeap.month_end).toBe("2000-02-29");
    });
  });
});
