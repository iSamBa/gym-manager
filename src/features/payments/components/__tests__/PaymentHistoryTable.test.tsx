import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { PaymentHistoryTable } from "../PaymentHistoryTable";
import type { SubscriptionPaymentWithReceipt } from "@/features/database/lib/types";

// Mock child components
vi.mock("../RefundDialog", () => ({
  RefundDialog: () => <div data-testid="refund-dialog">Refund Dialog</div>,
}));

vi.mock("../PaymentReceiptDialog", () => ({
  PaymentReceiptDialog: () => (
    <div data-testid="receipt-dialog">Receipt Dialog</div>
  ),
}));

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const TestWrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

const mockPayments: SubscriptionPaymentWithReceipt[] = [
  {
    id: "payment-123",
    subscription_id: "sub-123",
    member_id: "member-123",
    amount: 99.99,
    currency: "USD",
    payment_method: "card",
    payment_status: "completed",
    payment_date: "2024-01-15T14:30:00Z",
    due_date: "2024-01-01T00:00:00Z",
    late_fee: 0,
    discount_amount: 0,
    refunded_amount: 0,
    receipt_number: "RCPT-2024-0001",
    reference_number: "REF-123",
    notes: null,
    created_at: "2024-01-15T14:30:00Z",
    updated_at: "2024-01-15T14:30:00Z",
  },
];

describe("PaymentHistoryTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderTable = (payments = mockPayments, props = {}) => {
    const Wrapper = createWrapper();
    return render(
      <Wrapper>
        <PaymentHistoryTable payments={payments} {...props} />
      </Wrapper>
    );
  };

  it("renders table with payments", () => {
    renderTable();
    expect(screen.getByText("RCPT-2024-0001")).toBeInTheDocument();
  });

  it("displays payment amount", () => {
    renderTable();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });

  it("shows empty state when no payments", () => {
    renderTable([]);
    expect(screen.getByText(/no payments found/i)).toBeInTheDocument();
  });
});
