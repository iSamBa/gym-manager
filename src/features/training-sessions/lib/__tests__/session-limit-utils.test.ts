import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getWeekRange,
  checkStudioSessionLimit,
  getCapacityColorScheme,
} from "../session-limit-utils";

// Mock Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe("getWeekRange", () => {
  it("should return correct Monday-Sunday for a weekday (Thursday)", () => {
    // Thursday, October 18, 2025
    const thursday = new Date(2025, 9, 18); // Month is 0-indexed
    const result = getWeekRange(thursday);

    // Monday Oct 13 - Sunday Oct 19
    expect(result.start).toBe("2025-10-13");
    expect(result.end).toBe("2025-10-19");
  });

  it("should return correct Monday-Sunday when input is Monday", () => {
    // Monday, October 13, 2025
    const monday = new Date(2025, 9, 13);
    const result = getWeekRange(monday);

    // Same week: Monday Oct 13 - Sunday Oct 19
    expect(result.start).toBe("2025-10-13");
    expect(result.end).toBe("2025-10-19");
  });

  it("should handle Sunday correctly (end of week, not start)", () => {
    // Sunday, October 19, 2025
    const sunday = new Date(2025, 9, 19);
    const result = getWeekRange(sunday);

    // Sunday belongs to previous week: Monday Oct 13 - Sunday Oct 19
    expect(result.start).toBe("2025-10-13");
    expect(result.end).toBe("2025-10-19");
  });

  it("should handle year boundaries correctly (Dec 31 is Tuesday)", () => {
    // Tuesday, December 31, 2024
    const newYearsEve = new Date(2024, 11, 31);
    const result = getWeekRange(newYearsEve);

    // Monday Dec 30, 2024 - Sunday Jan 5, 2025
    expect(result.start).toBe("2024-12-30");
    expect(result.end).toBe("2025-01-05");
  });

  it("should handle year boundaries when Monday is in previous year", () => {
    // Thursday, January 2, 2025
    const jan2 = new Date(2025, 0, 2);
    const result = getWeekRange(jan2);

    // Monday Dec 30, 2024 - Sunday Jan 5, 2025
    expect(result.start).toBe("2024-12-30");
    expect(result.end).toBe("2025-01-05");
  });
});

describe("checkStudioSessionLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct session limit data", async () => {
    const mockData = [
      {
        current_count: 237,
        max_allowed: 250,
        can_book: true,
        percentage: 94,
      },
    ];

    const { supabase } = await import("@/lib/supabase");
    const mockRpc = vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockData,
      error: null,
    } as any);

    const result = await checkStudioSessionLimit(new Date(2025, 9, 18));

    expect(result).toEqual({
      current_count: 237,
      max_allowed: 250,
      can_book: true,
      percentage: 94,
    });

    expect(mockRpc).toHaveBeenCalledWith("check_studio_session_limit", {
      p_week_start: "2025-10-13",
      p_week_end: "2025-10-19",
    });
  });

  it("should indicate cannot book when limit reached", async () => {
    const mockData = [
      {
        current_count: 250,
        max_allowed: 250,
        can_book: false,
        percentage: 100,
      },
    ];

    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockData,
      error: null,
    } as any);

    const result = await checkStudioSessionLimit(new Date(2025, 9, 18));

    expect(result.can_book).toBe(false);
    expect(result.current_count).toBe(250);
    expect(result.max_allowed).toBe(250);
    expect(result.percentage).toBe(100);
  });

  it("should return default values when no data returned", async () => {
    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [],
      error: null,
    } as any);

    const result = await checkStudioSessionLimit(new Date(2025, 9, 18));

    expect(result).toEqual({
      current_count: 0,
      max_allowed: 0,
      can_book: false,
      percentage: 0,
    });
  });

  it("should throw error when database query fails", async () => {
    const mockError = new Error("Database connection failed");

    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: mockError,
    } as any);

    await expect(
      checkStudioSessionLimit(new Date(2025, 9, 18))
    ).rejects.toThrow("Database connection failed");
  });
});

describe("getCapacityColorScheme", () => {
  it("should return green for 0-79% capacity", () => {
    expect(getCapacityColorScheme(0)).toEqual({
      text: "text-green-600",
      bg: "bg-green-100",
      border: "border-green-300",
      variant: "default",
    });

    expect(getCapacityColorScheme(50)).toEqual({
      text: "text-green-600",
      bg: "bg-green-100",
      border: "border-green-300",
      variant: "default",
    });

    expect(getCapacityColorScheme(79)).toEqual({
      text: "text-green-600",
      bg: "bg-green-100",
      border: "border-green-300",
      variant: "default",
    });
  });

  it("should return yellow for 80-94% capacity", () => {
    expect(getCapacityColorScheme(80)).toEqual({
      text: "text-yellow-600",
      bg: "bg-yellow-100",
      border: "border-yellow-300",
      variant: "warning",
    });

    expect(getCapacityColorScheme(90)).toEqual({
      text: "text-yellow-600",
      bg: "bg-yellow-100",
      border: "border-yellow-300",
      variant: "warning",
    });

    expect(getCapacityColorScheme(94)).toEqual({
      text: "text-yellow-600",
      bg: "bg-yellow-100",
      border: "border-yellow-300",
      variant: "warning",
    });
  });

  it("should return red for 95-100% capacity", () => {
    expect(getCapacityColorScheme(95)).toEqual({
      text: "text-red-600",
      bg: "bg-red-100",
      border: "border-red-300",
      variant: "error",
    });

    expect(getCapacityColorScheme(99)).toEqual({
      text: "text-red-600",
      bg: "bg-red-100",
      border: "border-red-300",
      variant: "error",
    });

    expect(getCapacityColorScheme(100)).toEqual({
      text: "text-red-600",
      bg: "bg-red-100",
      border: "border-red-300",
      variant: "error",
    });
  });

  it("should handle edge cases at boundary percentages", () => {
    // Just below yellow threshold
    expect(getCapacityColorScheme(79.9).variant).toBe("default");

    // At yellow threshold
    expect(getCapacityColorScheme(80).variant).toBe("warning");

    // Just below red threshold
    expect(getCapacityColorScheme(94.9).variant).toBe("warning");

    // At red threshold
    expect(getCapacityColorScheme(95).variant).toBe("error");
  });
});
