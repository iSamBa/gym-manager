import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useCalendarEvents,
  useCalendarNavigation,
} from "../../hooks/use-calendar-events";
import * as useTrainingSessionsModule from "../../hooks/use-training-sessions";
import type { TrainingSession, SessionFilters } from "../../lib/types";

// Mock data
const mockSessions: TrainingSession[] = [
  {
    id: "1",
    trainer_id: "trainer-1",
    scheduled_start: "2024-01-15T10:00:00Z",
    scheduled_end: "2024-01-15T11:00:00Z",
    status: "scheduled",
    max_participants: 10,
    current_participants: 5,
    location: "Room A",
    notes: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    trainer_id: "trainer-2",
    scheduled_start: "2024-01-15T14:00:00Z",
    scheduled_end: "2024-01-15T15:00:00Z",
    status: "in_progress",
    max_participants: 8,
    current_participants: 6,
    location: "Room B",
    notes: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useCalendarEvents", () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useTrainingSessionsModule, "useTrainingSessions").mockReturnValue({
      data: mockSessions,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isError: false,
      isPending: false,
      isSuccess: true,
    });
  });

  it("returns events transformed from sessions data", () => {
    const { result } = renderHook(() => useCalendarEvents(), {
      wrapper: createWrapper(),
    });

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[0]).toEqual(
      expect.objectContaining({
        id: "1",
        title: expect.stringContaining("5/10"),
        start: expect.any(Date),
        end: expect.any(Date),
        trainer_name: expect.any(String),
        participant_count: 5,
        max_participants: 10,
        location: "Room A",
        status: "scheduled",
      })
    );
  });

  it("returns empty array when no sessions data", () => {
    vi.spyOn(useTrainingSessionsModule, "useTrainingSessions").mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isError: false,
      isPending: false,
      isSuccess: true,
    });

    const { result } = renderHook(() => useCalendarEvents(), {
      wrapper: createWrapper(),
    });

    expect(result.current.events).toEqual([]);
  });

  it("forwards loading state correctly", () => {
    vi.spyOn(useTrainingSessionsModule, "useTrainingSessions").mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
      isError: false,
      isPending: true,
      isSuccess: false,
    });

    const { result } = renderHook(() => useCalendarEvents(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.events).toEqual([]);
  });

  it("forwards error state correctly", () => {
    const mockError = new Error("Failed to fetch sessions");
    vi.spyOn(useTrainingSessionsModule, "useTrainingSessions").mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: mockRefetch,
      isError: true,
      isPending: false,
      isSuccess: false,
    });

    const { result } = renderHook(() => useCalendarEvents(), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.events).toEqual([]);
  });

  it("passes filters to useTrainingSessions hook", () => {
    const filters: SessionFilters = {
      trainer_id: "trainer-1",
      status: "scheduled",
      location: "Room A",
    };

    renderHook(() => useCalendarEvents(filters), {
      wrapper: createWrapper(),
    });

    expect(useTrainingSessionsModule.useTrainingSessions).toHaveBeenCalledWith(
      filters
    );
  });

  it("exposes refetch function", () => {
    const { result } = renderHook(() => useCalendarEvents(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.refetch).toBe("function");
    expect(result.current.refetch).toBe(mockRefetch);
  });

  it("memoizes events correctly", () => {
    const { result, rerender } = renderHook(() => useCalendarEvents(), {
      wrapper: createWrapper(),
    });

    const firstResult = result.current.events;
    rerender();
    const secondResult = result.current.events;

    expect(firstResult).toBe(secondResult); // Same reference due to memoization
  });

  it("updates events when sessions data changes", () => {
    const { result, rerender } = renderHook(() => useCalendarEvents(), {
      wrapper: createWrapper(),
    });

    expect(result.current.events).toHaveLength(2);

    // Mock updated data
    const updatedSessions = [
      ...mockSessions,
      {
        id: "3",
        trainer_id: "trainer-3",
        scheduled_start: "2024-01-15T16:00:00Z",
        scheduled_end: "2024-01-15T17:00:00Z",
        status: "scheduled" as const,
        max_participants: 6,
        current_participants: 3,
        location: "Room C",
        notes: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    vi.spyOn(useTrainingSessionsModule, "useTrainingSessions").mockReturnValue({
      data: updatedSessions,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isError: false,
      isPending: false,
      isSuccess: true,
    });

    rerender();

    expect(result.current.events).toHaveLength(3);
  });
});

describe("useCalendarNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date.now to return a consistent date for testing
    vi.spyOn(Date, "now").mockReturnValue(
      new Date("2024-01-15T10:00:00Z").getTime()
    );
  });

  it("initializes with default date and week view", () => {
    const { result } = renderHook(() => useCalendarNavigation());

    expect(result.current.currentView).toBe("week");
    expect(result.current.currentDate).toBeInstanceOf(Date);
  });

  it("initializes with custom date", () => {
    const customDate = new Date("2024-02-01");
    const { result } = renderHook(() => useCalendarNavigation(customDate));

    expect(result.current.currentDate).toEqual(customDate);
  });

  it("calculates correct date range for week view", () => {
    const { result } = renderHook(() =>
      useCalendarNavigation(new Date("2024-01-15"))
    ); // Monday

    const { dateRange } = result.current;

    expect(dateRange.start).toBeInstanceOf(Date);
    expect(dateRange.end).toBeInstanceOf(Date);
    expect(dateRange.end.getTime()).toBeGreaterThan(dateRange.start.getTime());
  });

  it("calculates correct date range for month view", () => {
    const { result } = renderHook(() =>
      useCalendarNavigation(new Date("2024-01-15"))
    );

    act(() => {
      result.current.setCurrentView("month");
    });

    const { dateRange } = result.current;

    expect(dateRange.start.getDate()).toBe(1); // First day of month
    expect(dateRange.end.getDate()).toBeGreaterThan(28); // Last day of month
  });

  it("calculates correct date range for day view", () => {
    const testDate = new Date("2024-01-15");
    const { result } = renderHook(() => useCalendarNavigation(testDate));

    act(() => {
      result.current.setCurrentView("day");
    });

    const { dateRange } = result.current;

    // For day view, end date should be start date + 1 day
    expect(dateRange.end.getTime() - dateRange.start.getTime()).toBe(
      24 * 60 * 60 * 1000
    );
  });

  it("navigates to next period correctly", () => {
    const { result } = renderHook(() =>
      useCalendarNavigation(new Date("2024-01-15"))
    );

    const initialDate = result.current.currentDate;

    act(() => {
      result.current.goToNext();
    });

    const newDate = result.current.currentDate;
    expect(newDate.getTime()).toBeGreaterThan(initialDate.getTime());
  });

  it("navigates to previous period correctly", () => {
    const { result } = renderHook(() =>
      useCalendarNavigation(new Date("2024-01-15"))
    );

    const initialDate = result.current.currentDate;

    act(() => {
      result.current.goToPrevious();
    });

    const newDate = result.current.currentDate;
    expect(newDate.getTime()).toBeLessThan(initialDate.getTime());
  });

  it("navigates to today correctly", () => {
    const { result } = renderHook(() =>
      useCalendarNavigation(new Date("2024-02-15"))
    );

    act(() => {
      result.current.goToToday();
    });

    const newDate = result.current.currentDate;
    // Should be a new Date instance (close to current time)
    expect(newDate).toBeInstanceOf(Date);
  });

  it("handles view changes correctly", () => {
    const { result } = renderHook(() => useCalendarNavigation());

    expect(result.current.currentView).toBe("week");

    act(() => {
      result.current.setCurrentView("month");
    });

    expect(result.current.currentView).toBe("month");

    act(() => {
      result.current.setCurrentView("day");
    });

    expect(result.current.currentView).toBe("day");
  });

  it("handles date changes correctly", () => {
    const { result } = renderHook(() => useCalendarNavigation());

    const newDate = new Date("2024-03-01");

    act(() => {
      result.current.setCurrentDate(newDate);
    });

    expect(result.current.currentDate).toEqual(newDate);
  });

  it("updates date range when view changes", () => {
    const { result } = renderHook(() =>
      useCalendarNavigation(new Date("2024-01-15"))
    );

    const weekRange = result.current.dateRange;

    act(() => {
      result.current.setCurrentView("month");
    });

    const monthRange = result.current.dateRange;

    // Month range should be longer than week range
    const weekDuration = weekRange.end.getTime() - weekRange.start.getTime();
    const monthDuration = monthRange.end.getTime() - monthRange.start.getTime();

    expect(monthDuration).toBeGreaterThan(weekDuration);
  });

  it("updates date range when date changes", () => {
    const { result } = renderHook(() =>
      useCalendarNavigation(new Date("2024-01-15"))
    );

    const initialRange = result.current.dateRange;

    act(() => {
      result.current.setCurrentDate(new Date("2024-02-15"));
    });

    const newRange = result.current.dateRange;

    expect(newRange.start.getTime()).not.toBe(initialRange.start.getTime());
    expect(newRange.end.getTime()).not.toBe(initialRange.end.getTime());
  });

  describe("Navigation with different views", () => {
    it("navigates correctly in month view", () => {
      const { result } = renderHook(() =>
        useCalendarNavigation(new Date("2024-01-15"))
      );

      act(() => {
        result.current.setCurrentView("month");
      });

      const initialMonth = result.current.currentDate.getMonth();

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentDate.getMonth()).toBe(
        (initialMonth + 1) % 12
      );
    });

    it("navigates correctly in day view", () => {
      const { result } = renderHook(() =>
        useCalendarNavigation(new Date("2024-01-15"))
      );

      act(() => {
        result.current.setCurrentView("day");
      });

      const initialDate = result.current.currentDate.getDate();

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentDate.getDate()).toBe(initialDate + 1);
    });

    it("navigates correctly in week view", () => {
      const { result } = renderHook(() =>
        useCalendarNavigation(new Date("2024-01-15"))
      );

      const initialDate = result.current.currentDate;

      act(() => {
        result.current.goToNext();
      });

      const newDate = result.current.currentDate;
      const daysDifference =
        (newDate.getTime() - initialDate.getTime()) / (24 * 60 * 60 * 1000);

      expect(daysDifference).toBe(7);
    });
  });
});
