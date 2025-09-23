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
  });

  describe("useTrainingSession", () => {
    it("should fetch single training session successfully", async () => {
      const mockSingleSession = mockTrainingSessions[0];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockSingleSession,
          error: null,
        }),
      };
      const mockSelect = vi.fn(() => mockQuery);
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainingSession("session-1"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockSingleSession);
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
