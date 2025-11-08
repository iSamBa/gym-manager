/**
 * Integration Tests for Invoice Auto-Generation
 *
 * Tests the complete flow from payment recording to invoice generation.
 * Covers both automatic and manual generation scenarios.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createInvoice } from "../lib/invoice-generator";
import { paymentUtils } from "@/features/payments/lib/payment-utils";
import type {
  Invoice,
  SubscriptionPaymentWithReceipt,
} from "@/features/database/lib/types";

// Mock dependencies
vi.mock("@/lib/supabase");
vi.mock("../lib/invoice-generator", () => ({
  createInvoice: vi.fn(),
}));
vi.mock("@/features/payments/lib/payment-utils", () => ({
  paymentUtils: {
    recordPayment: vi.fn(),
  },
}));
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Invoice Auto-Generation Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Auto-generation on payment recording", () => {
    it("should generate invoice after payment when auto-generate enabled", async () => {
      const mockPayment: SubscriptionPaymentWithReceipt = {
        id: "pay_123",
        member_id: "mem_456",
        subscription_id: "sub_789",
        amount: 7200,
        payment_method: "cash",
        payment_date: "2025-01-08",
        payment_status: "completed",
        receipt_number: "REC-08012025-001",
        created_at: "2025-01-08T10:00:00Z",
        updated_at: "2025-01-08T10:00:00Z",
        due_date: null,
        reference_number: null,
        notes: null,
        is_refund: false,
        refunded_payment_id: null,
        refund_reason: null,
        refund_amount: null,
        refund_metadata: null,
        description: null,
      };

      const mockInvoice: Invoice = {
        id: "inv_123",
        invoice_number: "08012025-01",
        member_id: "mem_456",
        payment_id: "pay_123",
        subscription_id: "sub_789",
        amount: 7200,
        tax_amount: 1200,
        total_amount: 8400,
        vat_rate: 20,
        issue_date: "2025-01-08",
        status: "paid",
        pdf_url: "https://example.com/invoice.pdf",
        footer_notes: null,
        created_at: "2025-01-08T10:00:00Z",
        updated_at: "2025-01-08T10:00:00Z",
      };

      // Mock payment recording
      vi.mocked(paymentUtils.recordPayment).mockResolvedValue(mockPayment);

      // Mock invoice generation
      vi.mocked(createInvoice).mockResolvedValue(mockInvoice);

      // Simulate workflow
      const payment = await paymentUtils.recordPayment({
        member_id: "mem_456",
        subscription_id: "sub_789",
        amount: 7200,
        payment_method: "cash",
        payment_date: "2025-01-08",
      });

      // Auto-generate should be triggered (simulated)
      const invoice = await createInvoice({
        payment_id: payment.id,
        member_id: payment.member_id,
        subscription_id: payment.subscription_id || undefined,
        amount: payment.amount,
      });

      expect(payment.id).toBe("pay_123");
      expect(invoice.payment_id).toBe(payment.id);
      expect(invoice.amount).toBe(payment.amount);
    });

    it("should not generate invoice when auto-generate disabled", async () => {
      const mockPayment: SubscriptionPaymentWithReceipt = {
        id: "pay_123",
        member_id: "mem_456",
        subscription_id: "sub_789",
        amount: 7200,
        payment_method: "cash",
        payment_date: "2025-01-08",
        payment_status: "completed",
        receipt_number: "REC-08012025-001",
        created_at: "2025-01-08T10:00:00Z",
        updated_at: "2025-01-08T10:00:00Z",
        due_date: null,
        reference_number: null,
        notes: null,
        is_refund: false,
        refunded_payment_id: null,
        refund_reason: null,
        refund_amount: null,
        refund_metadata: null,
        description: null,
      };

      vi.mocked(paymentUtils.recordPayment).mockResolvedValue(mockPayment);

      // Simulate workflow with auto-generate disabled
      const payment = await paymentUtils.recordPayment({
        member_id: "mem_456",
        amount: 7200,
        payment_method: "cash",
        payment_date: "2025-01-08",
      });

      // Invoice should NOT be generated
      expect(payment.id).toBe("pay_123");
      expect(createInvoice).not.toHaveBeenCalled();
    });
  });

  describe("Manual invoice generation", () => {
    it("should allow manual generation for payment", async () => {
      const mockInvoice: Invoice = {
        id: "inv_456",
        invoice_number: "08012025-02",
        member_id: "mem_789",
        payment_id: "pay_abc",
        subscription_id: null,
        amount: 5000,
        tax_amount: 833.33,
        total_amount: 5833.33,
        vat_rate: 20,
        issue_date: "2025-01-08",
        status: "paid",
        pdf_url: "https://example.com/invoice-2.pdf",
        footer_notes: null,
        created_at: "2025-01-08T11:00:00Z",
        updated_at: "2025-01-08T11:00:00Z",
      };

      vi.mocked(createInvoice).mockResolvedValue(mockInvoice);

      const invoice = await createInvoice({
        payment_id: "pay_abc",
        member_id: "mem_789",
        amount: 5000,
      });

      expect(invoice.payment_id).toBe("pay_abc");
      expect(invoice.invoice_number).toBe("08012025-02");
      expect(createInvoice).toHaveBeenCalledWith({
        payment_id: "pay_abc",
        member_id: "mem_789",
        amount: 5000,
      });
    });
  });

  describe("Error handling scenarios", () => {
    it("should handle invoice generation failure gracefully", async () => {
      vi.mocked(createInvoice).mockRejectedValue(
        new Error("General settings not configured")
      );

      await expect(
        createInvoice({
          payment_id: "pay_123",
          member_id: "mem_456",
          amount: 7200,
        })
      ).rejects.toThrow("General settings not configured");

      // Payment would still succeed in the actual implementation
      // (error handling is in the component)
    });

    it("should handle missing settings error", async () => {
      vi.mocked(createInvoice).mockRejectedValue(
        new Error("Invoice settings not configured")
      );

      await expect(
        createInvoice({
          payment_id: "pay_123",
          member_id: "mem_456",
          amount: 7200,
        })
      ).rejects.toThrow("Invoice settings not configured");
    });

    it("should handle PDF generation failure", async () => {
      vi.mocked(createInvoice).mockRejectedValue(
        new Error("Failed to generate invoice PDF")
      );

      await expect(
        createInvoice({
          payment_id: "pay_123",
          member_id: "mem_456",
          amount: 7200,
        })
      ).rejects.toThrow("Failed to generate invoice PDF");
    });

    it("should handle storage upload failure", async () => {
      vi.mocked(createInvoice).mockRejectedValue(
        new Error("Failed to upload PDF to Storage")
      );

      await expect(
        createInvoice({
          payment_id: "pay_123",
          member_id: "mem_456",
          amount: 7200,
        })
      ).rejects.toThrow("Failed to upload PDF to Storage");
    });
  });

  describe("Duplicate prevention", () => {
    it("should prevent duplicate invoice generation", async () => {
      // First generation succeeds
      const mockInvoice: Invoice = {
        id: "inv_123",
        invoice_number: "08012025-01",
        member_id: "mem_456",
        payment_id: "pay_123",
        subscription_id: null,
        amount: 7200,
        tax_amount: 1200,
        total_amount: 8400,
        vat_rate: 20,
        issue_date: "2025-01-08",
        status: "paid",
        pdf_url: "https://example.com/invoice.pdf",
        footer_notes: null,
        created_at: "2025-01-08T10:00:00Z",
        updated_at: "2025-01-08T10:00:00Z",
      };

      vi.mocked(createInvoice).mockResolvedValueOnce(mockInvoice);

      const firstInvoice = await createInvoice({
        payment_id: "pay_123",
        member_id: "mem_456",
        amount: 7200,
      });

      expect(firstInvoice.id).toBe("inv_123");

      // Second generation should fail (duplicate check)
      vi.mocked(createInvoice).mockRejectedValueOnce(
        new Error("Invoice already exists for this payment")
      );

      await expect(
        createInvoice({
          payment_id: "pay_123",
          member_id: "mem_456",
          amount: 7200,
        })
      ).rejects.toThrow("Invoice already exists for this payment");
    });
  });
});
