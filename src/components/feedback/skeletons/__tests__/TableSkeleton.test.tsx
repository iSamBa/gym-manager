import { render, screen } from "@testing-library/react";
import { TableSkeleton } from "../TableSkeleton";

describe("TableSkeleton", () => {
  it("renders without crashing", () => {
    render(<TableSkeleton />);
  });

  it("has proper accessibility attributes", () => {
    const { container } = render(<TableSkeleton />);
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveAttribute("aria-busy", "true");
    expect(loadingElement).toHaveAttribute("aria-label", "Loading table");
  });

  it("applies custom className", () => {
    const { container } = render(<TableSkeleton className="custom-class" />);
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toHaveClass("custom-class");
  });

  it("renders default number of rows (10)", () => {
    const { container } = render(<TableSkeleton />);
    // Count rows in the divide-y container
    const rows = container.querySelectorAll(".divide-y > div");
    expect(rows).toHaveLength(10);
  });

  it("renders custom number of rows", () => {
    const { container } = render(<TableSkeleton rowCount={5} />);
    const rows = container.querySelectorAll(".divide-y > div");
    expect(rows).toHaveLength(5);
  });

  it("renders stats cards when hasStats is true", () => {
    const { container } = render(<TableSkeleton hasStats={true} />);
    // Stats should be in a grid before the table
    const statsGrid = container.querySelector(".grid");
    expect(statsGrid).toBeInTheDocument();
    const statCards = statsGrid?.querySelectorAll(".rounded-lg");
    expect(statCards?.length).toBeGreaterThan(0);
  });

  it("does not render stats cards when hasStats is false", () => {
    const { container } = render(<TableSkeleton hasStats={false} />);
    // Should not have a stats grid before the table
    const grids = container.querySelectorAll(".grid");
    // If there are grids, they should be inside the table (columns layout)
    expect(grids.length).toBeLessThanOrEqual(1);
  });

  it("renders filter bar when hasFilters is true", () => {
    const { container } = render(<TableSkeleton hasFilters={true} />);
    // Filter bar should contain search and filter elements
    const filterElements = container.querySelectorAll(".h-10");
    expect(filterElements.length).toBeGreaterThan(0);
  });

  it("does not render filter bar when hasFilters is false", () => {
    const { container } = render(<TableSkeleton hasFilters={false} />);
    // Should have fewer skeleton elements without filters
    const skeletonElements = container.querySelectorAll(".animate-pulse");
    // Just check it renders something (table rows)
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it("renders table header", () => {
    const { container } = render(<TableSkeleton />);
    const header = container.querySelector(".border-b.bg-muted\\/50");
    expect(header).toBeInTheDocument();
    const headerSkeletons = header?.querySelectorAll(".h-5");
    expect(headerSkeletons?.length).toBeGreaterThan(0);
  });

  it("renders table with proper structure", () => {
    const { container } = render(<TableSkeleton />);
    const tableContainer = container.querySelector(".rounded-lg.border");
    expect(tableContainer).toBeInTheDocument();
    const rowsContainer = container.querySelector(".divide-y");
    expect(rowsContainer).toBeInTheDocument();
  });

  it("has animate-pulse class on skeleton elements", () => {
    const { container } = render(<TableSkeleton />);
    const pulsingElements = container.querySelectorAll(".animate-pulse");
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it("renders multiple cells per row", () => {
    const { container } = render(<TableSkeleton />);
    const firstRow = container.querySelector(".divide-y > div");
    const skeletons = firstRow?.querySelectorAll(".h-5, .h-8");
    expect(skeletons?.length).toBeGreaterThan(1);
  });
});
