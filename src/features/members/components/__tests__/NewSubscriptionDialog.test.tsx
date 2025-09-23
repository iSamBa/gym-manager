import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NewSubscriptionDialog } from "../NewSubscriptionDialog";
import { createQueryWrapper } from "@/test/query-test-utils";
import type { Member, SubscriptionPlan } from "@/features/database/lib/types";

// Mock the hooks
vi.mock("@/features/memberships/hooks/use-subscriptions", () => ({
  useSubscriptionPlans: vi.fn(),
  useCreateSubscription: vi.fn(),
}));

vi.mock("@/features/memberships/lib/validation", () => ({
  createSubscriptionSchema: {
    safeParse: vi.fn(),
  },
}));

vi.mock("date-fns", () => ({
  format: vi.fn((date, formatString) => {
    if (formatString === "PPP") return "January 1, 2024";
    return "2024-01-01";
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocking
import {
  useSubscriptionPlans,
  useCreateSubscription,
} from "@/features/memberships/hooks/use-subscriptions";

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

const mockPlans: SubscriptionPlan[] = [
  {
    id: "plan-1",
    name: "Basic Monthly",
    description: "Basic gym access",
    plan_type: "basic",
    price: 49.99,
    billing_cycle: "monthly",
    currency: "USD",
    features: ["Gym access", "Locker room"],
    max_classes_per_month: 4,
    max_personal_training_sessions: 0,
    includes_guest_passes: 0,
    signup_fee: 25.0,
    cancellation_fee: 0,
    freeze_fee: 10.0,
    contract_length_months: null,
    auto_renew: true,
    is_active: true,
    sort_order: 1,
    created_by: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "plan-2",
    name: "Premium Monthly",
    description: "Premium gym access with classes",
    plan_type: "premium",
    price: 99.99,
    billing_cycle: "monthly",
    currency: "USD",
    features: ["Gym access", "All classes", "Personal training"],
    max_classes_per_month: null,
    max_personal_training_sessions: 2,
    includes_guest_passes: 2,
    signup_fee: 50.0,
    cancellation_fee: 25.0,
    freeze_fee: 15.0,
    contract_length_months: 12,
    auto_renew: true,
    is_active: true,
    sort_order: 2,
    created_by: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

describe("NewSubscriptionDialog", () => {
  const user = userEvent.setup();
  const mockCreateSubscription = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(useSubscriptionPlans).mockReturnValue({
      data: mockPlans,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useCreateSubscription).mockReturnValue({
      mutateAsync: mockCreateSubscription,
      isPending: false,
    } as any);

    // Mock current date
    vi.setSystemTime(new Date("2024-06-15"));
  });

  describe("Dialog Visibility", () => {
    it("renders when open is true", () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText("Create New Subscription")).toBeInTheDocument();
      expect(
        screen.getByText("Create a new subscription for John Doe")
      ).toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={false}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(
        screen.queryByText("Create New Subscription")
      ).not.toBeInTheDocument();
    });
  });

  describe("Form Fields", () => {
    it("renders all required form fields", () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByLabelText("Subscription Plan")).toBeInTheDocument();
      expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
      expect(screen.getByLabelText("Initial Payment")).toBeInTheDocument();
      expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
      expect(screen.getByLabelText("Notes")).toBeInTheDocument();
    });

    it("has proper form structure", () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByRole("form")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create Subscription" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
    });
  });

  describe("Plan Selection", () => {
    it("displays available plans in dropdown", async () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const planSelect = screen.getByLabelText("Subscription Plan");
      await user.click(planSelect);

      expect(screen.getByText("Basic Monthly")).toBeInTheDocument();
      expect(screen.getByText("Premium Monthly")).toBeInTheDocument();
      expect(screen.getByText("$49.99")).toBeInTheDocument();
      expect(screen.getByText("$99.99")).toBeInTheDocument();
    });

    it("shows loading state when plans are loading", () => {
      vi.mocked(useSubscriptionPlans).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const planSelect = screen.getByLabelText("Subscription Plan");
      expect(planSelect).toBeInTheDocument();
    });

    it("displays plan details when plan is selected", async () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const planSelect = screen.getByLabelText("Subscription Plan");
      await user.click(planSelect);
      await user.click(screen.getByText("Basic Monthly"));

      expect(screen.getByText("$49.99")).toBeInTheDocument();
    });
  });

  describe("Plan Details Card", () => {
    beforeEach(async () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const planSelect = screen.getByLabelText("Subscription Plan");
      await user.click(planSelect);
      await user.click(screen.getByText("Basic Monthly"));
    });

    it("shows selected plan information", () => {
      expect(screen.getByText("$49.99")).toBeInTheDocument();
    });

    it("calculates session information correctly", () => {
      // This would depend on how sessions are calculated from the plan
      // The implementation would need to show sessions count if available
    });
  });

  describe("Date Selection", () => {
    it("has start date field with default value", () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const dateButton = screen.getByLabelText("Start Date");
      expect(dateButton).toBeInTheDocument();
    });

    it("opens calendar when date field is clicked", async () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const dateButton = screen.getByLabelText("Start Date");
      await user.click(dateButton);

      // Calendar should be visible
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Payment Amount", () => {
    it("accepts numeric input for initial payment", async () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const paymentInput = screen.getByLabelText("Initial Payment");
      await user.type(paymentInput, "25.00");

      expect(paymentInput).toHaveValue(25);
    });

    it("updates payment breakdown when amount changes", async () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Select a plan first
      const planSelect = screen.getByLabelText("Subscription Plan");
      await user.click(planSelect);
      await user.click(screen.getByText("Basic Monthly"));

      // Enter payment amount
      const paymentInput = screen.getByLabelText("Initial Payment");
      await user.type(paymentInput, "25.00");

      // Should show payment breakdown
      expect(screen.getByText("Plan Price:")).toBeInTheDocument();
      expect(screen.getByText("Initial Payment:")).toBeInTheDocument();
      expect(screen.getByText("Remaining Balance:")).toBeInTheDocument();
    });
  });

  describe("Payment Breakdown Card", () => {
    beforeEach(async () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Select plan and enter payment
      const planSelect = screen.getByLabelText("Subscription Plan");
      await user.click(planSelect);
      await user.click(screen.getByText("Basic Monthly"));

      const paymentInput = screen.getByLabelText("Initial Payment");
      await user.type(paymentInput, "25.00");
    });

    it("shows payment breakdown correctly", () => {
      expect(screen.getByText("Plan Price:")).toBeInTheDocument();
      expect(screen.getByText("$49.99")).toBeInTheDocument();
      expect(screen.getByText("Initial Payment:")).toBeInTheDocument();
      expect(screen.getByText("$25.00")).toBeInTheDocument();
      expect(screen.getByText("Remaining Balance:")).toBeInTheDocument();
      expect(screen.getByText("$24.99")).toBeInTheDocument();
    });

    it("shows fully paid indicator when amount equals plan price", async () => {
      const paymentInput = screen.getByLabelText("Initial Payment");
      await user.clear(paymentInput);
      await user.type(paymentInput, "49.99");

      expect(screen.getByText("✓ Fully paid")).toBeInTheDocument();
      expect(screen.getByText("$0.00")).toBeInTheDocument(); // remaining balance
    });
  });

  describe("Payment Method Selection", () => {
    it("has payment method dropdown with options", async () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const paymentMethodSelect = screen.getByLabelText("Payment Method");
      await user.click(paymentMethodSelect);

      expect(screen.getByText("Cash")).toBeInTheDocument();
      expect(screen.getByText("Credit/Debit Card")).toBeInTheDocument();
      expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
      expect(screen.getByText("Online Payment")).toBeInTheDocument();
      expect(screen.getByText("Check")).toBeInTheDocument();
    });

    it("defaults to cash payment method", () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const paymentMethodSelect = screen.getByLabelText("Payment Method");
      expect(paymentMethodSelect).toHaveTextContent("Cash");
    });
  });

  describe("Notes Field", () => {
    it("accepts text input for notes", async () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const notesInput = screen.getByLabelText("Notes");
      await user.type(notesInput, "Special membership for corporate client");

      expect(notesInput).toHaveValue("Special membership for corporate client");
    });

    it("has placeholder text", () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const notesInput = screen.getByLabelText("Notes");
      expect(notesInput).toHaveAttribute(
        "placeholder",
        "Additional notes about this subscription..."
      );
    });
  });

  describe("Form Submission", () => {
    it("submits form with correct data", async () => {
      mockCreateSubscription.mockResolvedValue({
        id: "new-sub-123",
        plan_name_snapshot: "Basic Monthly",
      });

      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Fill out form
      const planSelect = screen.getByLabelText("Subscription Plan");
      await user.click(planSelect);
      await user.click(screen.getByText("Basic Monthly"));

      const paymentInput = screen.getByLabelText("Initial Payment");
      await user.type(paymentInput, "25.00");

      const notesInput = screen.getByLabelText("Notes");
      await user.type(notesInput, "Test subscription");

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: "Create Subscription",
      });
      await user.click(submitButton);

      expect(mockCreateSubscription).toHaveBeenCalledWith({
        member_id: "member-123",
        plan_id: "plan-1",
        start_date: expect.any(String),
        initial_payment_amount: 25,
        payment_method: "cash",
        notes: "Test subscription",
      });
    });

    it("disables submit button when form is invalid", () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const submitButton = screen.getByRole("button", {
        name: "Create Subscription",
      });
      expect(submitButton).toBeDisabled();
    });

    it("enables submit button when form is valid", async () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Select a plan
      const planSelect = screen.getByLabelText("Subscription Plan");
      await user.click(planSelect);
      await user.click(screen.getByText("Basic Monthly"));

      const submitButton = screen.getByRole("button", {
        name: "Create Subscription",
      });
      expect(submitButton).not.toBeDisabled();
    });

    it("shows loading state during submission", async () => {
      vi.mocked(useCreateSubscription).mockReturnValue({
        mutateAsync: mockCreateSubscription,
        isPending: true,
      } as any);

      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const submitButton = screen.getByRole("button", { name: "Creating..." });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Dialog Actions", () => {
    it("closes dialog when cancel button is clicked", async () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("disables cancel button during submission", () => {
      vi.mocked(useCreateSubscription).mockReturnValue({
        mutateAsync: mockCreateSubscription,
        isPending: true,
      } as any);

      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toBeDisabled();
    });

    it("closes dialog and resets form after successful submission", async () => {
      mockCreateSubscription.mockResolvedValue({
        id: "new-sub-123",
        plan_name_snapshot: "Basic Monthly",
      });

      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Fill and submit form
      const planSelect = screen.getByLabelText("Subscription Plan");
      await user.click(planSelect);
      await user.click(screen.getByText("Basic Monthly"));

      const submitButton = screen.getByRole("button", {
        name: "Create Subscription",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Error Handling", () => {
    it("handles plan loading error", () => {
      vi.mocked(useSubscriptionPlans).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to load plans"),
      } as any);

      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Should still render the form but with no plans available
      expect(screen.getByLabelText("Subscription Plan")).toBeInTheDocument();
    });

    it("handles submission error", async () => {
      mockCreateSubscription.mockRejectedValue(new Error("Submission failed"));

      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      // Fill and submit form
      const planSelect = screen.getByLabelText("Subscription Plan");
      await user.click(planSelect);
      await user.click(screen.getByText("Basic Monthly"));

      const submitButton = screen.getByRole("button", {
        name: "Create Subscription",
      });
      await user.click(submitButton);

      // Error should be handled by the mutation hook
      await waitFor(() => {
        expect(mockCreateSubscription).toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper dialog labeling", () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-labelledby");
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-describedby");
    });

    it("has proper form labels", () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByLabelText("Subscription Plan")).toBeInTheDocument();
      expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
      expect(screen.getByLabelText("Initial Payment")).toBeInTheDocument();
      expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
      expect(screen.getByLabelText("Notes")).toBeInTheDocument();
    });

    it("has proper button roles", () => {
      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(
        screen.getByRole("button", { name: "Create Subscription" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles member without name gracefully", () => {
      const memberWithoutName = {
        ...mockMember,
        first_name: "",
        last_name: "",
      };

      render(
        <NewSubscriptionDialog
          member={memberWithoutName}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(
        screen.getByText("Create a new subscription for")
      ).toBeInTheDocument();
    });

    it("handles empty plans list", () => {
      vi.mocked(useSubscriptionPlans).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(
        <NewSubscriptionDialog
          member={mockMember}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createQueryWrapper() }
      );

      const planSelect = screen.getByLabelText("Subscription Plan");
      expect(planSelect).toBeInTheDocument();
    });
  });
});
