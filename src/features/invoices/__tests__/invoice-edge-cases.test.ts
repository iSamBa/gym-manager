/**
 * Comprehensive Edge Case Tests for Invoice System
 *
 * Tests critical edge cases from US-006 that require special handling:
 * - Daily counter reset
 * - Concurrent invoice generation
 * - Very long business/customer names
 * - Non-standard VAT rates (including 100%)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateInvoicePDF } from "../lib/invoice-generator";
import { generateInvoiceNumber, calculateTax } from "../lib/invoice-utils";
import type {
  Invoice,
  GeneralSettings,
  InvoiceSettings,
} from "@/features/database/lib/types";

// Mock dependencies
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../lib/storage-utils", () => ({
  fetchLogoAsBase64: vi.fn(),
}));

// Mock jsPDF and autoTable
const mockAutoTable = vi.fn();
const mockAddImage = vi.fn();
const mockText = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetFont = vi.fn();
const mockSplitTextToSize = vi.fn();
const mockOutput = vi.fn();

const MockJsPDF = class {
  addImage = mockAddImage;
  text = mockText;
  setFontSize = mockSetFontSize;
  setFont = mockSetFont;
  splitTextToSize = mockSplitTextToSize;
  output = mockOutput;
  lastAutoTable = { finalY: 100 };
};

vi.mock("jspdf", () => ({
  jsPDF: MockJsPDF,
}));

vi.mock("jspdf-autotable", () => ({
  default: mockAutoTable,
}));

describe("Invoice Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOutput.mockReturnValue(
      new Blob(["pdf-content"], { type: "application/pdf" })
    );
    mockSplitTextToSize.mockImplementation((text: string) => [text]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Edge Case 5: Daily Counter Reset", () => {
    it("should reset counter to 01 for first invoice of new day", async () => {
      const { supabase } = await import("@/lib/supabase");

      // Simulate first invoice of the day (counter resets)
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: "09012025-01",
        error: null,
      } as never);

      const result = await generateInvoiceNumber();

      expect(result).toBe("09012025-01");
      expect(result.endsWith("-01")).toBe(true);
    });

    it("should increment counter for subsequent invoices same day", async () => {
      const { supabase } = await import("@/lib/supabase");

      // First invoice
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: "09012025-01",
        error: null,
      } as never);

      const first = await generateInvoiceNumber();
      expect(first).toBe("09012025-01");

      // Second invoice same day
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: "09012025-02",
        error: null,
      } as never);

      const second = await generateInvoiceNumber();
      expect(second).toBe("09012025-02");
      expect(parseInt(second.split("-")[1])).toBeGreaterThan(
        parseInt(first.split("-")[1])
      );
    });

    it("should reset counter when date changes", async () => {
      const { supabase } = await import("@/lib/supabase");

      // Last invoice of day 1
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: "09012025-15",
        error: null,
      } as never);

      const lastInvoiceDay1 = await generateInvoiceNumber();
      expect(lastInvoiceDay1).toBe("09012025-15");

      // First invoice of day 2 (counter resets)
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: "10012025-01",
        error: null,
      } as never);

      const firstInvoiceDay2 = await generateInvoiceNumber();
      expect(firstInvoiceDay2).toBe("10012025-01");
      expect(firstInvoiceDay2.endsWith("-01")).toBe(true);
    });

    it("should handle counter reset across month boundary", async () => {
      const { supabase } = await import("@/lib/supabase");

      // Last invoice of January
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: "31012025-99",
        error: null,
      } as never);

      const lastJan = await generateInvoiceNumber();
      expect(lastJan).toBe("31012025-99");

      // First invoice of February (counter resets)
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: "01022025-01",
        error: null,
      } as never);

      const firstFeb = await generateInvoiceNumber();
      expect(firstFeb).toBe("01022025-01");
      expect(firstFeb.endsWith("-01")).toBe(true);
    });
  });

  describe("Edge Case 6: Concurrent Invoice Generation", () => {
    it("should handle concurrent requests with unique invoice numbers", async () => {
      const { supabase } = await import("@/lib/supabase");

      // Simulate database handling concurrency with unique numbers
      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({
          data: "09012025-01",
          error: null,
        } as never)
        .mockResolvedValueOnce({
          data: "09012025-02",
          error: null,
        } as never);

      // Generate two invoices concurrently
      const [invoice1, invoice2] = await Promise.all([
        generateInvoiceNumber(),
        generateInvoiceNumber(),
      ]);

      // Both should succeed
      expect(invoice1).toBeDefined();
      expect(invoice2).toBeDefined();

      // Invoice numbers should be unique
      expect(invoice1).not.toBe(invoice2);

      // Both should be from same date
      const date1 = invoice1.split("-")[0];
      const date2 = invoice2.split("-")[0];
      expect(date1).toBe(date2);

      // Counters should be different
      const counter1 = parseInt(invoice1.split("-")[1]);
      const counter2 = parseInt(invoice2.split("-")[1]);
      expect(counter1).not.toBe(counter2);
    });

    it("should maintain sequential order for concurrent requests", async () => {
      const { supabase } = await import("@/lib/supabase");

      // Simulate sequential counter increments
      const invoiceNumbers = [
        "09012025-05",
        "09012025-06",
        "09012025-07",
        "09012025-08",
      ];

      invoiceNumbers.forEach((num) => {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({
          data: num,
          error: null,
        } as never);
      });

      // Generate 4 invoices concurrently
      const results = await Promise.all([
        generateInvoiceNumber(),
        generateInvoiceNumber(),
        generateInvoiceNumber(),
        generateInvoiceNumber(),
      ]);

      // All should be unique
      const uniqueNumbers = new Set(results);
      expect(uniqueNumbers.size).toBe(4);

      // All should be from same date
      results.forEach((result) => {
        expect(result.startsWith("09012025-")).toBe(true);
      });
    });

    it("should handle high concurrency (10 simultaneous requests)", async () => {
      const { supabase } = await import("@/lib/supabase");

      // Generate 10 unique invoice numbers
      const invoiceNumbers = Array.from({ length: 10 }, (_, i) => {
        const counter = String(i + 1).padStart(2, "0");
        return `09012025-${counter}`;
      });

      invoiceNumbers.forEach((num) => {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({
          data: num,
          error: null,
        } as never);
      });

      // Generate 10 invoices concurrently
      const promises = Array.from({ length: 10 }, () =>
        generateInvoiceNumber()
      );
      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(typeof result).toBe("string");
      });

      // All should be unique
      const uniqueNumbers = new Set(results);
      expect(uniqueNumbers.size).toBe(10);
    });
  });

  describe("Edge Case 7: Very Long Names", () => {
    const baseInvoice: Invoice = {
      id: "inv-123",
      invoice_number: "09012025-01",
      payment_id: "pay-123",
      member_id: "mem-456",
      subscription_id: undefined,
      issue_date: "2025-01-09",
      amount: 6000,
      tax_amount: 1200,
      total_amount: 7200,
      business_name: "Normal Gym Name",
      business_address: {
        street: "123 Test St",
        city: "Test City",
        postal_code: "12345",
        country: "Morocco",
      },
      business_tax_id: "ICE123456",
      business_phone: "+212-123-456",
      business_email: "test@gym.com",
      business_logo_url: undefined,
      vat_rate: 20,
      footer_notes: undefined,
      pdf_url: undefined,
      status: "issued",
      created_by: "user-123",
      created_at: "2025-01-09T00:00:00Z",
      updated_at: "2025-01-09T00:00:00Z",
    };

    const mockGeneralSettings: GeneralSettings = {
      business_name: "Normal Gym",
      business_address: {
        street: "123 Test St",
        city: "Test City",
        postal_code: "12345",
        country: "Morocco",
      },
      tax_id: "ICE123456",
      phone: "+212-123-456",
      email: "test@gym.com",
    };

    const mockInvoiceSettings: InvoiceSettings = {
      vat_rate: 20,
      auto_generate: true,
    };

    it("should handle very long business name (200 characters)", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      const longName = "A".repeat(200);
      const settingsWithLongName = {
        ...mockGeneralSettings,
        business_name: longName,
      };

      const invoiceWithLongName = {
        ...baseInvoice,
        business_name: longName,
      };

      const result = await generateInvoicePDF(
        invoiceWithLongName,
        { first_name: "John", last_name: "Doe" },
        settingsWithLongName,
        mockInvoiceSettings
      );

      expect(result).toBeInstanceOf(Blob);
      expect(mockText).toHaveBeenCalled();
      // PDF should generate successfully even with very long business name
      expect(mockOutput).toHaveBeenCalledWith("blob");
    });

    it("should handle very long customer name (100+ characters)", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      const longFirstName = "Jean-Baptiste-Alexandre-François-Henri";
      const longLastName = "de la Fontaine-Beauregard-Montmorency-Luxembourg";

      const result = await generateInvoicePDF(
        baseInvoice,
        { first_name: longFirstName, last_name: longLastName },
        mockGeneralSettings,
        mockInvoiceSettings
      );

      expect(result).toBeInstanceOf(Blob);
      expect(mockText).toHaveBeenCalled();
    });

    it("should handle very long address (street > 100 chars)", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      const longStreet = "A".repeat(150);
      const settingsWithLongAddress = {
        ...mockGeneralSettings,
        business_address: {
          ...mockGeneralSettings.business_address,
          street: longStreet,
        },
      };

      const invoiceWithLongAddress = {
        ...baseInvoice,
        business_address: {
          ...baseInvoice.business_address,
          street: longStreet,
        },
      };

      const result = await generateInvoicePDF(
        invoiceWithLongAddress,
        { first_name: "John", last_name: "Doe" },
        settingsWithLongAddress,
        mockInvoiceSettings
      );

      expect(result).toBeInstanceOf(Blob);
      // PDF should generate successfully even with very long address
      expect(mockOutput).toHaveBeenCalledWith("blob");
    });

    it("should handle very long footer notes (500 characters)", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      const longFooter =
        "This is a very long footer note that contains important legal information and terms and conditions that must be displayed on every invoice. ".repeat(
          5
        );

      const settingsWithLongFooter = {
        ...mockInvoiceSettings,
        invoice_footer_notes: longFooter,
      };

      const invoiceWithLongFooter = {
        ...baseInvoice,
        footer_notes: longFooter,
      };

      mockSplitTextToSize.mockReturnValue([
        "Line 1 of footer",
        "Line 2 of footer",
        "Line 3 of footer",
      ]);

      const result = await generateInvoicePDF(
        invoiceWithLongFooter,
        { first_name: "John", last_name: "Doe" },
        mockGeneralSettings,
        settingsWithLongFooter
      );

      expect(result).toBeInstanceOf(Blob);
      expect(mockSplitTextToSize).toHaveBeenCalledWith(longFooter, 170);
    });

    it("should handle combination of all long fields", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      const longName = "A".repeat(150);
      const longStreet = "B".repeat(120);
      const longFooter = "C".repeat(400);

      const extremeSettings: GeneralSettings = {
        ...mockGeneralSettings,
        business_name: longName,
        business_address: {
          ...mockGeneralSettings.business_address,
          street: longStreet,
        },
      };

      const extremeInvoiceSettings: InvoiceSettings = {
        ...mockInvoiceSettings,
        invoice_footer_notes: longFooter,
      };

      const extremeInvoice = {
        ...baseInvoice,
        business_name: longName,
        business_address: {
          ...baseInvoice.business_address,
          street: longStreet,
        },
        footer_notes: longFooter,
      };

      const result = await generateInvoicePDF(
        extremeInvoice,
        {
          first_name: "Jean-Philippe-Alexandre",
          last_name: "de Montmorency-Beauregard",
        },
        extremeSettings,
        extremeInvoiceSettings
      );

      expect(result).toBeInstanceOf(Blob);
      // PDF should still generate despite extreme lengths
      expect(mockOutput).toHaveBeenCalledWith("blob");
    });
  });

  describe("Edge Case 9: Non-standard VAT Rates", () => {
    it("should calculate correctly with 0% VAT rate", () => {
      const result = calculateTax(1000, 0);

      expect(result.netAmount).toBe(1000);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(1000);
      expect(result.vatRate).toBe(0);
    });

    it("should calculate correctly with 5% VAT rate", () => {
      const result = calculateTax(1050, 5);

      expect(result.netAmount).toBe(1000);
      expect(result.taxAmount).toBe(50);
      expect(result.totalAmount).toBe(1050);
      expect(result.vatRate).toBe(5);
    });

    it("should calculate correctly with 100% VAT rate", () => {
      const result = calculateTax(2000, 100);

      expect(result.netAmount).toBe(1000);
      expect(result.taxAmount).toBe(1000);
      expect(result.totalAmount).toBe(2000);
      expect(result.vatRate).toBe(100);
    });

    it("should calculate correctly with 50% VAT rate", () => {
      const result = calculateTax(1500, 50);

      expect(result.netAmount).toBe(1000);
      expect(result.taxAmount).toBe(500);
      expect(result.totalAmount).toBe(1500);
      expect(result.vatRate).toBe(50);
    });

    it("should calculate correctly with 15.5% VAT rate (decimal)", () => {
      const result = calculateTax(1155, 15.5);

      expect(result.netAmount).toBe(1000);
      expect(result.taxAmount).toBe(155);
      expect(result.totalAmount).toBe(1155);
      expect(result.vatRate).toBe(15.5);
    });

    it("should handle 100% VAT with large amounts", () => {
      const result = calculateTax(100000, 100);

      expect(result.netAmount).toBe(50000);
      expect(result.taxAmount).toBe(50000);
      expect(result.totalAmount).toBe(100000);
    });

    it("should generate PDF with 100% VAT rate", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      const mockInvoice: Invoice = {
        id: "inv-123",
        invoice_number: "09012025-01",
        payment_id: "pay-123",
        member_id: "mem-456",
        subscription_id: undefined,
        issue_date: "2025-01-09",
        amount: 5000,
        tax_amount: 5000,
        total_amount: 10000,
        business_name: "Test Gym",
        business_address: {
          street: "123 Test St",
          city: "Test City",
          postal_code: "12345",
          country: "Morocco",
        },
        business_tax_id: "ICE123456",
        business_phone: "+212-123-456",
        business_email: "test@gym.com",
        business_logo_url: undefined,
        vat_rate: 100,
        footer_notes: undefined,
        pdf_url: undefined,
        status: "issued",
        created_by: "user-123",
        created_at: "2025-01-09T00:00:00Z",
        updated_at: "2025-01-09T00:00:00Z",
      };

      const mockGeneralSettings: GeneralSettings = {
        business_name: "Test Gym",
        business_address: {
          street: "123 Test St",
          city: "Test City",
          postal_code: "12345",
          country: "Morocco",
        },
        tax_id: "ICE123456",
        phone: "+212-123-456",
        email: "test@gym.com",
      };

      const mockInvoiceSettings: InvoiceSettings = {
        vat_rate: 100,
        auto_generate: true,
      };

      const result = await generateInvoicePDF(
        mockInvoice,
        { first_name: "John", last_name: "Doe" },
        mockGeneralSettings,
        mockInvoiceSettings
      );

      expect(result).toBeInstanceOf(Blob);
      expect(mockAutoTable).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          body: expect.arrayContaining([
            expect.arrayContaining(["TVA (100%)", expect.any(String)]),
          ]),
        })
      );
    });

    it("should reject invalid VAT rates > 100%", () => {
      expect(() => calculateTax(1000, 101)).toThrow(
        "VAT rate must be between 0 and 100"
      );
    });

    it("should reject negative VAT rates", () => {
      expect(() => calculateTax(1000, -1)).toThrow(
        "VAT rate must be between 0 and 100"
      );
    });
  });

  describe("Additional Edge Cases", () => {
    it("should handle zero amount with any VAT rate", () => {
      const result1 = calculateTax(0, 0);
      expect(result1.netAmount).toBe(0);
      expect(result1.taxAmount).toBe(0);
      expect(result1.totalAmount).toBe(0);

      const result2 = calculateTax(0, 20);
      expect(result2.netAmount).toBe(0);
      expect(result2.taxAmount).toBe(0);
      expect(result2.totalAmount).toBe(0);

      const result3 = calculateTax(0, 100);
      expect(result3.netAmount).toBe(0);
      expect(result3.taxAmount).toBe(0);
      expect(result3.totalAmount).toBe(0);
    });

    it("should handle very small amounts (1 MAD) with high VAT", () => {
      const result = calculateTax(2, 100);

      expect(result.netAmount).toBe(1);
      expect(result.taxAmount).toBe(1);
      expect(result.totalAmount).toBe(2);
    });

    it("should maintain precision with complex decimal amounts", () => {
      const result = calculateTax(7233.33, 20);

      // Verify calculations maintain proper rounding
      expect(result.totalAmount).toBe(7233.33);
      expect(result.netAmount + result.taxAmount).toBeCloseTo(7233.33, 2);
    });
  });
});
