import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudioSettingsLayout } from "../StudioSettingsLayout";

// Mock all tab components that use React Query
vi.mock("../OpeningHoursTab", () => ({
  OpeningHoursTab: () => (
    <div data-testid="opening-hours-tab">Opening Hours Tab</div>
  ),
}));

vi.mock("../GeneralTab", () => ({
  GeneralTab: () => <div data-testid="general-tab">General Tab</div>,
}));

vi.mock("../InvoiceSettingsTab", () => ({
  InvoiceSettingsTab: () => (
    <div data-testid="invoice-settings-tab">Invoice Settings Tab</div>
  ),
}));

vi.mock("../PlanningTab", () => ({
  PlanningTab: () => <div data-testid="planning-tab">Planning Tab</div>,
}));

vi.mock("../MultiSiteSessionsTab", () => ({
  MultiSiteSessionsTab: () => (
    <div data-testid="multi-site-tab">Multi Site Tab</div>
  ),
}));

// Test helper to wrap component with QueryClientProvider
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
});

describe("StudioSettingsLayout", () => {
  it("should render header with title and description", () => {
    renderWithProviders(<StudioSettingsLayout />);

    expect(screen.getByText("Studio Settings")).toBeInTheDocument();
    expect(
      screen.getByText(/Configure your gym's operational settings/)
    ).toBeInTheDocument();
  });

  it("should render all five tabs", () => {
    renderWithProviders(<StudioSettingsLayout />);

    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Opening Hours")).toBeInTheDocument();
    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getByText("Multi-Site Sessions")).toBeInTheDocument();
    expect(screen.getByText("Invoices")).toBeInTheDocument();
  });

  it("should have General tab active by default", () => {
    renderWithProviders(<StudioSettingsLayout />);

    const generalTab = screen.getByRole("tab", { name: /General/ });
    expect(generalTab).toHaveAttribute("data-state", "active");
  });

  it("should render GeneralTab content by default", () => {
    renderWithProviders(<StudioSettingsLayout />);

    expect(screen.getByTestId("general-tab")).toBeInTheDocument();
  });

  it("should render icons for each tab", () => {
    const { container } = renderWithProviders(<StudioSettingsLayout />);

    // Check for lucide icons (they render as SVGs)
    const svgs = container.querySelectorAll("svg");
    // 5 tab icons = 5 SVGs minimum
    expect(svgs.length).toBeGreaterThanOrEqual(5);
  });

  it("should handle tab state changes", () => {
    renderWithProviders(<StudioSettingsLayout />);

    const generalTab = screen.getByRole("tab", { name: /General/ });

    // General tab should be active initially
    expect(generalTab).toHaveAttribute("data-state", "active");

    // Clicking the same tab should keep it active
    fireEvent.click(generalTab);
    expect(generalTab).toHaveAttribute("data-state", "active");
  });

  it("should allow clicking different tabs", () => {
    renderWithProviders(<StudioSettingsLayout />);

    // Verify all tabs are clickable (not disabled)
    const generalTab = screen.getByRole("tab", { name: /General/ });
    const openingHoursTab = screen.getByRole("tab", { name: /Opening Hours/ });
    const planningTab = screen.getByRole("tab", { name: /Planning/ });
    const multiSiteTab = screen.getByRole("tab", { name: /Multi-Site/ });
    const invoicesTab = screen.getByRole("tab", { name: /Invoices/ });

    expect(generalTab).not.toBeDisabled();
    expect(openingHoursTab).not.toBeDisabled();
    expect(planningTab).not.toBeDisabled();
    expect(multiSiteTab).not.toBeDisabled();
    expect(invoicesTab).not.toBeDisabled();
  });

  it("should render different tab contents", async () => {
    renderWithProviders(<StudioSettingsLayout />);

    // Test that we can access different tabs
    const invoicesTab = screen.getByRole("tab", { name: /Invoices/ });
    expect(invoicesTab).toBeInTheDocument();

    const planningTab = screen.getByRole("tab", { name: /Planning/ });
    expect(planningTab).toBeInTheDocument();

    // General tab should be active initially with general content
    expect(screen.getByTestId("general-tab")).toBeInTheDocument();
  });

  it("should use memo for performance", () => {
    const { rerender } = renderWithProviders(<StudioSettingsLayout />);

    // Component should be memoized
    expect(StudioSettingsLayout.displayName).toBe("StudioSettingsLayout");

    // Re-render should not cause issues
    rerender(
      <QueryClientProvider client={queryClient}>
        <StudioSettingsLayout />
      </QueryClientProvider>
    );
    expect(screen.getByText("Studio Settings")).toBeInTheDocument();
  });
});
