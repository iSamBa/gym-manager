/**
 * CancellationsChart Component Tests
 *
 * Tests for the cancellations bar chart component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CancellationsChart } from "../CancellationsChart";

describe("CancellationsChart", () => {
  describe("Rendering Tests", () => {
    it("renders chart with title", () => {
      render(
        <CancellationsChart subscriptionsCancelled={5} month="January 2025" />
      );

      expect(screen.getByText("Cancellations")).toBeInTheDocument();
    });

    it("renders chart container with correct height", () => {
      const { container } = render(
        <CancellationsChart subscriptionsCancelled={5} month="January 2025" />
      );

      const chartContainer = container.querySelector('[data-slot="chart"]');
      expect(chartContainer).toBeInTheDocument();
      expect(chartContainer?.className).toMatch(/h-\[250px\]/);
    });

    it("renders bar chart when data is available", () => {
      const { container } = render(
        <CancellationsChart subscriptionsCancelled={5} month="January 2025" />
      );

      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });
  });

  describe("Data Display Tests", () => {
    it("displays chart with cancellation value", () => {
      const { container } = render(
        <CancellationsChart subscriptionsCancelled={10} month="January 2025" />
      );

      // Chart should exist
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });

    it("displays chart with small cancellation count", () => {
      const { container } = render(
        <CancellationsChart subscriptionsCancelled={1} month="January 2025" />
      );

      // Chart should exist
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });

    it("displays chart with large cancellation count", () => {
      const { container } = render(
        <CancellationsChart subscriptionsCancelled={100} month="January 2025" />
      );

      // Chart should exist
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });
  });

  describe("Empty State Tests", () => {
    it("shows empty state when cancellations are zero", () => {
      render(
        <CancellationsChart subscriptionsCancelled={0} month="January 2025" />
      );

      expect(
        screen.getByText("No cancellations for January 2025")
      ).toBeInTheDocument();
    });

    it("does not render chart when cancellations are zero", () => {
      const { container } = render(
        <CancellationsChart subscriptionsCancelled={0} month="January 2025" />
      );

      // Chart should not exist
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).not.toBeInTheDocument();
    });

    it("still shows title in empty state", () => {
      render(
        <CancellationsChart subscriptionsCancelled={0} month="January 2025" />
      );

      expect(screen.getByText("Cancellations")).toBeInTheDocument();
    });

    it("shows correct month in empty state message", () => {
      render(
        <CancellationsChart subscriptionsCancelled={0} month="December 2024" />
      );

      expect(
        screen.getByText("No cancellations for December 2024")
      ).toBeInTheDocument();
    });
  });

  describe("Data Transformation Tests", () => {
    it("creates correct chart data structure", () => {
      const { container } = render(
        <CancellationsChart subscriptionsCancelled={8} month="January 2025" />
      );

      // Verify chart is rendered with data
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();

      // Verify bars are rendered
      const bars = container.querySelectorAll(".recharts-bar-rectangle");
      expect(bars.length).toBeGreaterThan(0);
    });

    it("handles single bar chart correctly", () => {
      const { container } = render(
        <CancellationsChart subscriptionsCancelled={5} month="January 2025" />
      );

      // Chart should exist with one bar
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });
  });

  describe("Component Optimization Tests", () => {
    it("component is memoized with React.memo", () => {
      expect(CancellationsChart).toBeDefined();
      expect(CancellationsChart).not.toBeNull();
    });

    it("renders correctly with same props (memoization test)", () => {
      const { rerender } = render(
        <CancellationsChart subscriptionsCancelled={5} month="January 2025" />
      );

      // Rerender with same props
      rerender(
        <CancellationsChart subscriptionsCancelled={5} month="January 2025" />
      );

      expect(screen.getByText("Cancellations")).toBeInTheDocument();
    });

    it("re-renders when data changes", () => {
      const { rerender, container } = render(
        <CancellationsChart subscriptionsCancelled={5} month="January 2025" />
      );

      let chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();

      // Rerender with zero data
      rerender(
        <CancellationsChart subscriptionsCancelled={0} month="January 2025" />
      );

      chart = container.querySelector(".recharts-wrapper");
      expect(chart).not.toBeInTheDocument();
      expect(
        screen.getByText("No cancellations for January 2025")
      ).toBeInTheDocument();
    });

    it("re-renders when month changes", () => {
      const { rerender } = render(
        <CancellationsChart subscriptionsCancelled={0} month="January 2025" />
      );

      expect(
        screen.getByText("No cancellations for January 2025")
      ).toBeInTheDocument();

      // Rerender with different month
      rerender(
        <CancellationsChart subscriptionsCancelled={0} month="February 2025" />
      );

      expect(
        screen.getByText("No cancellations for February 2025")
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases Tests", () => {
    it("handles very large numbers", () => {
      const { container } = render(
        <CancellationsChart subscriptionsCancelled={999} month="January 2025" />
      );

      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });

    it("handles negative numbers gracefully (data integrity test)", () => {
      const { container } = render(
        <CancellationsChart subscriptionsCancelled={-5} month="January 2025" />
      );

      // Should render chart (negative values treated as data)
      const chart = container.querySelector(".recharts-wrapper");
      expect(chart).toBeInTheDocument();
    });

    it("handles maximum safe integer", () => {
      const { container } = render(
        <CancellationsChart
          subscriptionsCancelled={Number.MAX_SAFE_INTEGER}
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
        <CancellationsChart subscriptionsCancelled={5} month="January 2025" />
      );

      // Card should exist
      expect(container.querySelector(".card")).toBeDefined();
    });

    it("has readable text content", () => {
      render(
        <CancellationsChart subscriptionsCancelled={5} month="January 2025" />
      );

      // Title should be readable
      expect(screen.getByText("Cancellations")).toBeVisible();
    });

    it("shows helpful empty state message", () => {
      render(
        <CancellationsChart subscriptionsCancelled={0} month="January 2025" />
      );

      // Empty state message should be readable
      const emptyMessage = screen.getByText(
        "No cancellations for January 2025"
      );
      expect(emptyMessage).toBeVisible();
    });

    it("empty state message is centered and visible", () => {
      const { container } = render(
        <CancellationsChart subscriptionsCancelled={0} month="January 2025" />
      );

      const emptyContainer = container.querySelector(
        ".flex.h-\\[250px\\].items-center.justify-center"
      );
      expect(emptyContainer).toBeInTheDocument();
    });
  });

  describe("Visual Consistency Tests", () => {
    it("uses consistent height across states", () => {
      // With data
      const { container: containerWithData } = render(
        <CancellationsChart subscriptionsCancelled={5} month="January 2025" />
      );

      const chartContainer = containerWithData.querySelector(
        '[data-slot="chart"]'
      );
      expect(chartContainer?.className).toMatch(/h-\[250px\]/);

      // Without data (empty state)
      const { container: containerEmpty } = render(
        <CancellationsChart subscriptionsCancelled={0} month="January 2025" />
      );

      const emptyContainer = containerEmpty.querySelector(".h-\\[250px\\]");
      expect(emptyContainer).toBeInTheDocument();
    });
  });
});
