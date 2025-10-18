import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getLocalDateString,
  compareDates,
  isFutureDate,
  isToday,
  formatForDatabase,
  formatTimestampForDatabase,
} from "../date-utils";

describe("date-utils", () => {
  beforeEach(() => {
    // Reset system time before each test for consistency
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getLocalDateString", () => {
    it("should return current date in YYYY-MM-DD format", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(getLocalDateString()).toBe("2025-10-18");
    });

    it("should format custom date correctly", () => {
      const date = new Date(2025, 9, 20); // Oct 20, 2025
      expect(getLocalDateString(date)).toBe("2025-10-20");
    });

    it("should zero-pad single digit months", () => {
      const date = new Date(2025, 0, 15); // Jan 15, 2025
      expect(getLocalDateString(date)).toBe("2025-01-15");
    });

    it("should zero-pad single digit days", () => {
      const date = new Date(2025, 9, 5); // Oct 5, 2025
      expect(getLocalDateString(date)).toBe("2025-10-05");
    });

    it("should handle year boundaries correctly", () => {
      const date = new Date(2025, 0, 1); // Jan 1, 2025
      expect(getLocalDateString(date)).toBe("2025-01-01");
    });

    it("should handle leap years correctly", () => {
      const date = new Date(2024, 1, 29); // Feb 29, 2024
      expect(getLocalDateString(date)).toBe("2024-02-29");
    });

    it("should handle month boundaries correctly", () => {
      const date = new Date(2025, 0, 31); // Jan 31, 2025
      expect(getLocalDateString(date)).toBe("2025-01-31");
    });

    it("should handle end of year correctly", () => {
      const date = new Date(2025, 11, 31); // Dec 31, 2025
      expect(getLocalDateString(date)).toBe("2025-12-31");
    });

    it("should use local timezone not UTC", () => {
      // At 1:26 AM GMT+2 on Oct 18, it's still Oct 17 in UTC
      // But we want the LOCAL date (Oct 18)
      const date = new Date(2025, 9, 18, 1, 26); // Oct 18, 2025 01:26
      expect(getLocalDateString(date)).toBe("2025-10-18");
    });
  });

  describe("compareDates", () => {
    it("should return -1 when first date is before second", () => {
      expect(compareDates("2025-10-18", "2025-10-20")).toBe(-1);
    });

    it("should return 0 when dates are equal", () => {
      expect(compareDates("2025-10-18", "2025-10-18")).toBe(0);
    });

    it("should return 1 when first date is after second", () => {
      expect(compareDates("2025-10-20", "2025-10-18")).toBe(1);
    });

    it("should compare Date objects correctly", () => {
      const date1 = new Date(2025, 9, 18);
      const date2 = new Date(2025, 9, 20);
      expect(compareDates(date1, date2)).toBe(-1);
    });

    it("should compare string and Date object correctly", () => {
      const date = new Date(2025, 9, 18);
      expect(compareDates("2025-10-18", date)).toBe(0);
    });

    it("should compare Date object and string correctly", () => {
      const date = new Date(2025, 9, 18);
      expect(compareDates(date, "2025-10-18")).toBe(0);
    });

    it("should handle year boundaries in comparison", () => {
      expect(compareDates("2024-12-31", "2025-01-01")).toBe(-1);
    });

    it("should handle same year different months", () => {
      expect(compareDates("2025-03-15", "2025-07-10")).toBe(-1);
    });

    it("should handle same month different days", () => {
      expect(compareDates("2025-10-20", "2025-10-15")).toBe(1);
    });
  });

  describe("isFutureDate", () => {
    it("should return true for future dates", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isFutureDate("2025-10-20")).toBe(true);
    });

    it("should return false for today", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isFutureDate("2025-10-18")).toBe(false);
    });

    it("should return false for past dates", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isFutureDate("2025-10-10")).toBe(false);
    });

    it("should work with Date objects", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      const futureDate = new Date(2025, 9, 20);
      expect(isFutureDate(futureDate)).toBe(true);
    });

    it("should work with Date objects for past dates", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      const pastDate = new Date(2025, 9, 15);
      expect(isFutureDate(pastDate)).toBe(false);
    });

    it("should handle year boundary correctly", () => {
      vi.setSystemTime(new Date("2024-12-31T14:30:00"));
      expect(isFutureDate("2025-01-01")).toBe(true);
    });
  });

  describe("isToday", () => {
    it("should return true for today", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isToday("2025-10-18")).toBe(true);
    });

    it("should return false for future dates", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isToday("2025-10-20")).toBe(false);
    });

    it("should return false for past dates", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isToday("2025-10-10")).toBe(false);
    });

    it("should work with Date objects", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isToday(new Date(2025, 9, 18))).toBe(true);
    });

    it("should work with Date objects for different dates", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00"));
      expect(isToday(new Date(2025, 9, 20))).toBe(false);
    });

    it("should work at different times of day", () => {
      vi.setSystemTime(new Date("2025-10-18T23:59:59"));
      expect(isToday("2025-10-18")).toBe(true);
    });

    it("should work at midnight", () => {
      vi.setSystemTime(new Date("2025-10-18T00:00:00"));
      expect(isToday("2025-10-18")).toBe(true);
    });
  });

  describe("formatForDatabase", () => {
    it("should format date for database date column", () => {
      const date = new Date(2025, 9, 18);
      expect(formatForDatabase(date)).toBe("2025-10-18");
    });

    it("should match getLocalDateString output", () => {
      const date = new Date(2025, 9, 18);
      expect(formatForDatabase(date)).toBe(getLocalDateString(date));
    });

    it("should handle single digit months", () => {
      const date = new Date(2025, 0, 15);
      expect(formatForDatabase(date)).toBe("2025-01-15");
    });

    it("should handle single digit days", () => {
      const date = new Date(2025, 9, 5);
      expect(formatForDatabase(date)).toBe("2025-10-05");
    });

    it("should handle leap years", () => {
      const date = new Date(2024, 1, 29);
      expect(formatForDatabase(date)).toBe("2024-02-29");
    });
  });

  describe("formatTimestampForDatabase", () => {
    it("should format timestamp for database timestamptz column", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00.000Z"));
      expect(formatTimestampForDatabase(new Date())).toBe(
        "2025-10-18T14:30:00.000Z"
      );
    });

    it("should include timezone information", () => {
      const result = formatTimestampForDatabase(new Date());
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    it("should format custom timestamp correctly", () => {
      const date = new Date("2025-10-20T10:15:30.000Z");
      expect(formatTimestampForDatabase(date)).toBe("2025-10-20T10:15:30.000Z");
    });

    it("should use default parameter when no date provided", () => {
      vi.setSystemTime(new Date("2025-10-18T14:30:00.000Z"));
      const result = formatTimestampForDatabase();
      expect(result).toBe("2025-10-18T14:30:00.000Z");
    });

    it("should handle milliseconds correctly", () => {
      const date = new Date("2025-10-18T14:30:00.123Z");
      expect(formatTimestampForDatabase(date)).toBe("2025-10-18T14:30:00.123Z");
    });
  });

  describe("timezone edge cases", () => {
    it("should handle date near midnight in different timezones", () => {
      // This test ensures we use local time, not UTC
      // A user at 11:30 PM local time should get today's date,
      // even if it's already tomorrow in UTC
      const date = new Date(2025, 9, 18, 23, 30); // 11:30 PM local
      expect(getLocalDateString(date)).toBe("2025-10-18");
    });

    it("should handle date near midnight crossing to next day", () => {
      // Just after midnight local time
      const date = new Date(2025, 9, 19, 0, 1); // 00:01 AM local
      expect(getLocalDateString(date)).toBe("2025-10-19");
    });

    it("should compare dates consistently regardless of time", () => {
      const date1 = new Date(2025, 9, 18, 0, 0); // Midnight
      const date2 = new Date(2025, 9, 18, 23, 59); // Almost midnight
      expect(compareDates(date1, date2)).toBe(0);
    });
  });

  describe("performance", () => {
    it("should execute getLocalDateString in under 1ms", () => {
      vi.useRealTimers(); // Use real timers for performance test
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        getLocalDateString();
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // 1000 calls in < 100ms = < 0.1ms per call
      vi.useFakeTimers();
    });

    it("should execute compareDates in under 1ms", () => {
      vi.useRealTimers();
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        compareDates("2025-10-18", "2025-10-20");
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
      vi.useFakeTimers();
    });
  });
});
