import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { OpeningHoursTab } from "../OpeningHoursTab";
import * as useStudioSettings from "../../hooks/use-studio-settings";
import * as useConflictDetection from "../../hooks/use-conflict-detection";

// Mock the hooks
vi.mock("../../hooks/use-studio-settings");
vi.mock("../../hooks/use-conflict-detection");

describe("OpeningHoursTab", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Mock conflict detection hook with default values
    vi.mocked(useConflictDetection.useConflictDetection).mockReturnValue({
      data: undefined,
      refetch: vi.fn(),
      isFetching: false,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: false,
      status: "pending",
    } as any);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

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

    render(<OpeningHoursTab />, { wrapper });

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

    render(<OpeningHoursTab />, { wrapper });

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

    render(<OpeningHoursTab />, { wrapper });

    expect(screen.getByText("Current Opening Hours")).toBeInTheDocument();
    // In display mode (default), should show the opening hours table
    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByText("Hours")).toBeInTheDocument();
    expect(screen.getByText("Available Slots")).toBeInTheDocument();
    // Save Changes button should not be visible in display mode
    expect(screen.queryByText("Save Changes")).not.toBeInTheDocument();
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

    render(<OpeningHoursTab />, { wrapper });

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

    const { container } = render(<OpeningHoursTab />, { wrapper });

    // Should have card structure
    expect(container.querySelector("[class*='card']")).toBeInTheDocument();
  });
});
