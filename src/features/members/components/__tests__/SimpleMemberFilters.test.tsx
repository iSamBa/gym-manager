import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SimpleMemberFilters } from "../SimpleMemberFilters";
import type { SimpleMemberFilters as SimpleMemberFiltersType } from "../SimpleMemberFilters";

describe("SimpleMemberFilters", () => {
  const mockOnChange = vi.fn();

  const defaultFilters: SimpleMemberFiltersType = {
    status: "all",
  };

  afterEach(() => {
    mockOnChange.mockClear();
  });

  it("should render all filter options", () => {
    render(
      <SimpleMemberFilters
        filters={defaultFilters}
        onFiltersChange={mockOnChange}
      />
    );

    // Check that all select values are rendered (showing defaults)
    expect(screen.getByText("All Statuses")).toBeInTheDocument();
    expect(screen.getByText("All Types")).toBeInTheDocument();
    expect(screen.getByText("All Subscriptions")).toBeInTheDocument();
    expect(screen.getByText("All Sessions")).toBeInTheDocument();
    expect(screen.getByText("All Balances")).toBeInTheDocument();
  });

  it("should render status filter select", () => {
    render(
      <SimpleMemberFilters
        filters={defaultFilters}
        onFiltersChange={mockOnChange}
      />
    );

    const statusSelect = screen.getByText("All Statuses");
    expect(statusSelect).toBeInTheDocument();
  });

  it("should render member type filter select", () => {
    render(
      <SimpleMemberFilters
        filters={defaultFilters}
        onFiltersChange={mockOnChange}
      />
    );

    const memberTypeSelect = screen.getByText("All Types");
    expect(memberTypeSelect).toBeInTheDocument();
  });

  // Note: Active filter badge and Clear button moved to parent component (members page)
  // Those tests are removed as SimpleMemberFilters only renders filter dropdowns now

  it("should handle boolean filters (hasActiveSubscription)", () => {
    const filtersWithSubscription: SimpleMemberFiltersType = {
      status: "all",
      hasActiveSubscription: true,
    };

    render(
      <SimpleMemberFilters
        filters={filtersWithSubscription}
        onFiltersChange={mockOnChange}
      />
    );

    // Should show active filter count of 1
    // Badge and Clear button moved to parent component
  });

  it("should handle boolean filters (hasUpcomingSessions)", () => {
    const filtersWithSessions: SimpleMemberFiltersType = {
      status: "all",
      hasUpcomingSessions: false,
    };

    render(
      <SimpleMemberFilters
        filters={filtersWithSessions}
        onFiltersChange={mockOnChange}
      />
    );

    // Should show active filter count of 1
    // Badge and Clear button moved to parent component
  });

  it("should handle boolean filters (hasOutstandingBalance)", () => {
    const filtersWithBalance: SimpleMemberFiltersType = {
      status: "all",
      hasOutstandingBalance: true,
    };

    render(
      <SimpleMemberFilters
        filters={filtersWithBalance}
        onFiltersChange={mockOnChange}
      />
    );

    // Should show active filter count of 1
    // Badge and Clear button moved to parent component
  });

  it("should apply custom className", () => {
    const { container } = render(
      <SimpleMemberFilters
        filters={defaultFilters}
        onFiltersChange={mockOnChange}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("custom-class");
  });
});
