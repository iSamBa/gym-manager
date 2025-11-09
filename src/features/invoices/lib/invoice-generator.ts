/**
 * Invoice PDF Generator
 *
 * Generates professional A4-format invoice PDFs with:
 * - Company logo and business information
 * - Invoice number and date
 * - Customer details
 * - Tax breakdown table (HT/TVA/TTC)
 * - Amount in French words
 * - Footer notes
 *
 * Uses dynamic import for jsPDF to optimize bundle size.
 *
 * @module invoice-generator
 */

import { logger } from "@/lib/logger";
import { formatInvoiceAmount } from "./amount-to-words";
import { fetchLogoAsBase64 } from "./storage-utils";
import type {
  Invoice,
  GeneralSettings,
  InvoiceSettings,
} from "@/features/database/lib/types";

/**
 * Format currency for display
 *
 * @param amount - Amount to format
 * @returns Formatted amount (e.g., "7 200,00 MAD")
 */
function formatCurrency(amount: number): string {
  const formatted = amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // Replace non-breaking space (U+00A0) with regular space for PDF compatibility
  // fr-FR locale uses non-breaking space as thousand separator, which renders as "/" in jsPDF
  return `${formatted.replace(/\u00A0/g, " ")} MAD`;
}

/**
 * Format date for display
 *
 * @param dateString - Date string (YYYY-MM-DD)
 * @returns Formatted date (DD/MM/YYYY)
 */
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Generate invoice PDF
 *
 * Creates A4-format PDF with professional invoice layout matching
 * Moroccan accounting standards.
 *
 * Layout:
 * - Header: Logo (left) + Business info (right)
 * - Title: "Facture" centered with invoice number and date
 * - Customer: Member name
 * - Table: Subscription amount breakdown (HT/TVA/TTC)
 * - Amount in words (French)
 * - Footer: Optional custom notes
 *
 * @param invoice - Invoice data with tax calculations
 * @param member - Member details (name, email)
 * @param generalSettings - Business information and logo
 * @param invoiceSettings - Invoice configuration (VAT rate, footer)
 * @returns Promise resolving to PDF Blob
 *
 * @example
 * ```typescript
 * const pdfBlob = await generateInvoicePDF(
 *   invoice,
 *   { first_name: "John", last_name: "Doe" },
 *   generalSettings,
 *   invoiceSettings
 * );
 * ```
 */
