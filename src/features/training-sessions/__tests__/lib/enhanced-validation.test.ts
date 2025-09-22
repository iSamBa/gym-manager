import { describe, it, expect } from "vitest";
import {
  createSessionSchema,
  type CreateSessionData,
} from "../../lib/validation";

describe("US-004 & US-005: Enhanced Validation Rules", () => {
  const validSessionData: CreateSessionData = {
    trainer_id: "550e8400-e29b-41d4-a716-446655440000",
    scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    scheduled_end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
    location: "Main Gym",
    session_type: "standard",
    max_participants: 5,
    member_ids: ["550e8400-e29b-41d4-a716-446655440001"],
    notes: "Test session",
  };

  describe("US-005: Cannot schedule sessions in the past", () => {
    it("should reject sessions scheduled in the past", () => {
      const pastData = {
        ...validSessionData,
        scheduled_start: new Date(
          Date.now() - 24 * 60 * 60 * 1000
        ).toISOString(), // Yesterday
      };

      const result = createSessionSchema.safeParse(pastData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const pastDateError = result.error.issues.find(
          (issue) =>
            issue.message ===
            "Training sessions cannot be scheduled for past dates. Please choose a future date and time."
        );
        expect(pastDateError).toBeDefined();
        expect(pastDateError?.path).toEqual(["scheduled_start"]);
      }
    });

    it("should allow sessions scheduled in the near future (5 minutes from now)", () => {
      const nearFutureData = {
        ...validSessionData,
        scheduled_start: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
        scheduled_end: new Date(Date.now() + 65 * 60 * 1000).toISOString(), // 1 hour 5 minutes from now
      };

      const result = createSessionSchema.safeParse(nearFutureData);
      expect(result.success).toBe(true);
    });

    it("should reject sessions that start exactly at current time", () => {
      const nowData = {
        ...validSessionData,
        scheduled_start: new Date().toISOString(), // Exactly now
        scheduled_end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const result = createSessionSchema.safeParse(nowData);
      expect(result.success).toBe(false);
    });
  });

  describe("US-005: End time must be after start time", () => {
    it("should reject when end time equals start time (zero duration)", () => {
      const sameTimes = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();
      const zeroData = {
        ...validSessionData,
        scheduled_start: sameTimes,
        scheduled_end: sameTimes,
      };

      const result = createSessionSchema.safeParse(zeroData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const timeError = result.error.issues.find(
          (issue) =>
            issue.message === "Session end time must be later than start time"
        );
        expect(timeError).toBeDefined();
        expect(timeError?.path).toEqual(["scheduled_end"]);
      }
    });

    it("should reject when end time is before start time", () => {
      const reversedData = {
        ...validSessionData,
        scheduled_start: new Date(
          Date.now() + 25 * 60 * 60 * 1000
        ).toISOString(), // Later time
        scheduled_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Earlier time
      };

      const result = createSessionSchema.safeParse(reversedData);
      expect(result.success).toBe(false);
    });
  });

  describe("US-005: Basic session duration validation", () => {
    describe("Minimum 15-minute duration", () => {
      it("should reject sessions shorter than 15 minutes", () => {
        const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 14 * 60 * 1000); // 14 minutes

        const shortData = {
          ...validSessionData,
          scheduled_start: startTime.toISOString(),
          scheduled_end: endTime.toISOString(),
        };

        const result = createSessionSchema.safeParse(shortData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const durationError = result.error.issues.find(
            (issue) =>
              issue.message ===
              "Training sessions must be at least 15 minutes long for effectiveness"
          );
          expect(durationError).toBeDefined();
          expect(durationError?.path).toEqual(["scheduled_end"]);
        }
      });

      it("should accept sessions with exactly 15 minutes duration", () => {
        const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 15 * 60 * 1000); // Exactly 15 minutes

        const exactData = {
          ...validSessionData,
          scheduled_start: startTime.toISOString(),
          scheduled_end: endTime.toISOString(),
        };

        const result = createSessionSchema.safeParse(exactData);
        expect(result.success).toBe(true);
      });

      it("should accept sessions longer than 15 minutes", () => {
        const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 16 * 60 * 1000); // 16 minutes

        const longerData = {
          ...validSessionData,
          scheduled_start: startTime.toISOString(),
          scheduled_end: endTime.toISOString(),
        };

        const result = createSessionSchema.safeParse(longerData);
        expect(result.success).toBe(true);
      });
    });

    describe("Maximum 8-hour duration", () => {
      it("should reject sessions longer than 8 hours", () => {
        const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 8.1 * 60 * 60 * 1000); // 8.1 hours

        const longData = {
          ...validSessionData,
          scheduled_start: startTime.toISOString(),
          scheduled_end: endTime.toISOString(),
        };

        const result = createSessionSchema.safeParse(longData);
        expect(result.success).toBe(false);

        if (!result.success) {
          const durationError = result.error.issues.find(
            (issue) =>
              issue.message ===
              "Training sessions cannot exceed 8 hours for safety and effectiveness"
          );
          expect(durationError).toBeDefined();
          expect(durationError?.path).toEqual(["scheduled_end"]);
        }
      });

      it("should accept sessions with exactly 8 hours duration", () => {
        const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 8 * 60 * 60 * 1000); // Exactly 8 hours

        const maxData = {
          ...validSessionData,
          scheduled_start: startTime.toISOString(),
          scheduled_end: endTime.toISOString(),
        };

        const result = createSessionSchema.safeParse(maxData);
        expect(result.success).toBe(true);
      });

      it("should accept sessions shorter than 8 hours", () => {
        const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 7.9 * 60 * 60 * 1000); // 7.9 hours

        const shorterData = {
          ...validSessionData,
          scheduled_start: startTime.toISOString(),
          scheduled_end: endTime.toISOString(),
        };

        const result = createSessionSchema.safeParse(shorterData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("US-005: Member count cannot exceed trainer maximum capacity", () => {
    it("should reject when selected members exceed max_participants", () => {
      const overCapacityData = {
        ...validSessionData,
        max_participants: 2,
        member_ids: [
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440002",
          "550e8400-e29b-41d4-a716-446655440003", // 3 members > 2 max
        ],
      };

      const result = createSessionSchema.safeParse(overCapacityData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const capacityError = result.error.issues.find(
          (issue) =>
            issue.message ===
            "You have selected more members than the maximum capacity allows"
        );
        expect(capacityError).toBeDefined();
        expect(capacityError?.path).toEqual(["member_ids"]);
      }
    });

    it("should allow when selected members equal max_participants", () => {
      const equalCapacityData = {
        ...validSessionData,
        max_participants: 3,
        member_ids: [
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440002",
          "550e8400-e29b-41d4-a716-446655440003", // 3 members = 3 max
        ],
      };

      const result = createSessionSchema.safeParse(equalCapacityData);
      expect(result.success).toBe(true);
    });

    it("should allow when selected members are less than max_participants", () => {
      const underCapacityData = {
        ...validSessionData,
        max_participants: 5,
        member_ids: [
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440002", // 2 members < 5 max
        ],
      };

      const result = createSessionSchema.safeParse(underCapacityData);
      expect(result.success).toBe(true);
    });
  });

  describe("US-005: Location is required for all sessions", () => {
    it("should reject empty location string", () => {
      const noLocationData = {
        ...validSessionData,
        location: "",
      };

      const result = createSessionSchema.safeParse(noLocationData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const locationError = result.error.issues.find(
          (issue) =>
            issue.message ===
            "Please specify where the training session will take place"
        );
        expect(locationError).toBeDefined();
      }
    });

    it("should reject whitespace-only location", () => {
      const whitespaceLocationData = {
        ...validSessionData,
        location: "   ",
      };

      const result = createSessionSchema.safeParse(whitespaceLocationData);
      expect(result.success).toBe(false);
    });

    it("should accept valid location strings", () => {
      const validLocations = [
        "Main Gym",
        "Studio A",
        "Outdoor Court 1",
        "Room 101",
        "Pool Area",
      ];

      validLocations.forEach((location) => {
        const locationData = {
          ...validSessionData,
          location,
        };

        const result = createSessionSchema.safeParse(locationData);
        expect(result.success).toBe(true);
      });
    });

    it("should reject location strings that are too long", () => {
      const longLocationData = {
        ...validSessionData,
        location: "a".repeat(101), // Exceeds 100 character limit
      };

      const result = createSessionSchema.safeParse(longLocationData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const lengthError = result.error.issues.find(
          (issue) =>
            issue.message === "Location name must be 100 characters or less"
        );
        expect(lengthError).toBeDefined();
      }
    });
  });

  describe("US-005: At least one member must be selected", () => {
    it("should reject empty member_ids array", () => {
      const noMembersData = {
        ...validSessionData,
        member_ids: [],
      };

      const result = createSessionSchema.safeParse(noMembersData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const membersError = result.error.issues.find(
          (issue) =>
            issue.message ===
            "Please select at least one member for the training session"
        );
        expect(membersError).toBeDefined();
      }
    });

    it("should accept single member selection", () => {
      const singleMemberData = {
        ...validSessionData,
        member_ids: ["550e8400-e29b-41d4-a716-446655440001"],
      };

      const result = createSessionSchema.safeParse(singleMemberData);
      expect(result.success).toBe(true);
    });

    it("should accept multiple member selections", () => {
      const multipleMembersData = {
        ...validSessionData,
        member_ids: [
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440002",
        ],
      };

      const result = createSessionSchema.safeParse(multipleMembersData);
      expect(result.success).toBe(true);
    });

    it("should validate member ID format (UUID)", () => {
      const invalidMemberIdData = {
        ...validSessionData,
        member_ids: ["not-a-valid-uuid"],
      };

      const result = createSessionSchema.safeParse(invalidMemberIdData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const uuidError = result.error.issues.find(
          (issue) => issue.message === "Invalid member selection"
        );
        expect(uuidError).toBeDefined();
      }
    });
  });

  describe("Business hours validation (future enhancement)", () => {
    // These tests document expected behavior for business hours validation
    // Currently not implemented in the schema but should be considered

    it("should document expected business hours validation", () => {
      // Future enhancement: validate sessions are within business hours
      // e.g., 6 AM to 10 PM
      const businessHoursTests = [
        {
          name: "Before business hours",
          start: "2024-12-01T05:00:00.000Z", // 5 AM
          shouldBeValid: false,
        },
        {
          name: "After business hours",
          start: "2024-12-01T22:30:00.000Z", // 10:30 PM
          shouldBeValid: false,
        },
        {
          name: "During business hours",
          start: "2024-12-01T14:00:00.000Z", // 2 PM
          shouldBeValid: true,
        },
      ];

      // For now, just document these test cases
      expect(businessHoursTests.length).toBeGreaterThan(0);
    });
  });

  describe("Combined validation scenarios", () => {
    it("should handle multiple validation errors correctly", () => {
      const multipleErrorsData = {
        ...validSessionData,
        trainer_id: "invalid-uuid", // Invalid UUID
        scheduled_start: new Date(
          Date.now() - 24 * 60 * 60 * 1000
        ).toISOString(), // Past date
        scheduled_end: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), // Also past, but after start
        location: "", // Empty location
        max_participants: 0, // Invalid participant count
        member_ids: [], // No members
      };

      const result = createSessionSchema.safeParse(multipleErrorsData);
      expect(result.success).toBe(false);

      if (!result.success) {
        // Should have multiple validation errors
        expect(result.error.issues.length).toBeGreaterThan(1);

        // Check for specific error types
        const errorMessages = result.error.issues.map((issue) => issue.message);
        expect(errorMessages).toContain(
          "Please select a valid trainer from the list"
        );
        expect(errorMessages).toContain(
          "Training sessions cannot be scheduled for past dates. Please choose a future date and time."
        );
        expect(errorMessages).toContain(
          "Please specify where the training session will take place"
        );
        expect(errorMessages).toContain(
          "Sessions must allow at least 1 participant"
        );
        expect(errorMessages).toContain(
          "Please select at least one member for the training session"
        );
      }
    });

    it("should pass validation with all requirements met", () => {
      const perfectData: CreateSessionData = {
        trainer_id: "550e8400-e29b-41d4-a716-446655440000",
        scheduled_start: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(), // Tomorrow
        scheduled_end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        location: "Main Gym",
        session_type: "standard",
        max_participants: 10,
        member_ids: [
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440002",
        ],
        notes: "Perfect session with all requirements met",
      };

      const result = createSessionSchema.safeParse(perfectData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toEqual(perfectData);
      }
    });
  });

  describe("Edge cases and boundary conditions", () => {
    it("should handle daylight saving time transitions", () => {
      // Test sessions that cross daylight saving time boundaries
      // This ensures timezone handling is robust
      const dstData = {
        ...validSessionData,
        scheduled_start: "2024-03-10T07:00:00.000Z", // DST transition period
        scheduled_end: "2024-03-10T08:00:00.000Z",
      };

      const result = createSessionSchema.safeParse(dstData);
      // Should handle timezone transitions correctly
      expect(result.success).toBe(true);
    });

    it("should handle leap year dates", () => {
      const leapYearData = {
        ...validSessionData,
        scheduled_start: "2024-02-29T09:00:00.000Z", // Feb 29 in leap year
        scheduled_end: "2024-02-29T10:00:00.000Z",
      };

      const result = createSessionSchema.safeParse(leapYearData);
      expect(result.success).toBe(true);
    });

    it("should handle maximum member IDs array", () => {
      const maxMembersData = {
        ...validSessionData,
        max_participants: 50,
        member_ids: Array.from(
          { length: 50 },
          (_, i) =>
            `550e8400-e29b-41d4-a716-4466554400${i.toString().padStart(2, "0")}`
        ),
      };

      const result = createSessionSchema.safeParse(maxMembersData);
      expect(result.success).toBe(true);
    });

    it("should handle timezone edge cases", () => {
      // Test various timezone formats
      const timezoneTests = [
        "2024-12-01T09:00:00.000Z", // UTC
        "2024-12-01T09:00:00-05:00", // EST
        "2024-12-01T09:00:00+01:00", // CET
      ];

      timezoneTests.forEach((timestamp) => {
        const timezoneData = {
          ...validSessionData,
          scheduled_start: timestamp,
          scheduled_end: new Date(
            new Date(timestamp).getTime() + 60 * 60 * 1000
          ).toISOString(),
        };

        const result = createSessionSchema.safeParse(timezoneData);
        expect(result.success).toBe(true);
      });
    });
  });
});
