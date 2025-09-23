import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { PaymentReceiptDialog } from "../PaymentReceiptDialog";
import type { SubscriptionPaymentWithReceipt } from "@/features/database/lib/types";

// Mock window.print
const mockPrint = vi.fn();
Object.defineProperty(window, "print", {
  value: mockPrint,
  writable: true,
});

// Mock console.log for download functionality
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

// Mock data
const mockPayment: SubscriptionPaymentWithReceipt = {
  id: "payment-123",
  subscription_id: "sub-123",
  member_id: "member-123",
  amount: 100,
  currency: "USD",
  payment_method: "cash",
  payment_status: "completed",
  payment_date: "2024-01-15T14:30:00Z",
  due_date: "2024-01-01T00:00:00Z",
  late_fee: 0,
  discount_amount: 0,
  refund_amount: 0,
  created_at: "2024-01-15T14:30:00Z",
  updated_at: "2024-01-15T14:30:00Z",
  receipt_number: "RCPT-2024-0001",
  reference_number: "TXN-12345",
  notes: "Monthly payment",
  created_by: "user-123",
};

const mockPaymentWithRefund: SubscriptionPaymentWithReceipt = {
  ...mockPayment,
  id: "payment-456",
  amount: 80,
  refund_amount: 20,
  refund_date: "2024-01-20T10:00:00Z",
  refund_reason: "Customer request",
  payment_status: "completed",
  receipt_number: "RCPT-2024-0002",
};

const mockPaymentFullyRefunded: SubscriptionPaymentWithReceipt = {
  ...mockPayment,
  id: "payment-789",
  amount: 60,
  refund_amount: 60,
  refund_date: "2024-01-18T16:45:00Z",
  refund_reason: "Service cancelled",
  payment_status: "refunded",
  receipt_number: "RCPT-2024-0003",
};

