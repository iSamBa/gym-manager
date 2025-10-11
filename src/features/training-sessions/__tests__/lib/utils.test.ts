import { describe, it, expect } from "vitest";
import {
  formatSessionTime,
  formatSessionDate,
  calculateSessionDuration,
  getSessionStatusColor,
  getSessionCategoryColor,
  calculateAttendanceRate,
  groupSessionsByDate,
} from "../../lib/utils";
import type { TrainingSession } from "../../lib/types";

describe("Training Session Utility Functions", () => {
  describe("Date/Time Utilities", () => {
    describe("formatSessionTime", () => {
      it("should format session time range correctly", () => {
        const start = "2024-12-01T09:00:00.000Z";
        const end = "2024-12-01T10:30:00.000Z";
        const result = formatSessionTime(start, end);
        // The actual time will depend on the system timezone, so just verify the format
        expect(result).toMatch(/^\d{2}:\d{2} - \d{2}:\d{2}$/);
        expect(result).toContain(" - ");
      });

      it("should handle same timezone correctly", () => {
        const start = "2024-12-01T14:15:00.000Z";
        const end = "2024-12-01T15:45:00.000Z";
        const result = formatSessionTime(start, end);
        // The actual time will depend on the system timezone, so just verify the format
        expect(result).toMatch(/^\d{2}:\d{2} - \d{2}:\d{2}$/);
        expect(result).toContain(" - ");
      });

      it("should handle cross-day times", () => {
        const start = "2024-12-01T23:30:00.000Z";
        const end = "2024-12-02T00:30:00.000Z";
        const result = formatSessionTime(start, end);
        // The actual time will depend on the system timezone, so just verify the format
        expect(result).toMatch(/^\d{2}:\d{2} - \d{2}:\d{2}$/);
        expect(result).toContain(" - ");
      });
    });

    describe("formatSessionDate", () => {
      it("should format date correctly", () => {
        const date = "2024-12-01T09:00:00.000Z";
        const result = formatSessionDate(date);
        // Verify the format is correct (MMM dd, yyyy)
        expect(result).toMatch(/^[A-Z][a-z]{2} \d{2}, \d{4}$/);
        expect(result).toContain("2024");
        expect(result).toContain("01");
      });

      it("should handle different months", () => {
        const date = "2024-06-15T14:00:00.000Z";
        const result = formatSessionDate(date);
        // Verify the format is correct (MMM dd, yyyy)
        expect(result).toMatch(/^[A-Z][a-z]{2} \d{2}, \d{4}$/);
        expect(result).toContain("2024");
        expect(result).toContain("15");
      });
    });

    describe("calculateSessionDuration", () => {
      it("should calculate duration in minutes correctly", () => {
        const start = "2024-12-01T09:00:00.000Z";
        const end = "2024-12-01T10:30:00.000Z";
        const result = calculateSessionDuration(start, end);
        expect(result).toBe(90);
      });

      it("should handle 1-hour sessions", () => {
        const start = "2024-12-01T09:00:00.000Z";
        const end = "2024-12-01T10:00:00.000Z";
        const result = calculateSessionDuration(start, end);
        expect(result).toBe(60);
      });

      it("should handle 15-minute sessions", () => {
        const start = "2024-12-01T09:00:00.000Z";
        const end = "2024-12-01T09:15:00.000Z";
        const result = calculateSessionDuration(start, end);
        expect(result).toBe(15);
      });

      it("should handle sessions with seconds", () => {
        const start = "2024-12-01T09:00:30.000Z";
        const end = "2024-12-01T10:00:45.000Z";
        const result = calculateSessionDuration(start, end);
        expect(result).toBe(60); // Should round to nearest minute
      });
    });
  });

  describe("Session Status Utilities", () => {
    describe("getSessionStatusColor", () => {
      it("should return correct color for scheduled status", () => {
        const result = getSessionStatusColor("scheduled");
        expect(result).toBe(
          "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
        );
      });

      it("should return correct color for in_progress status", () => {
        const result = getSessionStatusColor("in_progress");
        expect(result).toBe(
          "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
        );
      });

      it("should return correct color for completed status", () => {
        const result = getSessionStatusColor("completed");
        expect(result).toBe(
          "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
        );
      });

      it("should return correct color for cancelled status", () => {
        const result = getSessionStatusColor("cancelled");
        expect(result).toBe(
          "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
        );
      });

      it("should return default color for unknown status", () => {
        const result = getSessionStatusColor("unknown");
        expect(result).toBe(
          "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
        );
      });

      it("should return default color for empty string", () => {
        const result = getSessionStatusColor("");
        expect(result).toBe(
          "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
        );
      });
    });

    describe("getSessionCategoryColor", () => {
      it("should return correct color for trial category", () => {
        const result = getSessionCategoryColor("trial");
        expect(result).toBe(
          "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
        );
      });

      it("should return correct color for standard category", () => {
        const result = getSessionCategoryColor("standard");
        expect(result).toBe(
          "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
        );
      });

      it("should return correct color for premium category", () => {
        const result = getSessionCategoryColor("premium");
        expect(result).toBe(
          "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
        );
      });

      it("should return correct color for group category", () => {
        const result = getSessionCategoryColor("group");
        expect(result).toBe(
          "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300"
        );
      });

      it("should return correct color for personal category", () => {
        const result = getSessionCategoryColor("personal");
        expect(result).toBe(
          "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300"
        );
      });

      it("should return default color for unknown category", () => {
        const result = getSessionCategoryColor("unknown");
        expect(result).toBe(
          "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
        );
      });

      it("should handle case-insensitive category names", () => {
        const result = getSessionCategoryColor("TRIAL");
        expect(result).toBe(
          "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
        );
      });
    });
  });

  describe("History and Analytics Utilities", () => {
    describe("calculateAttendanceRate", () => {
      it("should calculate attendance rate correctly", () => {
        const result = calculateAttendanceRate(7, 10);
        expect(result).toBe(70);
      });

      it("should round to nearest whole number", () => {
        const result = calculateAttendanceRate(2, 3);
        expect(result).toBe(67);
      });

      it("should return 100 for full attendance", () => {
        const result = calculateAttendanceRate(10, 10);
        expect(result).toBe(100);
      });

      it("should return 0 for zero attendance", () => {
        const result = calculateAttendanceRate(0, 10);
        expect(result).toBe(0);
      });

      it("should return 0 when max is 0", () => {
        const result = calculateAttendanceRate(5, 0);
        expect(result).toBe(0);
      });
    });

    describe("groupSessionsByDate", () => {
      const mockSessions: TrainingSession[] = [
        {
          id: "session-1",
          machine_id: "machine-1",
          trainer_id: "trainer-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
          status: "completed",
          notes: null,
        },
        {
          id: "session-2",
          machine_id: "machine-2",
          trainer_id: "trainer-2",
          scheduled_start: "2024-12-01T14:00:00.000Z",
          scheduled_end: "2024-12-01T15:00:00.000Z",
          status: "completed",
          notes: null,
        },
        {
          id: "session-3",
          machine_id: "machine-1",
          trainer_id: "trainer-1",
          scheduled_start: "2024-12-02T10:00:00.000Z",
          scheduled_end: "2024-12-02T11:00:00.000Z",
          status: "completed",
          notes: null,
        },
      ];

      it("should group sessions by date correctly", () => {
        const result = groupSessionsByDate(mockSessions);

        expect(Object.keys(result)).toEqual(["2024-12-01", "2024-12-02"]);
        expect(result["2024-12-01"]).toHaveLength(2);
        expect(result["2024-12-02"]).toHaveLength(1);
      });

      it("should maintain session data in grouped results", () => {
        const result = groupSessionsByDate(mockSessions);

        expect(result["2024-12-01"][0].id).toBe("session-1");
        expect(result["2024-12-01"][1].id).toBe("session-2");
        expect(result["2024-12-02"][0].id).toBe("session-3");
      });

      it("should handle empty session array", () => {
        const result = groupSessionsByDate([]);
        expect(result).toEqual({});
      });

      it("should handle single session", () => {
        const singleSession = [mockSessions[0]];
        const result = groupSessionsByDate(singleSession);

        expect(Object.keys(result)).toEqual(["2024-12-01"]);
        expect(result["2024-12-01"]).toHaveLength(1);
      });
    });
  });
});
