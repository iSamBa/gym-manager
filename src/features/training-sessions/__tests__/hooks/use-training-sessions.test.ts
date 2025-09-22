import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import {
  useTrainingSessions,
  useTrainingSession,
  useCreateTrainingSession,
  useUpdateTrainingSession,
  useDeleteTrainingSession,
  TRAINING_SESSIONS_KEYS,
} from "../../hooks/use-training-sessions";
import type {
  TrainingSession,
  CreateSessionData,
  UpdateSessionData,
  SessionFilters,
} from "../../lib/types";
import { supabase } from "@/lib/supabase";

// Mock Supabase client
vi.mock("@/lib/supabase", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockReturnThis(),
  };

  return {
    supabase: mockSupabase,
  };
});

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
}

// Get the mocked supabase instance
const mockSupabase = vi.mocked(supabase);

describe("Training Sessions Hooks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("useTrainingSessions", () => {
    const mockSessions: TrainingSession[] = [
      {
        id: "session-1",
        trainer_id: "trainer-1",
        scheduled_start: "2024-12-01T09:00:00.000Z",
        scheduled_end: "2024-12-01T10:00:00.000Z",
        status: "scheduled",
        max_participants: 10,
        current_participants: 3,
        location: "Main Gym",
        notes: "Test session",
        created_at: "2024-11-01T00:00:00.000Z",
        updated_at: "2024-11-01T00:00:00.000Z",
      },
      {
        id: "session-2",
        trainer_id: "trainer-2",
        scheduled_start: "2024-12-01T14:00:00.000Z",
        scheduled_end: "2024-12-01T15:00:00.000Z",
        status: "completed",
        max_participants: 8,
        current_participants: 6,
        location: "Studio A",
        notes: null,
        created_at: "2024-11-01T00:00:00.000Z",
        updated_at: "2024-11-01T00:00:00.000Z",
      },
    ];

    it("should fetch training sessions successfully", async () => {
      const { Wrapper } = createWrapper();

      // Mock successful response
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const { result } = renderHook(() => useTrainingSessions(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSessions);
      expect(mockSupabase.from).toHaveBeenCalledWith(
        "training_sessions_calendar"
      );
      expect(mockSupabase.select).toHaveBeenCalledWith("*");
      expect(mockSupabase.order).toHaveBeenCalledWith("scheduled_start", {
        ascending: true,
      });
    });

    it("should handle fetch error", async () => {
      const { Wrapper } = createWrapper();

      const mockError = { message: "Database connection failed" };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useTrainingSessions(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect((result.current.error as Error).message).toBe(
        "Failed to fetch training sessions: Database connection failed"
      );
    });

    it("should apply trainer_id filter", async () => {
      const { Wrapper } = createWrapper();

      const filters: SessionFilters = { trainer_id: "trainer-1" };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: [mockSessions[0]],
        error: null,
      });

      const { result } = renderHook(() => useTrainingSessions(filters), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith("trainer_id", "trainer-1");
    });

    it('should apply status filter (excluding "all")', async () => {
      const { Wrapper } = createWrapper();

      const filters: SessionFilters = { status: "scheduled" };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: [mockSessions[0]],
        error: null,
      });

      const { result } = renderHook(() => useTrainingSessions(filters), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith("status", "scheduled");
    });

    it('should not apply status filter when status is "all"', async () => {
      const { Wrapper } = createWrapper();

      const filters: SessionFilters = { status: "all" };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const { result } = renderHook(() => useTrainingSessions(filters), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabase.eq).not.toHaveBeenCalledWith("status", "all");
    });

    it("should apply location filter", async () => {
      const { Wrapper } = createWrapper();

      const filters: SessionFilters = { location: "gym" };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.ilike.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const { result } = renderHook(() => useTrainingSessions(filters), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabase.ilike).toHaveBeenCalledWith("location", "%gym%");
    });

    it("should apply date range filter", async () => {
      const { Wrapper } = createWrapper();

      const filters: SessionFilters = {
        date_range: {
          start: new Date("2024-12-01"),
          end: new Date("2024-12-31"),
        },
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.gte.mockReturnValue(mockSupabase);
      mockSupabase.lte.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const { result } = renderHook(() => useTrainingSessions(filters), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabase.gte).toHaveBeenCalledWith(
        "scheduled_start",
        "2024-12-01T00:00:00.000Z"
      );
      expect(mockSupabase.lte).toHaveBeenCalledWith(
        "scheduled_end",
        "2024-12-31T00:00:00.000Z"
      );
    });

    it("should use correct query key", () => {
      const filters: SessionFilters = { trainer_id: "trainer-1" };
      const expectedKey = TRAINING_SESSIONS_KEYS.list(filters);
      expect(expectedKey).toEqual(["training-sessions", "list", filters]);
    });
  });

  describe("useTrainingSession", () => {
    const mockSession: TrainingSession = {
      id: "session-1",
      trainer_id: "trainer-1",
      scheduled_start: "2024-12-01T09:00:00.000Z",
      scheduled_end: "2024-12-01T10:00:00.000Z",
      status: "scheduled",
      max_participants: 10,
      current_participants: 3,
      location: "Main Gym",
      notes: "Test session",
      created_at: "2024-11-01T00:00:00.000Z",
      updated_at: "2024-11-01T00:00:00.000Z",
    };

    it("should fetch single training session successfully", async () => {
      const { Wrapper } = createWrapper();

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: mockSession,
        error: null,
      });

      const { result } = renderHook(() => useTrainingSession("session-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSession);
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "session-1");
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it("should handle fetch error for single session", async () => {
      const { Wrapper } = createWrapper();

      const mockError = { message: "Session not found" };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useTrainingSession("session-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect((result.current.error as Error).message).toBe(
        "Failed to fetch training session: Session not found"
      );
    });

    it("should not fetch when id is empty", () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useTrainingSession(""), {
        wrapper: Wrapper,
      });

      expect(result.current.isIdle).toBe(true);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe("useCreateTrainingSession", () => {
    it("should create training session successfully", async () => {
      const { Wrapper, queryClient } = createWrapper();

      const mockCreateData: CreateSessionData = {
        trainer_id: "trainer-1",
        scheduled_start: "2024-12-01T09:00:00.000Z",
        scheduled_end: "2024-12-01T10:00:00.000Z",
        location: "Main Gym",
        max_participants: 10,
        member_ids: ["member-1", "member-2"],
      };

      const mockResult = { id: "new-session-1", ...mockCreateData };

      mockSupabase.rpc.mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateTrainingSession(), {
        wrapper: Wrapper,
      });

      result.current.mutate(mockCreateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResult);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "create_training_session_with_members",
        {
          trainer_id: "trainer-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
          location: "Main Gym",
          max_participants: 10,
          member_ids: ["member-1", "member-2"],
          notes: null,
        }
      );

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: TRAINING_SESSIONS_KEYS.all,
      });
    });

    it("should handle create error", async () => {
      const { Wrapper } = createWrapper();

      const mockError = { message: "Trainer not available" };
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockCreateData: CreateSessionData = {
        trainer_id: "trainer-1",
        scheduled_start: "2024-12-01T09:00:00.000Z",
        scheduled_end: "2024-12-01T10:00:00.000Z",
        location: "Main Gym",
        max_participants: 10,
        member_ids: ["member-1"],
      };

      const { result } = renderHook(() => useCreateTrainingSession(), {
        wrapper: Wrapper,
      });

      result.current.mutate(mockCreateData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect((result.current.error as Error).message).toBe(
        "Failed to create training session: Trainer not available"
      );
    });

    it("should include notes when provided", async () => {
      const { Wrapper } = createWrapper();

      const mockCreateData: CreateSessionData = {
        trainer_id: "trainer-1",
        scheduled_start: "2024-12-01T09:00:00.000Z",
        scheduled_end: "2024-12-01T10:00:00.000Z",
        location: "Main Gym",
        max_participants: 10,
        member_ids: ["member-1"],
        notes: "Special session",
      };

      mockSupabase.rpc.mockResolvedValue({
        data: { id: "new-session-1" },
        error: null,
      });

      const { result } = renderHook(() => useCreateTrainingSession(), {
        wrapper: Wrapper,
      });

      result.current.mutate(mockCreateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "create_training_session_with_members",
        {
          trainer_id: "trainer-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
          location: "Main Gym",
          max_participants: 10,
          member_ids: ["member-1"],
          notes: "Special session",
        }
      );
    });
  });

  describe("useUpdateTrainingSession", () => {
    it("should update training session successfully", async () => {
      const { Wrapper, queryClient } = createWrapper();

      const mockUpdateData: UpdateSessionData = {
        location: "Updated Gym",
        max_participants: 12,
        status: "in_progress",
      };

      const mockUpdatedSession = {
        id: "session-1",
        trainer_id: "trainer-1",
        scheduled_start: "2024-12-01T09:00:00.000Z",
        scheduled_end: "2024-12-01T10:00:00.000Z",
        status: "in_progress",
        max_participants: 12,
        current_participants: 3,
        location: "Updated Gym",
        notes: null,
        created_at: "2024-11-01T00:00:00.000Z",
        updated_at: "2024-11-01T00:00:00.000Z",
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedSession,
        error: null,
      });

      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateTrainingSession(), {
        wrapper: Wrapper,
      });

      result.current.mutate({ id: "session-1", data: mockUpdateData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUpdatedSession);
      expect(mockSupabase.update).toHaveBeenCalledWith(mockUpdateData);
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "session-1");

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        TRAINING_SESSIONS_KEYS.detail("session-1"),
        mockUpdatedSession
      );
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: TRAINING_SESSIONS_KEYS.lists(),
      });
    });

    it("should handle update error", async () => {
      const { Wrapper } = createWrapper();

      const mockError = { message: "Update failed" };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockUpdateData: UpdateSessionData = {
        location: "Updated Gym",
      };

      const { result } = renderHook(() => useUpdateTrainingSession(), {
        wrapper: Wrapper,
      });

      result.current.mutate({ id: "session-1", data: mockUpdateData });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect((result.current.error as Error).message).toBe(
        "Failed to update training session: Update failed"
      );
    });
  });

  describe("useDeleteTrainingSession", () => {
    it("should delete training session successfully", async () => {
      const { Wrapper, queryClient } = createWrapper();

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.delete.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: null,
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteTrainingSession(), {
        wrapper: Wrapper,
      });

      result.current.mutate("session-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "session-1");

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: TRAINING_SESSIONS_KEYS.all,
      });
    });

    it("should handle delete error", async () => {
      const { Wrapper } = createWrapper();

      const mockError = { message: "Delete failed" };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.delete.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useDeleteTrainingSession(), {
        wrapper: Wrapper,
      });

      result.current.mutate("session-1");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect((result.current.error as Error).message).toBe(
        "Failed to delete training session: Delete failed"
      );
    });
  });

  describe("Query Keys", () => {
    it("should generate correct query keys", () => {
      expect(TRAINING_SESSIONS_KEYS.all).toEqual(["training-sessions"]);
      expect(TRAINING_SESSIONS_KEYS.lists()).toEqual([
        "training-sessions",
        "list",
      ]);
      expect(TRAINING_SESSIONS_KEYS.list({ trainer_id: "trainer-1" })).toEqual([
        "training-sessions",
        "list",
        { trainer_id: "trainer-1" },
      ]);
      expect(TRAINING_SESSIONS_KEYS.details()).toEqual([
        "training-sessions",
        "detail",
      ]);
      expect(TRAINING_SESSIONS_KEYS.detail("session-1")).toEqual([
        "training-sessions",
        "detail",
        "session-1",
      ]);
      expect(
        TRAINING_SESSIONS_KEYS.calendar("2024-12-01", "2024-12-31")
      ).toEqual(["training-sessions", "calendar", "2024-12-01", "2024-12-31"]);
    });
  });
});
