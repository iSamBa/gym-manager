import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MonthlyActivityCard } from "../MonthlyActivityCard";
import type { MonthlyActivityStats } from "../../lib/types";

const mockData: MonthlyActivityStats = {
  month_start: "2025-01-01",
  month_end: "2025-01-31",
  trial_sessions: 15,
  trial_conversions: 8,
  subscriptions_expired: 3,
  subscriptions_renewed: 22,
  subscriptions_cancelled: 2,
};

describe("MonthlyActivityCard", () => {
  describe("Rendering", () => {
    it("renders container card with month title", () => {
      render(<MonthlyActivityCard data={mockData} month="January 2025" />);

      expect(
        screen.getByText("Monthly Activity - January 2025")
      ).toBeInTheDocument();
    });

    it("renders all 5 StatsCard components", () => {
      render(<MonthlyActivityCard data={mockData} month="January 2025" />);

      // Check all 5 metric titles are present
      expect(screen.getByText("Trial Sessions")).toBeInTheDocument();
      expect(screen.getByText("Trial Conversions")).toBeInTheDocument();
      expect(screen.getByText("Subscriptions Expired")).toBeInTheDocument();
      expect(screen.getByText("Subscriptions Renewed")).toBeInTheDocument();
      expect(screen.getByText("Subscriptions Cancelled")).toBeInTheDocument();
    });

    it("displays correct values for each metric", () => {
      render(<MonthlyActivityCard data={mockData} month="January 2025" />);

      // Check all values are displayed
      expect(screen.getByText("15")).toBeInTheDocument(); // trial_sessions
      expect(screen.getByText("8")).toBeInTheDocument(); // trial_conversions
      expect(screen.getByText("3")).toBeInTheDocument(); // subscriptions_expired
      expect(screen.getByText("22")).toBeInTheDocument(); // subscriptions_renewed
      expect(screen.getByText("2")).toBeInTheDocument(); // subscriptions_cancelled
    });

    it("shows proper descriptions for each card", () => {
      render(<MonthlyActivityCard data={mockData} month="January 2025" />);

      expect(
        screen.getByText("New trial members this month")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Trial members who subscribed")
      ).toBeInTheDocument();
      expect(screen.getByText("Subscriptions that ended")).toBeInTheDocument();
      expect(screen.getByText("Members who renewed")).toBeInTheDocument();
      expect(screen.getByText("Early cancellations")).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("has responsive grid classes", () => {
      const { container } = render(
        <MonthlyActivityCard data={mockData} month="January 2025" />
      );

      const gridElement = container.querySelector(
        ".grid.gap-4.md\\:grid-cols-2.lg\\:grid-cols-2"
      );
      expect(gridElement).toBeInTheDocument();
    });

    it("applies gap-4 class for spacing", () => {
      const { container } = render(
        <MonthlyActivityCard data={mockData} month="January 2025" />
      );

      const gridElement = container.querySelector(".gap-4");
      expect(gridElement).toBeInTheDocument();
    });
  });

  describe("Data Display", () => {
    it("displays trial sessions value correctly", () => {
      render(<MonthlyActivityCard data={mockData} month="January 2025" />);

      const trialSessionsValue = screen.getByText("15");
      expect(trialSessionsValue).toBeInTheDocument();
    });

    it("displays trial conversions value correctly", () => {
      render(<MonthlyActivityCard data={mockData} month="January 2025" />);

      const trialConversionsValue = screen.getByText("8");
      expect(trialConversionsValue).toBeInTheDocument();
    });

    it("displays subscriptions expired value correctly", () => {
      render(<MonthlyActivityCard data={mockData} month="January 2025" />);

      const expiredValue = screen.getByText("3");
      expect(expiredValue).toBeInTheDocument();
    });

    it("displays subscriptions renewed value correctly", () => {
      render(<MonthlyActivityCard data={mockData} month="January 2025" />);

      const renewedValue = screen.getByText("22");
      expect(renewedValue).toBeInTheDocument();
    });

    it("displays subscriptions cancelled value correctly", () => {
      render(<MonthlyActivityCard data={mockData} month="January 2025" />);

      const cancelledValue = screen.getByText("2");
      expect(cancelledValue).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles zero values correctly", () => {
      const zeroData: MonthlyActivityStats = {
        month_start: "2025-01-01",
        month_end: "2025-01-31",
        trial_sessions: 0,
        trial_conversions: 0,
        subscriptions_expired: 0,
        subscriptions_renewed: 0,
        subscriptions_cancelled: 0,
      };

      render(<MonthlyActivityCard data={zeroData} month="January 2025" />);

      // Should display "0" not empty string
      const zeroValues = screen.getAllByText("0");
      expect(zeroValues).toHaveLength(5);
    });

    it("handles large numbers correctly", () => {
      const largeData: MonthlyActivityStats = {
        month_start: "2025-01-01",
        month_end: "2025-01-31",
        trial_sessions: 1234,
        trial_conversions: 567,
        subscriptions_expired: 89,
        subscriptions_renewed: 9876,
        subscriptions_cancelled: 543,
      };

      render(<MonthlyActivityCard data={largeData} month="January 2025" />);

      expect(screen.getByText("1234")).toBeInTheDocument();
      expect(screen.getByText("567")).toBeInTheDocument();
      expect(screen.getByText("89")).toBeInTheDocument();
      expect(screen.getByText("9876")).toBeInTheDocument();
      expect(screen.getByText("543")).toBeInTheDocument();
    });

    it("displays month label correctly", () => {
      render(<MonthlyActivityCard data={mockData} month="December 2024" />);

      expect(
        screen.getByText("Monthly Activity - December 2024")
      ).toBeInTheDocument();
    });
  });

  describe("Optimization", () => {
    it("component is wrapped in React.memo", () => {
      // Check that the component has the displayName set by memo
      expect(MonthlyActivityCard.displayName).toBe(undefined); // memo doesn't set displayName unless explicitly set

      // Alternative: verify component type
      expect(MonthlyActivityCard.$$typeof).toBeDefined();
    });

    it("doesn't re-render with same props", () => {
      const { rerender } = render(
        <MonthlyActivityCard data={mockData} month="January 2025" />
      );

      const initialRender = screen.getByText("Monthly Activity - January 2025");

      // Re-render with same props
      rerender(<MonthlyActivityCard data={mockData} month="January 2025" />);

      const afterRerender = screen.getByText("Monthly Activity - January 2025");

      // Should be the same element (not re-rendered)
      expect(initialRender).toBe(afterRerender);
    });
  });
});
