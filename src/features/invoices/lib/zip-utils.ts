/**
 * ZIP Utilities for Bulk Invoice Download
 *
 * Provides functions for creating ZIP archives of invoice PDFs and triggering downloads.
 * JSZip is dynamically imported for bundle optimization.
 */

import type { BulkOperationProgress } from "@/features/members/components/BulkActionToolbar";

/**
 * Creates a ZIP archive from multiple invoice PDF blobs
 *
 * @param invoices - Array of invoice blobs with filenames
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to ZIP blob
 *
 * @example
 * ```typescript
 * const invoices = [
 *   { blob: pdfBlob1, filename: 'invoice-001.pdf' },
 *   { blob: pdfBlob2, filename: 'invoice-002.pdf' },
 * ];
 * const zipBlob = await createInvoiceZip(invoices, (progress) => {
 *   console.log(`${progress.percentage}% complete`);
 * });
 * ```
 */
export async function createInvoiceZip(
  invoices: Array<{ blob: Blob; filename: string }>,
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<Blob> {
  // Dynamic import for bundle optimization (~100 KB saved from initial bundle)
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  // Add each invoice to ZIP
  invoices.forEach((invoice, index) => {
    zip.file(invoice.filename, invoice.blob);

    // Report progress after each file added
    if (onProgress) {
      onProgress({
        current: index + 1,
        total: invoices.length,
        percentage: ((index + 1) / invoices.length) * 100,
      });
    }
  });

  // Generate ZIP blob with compression
  return await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6, // Balance between compression ratio and speed
    },
  });
}

/**
 * Triggers a browser download for a blob
 *
 * @param blob - The blob to download
 * @param filename - The filename for the download
 *
 * @example
 * ```typescript
 * const zipBlob = await createInvoiceZip(invoices);
 * downloadBlob(zipBlob, 'invoices-2025-01-18-10.zip');
 * ```
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Cleanup to prevent memory leaks
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Generates a standardized ZIP filename with current date and invoice count
 *
 * @param count - Number of invoices in the ZIP
 * @returns Filename in format: invoices-YYYY-MM-DD-{count}.zip
 *
 * @example
 * ```typescript
 * generateZipFilename(10); // "invoices-2025-01-18-10.zip"
 * ```
 */
export function generateZipFilename(count: number): string {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `invoices-${date}-${count}.zip`;
}
