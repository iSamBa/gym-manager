import { describe, it, expect } from "vitest";
import {
  createSessionSchema,
  updateSessionSchema,
  sessionFiltersSchema,
  type CreateSessionData,
  type UpdateSessionData,
  type SessionFiltersData,
} from "../../lib/validation";

describe("Training Session Validation Schemas", () => {
  describe("createSessionSchema", () => {
    const validSessionData: CreateSessionData = {
      trainer_id: "550e8400-e29b-41d4-a716-446655440000",
      scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      scheduled_end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
      location: "Main Gym",
      session_type: "standard",
      max_participants: 10,
      member_ids: ["550e8400-e29b-41d4-a716-446655440001"],
      notes: "Morning strength session",
    };

    it("should validate correct training session data", () => {
      const result = createSessionSchema.safeParse(validSessionData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validSessionData);
      }
    });

    describe("trainer_id validation", () => {
      it("should reject invalid UUID", () => {
        const invalidData = { ...validSessionData, trainer_id: "invalid-uuid" };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Please select a valid trainer from the list"
          );
        }
      });

      it("should reject empty trainer_id", () => {
        const invalidData = { ...validSessionData, trainer_id: "" };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Please select a valid trainer from the list"
          );
        }
      });
    });

    describe("datetime validation", () => {
      it("should reject invalid start datetime format", () => {
        const invalidData = {
          ...validSessionData,
          scheduled_start: "invalid-date",
        };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Please enter a valid start date and time"
          );
        }
      });

      it("should reject invalid end datetime format", () => {
        const invalidData = {
          ...validSessionData,
          scheduled_end: "invalid-date",
        };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Please enter a valid end date and time"
          );
        }
      });

      it("should reject when end time is before start time", () => {
        const futureTime1 = new Date(
          Date.now() + 25 * 60 * 60 * 1000
        ).toISOString();
        const futureTime2 = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString();
        const invalidData = {
          ...validSessionData,
          scheduled_start: futureTime1,
          scheduled_end: futureTime2,
        };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Session end time must be later than start time"
          );
          expect(result.error.issues[0].path).toEqual(["scheduled_end"]);
        }
      });

      it("should reject when end time equals start time", () => {
        const futureTime = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString();
        const invalidData = {
          ...validSessionData,
          scheduled_start: futureTime,
          scheduled_end: futureTime,
        };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Session end time must be later than start time"
          );
        }
      });
    });

    describe("location validation", () => {
      it("should reject empty location", () => {
        const invalidData = { ...validSessionData, location: "" };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Please specify where the training session will take place"
          );
        }
      });

      it("should reject location longer than 100 characters", () => {
        const longLocation = "a".repeat(101);
        const invalidData = { ...validSessionData, location: longLocation };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Location name must be 100 characters or less"
          );
        }
      });

      it("should accept location with exactly 100 characters", () => {
        const maxLocation = "a".repeat(100);
        const validData = { ...validSessionData, location: maxLocation };
        const result = createSessionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe("max_participants validation", () => {
      it("should reject zero participants", () => {
        const invalidData = { ...validSessionData, max_participants: 0 };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Sessions must allow at least 1 participant"
          );
        }
      });

      it("should reject negative participants", () => {
        const invalidData = { ...validSessionData, max_participants: -1 };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Sessions must allow at least 1 participant"
          );
        }
      });

      it("should reject more than 50 participants", () => {
        const invalidData = { ...validSessionData, max_participants: 51 };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Sessions cannot have more than 50 participants"
          );
        }
      });

      it("should accept exactly 50 participants", () => {
        const validData = { ...validSessionData, max_participants: 50 };
        const result = createSessionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe("member_ids validation", () => {
      it("should reject empty member array", () => {
        const invalidData = { ...validSessionData, member_ids: [] };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Please select at least one member for the training session"
          );
        }
      });

      it("should reject invalid UUID in member_ids", () => {
        const invalidData = {
          ...validSessionData,
          member_ids: ["invalid-uuid"],
        };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Invalid member selection"
          );
        }
      });

      it("should reject more than 50 members", () => {
        const tooManyMembers = Array(51).fill(
          "550e8400-e29b-41d4-a716-446655440001"
        );
        const invalidData = { ...validSessionData, member_ids: tooManyMembers };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Maximum 50 members can be selected for a single session"
          );
        }
      });

      it("should reject when member count exceeds max_participants", () => {
        const invalidData = {
          ...validSessionData,
          max_participants: 2,
          member_ids: [
            "550e8400-e29b-41d4-a716-446655440001",
            "550e8400-e29b-41d4-a716-446655440002",
            "550e8400-e29b-41d4-a716-446655440003",
          ],
        };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "You have selected more members than the maximum capacity allows"
          );
          expect(result.error.issues[0].path).toEqual(["member_ids"]);
        }
      });
    });

    describe("notes validation", () => {
      it("should accept undefined notes", () => {
        const { notes: _notes, ...dataWithoutNotes } = validSessionData;
        const result = createSessionSchema.safeParse(dataWithoutNotes);
        expect(result.success).toBe(true);
      });

      it("should accept empty string notes", () => {
        const validData = { ...validSessionData, notes: "" };
        const result = createSessionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept long notes", () => {
        const longNotes = "a".repeat(1000);
        const validData = { ...validSessionData, notes: longNotes };
        const result = createSessionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("updateSessionSchema", () => {
    it("should validate empty update data", () => {
      const result = updateSessionSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it("should validate partial update data", () => {
      const updateData: UpdateSessionData = {
        location: "Updated Gym",
        max_participants: 15,
        status: "in_progress",
      };
      const result = updateSessionSchema.safeParse(updateData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(updateData);
      }
    });

    it("should reject invalid status", () => {
      const invalidData = { status: "invalid_status" };
      const result = updateSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept all valid statuses", () => {
      const statuses = ["scheduled", "in_progress", "completed", "cancelled"];

      statuses.forEach((status) => {
        const result = updateSessionSchema.safeParse({ status });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      });
    });
  });

  describe("sessionFiltersSchema", () => {
    it("should validate empty filters", () => {
      const result = sessionFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it("should validate complete filters", () => {
      const filters: SessionFiltersData = {
        trainer_id: "550e8400-e29b-41d4-a716-446655440000",
        status: "scheduled",
        date_range: {
          start: new Date("2024-12-01"),
          end: new Date("2024-12-31"),
        },
        location: "Main Gym",
      };
      const result = sessionFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(filters);
      }
    });

    describe("date_range validation", () => {
      it("should reject when start date is after end date", () => {
        const invalidFilters = {
          date_range: {
            start: new Date("2024-12-31"),
            end: new Date("2024-12-01"),
          },
        };
        const result = sessionFiltersSchema.safeParse(invalidFilters);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Start date must be before end date"
          );
        }
      });

      it("should accept when start date equals end date", () => {
        const validFilters = {
          date_range: {
            start: new Date("2024-12-01"),
            end: new Date("2024-12-01"),
          },
        };
        const result = sessionFiltersSchema.safeParse(validFilters);
        expect(result.success).toBe(true);
      });
    });

    it("should accept all valid status filters", () => {
      const statuses = ["scheduled", "completed", "cancelled", "all"];

      statuses.forEach((status) => {
        const result = sessionFiltersSchema.safeParse({ status });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      });
    });
  });

  describe("Type inference", () => {
    it("should correctly infer CreateSessionData type", () => {
      const data: CreateSessionData = {
        trainer_id: "550e8400-e29b-41d4-a716-446655440000",
        scheduled_start: "2024-12-01T09:00:00.000Z",
        scheduled_end: "2024-12-01T10:00:00.000Z",
        location: "Main Gym",
        max_participants: 10,
        member_ids: ["550e8400-e29b-41d4-a716-446655440001"],
      };

      // TypeScript compilation test - should not have any type errors
      expect(typeof data.trainer_id).toBe("string");
      expect(typeof data.max_participants).toBe("number");
      expect(Array.isArray(data.member_ids)).toBe(true);
    });

    it("should correctly infer UpdateSessionData type", () => {
      const data: UpdateSessionData = {
        location: "Updated Location",
        status: "completed",
      };

      // TypeScript compilation test - should not have any type errors
      expect(typeof data.location).toBe("string");
      expect(typeof data.status).toBe("string");
    });

    it("should correctly infer SessionFiltersData type", () => {
      const data: SessionFiltersData = {
        trainer_id: "550e8400-e29b-41d4-a716-446655440000",
        status: "all",
        date_range: {
          start: new Date(),
          end: new Date(),
        },
      };

      // TypeScript compilation test - should not have any type errors
      expect(typeof data.trainer_id).toBe("string");
      expect(typeof data.status).toBe("string");
      expect(data.date_range?.start instanceof Date).toBe(true);
    });
  });
});
