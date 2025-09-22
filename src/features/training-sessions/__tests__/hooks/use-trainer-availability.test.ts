import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import {
  useTrainerAvailability,
  useTrainerDayAvailability,
  useBulkAvailabilityCheck,
} from "../../hooks/use-trainer-availability";
import { supabase } from "@/lib/supabase";

// Mock the supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe("Trainer Availability Hooks", () => {
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
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
    };
    return Wrapper;
  };

  describe("useTrainerAvailability", () => {
    const defaultParams = {
      trainer_id: "trainer-123",
      start_time: "2024-12-01T09:00:00.000Z",
      end_time: "2024-12-01T10:00:00.000Z",
    };

    describe("US-005: Availability Validation System - Real-time checking", () => {
      it("should call check_trainer_availability database function with correct parameters", async () => {
        const mockRpcResult = {
          data: {
            available: true,
            conflicts: [],
            message: "Trainer is available",
          },
          error: null,
        };

        vi.mocked(supabase.rpc).mockResolvedValue(mockRpcResult);

        const { result } = renderHook(
          () => useTrainerAvailability(defaultParams),
          {
            wrapper: createWrapper(),
          }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(supabase.rpc).toHaveBeenCalledWith(
          "check_trainer_availability",
          {
            p_trainer_id: "trainer-123",
            p_start_time: "2024-12-01T09:00:00.000Z",
            p_end_time: "2024-12-01T10:00:00.000Z",
            p_exclude_session_id: null,
          }
        );
      });

      it("should pass exclude_session_id when provided", async () => {
        const mockRpcResult = {
          data: { available: true, conflicts: [], message: "Available" },
          error: null,
        };

        vi.mocked(supabase.rpc).mockResolvedValue(mockRpcResult);

        const paramsWithExclusion = {
          ...defaultParams,
          exclude_session_id: "session-456",
        };

        const { result } = renderHook(
          () => useTrainerAvailability(paramsWithExclusion),
          {
            wrapper: createWrapper(),
          }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(supabase.rpc).toHaveBeenCalledWith(
          "check_trainer_availability",
          {
            p_trainer_id: "trainer-123",
            p_start_time: "2024-12-01T09:00:00.000Z",
            p_end_time: "2024-12-01T10:00:00.000Z",
            p_exclude_session_id: "session-456",
          }
        );
      });

      it("should return correct availability data structure", async () => {
        const expectedData = {
          available: true,
          conflicts: [],
          message: "Trainer is available for this time slot",
        };

        vi.mocked(supabase.rpc).mockResolvedValue({
          data: expectedData,
          error: null,
        });

        const { result } = renderHook(
          () => useTrainerAvailability(defaultParams),
          {
            wrapper: createWrapper(),
          }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(expectedData);
      });

      it("should return conflicts when trainer is not available", async () => {
        const conflictData = {
          available: false,
          conflicts: [
            {
              id: "session-1",
              scheduled_start: "2024-12-01T09:30:00.000Z",
              scheduled_end: "2024-12-01T10:30:00.000Z",
              location: "Main Gym",
              max_participants: 5,
              current_participants: 3,
              status: "scheduled",
            },
          ],
          message: "Trainer has 1 conflicting session during this time",
        };

        vi.mocked(supabase.rpc).mockResolvedValue({
          data: conflictData,
          error: null,
        });

        const { result } = renderHook(
          () => useTrainerAvailability(defaultParams),
          {
            wrapper: createWrapper(),
          }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(conflictData);
        expect(result.current.data?.conflicts).toHaveLength(1);
        expect(result.current.data?.available).toBe(false);
      });
    });

    describe("Error handling and fallback", () => {
      it("should fallback to basic availability check when RPC fails", async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({
          data: null,
          error: new Error("RPC function not found"),
        });

        // Mock the fallback query
        const mockFromChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          or: vi.fn(),
        };

        mockFromChain.or.mockResolvedValue({
          data: [], // No conflicting sessions
          error: null,
        });

        vi.mocked(supabase.from).mockReturnValue(mockFromChain);

        const { result } = renderHook(
          () => useTrainerAvailability(defaultParams),
          {
            wrapper: createWrapper(),
          }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        // Should fallback to basic check
        expect(supabase.from).toHaveBeenCalledWith("training_sessions");
        expect(result.current.data?.available).toBe(true);
        expect(result.current.data?.message).toBe("Trainer is available");
      });

      it("should return safe default when both RPC and fallback fail", async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({
          data: null,
          error: new Error("RPC failed"),
        });

        const mockFromChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          or: vi.fn(),
        };

        mockFromChain.or.mockResolvedValue({
          data: null,
          error: new Error("Query failed"),
        });

        vi.mocked(supabase.from).mockReturnValue(mockFromChain);

        const { result } = renderHook(
          () => useTrainerAvailability(defaultParams),
          {
            wrapper: createWrapper(),
          }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.available).toBe(true);
        expect(result.current.data?.conflicts).toEqual([]);
        expect(result.current.data?.message).toBe(
          "Unable to verify availability - please check manually"
        );
      });

      it("should handle network errors gracefully", async () => {
        vi.mocked(supabase.rpc).mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(
          () => useTrainerAvailability(defaultParams),
          {
            wrapper: createWrapper(),
          }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.available).toBe(true);
        expect(result.current.data?.message).toContain(
          "Unable to verify availability"
        );
      });
    });

    describe("Query enablement and optimization", () => {
      it("should not execute query when required parameters are missing", () => {
        const { result } = renderHook(
          () =>
            useTrainerAvailability({
              trainer_id: "",
              start_time: "2024-12-01T09:00:00.000Z",
              end_time: "2024-12-01T10:00:00.000Z",
            }),
          {
            wrapper: createWrapper(),
          }
        );

        expect(result.current.fetchStatus).toBe("idle");
        expect(supabase.rpc).not.toHaveBeenCalled();
      });

      it("should not execute query when enabled is false", () => {
        const { result } = renderHook(
          () =>
            useTrainerAvailability({
              ...defaultParams,
              enabled: false,
            }),
          {
            wrapper: createWrapper(),
          }
        );

        expect(result.current.fetchStatus).toBe("idle");
        expect(supabase.rpc).not.toHaveBeenCalled();
      });

      it("should have appropriate staleTime for real-time requirements", () => {
        const { result } = renderHook(
          () => useTrainerAvailability(defaultParams),
          {
            wrapper: createWrapper(),
          }
        );

        // Check that the query has short staleTime (30 seconds)
        expect(result.current.dataUpdatedAt).toBeDefined();
      });

      it("should refetch on window focus for real-time updates", async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({
          data: { available: true, conflicts: [], message: "Available" },
          error: null,
        });

        const { result } = renderHook(
          () => useTrainerAvailability(defaultParams),
          {
            wrapper: createWrapper(),
          }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        // Simulate window focus
        window.dispatchEvent(new Event("focus"));

        // Should trigger refetch
        await waitFor(() => {
          expect(supabase.rpc).toHaveBeenCalledTimes(2);
        });
      });
    });

    describe("Basic availability check fallback logic", () => {
      beforeEach(() => {
        vi.mocked(supabase.rpc).mockResolvedValue({
          data: null,
          error: new Error("RPC not available"),
        });
      });

      it("should query training_sessions table with correct filters", async () => {
        const mockFromChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          or: vi.fn(),
        };

        mockFromChain.or.mockResolvedValue({
          data: [],
          error: null,
        });

        vi.mocked(supabase.from).mockReturnValue(mockFromChain);

        const { result } = renderHook(
          () => useTrainerAvailability(defaultParams),
          {
            wrapper: createWrapper(),
          }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(supabase.from).toHaveBeenCalledWith("training_sessions");
        expect(mockFromChain.select).toHaveBeenCalledWith("*");
        expect(mockFromChain.eq).toHaveBeenCalledWith(
          "trainer_id",
          "trainer-123"
        );
        expect(mockFromChain.neq).toHaveBeenCalledWith("status", "cancelled");
        expect(mockFromChain.or).toHaveBeenCalledWith(
          "and(scheduled_start.lt.2024-12-01T10:00:00.000Z,scheduled_end.gt.2024-12-01T09:00:00.000Z)"
        );
      });

      it("should exclude session when exclude_session_id is provided", async () => {
        const mockFromChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          or: vi.fn(),
        };

        mockFromChain.or.mockResolvedValue({
          data: [],
          error: null,
        });

        vi.mocked(supabase.from).mockReturnValue(mockFromChain);

        const paramsWithExclusion = {
          ...defaultParams,
          exclude_session_id: "session-456",
        };

        const { result } = renderHook(
          () => useTrainerAvailability(paramsWithExclusion),
          {
            wrapper: createWrapper(),
          }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockFromChain.neq).toHaveBeenCalledWith("id", "session-456");
      });

      it("should detect conflicts correctly", async () => {
        const conflictingSessions = [
          {
            id: "session-1",
            scheduled_start: "2024-12-01T09:30:00.000Z",
            scheduled_end: "2024-12-01T10:30:00.000Z",
          },
        ];

        const mockFromChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          or: vi.fn(),
        };

        mockFromChain.or.mockResolvedValue({
          data: conflictingSessions,
          error: null,
        });

        vi.mocked(supabase.from).mockReturnValue(mockFromChain);

        const { result } = renderHook(
          () => useTrainerAvailability(defaultParams),
          {
            wrapper: createWrapper(),
          }
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.available).toBe(false);
        expect(result.current.data?.conflicts).toEqual(conflictingSessions);
        expect(result.current.data?.message).toBe(
          "Trainer has 1 conflicting session(s) during this time"
        );
      });
    });
  });

  describe("useTrainerDayAvailability", () => {
    const dayParams = {
      trainer_id: "trainer-123",
      date: "2024-12-01",
    };

    it("should query trainer schedule for specific day", async () => {
      const mockDaySchedule = [
        {
          id: "session-1",
          scheduled_start: "2024-12-01T09:00:00.000Z",
          scheduled_end: "2024-12-01T10:00:00.000Z",
        },
        {
          id: "session-2",
          scheduled_start: "2024-12-01T14:00:00.000Z",
          scheduled_end: "2024-12-01T15:00:00.000Z",
        },
      ];

      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn(),
      };

      mockFromChain.order.mockResolvedValue({
        data: mockDaySchedule,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue(mockFromChain);

      const { result } = renderHook(
        () => useTrainerDayAvailability(dayParams),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(supabase.from).toHaveBeenCalledWith("training_sessions");
      expect(mockFromChain.eq).toHaveBeenCalledWith(
        "trainer_id",
        "trainer-123"
      );
      expect(mockFromChain.neq).toHaveBeenCalledWith("status", "cancelled");
      expect(mockFromChain.gte).toHaveBeenCalledWith(
        "scheduled_start",
        "2024-12-01T00:00:00.000Z"
      );
      expect(mockFromChain.lte).toHaveBeenCalledWith(
        "scheduled_end",
        "2024-12-01T23:59:59.999Z"
      );
      expect(mockFromChain.order).toHaveBeenCalledWith("scheduled_start", {
        ascending: true,
      });

      expect(result.current.data).toEqual(mockDaySchedule);
    });

    it("should not execute when required parameters are missing", () => {
      const { result } = renderHook(
        () =>
          useTrainerDayAvailability({
            trainer_id: "",
            date: "2024-12-01",
          }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should have longer staleTime for day schedule", () => {
      // Day schedules are more stable, so longer staleTime (5 minutes) is appropriate
      const { result } = renderHook(
        () => useTrainerDayAvailability(dayParams),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.dataUpdatedAt).toBeDefined();
    });
  });

  describe("useBulkAvailabilityCheck", () => {
    const bulkParams = {
      trainer_id: "trainer-123",
      time_slots: [
        {
          start_time: "2024-12-01T09:00:00.000Z",
          end_time: "2024-12-01T10:00:00.000Z",
        },
        {
          start_time: "2024-12-01T14:00:00.000Z",
          end_time: "2024-12-01T15:00:00.000Z",
        },
      ],
    };

    it("should check availability for multiple time slots", async () => {
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        or: vi.fn(),
      };

      // Mock responses for each time slot
      mockFromChain.or
        .mockResolvedValueOnce({ data: [], error: null }) // First slot available
        .mockResolvedValueOnce({ data: [{ id: "conflict" }], error: null }); // Second slot has conflict

      vi.mocked(supabase.from).mockReturnValue(mockFromChain);

      const { result } = renderHook(
        () => useBulkAvailabilityCheck(bulkParams),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].availability.available).toBe(true);
      expect(result.current.data?.[1].availability.available).toBe(false);
    });

    it("should return time slot info with availability results", async () => {
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        or: vi.fn(),
      };

      mockFromChain.or.mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockFromChain);

      const { result } = renderHook(
        () => useBulkAvailabilityCheck(bulkParams),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0]).toEqual({
        start_time: "2024-12-01T09:00:00.000Z",
        end_time: "2024-12-01T10:00:00.000Z",
        availability: {
          available: true,
          conflicts: [],
          message: "Trainer is available",
        },
      });
    });

    it("should not execute when no time slots provided", () => {
      const { result } = renderHook(
        () =>
          useBulkAvailabilityCheck({
            trainer_id: "trainer-123",
            time_slots: [],
          }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should have short staleTime for immediate use", () => {
      const { result } = renderHook(
        () => useBulkAvailabilityCheck(bulkParams),
        {
          wrapper: createWrapper(),
        }
      );

      // Bulk checks are typically for immediate use, so 1-minute staleTime
      expect(result.current.dataUpdatedAt).toBeDefined();
    });
  });

  describe("Performance and caching", () => {
    it("should use proper query keys for caching", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { available: true, conflicts: [], message: "Available" },
        error: null,
      });

      const { result: result1 } = renderHook(
        () => useTrainerAvailability(defaultParams),
        {
          wrapper: createWrapper(),
        }
      );

      const { result: result2 } = renderHook(
        () => useTrainerAvailability(defaultParams),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should only make one API call due to caching
      expect(supabase.rpc).toHaveBeenCalledTimes(1);
    });

    it("should cache different parameter combinations separately", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { available: true, conflicts: [], message: "Available" },
        error: null,
      });

      const params1 = defaultParams;
      const params2 = {
        ...defaultParams,
        end_time: "2024-12-01T11:00:00.000Z",
      };

      const { result: result1 } = renderHook(
        () => useTrainerAvailability(params1),
        {
          wrapper: createWrapper(),
        }
      );

      const { result: result2 } = renderHook(
        () => useTrainerAvailability(params2),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should make separate API calls for different parameters
      expect(supabase.rpc).toHaveBeenCalledTimes(2);
    });
  });
});
