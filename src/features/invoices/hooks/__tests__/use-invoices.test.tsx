/**
 * Tests for useInvoices hook
 *
 * Covers:
 * - Invoice generation mutation
 * - Invoice existence checking
 * - Query invalidation
 * - Error handling
 * - Toast notifications
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { useInvoices } from "../use-invoices";
import { createInvoice } from "../../lib/invoice-generator";
import { supabase } from "@/lib/supabase";
import type { Invoice } from "@/features/database/lib/types";

// Mock dependencies
vi.mock("sonner");
vi.mock("@/lib/supabase");
vi.mock("../../lib/invoice-generator");
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("useInvoices", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactElement => {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  describe("generateInvoice", () => {
    it("should successfully generate invoice", async () => {
      const mockInvoice: Invoice = {
        id: "inv_123",
        invoice_number: "08012025-01",
        member_id: "mem_456",
        payment_id: "pay_789",
        subscription_id: "sub_abc",
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

      vi.mocked(createInvoice).mockResolvedValue(mockInvoice);

      const { result } = renderHook(() => useInvoices(), { wrapper });

      const input = {
        payment_id: "pay_789",
        member_id: "mem_456",
        subscription_id: "sub_abc",
        amount: 7200,
      };

      await waitFor(async () => {
        const invoice = await result.current.generateInvoice(input);
        expect(invoice).toEqual(mockInvoice);
      });

      expect(createInvoice).toHaveBeenCalledWith(input);
      expect(toast.success).toHaveBeenCalledWith(
        "Invoice generated successfully",
        {
          description: "Invoice 08012025-01 has been created.",
        }
      );
    });

    it("should handle generation errors", async () => {
      const error = new Error("Settings not configured");
      vi.mocked(createInvoice).mockRejectedValue(error);

      const { result } = renderHook(() => useInvoices(), { wrapper });

      const input = {
        payment_id: "pay_789",
        member_id: "mem_456",
        amount: 7200,
      };

      await expect(result.current.generateInvoice(input)).rejects.toThrow(
        "Settings not configured"
      );

      expect(toast.error).toHaveBeenCalledWith("Failed to generate invoice", {
        description: "Settings not configured",
      });
    });

    it("should invalidate queries after successful generation", async () => {
      const mockInvoice: Invoice = {
        id: "inv_123",
        invoice_number: "08012025-01",
        member_id: "mem_456",
        payment_id: "pay_789",
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

      vi.mocked(createInvoice).mockResolvedValue(mockInvoice);

      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useInvoices(), { wrapper });

      await waitFor(async () => {
        await result.current.generateInvoice({
          payment_id: "pay_789",
          member_id: "mem_456",
          amount: 7200,
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["invoices"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["payments"],
      });
    });
  });

  describe("checkInvoiceExists", () => {
    it("should return true when invoice exists", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "inv_123" },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useInvoices(), { wrapper });

      const exists = await result.current.checkInvoiceExists("pay_789");

      expect(exists).toBe(true);
    });

    it("should return false when invoice does not exist", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useInvoices(), { wrapper });

      const exists = await result.current.checkInvoiceExists("pay_789");

      expect(exists).toBe(false);
    });

    it("should return false on database error", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useInvoices(), { wrapper });

      const exists = await result.current.checkInvoiceExists("pay_789");

      expect(exists).toBe(false);
    });
  });

  describe("isGenerating state", () => {
    it("should reflect generating state", async () => {
      const mockInvoice: Invoice = {
        id: "inv_123",
        invoice_number: "08012025-01",
        member_id: "mem_456",
        payment_id: "pay_789",
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

      let resolveGeneration: (value: Invoice) => void;
      const generationPromise = new Promise<Invoice>((resolve) => {
        resolveGeneration = resolve;
      });

      vi.mocked(createInvoice).mockReturnValue(generationPromise);

      const { result } = renderHook(() => useInvoices(), { wrapper });

      expect(result.current.isGenerating).toBe(false);

      const generatePromise = result.current.generateInvoice({
        payment_id: "pay_789",
        member_id: "mem_456",
        amount: 7200,
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(true);
      });

      resolveGeneration!(mockInvoice);
      await generatePromise;

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });
    });
  });
});