export async function generateInvoicePDF(
  invoice: Invoice,
  member: { first_name: string; last_name: string },
  generalSettings: GeneralSettings,
  invoiceSettings: InvoiceSettings | null
): Promise<Blob> {
  try {
    logger.debug("Starting PDF generation", {
      invoice_number: invoice.invoice_number,
      member: `${member.first_name} ${member.last_name}`,
    });

    // Dynamic import for bundle optimization (CRITICAL for performance)
    // Import jsPDF using named export (works in browser/Next.js runtime)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { jsPDF } = (await import("jspdf")) as any;
    // Import autotable as default export (v5.x uses default export)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autoTable = (await import("jspdf-autotable")).default as any;

    // Create A4 PDF in portrait mode
    const doc = new jsPDF({
      format: "a4",
      unit: "mm",
    });

    // A4 dimensions: 210mm × 297mm
    const pageWidth = 210;
    const margin = 20;

    // ========================================
    // HEADER SECTION (Logo + Business Info)
    // ========================================

    let currentY = 20;

    // Add company logo (top-left) if available
    if (generalSettings.logo_url) {
      try {
        const logoBase64 = await fetchLogoAsBase64(generalSettings.logo_url);
        if (logoBase64) {
          // Logo: 40mm x 40mm square at (20, 20)
          doc.addImage(logoBase64, "PNG", margin, currentY, 40, 40);
          logger.debug("Logo added to PDF");
        }
      } catch (error) {
        logger.warn("Failed to add logo to PDF", {
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue without logo
      }
    }

    // Business info (top-right)
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const rightX = pageWidth - margin;
    doc.text(generalSettings.business_name, rightX, currentY + 5, {
      align: "right",
    });
    doc.text(generalSettings.business_address.street, rightX, currentY + 11, {
      align: "right",
    });
    doc.text(
      `${generalSettings.business_address.city} ${generalSettings.business_address.postal_code}`,
      rightX,
      currentY + 17,
      { align: "right" }
    );
    doc.text(`ICE: ${generalSettings.tax_id}`, rightX, currentY + 23, {
      align: "right",
    });

    if (generalSettings.phone) {
      doc.text(`Tél: ${generalSettings.phone}`, rightX, currentY + 29, {
        align: "right",
      });
    }

    if (generalSettings.email) {
      doc.text(`Email: ${generalSettings.email}`, rightX, currentY + 35, {
        align: "right",
      });
    }

    currentY = 80; // Add more space after logo and company details

    // ========================================
    // INVOICE HEADER (Title, Number, Date)
    // ========================================

    // Invoice title and number on same line, aligned right
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Facture N° ${invoice.invoice_number}`,
      pageWidth - margin,
      currentY,
      { align: "right" }
    );

    currentY += 10; // Bit of space before date

    // Invoice date - aligned right
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Date: ${formatDate(invoice.issue_date)}`,
      pageWidth - margin,
      currentY,
      { align: "right" }
    );

    currentY += 20; // More space after date

    // ========================================
    // CUSTOMER SECTION
    // ========================================

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold"); // Make client name bold
    doc.text(
      `Client(e): ${member.first_name} ${member.last_name}`,
      margin,
      currentY
    );

    currentY += 12;

    // ========================================
    // INVOICE TABLE (HT/TVA/TTC)
    // ========================================

    // Use autoTable for professional table formatting
    // In jspdf-autotable v5.x, autoTable is a standalone function
    autoTable(doc, {
      startY: currentY,
      head: [["Description", "Montant (MAD)"]],
      body: [
        ["Abonnement (HT)", formatCurrency(invoice.amount)],
        [
          `TVA (${invoiceSettings?.vat_rate || invoice.vat_rate || 20}%)`,
          formatCurrency(invoice.tax_amount),
        ],
        ["Total (TTC)", formatCurrency(invoice.total_amount)],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255], // White background (no color)
        textColor: [0, 0, 0], // Black text
        fontStyle: "bold", // Bold header text
        lineWidth: 0.1, // Border thickness for header cells
        lineColor: [0, 0, 0], // Black borders between header cells
      },
      columnStyles: {
        0: { cellWidth: 120 }, // Description column width
        1: { halign: "right", cellWidth: 50 }, // Amount column - right-aligned with fixed width
      },
      margin: { left: margin, right: margin },
    });

    // Get Y position after table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalTableY = (doc as any).lastAutoTable?.finalY || currentY + 40;

    currentY = finalTableY + 10;

    // ========================================
    // AMOUNT IN WORDS
    // ========================================

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(
      "La présente facture est arrêtée à la somme de:",
      margin,
      currentY
    );

    currentY += 7;

    doc.setFont("helvetica", "normal");
    const amountInWords = formatInvoiceAmount(invoice.total_amount);
    doc.text(amountInWords, margin, currentY);

    currentY += 15;

    // ========================================
    // FOOTER NOTES (Optional)
    // ========================================

    if (invoiceSettings?.invoice_footer_notes || invoice.footer_notes) {
      const footerNotes =
        invoiceSettings?.invoice_footer_notes || invoice.footer_notes || "";

      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");

      // Split long notes into multiple lines (max 170mm width)
      const splitNotes = doc.splitTextToSize(
        footerNotes,
        pageWidth - 2 * margin
      );

      doc.text(splitNotes, margin, currentY);
    }

    // ========================================
    // GENERATE BLOB
    // ========================================

    const pdfBlob = doc.output("blob");

    logger.info("Invoice PDF generated successfully", {
      invoice_number: invoice.invoice_number,
      size: pdfBlob.size,
    });

    return pdfBlob;
  } catch (error) {
    logger.error("Failed to generate invoice PDF", {
      error: error instanceof Error ? error.message : String(error),
      invoice_number: invoice.invoice_number,
    });
    throw new Error(
      `Failed to generate invoice PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Complete invoice generation workflow
 *
 * Orchestrates the full invoice generation process:
 * 1. Create invoice record in database
 * 2. Generate PDF
 * 3. Upload PDF to Storage
 * 4. Update invoice record with PDF URL
 *
 * This is the main entry point for invoice generation.
 *
 * @param input - Invoice creation parameters
 * @returns Created invoice with PDF URL
 *
 * @example
 * ```typescript
 * import { createInvoice } from "./invoice-generator";
 *
 * const invoice = await createInvoice({
 *   payment_id: "pay_123",
 *   member_id: "mem_456",
 *   subscription_id: "sub_789",
 *   amount: 7200
 * });
 * // Invoice record created with PDF generated and uploaded
 * ```
 */
export async function createInvoice(input: {
  payment_id: string;
  member_id: string;
  subscription_id?: string;
  amount: number;
}): Promise<Invoice> {
  const {
    createInvoiceRecord,
    fetchGeneralSettings,
    fetchInvoiceSettings,
    fetchMemberForInvoice,
    updateInvoicePdfUrl,
  } = await import("./invoice-utils");
  const { uploadInvoicePDF } = await import("./storage-utils");

  try {
    logger.info("Starting complete invoice generation workflow", {
      payment_id: input.payment_id,
      member_id: input.member_id,
      amount: input.amount,
    });

    // 1. Create invoice record (with tax calculations and invoice number)
    const invoice = await createInvoiceRecord(input);

    // 2. Fetch required data for PDF generation
    const [member, generalSettings, invoiceSettings] = await Promise.all([
      fetchMemberForInvoice(input.member_id),
      fetchGeneralSettings(),
      fetchInvoiceSettings(),
    ]);

    if (!generalSettings) {
      throw new Error("General settings not configured");
    }

    // 3. Generate PDF
    const pdfBlob = await generateInvoicePDF(
      invoice,
      member,
      generalSettings,
      invoiceSettings
    );

    // 4. Upload PDF to Storage
    const pdfUrl = await uploadInvoicePDF(pdfBlob, invoice.invoice_number);

    // 5. Update invoice record with PDF URL
    await updateInvoicePdfUrl(invoice.id, pdfUrl);

    logger.info("Invoice generation workflow completed successfully", {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      pdf_url: pdfUrl,
    });

    return {
      ...invoice,
      pdf_url: pdfUrl,
    };
  } catch (error) {
    logger.error("Invoice generation workflow failed", {
      error: error instanceof Error ? error.message : String(error),
      payment_id: input.payment_id,
    });
    throw error;
  }
}
