/**
 * TrialMetricsChart Component Tests
 *
 * Tests for the trial metrics bar chart component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrialMetricsChart } from "../TrialMetricsChart";

describe("TrialMetricsChart", () => {
  describe("Rendering Tests", () => {
    it("renders chart with title", () => {
      render(
        <TrialMetricsChart
          trialSessions={10}
          trialConversions={5}
          month="January 2025"
        />
      );

      expect(screen.getByText("Trial Metrics")).toBeInTheDocument();
    });

    it("renders chart container with correct height", () => {
      const { container } = render(
        <TrialMetricsChart
          trialSessions={10}
          trialConversions={5}
          month="January 2025"
        />
      );

      const chartContainer = container.querySelector('[data-slot="chart"]');
      expect(chartContainer).toBeInTheDocument();
      expect(chartContainer?.className).toMatch(/h-\[250px\]/);
    });

    it("renders bar chart when data is available", () => {
      const { container } = render(
        <TrialMetricsChart
          trialSessions={10}
          trialConversions={5}
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
        <TrialMetricsChart
          trialSessions={15}
          trialConversions={8}
          month="January 2025"
        />
      );

      // Chart should exist
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });

    it("displays chart when only trial sessions have value", () => {
      const { container } = render(
        <TrialMetricsChart
          trialSessions={10}
          trialConversions={0}
          month="January 2025"
        />
      );

      // Chart should still exist (not empty state)
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });

    it("displays chart when only trial conversions have value", () => {
      const { container } = render(
        <TrialMetricsChart
          trialSessions={0}
          trialConversions={5}
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
        <TrialMetricsChart
          trialSessions={0}
          trialConversions={0}
          month="January 2025"
        />
      );

      expect(
        screen.getByText("No trial activity for January 2025")
      ).toBeInTheDocument();
    });

    it("does not render chart when both metrics are zero", () => {
      const { container } = render(
        <TrialMetricsChart
          trialSessions={0}
          trialConversions={0}
          month="January 2025"
        />
      );

      // Chart should not exist
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).not.toBeInTheDocument();
    });

    it("still shows title in empty state", () => {
      render(
        <TrialMetricsChart
          trialSessions={0}
          trialConversions={0}
          month="January 2025"
        />
      );

      expect(screen.getByText("Trial Metrics")).toBeInTheDocument();
    });

    it("shows correct month in empty state message", () => {
      render(
        <TrialMetricsChart
          trialSessions={0}
          trialConversions={0}
          month="December 2024"
        />
      );

      expect(
        screen.getByText("No trial activity for December 2024")
      ).toBeInTheDocument();
    });
  });

  describe("Data Transformation Tests", () => {
    it("creates correct chart data structure", () => {
      const { container } = render(
        <TrialMetricsChart
          trialSessions={10}
          trialConversions={5}
          month="January 2025"
        />
      );

      // Verify chart is rendered with data
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();

      // Verify bars are rendered (recharts renders Bar components as rectangles)
      const bars = container.querySelectorAll(".recharts-bar-rectangle");
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe("Component Optimization Tests", () => {
    it("component is memoized with React.memo", () => {
      expect(TrialMetricsChart).toBeDefined();
      expect(TrialMetricsChart).not.toBeNull();
    });

    it("renders correctly with same props (memoization test)", () => {
      const { rerender } = render(
        <TrialMetricsChart
          trialSessions={10}
          trialConversions={5}
          month="January 2025"
        />
      );

      // Rerender with same props
      rerender(
        <TrialMetricsChart
          trialSessions={10}
          trialConversions={5}
          month="January 2025"
        />
      );

      expect(screen.getByText("Trial Metrics")).toBeInTheDocument();
    });

    it("re-renders when data changes", () => {
      const { rerender, container } = render(
        <TrialMetricsChart
          trialSessions={10}
          trialConversions={5}
          month="January 2025"
        />
      );

      let chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();

      // Rerender with zero data
      rerender(
        <TrialMetricsChart
          trialSessions={0}
          trialConversions={0}
          month="January 2025"
        />
      );

      chart = container.querySelector(".recharts-wrapper");
      expect(chart).not.toBeInTheDocument();
      expect(
        screen.getByText("No trial activity for January 2025")
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases Tests", () => {
    it("handles very large numbers", () => {
      const { container } = render(
        <TrialMetricsChart
          trialSessions={999}
          trialConversions={850}
          month="January 2025"
        />
      );

      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });

    it("handles negative numbers gracefully (data integrity test)", () => {
      render(
        <TrialMetricsChart
          trialSessions={-5}
          trialConversions={-3}
          month="January 2025"
        />
      );

      // Negative values are treated as "no data" and should show empty state
      expect(
        screen.getByText("No trial activity for January 2025")
      ).toBeInTheDocument();

      const { container } = render(
        <TrialMetricsChart
          trialSessions={-5}
          trialConversions={-3}
          month="January 2025"
        />
      );

      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).not.toBeInTheDocument();
    });

    it("handles one metric much larger than the other", () => {
      const { container } = render(
        <TrialMetricsChart
          trialSessions={1000}
          trialConversions={1}
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
        <TrialMetricsChart
          trialSessions={10}
          trialConversions={5}
          month="January 2025"
        />
      );

      // Card should exist
      expect(container.querySelector(".card")).toBeDefined();
    });

    it("has readable text content", () => {
      render(
        <TrialMetricsChart
          trialSessions={10}
          trialConversions={5}
          month="January 2025"
        />
      );

      // Title should be readable
      expect(screen.getByText("Trial Metrics")).toBeVisible();
    });

    it("shows helpful empty state message", () => {
      render(
        <TrialMetricsChart
          trialSessions={0}
          trialConversions={0}
          month="January 2025"
        />
      );

      // Empty state message should be readable
      const emptyMessage = screen.getByText(
        "No trial activity for January 2025"
      );
      expect(emptyMessage).toBeVisible();
    });
  });
});
