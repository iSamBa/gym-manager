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
        tuesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
        wednesday: { is_open: true, open_time: "09:00", close_time: "21:00" },
        thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
        friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
        saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
        sunday: { is_open: false, open_time: null, close_time: null },
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
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
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

    expect(
      screen.getByText(
        "No opening hours configuration found. Please contact support."
      )
    ).toBeInTheDocument();
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
