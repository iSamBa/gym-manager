import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SaveConfirmationDialog } from "../SaveConfirmationDialog";
import type { OpeningHoursWeek } from "../../lib/types";

describe("SaveConfirmationDialog", () => {
  const mockOpeningHours: OpeningHoursWeek = {
    monday: { is_open: true, open_time: "09:00", close_time: "17:00" },
    tuesday: { is_open: true, open_time: "09:00", close_time: "17:00" },
    wednesday: { is_open: false, open_time: null, close_time: null },
    thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    saturday: { is_open: true, open_time: "10:00", close_time: "16:00" },
    sunday: { is_open: false, open_time: null, close_time: null },
  };

  it("should render dialog when open is true", () => {
    const mockOnConfirm = vi.fn();
    const mockOnOpenChange = vi.fn();
    const testDate = new Date("2025-10-20");

    render(
      <SaveConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        onConfirm={mockOnConfirm}
      />
    );

    expect(
      screen.getByText("Confirm Opening Hours Changes")
    ).toBeInTheDocument();
  });

  it("should not render dialog when open is false", () => {
    const mockOnConfirm = vi.fn();
    const mockOnOpenChange = vi.fn();
    const testDate = new Date("2025-10-20");

    render(
      <SaveConfirmationDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        onConfirm={mockOnConfirm}
      />
    );

    expect(
      screen.queryByText("Confirm Opening Hours Changes")
    ).not.toBeInTheDocument();
  });

  it("should display formatted effective date", () => {
    const mockOnConfirm = vi.fn();
    const mockOnOpenChange = vi.fn();
    const testDate = new Date("2025-10-20");

    render(
      <SaveConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText(/Monday, October 20, 2025/i)).toBeInTheDocument();
  });

  it("should display open days summary", () => {
    const mockOnConfirm = vi.fn();
    const mockOnOpenChange = vi.fn();
    const testDate = new Date("2025-10-20");

    render(
      <SaveConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        onConfirm={mockOnConfirm}
      />
    );

    // Should show Mon, Tue, Thu, Fri, Sat (all open days)
    expect(screen.getByText(/Mon, Tue, Thu, Fri, Sat/i)).toBeInTheDocument();
  });

  it("should display closed days summary", () => {
    const mockOnConfirm = vi.fn();
    const mockOnOpenChange = vi.fn();
    const testDate = new Date("2025-10-20");

    render(
      <SaveConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        onConfirm={mockOnConfirm}
      />
    );

    // Should show Wed, Sun (closed days)
    expect(screen.getByText(/Wed, Sun/i)).toBeInTheDocument();
  });

  it("should display total weekly slots", () => {
    const mockOnConfirm = vi.fn();
    const mockOnOpenChange = vi.fn();
    const testDate = new Date("2025-10-20");

    render(
      <SaveConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        onConfirm={mockOnConfirm}
      />
    );

    // Mon: 16, Tue: 16, Thu: 24, Fri: 24, Sat: 12 = 92 slots
    expect(screen.getByText(/92/)).toBeInTheDocument();
  });

  it("should call onConfirm when Confirm button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnConfirm = vi.fn();
    const mockOnOpenChange = vi.fn();
    const testDate = new Date("2025-10-20");

    render(
      <SaveConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmButton = screen.getByText("Confirm Changes");
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenChange(false) when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnConfirm = vi.fn();
    const mockOnOpenChange = vi.fn();
    const testDate = new Date("2025-10-20");

    render(
      <SaveConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("should disable buttons when isLoading is true", () => {
    const mockOnConfirm = vi.fn();
    const mockOnOpenChange = vi.fn();
    const testDate = new Date("2025-10-20");

    render(
      <SaveConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        onConfirm={mockOnConfirm}
        isLoading={true}
      />
    );

    const confirmButton = screen.getByText("Saving...");
    const cancelButton = screen.getByText("Cancel");

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("should show warning about existing bookings", () => {
    const mockOnConfirm = vi.fn();
    const mockOnOpenChange = vi.fn();
    const testDate = new Date("2025-10-20");

    render(
      <SaveConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        onConfirm={mockOnConfirm}
      />
    );

    expect(
      screen.getByText(
        /Existing bookings before the effective date will remain unchanged/i
      )
    ).toBeInTheDocument();
  });
});
