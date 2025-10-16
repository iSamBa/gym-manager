import { describe, it, expect } from "vitest";
import { validateOpeningHours, hasValidationErrors } from "../validation";
import type { OpeningHoursWeek } from "../types";

describe("validateOpeningHours", () => {
  it("returns no errors for valid opening hours", () => {
    const validHours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      wednesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const errors = validateOpeningHours(validHours);

    expect(errors).toEqual({});
  });

  it("returns error when opening time is missing for open day", () => {
    const invalidHours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: null, close_time: "21:00" },
      tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      wednesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const errors = validateOpeningHours(invalidHours);

    expect(errors.monday).toBe("Opening and closing times are required");
  });

  it("returns error when closing time is missing for open day", () => {
    const invalidHours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "09:00", close_time: null },
      tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      wednesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const errors = validateOpeningHours(invalidHours);

    expect(errors.monday).toBe("Opening and closing times are required");
  });

  it("returns error when time format is invalid", () => {
    const invalidHours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "9:00", close_time: "21:00" },
      tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      wednesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const errors = validateOpeningHours(invalidHours);

    expect(errors.monday).toBe("Invalid time format (expected HH:MM)");
  });

  it("returns error when closing time equals opening time", () => {
    const invalidHours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "09:00", close_time: "09:00" },
      tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      wednesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const errors = validateOpeningHours(invalidHours);

    expect(errors.monday).toBe("Closing time must be after opening time");
  });

  it("returns error when closing time is before opening time", () => {
    const invalidHours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "21:00", close_time: "09:00" },
      tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      wednesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const errors = validateOpeningHours(invalidHours);

    expect(errors.monday).toBe("Closing time must be after opening time");
  });

  it("does not validate closed days", () => {
    const hoursWithClosedDay: OpeningHoursWeek = {
      monday: { is_open: false, open_time: null, close_time: null },
      tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      wednesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const errors = validateOpeningHours(hoursWithClosedDay);

    expect(errors.monday).toBeUndefined();
  });

  it("returns multiple errors for multiple invalid days", () => {
    const invalidHours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: null, close_time: "21:00" },
      tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      wednesday: { is_open: true, open_time: "21:00", close_time: "09:00" },
      thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      friday: { is_open: true, open_time: "9:00", close_time: "21:00" },
      saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const errors = validateOpeningHours(invalidHours);

    expect(errors.monday).toBe("Opening and closing times are required");
    expect(errors.wednesday).toBe("Closing time must be after opening time");
    expect(errors.friday).toBe("Invalid time format (expected HH:MM)");
    expect(Object.keys(errors).length).toBe(3);
  });
});

describe("hasValidationErrors", () => {
  it("returns false for empty errors object", () => {
    expect(hasValidationErrors({})).toBe(false);
  });

  it("returns true when errors exist", () => {
    const errors = { monday: "Some error" };
    expect(hasValidationErrors(errors)).toBe(true);
  });

  it("returns true for multiple errors", () => {
    const errors = {
      monday: "Error 1",
      wednesday: "Error 2",
      friday: "Error 3",
    };
    expect(hasValidationErrors(errors)).toBe(true);
  });
});
