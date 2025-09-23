import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import PaymentsManagementPage from "../page";

vi.mock("@/features/payments/hooks/use-all-payments", () => ({
  useAllPayments: () => ({
    data: {
      payments: [
        {
          id: "1",
          amount: 99,
          payment_method: "card",
          payment_status: "completed",
          receipt_number: "REC-001",
          payment_date: "2024-01-01",
          member: {
            first_name: "John",
            last_name: "Doe",
          },
        },
      ],
      totalCount: 1,
      summary: {
        totalRevenue: 99,
        totalRefunded: 0,
        paymentCount: 1,
      },
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/features/payments/components/PaymentHistoryTable", () => ({
  PaymentHistoryTable: () => (
    <div data-testid="payment-history-table">Payment History Table</div>
  ),
}));

describe("PaymentsManagementPage", () => {
  it("renders payments management page", () => {
    render(<PaymentsManagementPage />);

    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getAllByText("$99.00")).toHaveLength(2); // Revenue and Net Revenue
  });
});
