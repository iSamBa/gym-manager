/**
 * @fileoverview Tests for trainer availability hook
 * Tests core data fetching and availability checking functionality
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { ReactNode } from "react";
import { useTrainerAvailability } from "../../hooks/use-trainer-availability";
import { supabase } from "@/lib/supabase";

// Mock the Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
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
    vi.resetAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe("useTrainerAvailability", () => {
    const validAvailabilityParams = {
      trainer_id: "trainer-123",
      start_time: "2024-12-01T09:00:00.000Z",
      end_time: "2024-12-01T10:00:00.000Z",
      enabled: true,
    };

    describe("Real-time checking", () => {
      it("should call check_trainer_availability database function with correct parameters", async () => {
        (supabase.rpc as any).mockResolvedValue({
          data: { is_available: true },
          error: null,
        });

        const { result } = renderHook(
          () => useTrainerAvailability(validAvailabilityParams),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
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

      it("should return correct availability data structure", async () => {
        const mockAvailabilityData = {
          is_available: true,
          conflicting_sessions: [],
        };

        (supabase.rpc as any).mockResolvedValue({
          data: mockAvailabilityData,
          error: null,
        });

        const { result } = renderHook(
          () => useTrainerAvailability(validAvailabilityParams),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockAvailabilityData);
        expect(result.current.error).toBeNull();
      });

      it("should return conflicts when trainer is not available", async () => {
        const mockConflictData = {
          is_available: false,
          conflicting_sessions: [
            {
              id: "session-1",
              scheduled_start: "2024-12-01T09:30:00.000Z",
              scheduled_end: "2024-12-01T10:30:00.000Z",
            },
          ],
        };

        (supabase.rpc as any).mockResolvedValue({
          data: mockConflictData,
          error: null,
        });

        const { result } = renderHook(
          () => useTrainerAvailability(validAvailabilityParams),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockConflictData);
        expect(result.current.data?.is_available).toBe(false);
        expect(result.current.data?.conflicting_sessions).toHaveLength(1);
      });
    });

    describe("Query enablement", () => {
      it("should not execute query when required parameters are missing", () => {
        const paramsWithMissingTrainer = {
          trainer_id: "",
          start_time: "2024-12-01T09:00:00.000Z",
          end_time: "2024-12-01T10:00:00.000Z",
          enabled: true,
        };

        renderHook(() => useTrainerAvailability(paramsWithMissingTrainer), {
          wrapper,
        });

        expect(supabase.rpc).not.toHaveBeenCalled();
      });

      it("should not execute query when enabled is false", () => {
        const disabledParams = {
          ...validAvailabilityParams,
          enabled: false,
        };

        renderHook(() => useTrainerAvailability(disabledParams), { wrapper });

        expect(supabase.rpc).not.toHaveBeenCalled();
      });
    });
  });
});
