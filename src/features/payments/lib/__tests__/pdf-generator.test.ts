import { describe, it, expect, vi, beforeEach } from "vitest";
import { generatePaymentReceiptPDF } from "../pdf-generator";

// Mock jsPDF
const mockSave = vi.fn();
const mockText = vi.fn();
const mockLine = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetFont = vi.fn();
const mockSetLineWidth = vi.fn();
const mockSplitTextToSize = vi.fn();

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(() => ({
    save: mockSave,
    text: mockText,
    line: mockLine,
    setFontSize: mockSetFontSize,
    setFont: mockSetFont,
    setLineWidth: mockSetLineWidth,
    splitTextToSize: mockSplitTextToSize,
  })),
}));

const mockPayment = {
  receipt_number: "PAY-001",
  payment_date: "2024-01-15T10:00:00Z",
  amount: 100.5,
  payment_method: "credit_card",
  payment_status: "completed",
  is_refund: false,
};

const mockRefundPayment = {
  receipt_number: "REF-001",
  payment_date: "2024-01-16T10:00:00Z",
  amount: 50.25,
  payment_method: "refund",
  payment_status: "completed",
  is_refund: true,
  refunded_payment_id: "pay-123",
};

const mockOriginalPayment = {
  receipt_number: "PAY-123",
  amount: 100.0,
  payment_date: "2024-01-10T10:00:00Z",
  payment_method: "credit_card",
  totalRefunded: 50.25,
  netAmount: 49.75,
};

describe("PDF Generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSplitTextToSize.mockReturnValue(["Line 1", "Line 2"]);
  });

  describe("generatePaymentReceiptPDF", () => {
    it("should generate PDF for regular payment", () => {
      generatePaymentReceiptPDF({ payment: mockPayment });

      expect(mockSave).toHaveBeenCalledWith("payment_receipt_PAY-001.pdf");
      expect(mockText).toHaveBeenCalledWith(
        "PAYMENT RECEIPT",
        expect.any(Number),
        expect.any(Number),
        { align: "center" }
      );
      expect(mockText).toHaveBeenCalledWith(
        "PAY-001",
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockText).toHaveBeenCalledWith(
        "$100.50",
        expect.any(Number),
        expect.any(Number)
      );
    });

    it("should generate PDF for refund with original payment", () => {
      generatePaymentReceiptPDF({
        payment: mockRefundPayment,
        originalPayment: mockOriginalPayment,
      });

      expect(mockSave).toHaveBeenCalledWith("refund_receipt_REF-001.pdf");
      expect(mockText).toHaveBeenCalledWith(
        "REFUND RECEIPT",
        expect.any(Number),
        expect.any(Number),
        { align: "center" }
      );
      expect(mockText).toHaveBeenCalledWith(
        "REF-001",
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockText).toHaveBeenCalledWith(
        "PAY-123",
        expect.any(Number),
        expect.any(Number)
      ); // Original receipt
    });

    it("should handle payment with notes", () => {
      const paymentWithNotes = {
        ...mockPayment,
        notes: "This is a test payment with notes",
      };

      generatePaymentReceiptPDF({ payment: paymentWithNotes });

      expect(mockSplitTextToSize).toHaveBeenCalledWith(
        "This is a test payment with notes",
        expect.any(Number)
      );
      expect(mockText).toHaveBeenCalledWith(
        ["Line 1", "Line 2"],
        expect.any(Number),
        expect.any(Number)
      );
    });

    it("should format amounts correctly", () => {
      const paymentWithLargeAmount = {
        ...mockPayment,
        amount: 1234.56,
      };

      generatePaymentReceiptPDF({ payment: paymentWithLargeAmount });

      expect(mockText).toHaveBeenCalledWith(
        "$1,234.56",
        expect.any(Number),
        expect.any(Number)
      );
    });

    it("should handle missing receipt number gracefully", () => {
      const paymentWithoutReceipt = {
        ...mockPayment,
        receipt_number: null,
      };

      // @ts-expect-error - Testing null receipt number
      generatePaymentReceiptPDF({ payment: paymentWithoutReceipt });

      expect(mockText).toHaveBeenCalledWith(
        "N/A",
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockSave).toHaveBeenCalledWith("payment_receipt_N/A.pdf");
    });

    it("should create PDF successfully without errors", () => {
      expect(() => {
        generatePaymentReceiptPDF({ payment: mockPayment });
      }).not.toThrow();

      expect(mockSave).toHaveBeenCalled();
      expect(mockText).toHaveBeenCalled();
      expect(mockSetFontSize).toHaveBeenCalled();
    });
  });
});
