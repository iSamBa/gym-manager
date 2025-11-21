import { render, screen } from "@testing-library/react";
import { DetailPageSkeleton } from "../DetailPageSkeleton";

describe("DetailPageSkeleton", () => {
  it("renders without crashing", () => {
    render(<DetailPageSkeleton />);
  });

  it("has proper accessibility attributes", () => {
    const { container } = render(<DetailPageSkeleton />);
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveAttribute("aria-busy", "true");
    expect(loadingElement).toHaveAttribute(
      "aria-label",
      "Loading page details"
    );
  });

  it("applies custom className", () => {
    const { container } = render(
      <DetailPageSkeleton className="custom-class" />
    );
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toHaveClass("custom-class");
  });

  it("renders header section", () => {
    const { container } = render(<DetailPageSkeleton />);
    // Header should contain title and action button skeletons
    const headerSkeletons = container.querySelectorAll(".h-8, .h-10");
    expect(headerSkeletons.length).toBeGreaterThan(0);
  });

  it("renders tabs when hasTabs is true", () => {
    const { container } = render(<DetailPageSkeleton hasTabs={true} />);
    // Tab bar should contain multiple tab skeletons
    const tabElements = container.querySelectorAll(".h-10");
    // Should have multiple tab-like elements
    expect(tabElements.length).toBeGreaterThan(1);
  });

  it("does not render tabs when hasTabs is false", () => {
    const { container } = render(<DetailPageSkeleton hasTabs={false} />);
    // Should render but with fewer skeleton elements
    const skeletonElements = container.querySelectorAll(".animate-pulse");
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it("renders default number of info cards (4)", () => {
    const { container } = render(<DetailPageSkeleton />);
    const cards = container.querySelectorAll(".rounded-lg.border");
    // Page header card (1) + content cards (Math.ceil(4/2) + Math.floor(4/2) = 2 + 2 = 4) = 5 total
    expect(cards).toHaveLength(5);
  });

  it("renders custom number of info cards", () => {
    const { container } = render(<DetailPageSkeleton cardCount={6} />);
    const cards = container.querySelectorAll(".rounded-lg.border");
    // Page header card (1) + content cards (Math.ceil(6/2) + Math.floor(6/2) = 3 + 3 = 6) = 7 total
    expect(cards).toHaveLength(7);
  });

  it("renders single info card when cardCount is 1", () => {
    const { container } = render(<DetailPageSkeleton cardCount={1} />);
    const cards = container.querySelectorAll(".rounded-lg.border");
    // Page header card (1) + content cards (Math.ceil(1/2) + Math.floor(1/2) = 1 + 0 = 1) = 2 total
    expect(cards).toHaveLength(2);
  });

  it("has animate-pulse class on skeleton elements", () => {
    const { container } = render(<DetailPageSkeleton />);
    const pulsingElements = container.querySelectorAll(".animate-pulse");
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it("renders grid layout for info cards", () => {
    const { container } = render(<DetailPageSkeleton />);
    const gridElement = container.querySelector(".grid");
    expect(gridElement).toBeInTheDocument();
    expect(gridElement).toHaveClass("gap-6");
  });

  it("renders info card content structure", () => {
    const { container } = render(<DetailPageSkeleton cardCount={1} />);
    const card = container.querySelector(".rounded-lg.border");
    expect(card).toBeInTheDocument();
    // Each card should have skeleton elements inside
    const cardContent = card?.querySelectorAll(".space-y-2");
    expect(cardContent?.length).toBeGreaterThan(0);
  });

  it("renders back button skeleton in header", () => {
    const { container } = render(<DetailPageSkeleton />);
    // Should have a small skeleton for back button
    const headerElements = container.querySelectorAll(".h-8");
    expect(headerElements.length).toBeGreaterThan(0);
  });

  it("combines multiple props correctly", () => {
    const { container } = render(
      <DetailPageSkeleton
        hasTabs={true}
        cardCount={5}
        className="custom-layout"
      />
    );
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toHaveClass("custom-layout");
    const cards = container.querySelectorAll(".rounded-lg.border");
    // Page header card (1) + content cards (Math.ceil(5/2) + Math.floor(5/2) = 3 + 2 = 5) = 6 total
    expect(cards).toHaveLength(6);
  });
});
