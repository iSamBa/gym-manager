import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getWeekRange,
  checkMemberWeeklyLimit,
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
  it("should return correct Sunday-Saturday for a weekday (Thursday)", () => {
    // Thursday, October 16, 2025
    const thursday = new Date(2025, 9, 16); // Month is 0-indexed
    const result = getWeekRange(thursday);

    // Week: Sunday Oct 12 - Saturday Oct 18
    expect(result.start).toBeInstanceOf(Date);
    expect(result.end).toBeInstanceOf(Date);
    expect(result.start.getFullYear()).toBe(2025);
    expect(result.start.getMonth()).toBe(9); // October
    expect(result.start.getDate()).toBe(12); // Sunday
    expect(result.end.getFullYear()).toBe(2025);
    expect(result.end.getMonth()).toBe(9); // October
    expect(result.end.getDate()).toBe(18); // Saturday
  });

  it("should return correct Sunday-Saturday when input is Sunday", () => {
    // Sunday, October 12, 2025
    const sunday = new Date(2025, 9, 12);
    const result = getWeekRange(sunday);

    // Same week: Sunday Oct 12 - Saturday Oct 18
    expect(result.start.getDate()).toBe(12); // Sunday
    expect(result.end.getDate()).toBe(18); // Saturday
  });

  it("should handle Saturday correctly (end of week)", () => {
    // Saturday, October 18, 2025
    const saturday = new Date(2025, 9, 18);
    const result = getWeekRange(saturday);

    // Same week: Sunday Oct 12 - Saturday Oct 18
    expect(result.start.getDate()).toBe(12); // Sunday
    expect(result.end.getDate()).toBe(18); // Saturday
  });

  it("should handle year boundaries correctly (Dec 31 is Wednesday)", () => {
    // Wednesday, December 31, 2025
    const newYearsEve = new Date(2025, 11, 31);
    const result = getWeekRange(newYearsEve);

    // Sunday Dec 28, 2025 - Saturday Jan 3, 2026
    expect(result.start.getFullYear()).toBe(2025);
    expect(result.start.getMonth()).toBe(11); // December
    expect(result.start.getDate()).toBe(28); // Sunday
    expect(result.end.getFullYear()).toBe(2026);
    expect(result.end.getMonth()).toBe(0); // January
    expect(result.end.getDate()).toBe(3); // Saturday
  });

  it("should handle year boundaries when Sunday is in previous year", () => {
    // Thursday, January 2, 2025
    const jan2 = new Date(2025, 0, 2);
    const result = getWeekRange(jan2);

    // Sunday Dec 29, 2024 - Saturday Jan 4, 2025
    expect(result.start.getFullYear()).toBe(2024);
    expect(result.start.getMonth()).toBe(11); // December
    expect(result.start.getDate()).toBe(29); // Sunday
    expect(result.end.getFullYear()).toBe(2025);
    expect(result.end.getMonth()).toBe(0); // January
    expect(result.end.getDate()).toBe(4); // Saturday
  });

  it("should set start to midnight and end to 23:59:59", () => {
    const date = new Date(2025, 9, 16, 14, 30, 45, 500); // Thursday 2:30 PM
    const result = getWeekRange(date);

    // Start should be midnight
    expect(result.start.getHours()).toBe(0);
    expect(result.start.getMinutes()).toBe(0);
    expect(result.start.getSeconds()).toBe(0);
    expect(result.start.getMilliseconds()).toBe(0);

    // End should be 23:59:59.999
    expect(result.end.getHours()).toBe(23);
    expect(result.end.getMinutes()).toBe(59);
    expect(result.end.getSeconds()).toBe(59);
    expect(result.end.getMilliseconds()).toBe(999);
  });
});

