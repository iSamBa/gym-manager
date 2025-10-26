/**
 * Multi-Site Sessions Hook Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMultiSiteSessions } from "../use-multi-site-sessions";
import * as multiSiteDb from "../../lib/multi-site-sessions-db";

// Mock dependencies
vi.mock("../../lib/multi-site-sessions-db");

describe("useMultiSiteSessions", () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockSessions = [
    {
      id: "session-1",
      scheduled_start: "2025-10-18T10:00:00Z",
      guest_first_name: "John",
      guest_last_name: "Doe",
      guest_gym_name: "Downtown Studio",
      trainer_id: "trainer-1",
      trainer_name: "Jane Smith",
      status: "completed" as const,
      notes: "Test session",
      session_date: "2025-10-18",
      session_time: "10:00",
    },
    {
      id: "session-2",
      scheduled_start: "2025-10-19T14:00:00Z",
      guest_first_name: "Alice",
      guest_last_name: "Johnson",
      guest_gym_name: "Uptown Studio",
      trainer_id: "trainer-2",
      trainer_name: "Bob Wilson",
      status: "scheduled" as const,
      notes: null,
      session_date: "2025-10-19",
      session_time: "14:00",
    },
  ];

  const mockStudios = ["Downtown Studio", "Uptown Studio"];

  it("should fetch sessions and studios on mount", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue(mockSessions);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    const { result } = renderHook(() => useMultiSiteSessions(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toEqual(mockSessions);
    expect(result.current.originStudios).toEqual(mockStudios);
    expect(multiSiteDb.getMultiSiteSessions).toHaveBeenCalledWith({});
    expect(multiSiteDb.getOriginStudios).toHaveBeenCalled();
  });

  it("should update search filter", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue(mockSessions);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    const { result } = renderHook(() => useMultiSiteSessions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSearch("John");
    });

    await waitFor(() => {
      expect(result.current.filters.search).toBe("John");
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("should update date range filter", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue(mockSessions);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    const { result } = renderHook(() => useMultiSiteSessions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setDateRange("2025-10-01", "2025-10-31");
    });

    await waitFor(() => {
      expect(result.current.filters.date_from).toBe("2025-10-01");
      expect(result.current.filters.date_to).toBe("2025-10-31");
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("should update origin studio filter", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue(mockSessions);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    const { result } = renderHook(() => useMultiSiteSessions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setOriginStudio("Downtown Studio");
    });

    await waitFor(() => {
      expect(result.current.filters.origin_studio).toBe("Downtown Studio");
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("should clear all filters", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue(mockSessions);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    const { result } = renderHook(() => useMultiSiteSessions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Set some filters
    act(() => {
      result.current.setSearch("John");
      result.current.setDateRange("2025-10-01", "2025-10-31");
      result.current.setOriginStudio("Downtown Studio");
    });

    await waitFor(() => {
      expect(result.current.hasActiveFilters).toBe(true);
    });

    // Clear all filters
    act(() => {
      result.current.clearFilters();
    });

    await waitFor(() => {
      expect(result.current.filters).toEqual({});
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  it("should refetch sessions when filters change", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue(mockSessions);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    const { result } = renderHook(() => useMultiSiteSessions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Change filter
    act(() => {
      result.current.setSearch("John");
    });

    // Should trigger refetch with new filters
    await waitFor(() => {
      expect(multiSiteDb.getMultiSiteSessions).toHaveBeenCalledWith({
        search: "John",
      });
    });
  });

  it("should handle empty results", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockResolvedValue([]);
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue([]);

    const { result } = renderHook(() => useMultiSiteSessions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toEqual([]);
    expect(result.current.originStudios).toEqual([]);
  });

  it("should handle errors gracefully", async () => {
    vi.mocked(multiSiteDb.getMultiSiteSessions).mockRejectedValue(
      new Error("Fetch failed")
    );
    vi.mocked(multiSiteDb.getOriginStudios).mockResolvedValue(mockStudios);

    const { result } = renderHook(() => useMultiSiteSessions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });
});
