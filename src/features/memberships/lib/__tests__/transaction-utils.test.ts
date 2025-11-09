import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSubscriptionWithPayment,
  processRefundWithTransaction,
  type CreateSubscriptionWithPaymentParams,
  type ProcessRefundParams,
} from "../transaction-utils";
import { createClient } from "@/lib/supabase";

// Mock Supabase client
vi.mock("@/lib/supabase", () => ({
  createClient: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Transaction Utils", () => {
  const mockSupabase = {
    rpc: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(mockSupabase as never);
  });

  describe("createSubscriptionWithPayment", () => {
    const validParams: CreateSubscriptionWithPaymentParams = {
      member_id: "member-123",
      plan_id: "plan-456",
      payment_amount: 100.0,
      payment_method: "card",
    };

    it("should create subscription and payment atomically", async () => {
      const mockResult = {
        success: true,
        subscription_id: "sub-789",
        payment_id: "pay-012",
        message: "Subscription created successfully",
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await createSubscriptionWithPayment(validParams);

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "create_subscription_with_payment",
        {
          p_member_id: validParams.member_id,
          p_plan_id: validParams.plan_id,
          p_payment_amount: validParams.payment_amount,
          p_payment_method: validParams.payment_method,
          p_payment_date: expect.any(String),
        }
      );

      expect(result).toEqual(mockResult);
      expect(result.success).toBe(true);
      expect(result.subscription_id).toBeDefined();
      expect(result.payment_id).toBeDefined();
    });

    it("should use custom payment_date when provided", async () => {
      const customDate = "2025-01-15";
      const params = {
        ...validParams,
        payment_date: customDate,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          subscription_id: "sub-789",
          payment_id: "pay-012",
          message: "Subscription created successfully",
        },
        error: null,
      });

      await createSubscriptionWithPayment(params);

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "create_subscription_with_payment",
        expect.objectContaining({
          p_payment_date: customDate,
        })
      );
    });

    it("should throw error when RPC returns error", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Invalid plan ID" },
      });

      await expect(createSubscriptionWithPayment(validParams)).rejects.toThrow(
        "Transaction failed: Invalid plan ID"
      );
    });

    it("should throw error when RPC returns unsuccessful result", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { success: false },
        error: null,
      });

      await expect(createSubscriptionWithPayment(validParams)).rejects.toThrow(
        "Transaction failed: Unexpected response from database"
      );
    });

    it("should handle all payment methods", async () => {
      const paymentMethods: Array<
        "cash" | "card" | "bank_transfer" | "online" | "check"
      > = ["cash", "card", "bank_transfer", "online", "check"];

      for (const method of paymentMethods) {
        mockSupabase.rpc.mockResolvedValue({
          data: {
            success: true,
            subscription_id: "sub-789",
            payment_id: "pay-012",
            message: "Subscription created successfully",
          },
          error: null,
        });

        await createSubscriptionWithPayment({
          ...validParams,
          payment_method: method,
        });

        expect(mockSupabase.rpc).toHaveBeenCalledWith(
          "create_subscription_with_payment",
          expect.objectContaining({
            p_payment_method: method,
          })
        );
      }
    });
  });

  describe("processRefundWithTransaction", () => {
    const validParams: ProcessRefundParams = {
      payment_id: "pay-123",
      refund_amount: 50.0,
      refund_reason: "Customer request",
    };

    it("should process refund successfully", async () => {
      const mockResult = {
        success: true,
        refund_id: "ref-456",
        payment_id: "pay-123",
        refund_amount: 50.0,
        subscription_cancelled: true,
        message: "Refund processed successfully",
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await processRefundWithTransaction(validParams);

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "process_refund_with_transaction",
        {
          p_payment_id: validParams.payment_id,
          p_refund_amount: validParams.refund_amount,
          p_refund_reason: validParams.refund_reason,
          p_cancel_subscription: true, // Default value
        }
      );

      expect(result).toEqual(mockResult);
      expect(result.success).toBe(true);
      expect(result.refund_id).toBeDefined();
    });

    it("should not cancel subscription when cancel_subscription is false", async () => {
      const params = {
        ...validParams,
        cancel_subscription: false,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          refund_id: "ref-456",
          payment_id: "pay-123",
          refund_amount: 50.0,
          subscription_cancelled: false,
          message: "Refund processed successfully",
        },
        error: null,
      });

      const result = await processRefundWithTransaction(params);

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "process_refund_with_transaction",
        expect.objectContaining({
          p_cancel_subscription: false,
        })
      );

      expect(result.subscription_cancelled).toBe(false);
    });

    it("should throw error when payment not found", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Payment not found" },
      });

      await expect(processRefundWithTransaction(validParams)).rejects.toThrow(
        "Refund failed: Payment not found"
      );
    });

    it("should throw error when refund amount exceeds payment", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: {
          message: "Refund amount exceeds remaining refundable amount",
        },
      });

      await expect(processRefundWithTransaction(validParams)).rejects.toThrow(
        "Refund failed: Refund amount exceeds remaining refundable amount"
      );
    });

    it("should throw error when refunding a refund entry", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Cannot refund a refund entry" },
      });

      await expect(processRefundWithTransaction(validParams)).rejects.toThrow(
        "Refund failed: Cannot refund a refund entry"
      );
    });

    it("should throw error when RPC returns unsuccessful result", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { success: false },
        error: null,
      });

      await expect(processRefundWithTransaction(validParams)).rejects.toThrow(
        "Refund failed: Unexpected response from database"
      );
    });

    it("should handle partial refunds", async () => {
      const partialRefundParams = {
        payment_id: "pay-123",
        refund_amount: 25.0, // Partial refund
        refund_reason: "Partial refund requested",
        cancel_subscription: false,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: true,
          refund_id: "ref-789",
          payment_id: "pay-123",
          refund_amount: 25.0,
          subscription_cancelled: false,
          message: "Refund processed successfully",
        },
        error: null,
      });

      const result = await processRefundWithTransaction(partialRefundParams);

      expect(result.refund_amount).toBe(25.0);
      expect(result.subscription_cancelled).toBe(false);
    });
  });
});
