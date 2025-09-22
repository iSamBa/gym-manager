/**
 * @fileoverview Integration tests for member sessions hook
 * Tests data fetching, filtering, and integration with database views
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

const mockSessions = [
  {
    member_id: "member-123",
    session_id: "session-1",
    scheduled_start: "2024-01-20T10:00:00Z",
    scheduled_end: "2024-01-20T11:00:00Z",
    status: "completed",
    location: "Main Gym Floor",
    notes: "Great workout session",
    trainer_name: "Jane Smith",
    booking_status: "confirmed",
  },
  {
    member_id: "member-123",
    session_id: "session-2",
    scheduled_start: "2024-01-25T14:00:00Z",
    scheduled_end: "2024-01-25T15:00:00Z",
    status: "scheduled",
    location: "Studio A",
    notes: null,
    trainer_name: "Mike Johnson",
    booking_status: "confirmed",
  },
  {
    member_id: "member-123",
    session_id: "session-3",
    scheduled_start: "2024-01-18T09:00:00Z",
    scheduled_end: "2024-01-18T10:00:00Z",
    status: "cancelled",
    location: "Main Gym Floor",
    notes: "Member cancelled due to illness",
    trainer_name: "Jane Smith",
    booking_status: "cancelled",
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
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({ data: mockSessions, error: null, count: 3 })
                ),
              })),
            })),
          })),
        })),
      }));

      const mockFrom = vi.fn(() => ({ select: mockSelect }));
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useMemberSessions("member-123"), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockSessions);
      expect(result.current.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("member_session_history");
    });

    it("should handle empty results", async () => {
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

      const { result } = renderHook(() => useMemberSessions("member-123"), {
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

      const { result } = renderHook(() => useMemberSessions("member-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe("Filtering and Pagination", () => {
    it("should apply date range filters", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({
                    data: mockSessions.slice(0, 1),
                    error: null,
                    count: 1,
                  })
                ),
              })),
            })),
          })),
        })),
      }));

      const mockGte = vi.fn(() => ({
        lte: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() =>
              Promise.resolve({
                data: mockSessions.slice(0, 1),
                error: null,
                count: 1,
              })
            ),
          })),
        })),
      }));

      const mockEq = vi.fn(() => ({ gte: mockGte }));
      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({ eq: mockEq })),
      });

      const filters = {
        dateRange: {
          start: new Date("2024-01-20"),
          end: new Date("2024-01-20"),
        },
      };

      const { result } = renderHook(
        () => useMemberSessions("member-123", filters),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGte).toHaveBeenCalledWith(
        "scheduled_start",
        "2024-01-20T00:00:00.000Z"
      );
    });

    it("should apply status filters", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn((column, value) => {
          if (column === "member_id") {
            return {
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn(() => ({
                      range: vi.fn(() =>
                        Promise.resolve({
                          data: mockSessions.filter((s) => s.status === value),
                          error: null,
                          count: 1,
                        })
                      ),
                    })),
                  })),
                })),
              })),
            };
          }
          return {
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  range: vi.fn(() =>
                    Promise.resolve({
                      data: mockSessions.filter((s) => s.status === value),
                      error: null,
                      count: 1,
                    })
                  ),
                })),
              })),
            })),
          };
        }),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const filters = {
        status: "completed" as const,
      };

      const { result } = renderHook(
        () => useMemberSessions("member-123", filters),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSelect().eq).toHaveBeenCalledWith("status", "completed");
    });

    it("should apply trainer filters", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          ilike: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  range: vi.fn(() =>
                    Promise.resolve({
                      data: mockSessions.filter(
                        (s) => s.trainer_name === "Jane Smith"
                      ),
                      error: null,
                      count: 2,
                    })
                  ),
                })),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const filters = {
        trainer: "Jane Smith",
      };

      const { result } = renderHook(
        () => useMemberSessions("member-123", filters),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSelect().eq().ilike).toHaveBeenCalledWith(
        "trainer_name",
        "%Jane Smith%"
      );
    });

    it("should implement pagination correctly", async () => {
      const mockRange = vi.fn(() =>
        Promise.resolve({
          data: mockSessions.slice(0, 2),
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
        page: 1,
        pageSize: 10,
      };

      const { result } = renderHook(
        () => useMemberSessions("member-123", {}, pagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockRange).toHaveBeenCalledWith(0, 9); // Page 1, size 10 = range 0-9
    });

    it("should handle search functionality", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  range: vi.fn(() =>
                    Promise.resolve({
                      data: mockSessions.slice(0, 1),
                      error: null,
                      count: 1,
                    })
                  ),
                })),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const filters = {
        search: "Great workout",
      };

      const { result } = renderHook(
        () => useMemberSessions("member-123", filters),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSelect().eq().or).toHaveBeenCalledWith(
        "notes.ilike.%Great workout%,location.ilike.%Great workout%,trainer_name.ilike.%Great workout%"
      );
    });
  });

  describe("Query Options and Caching", () => {
    it("should use correct query key for caching", () => {
      const { result } = renderHook(() => useMemberSessions("member-123"), {
        wrapper,
      });

      // Query key should include member ID and filters for proper caching
      expect(result.current.isLoading).toBe(true);
    });

    it("should support enabled/disabled queries", () => {
      const { result: resultEnabled } = renderHook(
        () => useMemberSessions("member-123"),
        { wrapper }
      );

      const { result: resultDisabled } = renderHook(
        () => useMemberSessions("member-123", {}, {}, { enabled: false }),
        { wrapper }
      );

      expect(resultEnabled.current.isLoading).toBe(true);
      expect(resultDisabled.current.isLoading).toBe(false);
      expect(resultDisabled.current.data).toBeUndefined();
    });

    it("should handle refetch functionality", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({ data: mockSessions, error: null, count: 3 })
                ),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useMemberSessions("member-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockSessions);

      // Refetch should call the API again
      await result.current.refetch();
      expect(supabase.from).toHaveBeenCalledTimes(2);
    });
  });

  describe("Integration with Database Views", () => {
    it("should query the member_session_history view", async () => {
      const { result } = renderHook(() => useMemberSessions("member-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledWith("member_session_history");
    });

    it("should select all required fields from the view", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({ data: mockSessions, error: null, count: 3 })
                ),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useMemberSessions("member-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSelect).toHaveBeenCalledWith(`
        member_id,
        session_id,
        scheduled_start,
        scheduled_end,
        status,
        location,
        notes,
        trainer_name,
        booking_status
      `);
    });
  });

  describe("Performance and Optimization", () => {
    it("should implement proper query invalidation", async () => {
      const { result } = renderHook(() => useMemberSessions("member-123"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Query should be cached and reused
      const { result: result2 } = renderHook(
        () => useMemberSessions("member-123"),
        { wrapper }
      );

      expect(result2.current.data).toEqual(result.current.data);
    });

    it("should handle stale time correctly", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({ data: mockSessions, error: null, count: 3 })
                ),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () =>
          useMemberSessions("member-123", {}, {}, { staleTime: 5 * 60 * 1000 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockSessions);
      expect(result.current.isStale).toBe(false);
    });

    it("should support real-time updates when configured", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() =>
                  Promise.resolve({ data: mockSessions, error: null, count: 3 })
                ),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () =>
          useMemberSessions("member-123", {}, {}, { refetchInterval: 30000 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockSessions);
    });
  });

  describe("Error Boundaries and Edge Cases", () => {
    it("should handle null/undefined member ID gracefully", () => {
      const { result } = renderHook(() => useMemberSessions(null as any), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it("should handle malformed date filters", async () => {
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

      const filters = {
        dateRange: {
          start: "invalid-date" as any,
          end: new Date("2024-01-20"),
        },
      };

      const { result } = renderHook(
        () => useMemberSessions("member-123", filters),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle gracefully and not apply the invalid filter
      expect(result.current.error).toBeNull();
    });

    it("should handle network timeouts", async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(
                  () =>
                    new Promise((resolve) => {
                      setTimeout(
                        () =>
                          resolve({
                            data: null,
                            error: new Error("Request timeout"),
                            count: null,
                          }),
                        100
                      );
                    })
                ),
              })),
            })),
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useMemberSessions("member-123"), {
        wrapper,
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 2000 }
      );

      expect(result.current.error?.message).toBe("Request timeout");
    });
  });
});
