import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useConflictDetection } from "../use-conflict-detection";
import type { OpeningHoursWeek } from "../../lib/types";
import React from "react";

// Mock Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("useConflictDetection", () => {
  let queryClient: QueryClient;
  let mockSupabase: any;

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      gte: vi.fn(() => mockSupabase),
      neq: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
    };

    // Setup the mock for the supabase export
    const supabaseMock = await import("@/lib/supabase");
    vi.mocked(supabaseMock.supabase.from).mockImplementation(
      () => mockSupabase
    );
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const defaultHours: OpeningHoursWeek = {
    monday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    wednesday: { is_open: false, open_time: null, close_time: null },
    thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    saturday: { is_open: true, open_time: "10:00", close_time: "16:00" },
    sunday: { is_open: false, open_time: null, close_time: null },
  };

  it("should not run query when enabled is false", async () => {
    const effectiveDate = new Date("2025-10-20");

    const { result } = renderHook(
      () => useConflictDetection(defaultHours, effectiveDate, false),
      { wrapper }
    );

    expect(result.current.isFetching).toBe(false);

    // Import to check the mock
    const supabaseMock = await import("@/lib/supabase");
    expect(supabaseMock.supabase.from).not.toHaveBeenCalled();
  });

  it("should detect sessions outside new opening hours", async () => {
    const effectiveDate = new Date("2025-10-20");

    // Mock session that ends after closing time
    const mockSessions = [
      {
        id: "session-1",
        scheduled_start: "2025-10-20T21:00:00", // Monday 21:00
        scheduled_end: "2025-10-20T21:30:00", // Monday 21:30 (after 21:00 close)
        machines: { machine_number: 1 },
        training_session_members: [
          { member: { first_name: "John", last_name: "Doe" } },
        ],
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockSessions,
      error: null,
    });

    const { result } = renderHook(
      () => useConflictDetection(defaultHours, effectiveDate, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]).toMatchObject({
      session_id: "session-1",
      member_name: "John Doe",
      machine_number: 1,
      reason: expect.stringContaining("Outside new hours"),
    });
  });

  it("should detect sessions on closed days", async () => {
    const effectiveDate = new Date("2025-10-20");

    // Mock session on Wednesday (closed day)
    const mockSessions = [
      {
        id: "session-2",
        scheduled_start: "2025-10-22T10:00:00", // Wednesday 10:00
        scheduled_end: "2025-10-22T10:30:00",
        machines: { machine_number: 2 },
        training_session_members: [
          { member: { first_name: "Jane", last_name: "Smith" } },
        ],
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockSessions,
      error: null,
    });

    const { result } = renderHook(
      () => useConflictDetection(defaultHours, effectiveDate, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]).toMatchObject({
      session_id: "session-2",
      reason: "Studio closed on this day",
    });
  });

  it("should return empty array when no conflicts exist", async () => {
    const effectiveDate = new Date("2025-10-20");

    // Mock session within opening hours
    const mockSessions = [
      {
        id: "session-3",
        scheduled_start: "2025-10-20T10:00:00", // Monday 10:00
        scheduled_end: "2025-10-20T10:30:00", // Monday 10:30 (within 09:00-21:00)
        machines: { machine_number: 1 },
        training_session_members: [
          { member: { first_name: "John", last_name: "Doe" } },
        ],
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockSessions,
      error: null,
    });

    const { result } = renderHook(
      () => useConflictDetection(defaultHours, effectiveDate, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(0);
  });

  it("should handle sessions with no members (unbooked)", async () => {
    const effectiveDate = new Date("2025-10-20");

    const mockSessions = [
      {
        id: "session-4",
        scheduled_start: "2025-10-20T22:00:00", // After close time
        scheduled_end: "2025-10-20T22:30:00",
        machines: { machine_number: 3 },
        training_session_members: [], // No members
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockSessions,
      error: null,
    });

    const { result } = renderHook(
      () => useConflictDetection(defaultHours, effectiveDate, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].member_name).toBeNull();
  });

  it("should detect multiple conflicts across different days", async () => {
    const effectiveDate = new Date("2025-10-20");

    const mockSessions = [
      {
        id: "session-5",
        scheduled_start: "2025-10-20T21:30:00", // Monday 21:30 - outside hours (closes 21:00)
        scheduled_end: "2025-10-20T22:00:00",
        machines: { machine_number: 1 },
        training_session_members: [
          { member: { first_name: "Alice", last_name: "Johnson" } },
        ],
      },
      {
        id: "session-6",
        scheduled_start: "2025-10-22T10:00:00", // Wednesday - closed
        scheduled_end: "2025-10-22T10:30:00",
        machines: { machine_number: 2 },
        training_session_members: [
          { member: { first_name: "Bob", last_name: "Wilson" } },
        ],
      },
      {
        id: "session-7",
        scheduled_start: "2025-10-25T08:00:00", // Saturday - before opening (10:00)
        scheduled_end: "2025-10-25T08:30:00",
        machines: { machine_number: 3 },
        training_session_members: [
          { member: { first_name: "Carol", last_name: "Brown" } },
        ],
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockSessions,
      error: null,
    });

    const { result } = renderHook(
      () => useConflictDetection(defaultHours, effectiveDate, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
  });

  it("should handle sessions that start before opening time", async () => {
    const effectiveDate = new Date("2025-10-20");

    const mockSessions = [
      {
        id: "session-8",
        scheduled_start: "2025-10-20T08:00:00", // Monday 08:00 (before 09:00)
        scheduled_end: "2025-10-20T08:30:00",
        machines: { machine_number: 1 },
        training_session_members: [],
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockSessions,
      error: null,
    });

    const { result } = renderHook(
      () => useConflictDetection(defaultHours, effectiveDate, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].reason).toContain("Outside new hours");
  });

  it("should handle edge case: session exactly at opening time", async () => {
    const effectiveDate = new Date("2025-10-20");

    const mockSessions = [
      {
        id: "session-9",
        scheduled_start: "2025-10-20T09:00:00", // Exactly at opening
        scheduled_end: "2025-10-20T09:30:00",
        machines: { machine_number: 1 },
        training_session_members: [],
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockSessions,
      error: null,
    });

    const { result } = renderHook(
      () => useConflictDetection(defaultHours, effectiveDate, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(0); // Should NOT conflict
  });

  it("should handle edge case: session exactly at closing time", async () => {
    const effectiveDate = new Date("2025-10-20");

    const mockSessions = [
      {
        id: "session-10",
        scheduled_start: "2025-10-20T20:30:00",
        scheduled_end: "2025-10-20T21:00:00", // Exactly at closing
        machines: { machine_number: 1 },
        training_session_members: [],
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockSessions,
      error: null,
    });

    const { result } = renderHook(
      () => useConflictDetection(defaultHours, effectiveDate, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(0); // Should NOT conflict
  });

  it("should throw error when database query fails", async () => {
    const effectiveDate = new Date("2025-10-20");

    mockSupabase.order.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const { result } = renderHook(
      () => useConflictDetection(defaultHours, effectiveDate, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("should format dates correctly in conflict objects", async () => {
    const effectiveDate = new Date("2025-10-20");

    const mockSessions = [
      {
        id: "session-11",
        scheduled_start: "2025-10-23T21:30:00", // Thursday 21:30 - after close (21:00)
        scheduled_end: "2025-10-23T22:00:00",
        machines: { machine_number: 1 },
        training_session_members: [],
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockSessions,
      error: null,
    });

    const { result } = renderHook(
      () => useConflictDetection(defaultHours, effectiveDate, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1); // Should detect conflict
    expect(result.current.data?.[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    expect(result.current.data?.[0].start_time).toContain("T"); // ISO format
  });

  it("should handle empty sessions array", async () => {
    const effectiveDate = new Date("2025-10-20");

    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
    });

    const { result } = renderHook(
      () => useConflictDetection(defaultHours, effectiveDate, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(0);
  });
});
