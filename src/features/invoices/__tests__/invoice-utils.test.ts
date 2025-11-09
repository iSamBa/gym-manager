import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateTax,
  fetchGeneralSettings,
  fetchInvoiceSettings,
  generateInvoiceNumber,
  createInvoiceRecord,
  updateInvoicePdfUrl,
  fetchMemberForInvoice,
} from "../lib/invoice-utils";
import type {
  GeneralSettings,
  InvoiceSettings,
} from "@/features/database/lib/types";

// Mock dependencies
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
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

// Mock settings API module - use factory function
vi.mock("@/features/settings/lib/settings-api", () => ({
  fetchActiveSettings: vi.fn(),
}));

describe("invoice-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("calculateTax", () => {
    it("should calculate tax correctly with 20% VAT", () => {
      const result = calculateTax(7200, 20);

      expect(result.netAmount).toBe(6000);
      expect(result.taxAmount).toBe(1200);
      expect(result.totalAmount).toBe(7200);
      expect(result.vatRate).toBe(20);
    });

    it("should calculate tax correctly with 0% VAT", () => {
      const result = calculateTax(1000, 0);

      expect(result.netAmount).toBe(1000);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(1000);
      expect(result.vatRate).toBe(0);
    });

    it("should calculate tax correctly with 10% VAT", () => {
      const result = calculateTax(1100, 10);

      expect(result.netAmount).toBe(1000);
      expect(result.taxAmount).toBe(100);
      expect(result.totalAmount).toBe(1100);
      expect(result.vatRate).toBe(10);
    });

    it("should round amounts to 2 decimal places", () => {
      const result = calculateTax(7233.33, 20);

      expect(result.netAmount).toBe(6027.78);
      expect(result.taxAmount).toBe(1205.55); // Calculated from total - net to ensure consistency
      expect(result.totalAmount).toBe(7233.33);
    });

    it("should handle zero amount", () => {
      const result = calculateTax(0, 20);

      expect(result.netAmount).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it("should throw error for negative amount", () => {
      expect(() => calculateTax(-100, 20)).toThrow(
        "Total amount cannot be negative"
      );
    });

    it("should throw error for negative VAT rate", () => {
      expect(() => calculateTax(1000, -5)).toThrow(
        "VAT rate must be between 0 and 100"
      );
    });

    it("should throw error for VAT rate > 100", () => {
      expect(() => calculateTax(1000, 105)).toThrow(
        "VAT rate must be between 0 and 100"
      );
    });

    it("should handle typical gym membership amounts", () => {
      // 300 MAD membership
      const result1 = calculateTax(300, 20);
      expect(result1.netAmount).toBe(250);
      expect(result1.taxAmount).toBe(50);

      // 1200 MAD 3-month plan
      const result2 = calculateTax(1200, 20);
      expect(result2.netAmount).toBe(1000);
      expect(result2.taxAmount).toBe(200);

      // 7200 MAD annual plan
      const result3 = calculateTax(7200, 20);
      expect(result3.netAmount).toBe(6000);
      expect(result3.taxAmount).toBe(1200);
    });
  });

  describe("fetchGeneralSettings", () => {
    it("should fetch and return general settings", async () => {
      const { fetchActiveSettings } = await import(
        "@/features/settings/lib/settings-api"
      );

      const mockSettings: GeneralSettings = {
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

      vi.mocked(fetchActiveSettings).mockResolvedValue({
        id: "1",
        setting_key: "general_settings",
        setting_value: mockSettings,
        effective_from: null,
        is_active: true,
        created_by: null,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      });

      const result = await fetchGeneralSettings();

      expect(result).toEqual(mockSettings);
      expect(fetchActiveSettings).toHaveBeenCalledWith("general_settings");
    });

    it("should return null when settings not configured", async () => {
      const { fetchActiveSettings } = await import(
        "@/features/settings/lib/settings-api"
      );

      vi.mocked(fetchActiveSettings).mockResolvedValue(null);

      const result = await fetchGeneralSettings();

      expect(result).toBeNull();
    });

    it("should throw error when fetch fails", async () => {
      const { fetchActiveSettings } = await import(
        "@/features/settings/lib/settings-api"
      );

      vi.mocked(fetchActiveSettings).mockRejectedValue(
        new Error("Database error")
      );

      await expect(fetchGeneralSettings()).rejects.toThrow("Database error");
    });
  });

  describe("fetchInvoiceSettings", () => {
    it("should fetch and return invoice settings", async () => {
      const { fetchActiveSettings } = await import(
        "@/features/settings/lib/settings-api"
      );

      const mockSettings: InvoiceSettings = {
        vat_rate: 20,
        invoice_footer_notes: "Thank you for your business!",
        auto_generate: true,
      };

      vi.mocked(fetchActiveSettings).mockResolvedValue({
        id: "2",
        setting_key: "invoice_settings",
        setting_value: mockSettings,
        effective_from: null,
        is_active: true,
        created_by: null,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      });

      const result = await fetchInvoiceSettings();

      expect(result).toEqual(mockSettings);
      expect(fetchActiveSettings).toHaveBeenCalledWith("invoice_settings");
    });

    it("should return defaults when settings not configured", async () => {
      const { fetchActiveSettings } = await import(
        "@/features/settings/lib/settings-api"
      );

      vi.mocked(fetchActiveSettings).mockResolvedValue(null);

      const result = await fetchInvoiceSettings();

      expect(result).toEqual({
        vat_rate: 20,
        invoice_footer_notes: undefined,
        auto_generate: true,
      });
    });

    it("should throw error when fetch fails", async () => {
      const { fetchActiveSettings } = await import(
        "@/features/settings/lib/settings-api"
      );

      vi.mocked(fetchActiveSettings).mockRejectedValue(
        new Error("Database error")
      );

      await expect(fetchInvoiceSettings()).rejects.toThrow("Database error");
    });
  });

  describe("generateInvoiceNumber", () => {
    it("should generate invoice number via RPC", async () => {
      const { supabase } = await import("@/lib/supabase");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: "08012025-01",
        error: null,
      } as never);

      const result = await generateInvoiceNumber();

      expect(result).toBe("08012025-01");
      expect(supabase.rpc).toHaveBeenCalledWith("generate_invoice_number");
    });

    it("should throw error when RPC fails", async () => {
      const { supabase } = await import("@/lib/supabase");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: "RPC error" },
      } as never);

      await expect(generateInvoiceNumber()).rejects.toThrow(
        "Failed to generate invoice number"
      );
    });

    it("should throw error when RPC returns null", async () => {
      const { supabase } = await import("@/lib/supabase");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as never);

      await expect(generateInvoiceNumber()).rejects.toThrow(
        "RPC returned null invoice number"
      );
    });
  });

  describe("createInvoiceRecord", () => {
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
      invoice_footer_notes: "Thank you!",
      auto_generate: true,
    };

    beforeEach(async () => {
      const { fetchActiveSettings } = await import(
        "@/features/settings/lib/settings-api"
      );

      // Mock fetchActiveSettings to return different values based on key
      vi.mocked(fetchActiveSettings).mockImplementation(async (key: string) => {
        if (key === "general_settings") {
          return {
            id: "1",
            setting_key: "general_settings",
            setting_value: mockGeneralSettings,
            effective_from: null,
            is_active: true,
            created_by: null,
            created_at: "2025-01-01",
            updated_at: "2025-01-01",
          };
        }
        if (key === "invoice_settings") {
          return {
            id: "2",
            setting_key: "invoice_settings",
            setting_value: mockInvoiceSettings,
            effective_from: null,
            is_active: true,
            created_by: null,
            created_at: "2025-01-01",
            updated_at: "2025-01-01",
          };
        }
        return null;
      });
    });

    it("should create invoice record with correct calculations", async () => {
      const { supabase } = await import("@/lib/supabase");

      // Mock getUser
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-123" } as never },
        error: null,
      });

      // Mock RPC for invoice number
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: "08012025-01",
        error: null,
      } as never);

      // Mock invoice insert
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
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
              vat_rate: 20,
              status: "issued",
              created_by: "user-123",
              created_at: "2025-01-08T00:00:00Z",
              updated_at: "2025-01-08T00:00:00Z",
            },
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as never);

      const result = await createInvoiceRecord({
        payment_id: "pay-123",
        member_id: "mem-456",
        subscription_id: "sub-789",
        amount: 7200,
      });

      expect(result.invoice_number).toBe("08012025-01");
      expect(result.amount).toBe(6000);
      expect(result.tax_amount).toBe(1200);
      expect(result.total_amount).toBe(7200);
      expect(result.business_name).toBe("Test Gym");
      expect(result.vat_rate).toBe(20);
    });

    it("should throw error when general settings not configured", async () => {
      const { fetchActiveSettings } = await import(
        "@/features/settings/lib/settings-api"
      );

      vi.mocked(fetchActiveSettings).mockImplementation(async (key: string) => {
        if (key === "general_settings") return null;
        if (key === "invoice_settings") {
          return {
            id: "2",
            setting_key: "invoice_settings",
            setting_value: mockInvoiceSettings,
            effective_from: null,
            is_active: true,
            created_by: null,
            created_at: "2025-01-01",
            updated_at: "2025-01-01",
          };
        }
        return null;
      });

      await expect(
        createInvoiceRecord({
          payment_id: "pay-123",
          member_id: "mem-456",
          amount: 7200,
        })
      ).rejects.toThrow("General settings not configured");
    });
  });

  describe("updateInvoicePdfUrl", () => {
    it("should update invoice with PDF URL", async () => {
      const { supabase } = await import("@/lib/supabase");

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      await updateInvoicePdfUrl("inv-123", "https://test.com/invoice.pdf");

      expect(supabase.from).toHaveBeenCalledWith("invoices");
      expect(mockUpdate).toHaveBeenCalledWith({
        pdf_url: "https://test.com/invoice.pdf",
      });
    });

    it("should throw error when update fails", async () => {
      const { supabase } = await import("@/lib/supabase");

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Update failed" },
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      await expect(
        updateInvoicePdfUrl("inv-123", "https://test.com/invoice.pdf")
      ).rejects.toThrow();
    });
  });

  describe("fetchMemberForInvoice", () => {
    it("should fetch member details", async () => {
      const { supabase } = await import("@/lib/supabase");

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              first_name: "John",
              last_name: "Doe",
              email: "john@example.com",
            },
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const result = await fetchMemberForInvoice("mem-123");

      expect(result).toEqual({
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      });
      expect(supabase.from).toHaveBeenCalledWith("members");
    });

    it("should throw error when member not found", async () => {
      const { supabase } = await import("@/lib/supabase");

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Not found" },
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      await expect(fetchMemberForInvoice("mem-123")).rejects.toThrow();
    });
  });
});
