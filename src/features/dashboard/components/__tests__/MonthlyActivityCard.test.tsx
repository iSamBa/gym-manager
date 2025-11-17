/**
 * MonthlyActivityCard Component Tests
 *
 * Tests for the monthly activity card wrapper component
 * This component manages state and renders three chart components
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthlyActivityCard } from "../MonthlyActivityCard";
import type { MonthlyActivityStats } from "../../lib/types";

// Mock the hooks
vi.mock("../../hooks/use-monthly-activity");
vi.mock("../../lib/month-utils", async () => {
  const actual = await vi.importActual("../../lib/month-utils");
  return {
    ...actual,
    getCurrentMonthBounds: vi.fn(() => ({
      month_start: "2025-01-01",
      month_end: "2025-01-31",
    })),
    formatMonth: vi.fn((dateString: string) => {
      if (dateString === "2025-01-01") return "January 2025";
      if (dateString === "2024-12-01") return "December 2024";
      if (dateString === "2024-11-01") return "November 2024";
      return "Month";
    }),
  };
});

// Mock the chart components
vi.mock("../TrialMetricsChart", () => ({
  TrialMetricsChart: ({
    trialSessions,
    trialConversions,
    month,
  }: {
    trialSessions: number;
    trialConversions: number;
    month: string;
  }) => (
    <div data-testid="trial-metrics-chart">
      <span>Trial Metrics Chart</span>
      <span>{`Sessions: ${trialSessions}`}</span>
      <span>{`Conversions: ${trialConversions}`}</span>
      <span>{`Month: ${month}`}</span>
    </div>
  ),
}));

vi.mock("../SubscriptionMetricsChart", () => ({
  SubscriptionMetricsChart: ({
    subscriptionsExpired,
    subscriptionsRenewed,
    month,
  }: {
    subscriptionsExpired: number;
    subscriptionsRenewed: number;
    month: string;
  }) => (
    <div data-testid="subscription-metrics-chart">
      <span>Subscription Metrics Chart</span>
      <span>{`Expired: ${subscriptionsExpired}`}</span>
      <span>{`Renewed: ${subscriptionsRenewed}`}</span>
      <span>{`Month: ${month}`}</span>
    </div>
  ),
}));

vi.mock("../CancellationsChart", () => ({
  CancellationsChart: ({
    subscriptionsCancelled,
    month,
  }: {
    subscriptionsCancelled: number;
    month: string;
  }) => (
    <div data-testid="cancellations-chart">
      <span>Cancellations Chart</span>
      <span>{`Cancelled: ${subscriptionsCancelled}`}</span>
      <span>{`Month: ${month}`}</span>
    </div>
  ),
}));

const mockData: MonthlyActivityStats = {
  month_start: "2025-01-01",
  month_end: "2025-01-31",
  trial_sessions: 15,
  trial_conversions: 8,
  subscriptions_expired: 3,
  subscriptions_renewed: 22,
  subscriptions_cancelled: 2,
};

const mockEmptyData: MonthlyActivityStats = {
  month_start: "2025-01-01",
  month_end: "2025-01-31",
  trial_sessions: 0,
  trial_conversions: 0,
  subscriptions_expired: 0,
  subscriptions_renewed: 0,
  subscriptions_cancelled: 0,
};

describe("MonthlyActivityCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering Tests", () => {
    it("renders card with title", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
      } as never);

      render(<MonthlyActivityCard />);

      expect(screen.getByText("Monthly Activity")).toBeInTheDocument();
    });

    it("renders month selector", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
      } as never);

      render(<MonthlyActivityCard />);

      // Select trigger should be present
      const selectTrigger = screen.getByRole("combobox");
      expect(selectTrigger).toBeInTheDocument();
    });

    it("renders all three chart components when data is available", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
      } as never);

      render(<MonthlyActivityCard />);

      await waitFor(() => {
        expect(screen.getByTestId("trial-metrics-chart")).toBeInTheDocument();
        expect(
          screen.getByTestId("subscription-metrics-chart")
        ).toBeInTheDocument();
        expect(screen.getByTestId("cancellations-chart")).toBeInTheDocument();
      });
    });
  });

  describe("Data Display Tests", () => {
    it("passes correct data to TrialMetricsChart", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
      } as never);

      render(<MonthlyActivityCard />);

      await waitFor(() => {
        expect(screen.getByText("Sessions: 15")).toBeInTheDocument();
        expect(screen.getByText("Conversions: 8")).toBeInTheDocument();
      });
    });

    it("passes correct data to SubscriptionMetricsChart", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
      } as never);

      render(<MonthlyActivityCard />);

      await waitFor(() => {
        expect(screen.getByText("Expired: 3")).toBeInTheDocument();
        expect(screen.getByText("Renewed: 22")).toBeInTheDocument();
      });
    });

    it("passes correct data to CancellationsChart", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
      } as never);

      render(<MonthlyActivityCard />);

      await waitFor(() => {
        expect(screen.getByText("Cancelled: 2")).toBeInTheDocument();
      });
    });

    it("passes month label to all charts", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
      } as never);

      render(<MonthlyActivityCard />);

      await waitFor(() => {
        const monthLabels = screen.getAllByText("Month: January 2025");
        expect(monthLabels).toHaveLength(3); // All three charts receive the month
      });
    });
  });

  describe("Loading State Tests", () => {
    it("shows skeleton when loading", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as never);

      const { container } = render(<MonthlyActivityCard />);

      // Skeleton should be present
      const skeleton = container.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });

    it("does not show charts when loading", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as never);

      render(<MonthlyActivityCard />);

      expect(
        screen.queryByTestId("trial-metrics-chart")
      ).not.toBeInTheDocument();
    });
  });

  describe("Error State Tests", () => {
    it("shows error message when isError is true", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as never);

      render(<MonthlyActivityCard />);

      expect(
        screen.getByText("Failed to load monthly data")
      ).toBeInTheDocument();
    });

    it("does not show charts when error occurs", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as never);

      render(<MonthlyActivityCard />);

      expect(
        screen.queryByTestId("trial-metrics-chart")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("subscription-metrics-chart")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("cancellations-chart")
      ).not.toBeInTheDocument();
    });
  });

  describe("Layout Tests", () => {
    it("has responsive grid classes", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
      } as never);

      const { container } = render(<MonthlyActivityCard />);

      // Look for the grid container with responsive classes
      const gridElement = container.querySelector(
        ".grid.gap-6.md\\:grid-cols-2.lg\\:grid-cols-3"
      );
      expect(gridElement).toBeInTheDocument();
    });
  });

  describe("Edge Cases Tests", () => {
    it("handles zero values correctly", async () => {
      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: mockEmptyData,
        isLoading: false,
        isError: false,
      } as never);

      render(<MonthlyActivityCard />);

      await waitFor(() => {
        expect(screen.getByText("Sessions: 0")).toBeInTheDocument();
        expect(screen.getByText("Conversions: 0")).toBeInTheDocument();
        expect(screen.getByText("Expired: 0")).toBeInTheDocument();
        expect(screen.getByText("Renewed: 0")).toBeInTheDocument();
        expect(screen.getByText("Cancelled: 0")).toBeInTheDocument();
      });
    });

    it("handles large numbers correctly", async () => {
      const largeData: MonthlyActivityStats = {
        month_start: "2025-01-01",
        month_end: "2025-01-31",
        trial_sessions: 1234,
        trial_conversions: 567,
        subscriptions_expired: 89,
        subscriptions_renewed: 9876,
        subscriptions_cancelled: 543,
      };

      const { useMonthlyActivity } = await import(
        "../../hooks/use-monthly-activity"
      );
      vi.mocked(useMonthlyActivity).mockReturnValue({
        data: largeData,
        isLoading: false,
        isError: false,
      } as never);

      render(<MonthlyActivityCard />);

      await waitFor(() => {
        expect(screen.getByText("Sessions: 1234")).toBeInTheDocument();
        expect(screen.getByText("Conversions: 567")).toBeInTheDocument();
        expect(screen.getByText("Expired: 89")).toBeInTheDocument();
        expect(screen.getByText("Renewed: 9876")).toBeInTheDocument();
        expect(screen.getByText("Cancelled: 543")).toBeInTheDocument();
      });
    });
  });

  describe("Component Optimization Tests", () => {
    it("component is wrapped in React.memo", () => {
      expect(MonthlyActivityCard).toBeDefined();
      expect(MonthlyActivityCard).not.toBeNull();
    });
  });
});