describe("checkMemberWeeklyLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow booking when member has no sessions this week", async () => {
    const mockResult = {
      can_book: true,
      current_member_sessions: 0,
      max_allowed: 1,
      message: "Booking allowed",
    };

    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    const result = await checkMemberWeeklyLimit(
      "member-uuid-123",
      new Date(2025, 9, 16),
      "member"
    );

    expect(result.can_book).toBe(true);
    expect(result.current_member_sessions).toBe(0);
    expect(supabase.rpc).toHaveBeenCalledWith(
      "check_member_weekly_session_limit",
      expect.objectContaining({
        p_member_id: "member-uuid-123",
        p_session_type: "member",
      })
    );
  });

  it("should block booking when member already has 1 member session this week", async () => {
    const mockResult = {
      can_book: false,
      current_member_sessions: 1,
      max_allowed: 1,
      message:
        "Member already has 1 member session booked this week. Please use the 'Makeup' session type for additional sessions.",
    };

    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    const result = await checkMemberWeeklyLimit(
      "member-uuid-123",
      new Date(2025, 9, 16),
      "member"
    );

    expect(result.can_book).toBe(false);
    expect(result.current_member_sessions).toBe(1);
    expect(result.message).toContain(
      "Member already has 1 member session booked this week"
    );
  });

  it("should correctly calculate week range (Sunday to Saturday)", async () => {
    const mockResult = {
      can_book: true,
      current_member_sessions: 0,
      max_allowed: 1,
      message: "Booking allowed",
    };

    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Thursday, October 16, 2025
    await checkMemberWeeklyLimit(
      "member-uuid-123",
      new Date(2025, 9, 16),
      "member"
    );

    expect(supabase.rpc).toHaveBeenCalledWith(
      "check_member_weekly_session_limit",
      expect.objectContaining({
        p_week_start: "2025-10-12", // Sunday
        p_week_end: "2025-10-18", // Saturday
      })
    );
  });

  it("should throw error when database query fails", async () => {
    const mockError = new Error("Database connection failed");

    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: mockError,
    } as any);

    await expect(
      checkMemberWeeklyLimit("member-uuid-123", new Date(2025, 9, 16), "member")
    ).rejects.toThrow(
      "Failed to check weekly limit: Database connection failed"
    );
  });

  it("should handle cancelled sessions correctly (RPC returns can_book: true)", async () => {
    // RPC function excludes cancelled sessions, so result shows 0 sessions
    const mockResult = {
      can_book: true,
      current_member_sessions: 0,
      max_allowed: 1,
      message: "Booking allowed",
    };

    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    const result = await checkMemberWeeklyLimit(
      "member-uuid-123",
      new Date(2025, 9, 16),
      "member"
    );

    expect(result.can_book).toBe(true);
    expect(result.current_member_sessions).toBe(0);
  });

  it("should use default session type 'member' when not specified", async () => {
    const mockResult = {
      can_book: true,
      current_member_sessions: 0,
      max_allowed: 1,
      message: "Booking allowed",
    };

    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Call without session type parameter
    await checkMemberWeeklyLimit("member-uuid-123", new Date(2025, 9, 16));

    expect(supabase.rpc).toHaveBeenCalledWith(
      "check_member_weekly_session_limit",
      expect.objectContaining({
        p_session_type: "member",
      })
    );
  });

  it("should return null when RPC returns null data with no error", async () => {
    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: null,
    } as any);

    const result = await checkMemberWeeklyLimit(
      "member-uuid-123",
      new Date(2025, 9, 16),
      "member"
    );

    expect(result).toBeNull();
  });

  it("should correctly handle dates at exact midnight boundaries", async () => {
    const mockResult = {
      can_book: true,
      current_member_sessions: 0,
      max_allowed: 1,
      message: "Booking allowed",
    };

    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Test with date at exactly midnight
    const midnightDate = new Date(2025, 9, 16, 0, 0, 0, 0);
    await checkMemberWeeklyLimit("member-uuid-123", midnightDate, "member");

    expect(supabase.rpc).toHaveBeenCalledWith(
      "check_member_weekly_session_limit",
      expect.objectContaining({
        p_week_start: "2025-10-12", // Sunday
        p_week_end: "2025-10-18", // Saturday
      })
    );
  });

  it("should handle sessions for different session types correctly", async () => {
    const mockResult = {
      can_book: true,
      current_member_sessions: 0,
      max_allowed: 1,
      message: "Booking allowed",
    };

    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Test with makeup session type
    await checkMemberWeeklyLimit(
      "member-uuid-123",
      new Date(2025, 9, 16),
      "makeup"
    );

    expect(supabase.rpc).toHaveBeenCalledWith(
      "check_member_weekly_session_limit",
      expect.objectContaining({
        p_session_type: "makeup",
      })
    );
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
      p_week_start: "2025-10-12",
      p_week_end: "2025-10-18",
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
