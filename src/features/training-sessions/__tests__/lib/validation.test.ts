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
      machine_id: "550e8400-e29b-41d4-a716-446655440000",
      trainer_id: "550e8400-e29b-41d4-a716-446655440001",
      scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      scheduled_end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
      session_type: "standard",
      member_id: "550e8400-e29b-41d4-a716-446655440002",
      notes: "Morning strength session",
    };

    it("should validate correct training session data", () => {
      const result = createSessionSchema.safeParse(validSessionData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validSessionData);
      }
    });

    describe("machine_id validation", () => {
      it("should reject invalid UUID", () => {
        const invalidData = { ...validSessionData, machine_id: "invalid-uuid" };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Please select a valid machine from the available options"
          );
        }
      });

      it("should reject empty machine_id", () => {
        const invalidData = { ...validSessionData, machine_id: "" };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Please select a valid machine from the available options"
          );
        }
      });
    });

    describe("trainer_id validation (optional)", () => {
      it("should accept null trainer_id", () => {
        const validData = { ...validSessionData, trainer_id: null };
        const result = createSessionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept undefined trainer_id", () => {
        const { trainer_id, ...dataWithoutTrainer } = validSessionData;
        const result = createSessionSchema.safeParse(dataWithoutTrainer);
        expect(result.success).toBe(true);
      });

      it("should reject invalid UUID when trainer_id provided", () => {
        const invalidData = { ...validSessionData, trainer_id: "invalid-uuid" };
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

    describe("session_type validation", () => {
      it("should accept 'trail' session type", () => {
        const validData = {
          ...validSessionData,
          session_type: "trail" as const,
        };
        const result = createSessionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept 'standard' session type", () => {
        const validData = {
          ...validSessionData,
          session_type: "standard" as const,
        };
        const result = createSessionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should reject invalid session type", () => {
        const invalidData = { ...validSessionData, session_type: "invalid" };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe("member_id validation", () => {
      it("should reject invalid UUID", () => {
        const invalidData = {
          ...validSessionData,
          member_id: "invalid-uuid",
        };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Invalid member selection - please select a valid member"
          );
        }
      });

      it("should reject empty member_id", () => {
        const invalidData = { ...validSessionData, member_id: "" };
        const result = createSessionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should accept valid UUID", () => {
        const validData = {
          ...validSessionData,
          member_id: "550e8400-e29b-41d4-a716-446655440099",
        };
        const result = createSessionSchema.safeParse(validData);
        expect(result.success).toBe(true);
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
        machine_id: "550e8400-e29b-41d4-a716-446655440000",
        notes: "Updated notes",
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
        machine_id: "550e8400-e29b-41d4-a716-446655440000",
        trainer_id: "550e8400-e29b-41d4-a716-446655440001",
        member_id: "550e8400-e29b-41d4-a716-446655440002",
        status: "scheduled",
        date_range: {
          start: new Date("2024-12-01"),
          end: new Date("2024-12-31"),
        },
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
