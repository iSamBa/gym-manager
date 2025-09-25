import jsPDF from "jspdf";
import { format } from "date-fns";
import type { SubscriptionPaymentWithReceipt } from "@/features/database/lib/types";
import type { AllPaymentsResponse } from "../hooks/use-all-payments";

type PaymentForPDF =
  | SubscriptionPaymentWithReceipt
  | AllPaymentsResponse["payments"][0];

interface OriginalPaymentForPDF {
  receipt_number: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  totalRefunded: number;
  netAmount: number;
}

interface PDFGeneratorOptions {
  payment: PaymentForPDF;
  originalPayment?: OriginalPaymentForPDF; // For refund receipts
}

export function generatePaymentReceiptPDF({
  payment,
  originalPayment,
}: PDFGeneratorOptions) {
  // Create new PDF with A4 dimensions
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // A4 dimensions in mm: 210 x 297
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let currentY = margin;

  // Helper function to safely format dates
  const formatDate = (
    dateString: string | null | undefined,
    fallback = "N/A"
  ) => {
    if (!dateString) return fallback;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return fallback;
      return format(date, "EEEE, MMMM d, yyyy");
    } catch {
      return fallback;
    }
  };

  // Header - Company Name
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Gym Management System", pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 15;

  // Receipt Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const receiptTitle = payment.is_refund ? "REFUND RECEIPT" : "PAYMENT RECEIPT";
  doc.text(receiptTitle, pageWidth / 2, currentY, { align: "center" });
  currentY += 15;

  // Draw a line under the header
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Receipt Information Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  // Receipt Number and Date on same line
  const receiptNumber = payment.receipt_number || "N/A";
  const paymentDate = formatDate(payment.payment_date);

  doc.setFont("helvetica", "bold");
  doc.text("Receipt Number:", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(receiptNumber, margin + 40, currentY);

  doc.setFont("helvetica", "bold");
  doc.text("Payment Date:", margin + 100, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(paymentDate, margin + 135, currentY);
  currentY += 10;

  // Payment Details Section
  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Payment Details", margin, currentY);
  currentY += 8;

  doc.setFontSize(12);

  // Amount
  doc.setFont("helvetica", "bold");
  doc.text("Amount Paid:", margin, currentY);
  doc.setFont("helvetica", "normal");
  const amountText = `$${(payment.amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  doc.text(amountText, margin + 50, currentY);
  currentY += 7;

  // Payment Method
  doc.setFont("helvetica", "bold");
  doc.text("Payment Method:", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(
    (payment.payment_method || "unknown").replace("_", " "),
    margin + 50,
    currentY
  );
  currentY += 7;

  // Reference Number (if available)
  if ("reference_number" in payment && payment.reference_number) {
    doc.setFont("helvetica", "bold");
    doc.text("Reference:", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(payment.reference_number, margin + 50, currentY);
    currentY += 7;
  }

  // Status
  doc.setFont("helvetica", "bold");
  doc.text("Status:", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(payment.payment_status || "unknown", margin + 50, currentY);
  currentY += 10;

  // Original Payment Information for Refunds
  if (payment.is_refund && originalPayment) {
    currentY += 5;
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Original Payment Information", margin, currentY);
    currentY += 8;

    doc.setFontSize(12);

    // Original Receipt Number
    doc.setFont("helvetica", "bold");
    doc.text("Original Receipt:", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(originalPayment.receipt_number, margin + 50, currentY);
    currentY += 7;

    // Original Amount
    doc.setFont("helvetica", "bold");
    doc.text("Original Amount:", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(`$${originalPayment.amount.toFixed(2)}`, margin + 50, currentY);
    currentY += 7;

    // Original Date
    doc.setFont("helvetica", "bold");
    doc.text("Original Date:", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(originalPayment.payment_date), margin + 50, currentY);
    currentY += 7;

    // Original Method
    doc.setFont("helvetica", "bold");
    doc.text("Original Method:", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(
      originalPayment.payment_method?.replace("_", " ") || "N/A",
      margin + 50,
      currentY
    );
    currentY += 10;

    // Total Refunded and Net Amount
    if (originalPayment.totalRefunded > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Total Refunded:", margin, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(
        `-$${originalPayment.totalRefunded.toFixed(2)}`,
        margin + 50,
        currentY
      );
      currentY += 7;

      doc.setFont("helvetica", "bold");
      doc.text("Net Amount:", margin, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(
        `$${originalPayment.netAmount.toFixed(2)}`,
        margin + 50,
        currentY
      );
      currentY += 10;
    }
  }

  // Refund Information (if this payment has refunds)
  if (
    "refund_amount" in payment &&
    payment.refund_amount &&
    payment.refund_amount > 0
  ) {
    currentY += 5;
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Refund Information", margin, currentY);
    currentY += 8;

    doc.setFontSize(12);

    // Refund Amount
    doc.setFont("helvetica", "bold");
    doc.text("Refund Amount:", margin, currentY);
    doc.setFont("helvetica", "normal");
    const refundText = `-$${(payment.refund_amount || 0).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
    doc.text(refundText, margin + 50, currentY);
    currentY += 7;

    // Refund Date
    if ("refund_date" in payment && payment.refund_date) {
      doc.setFont("helvetica", "bold");
      doc.text("Refund Date:", margin, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(payment.refund_date), margin + 50, currentY);
      currentY += 7;
    }

    // Refund Reason
    if ("refund_reason" in payment && payment.refund_reason) {
      doc.setFont("helvetica", "bold");
      doc.text("Reason:", margin, currentY);
      currentY += 5;
      doc.setFont("helvetica", "normal");

      // Handle multi-line text for refund reason
      const reasonLines = doc.splitTextToSize(
        payment.refund_reason,
        contentWidth - 20
      );
      doc.text(reasonLines, margin + 5, currentY);
      currentY += reasonLines.length * 5 + 5;
    }
  }

  // Notes (if available)
  if ("notes" in payment && payment.notes) {
    currentY += 5;
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Notes", margin, currentY);
    currentY += 8;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    // Handle multi-line text for notes
    const notesLines = doc.splitTextToSize(payment.notes, contentWidth - 10);
    doc.text(notesLines, margin + 5, currentY);
    currentY += notesLines.length * 5 + 10;
  }

  // Footer
  currentY = Math.max(currentY + 20, pageHeight - 40); // Ensure footer is at bottom or after content

  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Thank you for your payment!", pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 5;
  doc.text(
    `Generated on ${format(new Date(), "EEEE, MMMM d, yyyy")}`,
    pageWidth / 2,
    currentY,
    { align: "center" }
  );

  // Save the PDF
  const filename = `${payment.is_refund ? "refund" : "payment"}_receipt_${receiptNumber}.pdf`;
  doc.save(filename);
}
