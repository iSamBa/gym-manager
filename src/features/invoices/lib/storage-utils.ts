/**
 * Storage Utilities for Invoice Generation
 *
 * Handles Supabase Storage operations for:
 * - Fetching and converting company logo to base64
 * - Uploading generated invoice PDFs to Storage
 *
 * @module storage-utils
 */

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

/**
 * Fetch company logo from Supabase Storage and convert to base64
 *
 * Downloads the logo from business-assets bucket and converts it to base64
 * for embedding in PDF. Handles missing logos gracefully by returning null.
 *
 * @param logoUrl - Public URL of the logo from Supabase Storage
 * @returns Base64-encoded image string (with data URL prefix) or null if fetch fails
 *
 * @example
 * ```typescript
 * const logoBase64 = await fetchLogoAsBase64("https://...storage.../company-logo.png");
 * if (logoBase64) {
 *   doc.addImage(logoBase64, "PNG", 20, 20, 40, 40);
 * }
 * ```
 */
export async function fetchLogoAsBase64(
  logoUrl: string | null | undefined
): Promise<string | null> {
  if (!logoUrl) {
    logger.debug("No logo URL provided, skipping logo fetch");
    return null;
  }

  try {
    // Extract bucket and file path from Supabase Storage URL
    // URL format: https://{PROJECT_REF}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const url = new URL(logoUrl);
    const pathParts = url.pathname.split("/");

    // Find 'public' index to extract bucket and path
    const publicIndex = pathParts.indexOf("public");
    if (publicIndex === -1 || publicIndex >= pathParts.length - 1) {
      logger.warn("Invalid Supabase Storage URL format", { logoUrl });
      return null;
    }

    const bucket = pathParts[publicIndex + 1];
    const filePath = pathParts.slice(publicIndex + 2).join("/");

    logger.debug("Fetching logo from Storage", { bucket, filePath });

    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      logger.warn("Failed to fetch logo from Storage", {
        error: error.message,
        bucket,
        filePath,
      });
      return null;
    }

    if (!data) {
      logger.warn("Logo file is empty", { bucket, filePath });
      return null;
    }

    // Convert Blob to base64
    const base64 = await blobToBase64(data);

    logger.debug("Logo fetched and converted to base64 successfully", {
      size: data.size,
      type: data.type,
    });

    return base64;
  } catch (err) {
    logger.error("Unexpected error fetching logo", {
      error: err instanceof Error ? err.message : String(err),
      logoUrl,
    });
    return null;
  }
}

/**
 * Convert Blob to base64 data URL
 *
 * Helper function to convert Blob/File to base64 string with data URL prefix.
 * Used for converting downloaded logo to format suitable for PDF embedding.
 *
 * @param blob - Blob or File to convert
 * @returns Promise resolving to base64 data URL string
 *
 * @example
 * ```typescript
 * const base64 = await blobToBase64(logoBlob);
 * // Returns: "data:image/png;base64,iVBORw0KG..."
 * ```
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = () => {
      reject(new Error("FileReader error"));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload invoice PDF to Supabase Storage
 *
 * Uploads generated PDF to business-assets/invoices/YYYY/MM/ folder structure.
 * Creates folders automatically if they don't exist.
 *
 * @param pdfBlob - PDF file as Blob
 * @param invoiceNumber - Invoice number (e.g., "01052025-01")
 * @returns Public URL of uploaded PDF
 *
 * @throws Error if upload fails
 *
 * @example
 * ```typescript
 * const pdfUrl = await uploadInvoicePDF(pdfBlob, "01052025-01");
 * // Returns: "https://...storage.../business-assets/invoices/2025/05/INV-01052025-01.pdf"
 * ```
 */
export async function uploadInvoicePDF(
  pdfBlob: Blob,
  invoiceNumber: string
): Promise<string> {
  try {
    // Extract date from invoice number (format: DDMMYYYY-XX)
    const dateMatch = invoiceNumber.match(/^(\d{2})(\d{2})(\d{4})-\d{2}$/);
    if (!dateMatch) {
      throw new Error(`Invalid invoice number format: ${invoiceNumber}`);
    }

    const [, , month, year] = dateMatch;

    // Construct file path: invoices/YYYY/MM/INV-{invoiceNumber}.pdf
    const filePath = `invoices/${year}/${month}/INV-${invoiceNumber}.pdf`;

    logger.debug("Uploading invoice PDF to Storage", { filePath });

    // Upload file to business-assets bucket
    const { error: uploadError } = await supabase.storage
      .from("business-assets")
      .upload(filePath, pdfBlob, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false, // Don't overwrite existing invoices
      });

    if (uploadError) {
      logger.error("Failed to upload invoice PDF", {
        error: uploadError.message,
        filePath,
      });
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("business-assets").getPublicUrl(filePath);

    logger.info("Invoice PDF uploaded successfully", {
      filePath,
      publicUrl,
      size: pdfBlob.size,
    });

    return publicUrl;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error during upload";
    logger.error("Failed to upload invoice PDF", {
      error: errorMessage,
      invoiceNumber,
    });
    throw new Error(`Failed to upload invoice PDF: ${errorMessage}`);
  }
}

/**
 * Delete invoice PDF from Supabase Storage
 *
 * Removes invoice PDF from Storage. Useful for cleanup or regeneration scenarios.
 *
 * @param pdfUrl - Public URL of the PDF to delete
 * @returns True if deletion successful, false otherwise
 *
 * @example
 * ```typescript
 * const deleted = await deleteInvoicePDF("https://...storage.../invoices/2025/05/INV-01052025-01.pdf");
 * ```
 */
export async function deleteInvoicePDF(pdfUrl: string): Promise<boolean> {
  try {
    // Extract bucket and file path from URL
    const url = new URL(pdfUrl);
    const pathParts = url.pathname.split("/");
    const publicIndex = pathParts.indexOf("public");

    if (publicIndex === -1 || publicIndex >= pathParts.length - 1) {
      logger.warn("Invalid PDF URL format for deletion", { pdfUrl });
      return false;
    }

    const bucket = pathParts[publicIndex + 1];
    const filePath = pathParts.slice(publicIndex + 2).join("/");

    logger.debug("Deleting invoice PDF from Storage", { bucket, filePath });

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      logger.warn("Failed to delete invoice PDF", {
        error: error.message,
        filePath,
      });
      return false;
    }

    logger.info("Invoice PDF deleted successfully", { filePath });
    return true;
  } catch (err) {
    logger.error("Unexpected error deleting invoice PDF", {
      error: err instanceof Error ? err.message : String(err),
      pdfUrl,
    });
    return false;
  }
}
