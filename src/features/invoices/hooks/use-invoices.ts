/**
 * Invoice Management Hook
 *
 * Provides React Query-based operations for invoice generation and management.
 * Handles automatic and manual invoice generation with proper error handling.
 *
 * @module use-invoices
 */

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { createInvoice } from "../lib/invoice-generator";

/**
 * Input parameters for invoice generation
 */
interface GenerateInvoiceInput {
  payment_id: string;
  member_id: string;
  subscription_id?: string;
  amount: number;
}

/**
 * Hook for invoice CRUD operations
 *
 * Provides:
 * - generateInvoice: Create invoice with PDF generation
 * - checkInvoiceExists: Verify if invoice exists for payment
 * - Query invalidation for cache management
 *
 * @returns Invoice operations and loading states
 *
 * @example
 * ```typescript
 * const { generateInvoice, isGenerating, checkInvoiceExists } = useInvoices();
 *
 * // Generate invoice
 * await generateInvoice({
 *   payment_id: "pay_123",
 *   member_id: "mem_456",
 *   amount: 7200
 * });
 *
 * // Check if invoice exists
 * const exists = await checkInvoiceExists("pay_123");
 * ```
 */
export function useInvoices() {
  const queryClient = useQueryClient();

  /**
   * Generate invoice mutation
   *
   * Creates invoice record, generates PDF, and uploads to Storage.
   * On success, invalidates related queries and shows success toast.
   * On error, logs error and shows error toast.
   */
  const generateMutation = useMutation({
    mutationFn: async (input: GenerateInvoiceInput) => {
      logger.info("Starting invoice generation", {
        payment_id: input.payment_id,
        member_id: input.member_id,
        amount: input.amount,
      });

      // Use the complete invoice generation workflow from US-003
      const invoice = await createInvoice(input);

      logger.info("Invoice generation completed", {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
      });

      return invoice;
    },
    onSuccess: (invoice) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });

      toast.success("Invoice generated successfully", {
        description: `Invoice ${invoice.invoice_number} has been created.`,
      });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error("Failed to generate invoice", {
        error: errorMessage,
      });

      toast.error("Failed to generate invoice", {
        description: errorMessage,
      });
    },
  });

  /**
   * Check if invoice exists for payment
   *
   * Queries database to verify if an invoice already exists
   * for the given payment ID.
   *
   * @param paymentId - Payment ID to check
   * @returns Promise resolving to boolean (true if exists)
   */
  const checkInvoiceExists = useCallback(async (paymentId: string) => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("id")
        .eq("payment_id", paymentId)
        .maybeSingle();

      if (error) {
        logger.error("Error checking invoice existence", {
          error: error.message,
          payment_id: paymentId,
        });
        throw error;
      }

      return !!data;
    } catch (error) {
      logger.error("Failed to check invoice existence", {
        error: error instanceof Error ? error.message : String(error),
        payment_id: paymentId,
      });
      return false;
    }
  }, []);

  return {
    /**
     * Generate invoice for a payment
     * Returns a promise that resolves to the created invoice
     */
    generateInvoice: generateMutation.mutateAsync,

    /**
     * Check if invoice is currently being generated
     */
    isGenerating: generateMutation.isPending,

    /**
     * Check if invoice exists for payment (async function)
     */
    checkInvoiceExists,

    /**
     * Error from last generation attempt
     */
    error: generateMutation.error,
  };
}
