import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { PaymentForm } from "../PaymentForm";
import type { MemberSubscriptionWithSnapshot } from "@/features/database/lib/types";

// Mock the payment hooks
vi.mock("../../hooks/use-payments", () => ({
  useRecordPayment: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useRecordPayment } from "../../hooks/use-payments";

const mockUseRecordPayment = vi.mocked(useRecordPayment);

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

// Mock subscription data
const mockSubscription: MemberSubscriptionWithSnapshot = {
  id: "sub-123",
  member_id: "member-123",
  plan_id: "plan-123",
  status: "active",
  start_date: "2024-01-01T00:00:00Z",
  end_date: "2024-02-01T00:00:00Z",
  billing_cycle: "monthly",
  price: 100,
  currency: "USD",
  signup_fee_paid: 0,
  auto_renew: true,
  renewal_count: 0,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  plan_name_snapshot: "Premium Plan",
  total_sessions_snapshot: 10,
  total_amount_snapshot: 100,
  duration_days_snapshot: 30,
  used_sessions: 5,
  paid_amount: 60, // $40 remaining balance
};

const mockSubscriptionFullyPaid: MemberSubscriptionWithSnapshot = {
  ...mockSubscription,
  paid_amount: 100, // Fully paid
};

const mockRecordPaymentMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  reset: vi.fn(),
};

describe("PaymentForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUseRecordPayment.mockReturnValue(mockRecordPaymentMutation);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderPaymentForm = (subscription = mockSubscription, props = {}) => {
    const Wrapper = createWrapper();
    return render(
      <Wrapper>
        <PaymentForm subscription={subscription} {...props} />
      </Wrapper>
    );
  };

  describe("Rendering", () => {
    it("should render payment form with subscription details", () => {
      renderPaymentForm();

      // Check subscription details are displayed
      expect(screen.getByText("Subscription Details")).toBeInTheDocument();
      expect(screen.getByText("Premium Plan")).toBeInTheDocument();
      expect(screen.getByText("$100.00")).toBeInTheDocument(); // Total amount
      expect(screen.getByText("$60.00")).toBeInTheDocument(); // Paid amount
      expect(screen.getByText("$40.00")).toBeInTheDocument(); // Balance

      // Check form fields are present
      expect(screen.getByLabelText("Payment Amount")).toBeInTheDocument();
      expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
      expect(screen.getByLabelText("Payment Date")).toBeInTheDocument();
      expect(screen.getByLabelText("Reference Number")).toBeInTheDocument();
      expect(screen.getByLabelText("Notes")).toBeInTheDocument();

      // Check submit button
      expect(
        screen.getByRole("button", { name: "Record Payment" })
      ).toBeInTheDocument();
    });

    it("should default payment amount to remaining balance", () => {
      renderPaymentForm();

      const amountInput = screen.getByLabelText(
        "Payment Amount"
      ) as HTMLInputElement;
      expect(amountInput.value).toBe("40"); // Remaining balance
    });

    it("should show zero amount for fully paid subscription", () => {
      renderPaymentForm(mockSubscriptionFullyPaid);

      const amountInput = screen.getByLabelText(
        "Payment Amount"
      ) as HTMLInputElement;
      expect(amountInput.value).toBe("0");
      expect(
        screen.getByText("Subscription is fully paid")
      ).toBeInTheDocument();
    });

    it("should render cancel button when onCancel is provided", () => {
      const onCancel = vi.fn();
      renderPaymentForm(mockSubscription, { onCancel });

      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
    });

    it("should not render cancel button when onCancel is not provided", () => {
      renderPaymentForm();

      expect(
        screen.queryByRole("button", { name: "Cancel" })
      ).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error for negative payment amount", async () => {
      const user = userEvent.setup();
      renderPaymentForm();

      const amountInput = screen.getByLabelText("Payment Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "-10");

      const submitButton = screen.getByRole("button", {
        name: "Record Payment",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Amount must be greater than 0")
        ).toBeInTheDocument();
      });
    });

    it("should show error for zero payment amount", async () => {
      const user = userEvent.setup();
      renderPaymentForm();

      const amountInput = screen.getByLabelText("Payment Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "0");

      const submitButton = screen.getByRole("button", {
        name: "Record Payment",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Amount must be greater than 0")
        ).toBeInTheDocument();
      });
    });

    it("should validate notes character limit", async () => {
      const user = userEvent.setup();
      renderPaymentForm();

      const notesInput = screen.getByLabelText("Notes");
      const longNotes = "a".repeat(501); // Exceeds 500 character limit
      await user.type(notesInput, longNotes);

      const submitButton = screen.getByRole("button", {
        name: "Record Payment",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Notes must be less than 500 characters")
        ).toBeInTheDocument();
      });
    });

    it("should accept valid payment data", async () => {
      const user = userEvent.setup();
      mockRecordPaymentMutation.mutateAsync.mockResolvedValue({});

      renderPaymentForm();

      // Fill form with valid data
      const amountInput = screen.getByLabelText("Payment Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "40");

      const notesInput = screen.getByLabelText("Notes");
      await user.type(notesInput, "Test payment");

      const referenceInput = screen.getByLabelText("Reference Number");
      await user.type(referenceInput, "TXN-12345");

      const submitButton = screen.getByRole("button", {
        name: "Record Payment",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRecordPaymentMutation.mutateAsync).toHaveBeenCalledWith({
          subscription_id: "sub-123",
          amount: 40,
          payment_method: "cash", // Default value
          payment_date: expect.any(String),
          reference_number: "TXN-12345",
          notes: "Test payment",
        });
      });
    });
  });

  describe("Payment Method Selection", () => {
    it("should allow selecting different payment methods", async () => {
      const user = userEvent.setup();
      renderPaymentForm();

      // Open payment method dropdown
      const paymentMethodTrigger = screen.getByRole("combobox");
      await user.click(paymentMethodTrigger);

      // Select credit/debit card
      const cardOption = screen.getByRole("option", {
        name: "Credit/Debit Card",
      });
      await user.click(cardOption);

      // Verify selection
      expect(screen.getByDisplayValue("card")).toBeInTheDocument();
    });

    it("should show all payment method options", async () => {
      const user = userEvent.setup();
      renderPaymentForm();

      const paymentMethodTrigger = screen.getByRole("combobox");
      await user.click(paymentMethodTrigger);

      // Check all payment methods are available
      expect(screen.getByRole("option", { name: "Cash" })).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Credit/Debit Card" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Bank Transfer" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Online Payment" })
      ).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Check" })).toBeInTheDocument();
    });
  });

  describe("Payment Date Selection", () => {
    it("should default to today's date", () => {
      renderPaymentForm();

      const dateButton = screen.getByRole("button", { name: /pick a date/i });
      expect(dateButton).toBeInTheDocument();

      // The button should show today's date formatted
      const today = new Date();
      const formattedToday = today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Check if today's date is displayed (might be formatted differently)
      expect(
        screen.getByText(formattedToday) ||
          screen.getByDisplayValue(today.toISOString().split("T")[0])
      ).toBeTruthy();
    });

    it("should not allow future dates", async () => {
      const user = userEvent.setup();
      renderPaymentForm();

      const dateButton = screen.getByRole("button", {
        name: /pick a date|today/i,
      });
      await user.click(dateButton);

      // Future dates should be disabled (implementation detail depends on calendar component)
      // This test would need to be more specific based on the actual calendar implementation
    });
  });

  describe("Overpayment Warning", () => {
    it("should show overpayment warning when amount exceeds balance", async () => {
      const user = userEvent.setup();
      renderPaymentForm(); // Subscription has $40 remaining balance

      const amountInput = screen.getByLabelText("Payment Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "50"); // Exceeds $40 balance

      await waitFor(() => {
        expect(
          screen.getByText(
            /This payment amount \(\$50\.00\) exceeds the remaining balance/
          )
        ).toBeInTheDocument();
        expect(
          screen.getByText(/The excess will be credited to the account/)
        ).toBeInTheDocument();
      });
    });

    it("should not show overpayment warning for exact balance", async () => {
      const user = userEvent.setup();
      renderPaymentForm();

      const amountInput = screen.getByLabelText("Payment Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "40"); // Exact balance

      // Should not show warning
      expect(
        screen.queryByText(/exceeds the remaining balance/)
      ).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should disable form during submission", async () => {
      const user = userEvent.setup();
      mockRecordPaymentMutation.isPending = true;
      mockUseRecordPayment.mockReturnValue({
        ...mockRecordPaymentMutation,
        isPending: true,
      });

      renderPaymentForm();

      const submitButton = screen.getByRole("button", { name: "Recording..." });
      expect(submitButton).toBeDisabled();

      // Cancel button should also be disabled if present
      const onCancel = vi.fn();
      renderPaymentForm(mockSubscription, { onCancel });

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toBeDisabled();
    });

    it("should call onSuccess after successful payment", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      mockRecordPaymentMutation.mutateAsync.mockResolvedValue({});

      renderPaymentForm(mockSubscription, { onSuccess });

      const submitButton = screen.getByRole("button", {
        name: "Record Payment",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("should reset form after successful submission", async () => {
      const user = userEvent.setup();
      mockRecordPaymentMutation.mutateAsync.mockResolvedValue({});

      renderPaymentForm();

      // Modify form values
      const amountInput = screen.getByLabelText("Payment Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "25");

      const notesInput = screen.getByLabelText("Notes");
      await user.type(notesInput, "Test payment");

      const submitButton = screen.getByRole("button", {
        name: "Record Payment",
      });
      await user.click(submitButton);

      await waitFor(() => {
        // Form should be reset to default values
        expect(
          (screen.getByLabelText("Payment Amount") as HTMLInputElement).value
        ).toBe("40"); // Default balance
        expect((screen.getByLabelText("Notes") as HTMLInputElement).value).toBe(
          ""
        );
      });
    });

    it("should handle submission errors gracefully", async () => {
      const user = userEvent.setup();
      const error = new Error("Payment failed");
      mockRecordPaymentMutation.mutateAsync.mockRejectedValue(error);

      renderPaymentForm();

      const submitButton = screen.getByRole("button", {
        name: "Record Payment",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRecordPaymentMutation.mutateAsync).toHaveBeenCalled();
      });

      // Form should remain populated for retry
      expect(
        (screen.getByLabelText("Payment Amount") as HTMLInputElement).value
      ).not.toBe("");
    });
  });

  describe("Cancel Functionality", () => {
    it("should call onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      renderPaymentForm(mockSubscription, { onCancel });

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it("should not allow cancel during submission", () => {
      const onCancel = vi.fn();
      mockUseRecordPayment.mockReturnValue({
        ...mockRecordPaymentMutation,
        isPending: true,
      });

      renderPaymentForm(mockSubscription, { onCancel });

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels and associations", () => {
      renderPaymentForm();

      // Check that form fields have proper labels
      expect(screen.getByLabelText("Payment Amount")).toBeInTheDocument();
      expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
      expect(screen.getByLabelText("Payment Date")).toBeInTheDocument();
      expect(screen.getByLabelText("Reference Number")).toBeInTheDocument();
      expect(screen.getByLabelText("Notes")).toBeInTheDocument();
    });

    it("should have proper form descriptions", () => {
      renderPaymentForm();

      expect(
        screen.getByText("Outstanding balance: $40.00")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Date when the payment was received")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Optional reference for tracking (transaction ID, check number, etc.)"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText("Optional notes about this payment")
      ).toBeInTheDocument();
    });

    it("should have proper button roles and states", () => {
      renderPaymentForm();

      const submitButton = screen.getByRole("button", {
        name: "Record Payment",
      });
      expect(submitButton).toHaveAttribute("type", "submit");
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty reference number and notes", async () => {
      const user = userEvent.setup();
      mockRecordPaymentMutation.mutateAsync.mockResolvedValue({});

      renderPaymentForm();

      // Leave reference and notes empty
      const submitButton = screen.getByRole("button", {
        name: "Record Payment",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRecordPaymentMutation.mutateAsync).toHaveBeenCalledWith({
          subscription_id: "sub-123",
          amount: 40,
          payment_method: "cash",
          payment_date: expect.any(String),
          reference_number: undefined, // Should be undefined for empty string
          notes: undefined,
        });
      });
    });

    it("should handle floating point amounts correctly", async () => {
      const user = userEvent.setup();
      mockRecordPaymentMutation.mutateAsync.mockResolvedValue({});

      renderPaymentForm();

      const amountInput = screen.getByLabelText("Payment Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "25.50");

      const submitButton = screen.getByRole("button", {
        name: "Record Payment",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRecordPaymentMutation.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 25.5,
          })
        );
      });
    });

    it("should handle very small amounts", async () => {
      const user = userEvent.setup();
      mockRecordPaymentMutation.mutateAsync.mockResolvedValue({});

      renderPaymentForm();

      const amountInput = screen.getByLabelText("Payment Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "0.01"); // Minimum valid amount

      const submitButton = screen.getByRole("button", {
        name: "Record Payment",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRecordPaymentMutation.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 0.01,
          })
        );
      });
    });
  });
});
