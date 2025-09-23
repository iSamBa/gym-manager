import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { RefundDialog } from "../RefundDialog";
import type { SubscriptionPaymentWithReceipt } from "@/features/database/lib/types";

// Mock the useProcessRefund hook
vi.mock("../../hooks/use-payments", () => ({
  useProcessRefund: vi.fn(),
}));

import { useProcessRefund } from "../../hooks/use-payments";

const mockUseProcessRefund = vi.mocked(useProcessRefund);

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

// Mock payment data
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

const mockPartiallyRefundedPayment: SubscriptionPaymentWithReceipt = {
  ...mockPayment,
  id: "payment-456",
  amount: 80,
  refund_amount: 20,
  payment_status: "completed",
};

const mockProcessRefundMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  reset: vi.fn(),
};

describe("RefundDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mockUseProcessRefund.mockReturnValue(mockProcessRefundMutation);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderRefundDialog = (
    payment = mockPayment,
    open = true,
    props = {}
  ) => {
    const Wrapper = createWrapper();
    return render(
      <Wrapper>
        <RefundDialog
          payment={payment}
          open={open}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          {...props}
        />
      </Wrapper>
    );
  };

  describe("Dialog Visibility", () => {
    it("should render dialog when open is true", () => {
      renderRefundDialog();

      expect(screen.getByText("Process Refund")).toBeInTheDocument();
      expect(screen.getByText("Payment Information")).toBeInTheDocument();
    });

    it("should not render dialog when open is false", () => {
      renderRefundDialog(mockPayment, false);

      expect(screen.queryByText("Process Refund")).not.toBeInTheDocument();
    });
  });

  describe("Payment Information Display", () => {
    it("should display payment details correctly", () => {
      renderRefundDialog();

      expect(screen.getByText("RCPT-2024-0001")).toBeInTheDocument();
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      expect(screen.getByText("cash")).toBeInTheDocument();
      expect(screen.getByText("completed")).toBeInTheDocument();
      expect(screen.getByText("TXN-12345")).toBeInTheDocument();
    });

    it("should show maximum refund amount for non-refunded payment", () => {
      renderRefundDialog();

      expect(screen.getByText("Maximum refund: $100.00")).toBeInTheDocument();
    });

    it("should show remaining refund amount for partially refunded payment", () => {
      renderRefundDialog(mockPartiallyRefundedPayment);

      expect(screen.getByText("Already refunded: $20.00")).toBeInTheDocument();
      expect(screen.getByText("Maximum refund: $60.00")).toBeInTheDocument();
    });

    it("should handle missing reference number gracefully", () => {
      const paymentWithoutReference = {
        ...mockPayment,
        reference_number: undefined,
      };

      renderRefundDialog(paymentWithoutReference);

      expect(screen.queryByText("Reference:")).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error for refund amount greater than available", async () => {
      const user = userEvent.setup();
      renderRefundDialog();

      const amountInput = screen.getByLabelText("Refund Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "150"); // More than $100 payment

      const submitButton = screen.getByRole("button", {
        name: "Process Refund",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Refund amount cannot exceed the remaining amount")
        ).toBeInTheDocument();
      });
    });

    it("should show error for zero refund amount", async () => {
      const user = userEvent.setup();
      renderRefundDialog();

      const amountInput = screen.getByLabelText("Refund Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "0");

      const submitButton = screen.getByRole("button", {
        name: "Process Refund",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Refund amount must be greater than 0")
        ).toBeInTheDocument();
      });
    });

    it("should show error for negative refund amount", async () => {
      const user = userEvent.setup();
      renderRefundDialog();

      const amountInput = screen.getByLabelText("Refund Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "-10");

      const submitButton = screen.getByRole("button", {
        name: "Process Refund",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Refund amount must be greater than 0")
        ).toBeInTheDocument();
      });
    });

    it("should require refund reason", async () => {
      const user = userEvent.setup();
      renderRefundDialog();

      const amountInput = screen.getByLabelText("Refund Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "50");

      const submitButton = screen.getByRole("button", {
        name: "Process Refund",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Refund reason is required")
        ).toBeInTheDocument();
      });
    });

    it("should validate refund reason character limit", async () => {
      const user = userEvent.setup();
      renderRefundDialog();

      const reasonInput = screen.getByLabelText("Refund Reason");
      const longReason = "a".repeat(501); // Exceeds 500 character limit
      await user.type(reasonInput, longReason);

      const submitButton = screen.getByRole("button", {
        name: "Process Refund",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Reason must be less than 500 characters")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should submit valid refund data", async () => {
      const user = userEvent.setup();
      mockProcessRefundMutation.mutateAsync.mockResolvedValue({});

      renderRefundDialog();

      const amountInput = screen.getByLabelText("Refund Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "50");

      const reasonInput = screen.getByLabelText("Refund Reason");
      await user.type(reasonInput, "Customer request");

      const submitButton = screen.getByRole("button", {
        name: "Process Refund",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockProcessRefundMutation.mutateAsync).toHaveBeenCalledWith({
          paymentId: "payment-123",
          refundAmount: 50,
          reason: "Customer request",
        });
      });
    });

    it("should call onSuccess after successful refund", async () => {
      const user = userEvent.setup();
      mockProcessRefundMutation.mutateAsync.mockResolvedValue({});

      renderRefundDialog();

      const amountInput = screen.getByLabelText("Refund Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "50");

      const reasonInput = screen.getByLabelText("Refund Reason");
      await user.type(reasonInput, "Customer request");

      const submitButton = screen.getByRole("button", {
        name: "Process Refund",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("should reset form after successful submission", async () => {
      const user = userEvent.setup();
      mockProcessRefundMutation.mutateAsync.mockResolvedValue({});

      renderRefundDialog();

      const amountInput = screen.getByLabelText("Refund Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "50");

      const reasonInput = screen.getByLabelText("Refund Reason");
      await user.type(reasonInput, "Customer request");

      const submitButton = screen.getByRole("button", {
        name: "Process Refund",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          (screen.getByLabelText("Refund Amount") as HTMLInputElement).value
        ).toBe("0");
        expect(
          (screen.getByLabelText("Refund Reason") as HTMLInputElement).value
        ).toBe("");
      });
    });

    it("should handle submission errors gracefully", async () => {
      const user = userEvent.setup();
      const error = new Error("Refund processing failed");
      mockProcessRefundMutation.mutateAsync.mockRejectedValue(error);

      renderRefundDialog();

      const amountInput = screen.getByLabelText("Refund Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "50");

      const reasonInput = screen.getByLabelText("Refund Reason");
      await user.type(reasonInput, "Customer request");

      const submitButton = screen.getByRole("button", {
        name: "Process Refund",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockProcessRefundMutation.mutateAsync).toHaveBeenCalled();
      });

      // Form should remain populated for retry
      expect(
        (screen.getByLabelText("Refund Amount") as HTMLInputElement).value
      ).toBe("50");
      expect(
        (screen.getByLabelText("Refund Reason") as HTMLInputElement).value
      ).toBe("Customer request");
    });
  });

  describe("Loading State", () => {
    it("should disable form during submission", async () => {
      const user = userEvent.setup();
      mockUseProcessRefund.mockReturnValue({
        ...mockProcessRefundMutation,
        isPending: true,
      });

      renderRefundDialog();

      const submitButton = screen.getByRole("button", {
        name: "Processing...",
      });
      expect(submitButton).toBeDisabled();

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toBeDisabled();

      const amountInput = screen.getByLabelText("Refund Amount");
      expect(amountInput).toBeDisabled();

      const reasonInput = screen.getByLabelText("Refund Reason");
      expect(reasonInput).toBeDisabled();
    });
  });

  describe("Cancel Functionality", () => {
    it("should call onOpenChange when cancel button is clicked", async () => {
      const user = userEvent.setup();
      renderRefundDialog();

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should not allow cancel during submission", () => {
      mockUseProcessRefund.mockReturnValue({
        ...mockProcessRefundMutation,
        isPending: true,
      });

      renderRefundDialog();

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe("Default Values", () => {
    it("should default refund amount to maximum available", () => {
      renderRefundDialog();

      const amountInput = screen.getByLabelText(
        "Refund Amount"
      ) as HTMLInputElement;
      expect(amountInput.value).toBe("100"); // Full payment amount
    });

    it("should default to remaining amount for partially refunded payment", () => {
      renderRefundDialog(mockPartiallyRefundedPayment);

      const amountInput = screen.getByLabelText(
        "Refund Amount"
      ) as HTMLInputElement;
      expect(amountInput.value).toBe("60"); // 80 - 20 (remaining amount)
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels and associations", () => {
      renderRefundDialog();

      expect(screen.getByLabelText("Refund Amount")).toBeInTheDocument();
      expect(screen.getByLabelText("Refund Reason")).toBeInTheDocument();
    });

    it("should have proper button roles and states", () => {
      renderRefundDialog();

      const submitButton = screen.getByRole("button", {
        name: "Process Refund",
      });
      expect(submitButton).toHaveAttribute("type", "submit");
      expect(submitButton).not.toBeDisabled();

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toHaveAttribute("type", "button");
      expect(cancelButton).not.toBeDisabled();
    });

    it("should have proper dialog structure", () => {
      renderRefundDialog();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle floating point refund amounts correctly", async () => {
      const user = userEvent.setup();
      mockProcessRefundMutation.mutateAsync.mockResolvedValue({});

      renderRefundDialog();

      const amountInput = screen.getByLabelText("Refund Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "25.50");

      const reasonInput = screen.getByLabelText("Refund Reason");
      await user.type(reasonInput, "Customer request");

      const submitButton = screen.getByRole("button", {
        name: "Process Refund",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockProcessRefundMutation.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            refundAmount: 25.5,
          })
        );
      });
    });

    it("should handle very small refund amounts", async () => {
      const user = userEvent.setup();
      mockProcessRefundMutation.mutateAsync.mockResolvedValue({});

      renderRefundDialog();

      const amountInput = screen.getByLabelText("Refund Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "0.01"); // Minimum valid amount

      const reasonInput = screen.getByLabelText("Refund Reason");
      await user.type(reasonInput, "Rounding adjustment");

      const submitButton = screen.getByRole("button", {
        name: "Process Refund",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockProcessRefundMutation.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            refundAmount: 0.01,
          })
        );
      });
    });

    it("should handle fully refunded payment", () => {
      const fullyRefundedPayment = {
        ...mockPayment,
        refund_amount: 100,
        payment_status: "refunded" as const,
      };

      renderRefundDialog(fullyRefundedPayment);

      expect(screen.getByText("Already refunded: $100.00")).toBeInTheDocument();
      expect(screen.getByText("Maximum refund: $0.00")).toBeInTheDocument();

      const amountInput = screen.getByLabelText(
        "Refund Amount"
      ) as HTMLInputElement;
      expect(amountInput.value).toBe("0");
    });
  });
});
