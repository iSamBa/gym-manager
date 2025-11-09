import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchLogoAsBase64,
  uploadInvoicePDF,
  deleteInvoicePDF,
} from "../lib/storage-utils";

// Mock Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("storage-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("fetchLogoAsBase64", () => {
    it("should return null for null logo URL", async () => {
      const result = await fetchLogoAsBase64(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined logo URL", async () => {
      const result = await fetchLogoAsBase64(undefined);
      expect(result).toBeNull();
    });

    it("should return null for empty logo URL", async () => {
      const result = await fetchLogoAsBase64("");
      expect(result).toBeNull();
    });

    it("should return null for invalid URL format", async () => {
      const result = await fetchLogoAsBase64("invalid-url");
      expect(result).toBeNull();
    });

    it("should return null for URL without 'public' path", async () => {
      const result = await fetchLogoAsBase64(
        "https://example.com/storage/v1/object/business-assets/logo.png"
      );
      expect(result).toBeNull();
    });

    it("should return null when storage download fails", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockFrom = vi.fn().mockReturnValue({
        download: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: "Not found" } }),
      });
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom);

      const result = await fetchLogoAsBase64(
        "https://test.supabase.co/storage/v1/object/public/business-assets/company-logo.png"
      );

      expect(result).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith("business-assets");
    });

    it("should return null when storage returns empty data", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockFrom = vi.fn().mockReturnValue({
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom);

      const result = await fetchLogoAsBase64(
        "https://test.supabase.co/storage/v1/object/public/business-assets/company-logo.png"
      );

      expect(result).toBeNull();
    });

    it("should successfully fetch and convert logo to base64", async () => {
      const { supabase } = await import("@/lib/supabase");

      // Create a mock blob
      const mockBlob = new Blob(["mock-image-data"], { type: "image/png" });

      const mockFrom = vi.fn().mockReturnValue({
        download: vi.fn().mockResolvedValue({ data: mockBlob, error: null }),
      });
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom);

      const result = await fetchLogoAsBase64(
        "https://test.supabase.co/storage/v1/object/public/business-assets/company-logo.png"
      );

      expect(result).toBeTruthy();
      expect(result).toContain("data:");
      expect(result).toContain("base64");
      expect(mockFrom).toHaveBeenCalledWith("business-assets");
    });

    it("should handle different bucket names", async () => {
      const { supabase } = await import("@/lib/supabase");

      const mockBlob = new Blob(["test"], { type: "image/png" });
      const mockFrom = vi.fn().mockReturnValue({
        download: vi.fn().mockResolvedValue({ data: mockBlob, error: null }),
      });
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom);

      await fetchLogoAsBase64(
        "https://test.supabase.co/storage/v1/object/public/custom-bucket/logo.png"
      );

      expect(mockFrom).toHaveBeenCalledWith("custom-bucket");
    });
  });

  describe("uploadInvoicePDF", () => {
    it("should throw error for invalid invoice number format", async () => {
      const pdfBlob = new Blob(["pdf-content"], { type: "application/pdf" });

      await expect(uploadInvoicePDF(pdfBlob, "invalid")).rejects.toThrow(
        "Invalid invoice number format"
      );
      await expect(uploadInvoicePDF(pdfBlob, "12345678")).rejects.toThrow(
        "Invalid invoice number format"
      );
      await expect(uploadInvoicePDF(pdfBlob, "01-05-2025-01")).rejects.toThrow(
        "Invalid invoice number format"
      );
    });

    it("should upload PDF to correct path with date structure", async () => {
      const { supabase } = await import("@/lib/supabase");
      const pdfBlob = new Blob(["pdf-content"], { type: "application/pdf" });

      const mockUpload = vi.fn().mockResolvedValue({ data: {}, error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: {
          publicUrl:
            "https://test.supabase.co/storage/v1/object/public/business-assets/invoices/2025/05/INV-01052025-01.pdf",
        },
      });

      const mockFrom = vi.fn().mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom);

      const result = await uploadInvoicePDF(pdfBlob, "01052025-01");

      expect(mockFrom).toHaveBeenCalledWith("business-assets");
      expect(mockUpload).toHaveBeenCalledWith(
        "invoices/2025/05/INV-01052025-01.pdf",
        pdfBlob,
        expect.objectContaining({
          contentType: "application/pdf",
          cacheControl: "3600",
          upsert: false,
        })
      );
      expect(mockGetPublicUrl).toHaveBeenCalledWith(
        "invoices/2025/05/INV-01052025-01.pdf"
      );
      expect(result).toContain("invoices/2025/05/INV-01052025-01.pdf");
    });

    it("should throw error when upload fails", async () => {
      const { supabase } = await import("@/lib/supabase");
      const pdfBlob = new Blob(["pdf-content"], { type: "application/pdf" });

      const mockFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Storage quota exceeded" },
        }),
        getPublicUrl: vi.fn(),
      });
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom);

      await expect(uploadInvoicePDF(pdfBlob, "01052025-01")).rejects.toThrow(
        "Failed to upload invoice PDF"
      );
    });

    it("should handle different date formats in invoice number", async () => {
      const { supabase } = await import("@/lib/supabase");
      const pdfBlob = new Blob(["pdf-content"], { type: "application/pdf" });

      const mockUpload = vi.fn().mockResolvedValue({ data: {}, error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: "https://test.supabase.co/test.pdf" },
      });

      const mockFrom = vi.fn().mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom);

      // Test with different months and years
      await uploadInvoicePDF(pdfBlob, "15122024-05");
      expect(mockUpload).toHaveBeenCalledWith(
        "invoices/2024/12/INV-15122024-05.pdf",
        pdfBlob,
        expect.any(Object)
      );

      await uploadInvoicePDF(pdfBlob, "01012025-99");
      expect(mockUpload).toHaveBeenCalledWith(
        "invoices/2025/01/INV-01012025-99.pdf",
        pdfBlob,
        expect.any(Object)
      );
    });
  });

  describe("deleteInvoicePDF", () => {
    it("should return false for invalid URL format", async () => {
      const result = await deleteInvoicePDF("invalid-url");
      expect(result).toBe(false);
    });

    it("should return false for URL without 'public' path", async () => {
      const result = await deleteInvoicePDF(
        "https://example.com/storage/v1/object/business-assets/invoice.pdf"
      );
      expect(result).toBe(false);
    });

    it("should successfully delete invoice PDF", async () => {
      const { supabase } = await import("@/lib/supabase");

      const mockRemove = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockFrom = vi.fn().mockReturnValue({
        remove: mockRemove,
      });
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom);

      const result = await deleteInvoicePDF(
        "https://test.supabase.co/storage/v1/object/public/business-assets/invoices/2025/05/INV-01052025-01.pdf"
      );

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("business-assets");
      expect(mockRemove).toHaveBeenCalledWith([
        "invoices/2025/05/INV-01052025-01.pdf",
      ]);
    });

    it("should return false when deletion fails", async () => {
      const { supabase } = await import("@/lib/supabase");

      const mockFrom = vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "File not found" },
        }),
      });
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom);

      const result = await deleteInvoicePDF(
        "https://test.supabase.co/storage/v1/object/public/business-assets/invoices/2025/05/INV-01052025-01.pdf"
      );

      expect(result).toBe(false);
    });

    it("should handle unexpected errors gracefully", async () => {
      const { supabase } = await import("@/lib/supabase");

      const mockFrom = vi.fn().mockReturnValue({
        remove: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom);

      const result = await deleteInvoicePDF(
        "https://test.supabase.co/storage/v1/object/public/business-assets/invoices/2025/05/INV-01052025-01.pdf"
      );

      expect(result).toBe(false);
    });
  });
});
