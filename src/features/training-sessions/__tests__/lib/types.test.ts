import { describe, it, expect } from "vitest";
import type {
  TrainingSession,
  TrainingSessionWithDetails,
  TrainingSessionCalendarEvent,
  TrainingSessionMember,
  CreateSessionData,
  UpdateSessionData,
  CalendarView,
  CalendarViewState,
  SessionAvailabilityCheck,
  BulkSessionOperationResult,
  SessionFilters,
  SessionHistoryEntry,
  SessionAnalytics,
} from "../../lib/types";

describe("Training Session Types", () => {
  describe("TrainingSession", () => {
    it("should define correct structure for training session", () => {
      const session: TrainingSession = {
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
      };

      // Test that all required properties are present
      expect(typeof session.id).toBe("string");
      expect(typeof session.trainer_id).toBe("string");
      expect(typeof session.scheduled_start).toBe("string");
      expect(typeof session.scheduled_end).toBe("string");
      expect(["scheduled", "in_progress", "completed", "cancelled"]).toContain(
        session.status
      );
      expect(typeof session.max_participants).toBe("number");
      expect(typeof session.current_participants).toBe("number");
      expect(typeof session.created_at).toBe("string");
      expect(typeof session.updated_at).toBe("string");

      // Test nullable fields
      expect(session.location).toEqual(expect.any(String));
      expect(session.notes).toEqual(expect.any(String));
    });

    it("should allow null for nullable fields", () => {
      const session: TrainingSession = {
        id: "session-1",
        trainer_id: "trainer-1",
        scheduled_start: "2024-12-01T09:00:00.000Z",
        scheduled_end: "2024-12-01T10:00:00.000Z",
        status: "scheduled",
        max_participants: 10,
        current_participants: 3,
        location: null,
        notes: null,
        created_at: "2024-11-01T00:00:00.000Z",
        updated_at: "2024-11-01T00:00:00.000Z",
      };

      expect(session.location).toBeNull();
      expect(session.notes).toBeNull();
    });

    it("should enforce correct status values", () => {
      const validStatuses: TrainingSession["status"][] = [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ];

      validStatuses.forEach((status) => {
        const session: TrainingSession = {
          id: "session-1",
          trainer_id: "trainer-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
          status,
          max_participants: 10,
          current_participants: 3,
          location: "Main Gym",
          notes: null,
          created_at: "2024-11-01T00:00:00.000Z",
          updated_at: "2024-11-01T00:00:00.000Z",
        };
        expect(session.status).toBe(status);
      });
    });
  });

  describe("TrainingSessionWithDetails", () => {
    it("should extend TrainingSession with optional relationships", () => {
      const sessionWithDetails: TrainingSessionWithDetails = {
        id: "session-1",
        trainer_id: "trainer-1",
        scheduled_start: "2024-12-01T09:00:00.000Z",
        scheduled_end: "2024-12-01T10:00:00.000Z",
        status: "scheduled",
        max_participants: 10,
        current_participants: 3,
        location: "Main Gym",
        notes: null,
        created_at: "2024-11-01T00:00:00.000Z",
        updated_at: "2024-11-01T00:00:00.000Z",
        trainer: {
          id: "trainer-1",
          user_id: "user-1",
          specialization: "strength",
          certification: "certified",
          hourly_rate: 75,
          status: "active",
          max_clients_per_session: 10,
          bio: "Expert trainer",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
          user_profile: {
            id: "profile-1",
            user_id: "user-1",
            first_name: "John",
            last_name: "Doe",
            date_of_birth: "1985-01-01",
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
        participants: [],
      };

      // Test that it includes all base properties
      expect(sessionWithDetails.id).toBe("session-1");
      expect(sessionWithDetails.status).toBe("scheduled");

      // Test optional relationships
      expect(sessionWithDetails.trainer).toBeDefined();
      expect(sessionWithDetails.participants).toEqual([]);
    });
  });

  describe("TrainingSessionCalendarEvent", () => {
    it("should define correct structure for calendar events", () => {
      const calendarEvent: TrainingSessionCalendarEvent = {
        id: "session-1",
        title: "John Doe - 5/10",
        start: new Date("2024-12-01T09:00:00.000Z"),
        end: new Date("2024-12-01T10:00:00.000Z"),
        trainer_name: "John Doe",
        participant_count: 5,
        max_participants: 10,
        location: "Main Gym",
        status: "scheduled",
        resource: {
          trainer_id: "trainer-1",
          session: {
            id: "session-1",
            trainer_id: "trainer-1",
            scheduled_start: "2024-12-01T09:00:00.000Z",
            scheduled_end: "2024-12-01T10:00:00.000Z",
            status: "scheduled",
            max_participants: 10,
            current_participants: 5,
            location: "Main Gym",
            notes: null,
            created_at: "2024-11-01T00:00:00.000Z",
            updated_at: "2024-11-01T00:00:00.000Z",
          },
        },
      };

      expect(calendarEvent.start).toBeInstanceOf(Date);
      expect(calendarEvent.end).toBeInstanceOf(Date);
      expect(typeof calendarEvent.title).toBe("string");
      expect(typeof calendarEvent.trainer_name).toBe("string");
      expect(typeof calendarEvent.participant_count).toBe("number");
      expect(typeof calendarEvent.max_participants).toBe("number");
    });

    it("should allow optional resource", () => {
      const calendarEvent: TrainingSessionCalendarEvent = {
        id: "session-1",
        title: "Training Session",
        start: new Date(),
        end: new Date(),
        trainer_name: "John Doe",
        participant_count: 5,
        max_participants: 10,
        location: null,
        status: "scheduled",
        // resource is optional
      };

      expect(calendarEvent.resource).toBeUndefined();
    });
  });

  describe("TrainingSessionMember", () => {
    it("should define correct structure for session participants", () => {
      const participant: TrainingSessionMember = {
        id: "participant-1",
        session_id: "session-1",
        member_id: "member-1",
        booking_status: "confirmed",
        created_at: "2024-11-01T00:00:00.000Z",
      };

      expect(typeof participant.id).toBe("string");
      expect(typeof participant.session_id).toBe("string");
      expect(typeof participant.member_id).toBe("string");
      expect(["confirmed", "waitlisted", "cancelled"]).toContain(
        participant.booking_status
      );
      expect(typeof participant.created_at).toBe("string");
    });

    it("should enforce correct booking status values", () => {
      const validStatuses: TrainingSessionMember["booking_status"][] = [
        "confirmed",
        "waitlisted",
        "cancelled",
      ];

      validStatuses.forEach((booking_status) => {
        const participant: TrainingSessionMember = {
          id: "participant-1",
          session_id: "session-1",
          member_id: "member-1",
          booking_status,
          created_at: "2024-11-01T00:00:00.000Z",
        };
        expect(participant.booking_status).toBe(booking_status);
      });
    });
  });

  describe("Form Data Types", () => {
    describe("CreateSessionData", () => {
      it("should define correct structure for creating sessions", () => {
        const createData: CreateSessionData = {
          trainer_id: "trainer-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
          location: "Main Gym",
          max_participants: 10,
          member_ids: ["member-1", "member-2"],
        };

        expect(typeof createData.trainer_id).toBe("string");
        expect(typeof createData.scheduled_start).toBe("string");
        expect(typeof createData.scheduled_end).toBe("string");
        expect(typeof createData.location).toBe("string");
        expect(typeof createData.max_participants).toBe("number");
        expect(Array.isArray(createData.member_ids)).toBe(true);
      });

      it("should allow optional notes field", () => {
        const createDataWithNotes: CreateSessionData = {
          trainer_id: "trainer-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
          location: "Main Gym",
          max_participants: 10,
          member_ids: ["member-1"],
          notes: "Special session",
        };

        const createDataWithoutNotes: CreateSessionData = {
          trainer_id: "trainer-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
          location: "Main Gym",
          max_participants: 10,
          member_ids: ["member-1"],
        };

        expect(createDataWithNotes.notes).toBe("Special session");
        expect(createDataWithoutNotes.notes).toBeUndefined();
      });
    });

    describe("UpdateSessionData", () => {
      it("should make all fields optional", () => {
        const updateData: UpdateSessionData = {};
        expect(updateData).toEqual({});

        const partialUpdate: UpdateSessionData = {
          location: "Updated Gym",
          status: "in_progress",
        };
        expect(partialUpdate.location).toBe("Updated Gym");
        expect(partialUpdate.status).toBe("in_progress");
      });
    });
  });

  describe("Calendar Types", () => {
    describe("CalendarView", () => {
      it("should enforce valid calendar view values", () => {
        const validViews: CalendarView[] = ["month", "week", "day"];

        validViews.forEach((view) => {
          const testView: CalendarView = view;
          expect(testView).toBe(view);
        });
      });
    });

    describe("CalendarViewState", () => {
      it("should define correct structure for calendar state", () => {
        const viewState: CalendarViewState = {
          currentView: "week",
          currentDate: new Date("2024-12-01"),
          selectedSession: null,
        };

        expect(["month", "week", "day"]).toContain(viewState.currentView);
        expect(viewState.currentDate).toBeInstanceOf(Date);
        expect(viewState.selectedSession).toBeNull();
      });
    });
  });

  describe("API Response Types", () => {
    describe("SessionAvailabilityCheck", () => {
      it("should define correct structure for availability checks", () => {
        const availabilityCheck: SessionAvailabilityCheck = {
          available: true,
          conflicts: [],
          message: "Time slot is available",
        };

        expect(typeof availabilityCheck.available).toBe("boolean");
        expect(Array.isArray(availabilityCheck.conflicts)).toBe(true);
        expect(typeof availabilityCheck.message).toBe("string");
      });

      it("should allow optional message field", () => {
        const availabilityCheck: SessionAvailabilityCheck = {
          available: false,
          conflicts: [],
        };

        expect(availabilityCheck.message).toBeUndefined();
      });
    });

    describe("BulkSessionOperationResult", () => {
      it("should define correct structure for bulk operations", () => {
        const bulkResult: BulkSessionOperationResult = {
          success: true,
          processed: 10,
          failed: 2,
          errors: ["Error 1", "Error 2"],
        };

        expect(typeof bulkResult.success).toBe("boolean");
        expect(typeof bulkResult.processed).toBe("number");
        expect(typeof bulkResult.failed).toBe("number");
        expect(Array.isArray(bulkResult.errors)).toBe(true);
      });
    });
  });

  describe("Filter and Search Types", () => {
    describe("SessionFilters", () => {
      it("should make all filter properties optional", () => {
        const emptyFilters: SessionFilters = {};
        expect(emptyFilters).toEqual({});

        const fullFilters: SessionFilters = {
          trainer_id: "trainer-1",
          status: "scheduled",
          date_range: {
            start: new Date("2024-12-01"),
            end: new Date("2024-12-31"),
          },
          location: "Main Gym",
        };

        expect(typeof fullFilters.trainer_id).toBe("string");
        expect(["scheduled", "completed", "cancelled", "all"]).toContain(
          fullFilters.status
        );
        expect(fullFilters.date_range?.start).toBeInstanceOf(Date);
        expect(fullFilters.date_range?.end).toBeInstanceOf(Date);
        expect(typeof fullFilters.location).toBe("string");
      });
    });
  });

  describe("Analytics Types", () => {
    describe("SessionHistoryEntry", () => {
      it("should define correct structure for session history", () => {
        const historyEntry: SessionHistoryEntry = {
          session_id: "session-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
          status: "completed",
          location: "Main Gym",
          trainer_name: "John Doe",
          participant_count: 8,
          attendance_rate: 80,
        };

        expect(typeof historyEntry.session_id).toBe("string");
        expect(typeof historyEntry.scheduled_start).toBe("string");
        expect(typeof historyEntry.scheduled_end).toBe("string");
        expect(typeof historyEntry.status).toBe("string");
        expect(typeof historyEntry.trainer_name).toBe("string");
        expect(typeof historyEntry.participant_count).toBe("number");
        expect(typeof historyEntry.attendance_rate).toBe("number");
      });

      it("should allow null location", () => {
        const historyEntry: SessionHistoryEntry = {
          session_id: "session-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
          status: "completed",
          location: null,
          trainer_name: "John Doe",
          participant_count: 8,
          attendance_rate: 80,
        };

        expect(historyEntry.location).toBeNull();
      });
    });

    describe("SessionAnalytics", () => {
      it("should define correct structure for session analytics", () => {
        const analytics: SessionAnalytics = {
          total_sessions: 100,
          completed_sessions: 85,
          cancelled_sessions: 5,
          average_attendance_rate: 82.5,
          most_popular_time_slots: [
            { time_slot: "09:00-10:00", session_count: 25 },
            { time_slot: "18:00-19:00", session_count: 20 },
          ],
          trainer_utilization: [
            {
              trainer_id: "trainer-1",
              trainer_name: "John Doe",
              sessions_count: 30,
              utilization_rate: 75.5,
            },
          ],
        };

        expect(typeof analytics.total_sessions).toBe("number");
        expect(typeof analytics.completed_sessions).toBe("number");
        expect(typeof analytics.cancelled_sessions).toBe("number");
        expect(typeof analytics.average_attendance_rate).toBe("number");
        expect(Array.isArray(analytics.most_popular_time_slots)).toBe(true);
        expect(Array.isArray(analytics.trainer_utilization)).toBe(true);

        // Test nested array structures
        analytics.most_popular_time_slots.forEach((slot) => {
          expect(typeof slot.time_slot).toBe("string");
          expect(typeof slot.session_count).toBe("number");
        });

        analytics.trainer_utilization.forEach((trainer) => {
          expect(typeof trainer.trainer_id).toBe("string");
          expect(typeof trainer.trainer_name).toBe("string");
          expect(typeof trainer.sessions_count).toBe("number");
          expect(typeof trainer.utilization_rate).toBe("number");
        });
      });
    });
  });

  describe("Type Compatibility", () => {
    it("should allow TrainingSessionWithDetails to be used as TrainingSession", () => {
      const sessionWithDetails: TrainingSessionWithDetails = {
        id: "session-1",
        trainer_id: "trainer-1",
        scheduled_start: "2024-12-01T09:00:00.000Z",
        scheduled_end: "2024-12-01T10:00:00.000Z",
        status: "scheduled",
        max_participants: 10,
        current_participants: 3,
        location: "Main Gym",
        notes: null,
        created_at: "2024-11-01T00:00:00.000Z",
        updated_at: "2024-11-01T00:00:00.000Z",
      };

      // Should be able to assign to base type
      const session: TrainingSession = sessionWithDetails;
      expect(session.id).toBe("session-1");
    });

    it("should maintain type safety for enums", () => {
      // These should compile without issues
      const status: TrainingSession["status"] = "scheduled";
      const bookingStatus: TrainingSessionMember["booking_status"] =
        "confirmed";
      const view: CalendarView = "week";
      const filterStatus: SessionFilters["status"] = "all";

      expect(status).toBe("scheduled");
      expect(bookingStatus).toBe("confirmed");
      expect(view).toBe("week");
      expect(filterStatus).toBe("all");
    });
  });
});
