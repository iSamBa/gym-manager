import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateZipFilename, downloadBlob } from "../zip-utils";

describe("zip-utils", () => {
  describe("generateZipFilename", () => {
    it("should generate filename with current date in YYYY-MM-DD format", () => {
      const filename = generateZipFilename(10);
      // Match format: invoices-YYYY-MM-DD-10.zip
      expect(filename).toMatch(/^invoices-\d{4}-\d{2}-\d{2}-10\.zip$/);
    });

    it("should include invoice count in filename", () => {
      const filename = generateZipFilename(25);
      expect(filename).toContain("-25.zip");
    });

    it("should handle single invoice", () => {
      const filename = generateZipFilename(1);
      expect(filename).toMatch(/^invoices-\d{4}-\d{2}-\d{2}-1\.zip$/);
    });

    it("should handle large invoice count", () => {
      const filename = generateZipFilename(999);
      expect(filename).toContain("-999.zip");
    });

    it("should always end with .zip extension", () => {
      const filename = generateZipFilename(5);
      expect(filename).toMatch(/\.zip$/);
    });
  });

  describe("downloadBlob", () => {
    beforeEach(() => {
      // Mock DOM APIs
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();
      window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
      window.URL.revokeObjectURL = vi.fn();

      // Create spy for click
      HTMLAnchorElement.prototype.click = vi.fn();
    });

    it("should create object URL for blob", () => {
      const blob = new Blob(["test"], { type: "application/zip" });
      const filename = "test.zip";

      downloadBlob(blob, filename);

      expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
    });

    it("should create anchor element with correct attributes", () => {
      const blob = new Blob(["test"], { type: "application/zip" });
      const filename = "invoices-2025-01-18-10.zip";

      downloadBlob(blob, filename);

      // Verify appendChild was called (anchor was added to DOM)
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it("should trigger click on anchor element", () => {
      const blob = new Blob(["test"], { type: "application/zip" });
      downloadBlob(blob, "test.zip");

      // Click should be called on the anchor element
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });

    it("should cleanup blob URL after download", () => {
      const blob = new Blob(["test"], { type: "application/zip" });
      downloadBlob(blob, "test.zip");

      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("should remove anchor element from DOM after download", () => {
      const blob = new Blob(["test"], { type: "application/zip" });
      downloadBlob(blob, "test.zip");

      expect(document.body.removeChild).toHaveBeenCalled();
    });

    it("should handle different blob types", () => {
      const pdfBlob = new Blob(["pdf content"], { type: "application/pdf" });
      downloadBlob(pdfBlob, "invoice.pdf");

      expect(window.URL.createObjectURL).toHaveBeenCalledWith(pdfBlob);
    });

    it("should handle filenames with special characters", () => {
      const blob = new Blob(["test"], { type: "application/zip" });
      const filename = "invoices-2025-01-18-special_name-10.zip";

      downloadBlob(blob, filename);

      // Should not throw error
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });
  });
});
