import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateTimeSlots, getTimeSlotConfig } from "../slot-generator";

// Mock Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import { supabase } from "@/lib/supabase";

describe("getTimeSlotConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns configuration from database when settings exist", async () => {
    // Mock database response for Monday with 10:00-18:00 hours
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        monday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      },
      error: null,
    } as any);

    const config = await getTimeSlotConfig(
      new Date("2025-01-13T00:00:00") // Monday
    );

    expect(config).toEqual({
      START_HOUR: 10,
      END_HOUR: 18,
      SLOT_DURATION_MINUTES: 30,
    });
  });

  it("returns null when day is closed", async () => {
    // Mock database response for closed Sunday
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        sunday: { is_open: false, open_time: null, close_time: null },
      },
      error: null,
    } as any);

    const config = await getTimeSlotConfig(
      new Date("2025-01-12T00:00:00") // Sunday
    );

    expect(config).toBeNull();
  });

  it("returns default configuration when no settings exist", async () => {
    // Mock database response with no data
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: null,
    } as any);

    const config = await getTimeSlotConfig(new Date("2025-01-15"));

    expect(config).toEqual({
      START_HOUR: 9,
      END_HOUR: 24,
      SLOT_DURATION_MINUTES: 30,
    });
  });

  it("returns default configuration on database error", async () => {
    // Mock database error
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: "Database error" },
    } as any);

    const config = await getTimeSlotConfig(new Date("2025-01-15"));

    expect(config).toEqual({
      START_HOUR: 9,
      END_HOUR: 24,
      SLOT_DURATION_MINUTES: 30,
    });
  });

  it("handles different days of week correctly", async () => {
    // Mock Tuesday with different hours
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        tuesday: { is_open: true, open_time: "08:00", close_time: "20:00" },
      },
      error: null,
    } as any);

    const config = await getTimeSlotConfig(
      new Date("2025-01-14T00:00:00") // Tuesday
    );

    expect(config).toEqual({
      START_HOUR: 8,
      END_HOUR: 20,
      SLOT_DURATION_MINUTES: 30,
    });
  });
});

describe("generateTimeSlots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates slots based on database opening hours", async () => {
    // Mock database response for 10:00-12:00 (2 hours = 4 slots)
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        monday: { is_open: true, open_time: "10:00", close_time: "12:00" },
      },
      error: null,
    } as any);

    const slots = await generateTimeSlots(
      new Date("2025-01-13T00:00:00") // Monday
    );

    expect(slots).toHaveLength(4);
    expect(slots[0].label).toBe("10:00 - 10:30");
    expect(slots[1].label).toBe("10:30 - 11:00");
    expect(slots[2].label).toBe("11:00 - 11:30");
    expect(slots[3].label).toBe("11:30 - 12:00");
  });

  it("returns empty array for closed days", async () => {
    // Mock closed day
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        sunday: { is_open: false, open_time: null, close_time: null },
      },
      error: null,
    } as any);

    const slots = await generateTimeSlots(
      new Date("2025-01-12T00:00:00") // Sunday
    );

    expect(slots).toHaveLength(0);
  });

  it("generates default 30 slots when no settings exist", async () => {
    // Mock no settings (fallback to defaults: 9:00-24:00)
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: null,
    } as any);

    const slots = await generateTimeSlots(new Date("2025-01-15"));

    expect(slots).toHaveLength(30);
    expect(slots[0].label).toBe("09:00 - 09:30");
    expect(slots[29].label).toBe("23:30 - 00:00");
  });

  it("each slot is 30 minutes duration", async () => {
    // Mock database response
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        wednesday: { is_open: true, open_time: "09:00", close_time: "11:00" },
      },
      error: null,
    } as any);

    const slots = await generateTimeSlots(
      new Date("2025-01-15T00:00:00") // Wednesday
    );

    slots.forEach((slot) => {
      const duration = slot.end.getTime() - slot.start.getTime();
      expect(duration).toBe(30 * 60 * 1000); // 30 minutes in ms
    });
  });

  it("includes hour and minute fields", async () => {
    // Mock database response
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        thursday: { is_open: true, open_time: "09:00", close_time: "10:00" },
      },
      error: null,
    } as any);

    const slots = await generateTimeSlots(
      new Date("2025-01-16T00:00:00") // Thursday
    );

    // First slot: 09:00
    expect(slots[0].hour).toBe(9);
    expect(slots[0].minute).toBe(0);

    // Second slot: 09:30
    expect(slots[1].hour).toBe(9);
    expect(slots[1].minute).toBe(30);
  });

  it("uses 24-hour format for labels", async () => {
    // Mock database response with afternoon hours
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        friday: { is_open: true, open_time: "13:00", close_time: "15:00" },
      },
      error: null,
    } as any);

    const slots = await generateTimeSlots(
      new Date("2025-01-17T00:00:00") // Friday
    );

    // Afternoon slot (13:00 = 1 PM)
    expect(slots[0].label).toBe("13:00 - 13:30");
    expect(slots[1].label).toBe("13:30 - 14:00");
  });

  it("generates slots for the correct date", async () => {
    // Mock database response
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        monday: { is_open: true, open_time: "09:00", close_time: "10:00" },
      },
      error: null,
    } as any);

    const testDate = new Date("2025-06-16T00:00:00"); // Monday
    const slots = await generateTimeSlots(testDate);

    // All slots should be on the same date
    slots.forEach((slot) => {
      expect(slot.start.getFullYear()).toBe(2025);
      expect(slot.start.getMonth()).toBe(5); // June (0-indexed)
      expect(slot.start.getDate()).toBe(16);
    });
  });

  it("handles effective date logic (returns different hours for different dates)", async () => {
    // First call: Old hours before effective date
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        monday: { is_open: true, open_time: "09:00", close_time: "17:00" },
      },
      error: null,
    } as any);

    const slotsOld = await generateTimeSlots(
      new Date("2025-01-13T00:00:00") // Monday before change
    );

    expect(slotsOld).toHaveLength(16); // 9:00-17:00 = 8 hours = 16 slots

    // Second call: New hours after effective date
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        monday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      },
      error: null,
    } as any);

    const slotsNew = await generateTimeSlots(
      new Date("2025-01-20T00:00:00") // Monday after change
    );

    expect(slotsNew).toHaveLength(16); // 10:00-18:00 = 8 hours = 16 slots
    expect(slotsNew[0].label).toBe("10:00 - 10:30");
  });

  it("handles database errors gracefully with fallback", async () => {
    // Mock database error
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: "Connection error" },
    } as any);

    const slots = await generateTimeSlots(new Date("2025-01-15"));

    // Should fallback to default hours (9:00-24:00)
    expect(slots).toHaveLength(30);
    expect(slots[0].label).toBe("09:00 - 09:30");
  });
});
