/**
 * @fileoverview Tests for member sessions hook
 * Tests core data fetching functionality
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { ReactNode } from "react";
import { useMemberSessions } from "../use-member-sessions";
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
  },
}));

const mockMemberSessions = [
  {
    session_id: "session-1",
    scheduled_start: "2024-01-20T10:00:00Z",
    scheduled_end: "2024-01-20T11:00:00Z",
    status: "completed",
    location: "Main Gym",
    notes: "Great session",
    trainer_id: "trainer-123",
    trainer_name: "John Doe",
    booking_status: "confirmed",
    attendance_status: "attended",
    check_in_time: "2024-01-20T09:55:00Z",
    booking_date: "2024-01-15T12:00:00Z",
    created_at: "2024-01-15T12:00:00Z",
    duration_minutes: 60,
    is_upcoming: false,
    is_today: false,
  },
];

describe("useMemberSessions Hook", () => {
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

  describe("Basic Functionality", () => {
    it("should fetch member sessions successfully", async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockMemberSessions,
          error: null,
        }),
      };
      const mockSelect = vi.fn(() => mockQuery);
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useMemberSessions("member-123"), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockMemberSessions);
      expect(result.current.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("member_session_history");
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

      const { result } = renderHook(() => useMemberSessions("member-123"), {
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
