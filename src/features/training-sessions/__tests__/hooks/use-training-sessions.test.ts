/**
 * @fileoverview Tests for training sessions hooks
 * Tests core data fetching functionality
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { ReactNode } from "react";
import {
  useTrainingSessions,
  useTrainingSession,
} from "../../hooks/use-training-sessions";
import { supabase } from "@/lib/supabase";

// Mock the Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  },
}));

const mockTrainingSessions = [
  {
    id: "session-1",
    trainer_id: "trainer-123",
    scheduled_start: "2024-01-20T10:00:00Z",
    scheduled_end: "2024-01-20T11:00:00Z",
    status: "completed",
    location: "Main Gym",
    notes: "Great session",
    max_participants: 10,
  },
];

describe("Training Sessions Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe("useTrainingSessions", () => {
    it("should fetch training sessions successfully", async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockTrainingSessions,
          error: null,
        }),
      };
      const mockSelect = vi.fn(() => mockQuery);
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainingSessions(), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockTrainingSessions);
      expect(result.current.error).toBeNull();
    });

    it("should handle fetch error", async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };
      const mockSelect = vi.fn(() => mockQuery);
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainingSessions(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should handle empty results", async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      const mockSelect = vi.fn(() => mockQuery);
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainingSessions(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    // US-006: Server-side filtering tests
    it("should filter by member_id using server-side JOIN", async () => {
      const mockMemberSessions = [
        {
          ...mockTrainingSessions[0],
          id: "session-member-1",
          member_id: "member-123",
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockMemberSessions,
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockQuery);

      const { result } = renderHook(
        () => useTrainingSessions({ member_id: "member-123" }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify server-side filtering was used (JOIN on training_session_members)
      expect(supabase.from).toHaveBeenCalledWith("training_sessions_calendar");
      // Verify JOIN query includes training_session_members
      const selectCalls = mockQuery.select.mock.calls;
      const hasJoinQuery = selectCalls.some((call: any[]) =>
        call[0]?.includes("training_session_members!inner")
      );
      expect(hasJoinQuery).toBe(true);
      expect(mockQuery.eq).toHaveBeenCalledWith(
        "training_session_members.member_id",
        "member-123"
      );
      expect(mockQuery.eq).toHaveBeenCalledWith(
        "training_session_members.booking_status",
        "confirmed"
      );

      expect(result.current.data).toEqual(mockMemberSessions);
    });

    it("should use RPC for date_range filtering", async () => {
      const mockRpcSessions = [
        {
          session_id: "session-1", // RPC returns session_id
          trainer_id: "trainer-123",
          scheduled_start: "2024-01-20T10:00:00Z",
          scheduled_end: "2024-01-20T11:00:00Z",
          status: "completed",
        },
      ];

      (supabase.rpc as any).mockResolvedValue({
        data: mockRpcSessions,
        error: null,
      });

      const { result } = renderHook(
        () =>
          useTrainingSessions({
            date_range: {
              start: new Date("2024-01-01"),
              end: new Date("2024-01-31"),
            },
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify RPC was called with date parameters
      expect(supabase.rpc).toHaveBeenCalledWith(
        "get_sessions_with_planning_indicators",
        {
          p_start_date: "2024-01-01",
          p_end_date: "2024-01-31",
        }
      );

      // Verify response was mapped (session_id → id)
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.[0].id).toBe("session-1");
    });

    it("should apply client-side filters on RPC results (trainer_id)", async () => {
      const mockRpcSessions = [
        {
          session_id: "session-1",
          trainer_id: "trainer-123",
          status: "completed",
        },
        {
          session_id: "session-2",
          trainer_id: "trainer-456",
          status: "completed",
        },
      ];

      (supabase.rpc as any).mockResolvedValue({
        data: mockRpcSessions,
        error: null,
      });

      const { result } = renderHook(
        () =>
          useTrainingSessions({
            date_range: {
              start: new Date("2024-01-01"),
              end: new Date("2024-01-31"),
            },
            trainer_id: "trainer-123",
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify only trainer-123's sessions are returned
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].trainer_id).toBe("trainer-123");
    });

    it("should apply client-side filters on RPC results (status)", async () => {
      const mockRpcSessions = [
        {
          session_id: "session-1",
          status: "completed",
        },
        {
          session_id: "session-2",
          status: "scheduled",
        },
      ];

      (supabase.rpc as any).mockResolvedValue({
        data: mockRpcSessions,
        error: null,
      });

      const { result } = renderHook(
        () =>
          useTrainingSessions({
            date_range: {
              start: new Date("2024-01-01"),
              end: new Date("2024-01-31"),
            },
            status: "scheduled",
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify only scheduled sessions are returned
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].status).toBe("scheduled");
    });

    it("should not filter when status is 'all'", async () => {
      const mockRpcSessions = [
        { session_id: "session-1", status: "completed" },
        { session_id: "session-2", status: "scheduled" },
      ];

      (supabase.rpc as any).mockResolvedValue({
        data: mockRpcSessions,
        error: null,
      });

      const { result } = renderHook(
        () =>
          useTrainingSessions({
            date_range: {
              start: new Date("2024-01-01"),
              end: new Date("2024-01-31"),
            },
            status: "all",
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify all sessions are returned
      expect(result.current.data).toHaveLength(2);
    });
  });

  describe("useTrainingSession", () => {
    it("should fetch single training session successfully", async () => {
      const mockSingleSession = mockTrainingSessions[0];
      const mockSessionWithIndicators = {
        ...mockSingleSession,
        session_id: "session-1", // RPC returns session_id
        outstanding_balance: 100.5,
        latest_payment_date: "2024-01-15",
        subscription_end_date: "2024-12-31",
        remaining_sessions: 5,
      };

      // Mock the calendar view query (first call to get basic session)
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockSingleSession,
          error: null,
        }),
      };
      const mockSelect = vi.fn(() => mockQuery);
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      // Mock the RPC call to get planning indicators
      (supabase.rpc as any).mockResolvedValue({
        data: [mockSessionWithIndicators],
        error: null,
      });

      const { result } = renderHook(() => useTrainingSession("session-1"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should return session with planning indicators
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBe("session-1");
      expect(result.current.data?.outstanding_balance).toBe(100.5);
      expect(result.current.error).toBeNull();
    });

    it("should handle empty session id", () => {
      const { result } = renderHook(() => useTrainingSession(""), {
        wrapper,
      });

      expect(result.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});
