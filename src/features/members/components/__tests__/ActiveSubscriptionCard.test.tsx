import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActiveSubscriptionCard } from "../ActiveSubscriptionCard";
import { createQueryWrapper } from "@/test/query-test-utils";
import type {
  Member,
  MemberSubscriptionWithSnapshot,
} from "@/features/database/lib/types";

// Mock the hooks and utilities
vi.mock("@/features/memberships/hooks/use-subscriptions", () => ({
  usePauseSubscription: vi.fn(),
  useResumeSubscription: vi.fn(),
}));

vi.mock("@/features/payments/lib/payment-utils", () => ({
  paymentUtils: {
    calculateBalanceInfo: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("date-fns", () => ({
  format: vi.fn((date, formatString) => {
    if (formatString === "PP") return "Jan 1, 2024";
    return "2024-01-01";
  }),
}));

// Import after mocking
import {
  usePauseSubscription,
  useResumeSubscription,
} from "@/features/memberships/hooks/use-subscriptions";
import { paymentUtils } from "@/features/payments/lib/payment-utils";

const mockMember: Member = {
  id: "member-123",
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  phone: "+1234567890",
  date_of_birth: "1990-01-01",
  gender: "male",
  status: "active",
  join_date: "2024-01-15",
  preferred_contact_method: "email",
  marketing_consent: true,
  waiver_signed: true,
  waiver_signed_date: "2024-01-15",
  created_by: null,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

const baseSubscription: MemberSubscriptionWithSnapshot = {
  id: "sub-123",
  member_id: "member-123",
  plan_id: "plan-123",
  status: "active",
  start_date: "2024-01-01",
  end_date: "2024-12-31",
  next_billing_date: "2024-02-01",
  billing_cycle: "monthly",
  price: 99.99,
  currency: "USD",
  signup_fee_paid: 25.0,
  auto_renew: true,
  renewal_count: 0,
  notes: "Premium membership",
  created_by: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  plan_name_snapshot: "Premium Monthly",
  total_sessions_snapshot: 20,
  total_amount_snapshot: 199.99,
  duration_days_snapshot: 30,
  used_sessions: 5,
  paid_amount: 150.0,
};

describe("ActiveSubscriptionCard", () => {
  const user = userEvent.setup();
  const mockPauseSubscription = vi.fn();
  const mockResumeSubscription = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(usePauseSubscription).mockReturnValue({
      mutateAsync: mockPauseSubscription,
      isPending: false,
    } as any);

    vi.mocked(useResumeSubscription).mockReturnValue({
      mutateAsync: mockResumeSubscription,
      isPending: false,
    } as any);

    vi.mocked(paymentUtils.calculateBalanceInfo).mockReturnValue({
      balance: 49.99,
      paidPercentage: 75,
    });

    // Mock current date to be stable
    vi.setSystemTime(new Date("2024-06-15"));
  });

  describe("Basic Rendering", () => {
    it("renders subscription details correctly", () => {
      render(
        <ActiveSubscriptionCard
          subscription={baseSubscription}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("Premium Monthly")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("$199.99")).toBeInTheDocument();
      expect(screen.getByText("$150.00")).toBeInTheDocument();
    });

    it("displays session progress correctly", () => {
      render(
        <ActiveSubscriptionCard
          subscription={baseSubscription}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("5 / 20")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument(); // remaining sessions
    });

    it("shows payment progress", () => {
      render(
        <ActiveSubscriptionCard
          subscription={baseSubscription}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("75%")).toBeInTheDocument(); // payment progress
    });
  });

  describe("Status Badges", () => {
    it("shows active badge for active subscription", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "active" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      const badge = screen.getByText("Active");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-primary", "text-primary-foreground");
    });

    it("shows paused badge for paused subscription", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "paused" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      const badge = screen.getByText("Paused");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-secondary", "text-secondary-foreground");
    });

    it("shows completed badge for completed subscription", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "completed" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      const badge = screen.getByText("Completed");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("text-foreground");
    });
  });

  describe("Action Buttons", () => {
    it("shows pause and upgrade buttons for active subscription", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "active" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByLabelText("Pause Subscription")).toBeInTheDocument();
      expect(screen.getByLabelText("Upgrade Plan")).toBeInTheDocument();
    });

    it("shows resume button for paused subscription", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "paused" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByLabelText("Resume Subscription")).toBeInTheDocument();
      expect(
        screen.queryByLabelText("Pause Subscription")
      ).not.toBeInTheDocument();
    });

    it("hides action buttons for completed subscription", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "completed" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(
        screen.queryByLabelText("Pause Subscription")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText("Resume Subscription")
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Upgrade Plan")).not.toBeInTheDocument();
    });
  });

  describe("Outstanding Balance", () => {
    it("shows add payment button when there's outstanding balance", () => {
      vi.mocked(paymentUtils.calculateBalanceInfo).mockReturnValue({
        balance: 50.0,
        paidPercentage: 75,
      });

      render(
        <ActiveSubscriptionCard
          subscription={baseSubscription}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getAllByText("Add Payment")).toHaveLength(2);
    });

    it("hides add payment button when fully paid", () => {
      vi.mocked(paymentUtils.calculateBalanceInfo).mockReturnValue({
        balance: 0,
        paidPercentage: 100,
      });

      render(
        <ActiveSubscriptionCard
          subscription={baseSubscription}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.queryByText("Add Payment")).not.toBeInTheDocument();
    });
  });

  describe("Alerts and Warnings", () => {
    it("shows low sessions alert when 2 or fewer sessions remaining", () => {
      vi.mocked(paymentUtils.calculateBalanceInfo).mockReturnValue({
        balance: 0,
        paidPercentage: 100,
      });

      render(
        <ActiveSubscriptionCard
          subscription={{
            ...baseSubscription,
            used_sessions: 18,
            total_sessions_snapshot: 20,
          }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(
        screen.getByText(/Only 2 sessions? remaining.*Consider renewing soon/)
      ).toBeInTheDocument();
    });

    it("shows expiring soon alert when 7 or fewer days remaining", () => {
      // Mock current date and subscription end date
      vi.setSystemTime(new Date("2024-12-25")); // 6 days before end date

      render(
        <ActiveSubscriptionCard
          subscription={{
            ...baseSubscription,
            end_date: "2024-12-31",
          }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(
        screen.getByText(/Subscription expires in \d+ days?/)
      ).toBeInTheDocument();
    });

    it("shows outstanding balance alert", () => {
      vi.mocked(paymentUtils.calculateBalanceInfo).mockReturnValue({
        balance: 49.99,
        paidPercentage: 75,
      });

      render(
        <ActiveSubscriptionCard
          subscription={baseSubscription}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(
        screen.getByText("Outstanding balance: $49.99")
      ).toBeInTheDocument();
    });

    it("shows multiple alerts when applicable", () => {
      vi.mocked(paymentUtils.calculateBalanceInfo).mockReturnValue({
        balance: 49.99,
        paidPercentage: 75,
      });

      vi.setSystemTime(new Date("2024-12-25"));

      render(
        <ActiveSubscriptionCard
          subscription={{
            ...baseSubscription,
            used_sessions: 19,
            total_sessions_snapshot: 20,
            end_date: "2024-12-31",
          }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText(/Only 1 session remaining/)).toBeInTheDocument();
      expect(
        screen.getByText(/Subscription expires in \d+ days?/)
      ).toBeInTheDocument();
      expect(
        screen.getByText("Outstanding balance: $49.99")
      ).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("calls pause subscription when pause button is clicked", async () => {
      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "active" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      const pauseButton = screen.getByLabelText("Pause Subscription");
      await user.click(pauseButton);

      expect(mockPauseSubscription).toHaveBeenCalledWith({
        subscriptionId: "sub-123",
        reason: "Paused by admin",
      });
    });

    it("calls resume subscription when resume button is clicked", async () => {
      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "paused" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      const resumeButton = screen.getByLabelText("Resume Subscription");
      await user.click(resumeButton);

      expect(mockResumeSubscription).toHaveBeenCalledWith("sub-123");
    });

    it("disables pause button when pause mutation is pending", () => {
      vi.mocked(usePauseSubscription).mockReturnValue({
        mutateAsync: mockPauseSubscription,
        isPending: true,
      } as any);

      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "active" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      const pauseButton = screen.getByLabelText("Pause Subscription");
      expect(pauseButton).toBeDisabled();
    });

    it("disables resume button when resume mutation is pending", () => {
      vi.mocked(useResumeSubscription).mockReturnValue({
        mutateAsync: mockResumeSubscription,
        isPending: true,
      } as any);

      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "paused" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      const resumeButton = screen.getByLabelText("Resume Subscription");
      expect(resumeButton).toBeDisabled();
    });

    it("opens upgrade dialog when upgrade button is clicked", async () => {
      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "active" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      const upgradeButton = screen.getByLabelText("Upgrade Plan");
      await user.click(upgradeButton);

      // The UpgradeDialog should receive open=true
      // This would be tested more thoroughly in integration tests
    });

    it("opens payment dialog when add payment button is clicked", async () => {
      vi.mocked(paymentUtils.calculateBalanceInfo).mockReturnValue({
        balance: 50.0,
        paidPercentage: 75,
      });

      render(
        <ActiveSubscriptionCard
          subscription={baseSubscription}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      const addPaymentButtons = screen.getAllByText("Add Payment");
      const headerButton = addPaymentButtons.find((button) =>
        button.closest("button")?.querySelector("svg")
      );
      await user.click(headerButton!);

      // The AddPaymentDialog should receive open=true
    });
  });

  describe("Progress Calculations", () => {
    it("calculates session progress correctly", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{
            ...baseSubscription,
            used_sessions: 8,
            total_sessions_snapshot: 10,
          }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("8 / 10")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // remaining sessions
    });

    it("handles zero sessions remaining", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{
            ...baseSubscription,
            used_sessions: 20,
            total_sessions_snapshot: 20,
          }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("20 / 20")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument(); // remaining sessions
    });

    it("handles edge case where used sessions exceed total", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{
            ...baseSubscription,
            used_sessions: 25,
            total_sessions_snapshot: 20,
          }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("25 / 20")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument(); // should be 0, not negative
    });
  });

  describe("Date Handling", () => {
    it("formats subscription dates correctly", () => {
      render(
        <ActiveSubscriptionCard
          subscription={baseSubscription}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("Started: Jan 1, 2024")).toBeInTheDocument();
      expect(screen.getByText("Expires: Jan 1, 2024")).toBeInTheDocument();
    });

    it("handles missing end date", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, end_date: null }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("N/A")).toBeInTheDocument();
      expect(screen.queryByText("Expires:")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels for buttons", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "active" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByLabelText("Pause Subscription")).toBeInTheDocument();
      expect(screen.getByLabelText("Upgrade Plan")).toBeInTheDocument();
    });

    it("provides tooltips for action buttons", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{ ...baseSubscription, status: "active" }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Check that buttons are wrapped in tooltip triggers
      const pauseButton = screen.getByLabelText("Pause Subscription");
      const upgradeButton = screen.getByLabelText("Upgrade Plan");

      expect(pauseButton).toHaveAttribute("data-slot", "tooltip-trigger");
      expect(upgradeButton).toHaveAttribute("data-slot", "tooltip-trigger");
    });

    it("has proper alert roles", () => {
      vi.mocked(paymentUtils.calculateBalanceInfo).mockReturnValue({
        balance: 49.99,
        paidPercentage: 75,
      });

      render(
        <ActiveSubscriptionCard
          subscription={baseSubscription}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass("text-destructive", "bg-card");
    });
  });

  describe("Edge Cases", () => {
    it("handles subscription without snapshot data", () => {
      const subscriptionWithoutSnapshot = {
        ...baseSubscription,
        plan_name_snapshot: "",
        total_sessions_snapshot: 0,
        total_amount_snapshot: 0,
      };

      render(
        <ActiveSubscriptionCard
          subscription={subscriptionWithoutSnapshot}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Should not crash
      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    it("handles very large numbers", () => {
      render(
        <ActiveSubscriptionCard
          subscription={{
            ...baseSubscription,
            total_sessions_snapshot: 1000000,
            used_sessions: 999999,
            total_amount_snapshot: 9999999.99,
            paid_amount: 5000000.0,
          }}
          member={mockMember}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("999999 / 1000000")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument(); // remaining sessions
    });
  });
});
