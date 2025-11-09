import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useInvoiceSettings } from "../use-invoice-settings";
import * as studioSettingsHook from "../use-studio-settings";
import { toast } from "sonner";

// Mock dependencies
vi.mock("../use-studio-settings");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useInvoiceSettings", () => {
  let queryClient: QueryClient;

  const mockInvoiceSettings = {
    vat_rate: 20,
    invoice_footer_notes: "Payment due within 30 days.",
    auto_generate: true,
  };

  const mockStudioSettings = {
    data: {
      id: "123",
      setting_key: "invoice_settings",
      setting_value: mockInvoiceSettings,
      effective_from: null,
      is_active: true,
      created_by: "user123",
      created_at: "2025-01-08",
      updated_at: "2025-01-08",
    },
    isLoading: false,
    error: null,
    updateSettings: vi.fn(),
    isUpdating: false,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  describe("Default Settings", () => {
    it("should return default settings when no settings exist", () => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        data: undefined,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      expect(result.current.settings).toEqual({
        vat_rate: 20,
        invoice_footer_notes: "",
        auto_generate: true,
      });
    });

    it("should return default values with correct types", () => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        data: undefined,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      expect(typeof result.current.settings.vat_rate).toBe("number");
      expect(typeof result.current.settings.invoice_footer_notes).toBe(
        "string"
      );
      expect(typeof result.current.settings.auto_generate).toBe("boolean");
    });
  });

  describe("Loading Saved Settings", () => {
    it("should return saved invoice settings when they exist", () => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue(
        mockStudioSettings
      );

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      expect(result.current.settings).toEqual(mockInvoiceSettings);
    });

    it("should handle different VAT rates", () => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        data: {
          ...mockStudioSettings.data,
          setting_value: {
            vat_rate: 18.5,
            invoice_footer_notes: "",
            auto_generate: false,
          },
        },
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      expect(result.current.settings.vat_rate).toBe(18.5);
    });

    it("should handle empty footer notes", () => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        data: {
          ...mockStudioSettings.data,
          setting_value: {
            vat_rate: 20,
            invoice_footer_notes: "",
            auto_generate: true,
          },
        },
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      expect(result.current.settings.invoice_footer_notes).toBe("");
    });

    it("should handle auto_generate toggle", () => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        data: {
          ...mockStudioSettings.data,
          setting_value: {
            vat_rate: 20,
            invoice_footer_notes: "",
            auto_generate: false,
          },
        },
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      expect(result.current.settings.auto_generate).toBe(false);
    });
  });

  describe("Loading States", () => {
    it("should return isLoading state from useStudioSettings", () => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        isLoading: true,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it("should return isSaving state from useStudioSettings", () => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        isUpdating: true,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      expect(result.current.isSaving).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should return error state from useStudioSettings", () => {
      const mockError = new Error("Database error");

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        error: mockError,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      expect(result.current.error).toBe(mockError);
    });

    it("should show error toast when saveSettings fails", async () => {
      const mockError = new Error("Network error");
      const mockUpdateSettings = vi.fn().mockRejectedValue(mockError);

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      await expect(
        result.current.saveSettings({
          vat_rate: 18,
          invoice_footer_notes: "Test",
          auto_generate: false,
        })
      ).rejects.toThrow("Network error");

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to save settings: Network error"
      );
    });

    it("should show generic error toast for unknown errors", async () => {
      const mockUpdateSettings = vi.fn().mockRejectedValue("Unknown error");

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      await expect(
        result.current.saveSettings({
          vat_rate: 18,
          invoice_footer_notes: "Test",
          auto_generate: false,
        })
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to save settings: Failed to save settings"
      );
    });
  });

  describe("Saving Settings", () => {
    it("should call updateSettings with correct parameters", async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue(undefined);

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      const newSettings = {
        vat_rate: 18,
        invoice_footer_notes: "New footer",
        auto_generate: false,
      };

      await result.current.saveSettings(newSettings);

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        value: newSettings,
        effectiveFrom: null,
      });
    });

    it("should show success toast when settings are saved", async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue(undefined);

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      await result.current.saveSettings({
        vat_rate: 18,
        invoice_footer_notes: "Test",
        auto_generate: false,
      });

      expect(toast.success).toHaveBeenCalledWith(
        "Invoice settings saved successfully"
      );
    });

    it("should save settings with immediate effect (effectiveFrom: null)", async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue(undefined);

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      await result.current.saveSettings({
        vat_rate: 20,
        invoice_footer_notes: "",
        auto_generate: true,
      });

      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          effectiveFrom: null,
        })
      );
    });
  });

  describe("VAT Rate Scenarios", () => {
    it("should handle VAT rate of 0%", async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue(undefined);

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      await result.current.saveSettings({
        vat_rate: 0,
        invoice_footer_notes: "",
        auto_generate: true,
      });

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        value: expect.objectContaining({ vat_rate: 0 }),
        effectiveFrom: null,
      });
    });

    it("should handle VAT rate of 100%", async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue(undefined);

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      await result.current.saveSettings({
        vat_rate: 100,
        invoice_footer_notes: "",
        auto_generate: true,
      });

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        value: expect.objectContaining({ vat_rate: 100 }),
        effectiveFrom: null,
      });
    });

    it("should handle decimal VAT rates", async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue(undefined);

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      await result.current.saveSettings({
        vat_rate: 19.6,
        invoice_footer_notes: "",
        auto_generate: true,
      });

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        value: expect.objectContaining({ vat_rate: 19.6 }),
        effectiveFrom: null,
      });
    });
  });

  describe("Footer Notes Scenarios", () => {
    it("should handle long footer notes (up to 500 characters)", async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue(undefined);

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      const longFooter = "A".repeat(500);

      await result.current.saveSettings({
        vat_rate: 20,
        invoice_footer_notes: longFooter,
        auto_generate: true,
      });

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        value: expect.objectContaining({
          invoice_footer_notes: longFooter,
        }),
        effectiveFrom: null,
      });
    });

    it("should handle multiline footer notes", async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue(undefined);

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      const multilineFooter = "Line 1\nLine 2\nLine 3";

      await result.current.saveSettings({
        vat_rate: 20,
        invoice_footer_notes: multilineFooter,
        auto_generate: true,
      });

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        value: expect.objectContaining({
          invoice_footer_notes: multilineFooter,
        }),
        effectiveFrom: null,
      });
    });
  });

  describe("Auto-Generate Toggle Scenarios", () => {
    it("should toggle auto_generate from true to false", async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue(undefined);

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      await result.current.saveSettings({
        vat_rate: 20,
        invoice_footer_notes: "",
        auto_generate: false,
      });

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        value: expect.objectContaining({ auto_generate: false }),
        effectiveFrom: null,
      });
    });

    it("should toggle auto_generate from false to true", async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue(undefined);

      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        data: {
          ...mockStudioSettings.data,
          setting_value: {
            vat_rate: 20,
            invoice_footer_notes: "",
            auto_generate: false,
          },
        },
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useInvoiceSettings(), { wrapper });

      await result.current.saveSettings({
        vat_rate: 20,
        invoice_footer_notes: "",
        auto_generate: true,
      });

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        value: expect.objectContaining({ auto_generate: true }),
        effectiveFrom: null,
      });
    });
  });
});