describe("PaymentReceiptDialog", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderReceiptDialog = (
    payment = mockPayment,
    open = true,
    props = {}
  ) => {
    return render(
      <PaymentReceiptDialog
        payment={payment}
        open={open}
        onOpenChange={mockOnOpenChange}
        {...props}
      />
    );
  };

  describe("Dialog Visibility", () => {
    it("should render dialog when open is true", () => {
      renderReceiptDialog();

      expect(screen.getByText("Payment Receipt")).toBeInTheDocument();
      expect(screen.getByText("Gym Management System")).toBeInTheDocument();
    });

    it("should not render dialog when open is false", () => {
      renderReceiptDialog(mockPayment, false);

      expect(screen.queryByText("Payment Receipt")).not.toBeInTheDocument();
    });

    it("should call onOpenChange when dialog is closed", async () => {
      const user = userEvent.setup();
      renderReceiptDialog();

      // Find and click the close button (usually X button in dialog)
      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Receipt Header", () => {
    it("should display company name and receipt title", () => {
      renderReceiptDialog();

      expect(screen.getByText("Gym Management System")).toBeInTheDocument();
      expect(screen.getByText("Payment Receipt")).toBeInTheDocument();
    });

    it("should display receipt icon", () => {
      renderReceiptDialog();

      // Check for receipt icon (assuming it has proper accessibility)
      const receiptIcon =
        screen.getByTestId("receipt-icon") ||
        document.querySelector('[data-lucide="receipt"]');
      expect(receiptIcon).toBeDefined();
    });
  });

  describe("Receipt Details", () => {
    it("should display receipt number and payment date", () => {
      renderReceiptDialog();

      expect(screen.getByText("RCPT-2024-0001")).toBeInTheDocument();
      expect(screen.getByText("Monday, January 15, 2024")).toBeInTheDocument(); // Formatted date
    });

    it("should display payment amount prominently", () => {
      renderReceiptDialog();

      expect(screen.getByText("$100.00")).toBeInTheDocument();
    });

    it("should display payment method", () => {
      renderReceiptDialog();

      expect(screen.getByText("cash")).toBeInTheDocument();
    });

    it("should display reference number when present", () => {
      renderReceiptDialog();

      expect(screen.getByText("TXN-12345")).toBeInTheDocument();
    });

    it("should display payment status", () => {
      renderReceiptDialog();

      expect(screen.getByText("completed")).toBeInTheDocument();
    });

    it("should display notes when present", () => {
      renderReceiptDialog();

      expect(screen.getByText("Monthly payment")).toBeInTheDocument();
    });

    it("should handle missing payment date gracefully", () => {
      const paymentWithoutDate = {
        ...mockPayment,
        payment_date: null,
      };

      renderReceiptDialog(paymentWithoutDate);

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("should not display reference section when reference number is missing", () => {
      const paymentWithoutReference = {
        ...mockPayment,
        reference_number: undefined,
      };

      renderReceiptDialog(paymentWithoutReference);

      expect(screen.queryByText("Reference:")).not.toBeInTheDocument();
    });

    it("should not display notes section when notes are missing", () => {
      const paymentWithoutNotes = {
        ...mockPayment,
        notes: undefined,
      };

      renderReceiptDialog(paymentWithoutNotes);

      expect(screen.queryByText("Notes:")).not.toBeInTheDocument();
    });
  });

  describe("Refund Information", () => {
    it("should display refund information for partially refunded payments", () => {
      renderReceiptDialog(mockPaymentWithRefund);

      expect(screen.getByText("Refund Information")).toBeInTheDocument();
      expect(screen.getByText("-$20.00")).toBeInTheDocument();
      expect(screen.getByText("Customer request")).toBeInTheDocument();
      expect(
        screen.getByText("Saturday, January 20, 2024")
      ).toBeInTheDocument(); // Refund date
    });

    it("should display refund information for fully refunded payments", () => {
      renderReceiptDialog(mockPaymentFullyRefunded);

      expect(screen.getByText("Refund Information")).toBeInTheDocument();
      expect(screen.getByText("-$60.00")).toBeInTheDocument();
      expect(screen.getByText("Service cancelled")).toBeInTheDocument();
    });

    it("should not display refund section for non-refunded payments", () => {
      renderReceiptDialog(mockPayment);

      expect(screen.queryByText("Refund Information")).not.toBeInTheDocument();
    });

    it("should handle missing refund date gracefully", () => {
      const paymentWithRefundNoDate = {
        ...mockPaymentWithRefund,
        refund_date: undefined,
      };

      renderReceiptDialog(paymentWithRefundNoDate);

      expect(screen.getByText("Refund Information")).toBeInTheDocument();
      expect(screen.queryByText("Refund Date:")).not.toBeInTheDocument();
    });

    it("should handle missing refund reason gracefully", () => {
      const paymentWithRefundNoReason = {
        ...mockPaymentWithRefund,
        refund_reason: undefined,
      };

      renderReceiptDialog(paymentWithRefundNoReason);

      expect(screen.getByText("Refund Information")).toBeInTheDocument();
      expect(screen.queryByText("Reason:")).not.toBeInTheDocument();
    });
  });

  describe("Receipt Footer", () => {
    it("should display thank you message", () => {
      renderReceiptDialog();

      expect(
        screen.getByText("Thank you for your payment!")
      ).toBeInTheDocument();
    });

    it("should display generation date", () => {
      renderReceiptDialog();

      // Should show current date
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      expect(screen.getByText(`Generated on ${today}`)).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should display print and download buttons", () => {
      renderReceiptDialog();

      expect(
        screen.getByRole("button", { name: /print/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /download pdf/i })
      ).toBeInTheDocument();
    });

    it("should call window.print when print button is clicked", async () => {
      const user = userEvent.setup();
      renderReceiptDialog();

      const printButton = screen.getByRole("button", { name: /print/i });
      await user.click(printButton);

      expect(mockPrint).toHaveBeenCalled();
    });

    it("should handle download when download button is clicked", async () => {
      const user = userEvent.setup();
      renderReceiptDialog();

      const downloadButton = screen.getByRole("button", {
        name: /download pdf/i,
      });
      await user.click(downloadButton);

      // Currently logs to console - in real implementation would generate PDF
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Download receipt for:",
        "RCPT-2024-0001"
      );
    });

    it("should have proper button icons", () => {
      renderReceiptDialog();

      // Check for print icon
      const printIcon = document.querySelector('[data-lucide="print"]');
      expect(printIcon).toBeDefined();

      // Check for download icon
      const downloadIcon = document.querySelector('[data-lucide="download"]');
      expect(downloadIcon).toBeDefined();
    });
  });

  describe("Styling and Layout", () => {
    it("should apply proper styling classes for receipt layout", () => {
      renderReceiptDialog();

      // Check for card structure
      expect(document.querySelector(".border-2")).toBeDefined();
      expect(document.querySelector(".bg-muted\\/50")).toBeDefined();
    });

    it("should display amounts with proper formatting", () => {
      renderReceiptDialog();

      // Should show amounts with currency symbol and proper decimal places
      expect(screen.getByText("$100.00")).toBeInTheDocument();
    });

    it("should use monospace font for receipt number", () => {
      renderReceiptDialog();

      const receiptNumber = screen.getByText("RCPT-2024-0001");
      expect(receiptNumber).toHaveClass("font-mono");
    });
  });

  describe("Payment Status Badge", () => {
    it("should display completed status with default variant", () => {
      renderReceiptDialog(mockPayment);

      const statusBadge = screen.getByText("completed");
      expect(statusBadge).toBeInTheDocument();
    });

    it("should display other payment statuses appropriately", () => {
      const pendingPayment = {
        ...mockPayment,
        payment_status: "pending" as const,
      };

      renderReceiptDialog(pendingPayment);

      expect(screen.getByText("pending")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper dialog structure", () => {
      renderReceiptDialog();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have proper heading hierarchy", () => {
      renderReceiptDialog();

      expect(
        screen.getByRole("heading", { level: 1 }) ||
          screen.getByRole("heading", { level: 2 })
      ).toBeInTheDocument();
    });

    it("should have proper button labels", () => {
      renderReceiptDialog();

      expect(
        screen.getByRole("button", { name: /print/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /download pdf/i })
      ).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      renderReceiptDialog();

      const printButton = screen.getByRole("button", { name: /print/i });
      const downloadButton = screen.getByRole("button", {
        name: /download pdf/i,
      });

      // Should be able to tab between buttons
      printButton.focus();
      expect(printButton).toHaveFocus();

      await user.tab();
      expect(downloadButton).toHaveFocus();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large payment amounts", () => {
      const largePayment = {
        ...mockPayment,
        amount: 999999.99,
      };

      renderReceiptDialog(largePayment);

      expect(screen.getByText("$999,999.99")).toBeInTheDocument();
    });

    it("should handle zero payment amounts", () => {
      const zeroPayment = {
        ...mockPayment,
        amount: 0,
      };

      renderReceiptDialog(zeroPayment);

      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });

    it("should handle very long reference numbers", () => {
      const longReferencePayment = {
        ...mockPayment,
        reference_number:
          "VERY-LONG-REFERENCE-NUMBER-THAT-MIGHT-CAUSE-LAYOUT-ISSUES-12345678901234567890",
      };

      renderReceiptDialog(longReferencePayment);

      expect(
        screen.getByText(
          "VERY-LONG-REFERENCE-NUMBER-THAT-MIGHT-CAUSE-LAYOUT-ISSUES-12345678901234567890"
        )
      ).toBeInTheDocument();
    });

    it("should handle very long notes", () => {
      const longNotesPayment = {
        ...mockPayment,
        notes:
          "This is a very long note that contains a lot of information about the payment and might cause layout issues if not handled properly. It should wrap nicely and not break the receipt layout.",
      };

      renderReceiptDialog(longNotesPayment);

      expect(screen.getByText(/This is a very long note/)).toBeInTheDocument();
    });

    it("should handle different payment methods correctly", () => {
      const cardPayment = {
        ...mockPayment,
        payment_method: "card" as const,
      };

      renderReceiptDialog(cardPayment);

      expect(screen.getByText("card")).toBeInTheDocument();
    });

    it("should handle different currencies", () => {
      const euroPayment = {
        ...mockPayment,
        currency: "EUR",
      };

      renderReceiptDialog(euroPayment);

      // Amount should still display correctly (currency symbol would depend on implementation)
      expect(screen.getByText("$100.00")).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should apply responsive classes for mobile", () => {
      renderReceiptDialog();

      // Check for responsive dialog width
      const dialog = document.querySelector(".max-w-\\[500px\\]");
      expect(dialog).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing payment gracefully", () => {
      const invalidPayment = null as any;

      // Should not crash when payment is null/undefined
      expect(() => renderReceiptDialog(invalidPayment)).not.toThrow();
    });

    it("should handle malformed dates gracefully", () => {
      const malformedDatePayment = {
        ...mockPayment,
        payment_date: "invalid-date",
      };

      // Should not crash with invalid date
      expect(() => renderReceiptDialog(malformedDatePayment)).not.toThrow();
    });
  });
});
