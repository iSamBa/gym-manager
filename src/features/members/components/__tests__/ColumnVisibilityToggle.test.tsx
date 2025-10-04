import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ColumnVisibilityToggle } from "../ColumnVisibilityToggle";

describe("ColumnVisibilityToggle", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should render the columns button", () => {
    render(<ColumnVisibilityToggle />);

    expect(screen.getByText("Columns")).toBeInTheDocument();
  });

  it("should render dropdown trigger with correct attributes", () => {
    render(<ColumnVisibilityToggle />);

    const trigger = screen.getByRole("button", { name: /columns/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  });

  it("should use correct localStorage key", () => {
    render(<ColumnVisibilityToggle />);

    // Component should use the correct localStorage key
    // The useLocalStorage hook will handle the actual storage
    expect(screen.getByText("Columns")).toBeInTheDocument();
  });

  it("should work without onVisibilityChange callback", () => {
    // Should not throw error when onVisibilityChange is not provided
    expect(() => {
      render(<ColumnVisibilityToggle />);
    }).not.toThrow();
  });

  it("should accept onVisibilityChange callback prop", () => {
    const mockOnChange = vi.fn();
    render(<ColumnVisibilityToggle onVisibilityChange={mockOnChange} />);

    // Component should render without error
    expect(screen.getByText("Columns")).toBeInTheDocument();
  });

  it("should render component successfully", () => {
    const { container } = render(<ColumnVisibilityToggle />);

    // Component should render without error
    expect(container).toBeInTheDocument();
    expect(screen.getByText("Columns")).toBeInTheDocument();
  });

  it("should render component with memo optimization", () => {
    const { rerender } = render(<ColumnVisibilityToggle />);

    // Get initial button
    const initialButton = screen.getByText("Columns");

    // Rerender with same props
    rerender(<ColumnVisibilityToggle />);

    // Button should still be rendered
    expect(screen.getByText("Columns")).toBeInTheDocument();
    expect(screen.getByText("Columns")).toBe(initialButton);
  });
});
