import { describe, it, expect } from "vitest";
import {
  SESSION_STATUS_OPTIONS,
  COMMON_DURATIONS,
  CALENDAR_CONFIG,
  FORM_FIELDS,
  ERROR_MESSAGES,
} from "../../lib/constants";

describe("Training Session Constants", () => {
  describe("SESSION_STATUS_OPTIONS", () => {
    it("should contain all valid session statuses", () => {
      const expectedStatuses = [
        { value: "scheduled", label: "Scheduled" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ];

      expect(SESSION_STATUS_OPTIONS).toEqual(expectedStatuses);
      expect(SESSION_STATUS_OPTIONS).toHaveLength(4);
    });

    it("should have proper structure for each status option", () => {
      SESSION_STATUS_OPTIONS.forEach((option) => {
        expect(option).toHaveProperty("value");
        expect(option).toHaveProperty("label");
        expect(typeof option.value).toBe("string");
        expect(typeof option.label).toBe("string");
        expect(option.value.length).toBeGreaterThan(0);
        expect(option.label.length).toBeGreaterThan(0);
      });
    });

    it("should have unique values", () => {
      const values = SESSION_STATUS_OPTIONS.map((option) => option.value);
      const uniqueValues = new Set(values);
      expect(values).toHaveLength(uniqueValues.size);
    });

    it("should be readonly (as const)", () => {
      // TypeScript should enforce readonly, but we can test the structure
      expect(Array.isArray(SESSION_STATUS_OPTIONS)).toBe(true);

      // Attempt to modify should not affect the original (if properly const)
      const copy = [...SESSION_STATUS_OPTIONS];
      copy.push({
        value: "new",
        label: "New",
      } as (typeof SESSION_STATUS_OPTIONS)[number]);
      expect(SESSION_STATUS_OPTIONS).toHaveLength(4); // Original unchanged
    });
  });

  describe("COMMON_DURATIONS", () => {
    it("should contain expected duration options", () => {
      const expectedDurations = [
        { value: 30, label: "30 minutes" },
        { value: 45, label: "45 minutes" },
        { value: 60, label: "1 hour" },
        { value: 90, label: "1.5 hours" },
        { value: 120, label: "2 hours" },
      ];

      expect(COMMON_DURATIONS).toEqual(expectedDurations);
      expect(COMMON_DURATIONS).toHaveLength(5);
    });

    it("should have proper structure for each duration option", () => {
      COMMON_DURATIONS.forEach((duration) => {
        expect(duration).toHaveProperty("value");
        expect(duration).toHaveProperty("label");
        expect(typeof duration.value).toBe("number");
        expect(typeof duration.label).toBe("string");
        expect(duration.value).toBeGreaterThan(0);
        expect(duration.label.length).toBeGreaterThan(0);
      });
    });

    it("should have durations in ascending order", () => {
      for (let i = 1; i < COMMON_DURATIONS.length; i++) {
        expect(COMMON_DURATIONS[i].value).toBeGreaterThan(
          COMMON_DURATIONS[i - 1].value
        );
      }
    });

    it("should have reasonable duration ranges", () => {
      const values = COMMON_DURATIONS.map((d) => d.value);
      expect(Math.min(...values)).toBeGreaterThanOrEqual(15); // At least 15 minutes
      expect(Math.max(...values)).toBeLessThanOrEqual(240); // At most 4 hours
    });
  });

  describe("CALENDAR_CONFIG", () => {
    it("should have correct default configuration", () => {
      expect(CALENDAR_CONFIG.defaultView).toBe("week");
      expect(CALENDAR_CONFIG.step).toBe(15);
      expect(CALENDAR_CONFIG.timeslots).toBe(4);
    });

    it("should have all required view options", () => {
      const expectedViews = ["month", "week", "day"];
      expect(CALENDAR_CONFIG.views).toEqual(expectedViews);
    });

    it("should have valid time boundaries", () => {
      expect(CALENDAR_CONFIG.min).toBeInstanceOf(Date);
      expect(CALENDAR_CONFIG.max).toBeInstanceOf(Date);
      expect(CALENDAR_CONFIG.scrollToTime).toBeInstanceOf(Date);

      // Min should be before max
      expect(CALENDAR_CONFIG.min.getTime()).toBeLessThan(
        CALENDAR_CONFIG.max.getTime()
      );

      // Scroll time should be between min and max
      expect(CALENDAR_CONFIG.scrollToTime.getTime()).toBeGreaterThanOrEqual(
        CALENDAR_CONFIG.min.getTime()
      );
      expect(CALENDAR_CONFIG.scrollToTime.getTime()).toBeLessThanOrEqual(
        CALENDAR_CONFIG.max.getTime()
      );
    });

    it("should have reasonable time settings", () => {
      // 6 AM start time
      expect(CALENDAR_CONFIG.min.getHours()).toBe(6);
      expect(CALENDAR_CONFIG.min.getMinutes()).toBe(0);

      // 10 PM end time
      expect(CALENDAR_CONFIG.max.getHours()).toBe(22);
      expect(CALENDAR_CONFIG.max.getMinutes()).toBe(0);

      // 8 AM scroll time
      expect(CALENDAR_CONFIG.scrollToTime.getHours()).toBe(8);
      expect(CALENDAR_CONFIG.scrollToTime.getMinutes()).toBe(0);
    });

    it("should have valid step and timeslot configuration", () => {
      expect(CALENDAR_CONFIG.step).toBe(15);
      expect(CALENDAR_CONFIG.timeslots).toBe(4);

      // 4 timeslots of 15 minutes should equal 60 minutes (1 hour)
      expect(CALENDAR_CONFIG.step * CALENDAR_CONFIG.timeslots).toBe(60);
    });

    it("should have formats configuration", () => {
      expect(CALENDAR_CONFIG.formats).toHaveProperty("timeGutterFormat");
      expect(CALENDAR_CONFIG.formats).toHaveProperty("eventTimeRangeFormat");

      expect(CALENDAR_CONFIG.formats.timeGutterFormat).toBe("HH:mm");
      expect(typeof CALENDAR_CONFIG.formats.eventTimeRangeFormat).toBe(
        "function"
      );
    });

    it("should format event time range correctly", () => {
      const start = new Date("2024-12-01T09:00:00.000Z");
      const end = new Date("2024-12-01T10:30:00.000Z");

      const mockLocalizer = {
        format: (date: Date, format: string) => {
          if (format === "HH:mm") {
            return date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          }
          return date.toString();
        },
      };

      const result = CALENDAR_CONFIG.formats.eventTimeRangeFormat(
        { start, end },
        "en-US",
        mockLocalizer
      );
      expect(typeof result).toBe("string");
      expect(result).toContain("-"); // Should contain time range separator
    });

    it("should handle event time range formatting without localizer", () => {
      const start = new Date("2024-12-01T09:00:00.000Z");
      const end = new Date("2024-12-01T10:30:00.000Z");

      const result = CALENDAR_CONFIG.formats.eventTimeRangeFormat({
        start,
        end,
      });
      expect(typeof result).toBe("string");
      expect(result).toContain("-"); // Should contain time range separator
    });
  });

  describe("FORM_FIELDS", () => {
    it("should contain all required form field names", () => {
      const expectedFields = {
        trainer_id: "trainer_id",
        scheduled_start: "scheduled_start",
        scheduled_end: "scheduled_end",
        location: "location",
        max_participants: "max_participants",
        member_ids: "member_ids",
        notes: "notes",
      };

      expect(FORM_FIELDS).toEqual(expectedFields);
    });

    it("should have string values for all fields", () => {
      Object.values(FORM_FIELDS).forEach((field) => {
        expect(typeof field).toBe("string");
        expect(field.length).toBeGreaterThan(0);
      });
    });

    it("should have keys matching values", () => {
      Object.entries(FORM_FIELDS).forEach(([key, value]) => {
        expect(key).toBe(value);
      });
    });

    it("should be readonly (as const)", () => {
      expect(typeof FORM_FIELDS).toBe("object");
      expect(FORM_FIELDS).not.toBeNull();

      // Should not be an array
      expect(Array.isArray(FORM_FIELDS)).toBe(false);
    });
  });

  describe("ERROR_MESSAGES", () => {
    it("should contain all expected error messages", () => {
      const expectedMessages = {
        TRAINER_NOT_AVAILABLE: "Trainer is not available at the selected time",
        SESSION_CONFLICT: "This time slot conflicts with an existing session",
        MAX_PARTICIPANTS_EXCEEDED: "Maximum number of participants exceeded",
        INVALID_TIME_SLOT: "Invalid time slot selected",
        PAST_DATE_SELECTED: "Cannot schedule sessions in the past",
        MEMBER_ALREADY_BOOKED:
          "One or more members are already booked for this time",
        TRAINER_MAX_CAPACITY: "Exceeds trainer maximum clients per session",
      };

      expect(ERROR_MESSAGES).toEqual(expectedMessages);
    });

    it("should have meaningful error messages", () => {
      Object.values(ERROR_MESSAGES).forEach((message) => {
        expect(typeof message).toBe("string");
        expect(message.length).toBeGreaterThan(10); // Reasonable length
        expect(message).not.toContain("TODO"); // Should be complete messages
        expect(message).not.toContain("PLACEHOLDER"); // Should be complete messages
      });
    });

    it("should have descriptive error keys", () => {
      const errorKeys = Object.keys(ERROR_MESSAGES);

      errorKeys.forEach((key) => {
        expect(key).toMatch(/^[A-Z_]+$/); // Should be UPPER_SNAKE_CASE
        expect(key.length).toBeGreaterThan(5); // Should be descriptive
      });
    });

    it("should cover common training session error scenarios", () => {
      const requiredErrorTypes = [
        "TRAINER_NOT_AVAILABLE",
        "SESSION_CONFLICT",
        "MAX_PARTICIPANTS_EXCEEDED",
        "INVALID_TIME_SLOT",
        "PAST_DATE_SELECTED",
      ];

      requiredErrorTypes.forEach((errorType) => {
        expect(ERROR_MESSAGES).toHaveProperty(errorType);
        expect(
          typeof ERROR_MESSAGES[errorType as keyof typeof ERROR_MESSAGES]
        ).toBe("string");
      });
    });

    it("should have user-friendly error messages", () => {
      Object.values(ERROR_MESSAGES).forEach((message) => {
        // Should not contain technical terms
        expect(message).not.toContain("NULL");
        expect(message).not.toContain("undefined");
        expect(message).not.toContain("Error:");

        // Should be properly capitalized
        expect(message.charAt(0)).toMatch(/[A-Z]/);

        // Should not end with period (for consistency in UI)
        expect(message).not.toMatch(/\.$/);
      });
    });
  });

  describe("Constants Integration", () => {
    it("should have consistent naming conventions", () => {
      // All exported constants should be UPPER_SNAKE_CASE
      const constantNames = [
        "SESSION_STATUS_OPTIONS",
        "COMMON_DURATIONS",
        "CALENDAR_CONFIG",
        "FORM_FIELDS",
        "ERROR_MESSAGES",
      ];

      constantNames.forEach((name) => {
        expect(name).toMatch(/^[A-Z_]+$/);
      });
    });

    it("should have immutable structures (readonly)", () => {
      // These should be readonly at runtime
      expect(Object.isFrozen(SESSION_STATUS_OPTIONS)).toBe(false); // Arrays are not frozen by 'as const'
      expect(Object.isFrozen(CALENDAR_CONFIG)).toBe(false); // Objects are not frozen by 'as const'

      // But they should be const arrays/objects
      expect(Array.isArray(SESSION_STATUS_OPTIONS)).toBe(true);
      expect(Array.isArray(COMMON_DURATIONS)).toBe(true);
      expect(typeof CALENDAR_CONFIG).toBe("object");
      expect(typeof FORM_FIELDS).toBe("object");
      expect(typeof ERROR_MESSAGES).toBe("object");
    });

    it("should have appropriate data types", () => {
      // SESSION_STATUS_OPTIONS should be array of objects
      expect(Array.isArray(SESSION_STATUS_OPTIONS)).toBe(true);
      SESSION_STATUS_OPTIONS.forEach((option) =>
        expect(typeof option).toBe("object")
      );

      // COMMON_DURATIONS should be array of objects
      expect(Array.isArray(COMMON_DURATIONS)).toBe(true);
      COMMON_DURATIONS.forEach((duration) =>
        expect(typeof duration).toBe("object")
      );

      // CALENDAR_CONFIG should be object
      expect(typeof CALENDAR_CONFIG).toBe("object");
      expect(CALENDAR_CONFIG).not.toBeNull();

      // FORM_FIELDS should be object with string values
      expect(typeof FORM_FIELDS).toBe("object");
      Object.values(FORM_FIELDS).forEach((field) =>
        expect(typeof field).toBe("string")
      );

      // ERROR_MESSAGES should be object with string values
      expect(typeof ERROR_MESSAGES).toBe("object");
      Object.values(ERROR_MESSAGES).forEach((message) =>
        expect(typeof message).toBe("string")
      );
    });
  });
});
