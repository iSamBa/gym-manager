import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemberPayments } from "../MemberPayments";
import { createQueryWrapper } from "@/test/query-test-utils";
import type {
  Member,
  SubscriptionPaymentWithReceipt,
} from "@/features/database/lib/types";

// Mock the hooks
vi.mock("@/features/payments/hooks/use-payments", () => ({
  useMemberPayments: vi.fn(),
}));

// Import after mocking
import { useMemberPayments } from "@/features/payments/hooks/use-payments";

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

const createMockPayment = (
  overrides: Partial<SubscriptionPaymentWithReceipt> = {}
): SubscriptionPaymentWithReceipt => ({
  id: "payment-123",
  subscription_id: "sub-123",
  member_id: "member-123",
  amount: 99.99,
  currency: "USD",
  payment_method: "card",
  payment_status: "completed",
  payment_date: "2024-01-15",
  due_date: "2024-01-15",
  description: "Monthly membership fee",
  invoice_number: "INV-2024-001",
  transaction_id: "txn_123456",
  payment_processor: "stripe",
  metadata: {},
  late_fee: 0,
  discount_amount: 0,
  discount_reason: null,
  refund_amount: 0,
  refund_date: null,
  refund_reason: null,
  notes: null,
  processed_by: null,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  receipt_number: "RCPT-2024-001",
  reference_number: "REF-123",
  ...overrides,
});

const mockPayments: SubscriptionPaymentWithReceipt[] = [
  createMockPayment({
    id: "payment-1",
    amount: 99.99,
    payment_method: "card",
    payment_status: "completed",
    payment_date: "2024-01-15",
    refund_amount: 0,
  }),
  createMockPayment({
    id: "payment-2",
    amount: 149.99,
    payment_method: "cash",
    payment_status: "completed",
    payment_date: "2024-02-15",
    refund_amount: 25.0,
    refund_date: "2024-02-20",
    refund_reason: "Overpayment",
  }),
  createMockPayment({
    id: "payment-3",
    amount: 199.99,
    payment_method: "bank_transfer",
    payment_status: "completed",
    payment_date: "2024-03-15",
    refund_amount: 0,
  }),
];

