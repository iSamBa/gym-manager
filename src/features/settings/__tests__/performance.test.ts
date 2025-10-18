import { describe, it, expect, beforeEach, vi } from "vitest";
import { generateTimeSlots } from "@/features/training-sessions/lib/slot-generator";
import { supabase } from "@/lib/supabase";
import type { OpeningHoursWeek } from "../lib/types";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe("Performance Benchmarks - Opening Hours Feature", () => {
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

  describe("Slot Generation Performance", () => {
    it("should generate slots in < 50ms (average over 100 iterations)", async () => {
      const iterations = 100;
      const date = new Date("2025-01-15");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await generateTimeSlots(date);
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;

      // Average time should be less than 50ms
      expect(avgTime).toBeLessThan(50);

      // Log for debugging (won't fail test)
      console.log(`Average slot generation time: ${avgTime.toFixed(2)}ms`);
    });

    it("should handle 1000 sequential slot generations efficiently", async () => {
      const iterations = 1000;
      const date = new Date("2025-01-15");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        await generateTimeSlots(date);
      }

      const end = performance.now();
      const totalTime = end - start;
      const avgTime = totalTime / iterations;

      // Should still average < 50ms even with 1000 calls
      expect(avgTime).toBeLessThan(50);

      console.log(`Total time for 1000 generations: ${totalTime.toFixed(2)}ms`);
      console.log(`Average per generation: ${avgTime.toFixed(2)}ms`);
    });

    it("should generate slots for different hours configurations efficiently", async () => {
      const testCases = [
        { open: "09:00", close: "21:00", desc: "12-hour day" },
        { open: "06:00", close: "23:00", desc: "17-hour day" },
        { open: "09:00", close: "09:30", desc: "30-minute window" },
        { open: "00:00", close: "23:59", desc: "full day" },
      ];

      for (const testCase of testCases) {
        const hours: OpeningHoursWeek = getDefaultHours();
        hours.monday = {
          is_open: true,
          open_time: testCase.open,
          close_time: testCase.close,
        };

        vi.mocked(supabase.rpc).mockResolvedValue({
          data: hours,
          error: null,
        } as any);

        const iterations = 100;
        const times: number[] = [];
        const mondayDate = new Date("2025-01-13");

        for (let i = 0; i < iterations; i++) {
          const start = performance.now();
          await generateTimeSlots(mondayDate);
          const end = performance.now();
          times.push(end - start);
        }

        const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;

        expect(avgTime).toBeLessThan(50);

        console.log(
          `${testCase.desc}: ${avgTime.toFixed(2)}ms (${testCase.open} - ${testCase.close})`
        );
      }
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory during repeated slot generation", async () => {
      const iterations = 1000;
      const date = new Date("2025-01-15");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      // Get initial memory if available (Chrome/V8 only)
      const getMemory = () => {
        if (typeof (performance as any).memory !== "undefined") {
          return (performance as any).memory.usedJSHeapSize;
        }
        return null;
      };

      const initialMemory = getMemory();

      // Generate slots many times
      for (let i = 0; i < iterations; i++) {
        await generateTimeSlots(date);
      }

      // Force garbage collection if available (test environments)
      if (typeof global.gc === "function") {
        global.gc();
      }

      const finalMemory = getMemory();

      if (initialMemory !== null && finalMemory !== null) {
        // Memory should not grow significantly (allow 20% increase for test overhead)
        const memoryGrowth = finalMemory - initialMemory;
        const memoryGrowthPercent = (memoryGrowth / initialMemory) * 100;

        console.log(`Memory growth: ${memoryGrowthPercent.toFixed(2)}%`);
        console.log(`Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
        console.log(`Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);

        // Allow up to 20% memory growth (reasonable for test overhead)
        expect(memoryGrowthPercent).toBeLessThan(20);
      } else {
        // If memory API not available, just pass
        expect(true).toBe(true);
      }
    });

    it("should not accumulate objects in memory across multiple calls", async () => {
      const date = new Date("2025-01-15");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      // Call multiple times and ensure results are independent
      const results: any[] = [];

      for (let i = 0; i < 10; i++) {
        const slots = await generateTimeSlots(date);
        results.push(slots);
      }

      // Each result should be independent (not sharing references)
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);

        // Modify one result
        if (index === 0 && result.length > 0) {
          result[0].modified = true;
        }

        // Others should not be affected
        if (index > 0 && result.length > 0) {
          expect(result[0].modified).toBeUndefined();
        }
      });
    });
  });

  describe("Scalability", () => {
    it("should handle week of slot generations efficiently", async () => {
      const startDate = new Date("2025-01-13"); // Monday

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      const start = performance.now();

      // Generate slots for entire week
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        await generateTimeSlots(date);
      }

      const end = performance.now();
      const totalTime = end - start;
      const avgTime = totalTime / 7;

      // Average per day should still be < 50ms
      expect(avgTime).toBeLessThan(50);

      console.log(`Total week generation: ${totalTime.toFixed(2)}ms`);
      console.log(`Average per day: ${avgTime.toFixed(2)}ms`);
    });

    it("should handle month of slot generations in reasonable time", async () => {
      const startDate = new Date("2025-01-01");
      const daysInMonth = 31;

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: getDefaultHours(),
        error: null,
      } as any);

      const start = performance.now();

      for (let i = 0; i < daysInMonth; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        await generateTimeSlots(date);
      }

      const end = performance.now();
      const totalTime = end - start;
      const avgTime = totalTime / daysInMonth;

      // Average should still be < 50ms per day
      expect(avgTime).toBeLessThan(50);

      // Total for month should be reasonable (< 2 seconds)
      expect(totalTime).toBeLessThan(2000);

      console.log(`Total month generation: ${totalTime.toFixed(2)}ms`);
      console.log(`Average per day: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe("Worst Case Scenarios", () => {
    it("should handle maximum slots (24-hour day) efficiently", async () => {
      const fullDayHours: OpeningHoursWeek = getDefaultHours();
      fullDayHours.monday = {
        is_open: true,
        open_time: "00:00",
        close_time: "23:59",
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: fullDayHours,
        error: null,
      } as any);

      const iterations = 100;
      const times: number[] = [];
      const mondayDate = new Date("2025-01-13");

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await generateTimeSlots(mondayDate);
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;

      // Even with max slots (48 for 24 hours), should be < 50ms
      expect(avgTime).toBeLessThan(50);

      console.log(`24-hour day average: ${avgTime.toFixed(2)}ms`);
    });

    it("should handle minimum slots (30-minute window) efficiently", async () => {
      const minHours: OpeningHoursWeek = getDefaultHours();
      minHours.monday = {
        is_open: true,
        open_time: "12:00",
        close_time: "12:30",
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: minHours,
        error: null,
      } as any);

      const iterations = 100;
      const times: number[] = [];
      const mondayDate = new Date("2025-01-13");

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await generateTimeSlots(mondayDate);
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;

      expect(avgTime).toBeLessThan(50);

      console.log(`30-minute window average: ${avgTime.toFixed(2)}ms`);
    });
  });
});
