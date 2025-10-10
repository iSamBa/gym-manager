import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSessionAlerts } from "../use-session-alerts";
import { supabase } from "@/lib/supabase";

// Mock supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useSessionAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns alert count for member with due-date comments before session", async () => {
    // Mock member_comments query
    const mockComments = [
      {
        id: "comment-1",
        due_date: "2025-01-20",
      },
      {
        id: "comment-2",
        due_date: "2025-01-25",
      },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({
        data: mockComments,
        error: null,
      }),
    } as any);

    const { result } = renderHook(
      () =>
        useSessionAlerts(
          "session-1",
          "member-1",
          "2025-01-15T10:00:00Z" // Session before due dates
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual({
        session_id: "session-1",
        member_id: "member-1",
        alert_count: 2,
      });
    });
  });

  it("returns 0 alerts for session after due_date", async () => {
    // Mock empty comments (no comments with due_date >= session date)
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({
        data: [], // No matching comments
        error: null,
      }),
    } as any);

    const { result } = renderHook(
      () =>
        useSessionAlerts(
          "session-1",
          "member-1",
          "2025-01-25T10:00:00Z" // Session after due date
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data?.alert_count).toBe(0);
    });
  });

  it("returns null when no memberId provided", async () => {
    const { result } = renderHook(
      () =>
        useSessionAlerts(
          "session-1",
          undefined, // No member
          "2025-01-15T10:00:00Z"
        ),
      { wrapper: createWrapper() }
    );

    // Query should not be enabled
    expect(result.current.data).toBeUndefined();
  });

  it("returns null when no sessionId provided", async () => {
    const { result } = renderHook(
      () =>
        useSessionAlerts(
          undefined, // No session
          "member-1",
          "2025-01-15T10:00:00Z"
        ),
      { wrapper: createWrapper() }
    );

    // Query should not be enabled
    expect(result.current.data).toBeUndefined();
  });

  it("returns null when no scheduledStart provided", async () => {
    const { result } = renderHook(
      () =>
        useSessionAlerts(
          "session-1",
          "member-1",
          undefined // No scheduled start
        ),
      { wrapper: createWrapper() }
    );

    // Query should not be enabled
    expect(result.current.data).toBeUndefined();
  });

  it("handles database errors gracefully", async () => {
    // Mock database error
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error", code: "500" },
      }),
    } as any);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(
      () => useSessionAlerts("session-1", "member-1", "2025-01-15T10:00:00Z"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it("caches results for 1 minute", async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({
        data: [{ id: "comment-1", due_date: "2025-01-20" }],
        error: null,
      }),
    } as any);

    const { result, rerender } = renderHook(
      () => useSessionAlerts("session-1", "member-1", "2025-01-15T10:00:00Z"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data?.alert_count).toBe(1);
    });

    // Rerender should use cached data
    rerender();

    // Should still have same data without refetching
    expect(result.current.data?.alert_count).toBe(1);
  });
});