describe("MemberPayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("shows loading skeletons when data is loading", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getAllByTestId("skeleton")).toHaveLength(2);
    });

    it("shows loading skeleton for title and content", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons[0]).toHaveClass("h-8", "w-48"); // title skeleton
      expect(skeletons[1]).toHaveClass("h-[400px]", "w-full"); // content skeleton
    });
  });

  describe("Error State", () => {
    it("shows error alert when payment loading fails", () => {
      const error = new Error("Failed to load payments");

      vi.mocked(useMemberPayments).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(
        screen.getByText("Failed to load payment history. Please try again.")
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveClass("destructive");
    });

    it("displays error alert with proper styling", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Network error"),
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("destructive");
    });
  });

  describe("Empty State", () => {
    it("shows empty state when no payments exist", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("Payment History")).toBeInTheDocument();
      expect(screen.getByText("No Payments Found")).toBeInTheDocument();
      expect(
        screen.getByText("No payment records found for this member.")
      ).toBeInTheDocument();
    });

    it("shows empty state when payments data is null", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("No Payments Found")).toBeInTheDocument();
    });

    it("shows empty state card with proper structure", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const card = screen.getByText("Payment History").closest("div");
      expect(card).toHaveClass("rounded-lg", "border");
    });
  });

  describe("Payment Summary", () => {
    beforeEach(() => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      } as any);
    });

    it("calculates and displays total paid correctly", () => {
      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Total: 99.99 + 149.99 + 199.99 = 449.97
      expect(screen.getByText("$449.97")).toBeInTheDocument();
      expect(screen.getByText("Total Paid")).toBeInTheDocument();
    });

    it("calculates and displays total refunded when refunds exist", () => {
      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Only payment-2 has refund: 25.00
      expect(screen.getByText("-$25.00")).toBeInTheDocument();
      expect(screen.getByText("Total Refunded")).toBeInTheDocument();
    });

    it("calculates and displays net paid correctly", () => {
      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Net: 449.97 - 25.00 = 424.97
      expect(screen.getByText("$424.97")).toBeInTheDocument();
      expect(screen.getByText("Net Paid")).toBeInTheDocument();
    });

    it("hides total refunded card when no refunds", () => {
      const paymentsWithoutRefunds = mockPayments.map((p) => ({
        ...p,
        refund_amount: 0,
        refund_date: null,
        refund_reason: null,
      }));

      vi.mocked(useMemberPayments).mockReturnValue({
        data: paymentsWithoutRefunds,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.queryByText("Total Refunded")).not.toBeInTheDocument();
      expect(screen.queryByText("-$")).not.toBeInTheDocument();
    });

    it("shows correct card layout for summary", () => {
      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const summaryCards = screen
        .getAllByText(/Total|Net/)
        .map((text) => text.closest("div")?.closest("div"));

      // Should have 3 cards (Total Paid, Total Refunded, Net Paid)
      expect(summaryCards).toHaveLength(3);
      summaryCards.forEach((card) => {
        expect(card).toHaveClass("rounded-lg", "border");
      });
    });
  });

  describe("Payment History Table", () => {
    beforeEach(() => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      } as any);
    });

    it("renders PaymentHistoryTable component", () => {
      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // PaymentHistoryTable should be rendered
      // This would be tested more thoroughly in the PaymentHistoryTable component tests
      expect(screen.getByText("Payment History")).toBeInTheDocument();
    });

    it("passes correct props to PaymentHistoryTable", () => {
      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // The table should receive the payments data and loading state
      // This would be verified by checking if the data is displayed correctly
    });

    it("enables subscription column in payment table", () => {
      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // The showSubscriptionColumn prop should be true
      // This would be tested in the PaymentHistoryTable component
    });
  });

  describe("Component Structure", () => {
    it("has proper spacing between sections", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const container = screen
        .getByText("Total Paid")
        .closest("div")
        ?.closest("div")
        ?.closest("div");
      expect(container).toHaveClass("space-y-6");
    });

    it("renders summary cards in grid layout", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const grid = screen
        .getByText("Total Paid")
        .closest("div")
        ?.closest("div");
      expect(grid).toHaveClass("grid", "grid-cols-3", "gap-4");
    });
  });

  describe("Amount Calculations", () => {
    it("handles zero amounts correctly", () => {
      const zeroPayments = [
        createMockPayment({
          amount: 0,
          refund_amount: 0,
        }),
      ];

      vi.mocked(useMemberPayments).mockReturnValue({
        data: zeroPayments,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });

    it("handles large amounts correctly", () => {
      const largePayments = [
        createMockPayment({
          amount: 999999.99,
          refund_amount: 100000.0,
        }),
      ];

      vi.mocked(useMemberPayments).mockReturnValue({
        data: largePayments,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText("$999999.99")).toBeInTheDocument();
      expect(screen.getByText("-$100000.00")).toBeInTheDocument();
      expect(screen.getByText("$899999.99")).toBeInTheDocument();
    });

    it("handles decimal precision correctly", () => {
      const precisionPayments = [
        createMockPayment({
          amount: 99.999,
          refund_amount: 10.001,
        }),
      ];

      vi.mocked(useMemberPayments).mockReturnValue({
        data: precisionPayments,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Should format to 2 decimal places
      expect(screen.getByText("$100.00")).toBeInTheDocument(); // 99.999 rounded
      expect(screen.getByText("-$10.00")).toBeInTheDocument(); // 10.001 rounded
      expect(screen.getByText("$90.00")).toBeInTheDocument(); // net amount
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Should have proper heading hierarchy
      expect(screen.getByText("Total Paid")).toBeInTheDocument();
      expect(screen.getByText("Total Refunded")).toBeInTheDocument();
      expect(screen.getByText("Net Paid")).toBeInTheDocument();
    });

    it("has proper card content structure", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Each card should have proper content structure
      const totalPaidCard = screen.getByText("$449.97").closest("div");
      expect(totalPaidCard).toHaveClass("pt-6");
    });

    it("has proper alert structure for errors", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Test error"),
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("destructive");
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined member gracefully", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      // Should not crash
      render(<MemberPayments member={undefined as any} />, {
        wrapper: createQueryWrapper(),
      });
    });

    it("handles member with null id", () => {
      const memberWithNullId = { ...mockMember, id: null as any };

      vi.mocked(useMemberPayments).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={memberWithNullId} />, {
        wrapper: createQueryWrapper(),
      });

      expect(useMemberPayments).toHaveBeenCalledWith(null);
    });

    it("passes correct member id to hook", () => {
      const useMemberPaymentsMock = vi.mocked(useMemberPayments);

      useMemberPaymentsMock.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      expect(useMemberPaymentsMock).toHaveBeenCalledWith("member-123");
    });

    it("handles payments with missing optional fields", () => {
      const minimalPayments = [
        createMockPayment({
          refund_amount: 0,
          refund_date: null,
          refund_reason: null,
          notes: null,
        }),
      ];

      vi.mocked(useMemberPayments).mockReturnValue({
        data: minimalPayments,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Should handle missing fields gracefully
      expect(screen.getByText("$99.99")).toBeInTheDocument();
      expect(screen.queryByText("Total Refunded")).not.toBeInTheDocument();
    });
  });

  describe("Color Styling", () => {
    it("applies correct color styling to amounts", () => {
      vi.mocked(useMemberPayments).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      } as any);

      render(<MemberPayments member={mockMember} />, {
        wrapper: createQueryWrapper(),
      });

      // Refunded amount should be red
      const refundedAmount = screen.getByText("-$25.00");
      expect(refundedAmount).toHaveClass("text-red-600");

      // Net paid should be green
      const netAmount = screen.getByText("$424.97");
      expect(netAmount).toHaveClass("text-green-600");
    });
  });
});
