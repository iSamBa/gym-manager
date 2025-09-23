import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionHistoryTable } from "../SubscriptionHistoryTable";
import { createQueryWrapper } from "@/test/query-test-utils";
import type { MemberSubscriptionWithSnapshot } from "@/features/database/lib/types";

// Mock date-fns
vi.mock("date-fns", () => ({
  format: vi.fn((date, formatString) => {
    if (formatString === "MMM dd, yyyy") return "Jan 01, 2024";
    if (formatString === "PP") return "January 1, 2024";
    return "2024-01-01";
  }),
}));

const createMockSubscription = (
  overrides: Partial<MemberSubscriptionWithSnapshot> = {}
): MemberSubscriptionWithSnapshot => ({
  id: "sub-123",
  member_id: "member-123",
  plan_id: "plan-123",
  status: "completed",
  start_date: "2024-01-01",
  end_date: "2024-06-30",
  next_billing_date: null,
  billing_cycle: "monthly",
  price: 99.99,
  currency: "USD",
  signup_fee_paid: 25.0,
  auto_renew: false,
  renewal_count: 0,
  notes: "Test subscription",
  created_by: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-06-30T00:00:00Z",
  plan_name_snapshot: "Premium Monthly",
  total_sessions_snapshot: 20,
  total_amount_snapshot: 199.99,
  duration_days_snapshot: 180,
  used_sessions: 20,
  paid_amount: 199.99,
  ...overrides,
});

const mockSubscriptions: MemberSubscriptionWithSnapshot[] = [
  createMockSubscription({
    id: "sub-1",
    status: "completed",
    plan_name_snapshot: "Premium Monthly",
    total_sessions_snapshot: 20,
    used_sessions: 20,
    total_amount_snapshot: 199.99,
    paid_amount: 199.99,
  }),
  createMockSubscription({
    id: "sub-2",
    status: "cancelled",
    plan_name_snapshot: "Basic Monthly",
    total_sessions_snapshot: 10,
    used_sessions: 5,
    total_amount_snapshot: 99.99,
    paid_amount: 49.99,
  }),
  createMockSubscription({
    id: "sub-3",
    status: "active",
    plan_name_snapshot: "VIP Annual",
    total_sessions_snapshot: 100,
    used_sessions: 25,
    total_amount_snapshot: 999.99,
    paid_amount: 750.0,
  }),
];

