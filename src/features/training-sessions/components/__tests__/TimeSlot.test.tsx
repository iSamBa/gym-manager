import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

import { useSessionAlerts } from "../../hooks/use-session-alerts";

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
    // Default mock returns no alerts
    vi.mocked(useSessionAlerts).mockReturnValue({
      data: null,
    } as any);
  });

  describe("Empty Slot", () => {
    it("renders empty slot with time label", () => {
      const onClick = vi.fn();

      render(
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

      render(
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

      render(
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

      const { container } = render(
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
      render(
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

      render(
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

      render(
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

  describe("Status Colors", () => {
    const createSessionWithStatus = (
      status: TrainingSession["status"]
    ): TrainingSession => ({
      id: "session-1",
      machine_id: "machine-1",
      trainer_id: "trainer-1",
      scheduled_start: "2025-01-15T09:00:00Z",
      scheduled_end: "2025-01-15T09:30:00Z",
      status,
      current_participants: 1,
      notes: null,
      participants: [
        {
          id: "member-1",
          name: "John Doe",
          email: "john@example.com",
        },
      ],
    });

    it("applies blue color for scheduled sessions", () => {
      const session = createSessionWithStatus("scheduled");

      const { container } = render(
        <TimeSlot
          machine={mockMachine}
          timeSlot={mockTimeSlot}
          session={session}
          onClick={vi.fn()}
        />
      );

      const slot = container.firstChild as HTMLElement;
      expect(slot).toHaveClass("bg-blue-100");
      expect(slot).toHaveClass("border-blue-300");
      expect(slot).toHaveClass("text-blue-800");
    });

    it("applies orange color for in_progress sessions", () => {
      const session = createSessionWithStatus("in_progress");

      const { container } = render(
        <TimeSlot
          machine={mockMachine}
          timeSlot={mockTimeSlot}
          session={session}
          onClick={vi.fn()}
        />
      );

      const slot = container.firstChild as HTMLElement;
      expect(slot).toHaveClass("bg-orange-100");
      expect(slot).toHaveClass("border-orange-300");
      expect(slot).toHaveClass("text-orange-800");
    });

    it("applies green color for completed sessions", () => {
      const session = createSessionWithStatus("completed");

      const { container } = render(
        <TimeSlot
          machine={mockMachine}
          timeSlot={mockTimeSlot}
          session={session}
          onClick={vi.fn()}
        />
      );

      const slot = container.firstChild as HTMLElement;
      expect(slot).toHaveClass("bg-green-100");
      expect(slot).toHaveClass("border-green-300");
      expect(slot).toHaveClass("text-green-800");
    });

    it("applies gray color with strikethrough for cancelled sessions", () => {
      const session = createSessionWithStatus("cancelled");

      const { container } = render(
        <TimeSlot
          machine={mockMachine}
          timeSlot={mockTimeSlot}
          session={session}
          onClick={vi.fn()}
        />
      );

      const slot = container.firstChild as HTMLElement;
      expect(slot).toHaveClass("bg-gray-100");
      expect(slot).toHaveClass("border-gray-300");
      expect(slot).toHaveClass("text-gray-500");
      expect(slot).toHaveClass("line-through");
    });
  });

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
      // Mock hook to return alerts
      vi.mocked(useSessionAlerts).mockReturnValue({
        data: {
          session_id: "session-1",
          member_id: "member-1",
          alert_count: 3,
        },
      } as any);

      render(
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
      // Mock hook to return 0 alerts
      vi.mocked(useSessionAlerts).mockReturnValue({
        data: {
          session_id: "session-1",
          member_id: "member-1",
          alert_count: 0,
        },
      } as any);

      const { container } = render(
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
      // Mock hook to return null (no data)
      vi.mocked(useSessionAlerts).mockReturnValue({
        data: null,
      } as any);

      const { container } = render(
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
