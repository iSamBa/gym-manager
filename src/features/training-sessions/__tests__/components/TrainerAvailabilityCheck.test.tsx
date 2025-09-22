import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TrainerAvailabilityCheck } from "../../components/forms/TrainerAvailabilityCheck";

// Mock the hook
vi.mock("../../hooks/use-trainer-availability", () => ({
  useTrainerAvailability: vi.fn(),
}));

// Mock date-fns format function
vi.mock("date-fns", () => ({
  format: vi.fn((date, formatString) => {
    if (formatString === "MMM d, h:mm a") {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return date.toString();
  }),
}));

import { useTrainerAvailability } from "../../hooks/use-trainer-availability";

describe("TrainerAvailabilityCheck", () => {
  let queryClient: QueryClient;

  const defaultProps = {
    trainerId: "trainer-123",
    startTime: "2024-12-01T09:00:00.000Z",
    endTime: "2024-12-01T10:00:00.000Z",
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const finalProps = { ...defaultProps, ...props };

    return render(
      <QueryClientProvider client={queryClient}>
        <TrainerAvailabilityCheck {...finalProps} />
      </QueryClientProvider>
    );
  };

  describe("US-005: Availability Validation System", () => {
    describe("Real-time trainer availability checking", () => {
      it("should call useTrainerAvailability with correct parameters", () => {
        const mockHook = vi.fn().mockReturnValue({
          data: null,
          isLoading: true,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });
        (useTrainerAvailability as any).mockImplementation(mockHook);

        renderComponent();

        expect(mockHook).toHaveBeenCalledWith({
          trainer_id: "trainer-123",
          start_time: "2024-12-01T09:00:00.000Z",
          end_time: "2024-12-01T10:00:00.000Z",
          exclude_session_id: undefined,
          enabled: true,
        });
      });

      it("should pass exclude_session_id when provided", () => {
        const mockHook = vi.fn().mockReturnValue({
          data: null,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });
        (useTrainerAvailability as any).mockImplementation(mockHook);

        renderComponent({ excludeSessionId: "session-456" });

        expect(mockHook).toHaveBeenCalledWith({
          trainer_id: "trainer-123",
          start_time: "2024-12-01T09:00:00.000Z",
          end_time: "2024-12-01T10:00:00.000Z",
          exclude_session_id: "session-456",
          enabled: true,
        });
      });

      it("should not render when essential data is missing", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: null,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        const { container } = renderComponent({ trainerId: "" });
        expect(container.firstChild).toBeNull();
      });

      it("should disable hook when essential data is missing", () => {
        const mockHook = vi.fn().mockReturnValue({
          data: null,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });
        (useTrainerAvailability as any).mockImplementation(mockHook);

        renderComponent({ startTime: "" });

        expect(mockHook).toHaveBeenCalledWith({
          trainer_id: "trainer-123",
          start_time: "",
          end_time: "2024-12-01T10:00:00.000Z",
          exclude_session_id: undefined,
          enabled: false,
        });
      });
    });

    describe("Loading states", () => {
      it("should show loading state while checking availability", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: null,
          isLoading: true,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        expect(
          screen.getByText("Checking trainer availability...")
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("loading-icon") || screen.getByText(/checking/i)
        ).toBeInTheDocument();
      });

      it("should show animated pulse during loading", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: null,
          isLoading: true,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        const loadingElement = screen.getByText(
          "Checking trainer availability..."
        );
        const alert = loadingElement.closest('[role="alert"]');
        expect(alert).toHaveClass("border-blue-200", "bg-blue-50");
      });
    });

    describe("Error handling and retry functionality", () => {
      it("should show error message when availability check fails", () => {
        const mockRefetch = vi.fn();
        (useTrainerAvailability as any).mockReturnValue({
          data: null,
          isLoading: false,
          error: new Error("Network error"),
          refetch: mockRefetch,
          isFetching: false,
        });

        renderComponent();

        expect(
          screen.getByText("Failed to check availability. Please try again.")
        ).toBeInTheDocument();
      });

      it("should show retry button on error", () => {
        const mockRefetch = vi.fn();
        (useTrainerAvailability as any).mockReturnValue({
          data: null,
          isLoading: false,
          error: new Error("Network error"),
          refetch: mockRefetch,
          isFetching: false,
        });

        renderComponent();

        const retryButton = screen.getByRole("button");
        expect(retryButton).toBeInTheDocument();
      });

      it("should call refetch when retry button is clicked", async () => {
        const mockRefetch = vi.fn();
        (useTrainerAvailability as any).mockReturnValue({
          data: null,
          isLoading: false,
          error: new Error("Network error"),
          refetch: mockRefetch,
          isFetching: false,
        });

        renderComponent();

        const retryButton = screen.getByRole("button");
        await userEvent.click(retryButton);

        expect(mockRefetch).toHaveBeenCalled();
      });

      it("should disable retry button while fetching", () => {
        const mockRefetch = vi.fn();
        (useTrainerAvailability as any).mockReturnValue({
          data: null,
          isLoading: false,
          error: new Error("Network error"),
          refetch: mockRefetch,
          isFetching: true,
        });

        renderComponent();

        const retryButton = screen.getByRole("button");
        expect(retryButton).toBeDisabled();
      });

      it("should show spinning icon during retry", () => {
        const mockRefetch = vi.fn();
        (useTrainerAvailability as any).mockReturnValue({
          data: null,
          isLoading: false,
          error: new Error("Network error"),
          refetch: mockRefetch,
          isFetching: true,
        });

        renderComponent();

        // Should show spinning refresh icon
        const refreshIcon =
          screen.getByTestId("refresh-icon") ||
          document.querySelector(".animate-spin");
        expect(refreshIcon).toBeInTheDocument();
      });
    });

    describe("Available state display", () => {
      it("should show success state when trainer is available", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: true,
            conflicts: [],
            message: "Trainer is available for this time slot",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        expect(
          screen.getByText("Trainer is available for this time slot")
        ).toBeInTheDocument();
        expect(screen.getByText("Available")).toBeInTheDocument();
      });

      it("should use default message when none provided", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: true,
            conflicts: [],
            message: null,
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        expect(
          screen.getByText("Trainer is available for this time slot")
        ).toBeInTheDocument();
      });

      it("should apply success styling for available state", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: true,
            conflicts: [],
            message: "Available",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        const alert = screen.getByText("Available").closest('[role="alert"]');
        expect(alert).toHaveClass("border-green-200", "bg-green-50");
      });
    });

    describe("Conflict detection and display", () => {
      const mockConflicts = [
        {
          id: "session-1",
          scheduled_start: "2024-12-01T09:30:00.000Z",
          scheduled_end: "2024-12-01T10:30:00.000Z",
          location: "Main Gym",
          max_participants: 5,
          current_participants: 3,
        },
        {
          id: "session-2",
          scheduled_start: "2024-12-01T09:15:00.000Z",
          scheduled_end: "2024-12-01T09:45:00.000Z",
          location: "Studio A",
          max_participants: 2,
          current_participants: 1,
        },
      ];

      it("should show conflict state when trainer is not available", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: false,
            conflicts: mockConflicts,
            message: "Trainer has 2 conflicting sessions during this time",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        expect(
          screen.getByText(
            "Trainer has 2 conflicting sessions during this time"
          )
        ).toBeInTheDocument();
        expect(screen.getByText("Conflicts Found")).toBeInTheDocument();
      });

      it("should display conflict details", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: false,
            conflicts: mockConflicts,
            message: "Trainer is not available",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        expect(screen.getByText("Conflicting Sessions:")).toBeInTheDocument();
        expect(screen.getByText("at Main Gym")).toBeInTheDocument();
        expect(screen.getByText("at Studio A")).toBeInTheDocument();
        expect(screen.getByText("3/5")).toBeInTheDocument(); // participant count
        expect(screen.getByText("1/2")).toBeInTheDocument();
      });

      it("should format conflict times correctly", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: false,
            conflicts: mockConflicts.slice(0, 1),
            message: "Conflict detected",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        // Check that format function is called for displaying times
        expect(
          screen.getByText(/Dec 1, 9:30 AM - Dec 1, 10:30 AM/i)
        ).toBeInTheDocument();
      });

      it("should limit displayed conflicts to 3 maximum", () => {
        const manyConflicts = Array(5)
          .fill(null)
          .map((_, index) => ({
            id: `session-${index}`,
            scheduled_start: "2024-12-01T09:00:00.000Z",
            scheduled_end: "2024-12-01T10:00:00.000Z",
            location: `Location ${index}`,
            max_participants: 2,
            current_participants: 1,
          }));

        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: false,
            conflicts: manyConflicts,
            message: "Multiple conflicts",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        expect(
          screen.getByText("...and 2 more conflicting sessions")
        ).toBeInTheDocument();
      });

      it("should handle conflicts without location", () => {
        const conflictWithoutLocation = [
          {
            id: "session-1",
            scheduled_start: "2024-12-01T09:00:00.000Z",
            scheduled_end: "2024-12-01T10:00:00.000Z",
            location: null,
            max_participants: 2,
            current_participants: 1,
          },
        ];

        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: false,
            conflicts: conflictWithoutLocation,
            message: "Conflict detected",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        // Should not show "at null" or similar
        expect(screen.queryByText("at null")).not.toBeInTheDocument();
      });

      it("should apply error styling for conflict state", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: false,
            conflicts: mockConflicts,
            message: "Conflicts found",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        const alert = screen
          .getByText("Conflicts Found")
          .closest('[role="alert"]');
        expect(alert).toHaveClass("border-red-500"); // or similar destructive styling
      });
    });

    describe("Real-time refresh functionality", () => {
      it("should show refresh button in conflict state", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: false,
            conflicts: [],
            message: "Not available",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        expect(screen.getByText("Refresh")).toBeInTheDocument();
      });

      it("should call refetch when refresh button is clicked", async () => {
        const mockRefetch = vi.fn();
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: false,
            conflicts: [],
            message: "Not available",
          },
          isLoading: false,
          error: null,
          refetch: mockRefetch,
          isFetching: false,
        });

        renderComponent();

        const refreshButton = screen.getByText("Refresh");
        await userEvent.click(refreshButton);

        expect(mockRefetch).toHaveBeenCalled();
      });

      it("should disable refresh button during fetch", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: false,
            conflicts: [],
            message: "Not available",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: true,
        });

        renderComponent();

        const refreshButton = screen.getByText("Refresh");
        expect(refreshButton).toBeDisabled();
      });

      it("should show spinning icon during refresh", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: false,
            conflicts: [],
            message: "Not available",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: true,
        });

        renderComponent();

        const spinningIcon = document.querySelector(".animate-spin");
        expect(spinningIcon).toBeInTheDocument();
      });
    });

    describe("Edge cases and error handling", () => {
      it("should handle invalid date formats gracefully", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: false,
            conflicts: [
              {
                id: "session-1",
                scheduled_start: "invalid-date",
                scheduled_end: "invalid-date",
                location: "Test Gym",
                max_participants: 2,
                current_participants: 1,
              },
            ],
            message: "Conflict detected",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        // Should not crash and should fallback to showing the raw string
        expect(
          screen.getByText("invalid-date - invalid-date")
        ).toBeInTheDocument();
      });

      it("should handle missing participant counts", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: false,
            conflicts: [
              {
                id: "session-1",
                scheduled_start: "2024-12-01T09:00:00.000Z",
                scheduled_end: "2024-12-01T10:00:00.000Z",
                location: "Test Gym",
                max_participants: null,
                current_participants: null,
              },
            ],
            message: "Conflict detected",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent();

        expect(screen.getByText("0/0")).toBeInTheDocument();
      });

      it("should not render anything when availability data is null", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: null,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        const { container } = renderComponent();
        expect(container.firstChild).toBeNull();
      });
    });

    describe("Custom className support", () => {
      it("should apply custom className to container", () => {
        (useTrainerAvailability as any).mockReturnValue({
          data: {
            available: true,
            conflicts: [],
            message: "Available",
          },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isFetching: false,
        });

        renderComponent({ className: "custom-availability-check" });

        const container = screen
          .getByText("Available")
          .closest(".custom-availability-check");
        expect(container).toBeInTheDocument();
      });
    });
  });
});
