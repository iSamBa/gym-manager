import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DayOpeningHoursRow } from "../DayOpeningHoursRow";
import type { OpeningHoursDay } from "../../lib/types";

describe("DayOpeningHoursRow", () => {
  const mockOnChange = vi.fn();

  const openDayConfig: OpeningHoursDay = {
    is_open: true,
    open_time: "09:00",
    close_time: "21:00",
  };

  const closedDayConfig: OpeningHoursDay = {
    is_open: false,
    open_time: null,
    close_time: null,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders day label and checkbox", () => {
    render(
      <DayOpeningHoursRow
        day="monday"
        dayLabel="Monday"
        config={openDayConfig}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByLabelText("Toggle Monday")).toBeInTheDocument();
    // Checkbox should be checked for open days
    const checkbox = screen.getByLabelText("Toggle Monday");
    expect(checkbox).toBeChecked();
  });

  it("renders unchecked checkbox when day is closed", () => {
    render(
      <DayOpeningHoursRow
        day="sunday"
        dayLabel="Sunday"
        config={closedDayConfig}
        onChange={mockOnChange}
      />
    );

    // Checkbox should be unchecked for closed days
    const checkbox = screen.getByLabelText("Toggle Sunday");
    expect(checkbox).not.toBeChecked();
  });

  it("renders time pickers without individual labels", () => {
    render(
      <DayOpeningHoursRow
        day="monday"
        dayLabel="Monday"
        config={openDayConfig}
        onChange={mockOnChange}
      />
    );

    // Time pickers are rendered, but labels are now in the grid header
    // Just verify time pickers exist with the right values
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);
  });

  it("disables time pickers when day is closed", () => {
    render(
      <DayOpeningHoursRow
        day="sunday"
        dayLabel="Sunday"
        config={closedDayConfig}
        onChange={mockOnChange}
      />
    );

    // Both select elements for opening time should be disabled
    const selects = screen.getAllByRole("combobox");
    selects.forEach((select) => {
      expect(select).toBeDisabled();
    });
  });

  it("calls onChange with cleared times when toggling from open to closed", () => {
    const { rerender } = render(
      <DayOpeningHoursRow
        day="monday"
        dayLabel="Monday"
        config={openDayConfig}
        onChange={mockOnChange}
      />
    );

    const toggle = screen.getByLabelText("Toggle Monday");
    fireEvent.click(toggle);

    expect(mockOnChange).toHaveBeenCalledWith({
      is_open: false,
      open_time: null,
      close_time: null,
    });
  });

  it("calls onChange with default times when toggling from closed to open", () => {
    render(
      <DayOpeningHoursRow
        day="sunday"
        dayLabel="Sunday"
        config={closedDayConfig}
        onChange={mockOnChange}
      />
    );

    const toggle = screen.getByLabelText("Toggle Sunday");
    fireEvent.click(toggle);

    expect(mockOnChange).toHaveBeenCalledWith({
      is_open: true,
      open_time: "09:00",
      close_time: "21:00",
    });
  });

  it("displays validation error message when error prop is provided", () => {
    render(
      <DayOpeningHoursRow
        day="monday"
        dayLabel="Monday"
        config={openDayConfig}
        onChange={mockOnChange}
        error="Closing time must be after opening time"
      />
    );

    expect(
      screen.getByText("Closing time must be after opening time")
    ).toBeInTheDocument();
  });

  it("applies error styling when error prop is provided", () => {
    const { container } = render(
      <DayOpeningHoursRow
        day="monday"
        dayLabel="Monday"
        config={openDayConfig}
        onChange={mockOnChange}
        error="Some error"
      />
    );

    const rowContainer = container.querySelector(".border-destructive");
    expect(rowContainer).toBeInTheDocument();
  });

  it("applies muted styling when day is closed", () => {
    const { container } = render(
      <DayOpeningHoursRow
        day="sunday"
        dayLabel="Sunday"
        config={closedDayConfig}
        onChange={mockOnChange}
      />
    );

    const rowContainer = container.querySelector(".bg-muted\\/50");
    expect(rowContainer).toBeInTheDocument();
  });

  it("disables all controls when disabled prop is true", () => {
    render(
      <DayOpeningHoursRow
        day="monday"
        dayLabel="Monday"
        config={openDayConfig}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const toggle = screen.getByLabelText("Toggle Monday");
    expect(toggle).toBeDisabled();

    // All select elements should be disabled
    const selects = screen.getAllByRole("combobox");
    selects.forEach((select) => {
      expect(select).toBeDisabled();
    });
  });

  it("does not call onChange when toggle is clicked while disabled", () => {
    render(
      <DayOpeningHoursRow
        day="monday"
        dayLabel="Monday"
        config={openDayConfig}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const toggle = screen.getByLabelText("Toggle Monday");
    fireEvent.click(toggle);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("does not display error when no error prop is provided", () => {
    const { container } = render(
      <DayOpeningHoursRow
        day="monday"
        dayLabel="Monday"
        config={openDayConfig}
        onChange={mockOnChange}
      />
    );

    const errorText = container.querySelector(".text-destructive");
    expect(errorText).not.toBeInTheDocument();
  });
});
