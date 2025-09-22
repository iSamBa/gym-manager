import { describe, it, expect } from "vitest";
import {
  formatSessionTime,
  formatSessionDate,
  calculateSessionDuration,
  transformSessionToCalendarEvent,
  isTimeSlotAvailable,
  getSessionConflicts,
  prepareSessionData,
  getSessionStatusColor,
  calculateAttendanceRate,
  groupSessionsByDate,
} from "../../lib/utils";
import type {
  TrainingSession,
  TrainingSessionWithDetails,
  SessionHistoryEntry,
  CreateSessionData,
} from "../../lib/types";

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

  describe("Session Data Transformations", () => {
    describe("transformSessionToCalendarEvent", () => {
      const mockSession: TrainingSessionWithDetails = {
        id: "session-1",
        trainer_id: "trainer-1",
        scheduled_start: "2024-12-01T09:00:00.000Z",
        scheduled_end: "2024-12-01T10:00:00.000Z",
        status: "scheduled",
        max_participants: 10,
        current_participants: 3,
        location: "Main Gym",
        notes: "Test session",
        created_at: "2024-11-01T00:00:00.000Z",
        updated_at: "2024-11-01T00:00:00.000Z",
        trainer: {
          id: "trainer-1",
          user_id: "user-1",
          specialization: "strength",
          certification: "certified",
          hourly_rate: 50,
          status: "active",
          max_clients_per_session: 10,
          bio: "Experienced trainer",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
          user_profile: {
            id: "profile-1",
            user_id: "user-1",
            first_name: "John",
            last_name: "Doe",
            date_of_birth: "1990-01-01",
            phone_number: "+1234567890",
            address: "123 Main St",
            city: "New York",
            state: "NY",
            zip_code: "10001",
            country: "USA",
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z",
          },
        },
        participants: [
          {
            id: "participant-1",
            session_id: "session-1",
            member_id: "member-1",
            booking_status: "confirmed",
            created_at: "2024-11-01T00:00:00.000Z",
          },
        ],
      };

      it("should transform session to calendar event correctly", () => {
        const result = transformSessionToCalendarEvent(mockSession);

        expect(result.id).toBe("session-1");
        expect(result.title).toBe("John Doe - 3/10");
        expect(result.start).toEqual(new Date("2024-12-01T09:00:00.000Z"));
        expect(result.end).toEqual(new Date("2024-12-01T10:00:00.000Z"));
        expect(result.trainer_name).toBe("John Doe");
        expect(result.participant_count).toBe(3);
        expect(result.max_participants).toBe(10);
        expect(result.location).toBe("Main Gym");
        expect(result.status).toBe("scheduled");
        expect(result.resource).toEqual({
          trainer_id: "trainer-1",
          session: mockSession,
        });
      });

      it("should handle session without trainer", () => {
        const sessionWithoutTrainer = { ...mockSession, trainer: undefined };
        const result = transformSessionToCalendarEvent(sessionWithoutTrainer);

        expect(result.title).toBe("Unknown - 3/10");
        expect(result.trainer_name).toBe("Unknown");
      });

      it("should handle session without participants", () => {
        const sessionWithoutParticipants = { ...mockSession, participants: [] };
        const result = transformSessionToCalendarEvent(
          sessionWithoutParticipants
        );

        expect(result.title).toBe("John Doe - 3/10");
      });

      it("should handle session with null location", () => {
        const sessionWithNullLocation = { ...mockSession, location: null };
        const result = transformSessionToCalendarEvent(sessionWithNullLocation);

        expect(result.location).toBeNull();
      });
    });
  });

  describe("Validation Utilities", () => {
    const existingSessions: TrainingSession[] = [
      {
        id: "existing-1",
        trainer_id: "trainer-1",
        scheduled_start: "2024-12-01T09:00:00.000Z",
        scheduled_end: "2024-12-01T10:00:00.000Z",
        status: "scheduled",
        max_participants: 10,
        current_participants: 5,
        location: "Gym A",
        notes: null,
        created_at: "2024-11-01T00:00:00.000Z",
        updated_at: "2024-11-01T00:00:00.000Z",
      },
      {
        id: "existing-2",
        trainer_id: "trainer-1",
        scheduled_start: "2024-12-01T14:00:00.000Z",
        scheduled_end: "2024-12-01T15:00:00.000Z",
        status: "completed",
        max_participants: 8,
        current_participants: 6,
        location: "Gym B",
        notes: null,
        created_at: "2024-11-01T00:00:00.000Z",
        updated_at: "2024-11-01T00:00:00.000Z",
      },
      {
        id: "existing-3",
        trainer_id: "trainer-2",
        scheduled_start: "2024-12-01T16:00:00.000Z",
        scheduled_end: "2024-12-01T17:00:00.000Z",
        status: "cancelled",
        max_participants: 12,
        current_participants: 0,
        location: "Gym C",
        notes: null,
        created_at: "2024-11-01T00:00:00.000Z",
        updated_at: "2024-11-01T00:00:00.000Z",
      },
    ];

    describe("isTimeSlotAvailable", () => {
      it("should return true for non-overlapping time slots", () => {
        const newStart = "2024-12-01T11:00:00.000Z";
        const newEnd = "2024-12-01T12:00:00.000Z";
        const result = isTimeSlotAvailable(newStart, newEnd, existingSessions);
        expect(result).toBe(true);
      });

      it("should return false for exact time match", () => {
        const newStart = "2024-12-01T09:00:00.000Z";
        const newEnd = "2024-12-01T10:00:00.000Z";
        const result = isTimeSlotAvailable(newStart, newEnd, existingSessions);
        expect(result).toBe(false);
      });

      it("should return false for overlapping start time", () => {
        const newStart = "2024-12-01T09:30:00.000Z";
        const newEnd = "2024-12-01T11:00:00.000Z";
        const result = isTimeSlotAvailable(newStart, newEnd, existingSessions);
        expect(result).toBe(false);
      });

      it("should return false for overlapping end time", () => {
        const newStart = "2024-12-01T08:00:00.000Z";
        const newEnd = "2024-12-01T09:30:00.000Z";
        const result = isTimeSlotAvailable(newStart, newEnd, existingSessions);
        expect(result).toBe(false);
      });

      it("should return false for completely overlapping session", () => {
        const newStart = "2024-12-01T08:30:00.000Z";
        const newEnd = "2024-12-01T10:30:00.000Z";
        const result = isTimeSlotAvailable(newStart, newEnd, existingSessions);
        expect(result).toBe(false);
      });

      it("should return true for cancelled sessions (ignore conflicts)", () => {
        const newStart = "2024-12-01T16:00:00.000Z";
        const newEnd = "2024-12-01T17:00:00.000Z";
        const result = isTimeSlotAvailable(newStart, newEnd, existingSessions);
        expect(result).toBe(true);
      });

      it("should exclude specific session when provided", () => {
        const newStart = "2024-12-01T09:00:00.000Z";
        const newEnd = "2024-12-01T10:00:00.000Z";
        const result = isTimeSlotAvailable(
          newStart,
          newEnd,
          existingSessions,
          "existing-1"
        );
        expect(result).toBe(true);
      });

      it("should return true for adjacent time slots", () => {
        const newStart = "2024-12-01T10:00:00.000Z";
        const newEnd = "2024-12-01T11:00:00.000Z";
        const result = isTimeSlotAvailable(newStart, newEnd, existingSessions);
        expect(result).toBe(true);
      });
    });

    describe("getSessionConflicts", () => {
      it("should return empty array for non-conflicting sessions", () => {
        const newStart = "2024-12-01T11:00:00.000Z";
        const newEnd = "2024-12-01T12:00:00.000Z";
        const result = getSessionConflicts(newStart, newEnd, existingSessions);
        expect(result).toEqual([]);
      });

      it("should return conflicting sessions", () => {
        const newStart = "2024-12-01T08:30:00.000Z";
        const newEnd = "2024-12-01T14:30:00.000Z";
        const result = getSessionConflicts(newStart, newEnd, existingSessions);
        expect(result).toHaveLength(2);
        expect(result.map((s) => s.id)).toEqual(["existing-1", "existing-2"]);
      });

      it("should exclude cancelled sessions from conflicts", () => {
        const newStart = "2024-12-01T15:30:00.000Z";
        const newEnd = "2024-12-01T17:30:00.000Z";
        const result = getSessionConflicts(newStart, newEnd, existingSessions);
        expect(result).toEqual([]);
      });

      it("should exclude specific session when provided", () => {
        const newStart = "2024-12-01T09:30:00.000Z";
        const newEnd = "2024-12-01T10:30:00.000Z";
        const result = getSessionConflicts(
          newStart,
          newEnd,
          existingSessions,
          "existing-1"
        );
        expect(result).toEqual([]);
      });
    });
  });

  describe("Form Data Utilities", () => {
    describe("prepareSessionData", () => {
      it("should return session data unchanged", () => {
        const formData: CreateSessionData = {
          trainer_id: "trainer-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
          location: "Main Gym",
          max_participants: 10,
          member_ids: ["member-1", "member-2"],
          notes: "Test session",
        };

        const result = prepareSessionData(formData);
        expect(result).toEqual(formData);
      });

      it("should handle data without notes", () => {
        const formData: CreateSessionData = {
          trainer_id: "trainer-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
          location: "Main Gym",
          max_participants: 10,
          member_ids: ["member-1"],
        };

        const result = prepareSessionData(formData);
        expect(result).toEqual(formData);
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
  });

  describe("History and Analytics Utilities", () => {
    describe("calculateAttendanceRate", () => {
      it("should calculate attendance rate correctly", () => {
        const result = calculateAttendanceRate(8, 10);
        expect(result).toBe(80);
      });

      it("should return 100% for full attendance", () => {
        const result = calculateAttendanceRate(10, 10);
        expect(result).toBe(100);
      });

      it("should return 0% for no attendance", () => {
        const result = calculateAttendanceRate(0, 10);
        expect(result).toBe(0);
      });

      it("should return 0% for zero max participants", () => {
        const result = calculateAttendanceRate(5, 0);
        expect(result).toBe(0);
      });

      it("should round to nearest integer", () => {
        const result = calculateAttendanceRate(1, 3);
        expect(result).toBe(33); // 33.33... rounded to 33
      });

      it("should handle edge case with more current than max", () => {
        // This shouldn't happen in real usage, but test for robustness
        const result = calculateAttendanceRate(12, 10);
        expect(result).toBe(120);
      });
    });

    describe("groupSessionsByDate", () => {
      const mockSessions: SessionHistoryEntry[] = [
        {
          session_id: "session-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
          status: "completed",
          location: "Gym A",
          trainer_name: "John Doe",
          participant_count: 8,
          attendance_rate: 80,
        },
        {
          session_id: "session-2",
          scheduled_start: "2024-12-01T14:00:00.000Z",
          scheduled_end: "2024-12-01T15:00:00.000Z",
          status: "completed",
          location: "Gym B",
          trainer_name: "Jane Smith",
          participant_count: 6,
          attendance_rate: 75,
        },
        {
          session_id: "session-3",
          scheduled_start: "2024-12-02T10:00:00.000Z",
          scheduled_end: "2024-12-02T11:00:00.000Z",
          status: "completed",
          location: "Gym A",
          trainer_name: "John Doe",
          participant_count: 10,
          attendance_rate: 100,
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

        expect(result["2024-12-01"][0].session_id).toBe("session-1");
        expect(result["2024-12-01"][1].session_id).toBe("session-2");
        expect(result["2024-12-02"][0].session_id).toBe("session-3");
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
