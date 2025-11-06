import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionStatsCards } from "../SessionStatsCards";

describe("SessionStatsCards", () => {
  it("should render three stat cards", () => {
    render(<SessionStatsCards done={5} remaining={10} scheduled={3} />);

    expect(screen.getByText("Sessions Done")).toBeInTheDocument();
    expect(screen.getByText("Sessions Remaining")).toBeInTheDocument();
    expect(screen.getByText("Sessions Scheduled")).toBeInTheDocument();
  });

  it("should display correct numbers", () => {
    render(<SessionStatsCards done={5} remaining={10} scheduled={3} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should display Unlimited when remaining is null", () => {
    render(<SessionStatsCards done={5} remaining={null} scheduled={3} />);

    expect(screen.getByText("Unlimited")).toBeInTheDocument();
  });

  it("should display zero values correctly", () => {
    render(<SessionStatsCards done={0} remaining={0} scheduled={0} />);

    // All three cards should have 0
    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(3);
  });

  it("should display descriptive subtitles", () => {
    render(<SessionStatsCards done={5} remaining={10} scheduled={3} />);

    expect(screen.getByText("Completed sessions")).toBeInTheDocument();
    expect(screen.getByText("Available to book")).toBeInTheDocument();
    expect(screen.getByText("Upcoming sessions")).toBeInTheDocument();
  });
});
