import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getSessionColorVariant } from "../session-colors";

describe("getSessionColorVariant", () => {
  beforeEach(() => {
    // Mock current date to 2025-01-15 for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Past sessions", () => {
    it("returns 'past' for session scheduled yesterday", () => {
      const scheduledStart = "2025-01-14T09:00:00";
      expect(getSessionColorVariant(scheduledStart)).toBe("past");
    });

    it("returns 'past' for session scheduled last week", () => {
      const scheduledStart = "2025-01-08T14:30:00";
      expect(getSessionColorVariant(scheduledStart)).toBe("past");
    });

    it("returns 'past' for session scheduled last month", () => {
      const scheduledStart = "2024-12-20T10:00:00";
      expect(getSessionColorVariant(scheduledStart)).toBe("past");
    });
  });

  describe("Today's sessions", () => {
    it("returns 'today' for session scheduled this morning", () => {
      const scheduledStart = "2025-01-15T09:00:00";
      expect(getSessionColorVariant(scheduledStart)).toBe("today");
    });

    it("returns 'today' for session scheduled this afternoon", () => {
      const scheduledStart = "2025-01-15T14:30:00";
      expect(getSessionColorVariant(scheduledStart)).toBe("today");
    });

    it("returns 'today' for session scheduled this evening", () => {
      const scheduledStart = "2025-01-15T20:00:00";
      expect(getSessionColorVariant(scheduledStart)).toBe("today");
    });

    it("returns 'today' for session at midnight", () => {
      const scheduledStart = "2025-01-15T00:00:00";
      expect(getSessionColorVariant(scheduledStart)).toBe("today");
    });

    it("returns 'today' for session at end of day", () => {
      const scheduledStart = "2025-01-15T23:59:59";
      expect(getSessionColorVariant(scheduledStart)).toBe("today");
    });
  });

  describe("Future sessions", () => {
    it("returns 'future' for session scheduled tomorrow", () => {
      const scheduledStart = "2025-01-16T10:00:00";
      expect(getSessionColorVariant(scheduledStart)).toBe("future");
    });

    it("returns 'future' for session scheduled next week", () => {
      const scheduledStart = "2025-01-22T15:00:00";
      expect(getSessionColorVariant(scheduledStart)).toBe("future");
    });

    it("returns 'future' for session scheduled next month", () => {
      const scheduledStart = "2025-02-10T11:30:00";
      expect(getSessionColorVariant(scheduledStart)).toBe("future");
    });
  });

  describe("Edge cases", () => {
    it("handles ISO strings with different timezone offsets", () => {
      // ISO string with timezone offset - should still resolve to correct date
      const scheduledStart = "2025-01-15T05:00:00+05:00";
      expect(getSessionColorVariant(scheduledStart)).toBe("today");
    });

    it("correctly handles date boundary transitions", () => {
      // Just before midnight yesterday (local time)
      const yesterday = "2025-01-14T23:59:59";
      expect(getSessionColorVariant(yesterday)).toBe("past");

      // Just after midnight tomorrow (local time)
      const tomorrow = "2025-01-16T00:00:01";
      expect(getSessionColorVariant(tomorrow)).toBe("future");
    });
  });
});
