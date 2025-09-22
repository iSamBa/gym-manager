/**
 * @fileoverview Tests for trainer sessions hooks
 * Tests data fetching and basic functionality
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { ReactNode } from "react";
import { useTrainerSessions } from "../use-trainer-sessions";
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
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
}));

const mockTrainerSessions = [
  {
    trainer_id: "trainer-123",
    session_id: "session-1",
    scheduled_start: "2024-01-20T10:00:00Z",
    scheduled_end: "2024-01-20T11:00:00Z",
    session_status: "completed",
    location: "Main Gym Floor",
    notes: "Great session with advanced techniques",
    duration_minutes: 60,
    is_upcoming: false,
    is_today: false,
    member_count: 2,
    max_participants: 3,
    current_participants: 2,
    member_names: "John Doe, Jane Smith",
  },
];

describe("Trainer Sessions Hooks", () => {
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

  describe("useTrainerSessions Hook", () => {
    it("should fetch trainer sessions successfully", async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockTrainerSessions,
          error: null,
        }),
      };
      const mockSelect = vi.fn(() => mockQuery);
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerSessions("trainer-123"), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockTrainerSessions);
      expect(result.current.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("trainer_session_history");
    });

    it("should handle empty results gracefully", async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      const mockSelect = vi.fn(() => mockQuery);
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerSessions("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });
});
