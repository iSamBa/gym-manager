import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionAlertsSection } from "../SessionAlertsSection";
import type { MemberComment } from "@/features/database/lib/types";

describe("SessionAlertsSection", () => {
  const mockAlerts: MemberComment[] = [
    {
      id: "1",
      member_id: "member-1",
      author: "John Doe",
      body: "Please check blood pressure before session",
      due_date: "2025-11-15",
      created_at: "2025-10-31T00:00:00.000Z",
      created_by: "admin-1",
      updated_at: "2025-10-31T00:00:00.000Z",
    },
    {
      id: "2",
      member_id: "member-1",
      author: "Jane Smith",
      body: "Member recovering from knee injury",
      due_date: "2025-12-01",
      created_at: "2025-10-31T00:00:00.000Z",
      created_by: "admin-1",
      updated_at: "2025-10-31T00:00:00.000Z",
    },
  ];

  it("should return null when no alerts", () => {
    const { container } = render(<SessionAlertsSection alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("should display alert count", () => {
    render(<SessionAlertsSection alerts={mockAlerts} />);
    expect(screen.getByText("Active Alerts (2)")).toBeInTheDocument();
  });

  it("should display alert author and body", () => {
    render(<SessionAlertsSection alerts={mockAlerts} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(
      screen.getByText("Please check blood pressure before session")
    ).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(
      screen.getByText("Member recovering from knee injury")
    ).toBeInTheDocument();
  });

  it("should display due dates when present", () => {
    render(<SessionAlertsSection alerts={mockAlerts} />);

    // date-fns PPP format will be "November 15th, 2025" and "December 1st, 2025"
    expect(screen.getByText(/November 15th, 2025/)).toBeInTheDocument();
    expect(screen.getByText(/December 1st, 2025/)).toBeInTheDocument();
  });

  it("should handle single alert", () => {
    render(<SessionAlertsSection alerts={[mockAlerts[0]]} />);

    expect(screen.getByText("Active Alerts (1)")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should handle alerts without due dates", () => {
    const alertWithoutDueDate: MemberComment = {
      ...mockAlerts[0],
      due_date: null,
    };

    render(<SessionAlertsSection alerts={[alertWithoutDueDate]} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(
      screen.getByText("Please check blood pressure before session")
    ).toBeInTheDocument();
  });
});
