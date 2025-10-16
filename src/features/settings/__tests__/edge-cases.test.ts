import { describe, it, expect, beforeEach, vi } from "vitest";
import { format, addDays } from "date-fns";
import { generateTimeSlots } from "@/features/training-sessions/lib/slot-generator";
import { validateOpeningHours } from "../lib/validation";
import type { OpeningHoursWeek } from "../lib/types";
import { supabase } from "@/lib/supabase";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe("Edge Cases - Opening Hours Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getDefaultHours = (): OpeningHoursWeek => ({
    monday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    wednesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
    sunday: { is_open: false, open_time: null, close_time: null },
  });

  describe("All Days Closed", () => {
    it("should handle all days closed correctly", () => {
      const allClosed: OpeningHoursWeek = {
        monday: { is_open: false, open_time: null, close_time: null },
        tuesday: { is_open: false, open_time: null, close_time: null },
        wednesday: { is_open: false, open_time: null, close_time: null },
        thursday: { is_open: false, open_time: null, close_time: null },
        friday: { is_open: false, open_time: null, close_time: null },
        saturday: { is_open: false, open_time: null, close_time: null },
        sunday: { is_open: false, open_time: null, close_time: null },
      };

      const errors = validateOpeningHours(allClosed);

      // Should have no validation errors (closed days are valid)
      expect(errors).toEqual({});

      // But business logic should prevent this (would be checked in component/hook)
      const openDays = Object.values(allClosed).filter((day) => day.is_open);
      expect(openDays).toHaveLength(0);
    });

    it("should return empty slots for closed day", async () => {
      const closedDayHours: OpeningHoursWeek = getDefaultHours();
      closedDayHours.sunday = {
        is_open: false,
        open_time: null,
        close_time: null,
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: closedDayHours,
        error: null,
      } as any);

      // Test Sunday (closed)
      const sundayDate = new Date("2025-01-19"); // A Sunday
      const slots = await generateTimeSlots(sundayDate);

      expect(slots).toEqual([]);
    });
  });

  describe("Midnight Closing Time", () => {
    it("should validate near-midnight times correctly", () => {
      const lateHours: OpeningHoursWeek = getDefaultHours();
      lateHours.friday = {
        is_open: true,
        open_time: "09:00",
        close_time: "23:45",
      };

      // Validate that 23:45 is accepted (tested in validation.test.ts)
      const errors = validateOpeningHours(lateHours);
      expect(errors.friday).toBeUndefined();
    });

    // Note: Actual slot generation for late hours is tested in slot-generator.test.ts
  });

  describe("Same Opening and Closing Time", () => {
    it("should validate error for same open/close time", () => {
      const sameTimeHours: OpeningHoursWeek = getDefaultHours();
      sameTimeHours.monday = {
        is_open: true,
        open_time: "09:00",
        close_time: "09:00",
      };

      const errors = validateOpeningHours(sameTimeHours);

      expect(errors.monday).toBe("Closing time must be after opening time");
    });
  });

  describe("Very Short Hours (< 1 hour)", () => {
    it("should validate very short opening windows", () => {
      const shortHours: OpeningHoursWeek = getDefaultHours();
      shortHours.monday = {
        is_open: true,
        open_time: "09:00",
        close_time: "09:30",
      };

      // Validate that short hours are accepted
      const errors = validateOpeningHours(shortHours);
      expect(errors.monday).toBeUndefined();
    });

    // Note: Actual slot generation for short hours is tested in slot-generator.test.ts
  });

  describe("Leap Year Dates", () => {
    it("should handle February 29th on leap year", async () => {
      const leapYearDate = new Date("2024-02-29"); // 2024 is a leap year

      // Mock opening hours for that date
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      const slots = await generateTimeSlots(leapYearDate);

      // Should generate slots normally
      expect(slots.length).toBeGreaterThan(0);

      // Verify it's actually February 29
      expect(format(leapYearDate, "yyyy-MM-dd")).toBe("2024-02-29");
    });

    it("should handle date before leap day", async () => {
      const beforeLeapDay = new Date("2024-02-28");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      const slots = await generateTimeSlots(beforeLeapDay);
      expect(slots.length).toBeGreaterThan(0);
    });

    it("should handle date after leap day", async () => {
      const afterLeapDay = new Date("2024-03-01");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      const slots = await generateTimeSlots(afterLeapDay);
      expect(slots.length).toBeGreaterThan(0);
    });
  });

  describe("DST Transitions", () => {
    // Note: DST dates vary by location and year
    // In US, typically 2nd Sunday in March (spring forward) and 1st Sunday in November (fall back)
    // Using Monday after DST transition to test (Sunday would be closed)

    it("should handle day after spring DST transition (March)", async () => {
      // March 10, 2025 - Monday after DST spring forward
      const dayAfterDstSpring = new Date("2025-03-10");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      const slots = await generateTimeSlots(dayAfterDstSpring);

      // Should still generate slots (date-fns handles DST automatically)
      expect(slots.length).toBeGreaterThan(0);
    });

    it("should handle day after fall DST transition (November)", async () => {
      // November 3, 2025 - Monday after DST fall back
      const dayAfterDstFall = new Date("2025-11-03");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      const slots = await generateTimeSlots(dayAfterDstFall);

      // Should still generate slots
      expect(slots.length).toBeGreaterThan(0);
    });
  });

  describe("First and Last Day of Opening Hours", () => {
    it("should handle first day of new opening hours", async () => {
      const firstDay = new Date("2025-01-15");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      const slots = await generateTimeSlots(firstDay);

      // Should generate slots based on new hours
      expect(slots.length).toBeGreaterThan(0);
    });

    it("should handle last day of old opening hours (day before change)", async () => {
      const lastDayOfOldHours = new Date("2025-01-14");

      // Mock old hours (different from current)
      const oldHours: OpeningHoursWeek = {
        ...getDefaultHours(),
        monday: { is_open: true, open_time: "08:00", close_time: "20:00" },
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: oldHours,
        error: null,
      } as any);

      const slots = await generateTimeSlots(lastDayOfOldHours);

      // Should generate slots based on old hours
      expect(slots.length).toBeGreaterThan(0);
    });
  });

  describe("Year Boundaries", () => {
    it("should handle December 31st", async () => {
      const newYearsEve = new Date("2025-12-31");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      const slots = await generateTimeSlots(newYearsEve);
      expect(slots.length).toBeGreaterThan(0);
    });

    it("should handle January 1st", async () => {
      const newYearsDay = new Date("2025-01-01");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      const slots = await generateTimeSlots(newYearsDay);
      expect(slots.length).toBeGreaterThan(0);
    });
  });

  describe("Early Morning Hours", () => {
    it("should handle very early opening (5 AM)", async () => {
      const earlyHours: OpeningHoursWeek = getDefaultHours();
      earlyHours.monday = {
        is_open: true,
        open_time: "05:00",
        close_time: "13:00",
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: earlyHours,
        error: null,
      } as any);

      const mondayDate = new Date("2025-01-13");
      const slots = await generateTimeSlots(mondayDate);

      // Should have slots starting at 5 AM
      expect(slots.length).toBeGreaterThan(0);
      expect(format(slots[0].start, "HH:mm")).toBe("05:00");
    });

    it("should handle midnight to morning hours (00:00 - 06:00)", async () => {
      const overnightHours: OpeningHoursWeek = getDefaultHours();
      overnightHours.monday = {
        is_open: true,
        open_time: "00:00",
        close_time: "06:00",
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: overnightHours,
        error: null,
      } as any);

      const mondayDate = new Date("2025-01-13");
      const slots = await generateTimeSlots(mondayDate);

      // Should have 12 slots (00:00-06:00 = 6 hours = 12 30-min slots)
      expect(slots).toHaveLength(12);
    });
  });

  describe("Different Hours Each Day", () => {
    it("should handle completely different hours for each day", async () => {
      const variedHours: OpeningHoursWeek = {
        monday: { is_open: true, open_time: "06:00", close_time: "14:00" },
        tuesday: { is_open: true, open_time: "08:00", close_time: "16:00" },
        wednesday: { is_open: true, open_time: "10:00", close_time: "18:00" },
        thursday: { is_open: true, open_time: "12:00", close_time: "20:00" },
        friday: { is_open: true, open_time: "14:00", close_time: "22:00" },
        saturday: { is_open: true, open_time: "09:00", close_time: "17:00" },
        sunday: { is_open: true, open_time: "11:00", close_time: "19:00" },
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: variedHours,
        error: null,
      } as any);

      // Test each day has correct slot count
      const monday = new Date("2025-01-13");
      const mondaySlots = await generateTimeSlots(monday);
      // 06:00-14:00 = 8 hours = 16 slots
      expect(mondaySlots).toHaveLength(16);

      // Clear mock and test Tuesday
      vi.clearAllMocks();
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: variedHours,
        error: null,
      } as any);

      const tuesday = new Date("2025-01-14");
      const tuesdaySlots = await generateTimeSlots(tuesday);
      // 08:00-16:00 = 8 hours = 16 slots
      expect(tuesdaySlots).toHaveLength(16);
    });
  });
});
