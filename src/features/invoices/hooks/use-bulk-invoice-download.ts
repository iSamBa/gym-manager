/**
 * Hook for Bulk Invoice Download
 *
 * Provides functionality to download multiple existing invoices as a ZIP file.
 * Assumes all invoices are already generated (no generation logic included).
 *
 * Features:
 * - Batch processing to prevent browser overload
 * - Progress tracking for UX feedback
 * - Individual error handling (failures don't stop the process)
 * - Comprehensive result reporting
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import type { BulkOperationResult } from "@/features/members/hooks";
import type { BulkOperationProgress } from "@/features/members/components/BulkActionToolbar";
import {
  createInvoiceZip,
  downloadBlob,
  generateZipFilename,
} from "../lib/zip-utils";

/**
 * Invoice data required for bulk download
 */
export interface InvoiceData {
  paymentId: string;
  receiptNumber: string;
}

/**
 * Return type for the bulk invoice download hook
 */
export interface UseBulkInvoiceDownloadReturn {
  /**
   * Function to initiate bulk invoice download
   * @param payments - Array of payment data to download invoices for
   * @returns Promise resolving to operation result
   */
  downloadInvoices: (payments: InvoiceData[]) => Promise<BulkOperationResult>;

  /**
   * Whether the download process is currently running
   */
  isProcessing: boolean;

  /**
   * Current progress information (null when not processing)
   */
  progress: BulkOperationProgress | null;
}

/**
 * Hook for downloading multiple invoices as a ZIP file
 *
 * @returns Object containing download function and state
 *
 * @example
 * ```typescript
 * const { downloadInvoices, isProcessing, progress } = useBulkInvoiceDownload();
 *
 * const handleBulkDownload = async () => {
 *   const payments = selectedPayments.map(p => ({
 *     paymentId: p.id,
 *     receiptNumber: p.receipt_number,
 *   }));
 *
 *   const result = await downloadInvoices(payments);
 *   console.log(`Downloaded ${result.totalSuccessful} invoices`);
 * };
 * ```
 */
export function useBulkInvoiceDownload(): UseBulkInvoiceDownloadReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkOperationProgress | null>(null);

  const downloadInvoices = useCallback(
    async (payments: InvoiceData[]): Promise<BulkOperationResult> => {
      setIsProcessing(true);
      setProgress({ current: 0, total: payments.length, percentage: 0 });

      const successful: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];
      const invoiceBlobs: Array<{ blob: Blob; filename: string }> = [];

      try {
        // Process in batches to prevent overwhelming the browser
        const batchSize = 10;
        const totalBatches = Math.ceil(payments.length / batchSize);

        for (let i = 0; i < payments.length; i += batchSize) {
          const batch = payments.slice(i, i + batchSize);
          const currentBatch = Math.floor(i / batchSize) + 1;

          // Process batch in parallel
          await Promise.all(
            batch.map(async (payment) => {
              try {
                // Fetch existing invoice from database
                const { data: invoice, error: dbError } = await supabase
                  .from("invoices")
                  .select("id, pdf_url, invoice_number")
                  .eq("payment_id", payment.paymentId)
                  .maybeSingle();

                // Handle missing invoice
                if (!invoice || !invoice.pdf_url) {
                  throw new Error(
                    dbError
                      ? `Database error: ${dbError.message}`
                      : "Invoice not found. Please ensure all invoices are generated."
                  );
                }

                // Fetch PDF blob from storage
                const response = await fetch(invoice.pdf_url);
                if (!response.ok) {
                  throw new Error(
                    `Failed to fetch PDF (${response.status}): ${response.statusText}`
                  );
                }

                const blob = await response.blob();

                // Verify blob is a PDF
                if (
                  !blob.type.includes("pdf") &&
                  blob.type !== "application/octet-stream"
                ) {
                  throw new Error(
                    `Invalid file type: ${blob.type}. Expected PDF.`
                  );
                }

                // Add to collection
                invoiceBlobs.push({
                  blob,
                  filename: `invoice-${invoice.invoice_number}.pdf`,
                });

                successful.push(payment.paymentId);
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : "Unknown error";
                failed.push({ id: payment.paymentId, error: errorMessage });
              }
            })
          );

          // Update progress after each batch
          const processed = Math.min(i + batchSize, payments.length);
          setProgress({
            current: processed,
            total: payments.length,
            percentage: (processed / payments.length) * 100,
            currentBatch,
            totalBatches,
          });
        }

        // Create ZIP and trigger download if we have any successful invoices
        if (invoiceBlobs.length > 0) {
          const zipBlob = await createInvoiceZip(invoiceBlobs);
          const filename = generateZipFilename(invoiceBlobs.length);
          downloadBlob(zipBlob, filename);

          toast.success(
            `Downloaded ${successful.length} invoice${successful.length === 1 ? "" : "s"}`
          );
        }

        // Notify about failures
        if (failed.length > 0) {
          toast.error(
            `Failed to download ${failed.length} invoice${failed.length === 1 ? "" : "s"}`,
            {
              description: "Check the results for details",
            }
          );
        }

        // No successful downloads at all
        if (invoiceBlobs.length === 0) {
          toast.error("No invoices could be downloaded", {
            description: "Please check that all invoices exist",
          });
        }

        return {
          successful,
          failed,
          totalProcessed: payments.length,
          totalSuccessful: successful.length,
          totalFailed: failed.length,
        };
      } catch (error) {
        // Critical error that stops the entire process
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to download invoices", {
          description: errorMessage,
        });
        throw error;
      } finally {
        setIsProcessing(false);
        setProgress(null);
      }
    },
    []
  );

  return {
    downloadInvoices,
    isProcessing,
    progress,
  };
}
