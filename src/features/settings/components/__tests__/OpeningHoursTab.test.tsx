import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OpeningHoursTab } from "../OpeningHoursTab";
import * as useStudioSettings from "../../hooks/use-studio-settings";

// Mock the hook
vi.mock("../../hooks/use-studio-settings");

describe("OpeningHoursTab", () => {
  it("should render loading state", () => {
    vi.mocked(useStudioSettings.useStudioSettings).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      updateSettings: vi.fn(),
      isUpdating: false,
      updateError: null,
    });

    render(<OpeningHoursTab />);

    // Should show skeleton loaders
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    );
  });

  it("should render error state", () => {
    const mockError = new Error("Failed to load settings");

    vi.mocked(useStudioSettings.useStudioSettings).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: vi.fn(),
      updateSettings: vi.fn(),
      isUpdating: false,
      updateError: null,
    });

    render(<OpeningHoursTab />);

    expect(
      screen.getByText(
        "Failed to load opening hours settings. Please try again."
      )
    ).toBeInTheDocument();
  });

  it("should render content with settings", () => {
    const mockSettings = {
      id: "123",
      setting_key: "opening_hours",
      setting_value: {
        monday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      },
      effective_from: "2025-01-01",
      is_active: true,
      created_by: null,
      created_at: "2025-01-01",
      updated_at: "2025-01-01",
    };

    vi.mocked(useStudioSettings.useStudioSettings).mockReturnValue({
      data: mockSettings,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      updateSettings: vi.fn(),
      isUpdating: false,
      updateError: null,
    });

    render(<OpeningHoursTab />);

    expect(screen.getByText("Studio Opening Hours")).toBeInTheDocument();
    expect(
      screen.getByText(/Set the days and times when your studio is open/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Opening hours editor will appear here (US-003)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Current setting loaded: opening_hours")
    ).toBeInTheDocument();
  });

  it("should render content without settings (null data)", () => {
    vi.mocked(useStudioSettings.useStudioSettings).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      updateSettings: vi.fn(),
      isUpdating: false,
      updateError: null,
    });

    render(<OpeningHoursTab />);

    expect(screen.getByText("Studio Opening Hours")).toBeInTheDocument();
    expect(
      screen.getByText("Opening hours editor will appear here (US-003)")
    ).toBeInTheDocument();
    // Should not show "Current setting loaded" when data is null
    expect(
      screen.queryByText(/Current setting loaded/)
    ).not.toBeInTheDocument();
  });

  it("should have proper card structure", () => {
    vi.mocked(useStudioSettings.useStudioSettings).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      updateSettings: vi.fn(),
      isUpdating: false,
      updateError: null,
    });

    const { container } = render(<OpeningHoursTab />);

    // Should have card structure
    expect(container.querySelector("[class*='card']")).toBeInTheDocument();
  });
});
