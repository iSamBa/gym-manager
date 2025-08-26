import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemberSearchForm } from "../MemberSearchForm";
import type { MemberSearchFilters } from "../MemberSearchForm";

const defaultFilters: MemberSearchFilters = {
  query: "",
  status: "all",
  joinDateFrom: "",
  joinDateTo: "",
};

describe("MemberSearchForm", () => {
  it("renders search input", () => {
    const handleFiltersChange = vi.fn();
    render(
      <MemberSearchForm
        filters={defaultFilters}
        onFiltersChange={handleFiltersChange}
      />
    );

    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
  });

  it("calls onFiltersChange when search query changes", () => {
    const handleFiltersChange = vi.fn();
    render(
      <MemberSearchForm
        filters={defaultFilters}
        onFiltersChange={handleFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: "john" } });

    expect(handleFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      query: "john",
    });
  });

  it("renders compact variant with basic search", () => {
    const handleFiltersChange = vi.fn();
    render(
      <MemberSearchForm
        filters={defaultFilters}
        onFiltersChange={handleFiltersChange}
        compact
      />
    );

    expect(
      screen.getByPlaceholderText("Search members by name...")
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument(); // Filter button
  });

  it("shows filter indicator when filters are active", () => {
    const activeFilters: MemberSearchFilters = {
      query: "john",
      status: "active",
      joinDateFrom: "2024-01-01",
      joinDateTo: "2024-12-31",
    };

    const handleFiltersChange = vi.fn();
    render(
      <MemberSearchForm
        filters={activeFilters}
        onFiltersChange={handleFiltersChange}
        compact
      />
    );

    expect(screen.getByText("•")).toBeInTheDocument(); // Filter indicator
  });

  it("shows clear filters button when filters are active", () => {
    const activeFilters: MemberSearchFilters = {
      query: "john",
      status: "active",
      joinDateFrom: "",
      joinDateTo: "",
    };

    const handleFiltersChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <MemberSearchForm
        filters={activeFilters}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
      />
    );

    const clearButton = screen.getByText(/clear filters/i);
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(handleFiltersChange).toHaveBeenCalledWith(defaultFilters);
    expect(handleReset).toHaveBeenCalled();
  });

  it("renders status filter options", () => {
    const handleFiltersChange = vi.fn();
    render(
      <MemberSearchForm
        filters={defaultFilters}
        onFiltersChange={handleFiltersChange}
      />
    );

    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders date range filters", () => {
    const handleFiltersChange = vi.fn();
    render(
      <MemberSearchForm
        filters={defaultFilters}
        onFiltersChange={handleFiltersChange}
      />
    );

    expect(screen.getByText("Joined From")).toBeInTheDocument();
    expect(screen.getByText("Joined To")).toBeInTheDocument();
  });
});
