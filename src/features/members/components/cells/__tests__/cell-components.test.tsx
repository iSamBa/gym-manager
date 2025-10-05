/**
 * US-004: Helper Components Unit Tests
 * Tests for DateCell, SessionCountBadge, BalanceBadge, MemberTypeBadge
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  DateCell,
  SessionCountBadge,
  BalanceBadge,
  MemberTypeBadge,
} from "../index";

describe("DateCell Component", () => {
  /**
   * Test 1: DateCell - Null Handling (Default)
   */
  it("should show default '-' for null date", () => {
    render(<DateCell date={null} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  /**
   * Test 2: DateCell - Null Handling (Custom)
   */
  it("should show custom empty text for null date", () => {
    render(<DateCell date={null} emptyText="No date" />);
    expect(screen.getByText("No date")).toBeInTheDocument();
  });

  /**
   * Test 3: DateCell - Short Format
   */
  it("should format date in short format", () => {
    render(<DateCell date="2024-01-15T10:00:00Z" format="short" />);
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  /**
   * Test 4: DateCell - Long Format
   */
  it("should format date in long format", () => {
    render(<DateCell date="2024-01-15T10:00:00Z" format="long" />);
    expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
  });

  /**
   * Test 5: DateCell - With Icon
   */
  it("should show icon when showIcon is true", () => {
    const { container } = render(
      <DateCell date="2024-01-15T10:00:00Z" showIcon={true} />
    );
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  /**
   * Test 6: DateCell - Without Icon
   */
  it("should not show icon when showIcon is false", () => {
    const { container } = render(
      <DateCell date="2024-01-15T10:00:00Z" showIcon={false} />
    );
    const icon = container.querySelector("svg");
    expect(icon).toBeNull();
  });
});

describe("SessionCountBadge Component", () => {
  /**
   * Test 7: SessionCountBadge - Zero Sessions (Gray)
   */
  it("should use gray color for 0 sessions", () => {
    const { container } = render(<SessionCountBadge count={0} />);
    const badge = container.querySelector(".bg-gray-100");
    expect(badge).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  /**
   * Test 8: SessionCountBadge - Low Count (Green)
   */
  it("should use green color for 1-5 sessions", () => {
    const { container } = render(<SessionCountBadge count={3} />);
    const badge = container.querySelector(".bg-green-100");
    expect(badge).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  /**
   * Test 9: SessionCountBadge - High Count (Green)
   */
  it("should use green color for >5 sessions", () => {
    const { container } = render(<SessionCountBadge count={10} />);
    const badge = container.querySelector(".bg-green-100");
    expect(badge).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  /**
   * Test 10: SessionCountBadge - With Label
   */
  it("should display label when provided", () => {
    render(<SessionCountBadge count={5} label="sessions" />);
    expect(screen.getByText("sessions")).toBeInTheDocument();
  });

  /**
   * Test 11: SessionCountBadge - Icon Always Present
   */
  it("should always show calendar icon", () => {
    const { container } = render(<SessionCountBadge count={3} />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
});

describe("BalanceBadge Component", () => {
  /**
   * Test 12: BalanceBadge - Fully Paid (Green)
   */
  it("should show green badge for $0.00 balance", () => {
    const { container } = render(<BalanceBadge amount={0} />);
    const badge = container.querySelector(".bg-green-100");
    expect(badge).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  /**
   * Test 13: BalanceBadge - Outstanding Balance (Red)
   */
  it("should show red badge for outstanding balance", () => {
    render(<BalanceBadge amount={150.5} />);
    expect(screen.getByText("$150.50")).toBeInTheDocument();
  });

  /**
   * Test 14: BalanceBadge - Currency Format
   */
  it("should format currency correctly with 2 decimals", () => {
    render(<BalanceBadge amount={100} />);
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  /**
   * Test 15: BalanceBadge - Custom Currency
   */
  it("should support custom currency symbol", () => {
    render(<BalanceBadge amount={50} currency="€" />);
    expect(screen.getByText("€50.00")).toBeInTheDocument();
  });

  /**
   * Test 16: BalanceBadge - Icon Always Present
   */
  it("should always show dollar sign icon", () => {
    const { container } = render(<BalanceBadge amount={100} />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
});

describe("MemberTypeBadge Component", () => {
  /**
   * Test 17: MemberTypeBadge - Full Member (Blue)
   */
  it("should show blue badge for full member", () => {
    const { container } = render(<MemberTypeBadge type="full" />);
    const badge = container.querySelector(".bg-blue-100");
    expect(badge).toBeInTheDocument();
    expect(screen.getByText("Full")).toBeInTheDocument();
  });

  /**
   * Test 18: MemberTypeBadge - Trial Member (Purple)
   */
  it("should show purple badge for trial member", () => {
    const { container } = render(<MemberTypeBadge type="trial" />);
    const badge = container.querySelector(".bg-purple-100");
    expect(badge).toBeInTheDocument();
    expect(screen.getByText("Trial")).toBeInTheDocument();
  });

  /**
   * Test 19: MemberTypeBadge - With Icon (Default)
   */
  it("should show icon by default", () => {
    const { container } = render(<MemberTypeBadge type="full" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  /**
   * Test 20: MemberTypeBadge - Without Icon
   */
  it("should not show icon when showIcon is false", () => {
    const { container } = render(
      <MemberTypeBadge type="full" showIcon={false} />
    );
    const icon = container.querySelector("svg");
    expect(icon).toBeNull();
  });

  /**
   * Test 21: MemberTypeBadge - Small Size
   */
  it("should apply small size classes", () => {
    const { container } = render(<MemberTypeBadge type="full" size="sm" />);
    const badge = container.querySelector(".text-xs");
    expect(badge).toBeInTheDocument();
  });

  /**
   * Test 22: MemberTypeBadge - Medium Size
   */
  it("should apply different size classes for medium", () => {
    const { container } = render(<MemberTypeBadge type="full" size="md" />);
    const icon = container.querySelector(".h-4");
    // Medium size should have h-4 w-4 icon (vs h-3 w-3 for small)
    expect(icon).toBeInTheDocument();
  });
});

describe("Component Exports", () => {
  /**
   * Test 23: All Components Exported
   */
  it("should export all cell components", () => {
    expect(DateCell).toBeDefined();
    expect(SessionCountBadge).toBeDefined();
    expect(BalanceBadge).toBeDefined();
    expect(MemberTypeBadge).toBeDefined();
  });
});
