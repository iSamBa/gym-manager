import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SubscriptionAlerts } from "../SubscriptionAlerts";
import { notificationUtils } from "../../lib/notification-utils";

// Mock notification utils
vi.mock("../../lib/notification-utils", () => ({
  notificationUtils: {
    getPaymentStatistics: vi.fn(),
    getSessionStatistics: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("SubscriptionAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state initially", () => {
    vi.mocked(notificationUtils.getPaymentStatistics).mockResolvedValue(null);
    vi.mocked(notificationUtils.getSessionStatistics).mockResolvedValue(null);

    render(<SubscriptionAlerts />, { wrapper: createWrapper() });

    expect(screen.getByText("Subscription Alerts")).toBeInTheDocument();
  });

  it('should show "all good" message when no alerts', async () => {
    vi.mocked(notificationUtils.getPaymentStatistics).mockResolvedValue({
      membersWithOutstandingBalance: 0,
      totalOutstandingAmount: 0,
      outstandingBalances: [],
    });
    vi.mocked(notificationUtils.getSessionStatistics).mockResolvedValue({
      totalSessions: 100,
      usedSessions: 60,
      remainingSessions: 40,
      utilizationRate: 60,
      subscriptionsWithLowSessions: 0,
    });

    render(<SubscriptionAlerts />, { wrapper: createWrapper() });

    await screen.findByText("All good! No alerts at this time.");
  });

  it("should show payment alert when there are outstanding balances", async () => {
    vi.mocked(notificationUtils.getPaymentStatistics).mockResolvedValue({
      membersWithOutstandingBalance: 3,
      totalOutstandingAmount: 450.5,
      outstandingBalances: [],
    });
    vi.mocked(notificationUtils.getSessionStatistics).mockResolvedValue({
      totalSessions: 100,
      usedSessions: 60,
      remainingSessions: 40,
      utilizationRate: 60,
      subscriptionsWithLowSessions: 0,
    });

    render(<SubscriptionAlerts />, { wrapper: createWrapper() });

    await screen.findByText("Outstanding Payments");
    expect(
      screen.getByText(
        /3 member\(s\) have outstanding balances totaling \$450\.50/
      )
    ).toBeInTheDocument();
  });

  it("should show low sessions alert", async () => {
    vi.mocked(notificationUtils.getPaymentStatistics).mockResolvedValue({
      membersWithOutstandingBalance: 0,
      totalOutstandingAmount: 0,
      outstandingBalances: [],
    });
    vi.mocked(notificationUtils.getSessionStatistics).mockResolvedValue({
      totalSessions: 100,
      usedSessions: 60,
      remainingSessions: 40,
      utilizationRate: 60,
      subscriptionsWithLowSessions: 5,
    });

    render(<SubscriptionAlerts />, { wrapper: createWrapper() });

    await screen.findByText("Low Session Credits");
    expect(
      screen.getByText(/5 subscription\(s\) have 2 or fewer sessions remaining/)
    ).toBeInTheDocument();
  });

  it("should show utilization alert when utilization is low", async () => {
    vi.mocked(notificationUtils.getPaymentStatistics).mockResolvedValue({
      membersWithOutstandingBalance: 0,
      totalOutstandingAmount: 0,
      outstandingBalances: [],
    });
    vi.mocked(notificationUtils.getSessionStatistics).mockResolvedValue({
      totalSessions: 100,
      usedSessions: 30,
      remainingSessions: 70,
      utilizationRate: 30,
      subscriptionsWithLowSessions: 0,
    });

    render(<SubscriptionAlerts />, { wrapper: createWrapper() });

    await screen.findByText("Low Session Utilization");
    expect(
      screen.getByText(/Overall session utilization is 30\.0%/)
    ).toBeInTheDocument();
  });
});
