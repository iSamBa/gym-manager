import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateInvoicePDF, createInvoice } from "../lib/invoice-generator";
import type {
  Invoice,
  GeneralSettings,
  InvoiceSettings,
} from "@/features/database/lib/types";

// Mock dependencies
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
  uploadInvoicePDF: vi.fn(),
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

// Mock jspdf-autotable as a default export function
vi.mock("jspdf-autotable", () => ({
  default: mockAutoTable,
}));

describe("invoice-generator", () => {
  const mockInvoice: Invoice = {
    id: "inv-123",
    invoice_number: "08012025-01",
    payment_id: "pay-123",
    member_id: "mem-456",
    subscription_id: "sub-789",
    issue_date: "2025-01-08",
    amount: 6000,
    tax_amount: 1200,
    total_amount: 7200,
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
    business_logo_url: "https://test.com/logo.png",
    vat_rate: 20,
    footer_notes: "Thank you for your business!",
    pdf_url: undefined,
    status: "issued",
    created_by: "user-123",
    created_at: "2025-01-08T00:00:00Z",
    updated_at: "2025-01-08T00:00:00Z",
  };

  const mockMember = {
    first_name: "John",
    last_name: "Doe",
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
    logo_url: "https://test.com/logo.png",
  };

  const mockInvoiceSettings: InvoiceSettings = {
    vat_rate: 20,
    invoice_footer_notes: "Thank you for your business!",
    auto_generate: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock behavior
    mockOutput.mockReturnValue(
      new Blob(["pdf-content"], { type: "application/pdf" })
    );
    mockSplitTextToSize.mockImplementation((text: string) => [text]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("generateInvoicePDF", () => {
    it("should generate PDF with all required sections", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(
        "data:image/png;base64,test"
      );

      const result = await generateInvoicePDF(
        mockInvoice,
        mockMember,
        mockGeneralSettings,
        mockInvoiceSettings
      );

      // Verify PDF blob is returned
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("application/pdf");

      // Verify logo was fetched and added
      expect(fetchLogoAsBase64).toHaveBeenCalledWith(
        "https://test.com/logo.png"
      );
      expect(mockAddImage).toHaveBeenCalledWith(
        "data:image/png;base64,test",
        "PNG",
        20,
        20,
        40,
        40
      );

      // Verify text methods were called
      expect(mockText).toHaveBeenCalled();
      expect(mockSetFontSize).toHaveBeenCalled();
      expect(mockSetFont).toHaveBeenCalled();

      // Verify table was created (autoTable is now a standalone function)
      expect(mockAutoTable).toHaveBeenCalledWith(
        expect.any(Object), // First arg is the doc instance
        expect.objectContaining({
          head: [["Description", "Montant (MAD)"]],
          body: expect.arrayContaining([
            expect.arrayContaining(["Abonnement (HT)", expect.any(String)]),
            expect.arrayContaining(["TVA (20%)", expect.any(String)]),
            expect.arrayContaining(["Total (TTC)", expect.any(String)]),
          ]),
        })
      );

      // Verify output was called to generate blob
      expect(mockOutput).toHaveBeenCalledWith("blob");
    });

    it("should handle missing logo gracefully", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      const result = await generateInvoicePDF(
        mockInvoice,
        mockMember,
        mockGeneralSettings,
        mockInvoiceSettings
      );

      expect(result).toBeInstanceOf(Blob);
      expect(fetchLogoAsBase64).toHaveBeenCalled();
      expect(mockAddImage).not.toHaveBeenCalled();
    });

    it("should continue when logo fetch fails", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockRejectedValue(
        new Error("Logo fetch failed")
      );

      const result = await generateInvoicePDF(
        mockInvoice,
        mockMember,
        mockGeneralSettings,
        mockInvoiceSettings
      );

      expect(result).toBeInstanceOf(Blob);
      expect(mockAddImage).not.toHaveBeenCalled();
    });

    it("should handle missing footer notes", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      const invoiceWithoutFooter = { ...mockInvoice, footer_notes: undefined };
      const settingsWithoutFooter: InvoiceSettings = {
        ...mockInvoiceSettings,
        invoice_footer_notes: undefined,
      };

      const result = await generateInvoicePDF(
        invoiceWithoutFooter,
        mockMember,
        mockGeneralSettings,
        settingsWithoutFooter
      );

      expect(result).toBeInstanceOf(Blob);
      // Footer notes section should not be rendered (no splitTextToSize call for footer)
      expect(mockSplitTextToSize).not.toHaveBeenCalled();
    });

    it("should use invoice settings footer notes if provided", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      mockSplitTextToSize.mockReturnValue(["Custom footer notes"]);

      await generateInvoicePDF(
        mockInvoice,
        mockMember,
        mockGeneralSettings,
        mockInvoiceSettings
      );

      expect(mockSplitTextToSize).toHaveBeenCalledWith(
        "Thank you for your business!",
        170
      );
    });

    it("should handle missing optional business fields", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      const settingsWithoutOptionals: GeneralSettings = {
        ...mockGeneralSettings,
        phone: "",
        email: "",
        logo_url: undefined,
      };

      const result = await generateInvoicePDF(
        mockInvoice,
        mockMember,
        settingsWithoutOptionals,
        mockInvoiceSettings
      );

      expect(result).toBeInstanceOf(Blob);
    });

    it("should use correct VAT rate from invoice settings", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      const customVatSettings: InvoiceSettings = {
        ...mockInvoiceSettings,
        vat_rate: 10,
      };

      await generateInvoicePDF(
        mockInvoice,
        mockMember,
        mockGeneralSettings,
        customVatSettings
      );

      expect(mockAutoTable).toHaveBeenCalledWith(
        expect.any(Object), // First arg is the doc instance
        expect.objectContaining({
          body: expect.arrayContaining([
            expect.arrayContaining(["TVA (10%)", expect.any(String)]),
          ]),
        })
      );
    });

    it("should fall back to invoice VAT rate if settings is null", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      await generateInvoicePDF(
        mockInvoice,
        mockMember,
        mockGeneralSettings,
        null
      );

      expect(mockAutoTable).toHaveBeenCalledWith(
        expect.any(Object), // First arg is the doc instance
        expect.objectContaining({
          body: expect.arrayContaining([
            expect.arrayContaining(["TVA (20%)", expect.any(String)]),
          ]),
        })
      );
    });

    it("should throw error if PDF generation fails", async () => {
      const { fetchLogoAsBase64 } = await import("../lib/storage-utils");
      vi.mocked(fetchLogoAsBase64).mockResolvedValue(null);

      mockOutput.mockImplementation(() => {
        throw new Error("PDF generation failed");
      });

      await expect(
        generateInvoicePDF(
          mockInvoice,
          mockMember,
          mockGeneralSettings,
          mockInvoiceSettings
        )
      ).rejects.toThrow("Failed to generate invoice PDF");
    });
  });

  describe("createInvoice", () => {
    beforeEach(async () => {
      // Reset modules to clear module cache
      vi.resetModules();
    });

    it("should orchestrate complete invoice generation workflow", async () => {
      // Mock all invoice-utils functions
      const mockCreateInvoiceRecord = vi.fn().mockResolvedValue(mockInvoice);
      const mockFetchGeneralSettings = vi
        .fn()
        .mockResolvedValue(mockGeneralSettings);
      const mockFetchInvoiceSettings = vi
        .fn()
        .mockResolvedValue(mockInvoiceSettings);
      const mockFetchMemberForInvoice = vi.fn().mockResolvedValue(mockMember);
      const mockUpdateInvoicePdfUrl = vi.fn().mockResolvedValue(undefined);

      vi.doMock("../lib/invoice-utils", () => ({
        createInvoiceRecord: mockCreateInvoiceRecord,
        fetchGeneralSettings: mockFetchGeneralSettings,
        fetchInvoiceSettings: mockFetchInvoiceSettings,
        fetchMemberForInvoice: mockFetchMemberForInvoice,
        updateInvoicePdfUrl: mockUpdateInvoicePdfUrl,
      }));

      const { uploadInvoicePDF } = await import("../lib/storage-utils");
      vi.mocked(uploadInvoicePDF).mockResolvedValue(
        "https://test.com/invoice.pdf"
      );

      // Re-import to get mocked version
      const { createInvoice: createInvoiceFunc } = await import(
        "../lib/invoice-generator"
      );

      const result = await createInvoiceFunc({
        payment_id: "pay-123",
        member_id: "mem-456",
        subscription_id: "sub-789",
        amount: 7200,
      });

      expect(mockCreateInvoiceRecord).toHaveBeenCalledWith({
        payment_id: "pay-123",
        member_id: "mem-456",
        subscription_id: "sub-789",
        amount: 7200,
      });

      expect(mockFetchMemberForInvoice).toHaveBeenCalledWith("mem-456");
      expect(mockFetchGeneralSettings).toHaveBeenCalled();
      expect(mockFetchInvoiceSettings).toHaveBeenCalled();

      expect(uploadInvoicePDF).toHaveBeenCalledWith(
        expect.any(Blob),
        "08012025-01"
      );

      expect(mockUpdateInvoicePdfUrl).toHaveBeenCalledWith(
        "inv-123",
        "https://test.com/invoice.pdf"
      );

      expect(result.pdf_url).toBe("https://test.com/invoice.pdf");
    });
  });
});
