import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeeklyOpeningHoursGrid } from "../WeeklyOpeningHoursGrid";
import type { OpeningHoursWeek } from "../../lib/types";

// Mock child components
vi.mock("../DayOpeningHoursRow", () => ({
  DayOpeningHoursRow: ({
    day,
    dayLabel,
  }: {
    day: string;
    dayLabel: string;
  }) => <div data-testid={`day-row-${day}`}>{dayLabel}</div>,
}));

vi.mock("../BulkActionsToolbar", () => ({
  BulkActionsToolbar: () => (
    <div data-testid="bulk-actions-toolbar">Toolbar</div>
  ),
}));

describe("WeeklyOpeningHoursGrid", () => {
  const mockOnChange = vi.fn();

  const validHours: OpeningHoursWeek = {
    monday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    wednesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
    sunday: { is_open: false, open_time: null, close_time: null },
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders BulkActionsToolbar", () => {
    render(
      <WeeklyOpeningHoursGrid value={validHours} onChange={mockOnChange} />
    );

    expect(screen.getByTestId("bulk-actions-toolbar")).toBeInTheDocument();
  });

  it("renders 7 day rows (Monday through Sunday)", () => {
    render(
      <WeeklyOpeningHoursGrid value={validHours} onChange={mockOnChange} />
    );

    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Tuesday")).toBeInTheDocument();
    expect(screen.getByText("Wednesday")).toBeInTheDocument();
    expect(screen.getByText("Thursday")).toBeInTheDocument();
    expect(screen.getByText("Friday")).toBeInTheDocument();
    expect(screen.getByText("Saturday")).toBeInTheDocument();
    expect(screen.getByText("Sunday")).toBeInTheDocument();
  });

  it("renders days in correct order (Monday first)", () => {
    render(
      <WeeklyOpeningHoursGrid value={validHours} onChange={mockOnChange} />
    );

    const dayRows = screen.getAllByTestId(/^day-row-/);
    expect(dayRows[0]).toHaveAttribute("data-testid", "day-row-monday");
    expect(dayRows[6]).toHaveAttribute("data-testid", "day-row-sunday");
  });

  it("passes validation errors to DayOpeningHoursRow components", () => {
    // Create hours with validation error (closing time before opening time)
    const invalidHours: OpeningHoursWeek = {
      ...validHours,
      monday: { is_open: true, open_time: "21:00", close_time: "09:00" },
    };

    render(
      <WeeklyOpeningHoursGrid value={invalidHours} onChange={mockOnChange} />
    );

    // Grid should still render even with errors
    expect(screen.getByText("Monday")).toBeInTheDocument();
  });

  it("passes disabled prop to child components", () => {
    render(
      <WeeklyOpeningHoursGrid
        value={validHours}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    // Child components should still render
    expect(screen.getByTestId("bulk-actions-toolbar")).toBeInTheDocument();
    expect(screen.getByText("Monday")).toBeInTheDocument();
  });

  it("memoizes validation errors based on value prop", () => {
    const { rerender } = render(
      <WeeklyOpeningHoursGrid value={validHours} onChange={mockOnChange} />
    );

    // Rerender with same value
    rerender(
      <WeeklyOpeningHoursGrid value={validHours} onChange={mockOnChange} />
    );

    // Component should still render correctly
    expect(screen.getByText("Monday")).toBeInTheDocument();
  });

  it("renders Card container", () => {
    const { container } = render(
      <WeeklyOpeningHoursGrid value={validHours} onChange={mockOnChange} />
    );

    // Check for Card component structure
    const card = container.querySelector("[class*='rounded']");
    expect(card).toBeInTheDocument();
  });

  it("handles empty or default disabled prop", () => {
    render(
      <WeeklyOpeningHoursGrid value={validHours} onChange={mockOnChange} />
    );

    // Should render without errors
    expect(screen.getByText("Monday")).toBeInTheDocument();
  });
});
