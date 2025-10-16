import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudioSettingsLayout } from "../StudioSettingsLayout";

// Mock the OpeningHoursTab component
vi.mock("../OpeningHoursTab", () => ({
  OpeningHoursTab: () => (
    <div data-testid="opening-hours-tab">Opening Hours Tab</div>
  ),
}));

describe("StudioSettingsLayout", () => {
  it("should render header with title and description", () => {
    render(<StudioSettingsLayout />);

    expect(screen.getByText("Studio Settings")).toBeInTheDocument();
    expect(
      screen.getByText(/Configure your gym's operational settings/)
    ).toBeInTheDocument();
  });

  it("should render all three tabs", () => {
    render(<StudioSettingsLayout />);

    expect(screen.getByText("Opening Hours")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
  });

  it("should have Opening Hours tab active by default", () => {
    render(<StudioSettingsLayout />);

    const openingHoursTab = screen.getByRole("tab", { name: /Opening Hours/ });
    expect(openingHoursTab).toHaveAttribute("data-state", "active");
  });

  it("should have General and Payment tabs disabled", () => {
    render(<StudioSettingsLayout />);

    const generalTab = screen.getByRole("tab", { name: /General/ });
    const paymentTab = screen.getByRole("tab", { name: /Payment/ });

    expect(generalTab).toBeDisabled();
    expect(paymentTab).toBeDisabled();
  });

  it("should show Coming Soon labels for disabled tabs", () => {
    render(<StudioSettingsLayout />);

    const comingSoonLabels = screen.getAllByText("(Coming Soon)");
    expect(comingSoonLabels).toHaveLength(2);
  });

  it("should render OpeningHoursTab content", () => {
    render(<StudioSettingsLayout />);

    expect(screen.getByTestId("opening-hours-tab")).toBeInTheDocument();
  });

  it("should render icons for each tab", () => {
    const { container } = render(<StudioSettingsLayout />);

    // Check for lucide icons (they render as SVGs)
    const svgs = container.querySelectorAll("svg");
    // Header icon + 3 tab icons = 4 SVGs minimum
    expect(svgs.length).toBeGreaterThanOrEqual(4);
  });

  it("should handle tab state changes", () => {
    render(<StudioSettingsLayout />);

    const openingHoursTab = screen.getByRole("tab", { name: /Opening Hours/ });

    // Tab should be active initially
    expect(openingHoursTab).toHaveAttribute("data-state", "active");

    // Clicking the same tab should keep it active
    fireEvent.click(openingHoursTab);
    expect(openingHoursTab).toHaveAttribute("data-state", "active");
  });

  it("should use memo for performance", () => {
    const { rerender } = render(<StudioSettingsLayout />);

    // Component should be memoized
    expect(StudioSettingsLayout.displayName).toBe("StudioSettingsLayout");

    // Re-render should not cause issues
    rerender(<StudioSettingsLayout />);
    expect(screen.getByText("Studio Settings")).toBeInTheDocument();
  });
});
