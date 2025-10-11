import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionNotificationBadge } from "../SessionNotificationBadge";

describe("SessionNotificationBadge", () => {
  it("renders badge with count", () => {
    render(<SessionNotificationBadge count={3} />);

    const badge = screen.getByTestId("notification-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("3");
  });

  it("does not render when count is 0", () => {
    const { container } = render(<SessionNotificationBadge count={0} />);

    // Component should return null
    expect(container.firstChild).toBeNull();
  });

  it("applies correct styling classes", () => {
    render(<SessionNotificationBadge count={2} />);

    const badge = screen.getByTestId("notification-badge");

    // Check for red background and positioning
    expect(badge).toHaveClass("bg-red-500");
    expect(badge).toHaveClass("absolute");
    expect(badge).toHaveClass("-top-2");
    expect(badge).toHaveClass("-right-2");
    expect(badge).toHaveClass("rounded-full");
  });

  it("has cursor-help for accessibility", () => {
    render(<SessionNotificationBadge count={1} />);

    const badge = screen.getByTestId("notification-badge");
    expect(badge).toHaveClass("cursor-help");
  });

  it("renders with single digit count", () => {
    render(<SessionNotificationBadge count={1} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders with double digit count", () => {
    render(<SessionNotificationBadge count={15} />);
    expect(screen.getByText("15")).toBeInTheDocument();
  });
});
