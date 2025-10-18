import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TimeSlot } from "../TimeSlot";
import type {
  Machine,
  TimeSlot as TimeSlotType,
  TrainingSession,
} from "../../lib/types";

// Mock useSessionAlerts hook
vi.mock("../../hooks/use-session-alerts", () => ({
  useSessionAlerts: vi.fn(),
}));

// Mock usePlanningSettings hook
vi.mock("@/features/settings/hooks/use-planning-settings", () => ({
  usePlanningSettings: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

import { useSessionAlerts } from "../../hooks/use-session-alerts";

// Helper to render with QueryClient
const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

const mockMachine: Machine = {
  id: "machine-1",
  machine_number: 1,
  name: "Machine 1",
  is_available: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const mockTimeSlot: TimeSlotType = {
  start: new Date("2025-01-15T09:00:00Z"),
  end: new Date("2025-01-15T09:30:00Z"),
  label: "09:00 - 09:30",
  hour: 9,
  minute: 0,
};

describe("TimeSlot", () => {
  beforeEach(() => {
    // Reset mock before each test
    vi.clearAllMocks();
    // Default mock returns empty array (no alerts)
    vi.mocked(useSessionAlerts).mockReturnValue({
      data: [],
    } as any);
  });

  describe("Empty Slot", () => {
    it("renders empty slot with time label", () => {
      const onClick = vi.fn();

      renderWithQueryClient(
        <TimeSlot
          machine={mockMachine}
          timeSlot={mockTimeSlot}
          onClick={onClick}
        />
      );

      expect(screen.getByText("09:00 - 09:30")).toBeInTheDocument();
    });

    it("is clickable when machine is available", () => {
      const onClick = vi.fn();

      renderWithQueryClient(
        <TimeSlot
          machine={mockMachine}
          timeSlot={mockTimeSlot}
          onClick={onClick}
        />
      );

      const slot = screen.getByTestId("time-slot");
      fireEvent.click(slot);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("is not clickable when machine is unavailable", () => {
      const onClick = vi.fn();
      const unavailableMachine = { ...mockMachine, is_available: false };

      renderWithQueryClient(
        <TimeSlot
          machine={unavailableMachine}
          timeSlot={mockTimeSlot}
          onClick={onClick}
        />
      );

      const slot = screen.getByTestId("time-slot");
      fireEvent.click(slot);

      expect(onClick).not.toHaveBeenCalled();
    });

    it("shows disabled state for unavailable machine", () => {
      const unavailableMachine = { ...mockMachine, is_available: false };

      const { container } = renderWithQueryClient(
        <TimeSlot
          machine={unavailableMachine}
          timeSlot={mockTimeSlot}
          onClick={vi.fn()}
        />
      );

      const slot = container.firstChild as HTMLElement;
      expect(slot).toHaveClass("cursor-not-allowed");
      expect(slot).toHaveClass("opacity-50");
    });
  });

  describe("Booked Slot", () => {
    const mockSession: TrainingSession = {
      id: "session-1",
      machine_id: "machine-1",
      trainer_id: "trainer-1",
      scheduled_start: "2025-01-15T09:00:00Z",
      scheduled_end: "2025-01-15T09:30:00Z",
      status: "scheduled",
      current_participants: 1,
      notes: null,
      participants: [
        {
          id: "member-1",
          name: "John Doe",
          email: "john@example.com",
        },
      ],
    };

    it("renders booked slot with member name", () => {
      renderWithQueryClient(
        <TimeSlot
          machine={mockMachine}
          timeSlot={mockTimeSlot}
          session={mockSession}
          onClick={vi.fn()}
        />
      );

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("09:00 - 09:30")).toBeInTheDocument();
    });

    it("shows 'Unknown Member' when no participants", () => {
      const sessionWithoutParticipants = {
        ...mockSession,
        participants: [],
      };

      renderWithQueryClient(
        <TimeSlot
          machine={mockMachine}
          timeSlot={mockTimeSlot}
          session={sessionWithoutParticipants}
          onClick={vi.fn()}
        />
      );

      expect(screen.getByText("Unknown Member")).toBeInTheDocument();
    });

    it("is clickable to view session details", () => {
      const onClick = vi.fn();

      renderWithQueryClient(
        <TimeSlot
          machine={mockMachine}
          timeSlot={mockTimeSlot}
          session={mockSession}
          onClick={onClick}
        />
      );

      const slot = screen.getByTestId("time-slot");
      fireEvent.click(slot);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  // Note: Date-based color logic is tested in session-colors.test.ts
  // Component tests focus on user interactions and rendering behavior

  describe("Notification Badge", () => {
    const mockSession: TrainingSession = {
      id: "session-1",
      machine_id: "machine-1",
      trainer_id: "trainer-1",
      scheduled_start: "2025-01-15T09:00:00Z",
      scheduled_end: "2025-01-15T09:30:00Z",
      status: "scheduled",
      current_participants: 1,
      notes: null,
      participants: [
        {
          id: "member-1",
          name: "John Doe",
          email: "john@example.com",
        },
      ],
    };

    it("shows notification badge when alerts are present", () => {
      // Mock hook to return alerts (array of 3 comments)
      vi.mocked(useSessionAlerts).mockReturnValue({
        data: [
          {
            id: "comment-1",
            due_date: "2025-01-20",
            author: "Admin",
            body: "Alert 1",
            member_id: "member-1",
            created_at: "2025-01-10T10:00:00Z",
            updated_at: "2025-01-10T10:00:00Z",
          },
          {
            id: "comment-2",
            due_date: "2025-01-21",
            author: "Admin",
            body: "Alert 2",
            member_id: "member-1",
            created_at: "2025-01-10T10:00:00Z",
            updated_at: "2025-01-10T10:00:00Z",
          },
          {
            id: "comment-3",
            due_date: "2025-01-22",
            author: "Admin",
            body: "Alert 3",
            member_id: "member-1",
            created_at: "2025-01-10T10:00:00Z",
            updated_at: "2025-01-10T10:00:00Z",
          },
        ],
      } as any);

      renderWithQueryClient(
        <TimeSlot
          machine={mockMachine}
          timeSlot={mockTimeSlot}
          session={mockSession}
          onClick={vi.fn()}
        />
      );

      expect(screen.getByTestId("notification-badge")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("does not show badge when alert count is 0", () => {
      // Mock hook to return empty array (0 alerts)
      vi.mocked(useSessionAlerts).mockReturnValue({
        data: [],
      } as any);

      const { container } = renderWithQueryClient(
        <TimeSlot
          machine={mockMachine}
          timeSlot={mockTimeSlot}
          session={mockSession}
          onClick={vi.fn()}
        />
      );

      // Badge should not exist
      const badge = container.querySelector(
        '[data-testid="notification-badge"]'
      );
      expect(badge).not.toBeInTheDocument();
    });

    it("does not show badge when no alert data", () => {
      // Mock hook to return empty array (no alerts)
      vi.mocked(useSessionAlerts).mockReturnValue({
        data: [],
      } as any);

      const { container } = renderWithQueryClient(
        <TimeSlot
          machine={mockMachine}
          timeSlot={mockTimeSlot}
          session={mockSession}
          onClick={vi.fn()}
        />
      );

      // Badge should not exist
      const badge = container.querySelector(
        '[data-testid="notification-badge"]'
      );
      expect(badge).not.toBeInTheDocument();
    });
  });
});
