import { render, screen } from "@testing-library/react";
import { DashboardSkeleton } from "../DashboardSkeleton";

describe("DashboardSkeleton", () => {
  it("renders without crashing", () => {
    render(<DashboardSkeleton />);
  });

  it("has proper accessibility attributes", () => {
    const { container } = render(<DashboardSkeleton />);
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveAttribute("aria-busy", "true");
    expect(loadingElement).toHaveAttribute("aria-label", "Loading dashboard");
  });

  it("applies custom className", () => {
    const { container } = render(
      <DashboardSkeleton className="custom-class" />
    );
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toHaveClass("custom-class");
  });

  it("renders stat cards section", () => {
    const { container } = render(<DashboardSkeleton />);
    const statCards = container.querySelectorAll(".grid > .rounded-lg");
    expect(statCards.length).toBeGreaterThan(0);
  });

  it("renders content grid section", () => {
    const { container } = render(<DashboardSkeleton />);
    // Look for content grid cards
    const contentCards = container.querySelectorAll(".rounded-lg.border");
    expect(contentCards.length).toBeGreaterThan(4); // At least stats cards + content cards
  });

  it("renders header section", () => {
    const { container } = render(<DashboardSkeleton />);
    // Header should have title and action button skeletons
    const headerSkeletons = container.querySelectorAll(".h-8, .h-10, .h-4");
    expect(headerSkeletons.length).toBeGreaterThan(0);
  });

  it("has animate-pulse class on skeleton elements", () => {
    const { container } = render(<DashboardSkeleton />);
    const pulsingElements = container.querySelectorAll(".animate-pulse");
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it("renders with proper grid layout", () => {
    const { container } = render(<DashboardSkeleton />);
    const gridElements = container.querySelectorAll(".grid");
    expect(gridElements.length).toBeGreaterThan(0);
  });
});
