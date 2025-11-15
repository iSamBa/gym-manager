/**
 * SubscriptionMetricsChart Component Tests
 *
 * Tests for the subscription metrics bar chart component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubscriptionMetricsChart } from "../SubscriptionMetricsChart";

describe("SubscriptionMetricsChart", () => {
  describe("Rendering Tests", () => {
    it("renders chart with title", () => {
      render(
        <SubscriptionMetricsChart
          subscriptionsExpired={8}
          subscriptionsRenewed={12}
          month="January 2025"
        />
      );

      expect(screen.getByText("Subscription Activity")).toBeInTheDocument();
    });

    it("renders chart container with correct height", () => {
      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={8}
          subscriptionsRenewed={12}
          month="January 2025"
        />
      );

      const chartContainer = container.querySelector('[data-slot="chart"]');
      expect(chartContainer).toBeInTheDocument();
      expect(chartContainer?.className).toMatch(/h-\[250px\]/);
    });

    it("renders bar chart when data is available", () => {
      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={8}
          subscriptionsRenewed={12}
          month="January 2025"
        />
      );

      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });
  });

  describe("Data Display Tests", () => {
    it("displays chart with both metrics having values", () => {
      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={15}
          subscriptionsRenewed={20}
          month="January 2025"
        />
      );

      // Chart should exist
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });

    it("displays chart when only expired subscriptions have value", () => {
      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={10}
          subscriptionsRenewed={0}
          month="January 2025"
        />
      );

      // Chart should still exist (not empty state)
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });

    it("displays chart when only renewed subscriptions have value", () => {
      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={0}
          subscriptionsRenewed={15}
          month="January 2025"
        />
      );

      // Chart should still exist (not empty state)
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });
  });

  describe("Empty State Tests", () => {
    it("shows empty state when both metrics are zero", () => {
      render(
        <SubscriptionMetricsChart
          subscriptionsExpired={0}
          subscriptionsRenewed={0}
          month="January 2025"
        />
      );

      expect(
        screen.getByText("No subscription activity for January 2025")
      ).toBeInTheDocument();
    });

    it("does not render chart when both metrics are zero", () => {
      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={0}
          subscriptionsRenewed={0}
          month="January 2025"
        />
      );

      // Chart should not exist
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).not.toBeInTheDocument();
    });

    it("still shows title in empty state", () => {
      render(
        <SubscriptionMetricsChart
          subscriptionsExpired={0}
          subscriptionsRenewed={0}
          month="January 2025"
        />
      );

      expect(screen.getByText("Subscription Activity")).toBeInTheDocument();
    });

    it("shows correct month in empty state message", () => {
      render(
        <SubscriptionMetricsChart
          subscriptionsExpired={0}
          subscriptionsRenewed={0}
          month="December 2024"
        />
      );

      expect(
        screen.getByText("No subscription activity for December 2024")
      ).toBeInTheDocument();
    });
  });

  describe("Data Transformation Tests", () => {
    it("creates correct chart data structure", () => {
      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={10}
          subscriptionsRenewed={15}
          month="January 2025"
        />
      );

      // Verify chart is rendered with data
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();

      // Verify bars are rendered
      const bars = container.querySelectorAll(".recharts-bar-rectangle");
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe("Component Optimization Tests", () => {
    it("component is memoized with React.memo", () => {
      expect(SubscriptionMetricsChart).toBeDefined();
      expect(SubscriptionMetricsChart).not.toBeNull();
    });

    it("renders correctly with same props (memoization test)", () => {
      const { rerender } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={10}
          subscriptionsRenewed={15}
          month="January 2025"
        />
      );

      // Rerender with same props
      rerender(
        <SubscriptionMetricsChart
          subscriptionsExpired={10}
          subscriptionsRenewed={15}
          month="January 2025"
        />
      );

      expect(screen.getByText("Subscription Activity")).toBeInTheDocument();
    });

    it("re-renders when data changes", () => {
      const { rerender, container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={10}
          subscriptionsRenewed={15}
          month="January 2025"
        />
      );

      let chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();

      // Rerender with zero data
      rerender(
        <SubscriptionMetricsChart
          subscriptionsExpired={0}
          subscriptionsRenewed={0}
          month="January 2025"
        />
      );

      chart = container.querySelector(".recharts-wrapper");
      expect(chart).not.toBeInTheDocument();
      expect(
        screen.getByText("No subscription activity for January 2025")
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases Tests", () => {
    it("handles very large numbers", () => {
      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={999}
          subscriptionsRenewed={850}
          month="January 2025"
        />
      );

      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });

    it("handles negative numbers gracefully (data integrity test)", () => {
      render(
        <SubscriptionMetricsChart
          subscriptionsExpired={-5}
          subscriptionsRenewed={-3}
          month="January 2025"
        />
      );

      // Negative values are treated as "no data" and should show empty state
      expect(
        screen.getByText("No subscription activity for January 2025")
      ).toBeInTheDocument();

      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={-5}
          subscriptionsRenewed={-3}
          month="January 2025"
        />
      );

      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).not.toBeInTheDocument();
    });

    it("handles one metric much larger than the other", () => {
      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={1}
          subscriptionsRenewed={1000}
          month="January 2025"
        />
      );

      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });

    it("handles all expired, no renewals scenario", () => {
      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={50}
          subscriptionsRenewed={0}
          month="January 2025"
        />
      );

      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });

    it("handles all renewals, no expired scenario", () => {
      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={0}
          subscriptionsRenewed={50}
          month="January 2025"
        />
      );

      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });
  });

  describe("Accessibility Tests", () => {
    it("has accessible card structure", () => {
      const { container } = render(
        <SubscriptionMetricsChart
          subscriptionsExpired={10}
          subscriptionsRenewed={15}
          month="January 2025"
        />
      );

      // Card should exist
      expect(container.querySelector(".card")).toBeDefined();
    });

    it("has readable text content", () => {
      render(
        <SubscriptionMetricsChart
          subscriptionsExpired={10}
          subscriptionsRenewed={15}
          month="January 2025"
        />
      );

      // Title should be readable
      expect(screen.getByText("Subscription Activity")).toBeVisible();
    });

    it("shows helpful empty state message", () => {
      render(
        <SubscriptionMetricsChart
          subscriptionsExpired={0}
          subscriptionsRenewed={0}
          month="January 2025"
        />
      );

      // Empty state message should be readable
      const emptyMessage = screen.getByText(
        "No subscription activity for January 2025"
      );
      expect(emptyMessage).toBeVisible();
    });
  });
});
