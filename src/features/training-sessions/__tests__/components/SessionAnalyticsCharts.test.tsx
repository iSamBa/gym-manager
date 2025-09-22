import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SessionAnalyticsCharts from "../../components/SessionAnalyticsCharts";

const mockAnalytics = {
  session_trends: [
    {
      period: "2024-01-01",
      session_count: 25,
      attendance_rate: 85,
      revenue: 2500,
    },
    {
      period: "2024-02-01",
      session_count: 30,
      attendance_rate: 90,
      revenue: 3000,
    },
    {
      period: "2024-03-01",
      session_count: 28,
      attendance_rate: 88,
      revenue: 2800,
    },
  ],
  session_types: [
    { category: "standard", count: 45, percentage: 60 },
    { category: "trial", count: 20, percentage: 27 },
    { category: "premium", count: 10, percentage: 13 },
  ],
  hourly_distribution: [
    { hour: 9, session_count: 15, utilization_rate: 75 },
    { hour: 10, session_count: 20, utilization_rate: 85 },
    { hour: 18, session_count: 25, utilization_rate: 95 },
  ],
  trainer_performance: [
    {
      trainer_id: "1",
      trainer_name: "John Doe",
      session_count: 25,
      attendance_rate: 85,
      revenue: 2500,
    },
    {
      trainer_id: "2",
      trainer_name: "Jane Smith",
      session_count: 20,
      attendance_rate: 90,
      revenue: 2000,
    },
  ],
};

describe("SessionAnalyticsCharts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders session trends chart", () => {
    render(<SessionAnalyticsCharts analytics={mockAnalytics} />);

    expect(screen.getByText("Session Trends Over Time")).toBeInTheDocument();
    expect(screen.getAllByText("Sessions")).toHaveLength(3); // Legend, KPI, and trainer performance
    expect(screen.getByText("Avg. Attendance:")).toBeInTheDocument();
  });

  it("renders session types distribution", () => {
    render(<SessionAnalyticsCharts analytics={mockAnalytics} />);

    expect(screen.getByText("Session Categories")).toBeInTheDocument();
    expect(screen.getByText("standard")).toBeInTheDocument();
    expect(screen.getByText("trial")).toBeInTheDocument();
    expect(screen.getByText("premium")).toBeInTheDocument();
    expect(screen.getByText("45 (60%)")).toBeInTheDocument();
    expect(screen.getByText("20 (27%)")).toBeInTheDocument();
    expect(screen.getByText("10 (13%)")).toBeInTheDocument();
  });

  it("renders peak hours analysis", () => {
    render(<SessionAnalyticsCharts analytics={mockAnalytics} />);

    expect(screen.getByText("Peak Hours")).toBeInTheDocument();
    expect(screen.getByText("09:00 - 10:00")).toBeInTheDocument();
    expect(screen.getByText("10:00 - 11:00")).toBeInTheDocument();
    expect(screen.getByText("18:00 - 19:00")).toBeInTheDocument();
    expect(screen.getByText("15 sessions")).toBeInTheDocument();
    expect(screen.getByText("20 sessions")).toBeInTheDocument();
    expect(screen.getByText("25 sessions")).toBeInTheDocument();
  });

  it("renders trainer performance section", () => {
    render(<SessionAnalyticsCharts analytics={mockAnalytics} />);

    expect(screen.getByText("Top Trainer Performance")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("ID: 1")).toBeInTheDocument();
    expect(screen.getByText("ID: 2")).toBeInTheDocument();
  });

  it("renders key performance indicators", () => {
    render(<SessionAnalyticsCharts analytics={mockAnalytics} />);

    expect(screen.getByText("Key Performance Indicators")).toBeInTheDocument();
    expect(screen.getByText("Total Sessions")).toBeInTheDocument();
    expect(screen.getByText("Avg Attendance")).toBeInTheDocument();
    expect(screen.getByText("Active Trainers")).toBeInTheDocument();
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
  });

  it("displays loading state", () => {
    render(
      <SessionAnalyticsCharts analytics={mockAnalytics} isLoading={true} />
    );

    const loadingElements = document.querySelectorAll(".animate-pulse");
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("handles empty data gracefully", () => {
    const emptyAnalytics = {
      session_trends: [],
      session_types: [],
      hourly_distribution: [],
      trainer_performance: [],
    };

    render(<SessionAnalyticsCharts analytics={emptyAnalytics} />);

    expect(screen.getByText("No session data available")).toBeInTheDocument();
    expect(screen.getByText("No hourly data available")).toBeInTheDocument();
    expect(screen.getByText("No trainer data available")).toBeInTheDocument();
  });

  it("calculates totals correctly", () => {
    render(<SessionAnalyticsCharts analytics={mockAnalytics} />);

    // Total sessions should be sum of all trends
    expect(screen.getByText("83")).toBeInTheDocument(); // 25 + 30 + 28

    // Total revenue should be sum of all trends
    expect(screen.getByText("$8,300")).toBeInTheDocument(); // 2500 + 3000 + 2800

    // Active trainers count - appears twice (one in legend, one in stats)
    const trainerCounts = screen.getAllByText("2");
    expect(trainerCounts.length).toBeGreaterThanOrEqual(1);
  });

  it("displays progress bars for session types", () => {
    render(<SessionAnalyticsCharts analytics={mockAnalytics} />);

    const progressBars = document.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBeGreaterThanOrEqual(3); // At least one for each session type
  });

  it("shows trainer performance rankings", () => {
    render(<SessionAnalyticsCharts analytics={mockAnalytics} />);

    const rankingElements = screen.getAllByText(/#[0-9]+/);
    expect(rankingElements).toHaveLength(5); // 3 peak hours + 2 trainers
  });

  it("displays utilization rates for peak hours", () => {
    render(<SessionAnalyticsCharts analytics={mockAnalytics} />);

    expect(screen.getByText("75% utilization")).toBeInTheDocument();
    expect(screen.getByText("85% utilization")).toBeInTheDocument();
    expect(screen.getByText("95% utilization")).toBeInTheDocument();
  });
});
