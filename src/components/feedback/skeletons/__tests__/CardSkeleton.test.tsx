import { render, screen } from "@testing-library/react";
import { CardSkeleton } from "../CardSkeleton";

describe("CardSkeleton", () => {
  it("renders without crashing", () => {
    render(<CardSkeleton />);
  });

  it("has proper accessibility attributes", () => {
    const { container } = render(<CardSkeleton />);
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveAttribute("aria-busy", "true");
    expect(loadingElement).toHaveAttribute("aria-label", "Loading cards");
  });

  it("applies custom className", () => {
    const { container } = render(<CardSkeleton className="custom-class" />);
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toHaveClass("custom-class");
  });

  it("renders default number of cards (6)", () => {
    const { container } = render(<CardSkeleton />);
    const cards = container.querySelectorAll(".rounded-lg");
    expect(cards).toHaveLength(6);
  });

  it("renders custom number of cards", () => {
    const { container } = render(<CardSkeleton count={5} />);
    const cards = container.querySelectorAll(".rounded-lg");
    expect(cards).toHaveLength(5);
  });

  it("renders single card when count is 1", () => {
    const { container } = render(<CardSkeleton count={1} />);
    const cards = container.querySelectorAll(".rounded-lg");
    expect(cards).toHaveLength(1);
  });

  it("applies default grid columns class (3)", () => {
    const { container } = render(<CardSkeleton />);
    const gridElement = container.querySelector(".grid");
    expect(gridElement).toHaveClass("md:grid-cols-2");
    expect(gridElement).toHaveClass("lg:grid-cols-3");
  });

  it("applies custom grid columns class", () => {
    const { container } = render(<CardSkeleton columns={4} />);
    const gridElement = container.querySelector(".grid");
    expect(gridElement).toHaveClass("md:grid-cols-2");
    expect(gridElement).toHaveClass("lg:grid-cols-4");
  });

  it("applies 2 columns grid class", () => {
    const { container } = render(<CardSkeleton columns={2} />);
    const gridElement = container.querySelector(".grid");
    expect(gridElement).toHaveClass("md:grid-cols-2");
  });

  it("has animate-pulse class on skeleton elements", () => {
    const { container } = render(<CardSkeleton />);
    const pulsingElements = container.querySelectorAll(".animate-pulse");
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it("renders card content structure", () => {
    const { container } = render(<CardSkeleton count={1} />);
    const card = container.querySelector(".rounded-lg");
    expect(card).toBeInTheDocument();
    // Each card should have skeleton elements inside
    const skeletonElements = card?.querySelectorAll(".animate-pulse");
    expect(skeletonElements?.length).toBeGreaterThan(0);
  });

  it("renders grid layout", () => {
    const { container } = render(<CardSkeleton />);
    const gridElement = container.querySelector(".grid");
    expect(gridElement).toBeInTheDocument();
    expect(gridElement).toHaveClass("gap-4");
  });

  it("combines custom className with default classes", () => {
    const { container } = render(
      <CardSkeleton className="custom-spacing" columns={2} />
    );
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toHaveClass("custom-spacing");
    const gridElement = container.querySelector(".grid");
    expect(gridElement).toHaveClass("md:grid-cols-2");
  });
});
