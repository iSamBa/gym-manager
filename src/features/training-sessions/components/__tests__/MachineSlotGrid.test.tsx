import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MachineSlotGrid } from "../MachineSlotGrid";
import { useMachines } from "../../hooks/use-machines";
import { useTrainingSessions } from "../../hooks/use-training-sessions";
import type { Machine, TrainingSession } from "../../lib/types";

// Mock hooks
vi.mock("../../hooks/use-machines");
vi.mock("../../hooks/use-training-sessions");

const mockMachines: Machine[] = [
  {
    id: "machine-1",
    machine_number: 1,
    name: "Machine 1",
    is_available: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "machine-2",
    machine_number: 2,
    name: "Machine 2",
    is_available: false, // Unavailable machine
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "machine-3",
    machine_number: 3,
    name: "Machine 3",
    is_available: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

const mockSessions: TrainingSession[] = [
  {
    id: "session-1",
    machine_id: "machine-1",
    trainer_id: "trainer-1",
    scheduled_start: "2025-01-15T10:00:00Z",
    scheduled_end: "2025-01-15T10:30:00Z",
    status: "scheduled",
    current_participants: 1,
    notes: null,
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

describe("MachineSlotGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state while fetching data", () => {
    vi.mocked(useMachines).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);
    vi.mocked(useTrainingSessions).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(
      <MachineSlotGrid
        selectedDate={new Date("2025-01-15")}
        onSlotClick={vi.fn()}
        onSessionClick={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Loading machine grid...")).toBeInTheDocument();
  });

  it("renders 3 machine columns", async () => {
    vi.mocked(useMachines).mockReturnValue({
      data: mockMachines,
      isLoading: false,
    } as any);
    vi.mocked(useTrainingSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
    } as any);

    render(
      <MachineSlotGrid
        selectedDate={new Date("2025-01-15")}
        onSlotClick={vi.fn()}
        onSessionClick={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText("Machine 1")).toBeInTheDocument();
      expect(screen.getByText("Machine 2")).toBeInTheDocument();
      expect(screen.getByText("Machine 3")).toBeInTheDocument();
    });
  });

  it("shows unavailable badge for disabled machines", async () => {
    vi.mocked(useMachines).mockReturnValue({
      data: mockMachines,
      isLoading: false,
    } as any);
    vi.mocked(useTrainingSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
    } as any);

    render(
      <MachineSlotGrid
        selectedDate={new Date("2025-01-15")}
        onSlotClick={vi.fn()}
        onSessionClick={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText("Unavailable")).toBeInTheDocument();
    });
  });

  it("renders 30 time slots per column (90 total)", async () => {
    vi.mocked(useMachines).mockReturnValue({
      data: mockMachines,
      isLoading: false,
    } as any);
    vi.mocked(useTrainingSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
    } as any);

    render(
      <MachineSlotGrid
        selectedDate={new Date("2025-01-15")}
        onSlotClick={vi.fn()}
        onSessionClick={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      // 30 slots per machine × 3 machines = 90 total slots
      const slots = screen.getAllByTestId("time-slot");
      expect(slots).toHaveLength(90);
    });
  });

  it("renders time axis labels on the left", async () => {
    vi.mocked(useMachines).mockReturnValue({
      data: mockMachines,
      isLoading: false,
    } as any);
    vi.mocked(useTrainingSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
    } as any);

    render(
      <MachineSlotGrid
        selectedDate={new Date("2025-01-15")}
        onSlotClick={vi.fn()}
        onSessionClick={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      // Check for first and last time labels (24-hour format)
      expect(screen.getByText("09:00")).toBeInTheDocument();
      expect(screen.getByText("23:30")).toBeInTheDocument();
    });
  });

  it("shows empty state when no machines configured", async () => {
    vi.mocked(useMachines).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
    vi.mocked(useTrainingSessions).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(
      <MachineSlotGrid
        selectedDate={new Date("2025-01-15")}
        onSlotClick={vi.fn()}
        onSessionClick={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/No machines configured/i)).toBeInTheDocument();
    });
  });
});
