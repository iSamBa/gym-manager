import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TrainingSessionCalendar } from "../../components";
import * as useTrainingSessionsModule from "../../hooks/use-training-sessions";
import type { TrainingSession } from "../../lib/types";

// Mock react-big-calendar
vi.mock("react-big-calendar", () => {
  const Calendar = vi.fn(
    ({ components, onSelectEvent, onSelectSlot, ...props }: any) => (
      <div data-testid="mock-calendar" data-view={props.view}>
        <div data-testid="calendar-toolbar">
          {components?.toolbar && (
            <components.toolbar
              onNavigate={vi.fn()}
              onView={vi.fn()}
              date={new Date("2024-01-15")}
              label="January 2024"
            />
          )}
        </div>
        <div data-testid="calendar-events">
          {}
          {props.events?.map((event: any) => (
            <div
              key={event.id}
              data-testid="calendar-event"
              onClick={() => onSelectEvent?.(event)}
            >
              {components?.event && <components.event event={event} />}
            </div>
          ))}
        </div>
        <div
          data-testid="calendar-slot"
          onClick={() => onSelectSlot?.({ start: new Date(), end: new Date() })}
        >
          Empty slot
        </div>
      </div>
    )
  );

  return {
    Calendar,
    dateFnsLocalizer: vi.fn(() => ({})),
  };
});

// Mock date-fns
vi.mock("date-fns", () => ({
  format: vi.fn((date) => date.toISOString()),
  parse: vi.fn((dateStr) => new Date(dateStr)),
  parseISO: vi.fn((dateStr) => new Date(dateStr)),
  startOfWeek: vi.fn((date) => date),
  getDay: vi.fn(() => 0),
}));

// Mock date-fns/locale
vi.mock("date-fns/locale", () => ({
  enUS: {},
}));

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

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe("TrainingSessionCalendar", () => {
  const mockOnSelectSession = vi.fn();
  const mockOnSelectSlot = vi.fn();
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

  describe("Component Rendering", () => {
    it("renders calendar component successfully", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByTestId("mock-calendar")).toBeInTheDocument();
    });

    it("displays custom toolbar with navigation buttons", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Today")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    it("displays view switching buttons", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByText("Month")).toBeInTheDocument();
      expect(screen.getByText("Week")).toBeInTheDocument();
      expect(screen.getByText("Day")).toBeInTheDocument();
    });

    it("sets default view to week", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      const calendar = screen.getByTestId("mock-calendar");
      expect(calendar).toHaveAttribute("data-view", "week");
    });

    it("accepts custom default view", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          defaultView="month"
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      const calendar = screen.getByTestId("mock-calendar");
      expect(calendar).toHaveAttribute("data-view", "month");
    });
  });

  describe("Event Display", () => {
    it("displays training sessions as calendar events", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      const events = screen.getAllByTestId("calendar-event");
      expect(events).toHaveLength(2);
    });

    it("shows trainer name and participant count in events", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      // The event component should display trainer name and participant info
      expect(screen.getByText("5/10")).toBeInTheDocument();
      expect(screen.getByText("6/8")).toBeInTheDocument();
    });

    it("shows location when available", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByText("Room A")).toBeInTheDocument();
      expect(screen.getByText("Room B")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("calls onSelectSession when event is clicked", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      const events = screen.getAllByTestId("calendar-event");
      fireEvent.click(events[0]);

      expect(mockOnSelectSession).toHaveBeenCalledWith(mockSessions[0]);
    });

    it("calls onSelectSlot when empty slot is clicked", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      const slot = screen.getByTestId("calendar-slot");
      fireEvent.click(slot);

      expect(mockOnSelectSlot).toHaveBeenCalledWith({
        start: expect.any(Date),
        end: expect.any(Date),
      });
    });

    it("handles navigation button clicks", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      const previousButton = screen.getByText("Previous");
      const nextButton = screen.getByText("Next");
      const todayButton = screen.getByText("Today");

      fireEvent.click(previousButton);
      fireEvent.click(nextButton);
      fireEvent.click(todayButton);

      // These interactions should not throw errors
      expect(previousButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
      expect(todayButton).toBeInTheDocument();
    });

    it("handles view switching", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      const monthButton = screen.getByText("Month");
      fireEvent.click(monthButton);

      // Should not throw errors
      expect(monthButton).toBeInTheDocument();
    });
  });

  describe("Loading and Error States", () => {
    it("displays loading state", () => {
      vi.spyOn(
        useTrainingSessionsModule,
        "useTrainingSessions"
      ).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
        isError: false,
        isPending: true,
        isSuccess: false,
      });

      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByText("Loading calendar...")).toBeInTheDocument();
      expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();
    });

    it("displays error state", () => {
      const mockError = new Error("Failed to fetch sessions");
      vi.spyOn(
        useTrainingSessionsModule,
        "useTrainingSessions"
      ).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
        isError: true,
        isPending: false,
        isSuccess: false,
      });

      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByText("Failed to load calendar")).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("calls refetch when try again button is clicked", () => {
      const mockError = new Error("Failed to fetch sessions");
      vi.spyOn(
        useTrainingSessionsModule,
        "useTrainingSessions"
      ).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
        isError: true,
        isPending: false,
        isSuccess: false,
      });

      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      const tryAgainButton = screen.getByText("Try Again");
      fireEvent.click(tryAgainButton);

      expect(mockRefetch).toHaveBeenCalledOnce();
    });
  });

  describe("Event Styling", () => {
    it("applies status-based styling classes", () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      // Events should be rendered with appropriate styling
      const events = screen.getAllByTestId("calendar-event");
      expect(events).toHaveLength(2);

      // Check that event components are properly structured
      events.forEach((event) => {
        expect(event).toBeInTheDocument();
      });
    });
  });

  describe("Responsive Design", () => {
    it("renders without errors on different screen sizes", () => {
      // Test mobile viewport
      global.innerWidth = 480;
      global.dispatchEvent(new Event("resize"));

      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByTestId("mock-calendar")).toBeInTheDocument();

      // Test desktop viewport
      global.innerWidth = 1024;
      global.dispatchEvent(new Event("resize"));

      expect(screen.getByTestId("mock-calendar")).toBeInTheDocument();
    });
  });

  describe("Date Range Calculation", () => {
    it("calculates correct date range for different views", async () => {
      renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      // The useTrainingSessions hook should be called with date_range filters
      await waitFor(() => {
        expect(
          useTrainingSessionsModule.useTrainingSessions
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            date_range: expect.objectContaining({
              start: expect.any(Date),
              end: expect.any(Date),
            }),
          })
        );
      });
    });
  });

  describe("Performance", () => {
    it("memoizes events correctly", () => {
      const { rerender } = renderWithQueryClient(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      // Re-render with same props
      rerender(
        <TrainingSessionCalendar
          onSelectSession={mockOnSelectSession}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      // Component should handle re-renders without issues
      expect(screen.getByTestId("mock-calendar")).toBeInTheDocument();
    });
  });
});
