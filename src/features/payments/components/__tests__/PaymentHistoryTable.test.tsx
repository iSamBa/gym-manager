import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { PaymentHistoryTable } from "../PaymentHistoryTable";
import type { SubscriptionPaymentWithReceipt } from "@/features/database/lib/types";

// Mock the dialog components
vi.mock("../PaymentReceiptDialog", () => ({
  PaymentReceiptDialog: ({ payment, open, onOpenChange }: any) => {
    if (!open) return null;
    return (
      <div data-testid="payment-receipt-dialog">
        <h2>Payment Receipt</h2>
        <p>Receipt Number: {payment?.receipt_number}</p>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    );
  },
}));

vi.mock("../RefundDialog", () => ({
  RefundDialog: ({ payment, open, onOpenChange, onSuccess }: any) => {
    if (!open) return null;
    return (
      <div data-testid="refund-dialog">
        <h2>Process Refund</h2>
        <p>Payment ID: {payment?.id}</p>
        <button
          onClick={() => {
            onSuccess();
            onOpenChange(false);
          }}
        >
          Process Refund
        </button>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    );
  },
}));

// Mock data
const mockPayments: SubscriptionPaymentWithReceipt[] = [
  {
    id: "payment-1",
    subscription_id: "sub-123",
    member_id: "member-123",
    amount: 100,
    currency: "USD",
    payment_method: "cash",
    payment_status: "completed",
    payment_date: "2024-01-15T10:00:00Z",
    due_date: "2024-01-01T00:00:00Z",
    late_fee: 0,
    discount_amount: 0,
    refund_amount: 0,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    receipt_number: "RCPT-2024-0001",
    reference_number: "TXN-001",
    notes: "Monthly payment",
    created_by: "user-123",
  },
  {
    id: "payment-2",
    subscription_id: "sub-123",
    member_id: "member-123",
    amount: 50,
    currency: "USD",
    payment_method: "card",
    payment_status: "completed",
    payment_date: "2024-01-10T14:30:00Z",
    due_date: "2024-01-01T00:00:00Z",
    late_fee: 0,
    discount_amount: 0,
    refund_amount: 20, // Partial refund
    refund_date: "2024-01-12T09:00:00Z",
    refund_reason: "Customer request",
    created_at: "2024-01-10T14:30:00Z",
    updated_at: "2024-01-12T09:00:00Z",
    receipt_number: "RCPT-2024-0002",
    reference_number: "TXN-002",
    notes: "Additional payment",
    created_by: "user-123",
  },
  {
    id: "payment-3",
    subscription_id: "sub-456",
    member_id: "member-456",
    amount: 75,
    currency: "USD",
    payment_method: "bank_transfer",
    payment_status: "refunded",
    payment_date: "2024-01-05T11:15:00Z",
    due_date: "2024-01-01T00:00:00Z",
    late_fee: 0,
    discount_amount: 0,
    refund_amount: 75, // Full refund
    refund_date: "2024-01-07T16:20:00Z",
    refund_reason: "Service cancelled",
    created_at: "2024-01-05T11:15:00Z",
    updated_at: "2024-01-07T16:20:00Z",
    receipt_number: "RCPT-2024-0003",
    notes: "Cancelled subscription",
    created_by: "user-123",
  },
];

