import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SimpleMemberFilters } from "../SimpleMemberFilters";
import type { SimpleMemberFilters as SimpleMemberFiltersType } from "../SimpleMemberFilters";

describe("SimpleMemberFilters", () => {
  const mockOnChange = vi.fn();

  const defaultFilters: SimpleMemberFiltersType = {
    status: "all",
    dateRange: "all",
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
    expect(screen.getByText("All Time")).toBeInTheDocument();
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

  it("should show active filter count badge when filters are active", () => {
    const activeFilters: SimpleMemberFiltersType = {
      status: "active",
      dateRange: "this-month",
      memberType: "full",
    };

    render(
      <SimpleMemberFilters
        filters={activeFilters}
        onFiltersChange={mockOnChange}
      />
    );

    // Should show badge with count of 3
    expect(screen.getByText("3 active")).toBeInTheDocument();
  });

  it("should not show clear button when no filters are active", () => {
    render(
      <SimpleMemberFilters
        filters={defaultFilters}
        onFiltersChange={mockOnChange}
      />
    );

    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
  });

  it("should show clear button when filters are active", () => {
    const activeFilters: SimpleMemberFiltersType = {
      status: "active",
      dateRange: "all",
    };

    render(
      <SimpleMemberFilters
        filters={activeFilters}
        onFiltersChange={mockOnChange}
      />
    );

    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("should clear all filters when clicking clear button", () => {
    const activeFilters: SimpleMemberFiltersType = {
      status: "active",
      dateRange: "this-month",
      memberType: "full",
      hasActiveSubscription: true,
    };

    render(
      <SimpleMemberFilters
        filters={activeFilters}
        onFiltersChange={mockOnChange}
      />
    );

    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      status: "all",
      dateRange: "all",
      memberType: undefined,
      hasActiveSubscription: undefined,
      hasUpcomingSessions: undefined,
      hasOutstandingBalance: undefined,
    });
  });

  it("should handle boolean filters (hasActiveSubscription)", () => {
    const filtersWithSubscription: SimpleMemberFiltersType = {
      status: "all",
      dateRange: "all",
      hasActiveSubscription: true,
    };

    render(
      <SimpleMemberFilters
        filters={filtersWithSubscription}
        onFiltersChange={mockOnChange}
      />
    );

    // Should show active filter count of 1
    expect(screen.getByText("1 active")).toBeInTheDocument();
  });

  it("should handle boolean filters (hasUpcomingSessions)", () => {
    const filtersWithSessions: SimpleMemberFiltersType = {
      status: "all",
      dateRange: "all",
      hasUpcomingSessions: false,
    };

    render(
      <SimpleMemberFilters
        filters={filtersWithSessions}
        onFiltersChange={mockOnChange}
      />
    );

    // Should show active filter count of 1
    expect(screen.getByText("1 active")).toBeInTheDocument();
  });

  it("should handle boolean filters (hasOutstandingBalance)", () => {
    const filtersWithBalance: SimpleMemberFiltersType = {
      status: "all",
      dateRange: "all",
      hasOutstandingBalance: true,
    };

    render(
      <SimpleMemberFilters
        filters={filtersWithBalance}
        onFiltersChange={mockOnChange}
      />
    );

    // Should show active filter count of 1
    expect(screen.getByText("1 active")).toBeInTheDocument();
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