describe("SubscriptionHistoryTable", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("shows loading skeletons when isLoading is true", () => {
      render(<SubscriptionHistoryTable subscriptions={[]} isLoading={true} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("Subscription History")).toBeInTheDocument();
      expect(screen.getAllByTestId("skeleton")).toHaveLength(3);
    });

    it("shows loading skeletons with correct count", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={true}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Should show 3 skeleton rows
      expect(screen.getAllByTestId("skeleton")).toHaveLength(3);
    });
  });

  describe("Table Structure", () => {
    it("renders table with correct headers", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("Plan")).toBeInTheDocument();
      expect(screen.getByText("Period")).toBeInTheDocument();
      expect(screen.getByText("Sessions")).toBeInTheDocument();
      expect(screen.getByText("Payment")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
    });

    it("renders correct number of rows", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Should have 3 data rows + 1 header row
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(4);
    });

    it("renders empty table when no subscriptions", () => {
      render(
        <SubscriptionHistoryTable subscriptions={[]} isLoading={false} />,
        { wrapper: createQueryWrapper() }
      );

      // Should have header row but no data rows
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(1);
    });
  });

  describe("Subscription Data Display", () => {
    it("displays plan information correctly", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("Premium Monthly")).toBeInTheDocument();
      expect(screen.getByText("Basic Monthly")).toBeInTheDocument();
      expect(screen.getByText("VIP Annual")).toBeInTheDocument();
      expect(screen.getByText("$199.99")).toBeInTheDocument();
      expect(screen.getByText("$99.99")).toBeInTheDocument();
      expect(screen.getByText("$999.99")).toBeInTheDocument();
    });

    it("displays period information with dates", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Should show formatted start dates
      expect(screen.getAllByText("Jan 01, 2024")).toHaveLength(3);
      // Should show "to" text for end dates
      expect(screen.getAllByText(/to Jan 01, 2024/)).toHaveLength(3);
    });

    it("handles subscriptions without end dates", () => {
      const subscriptionWithoutEndDate = createMockSubscription({
        end_date: null,
      });

      render(
        <SubscriptionHistoryTable
          subscriptions={[subscriptionWithoutEndDate]}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("Jan 01, 2024")).toBeInTheDocument();
      expect(screen.queryByText(/to/)).not.toBeInTheDocument();
    });
  });

  describe("Session Progress", () => {
    it("displays session usage correctly", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("20 / 20")).toBeInTheDocument(); // completed
      expect(screen.getByText("5 / 10")).toBeInTheDocument(); // partial
      expect(screen.getByText("25 / 100")).toBeInTheDocument(); // active
    });

    it("calculates and displays session percentages", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("100%")).toBeInTheDocument(); // 20/20 = 100%
      expect(screen.getByText("50%")).toBeInTheDocument(); // 5/10 = 50%
      expect(screen.getByText("25%")).toBeInTheDocument(); // 25/100 = 25%
    });

    it("renders progress bars for sessions", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Should have progress bars (one per subscription)
      const progressBars = screen.getAllByRole("progressbar");
      expect(progressBars).toHaveLength(6); // 3 for sessions + 3 for payments
    });
  });

  describe("Payment Progress", () => {
    it("displays payment amounts correctly", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("$199.99")).toBeInTheDocument(); // fully paid
      expect(screen.getByText("$49.99")).toBeInTheDocument(); // partial payment
      expect(screen.getByText("$750.00")).toBeInTheDocument(); // partial payment on VIP
    });

    it("calculates and displays payment percentages", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Payment percentages: 100%, 50%, 75%
      expect(screen.getAllByText("100%")).toHaveLength(1); // sessions percentage for first sub
      expect(screen.getAllByText("50%")).toHaveLength(2); // both sessions and payment for second sub
      expect(screen.getByText("75%")).toBeInTheDocument(); // payment for VIP
    });

    it("shows balance due for partial payments", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("Balance: $50.00")).toBeInTheDocument(); // 99.99 - 49.99
      expect(screen.getByText("Balance: $249.99")).toBeInTheDocument(); // 999.99 - 750.00
    });

    it("hides balance for fully paid subscriptions", () => {
      const fullyPaidSub = createMockSubscription({
        total_amount_snapshot: 199.99,
        paid_amount: 199.99,
      });

      render(
        <SubscriptionHistoryTable
          subscriptions={[fullyPaidSub]}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.queryByText(/Balance:/)).not.toBeInTheDocument();
    });
  });

  describe("Status Badges", () => {
    it("displays status badges with correct variants", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      const completedBadge = screen.getByText("completed");
      const cancelledBadge = screen.getByText("cancelled");
      const activeBadge = screen.getByText("active");

      expect(completedBadge).toBeInTheDocument();
      expect(cancelledBadge).toBeInTheDocument();
      expect(activeBadge).toBeInTheDocument();

      // Check badge styling
      expect(completedBadge.closest("div")).toHaveClass("border");
      expect(cancelledBadge.closest("div")).toHaveClass("destructive");
      expect(activeBadge.closest("div")).toHaveClass("bg-primary");
    });

    it("handles unknown status gracefully", () => {
      const unknownStatusSub = createMockSubscription({
        status: "unknown" as any,
      });

      render(
        <SubscriptionHistoryTable
          subscriptions={[unknownStatusSub]}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      const badge = screen.getByText("unknown");
      expect(badge).toBeInTheDocument();
      expect(badge.closest("div")).toHaveClass("border");
    });
  });

  describe("Action Menu", () => {
    it("renders action menu for each subscription", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      const menuButtons = screen.getAllByRole("button", { name: "" });
      expect(menuButtons).toHaveLength(3);
    });

    it("shows correct menu items for active subscription", async () => {
      const activeSub = createMockSubscription({
        status: "active",
      });

      render(
        <SubscriptionHistoryTable
          subscriptions={[activeSub]}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      const menuButton = screen.getByRole("button", { name: "" });
      await user.click(menuButton);

      expect(screen.getByText("View Details")).toBeInTheDocument();
      expect(screen.getByText("Add Payment")).toBeInTheDocument();
    });

    it("shows only view details for non-active subscriptions", async () => {
      const completedSub = createMockSubscription({
        status: "completed",
      });

      render(
        <SubscriptionHistoryTable
          subscriptions={[completedSub]}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      const menuButton = screen.getByRole("button", { name: "" });
      await user.click(menuButton);

      expect(screen.getByText("View Details")).toBeInTheDocument();
      expect(screen.queryByText("Add Payment")).not.toBeInTheDocument();
    });
  });

  describe("Card Layout", () => {
    it("renders within a card component", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("Subscription History")).toBeInTheDocument();
      expect(
        screen.getByText("Subscription History").closest("div")
      ).toHaveClass("font-semibold");
    });

    it("has proper card structure", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      const card = screen
        .getByText("Subscription History")
        .closest("div")
        ?.closest("div");
      expect(card).toHaveClass("rounded-lg", "border");
    });
  });

  describe("Accessibility", () => {
    it("has proper table structure", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader")).toHaveLength(6);
      expect(screen.getAllByRole("row")).toHaveLength(4); // 3 data + 1 header
    });

    it("has accessible column headers", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={mockSubscriptions}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(
        screen.getByRole("columnheader", { name: "Plan" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Period" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Sessions" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Payment" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Status" })
      ).toBeInTheDocument();
    });

    it("has accessible progress bars", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={[mockSubscriptions[0]]}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      const progressBars = screen.getAllByRole("progressbar");
      expect(progressBars).toHaveLength(2); // one for sessions, one for payment
    });

    it("has accessible dropdown menus", () => {
      render(
        <SubscriptionHistoryTable
          subscriptions={[mockSubscriptions[0]]}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      const menuButton = screen.getByRole("button", { name: "" });
      expect(menuButton).toHaveAttribute("aria-haspopup");
    });
  });

  describe("Edge Cases", () => {
    it("handles zero sessions gracefully", () => {
      const zeroSessionsSub = createMockSubscription({
        total_sessions_snapshot: 0,
        used_sessions: 0,
      });

      render(
        <SubscriptionHistoryTable
          subscriptions={[zeroSessionsSub]}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("0 / 0")).toBeInTheDocument();
    });

    it("handles zero payment amounts", () => {
      const zeroPaymentSub = createMockSubscription({
        total_amount_snapshot: 0,
        paid_amount: 0,
      });

      render(
        <SubscriptionHistoryTable
          subscriptions={[zeroPaymentSub]}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });

    it("handles very large numbers", () => {
      const largeNumberSub = createMockSubscription({
        total_sessions_snapshot: 1000000,
        used_sessions: 999999,
        total_amount_snapshot: 999999.99,
        paid_amount: 500000.0,
      });

      render(
        <SubscriptionHistoryTable
          subscriptions={[largeNumberSub]}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("999999 / 1000000")).toBeInTheDocument();
      expect(screen.getByText("$999999.99")).toBeInTheDocument();
    });

    it("handles subscriptions with missing optional data", () => {
      const minimalSub = createMockSubscription({
        end_date: null,
        notes: null,
      });

      render(
        <SubscriptionHistoryTable
          subscriptions={[minimalSub]}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Should not crash and should display basic info
      expect(screen.getByText("Premium Monthly")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("handles large lists efficiently", () => {
      const largelist = Array.from({ length: 100 }, (_, i) =>
        createMockSubscription({ id: `sub-${i}` })
      );

      render(
        <SubscriptionHistoryTable
          subscriptions={largelist}
          isLoading={false}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Should render without performance issues
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(101); // 100 data + 1 header
    });
  });
});
