import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { paymentUtils } from "../payment-utils";
import type {
  RecordPaymentInput,
  SubscriptionPaymentWithReceipt,
  MemberSubscriptionWithSnapshot,
  PaymentMethod,
} from "@/features/database/lib/types";

// Mock the supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

import { supabase } from "@/lib/supabase";

const mockUser = { id: "user-123" };
const mockSupabase = vi.mocked(supabase);

// Mock data
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
  paid_amount: 60,
};

const mockPayment: SubscriptionPaymentWithReceipt = {
  id: "payment-123",
  subscription_id: "sub-123",
  member_id: "member-123",
  amount: 40,
  currency: "USD",
  payment_method: "cash",
  payment_status: "completed",
  payment_date: "2024-01-15T00:00:00Z",
  due_date: "2024-01-01T00:00:00Z",
  late_fee: 0,
  discount_amount: 0,
  refund_amount: 0,
  created_at: "2024-01-15T00:00:00Z",
  updated_at: "2024-01-15T00:00:00Z",
  receipt_number: "RCPT-2024-0001",
  reference_number: "TXN-12345",
  notes: "Payment recorded",
  created_by: "user-123",
};

describe("paymentUtils", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("recordPayment", () => {
    it("should record a payment with all required fields", async () => {
      const input: RecordPaymentInput = {
        subscription_id: "sub-123",
        amount: 40,
        payment_method: "cash",
        payment_date: "2024-01-15T00:00:00Z",
        reference_number: "TXN-12345",
        notes: "Payment recorded",
      };

      // Mock subscription fetch
      const subscriptionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            member_id: "member-123",
            total_amount_snapshot: 100,
            paid_amount: 60,
          },
          error: null,
        }),
      };

      // Mock payment insert
      const paymentInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPayment,
          error: null,
        }),
      };

      // Mock payments query for updating subscription paid amount
      const paymentsSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ amount: 100 }], // Total paid amount
            error: null,
          }),
        }),
      };

      // Mock subscription update
      const subscriptionUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(subscriptionChain) // Get subscription
        .mockReturnValueOnce(paymentInsertChain) // Insert payment
        .mockReturnValueOnce(paymentsSelectChain) // Get all payments for subscription
        .mockReturnValueOnce(subscriptionUpdateChain); // Update subscription paid amount

      const result = await paymentUtils.recordPayment(input);

      expect(subscriptionChain.select).toHaveBeenCalledWith(
        "member_id, total_amount_snapshot, paid_amount"
      );
      expect(subscriptionChain.eq).toHaveBeenCalledWith("id", "sub-123");

      expect(paymentInsertChain.insert).toHaveBeenCalledWith({
        subscription_id: "sub-123",
        member_id: "member-123",
        amount: 40,
        payment_method: "cash",
        payment_date: "2024-01-15T00:00:00Z",
        payment_status: "completed",
        reference_number: "TXN-12345",
        notes: "Payment recorded",
        created_by: "user-123",
      });

      expect(result).toEqual(mockPayment);
    });

    it("should use current date when payment_date is not provided", async () => {
      const input: RecordPaymentInput = {
        subscription_id: "sub-123",
        amount: 40,
        payment_method: "cash",
      };

      const subscriptionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            member_id: "member-123",
            total_amount_snapshot: 100,
            paid_amount: 60,
          },
          error: null,
        }),
      };

      const paymentInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPayment,
          error: null,
        }),
      };

      const paymentsSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ amount: 100 }],
            error: null,
          }),
        }),
      };

      const subscriptionUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(subscriptionChain)
        .mockReturnValueOnce(paymentInsertChain)
        .mockReturnValueOnce(paymentsSelectChain)
        .mockReturnValueOnce(subscriptionUpdateChain);

      await paymentUtils.recordPayment(input);

      expect(paymentInsertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_date: expect.any(String),
        })
      );
    });

    it("should throw error when subscription not found", async () => {
      const input: RecordPaymentInput = {
        subscription_id: "sub-123",
        amount: 40,
        payment_method: "cash",
      };

      const subscriptionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Subscription not found"),
        }),
      };

      mockSupabase.from.mockReturnValue(subscriptionChain);

      await expect(paymentUtils.recordPayment(input)).rejects.toThrow(
        "Subscription not found"
      );
    });

    it("should throw error when payment insert fails", async () => {
      const input: RecordPaymentInput = {
        subscription_id: "sub-123",
        amount: 40,
        payment_method: "cash",
      };

      const subscriptionChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            member_id: "member-123",
            total_amount_snapshot: 100,
            paid_amount: 60,
          },
          error: null,
        }),
      };

      const paymentInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Payment insert failed"),
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(subscriptionChain)
        .mockReturnValueOnce(paymentInsertChain);

      await expect(paymentUtils.recordPayment(input)).rejects.toThrow(
        "Payment insert failed"
      );
    });
  });

  describe("updateSubscriptionPaidAmount", () => {
    it("should calculate and update the total paid amount", async () => {
      const subscriptionId = "sub-123";
      const mockPayments = [{ amount: 40 }, { amount: 30 }, { amount: 20 }];

      const paymentsSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPayments,
            error: null,
          }),
        }),
      };

      const subscriptionUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(paymentsSelectChain)
        .mockReturnValueOnce(subscriptionUpdateChain);

      const result =
        await paymentUtils.updateSubscriptionPaidAmount(subscriptionId);

      expect(paymentsSelectChain.select).toHaveBeenCalledWith("amount");
      expect(subscriptionUpdateChain.update).toHaveBeenCalledWith({
        paid_amount: 90, // 40 + 30 + 20
        updated_at: expect.any(String),
      });
      expect(subscriptionUpdateChain.eq).toHaveBeenCalledWith(
        "id",
        subscriptionId
      );
      expect(result).toBe(90);
    });

    it("should handle empty payments array", async () => {
      const subscriptionId = "sub-123";

      const paymentsSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      const subscriptionUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(paymentsSelectChain)
        .mockReturnValueOnce(subscriptionUpdateChain);

      const result =
        await paymentUtils.updateSubscriptionPaidAmount(subscriptionId);

      expect(subscriptionUpdateChain.update).toHaveBeenCalledWith({
        paid_amount: 0,
        updated_at: expect.any(String),
      });
      expect(result).toBe(0);
    });

    it("should throw error when payments query fails", async () => {
      const subscriptionId = "sub-123";

      const paymentsSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: new Error("Query failed"),
          }),
        }),
      };

      mockSupabase.from.mockReturnValue(paymentsSelectChain);

      await expect(
        paymentUtils.updateSubscriptionPaidAmount(subscriptionId)
      ).rejects.toThrow("Query failed");
    });
  });

  describe("getSubscriptionPayments", () => {
    it("should return payments ordered by payment_date desc", async () => {
      const subscriptionId = "sub-123";
      const mockPayments = [mockPayment];

      const paymentsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockPayments,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(paymentsChain);

      const result = await paymentUtils.getSubscriptionPayments(subscriptionId);

      expect(paymentsChain.select).toHaveBeenCalledWith("*");
      expect(paymentsChain.eq).toHaveBeenCalledWith(
        "subscription_id",
        subscriptionId
      );
      expect(paymentsChain.order).toHaveBeenCalledWith("payment_date", {
        ascending: false,
      });
      expect(result).toEqual(mockPayments);
    });

    it("should throw error when query fails", async () => {
      const subscriptionId = "sub-123";

      const paymentsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Query failed"),
        }),
      };

      mockSupabase.from.mockReturnValue(paymentsChain);

      await expect(
        paymentUtils.getSubscriptionPayments(subscriptionId)
      ).rejects.toThrow("Query failed");
    });
  });

  describe("getMemberPayments", () => {
    it("should return member payments with subscription details", async () => {
      const memberId = "member-123";
      const mockMemberPayments = [
        {
          ...mockPayment,
          member_subscriptions: { plan_name_snapshot: "Premium Plan" },
        },
      ];

      const paymentsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockMemberPayments,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(paymentsChain);

      const result = await paymentUtils.getMemberPayments(memberId);

      expect(paymentsChain.select).toHaveBeenCalledWith(`
        *,
        member_subscriptions!inner(plan_name_snapshot)
      `);
      expect(paymentsChain.eq).toHaveBeenCalledWith("member_id", memberId);
      expect(paymentsChain.order).toHaveBeenCalledWith("payment_date", {
        ascending: false,
      });
      expect(result).toEqual(mockMemberPayments);
    });
  });

  describe("calculateBalanceInfo", () => {
    it("should calculate balance information correctly", () => {
      const subscription: MemberSubscriptionWithSnapshot = {
        ...mockSubscription,
        total_amount_snapshot: 100,
        paid_amount: 60,
      };

      const result = paymentUtils.calculateBalanceInfo(subscription);

      expect(result).toEqual({
        totalAmount: 100,
        paidAmount: 60,
        balance: 40,
        paidPercentage: 60,
        isFullyPaid: false,
        isOverpaid: false,
      });
    });

    it("should handle fully paid subscription", () => {
      const subscription: MemberSubscriptionWithSnapshot = {
        ...mockSubscription,
        total_amount_snapshot: 100,
        paid_amount: 100,
      };

      const result = paymentUtils.calculateBalanceInfo(subscription);

      expect(result).toEqual({
        totalAmount: 100,
        paidAmount: 100,
        balance: 0,
        paidPercentage: 100,
        isFullyPaid: true,
        isOverpaid: false,
      });
    });

    it("should handle overpaid subscription", () => {
      const subscription: MemberSubscriptionWithSnapshot = {
        ...mockSubscription,
        total_amount_snapshot: 100,
        paid_amount: 120,
      };

      const result = paymentUtils.calculateBalanceInfo(subscription);

      expect(result).toEqual({
        totalAmount: 100,
        paidAmount: 120,
        balance: 0, // Math.max(0, 100 - 120) = 0
        paidPercentage: 120,
        isFullyPaid: true,
        isOverpaid: true,
      });
    });

    it("should handle zero total amount", () => {
      const subscription: MemberSubscriptionWithSnapshot = {
        ...mockSubscription,
        total_amount_snapshot: 0,
        paid_amount: 0,
      };

      const result = paymentUtils.calculateBalanceInfo(subscription);

      expect(result).toEqual({
        totalAmount: 0,
        paidAmount: 0,
        balance: 0,
        paidPercentage: 0,
        isFullyPaid: true,
        isOverpaid: false,
      });
    });
  });

  describe("processRefund", () => {
    it("should process partial refund correctly", async () => {
      const paymentId = "payment-123";
      const refundAmount = 20;
      const reason = "Customer request";

      const fetchPaymentChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockPayment, amount: 40, subscription_id: "sub-123" },
          error: null,
        }),
      };

      const updatePaymentChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            ...mockPayment,
            refund_amount: 20,
            refund_date: expect.any(String),
            refund_reason: reason,
            payment_status: "completed",
          },
          error: null,
        }),
      };

      // Mock calls for updateSubscriptionPaidAmount
      const paymentsSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ amount: 20 }], // Remaining after refund
            error: null,
          }),
        }),
      };

      const subscriptionUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(fetchPaymentChain)
        .mockReturnValueOnce(updatePaymentChain)
        .mockReturnValueOnce(paymentsSelectChain)
        .mockReturnValueOnce(subscriptionUpdateChain);

      const result = await paymentUtils.processRefund(
        paymentId,
        refundAmount,
        reason
      );

      expect(updatePaymentChain.update).toHaveBeenCalledWith({
        refund_amount: 20,
        refund_date: expect.any(String),
        refund_reason: reason,
        payment_status: "completed", // Partial refund
        updated_at: expect.any(String),
      });

      expect(result.refund_amount).toBe(20);
    });

    it("should process full refund correctly", async () => {
      const paymentId = "payment-123";
      const refundAmount = 40;
      const reason = "Service cancelled";

      const fetchPaymentChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockPayment, amount: 40, subscription_id: "sub-123" },
          error: null,
        }),
      };

      const updatePaymentChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            ...mockPayment,
            refund_amount: 40,
            refund_date: expect.any(String),
            refund_reason: reason,
            payment_status: "refunded", // Full refund
          },
          error: null,
        }),
      };

      const paymentsSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      const subscriptionUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(fetchPaymentChain)
        .mockReturnValueOnce(updatePaymentChain)
        .mockReturnValueOnce(paymentsSelectChain)
        .mockReturnValueOnce(subscriptionUpdateChain);

      const result = await paymentUtils.processRefund(
        paymentId,
        refundAmount,
        reason
      );

      expect(updatePaymentChain.update).toHaveBeenCalledWith({
        refund_amount: 40,
        refund_date: expect.any(String),
        refund_reason: reason,
        payment_status: "refunded", // Full refund
        updated_at: expect.any(String),
      });

      expect(result.payment_status).toBe("refunded");
    });

    it("should throw error when refund amount exceeds payment amount", async () => {
      const paymentId = "payment-123";
      const refundAmount = 50; // Exceeds payment amount of 40
      const reason = "Invalid refund";

      const fetchPaymentChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockPayment, amount: 40 },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(fetchPaymentChain);

      await expect(
        paymentUtils.processRefund(paymentId, refundAmount, reason)
      ).rejects.toThrow("Refund amount cannot exceed original payment amount");
    });

    it("should throw error when payment not found", async () => {
      const paymentId = "payment-123";
      const refundAmount = 20;
      const reason = "Test refund";

      const fetchPaymentChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Payment not found"),
        }),
      };

      mockSupabase.from.mockReturnValue(fetchPaymentChain);

      await expect(
        paymentUtils.processRefund(paymentId, refundAmount, reason)
      ).rejects.toThrow("Payment not found");
    });
  });

  describe("getPaymentStats", () => {
    it("should calculate payment statistics correctly", async () => {
      const startDate = "2024-01-01T00:00:00Z";
      const endDate = "2024-01-31T23:59:59Z";

      const mockStatsPayments = [
        {
          amount: 100,
          payment_method: "cash" as PaymentMethod,
          payment_date: "2024-01-01T00:00:00Z",
        },
        {
          amount: 200,
          payment_method: "card" as PaymentMethod,
          payment_date: "2024-01-15T00:00:00Z",
        },
        {
          amount: 150,
          payment_method: "cash" as PaymentMethod,
          payment_date: "2024-01-30T00:00:00Z",
        },
      ];

      const statsChain = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockStatsPayments,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(statsChain);

      const result = await paymentUtils.getPaymentStats(startDate, endDate);

      expect(statsChain.select).toHaveBeenCalledWith(
        "amount, payment_method, payment_date"
      );
      expect(statsChain.gte).toHaveBeenCalledWith("payment_date", startDate);
      expect(statsChain.lte).toHaveBeenCalledWith("payment_date", endDate);
      expect(statsChain.eq).toHaveBeenCalledWith("payment_status", "completed");

      expect(result).toEqual({
        totalRevenue: 450, // 100 + 200 + 150
        paymentCount: 3,
        averagePayment: 150, // 450 / 3
        paymentMethodBreakdown: {
          cash: 250, // 100 + 150
          card: 200,
        },
      });
    });

    it("should handle empty payment data", async () => {
      const startDate = "2024-01-01T00:00:00Z";
      const endDate = "2024-01-31T23:59:59Z";

      const statsChain = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(statsChain);

      const result = await paymentUtils.getPaymentStats(startDate, endDate);

      expect(result).toEqual({
        totalRevenue: 0,
        paymentCount: 0,
        averagePayment: 0,
        paymentMethodBreakdown: {},
      });
    });

    it("should throw error when stats query fails", async () => {
      const startDate = "2024-01-01T00:00:00Z";
      const endDate = "2024-01-31T23:59:59Z";

      const statsChain = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Stats query failed"),
        }),
      };

      mockSupabase.from.mockReturnValue(statsChain);

      await expect(
        paymentUtils.getPaymentStats(startDate, endDate)
      ).rejects.toThrow("Stats query failed");
    });
  });
});
