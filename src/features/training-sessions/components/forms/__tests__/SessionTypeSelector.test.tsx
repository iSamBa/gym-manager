import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SessionTypeSelector } from "../SessionTypeSelector";
import type { SessionType } from "@/features/database/lib/types";

describe("SessionTypeSelector", () => {
  // Test 1: Renders all 7 session type buttons
  it("renders all 7 session type buttons", () => {
    render(<SessionTypeSelector value="member" onChange={vi.fn()} />);

    expect(screen.getByText(/TRIAL SESSION/)).toBeInTheDocument();
    expect(screen.getByText(/MEMBER SESSION/)).toBeInTheDocument();
    expect(screen.getByText(/CONTRACTUAL SESSION/)).toBeInTheDocument();
    expect(screen.getByText(/MULTI-SITE SESSION/)).toBeInTheDocument();
    expect(screen.getByText(/COLLABORATION SESSION/)).toBeInTheDocument();
    expect(screen.getByText(/MAKE-UP SESSION/)).toBeInTheDocument();
    expect(screen.getByText(/NON-BOOKABLE SESSION/)).toBeInTheDocument();
  });

  // Test 2: Shows correct labels (uppercase)
  it("shows correct uppercase labels", () => {
    render(<SessionTypeSelector value="member" onChange={vi.fn()} />);

    // Verify exact uppercase text
    expect(screen.getByText("TRIAL SESSION")).toBeInTheDocument();
    expect(screen.getByText("MEMBER SESSION")).toBeInTheDocument();
    expect(screen.getByText("CONTRACTUAL SESSION")).toBeInTheDocument();
    expect(screen.getByText("MULTI-SITE SESSION")).toBeInTheDocument();
    expect(screen.getByText("COLLABORATION SESSION")).toBeInTheDocument();
    expect(screen.getByText("MAKE-UP SESSION")).toBeInTheDocument();
    expect(screen.getByText("NON-BOOKABLE SESSION")).toBeInTheDocument();
  });

  // Test 3: Shows correct descriptions
  it("shows correct descriptions for all types", () => {
    render(<SessionTypeSelector value="member" onChange={vi.fn()} />);

    expect(
      screen.getByText("Try-out session for new members")
    ).toBeInTheDocument();
    expect(screen.getByText("Regular training session")).toBeInTheDocument();
    expect(
      screen.getByText("Contract signing after trial")
    ).toBeInTheDocument();
    expect(screen.getByText("Member from another gym")).toBeInTheDocument();
    expect(screen.getByText("Commercial partnership")).toBeInTheDocument();
    expect(
      screen.getByText("Additional session (unlimited)")
    ).toBeInTheDocument();
    expect(screen.getByText("Time blocker")).toBeInTheDocument();
  });

  // Test 4: Highlights selected session type with color
  it("highlights selected session type with correct color", () => {
    render(<SessionTypeSelector value="trial" onChange={vi.fn()} />);

    const trialButton = screen.getByText("TRIAL SESSION").closest("button");
    expect(trialButton).toHaveClass("bg-blue-500");
    expect(trialButton).toHaveClass("text-white");
  });

  // Test 5: Calls onChange when button clicked
  it("calls onChange when button clicked", () => {
    const onChange = vi.fn();
    render(<SessionTypeSelector value="member" onChange={onChange} />);

    fireEvent.click(screen.getByText("TRIAL SESSION"));
    expect(onChange).toHaveBeenCalledWith("trial");
  });

  // Test 6: Passes correct session type value to onChange
  it("passes correct session type value to onChange for each button", () => {
    const onChange = vi.fn();
    render(<SessionTypeSelector value="member" onChange={onChange} />);

    fireEvent.click(screen.getByText("TRIAL SESSION"));
    expect(onChange).toHaveBeenCalledWith("trial");

    fireEvent.click(screen.getByText("CONTRACTUAL SESSION"));
    expect(onChange).toHaveBeenCalledWith("contractual");

    fireEvent.click(screen.getByText("MULTI-SITE SESSION"));
    expect(onChange).toHaveBeenCalledWith("multi_site");

    fireEvent.click(screen.getByText("COLLABORATION SESSION"));
    expect(onChange).toHaveBeenCalledWith("collaboration");

    fireEvent.click(screen.getByText("MAKE-UP SESSION"));
    expect(onChange).toHaveBeenCalledWith("makeup");

    fireEvent.click(screen.getByText("NON-BOOKABLE SESSION"));
    expect(onChange).toHaveBeenCalledWith("non_bookable");
  });

  // Test 7: Only one button selected at a time
  it("only highlights one button at a time", () => {
    const { rerender } = render(
      <SessionTypeSelector value="trial" onChange={vi.fn()} />
    );

    const trialButton = screen.getByText("TRIAL SESSION").closest("button");
    const memberButton = screen.getByText("MEMBER SESSION").closest("button");

    expect(trialButton).toHaveClass("bg-blue-500");
    expect(memberButton).not.toHaveClass("bg-green-500");
    expect(memberButton).toHaveClass("border-border");

    // Change selection
    rerender(<SessionTypeSelector value="member" onChange={vi.fn()} />);

    expect(trialButton).not.toHaveClass("bg-blue-500");
    expect(trialButton).toHaveClass("border-border");
    expect(memberButton).toHaveClass("bg-green-500");
  });

  // Test 8: Unselected buttons have border styling
  it("unselected buttons have correct border styling", () => {
    render(<SessionTypeSelector value="trial" onChange={vi.fn()} />);

    const memberButton = screen.getByText("MEMBER SESSION").closest("button");
    const contractualButton = screen
      .getByText("CONTRACTUAL SESSION")
      .closest("button");

    expect(memberButton).toHaveClass("border-border");
    expect(memberButton).toHaveClass("hover:border-muted-foreground");
    expect(contractualButton).toHaveClass("border-border");
    expect(contractualButton).toHaveClass("hover:border-muted-foreground");
  });

  // Test 9: Component is memoized (check if it's a memo component)
  it("component is memoized for performance", () => {
    // React.memo wraps components - check if it's wrapped
    expect(SessionTypeSelector).toBeDefined();
    expect(typeof SessionTypeSelector).toBe("object");
    // The component should be wrapped by memo, which adds $$typeof property
    expect(SessionTypeSelector.$$typeof).toBeDefined();
  });

  // Test 10: Grid layout is 1 column
  it("renders grid with 1 column layout", () => {
    const { container } = render(
      <SessionTypeSelector value="member" onChange={vi.fn()} />
    );

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("grid-cols-1");
  });

  // Test 11: All buttons have correct type attribute
  it('all buttons have type="button" to prevent form submission', () => {
    render(<SessionTypeSelector value="member" onChange={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(7);

    buttons.forEach((button) => {
      expect(button).toHaveAttribute("type", "button");
    });
  });

  // Test 12: Color classes match for each session type
  it("applies correct color classes for each session type", () => {
    const testCases: Array<{ value: SessionType; expectedClass: string }> = [
      { value: "trial", expectedClass: "bg-blue-500" },
      { value: "member", expectedClass: "bg-green-500" },
      { value: "contractual", expectedClass: "bg-orange-500" },
      { value: "multi_site", expectedClass: "bg-purple-500" },
      { value: "collaboration", expectedClass: "bg-lime-600" },
      { value: "makeup", expectedClass: "bg-blue-900" },
      { value: "non_bookable", expectedClass: "bg-red-500" },
    ];

    testCases.forEach(({ value, expectedClass }) => {
      const { container } = render(
        <SessionTypeSelector value={value} onChange={vi.fn()} />
      );

      const buttons = container.querySelectorAll("button");
      const selectedButton = Array.from(buttons).find((btn) =>
        btn.classList.contains(expectedClass)
      );

      expect(selectedButton).toBeTruthy();
    });
  });
});