describe("PaymentHistoryTable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderPaymentHistoryTable = (payments = mockPayments, props = {}) => {
    return render(<PaymentHistoryTable payments={payments} {...props} />);
  };

  describe("Loading State", () => {
    it("should show loading skeleton when isLoading is true", () => {
      renderPaymentHistoryTable([], { isLoading: true });

      expect(screen.getByText("Payment History")).toBeInTheDocument();

      // Should show skeleton loaders
      const skeletons =
        screen.getAllByTestId("skeleton") || screen.getAllByRole("generic");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no payments are provided", () => {
      renderPaymentHistoryTable([]);

      expect(screen.getByText("Payment History")).toBeInTheDocument();
      expect(screen.getByText("No payments found")).toBeInTheDocument();
      expect(
        screen.getByText("No payment records available for this period.")
      ).toBeInTheDocument();
    });
  });

  describe("Payment Display", () => {
    it("should display payment data correctly", () => {
      renderPaymentHistoryTable();

      // Check table headers
      expect(screen.getByText("Date")).toBeInTheDocument();
      expect(screen.getByText("Receipt #")).toBeInTheDocument();
      expect(screen.getByText("Amount")).toBeInTheDocument();
      expect(screen.getByText("Method")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();

      // Check payment data
      expect(screen.getByText("RCPT-2024-0001")).toBeInTheDocument();
      expect(screen.getByText("RCPT-2024-0002")).toBeInTheDocument();
      expect(screen.getByText("RCPT-2024-0003")).toBeInTheDocument();

      // Check amounts
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      expect(screen.getByText("$50.00")).toBeInTheDocument();
      expect(screen.getByText("$75.00")).toBeInTheDocument();
    });

    it("should display formatted dates correctly", () => {
      renderPaymentHistoryTable();

      // Should show formatted dates (e.g., "Jan 15, 2024")
      expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
      expect(screen.getByText("Jan 10, 2024")).toBeInTheDocument();
      expect(screen.getByText("Jan 05, 2024")).toBeInTheDocument();
    });

    it("should handle missing payment dates gracefully", () => {
      const paymentsWithMissingDate = [
        {
          ...mockPayments[0],
          payment_date: null,
        },
      ];

      renderPaymentHistoryTable(paymentsWithMissingDate);

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("should display refund information for refunded payments", () => {
      renderPaymentHistoryTable();

      // Partial refund
      expect(screen.getByText("-$20.00 refunded")).toBeInTheDocument();

      // Full refund (should show status as "Refunded")
      expect(screen.getByText("Refunded")).toBeInTheDocument();
    });
  });

  describe("Payment Method Badges", () => {
    it("should display payment method badges with correct styling", () => {
      renderPaymentHistoryTable();

      // Check that payment methods are displayed
      expect(screen.getByText("cash")).toBeInTheDocument();
      expect(screen.getByText("card")).toBeInTheDocument();
      expect(screen.getByText("bank transfer")).toBeInTheDocument(); // Should replace underscore
    });
  });

  describe("Status Badges", () => {
    it("should display correct status badges", () => {
      renderPaymentHistoryTable();

      // Completed payments
      const completedBadges = screen.getAllByText("Completed");
      expect(completedBadges.length).toBeGreaterThan(0);

      // Refunded payment
      expect(screen.getByText("Refunded")).toBeInTheDocument();

      // Partial refund
      expect(screen.getByText("Partial Refund")).toBeInTheDocument();
    });
  });

  describe("Action Menu", () => {
    it("should open action menu when clicking more options button", async () => {
      const user = userEvent.setup();
      renderPaymentHistoryTable();

      const moreButtons = screen.getAllByRole("button", { name: /more/i });
      await user.click(moreButtons[0]);

      expect(screen.getByText("View Receipt")).toBeInTheDocument();
      expect(screen.getByText("Download Receipt")).toBeInTheDocument();
    });

    it("should show refund option for completed payments", async () => {
      const user = userEvent.setup();
      renderPaymentHistoryTable();

      const moreButtons = screen.getAllByRole("button", { name: /more/i });
      await user.click(moreButtons[0]); // First payment is completed

      expect(screen.getByText("Process Refund")).toBeInTheDocument();
    });

    it("should not show refund option for already refunded payments", async () => {
      const user = userEvent.setup();
      renderPaymentHistoryTable();

      const moreButtons = screen.getAllByRole("button", { name: /more/i });
      await user.click(moreButtons[2]); // Third payment is fully refunded

      expect(screen.queryByText("Process Refund")).not.toBeInTheDocument();
    });
  });

  describe("Receipt Dialog", () => {
    it("should open receipt dialog when View Receipt is clicked", async () => {
      const user = userEvent.setup();
      renderPaymentHistoryTable();

      const moreButtons = screen.getAllByRole("button", { name: /more/i });
      await user.click(moreButtons[0]);

      const viewReceiptButton = screen.getByText("View Receipt");
      await user.click(viewReceiptButton);

      expect(screen.getByTestId("payment-receipt-dialog")).toBeInTheDocument();
      expect(
        screen.getByText("Receipt Number: RCPT-2024-0001")
      ).toBeInTheDocument();
    });

    it("should close receipt dialog when close button is clicked", async () => {
      const user = userEvent.setup();
      renderPaymentHistoryTable();

      // Open dialog
      const moreButtons = screen.getAllByRole("button", { name: /more/i });
      await user.click(moreButtons[0]);
      const viewReceiptButton = screen.getByText("View Receipt");
      await user.click(viewReceiptButton);

      // Close dialog
      const closeButton = screen.getByText("Close");
      await user.click(closeButton);

      expect(
        screen.queryByTestId("payment-receipt-dialog")
      ).not.toBeInTheDocument();
    });

    it("should open receipt dialog when Download Receipt is clicked", async () => {
      const user = userEvent.setup();
      renderPaymentHistoryTable();

      const moreButtons = screen.getAllByRole("button", { name: /more/i });
      await user.click(moreButtons[0]);

      const downloadReceiptButton = screen.getByText("Download Receipt");
      await user.click(downloadReceiptButton);

      expect(screen.getByTestId("payment-receipt-dialog")).toBeInTheDocument();
    });
  });

  describe("Refund Dialog", () => {
    it("should open refund dialog when Process Refund is clicked", async () => {
      const user = userEvent.setup();
      renderPaymentHistoryTable();

      const moreButtons = screen.getAllByRole("button", { name: /more/i });
      await user.click(moreButtons[0]);

      const processRefundButton = screen.getByText("Process Refund");
      await user.click(processRefundButton);

      expect(screen.getByTestId("refund-dialog")).toBeInTheDocument();
      expect(screen.getByText("Payment ID: payment-1")).toBeInTheDocument();
    });

    it("should close refund dialog and clear selection on success", async () => {
      const user = userEvent.setup();
      renderPaymentHistoryTable();

      // Open refund dialog
      const moreButtons = screen.getAllByRole("button", { name: /more/i });
      await user.click(moreButtons[0]);
      const processRefundButton = screen.getByText("Process Refund");
      await user.click(processRefundButton);

      // Process refund
      const processButton = screen.getByText("Process Refund");
      await user.click(processButton);

      await waitFor(() => {
        expect(screen.queryByTestId("refund-dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Optional Columns", () => {
    it("should show member column when showMemberColumn is true", () => {
      renderPaymentHistoryTable(mockPayments, { showMemberColumn: true });

      expect(screen.getByText("Member")).toBeInTheDocument();

      // Should show member IDs (last 8 characters)
      expect(screen.getByText("Member #ber-123")).toBeInTheDocument();
      expect(screen.getByText("Member #ber-456")).toBeInTheDocument();
    });

    it("should not show member column by default", () => {
      renderPaymentHistoryTable();

      expect(screen.queryByText("Member")).not.toBeInTheDocument();
    });

    it("should show subscription column when showSubscriptionColumn is true", () => {
      renderPaymentHistoryTable(mockPayments, { showSubscriptionColumn: true });

      expect(screen.getByText("Plan")).toBeInTheDocument();

      // Should show subscription IDs (last 8 characters)
      expect(screen.getByText("Plan #sub-123")).toBeInTheDocument();
      expect(screen.getByText("Plan #sub-456")).toBeInTheDocument();
    });

    it("should not show subscription column by default", () => {
      renderPaymentHistoryTable();

      expect(screen.queryByText("Plan")).not.toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support keyboard navigation for action menus", async () => {
      const user = userEvent.setup();
      renderPaymentHistoryTable();

      const moreButtons = screen.getAllByRole("button", { name: /more/i });

      // Focus on the first more button
      moreButtons[0].focus();
      expect(moreButtons[0]).toHaveFocus();

      // Open menu with Enter key
      await user.keyboard("{Enter}");

      expect(screen.getByText("View Receipt")).toBeInTheDocument();
    });

    it("should support keyboard navigation within action menu", async () => {
      const user = userEvent.setup();
      renderPaymentHistoryTable();

      const moreButtons = screen.getAllByRole("button", { name: /more/i });
      await user.click(moreButtons[0]);

      const viewReceiptButton = screen.getByText("View Receipt");

      // Should be able to navigate with keyboard
      viewReceiptButton.focus();
      expect(viewReceiptButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(screen.getByTestId("payment-receipt-dialog")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle payments without reference numbers", () => {
      const paymentsWithoutReference = [
        {
          ...mockPayments[0],
          reference_number: undefined,
        },
      ];

      renderPaymentHistoryTable(paymentsWithoutReference);

      // Should still render the table row
      expect(screen.getByText("RCPT-2024-0001")).toBeInTheDocument();
    });

    it("should handle payments with zero amounts", () => {
      const paymentsWithZeroAmount = [
        {
          ...mockPayments[0],
          amount: 0,
        },
      ];

      renderPaymentHistoryTable(paymentsWithZeroAmount);

      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });

    it("should handle payments with unknown payment methods", () => {
      const paymentsWithUnknownMethod = [
        {
          ...mockPayments[0],
          payment_method: "cryptocurrency" as any,
        },
      ];

      renderPaymentHistoryTable(paymentsWithUnknownMethod);

      // Should still render with unknown method
      expect(screen.getByText("cryptocurrency")).toBeInTheDocument();
    });

    it("should handle payments with unknown statuses", () => {
      const paymentsWithUnknownStatus = [
        {
          ...mockPayments[0],
          payment_status: "processing" as any,
        },
      ];

      renderPaymentHistoryTable(paymentsWithUnknownStatus);

      // Should render with unknown status
      expect(screen.getByText("processing")).toBeInTheDocument();
    });

    it("should handle very long receipt numbers", () => {
      const paymentsWithLongReceiptNumber = [
        {
          ...mockPayments[0],
          receipt_number:
            "RCPT-2024-0001-VERY-LONG-RECEIPT-NUMBER-THAT-MIGHT-OVERFLOW",
        },
      ];

      renderPaymentHistoryTable(paymentsWithLongReceiptNumber);

      expect(
        screen.getByText(
          "RCPT-2024-0001-VERY-LONG-RECEIPT-NUMBER-THAT-MIGHT-OVERFLOW"
        )
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper table structure", () => {
      renderPaymentHistoryTable();

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader")).toHaveLength(6); // Date, Receipt, Amount, Method, Status, Actions
      expect(screen.getAllByRole("row")).toHaveLength(4); // Header + 3 payments
    });

    it("should have proper button labels", () => {
      renderPaymentHistoryTable();

      const moreButtons = screen.getAllByRole("button", { name: /more/i });
      expect(moreButtons).toHaveLength(3); // One for each payment
    });

    it("should have proper semantic markup for amounts", () => {
      renderPaymentHistoryTable();

      // Amounts should be properly formatted
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      expect(screen.getByText("$50.00")).toBeInTheDocument();
      expect(screen.getByText("$75.00")).toBeInTheDocument();
    });
  });
});
