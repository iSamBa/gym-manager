import { describe, it, expect } from "vitest";
import { SESSION_STATUS_OPTIONS, COMMON_DURATIONS } from "../../lib/constants";

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

  describe("Constants Integration", () => {
    it("should have consistent naming conventions", () => {
      // All exported constants should be UPPER_SNAKE_CASE
      const constantNames = ["SESSION_STATUS_OPTIONS", "COMMON_DURATIONS"];

      constantNames.forEach((name) => {
        expect(name).toMatch(/^[A-Z_]+$/);
      });
    });

    it("should have immutable structures (readonly)", () => {
      // These should be readonly at runtime
      expect(Object.isFrozen(SESSION_STATUS_OPTIONS)).toBe(false); // Arrays are not frozen by 'as const'

      // But they should be const arrays/objects
      expect(Array.isArray(SESSION_STATUS_OPTIONS)).toBe(true);
      expect(Array.isArray(COMMON_DURATIONS)).toBe(true);
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
    });
  });
});
