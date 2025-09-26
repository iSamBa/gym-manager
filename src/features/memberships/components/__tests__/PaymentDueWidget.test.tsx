import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaymentDueWidget } from "../PaymentDueWidget";
import { notificationUtils } from "../../lib/notification-utils";

// Mock notification utils
vi.mock("../../lib/notification-utils", () => ({
  notificationUtils: {
    getPaymentStatistics: vi.fn(),
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

describe("PaymentDueWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state initially", () => {
    vi.mocked(notificationUtils.getPaymentStatistics).mockImplementation(
      () => new Promise(() => {})
    );

    render(<PaymentDueWidget />, { wrapper: createWrapper() });

    expect(screen.getByText("Payment Due")).toBeInTheDocument();
  });

  it("should show empty state when no outstanding payments", async () => {
    vi.mocked(notificationUtils.getPaymentStatistics).mockResolvedValue({
      membersWithOutstandingBalance: 0,
      totalOutstandingAmount: 0,
      outstandingBalances: [],
    });

    render(<PaymentDueWidget />, { wrapper: createWrapper() });

    await screen.findByText("All Caught Up!");
    expect(
      screen.getByText("No outstanding payments at this time.")
    ).toBeInTheDocument();
  });

  it("should show outstanding payments summary", async () => {
    vi.mocked(notificationUtils.getPaymentStatistics).mockResolvedValue({
      membersWithOutstandingBalance: 3,
      totalOutstandingAmount: 450.75,
      outstandingBalances: [
        {
          memberId: "member-1",
          memberName: "John Doe",
          balance: 200.5,
        },
        {
          memberId: "member-2",
          memberName: "Jane Smith",
          balance: 150.25,
        },
        {
          memberId: "member-3",
          memberName: "Bob Wilson",
          balance: 100.0,
        },
      ],
    });

    render(<PaymentDueWidget />, { wrapper: createWrapper() });

    await screen.findByText("$450.75");
    expect(screen.getByText("Total Outstanding")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // Badge count

    // Check member names appear
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Wilson")).toBeInTheDocument();

    // Check member balances
    expect(screen.getByText("$200.50")).toBeInTheDocument();
    expect(screen.getByText("$150.25")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("should show top 5 outstanding balances only", async () => {
    const outstandingBalances = Array.from({ length: 10 }, (_, i) => ({
      memberId: `member-${i}`,
      memberName: `Member ${i}`,
      balance: 100 - i * 10,
    }));

    vi.mocked(notificationUtils.getPaymentStatistics).mockResolvedValue({
      membersWithOutstandingBalance: 10,
      totalOutstandingAmount: 550,
      outstandingBalances,
    });

    render(<PaymentDueWidget />, { wrapper: createWrapper() });

    await screen.findByText("Member 0"); // Highest balance should appear
    expect(screen.getByText("Member 4")).toBeInTheDocument(); // 5th member should appear
    expect(screen.queryByText("Member 5")).not.toBeInTheDocument(); // 6th member should not appear
  });
});
