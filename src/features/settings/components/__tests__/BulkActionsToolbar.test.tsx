import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkActionsToolbar } from "../BulkActionsToolbar";
import { toast } from "sonner";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe("BulkActionsToolbar", () => {
  const mockOnApplyToWeekdays = vi.fn();
  const mockOnApplyToAllDays = vi.fn();
  const mockOnResetToDefaults = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders toolbar with all action buttons", () => {
    render(
      <BulkActionsToolbar
        onApplyToWeekdays={mockOnApplyToWeekdays}
        onApplyToAllDays={mockOnApplyToAllDays}
        onResetToDefaults={mockOnResetToDefaults}
      />
    );

    expect(screen.getByText("Apply Monday to...")).toBeInTheDocument();
    expect(screen.getByText("Reset to Defaults")).toBeInTheDocument();
  });

  it("opens dropdown menu when clicking 'Apply Monday to...' button", async () => {
    const user = userEvent.setup();
    render(
      <BulkActionsToolbar
        onApplyToWeekdays={mockOnApplyToWeekdays}
        onApplyToAllDays={mockOnApplyToAllDays}
        onResetToDefaults={mockOnResetToDefaults}
      />
    );

    const dropdownTrigger = screen.getByText("Apply Monday to...");
    await user.click(dropdownTrigger);

    // Check for dropdown menu items
    expect(await screen.findByText("Weekdays (Tue-Fri)")).toBeInTheDocument();
    expect(await screen.findByText("All Days")).toBeInTheDocument();
  });

  it("calls onApplyToWeekdays and shows toast when 'Weekdays' is clicked", async () => {
    const user = userEvent.setup();
    render(
      <BulkActionsToolbar
        onApplyToWeekdays={mockOnApplyToWeekdays}
        onApplyToAllDays={mockOnApplyToAllDays}
        onResetToDefaults={mockOnResetToDefaults}
      />
    );

    // Open dropdown
    const dropdownTrigger = screen.getByText("Apply Monday to...");
    await user.click(dropdownTrigger);

    // Click weekdays option using fireEvent
    const weekdaysOption = await screen.findByText("Weekdays (Tue-Fri)");
    fireEvent.click(weekdaysOption);

    await waitFor(() => {
      expect(mockOnApplyToWeekdays).toHaveBeenCalledOnce();
      expect(toast.success).toHaveBeenCalledWith(
        "Applied Monday hours to weekdays"
      );
    });
  });

  it("calls onApplyToAllDays and shows toast when 'All Days' is clicked", async () => {
    const user = userEvent.setup();
    render(
      <BulkActionsToolbar
        onApplyToWeekdays={mockOnApplyToWeekdays}
        onApplyToAllDays={mockOnApplyToAllDays}
        onResetToDefaults={mockOnResetToDefaults}
      />
    );

    // Open dropdown
    const dropdownTrigger = screen.getByText("Apply Monday to...");
    await user.click(dropdownTrigger);

    // Click all days option using fireEvent
    const allDaysOption = await screen.findByText("All Days");
    fireEvent.click(allDaysOption);

    await waitFor(() => {
      expect(mockOnApplyToAllDays).toHaveBeenCalledOnce();
      expect(toast.success).toHaveBeenCalledWith(
        "Applied Monday hours to all days"
      );
    });
  });

  it("calls onResetToDefaults and shows toast when 'Reset to Defaults' is clicked", () => {
    render(
      <BulkActionsToolbar
        onApplyToWeekdays={mockOnApplyToWeekdays}
        onApplyToAllDays={mockOnApplyToAllDays}
        onResetToDefaults={mockOnResetToDefaults}
      />
    );

    const resetButton = screen.getByText("Reset to Defaults");
    fireEvent.click(resetButton);

    expect(mockOnResetToDefaults).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith("Reset to default hours");
  });

  it("disables all buttons when disabled prop is true", () => {
    render(
      <BulkActionsToolbar
        onApplyToWeekdays={mockOnApplyToWeekdays}
        onApplyToAllDays={mockOnApplyToAllDays}
        onResetToDefaults={mockOnResetToDefaults}
        disabled={true}
      />
    );

    const dropdownTrigger = screen.getByRole("button", {
      name: /Apply Monday to.../i,
    });
    const resetButton = screen.getByRole("button", {
      name: /Reset to Defaults/i,
    });

    expect(dropdownTrigger).toBeDisabled();
    expect(resetButton).toBeDisabled();
  });

  it("does not call callbacks when disabled", () => {
    render(
      <BulkActionsToolbar
        onApplyToWeekdays={mockOnApplyToWeekdays}
        onApplyToAllDays={mockOnApplyToAllDays}
        onResetToDefaults={mockOnResetToDefaults}
        disabled={true}
      />
    );

    const resetButton = screen.getByText("Reset to Defaults");
    fireEvent.click(resetButton);

    expect(mockOnResetToDefaults).not.toHaveBeenCalled();
  });
});
