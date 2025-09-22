import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SessionHistoryTable from "../../components/SessionHistoryTable";
import type { SessionHistoryEntry } from "../../lib/types";

// Mock the export utilities
vi.mock("../../lib/export-utils", () => ({
  exportToCSV: vi.fn(),
  exportToPDF: vi.fn(),
}));

const mockSessions: SessionHistoryEntry[] = [
  {
    session_id: "1",
    scheduled_start: "2024-01-15T10:00:00Z",
    scheduled_end: "2024-01-15T11:00:00Z",
    status: "completed",
    location: "Gym A",
    trainer_name: "John Doe",
    participant_count: 8,
    max_participants: 10,
    attendance_rate: 80,
    duration_minutes: 60,
    session_category: "standard",
    notes: "Great session",
  },
  {
    session_id: "2",
    scheduled_start: "2024-01-16T14:00:00Z",
    scheduled_end: "2024-01-16T15:00:00Z",
    status: "scheduled",
    location: "Gym B",
    trainer_name: "Jane Smith",
    participant_count: 5,
    max_participants: 12,
    attendance_rate: 42,
    duration_minutes: 60,
    session_category: "trial",
  },
];

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

describe("SessionHistoryTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders session data correctly", () => {
    renderWithQueryClient(<SessionHistoryTable sessions={mockSessions} />);

    // Check if sessions are displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Gym A")).toBeInTheDocument();
    expect(screen.getByText("Gym B")).toBeInTheDocument();
  });

  it("displays loading state", () => {
    renderWithQueryClient(
      <SessionHistoryTable sessions={[]} isLoading={true} />
    );

    // Should show loading placeholders
    const loadingElements = document.querySelectorAll(".animate-pulse");
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("displays empty state when no sessions", () => {
    renderWithQueryClient(<SessionHistoryTable sessions={[]} />);

    expect(screen.getByText("No sessions found.")).toBeInTheDocument();
  });

  it("shows search input", () => {
    renderWithQueryClient(<SessionHistoryTable sessions={mockSessions} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    expect(searchInput).toBeInTheDocument();
  });

  it("shows export dropdown", () => {
    renderWithQueryClient(<SessionHistoryTable sessions={mockSessions} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    expect(exportButton).toBeInTheDocument();
  });

  it("shows column visibility dropdown", () => {
    renderWithQueryClient(<SessionHistoryTable sessions={mockSessions} />);

    const columnsButton = screen.getByRole("button", { name: /columns/i });
    expect(columnsButton).toBeInTheDocument();
  });

  it("renders selection column when showSelectionColumn is true", () => {
    renderWithQueryClient(
      <SessionHistoryTable sessions={mockSessions} showSelectionColumn={true} />
    );

    // Check for checkbox inputs using a more flexible approach
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("hides trainer column when showTrainerColumn is false", () => {
    renderWithQueryClient(
      <SessionHistoryTable sessions={mockSessions} showTrainerColumn={false} />
    );

    // Trainer names should still be in the document but not as column headers
    const trainerHeader = screen.queryByRole("button", { name: /trainer/i });
    expect(trainerHeader).not.toBeInTheDocument();
  });

  it("displays attendance rates with correct styling", () => {
    renderWithQueryClient(<SessionHistoryTable sessions={mockSessions} />);

    // High attendance (80%) should be green
    const highAttendance = screen.getByText("80%");
    expect(highAttendance).toHaveClass("text-green-600");

    // Low attendance (42%) should be red
    const lowAttendance = screen.getByText("42%");
    expect(lowAttendance).toHaveClass("text-red-600");
  });

  it("formats dates correctly", () => {
    renderWithQueryClient(<SessionHistoryTable sessions={mockSessions} />);

    expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
    expect(screen.getByText("Jan 16, 2024")).toBeInTheDocument();
  });

  it("formats times correctly", () => {
    renderWithQueryClient(<SessionHistoryTable sessions={mockSessions} />);

    // Use a more flexible approach to find time text across elements
    expect(
      screen.getByText((content, element) => {
        return element?.textContent?.includes("10:00 - 11:00") || false;
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText((content, element) => {
        return element?.textContent?.includes("14:00 - 15:00") || false;
      })
    ).toBeInTheDocument();
  });

  it("shows participant counts", () => {
    renderWithQueryClient(<SessionHistoryTable sessions={mockSessions} />);

    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.getByText("5/12")).toBeInTheDocument();
  });

  it("shows session categories with badges", () => {
    renderWithQueryClient(<SessionHistoryTable sessions={mockSessions} />);

    expect(screen.getByText("standard")).toBeInTheDocument();
    expect(screen.getByText("trial")).toBeInTheDocument();
  });

  it("shows session statuses with badges", () => {
    renderWithQueryClient(<SessionHistoryTable sessions={mockSessions} />);

    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("scheduled")).toBeInTheDocument();
  });
});
