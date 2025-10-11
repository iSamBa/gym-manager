import { describe, it, expect } from "vitest";
import { generateTimeSlots, TIME_SLOT_CONFIG } from "../slot-generator";

describe("generateTimeSlots", () => {
  it("generates 30 slots from 09:00 to 00:00", () => {
    const slots = generateTimeSlots(new Date("2025-01-15"));

    expect(slots).toHaveLength(30);
    expect(slots[0].label).toBe("09:00 - 09:30");
    expect(slots[29].label).toBe("23:30 - 00:00");
  });

  it("each slot is 30 minutes duration", () => {
    const slots = generateTimeSlots(new Date("2025-01-15"));

    slots.forEach((slot) => {
      const duration = slot.end.getTime() - slot.start.getTime();
      expect(duration).toBe(30 * 60 * 1000); // 30 minutes in ms
    });
  });

  it("includes hour and minute fields", () => {
    const slots = generateTimeSlots(new Date("2025-01-15"));

    // First slot: 09:00
    expect(slots[0].hour).toBe(9);
    expect(slots[0].minute).toBe(0);

    // Second slot: 09:30
    expect(slots[1].hour).toBe(9);
    expect(slots[1].minute).toBe(30);

    // Last slot: 23:30
    expect(slots[29].hour).toBe(23);
    expect(slots[29].minute).toBe(30);
  });

  it("uses 24-hour format for labels", () => {
    const slots = generateTimeSlots(new Date("2025-01-15"));

    // Morning slot
    expect(slots[0].label).toBe("09:00 - 09:30");

    // Afternoon slot (13:00 = 1 PM)
    const afternoonSlot = slots.find((s) => s.hour === 13 && s.minute === 0);
    expect(afternoonSlot?.label).toBe("13:00 - 13:30");

    // Evening slot (20:00 = 8 PM)
    const eveningSlot = slots.find((s) => s.hour === 20 && s.minute === 0);
    expect(eveningSlot?.label).toBe("20:00 - 20:30");
  });

  it("respects TIME_SLOT_CONFIG constants", () => {
    const slots = generateTimeSlots(new Date("2025-01-15"));

    // First slot starts at START_HOUR
    expect(slots[0].hour).toBe(TIME_SLOT_CONFIG.START_HOUR);

    // Last slot ends at END_HOUR (midnight = hour 0)
    const lastSlot = slots[slots.length - 1];
    expect(lastSlot.end.getHours()).toBe(0); // Midnight is hour 0
    expect(lastSlot.end.getMinutes()).toBe(0);

    // Each slot duration matches config
    slots.forEach((slot) => {
      const duration =
        (slot.end.getTime() - slot.start.getTime()) / (60 * 1000);
      expect(duration).toBe(TIME_SLOT_CONFIG.SLOT_DURATION_MINUTES);
    });
  });

  it("generates slots for the correct date", () => {
    const testDate = new Date("2025-06-15");
    const slots = generateTimeSlots(testDate);

    // All slots should be on the same date
    slots.forEach((slot) => {
      expect(slot.start.getFullYear()).toBe(2025);
      expect(slot.start.getMonth()).toBe(5); // June (0-indexed)
      expect(slot.start.getDate()).toBe(15);
    });
  });

  it("generates consistent slots across multiple calls", () => {
    const date = new Date("2025-03-10");
    const slots1 = generateTimeSlots(date);
    const slots2 = generateTimeSlots(date);

    expect(slots1.length).toBe(slots2.length);

    slots1.forEach((slot, index) => {
      expect(slot.label).toBe(slots2[index].label);
      expect(slot.hour).toBe(slots2[index].hour);
      expect(slot.minute).toBe(slots2[index].minute);
    });
  });
});
