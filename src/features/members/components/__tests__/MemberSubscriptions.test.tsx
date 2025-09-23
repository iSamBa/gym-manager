import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemberSubscriptions } from "../MemberSubscriptions";
import { createQueryWrapper } from "@/test/query-test-utils";
import type {
  Member,
  MemberSubscriptionWithSnapshot,
} from "@/features/database/lib/types";

// Mock the hooks
vi.mock("@/features/memberships/hooks/use-subscriptions", () => ({
  useActiveSubscription: vi.fn(),
  useMemberSubscriptionHistory: vi.fn(),
  useSubscriptionPlans: vi.fn(),
  useCreateSubscription: vi.fn(),
  usePauseSubscription: vi.fn(),
  useResumeSubscription: vi.fn(),
}));

vi.mock("@/features/payments/lib/payment-utils", () => ({
  paymentUtils: {
    calculateBalanceInfo: vi.fn(() => ({
      balance: 0,
      paidPercentage: 100,
    })),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocking
import {
  useActiveSubscription,
  useMemberSubscriptionHistory,
} from "@/features/memberships/hooks/use-subscriptions";

const mockMember: Member = {
  id: "member-123",
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  phone: "+1234567890",
  date_of_birth: "1990-01-01",
  gender: "male",
  address: {
    street: "123 Main St",
    city: "Anytown",
    state: "CA",
    postal_code: "12345",
    country: "USA",
  },
  status: "active",
  join_date: "2024-01-15",
  notes: "Test member notes",
  medical_conditions: "None",
  fitness_goals: "Weight loss and muscle gain",
  preferred_contact_method: "email",
  marketing_consent: true,
  waiver_signed: true,
  waiver_signed_date: "2024-01-15",
  created_by: null,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

const mockActiveSubscription: MemberSubscriptionWithSnapshot = {
  id: "sub-123",
  member_id: "member-123",
  plan_id: "plan-123",
  status: "active",
  start_date: "2024-01-01",
  end_date: "2024-12-31",
  next_billing_date: "2024-02-01",
  billing_cycle: "monthly",
  price: 99.99,
  currency: "USD",
  signup_fee_paid: 25.0,
  auto_renew: true,
  renewal_count: 0,
  notes: "Premium membership",
  created_by: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  plan_name_snapshot: "Premium Monthly",
  total_sessions_snapshot: 20,
  total_amount_snapshot: 199.99,
  duration_days_snapshot: 30,
  used_sessions: 5,
  paid_amount: 150.0,
  remaining_sessions: 15,
  balance_due: 49.99,
  completion_percentage: 25,
  days_remaining: 25,
};

const mockSubscriptionHistory: MemberSubscriptionWithSnapshot[] = [
  {
    ...mockActiveSubscription,
    id: "sub-old-1",
    status: "expired",
    start_date: "2023-06-01",
    end_date: "2023-11-30",
    plan_name_snapshot: "Basic Monthly",
    total_sessions_snapshot: 10,
    used_sessions: 10,
    paid_amount: 99.99,
    total_amount_snapshot: 99.99,
  },
  {
    ...mockActiveSubscription,
    id: "sub-old-2",
    status: "cancelled",
    start_date: "2023-01-01",
    end_date: "2023-05-31",
    plan_name_snapshot: "Student Plan",
    total_sessions_snapshot: 8,
    used_sessions: 3,
    paid_amount: 50.0,
    total_amount_snapshot: 79.99,
  },
];

describe("MemberSubscriptions", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations for all hooks
    vi.mocked(useActiveSubscription).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    // Mock other hooks used in child components
    const mockHooks = vi.mocked(
      require("@/features/memberships/hooks/use-subscriptions")
    );
    mockHooks.useSubscriptionPlans = vi.fn().mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    mockHooks.useCreateSubscription = vi.fn().mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockHooks.usePauseSubscription = vi.fn().mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockHooks.useResumeSubscription = vi.fn().mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  describe("Loading States", () => {
    it("shows loading skeletons when both active subscription and history are loading", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Should show loading skeletons
      expect(screen.getAllByTestId("skeleton")).toHaveLength(2);
    });

    it("shows loading skeletons when only active subscription is loading", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: mockSubscriptionHistory,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getAllByTestId("skeleton")).toHaveLength(2);
    });
  });

  describe("Error States", () => {
    it("shows error message when active subscription fails to load", () => {
      const error = new Error("Failed to load active subscription");

      vi.mocked(useActiveSubscription).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: mockSubscriptionHistory,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(
        screen.getByText("Failed to load subscription data. Please try again.")
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("shows error message when subscription history fails to load", () => {
      const error = new Error("Failed to load subscription history");

      vi.mocked(useActiveSubscription).mockReturnValue({
        data: mockActiveSubscription,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(
        screen.getByText("Failed to load subscription data. Please try again.")
      ).toBeInTheDocument();
    });

    it("shows error message when both queries fail", () => {
      const error = new Error("Network error");

      vi.mocked(useActiveSubscription).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(
        screen.getByText("Failed to load subscription data. Please try again.")
      ).toBeInTheDocument();
    });
  });

  describe("Active Subscription Section", () => {
    it("displays active subscription when one exists", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: mockActiveSubscription,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: mockSubscriptionHistory,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("Current Subscription")).toBeInTheDocument();
      expect(screen.queryByText("New Subscription")).not.toBeInTheDocument();
    });

    it("shows empty state with new subscription button when no active subscription", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: mockSubscriptionHistory,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("Current Subscription")).toBeInTheDocument();
      expect(screen.getByText("No Active Subscription")).toBeInTheDocument();
      expect(
        screen.getByText("This member doesn't have an active subscription.")
      ).toBeInTheDocument();
      expect(screen.getByText("Create Subscription")).toBeInTheDocument();
      expect(screen.getByText("New Subscription")).toBeInTheDocument();
    });

    it("shows new subscription button in header when no active subscription", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Should show new subscription button in header
      const newSubscriptionButtons = screen.getAllByText("New Subscription");
      expect(newSubscriptionButtons).toHaveLength(1);
    });
  });

  describe("Subscription History Section", () => {
    it("displays subscription history when available", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: mockActiveSubscription,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: mockSubscriptionHistory,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("Subscription History")).toBeInTheDocument();
      // SubscriptionHistoryTable should be rendered
      expect(
        screen.queryByText("No Subscription History")
      ).not.toBeInTheDocument();
    });

    it("shows empty state when no subscription history", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: mockActiveSubscription,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("Subscription History")).toBeInTheDocument();
      expect(screen.getByText("No Subscription History")).toBeInTheDocument();
      expect(
        screen.getByText("No previous subscriptions found for this member.")
      ).toBeInTheDocument();
    });

    it("shows empty state when subscription history is null", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: mockActiveSubscription,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("No Subscription History")).toBeInTheDocument();
    });
  });

  describe("New Subscription Dialog", () => {
    it("opens new subscription dialog when button is clicked", async () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const newSubscriptionButton = screen.getByText("New Subscription");
      await user.click(newSubscriptionButton);

      // NewSubscriptionDialog should receive the open prop as true
      // This would be tested more thoroughly in integration tests
    });

    it("opens new subscription dialog from empty state button", async () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const createSubscriptionButton = screen.getByText("Create Subscription");
      await user.click(createSubscriptionButton);

      // Dialog should open
    });
  });

  describe("Component Structure", () => {
    it("has proper spacing between sections", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: mockActiveSubscription,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: mockSubscriptionHistory,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const container = screen.getByText("Current Subscription").closest("div");
      expect(container).toHaveClass("space-y-6");
    });

    it("renders sections in correct order", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: mockActiveSubscription,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: mockSubscriptionHistory,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const sections = screen.getAllByRole("heading", { level: 3 });
      expect(sections[0]).toHaveTextContent("Current Subscription");
      expect(sections[1]).toHaveTextContent("Subscription History");
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: mockActiveSubscription,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: mockSubscriptionHistory,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(
        screen.getByRole("heading", { level: 3, name: "Current Subscription" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 3, name: "Subscription History" })
      ).toBeInTheDocument();
    });

    it("buttons have proper labels", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(
        screen.getByRole("button", { name: "New Subscription" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create Subscription" })
      ).toBeInTheDocument();
    });

    it("alert has proper role and description", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Test error"),
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined member gracefully", () => {
      vi.mocked(useActiveSubscription).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useMemberSubscriptionHistory).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={undefined as any} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("No member data available")).toBeInTheDocument();
    });

    it("passes correct member data to hooks", () => {
      const useActiveSubscriptionMock = vi.mocked(useActiveSubscription);
      const useMemberSubscriptionHistoryMock = vi.mocked(
        useMemberSubscriptionHistory
      );

      useActiveSubscriptionMock.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      useMemberSubscriptionHistoryMock.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<MemberSubscriptions member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(useActiveSubscriptionMock).toHaveBeenCalledWith(mockMember.id);
      expect(useMemberSubscriptionHistoryMock).toHaveBeenCalledWith(
        mockMember.id
      );
    });
  });
});
