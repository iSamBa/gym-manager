/**
 * @fileoverview Integration tests for trainer sessions and analytics hooks
 * Tests data fetching, analytics calculations, and integration with database views
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { ReactNode } from "react";
import {
  useTrainerSessions,
  useTrainerAnalytics,
} from "../use-trainer-sessions";
import { supabase } from "@/lib/supabase";

// Mock the Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({ data: [], error: null, count: 0 })
                ),
              })),
            })),
          })),
        })),
      })),
    })),
  },
}));

const mockTrainerSessions = [
  {
    id: "session-1",
    trainer_id: "trainer-123",
    scheduled_start: "2024-01-20T10:00:00Z",
    scheduled_end: "2024-01-20T11:00:00Z",
    status: "completed",
    location: "Main Gym Floor",
    notes: "Great session with advanced techniques",
    max_participants: 3,
    current_participants: 2,
    trainer_name: "Mike Johnson",
    participants: [
      { id: "member-1", name: "John Doe", email: "john@example.com" },
      { id: "member-2", name: "Jane Smith", email: "jane@example.com" },
    ],
    attendance_rate: 100,
  },
  {
    id: "session-2",
    trainer_id: "trainer-123",
    scheduled_start: "2024-01-25T14:00:00Z",
    scheduled_end: "2024-01-25T15:00:00Z",
    status: "scheduled",
    location: "Studio A",
    notes: null,
    max_participants: 3,
    current_participants: 1,
    trainer_name: "Mike Johnson",
    participants: [
      { id: "member-3", name: "Bob Wilson", email: "bob@example.com" },
    ],
    attendance_rate: null,
  },
  {
    id: "session-3",
    trainer_id: "trainer-123",
    scheduled_start: "2024-01-18T09:00:00Z",
    scheduled_end: "2024-01-18T10:00:00Z",
    status: "cancelled",
    location: "Main Gym Floor",
    notes: "Trainer illness",
    max_participants: 3,
    current_participants: 0,
    trainer_name: "Mike Johnson",
    participants: [],
    attendance_rate: null,
  },
];

const mockAnalyticsData = [
  {
    trainer_id: "trainer-123",
    session_id: "session-1",
    scheduled_start: "2024-01-20T10:00:00Z",
    scheduled_end: "2024-01-20T11:00:00Z",
    status: "completed",
    max_participants: 3,
    current_participants: 2,
    attendance_rate: 66.67,
    participant_names: ["John Doe", "Jane Smith"],
  },
  {
    trainer_id: "trainer-123",
    session_id: "session-2",
    scheduled_start: "2024-01-25T14:00:00Z",
    scheduled_end: "2024-01-25T15:00:00Z",
    status: "scheduled",
    max_participants: 3,
    current_participants: 1,
    attendance_rate: 33.33,
    participant_names: ["Bob Wilson"],
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
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: mockTrainerSessions,
                    error: null,
                    count: 3,
                  })
                ),
              })),
            })),
          })),
        })),
      }));

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
      expect(supabase.from).toHaveBeenCalledWith("training_sessions_calendar");
    });

    it("should apply session filters correctly", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: mockTrainerSessions.filter(
                      (s) => s.status === "completed"
                    ),
                    error: null,
                    count: 1,
                  })
                ),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const filters = {
        status: "completed" as const,
        dateRange: {
          start: new Date("2024-01-01"),
          end: new Date("2024-01-31"),
        },
      };

      const { result } = renderHook(
        () => useTrainerSessions("trainer-123", filters),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSelect().eq).toHaveBeenCalledWith("trainer_id", "trainer-123");
      expect(mockSelect().eq().eq).toHaveBeenCalledWith("status", "completed");
    });

    it("should handle session search functionality", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() =>
                Promise.resolve({
                  data: mockTrainerSessions.slice(0, 1),
                  error: null,
                  count: 1,
                })
              ),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const filters = {
        search: "advanced techniques",
      };

      const { result } = renderHook(
        () => useTrainerSessions("trainer-123", filters),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSelect().eq().or).toHaveBeenCalledWith(
        "notes.ilike.%advanced techniques%,location.ilike.%advanced techniques%"
      );
    });

    it("should implement pagination for session lists", async () => {
      const mockRange = vi.fn(() =>
        Promise.resolve({
          data: mockTrainerSessions.slice(0, 2),
          error: null,
          count: 10,
        })
      );
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({ order: mockOrder })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const pagination = {
        page: 2,
        pageSize: 5,
      };

      const { result } = renderHook(
        () => useTrainerSessions("trainer-123", {}, pagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockRange).toHaveBeenCalledWith(5, 9); // Page 2, size 5 = range 5-9
    });

    it("should handle empty results gracefully", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({ data: [], error: null, count: 0 })
                ),
              })),
            })),
          })),
        })),
      }));

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

    it("should handle API errors", async () => {
      const mockError = new Error("Database connection failed");
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({ data: null, error: mockError, count: null })
                ),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerSessions("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe("useTrainerAnalytics Hook", () => {
    it("should fetch and calculate analytics successfully", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: mockAnalyticsData, error: null })
          ),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerAnalytics("trainer-123"), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("trainer_session_analytics");
    });

    it("should calculate session completion rates correctly", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: mockAnalyticsData, error: null })
          ),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerAnalytics("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const analytics = result.current.data;
      expect(analytics?.sessionCompletionRate).toBeDefined();
      expect(analytics?.totalSessions).toBeDefined();
      expect(analytics?.completedSessions).toBeDefined();
    });

    it("should calculate average attendance per session", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: mockAnalyticsData, error: null })
          ),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerAnalytics("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const analytics = result.current.data;
      expect(analytics?.averageAttendancePerSession).toBeDefined();
      expect(typeof analytics?.averageAttendancePerSession).toBe("number");
    });

    it("should identify peak hours and popular time slots", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: mockAnalyticsData, error: null })
          ),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerAnalytics("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const analytics = result.current.data;
      expect(analytics?.peakHours).toBeDefined();
      expect(Array.isArray(analytics?.peakHours)).toBe(true);
      if (analytics?.peakHours && analytics.peakHours.length > 0) {
        expect(analytics.peakHours[0]).toHaveProperty("time_slot");
        expect(analytics.peakHours[0]).toHaveProperty("session_count");
      }
    });

    it("should calculate client retention metrics", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: mockAnalyticsData, error: null })
          ),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerAnalytics("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const analytics = result.current.data;
      expect(analytics?.clientRetentionMetrics).toBeDefined();
      expect(analytics?.clientRetentionMetrics?.retentionRate).toBeDefined();
      expect(analytics?.clientRetentionMetrics?.newClients).toBeDefined();
      expect(analytics?.clientRetentionMetrics?.returningClients).toBeDefined();
    });

    it("should calculate utilization rate", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: mockAnalyticsData, error: null })
          ),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerAnalytics("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const analytics = result.current.data;
      expect(analytics?.utilizationRate).toBeDefined();
      expect(typeof analytics?.utilizationRate).toBe("number");
      expect(analytics?.utilizationRate).toBeGreaterThanOrEqual(0);
      expect(analytics?.utilizationRate).toBeLessThanOrEqual(100);
    });

    it("should provide monthly activity trends", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: mockAnalyticsData, error: null })
          ),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerAnalytics("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const analytics = result.current.data;
      expect(analytics?.monthlyTrends).toBeDefined();
      expect(Array.isArray(analytics?.monthlyTrends)).toBe(true);
    });

    it("should handle date range filters for analytics", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({ data: mockAnalyticsData, error: null })
              ),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const dateRange = {
        start: new Date("2024-01-01"),
        end: new Date("2024-01-31"),
      };

      const { result } = renderHook(
        () => useTrainerAnalytics("trainer-123", dateRange),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSelect().eq().gte).toHaveBeenCalledWith(
        "scheduled_start",
        "2024-01-01T00:00:00.000Z"
      );
      expect(mockSelect().eq().gte().lte).toHaveBeenCalledWith(
        "scheduled_end",
        "2024-01-31T23:59:59.999Z"
      );
    });

    it("should calculate revenue metrics when available", async () => {
      const analyticsWithRevenue = mockAnalyticsData.map((session) => ({
        ...session,
        session_price: 75.0,
        commission_rate: 0.15,
      }));

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({ data: analyticsWithRevenue, error: null })
          ),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerAnalytics("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const analytics = result.current.data;
      expect(analytics?.revenueGenerated).toBeDefined();
      expect(typeof analytics?.revenueGenerated).toBe("number");
    });

    it("should handle empty analytics data", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerAnalytics("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const analytics = result.current.data;
      expect(analytics).toBeDefined();
      expect(analytics?.totalSessions).toBe(0);
      expect(analytics?.completedSessions).toBe(0);
      expect(analytics?.sessionCompletionRate).toBe(0);
    });

    it("should handle analytics calculation errors", async () => {
      const mockError = new Error("Analytics calculation failed");
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerAnalytics("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe("Integration with Database Views", () => {
    it("should use correct database views for sessions", async () => {
      const { result } = renderHook(() => useTrainerSessions("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledWith("training_sessions_calendar");
    });

    it("should use correct database views for analytics", async () => {
      const { result } = renderHook(() => useTrainerAnalytics("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledWith("trainer_session_analytics");
    });

    it("should select appropriate fields from session views", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: mockTrainerSessions,
                    error: null,
                    count: 3,
                  })
                ),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useTrainerSessions("trainer-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSelect).toHaveBeenCalledWith(`
        id,
        trainer_id,
        scheduled_start,
        scheduled_end,
        status,
        location,
        notes,
        max_participants,
        current_participants,
        trainer_name,
        participants
      `);
    });
  });

  describe("Performance and Caching", () => {
    it("should implement proper query caching", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: mockTrainerSessions,
                    error: null,
                    count: 3,
                  })
                ),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result: result1 } = renderHook(
        () => useTrainerSessions("trainer-123"),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      // Second hook should use cached data
      const { result: result2 } = renderHook(
        () => useTrainerSessions("trainer-123"),
        { wrapper }
      );

      expect(result2.current.data).toEqual(result1.current.data);
      // Should only call API once due to caching
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it("should invalidate cache when trainer changes", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: mockTrainerSessions,
                    error: null,
                    count: 3,
                  })
                ),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result, rerender } = renderHook(
        ({ trainerId }) => useTrainerSessions(trainerId),
        { wrapper, initialProps: { trainerId: "trainer-123" } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change trainer ID should trigger new API call
      rerender({ trainerId: "trainer-456" });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledTimes(2);
    });

    it("should handle concurrent requests efficiently", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: mockTrainerSessions,
                    error: null,
                    count: 3,
                  })
                ),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      // Render multiple hooks simultaneously
      const { result: result1 } = renderHook(
        () => useTrainerSessions("trainer-123"),
        { wrapper }
      );

      const { result: result2 } = renderHook(
        () => useTrainerSessions("trainer-123"),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current.isLoading).toBe(false);
      });

      // Should dedupe concurrent requests
      expect(supabase.from).toHaveBeenCalledTimes(1);
      expect(result1.current.data).toEqual(result2.current.data);
    });
  });
});
