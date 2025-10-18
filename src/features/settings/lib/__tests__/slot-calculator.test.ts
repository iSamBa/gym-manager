import { describe, it, expect } from "vitest";
import {
  calculateAvailableSlots,
  calculateTotalWeeklySlots,
} from "../slot-calculator";
import type { OpeningHoursWeek } from "../types";

describe("calculateAvailableSlots", () => {
  it("should calculate correct slots for a full day (09:00-21:00)", () => {
    const hours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      tuesday: { is_open: false, open_time: null, close_time: null },
      wednesday: { is_open: false, open_time: null, close_time: null },
      thursday: { is_open: false, open_time: null, close_time: null },
      friday: { is_open: false, open_time: null, close_time: null },
      saturday: { is_open: false, open_time: null, close_time: null },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const slots = calculateAvailableSlots(hours);

    // 09:00 to 21:00 = 12 hours = 720 minutes = 24 slots (30-min each)
    expect(slots.monday).toBe(24);
  });

  it("should return 0 slots for closed days", () => {
    const hours: OpeningHoursWeek = {
      monday: { is_open: false, open_time: null, close_time: null },
      tuesday: { is_open: false, open_time: null, close_time: null },
      wednesday: { is_open: false, open_time: null, close_time: null },
      thursday: { is_open: false, open_time: null, close_time: null },
      friday: { is_open: false, open_time: null, close_time: null },
      saturday: { is_open: false, open_time: null, close_time: null },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const slots = calculateAvailableSlots(hours);

    expect(slots.monday).toBe(0);
    expect(slots.sunday).toBe(0);
  });

  it("should handle partial hours correctly", () => {
    const hours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "10:30", close_time: "14:00" },
      tuesday: { is_open: false, open_time: null, close_time: null },
      wednesday: { is_open: false, open_time: null, close_time: null },
      thursday: { is_open: false, open_time: null, close_time: null },
      friday: { is_open: false, open_time: null, close_time: null },
      saturday: { is_open: false, open_time: null, close_time: null },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const slots = calculateAvailableSlots(hours);

    // 10:30 to 14:00 = 3.5 hours = 210 minutes = 7 slots
    expect(slots.monday).toBe(7);
  });

  it("should handle late closing times (23:45)", () => {
    const hours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "09:00", close_time: "23:45" },
      tuesday: { is_open: false, open_time: null, close_time: null },
      wednesday: { is_open: false, open_time: null, close_time: null },
      thursday: { is_open: false, open_time: null, close_time: null },
      friday: { is_open: false, open_time: null, close_time: null },
      saturday: { is_open: false, open_time: null, close_time: null },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const slots = calculateAvailableSlots(hours);

    // 09:00 to 23:45 = 14 hours 45 minutes = 885 minutes = 29 slots
    expect(slots.monday).toBe(29);
  });

  it("should handle early morning opening (06:00)", () => {
    const hours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "06:00", close_time: "10:00" },
      tuesday: { is_open: false, open_time: null, close_time: null },
      wednesday: { is_open: false, open_time: null, close_time: null },
      thursday: { is_open: false, open_time: null, close_time: null },
      friday: { is_open: false, open_time: null, close_time: null },
      saturday: { is_open: false, open_time: null, close_time: null },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const slots = calculateAvailableSlots(hours);

    // 06:00 to 10:00 = 4 hours = 240 minutes = 8 slots
    expect(slots.monday).toBe(8);
  });

  it("should calculate slots for all days independently", () => {
    const hours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "09:00", close_time: "17:00" },
      tuesday: { is_open: true, open_time: "10:00", close_time: "16:00" },
      wednesday: { is_open: false, open_time: null, close_time: null },
      thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      friday: { is_open: true, open_time: "08:00", close_time: "20:00" },
      saturday: { is_open: true, open_time: "10:00", close_time: "14:00" },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const slots = calculateAvailableSlots(hours);

    expect(slots.monday).toBe(16); // 8 hours = 16 slots
    expect(slots.tuesday).toBe(12); // 6 hours = 12 slots
    expect(slots.wednesday).toBe(0); // Closed
    expect(slots.thursday).toBe(24); // 12 hours = 24 slots
    expect(slots.friday).toBe(24); // 12 hours = 24 slots
    expect(slots.saturday).toBe(8); // 4 hours = 8 slots
    expect(slots.sunday).toBe(0); // Closed
  });

  it("should handle single 30-minute slot", () => {
    const hours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "12:00", close_time: "12:30" },
      tuesday: { is_open: false, open_time: null, close_time: null },
      wednesday: { is_open: false, open_time: null, close_time: null },
      thursday: { is_open: false, open_time: null, close_time: null },
      friday: { is_open: false, open_time: null, close_time: null },
      saturday: { is_open: false, open_time: null, close_time: null },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const slots = calculateAvailableSlots(hours);

    expect(slots.monday).toBe(1);
  });

  it("should floor partial slots (ignore periods less than 30 minutes)", () => {
    const hours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "09:00", close_time: "10:20" },
      tuesday: { is_open: false, open_time: null, close_time: null },
      wednesday: { is_open: false, open_time: null, close_time: null },
      thursday: { is_open: false, open_time: null, close_time: null },
      friday: { is_open: false, open_time: null, close_time: null },
      saturday: { is_open: false, open_time: null, close_time: null },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const slots = calculateAvailableSlots(hours);

    // 09:00 to 10:20 = 80 minutes = 2 slots (10 minutes ignored)
    expect(slots.monday).toBe(2);
  });
});

describe("calculateTotalWeeklySlots", () => {
  it("should sum all slots across the week", () => {
    const hours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "09:00", close_time: "17:00" },
      tuesday: { is_open: true, open_time: "09:00", close_time: "17:00" },
      wednesday: { is_open: true, open_time: "09:00", close_time: "17:00" },
      thursday: { is_open: true, open_time: "09:00", close_time: "17:00" },
      friday: { is_open: true, open_time: "09:00", close_time: "17:00" },
      saturday: { is_open: false, open_time: null, close_time: null },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const total = calculateTotalWeeklySlots(hours);

    // 5 days × 16 slots = 80 slots
    expect(total).toBe(80);
  });

  it("should return 0 for a fully closed week", () => {
    const hours: OpeningHoursWeek = {
      monday: { is_open: false, open_time: null, close_time: null },
      tuesday: { is_open: false, open_time: null, close_time: null },
      wednesday: { is_open: false, open_time: null, close_time: null },
      thursday: { is_open: false, open_time: null, close_time: null },
      friday: { is_open: false, open_time: null, close_time: null },
      saturday: { is_open: false, open_time: null, close_time: null },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const total = calculateTotalWeeklySlots(hours);

    expect(total).toBe(0);
  });

  it("should handle mixed open/closed days", () => {
    const hours: OpeningHoursWeek = {
      monday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      tuesday: { is_open: false, open_time: null, close_time: null },
      wednesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      thursday: { is_open: false, open_time: null, close_time: null },
      friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      saturday: { is_open: true, open_time: "10:00", close_time: "16:00" },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    const total = calculateTotalWeeklySlots(hours);

    // Mon: 24, Wed: 24, Fri: 24, Sat: 12 = 84 slots
    expect(total).toBe(84);
  });
});
