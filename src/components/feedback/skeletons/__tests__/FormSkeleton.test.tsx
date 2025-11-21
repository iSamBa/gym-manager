import { render, screen } from "@testing-library/react";
import { FormSkeleton } from "../FormSkeleton";

describe("FormSkeleton", () => {
  it("renders without crashing", () => {
    render(<FormSkeleton />);
  });

  it("has proper accessibility attributes", () => {
    const { container } = render(<FormSkeleton />);
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveAttribute("aria-busy", "true");
    expect(loadingElement).toHaveAttribute("aria-label", "Loading form");
  });

  it("applies custom className", () => {
    const { container } = render(<FormSkeleton className="custom-class" />);
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toHaveClass("custom-class");
  });

  it("renders default number of fields (6)", () => {
    const { container } = render(<FormSkeleton />);
    // Each field has a label and input skeleton, but form header also has .space-y-2
    const fieldContainers = container.querySelectorAll(".space-y-2");
    expect(fieldContainers).toHaveLength(7); // 6 fields + 1 header
  });

  it("renders custom number of fields", () => {
    const { container } = render(<FormSkeleton fieldCount={10} />);
    const fieldContainers = container.querySelectorAll(".space-y-2");
    expect(fieldContainers).toHaveLength(11); // 10 fields + 1 header
  });

  it("renders single field when fieldCount is 1", () => {
    const { container } = render(<FormSkeleton fieldCount={1} />);
    const fieldContainers = container.querySelectorAll(".space-y-2");
    expect(fieldContainers).toHaveLength(2); // 1 field + 1 header
  });

  it("renders step indicator when hasMultiStep is true", () => {
    const { container } = render(<FormSkeleton hasMultiStep={true} />);
    // Step indicator should have circular step markers (h-8 w-8)
    const stepCircles = container.querySelectorAll(".h-8.w-8.rounded-full");
    expect(stepCircles.length).toBe(3); // 3 steps
  });

  it("does not render step indicator when hasMultiStep is false", () => {
    const { container } = render(<FormSkeleton hasMultiStep={false} />);
    // Should not have step circles
    const stepCircles = container.querySelectorAll(".h-8.w-8.rounded-full");
    expect(stepCircles.length).toBe(0);
  });

  it("has animate-pulse class on skeleton elements", () => {
    const { container } = render(<FormSkeleton />);
    const pulsingElements = container.querySelectorAll(".animate-pulse");
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it("renders form field structure with label and input", () => {
    const { container } = render(<FormSkeleton fieldCount={1} />);
    const fieldContainer = container.querySelector(".space-y-2");
    expect(fieldContainer).toBeInTheDocument();
    // Should have skeleton elements for label and input
    const skeletonElements = fieldContainer?.querySelectorAll(".animate-pulse");
    expect(skeletonElements?.length).toBeGreaterThanOrEqual(2);
  });

  it("renders action buttons at the bottom", () => {
    const { container } = render(<FormSkeleton />);
    // Should have button skeletons at the bottom (h-10 is typical button height)
    const buttonSkeletons = container.querySelectorAll(".h-10");
    expect(buttonSkeletons.length).toBeGreaterThan(0);
  });

  it("renders proper spacing for form fields", () => {
    const { container } = render(<FormSkeleton />);
    const formFields = container.querySelector(".space-y-6");
    expect(formFields).toBeInTheDocument();
  });

  it("combines multiple props correctly", () => {
    const { container } = render(
      <FormSkeleton
        fieldCount={8}
        hasMultiStep={true}
        className="custom-form"
      />
    );
    const loadingElement = container.querySelector('[role="status"]');
    expect(loadingElement).toHaveClass("custom-form");
    const fieldContainers = container.querySelectorAll(".space-y-2");
    expect(fieldContainers).toHaveLength(9); // 8 fields + 1 header
  });

  it("renders form header", () => {
    const { container } = render(<FormSkeleton />);
    // Form header should have title and description skeletons
    const headerSkeletons = container.querySelectorAll(".h-8, .h-4");
    expect(headerSkeletons.length).toBeGreaterThan(0);
  });

  it("each field has proper spacing", () => {
    const { container } = render(<FormSkeleton fieldCount={2} />);
    const fieldContainers = container.querySelectorAll(".space-y-2");
    fieldContainers.forEach((field) => {
      expect(field).toHaveClass("space-y-2");
    });
  });
});
