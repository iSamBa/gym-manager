import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useGeneralSettings } from "../use-general-settings";
import * as studioSettingsHook from "../use-studio-settings";
import { supabase } from "@/lib/supabase";

// Mock dependencies
vi.mock("../use-studio-settings");
vi.mock("@/lib/supabase");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useGeneralSettings", () => {
  let queryClient: QueryClient;

  const mockGeneralSettings = {
    business_name: "IronBodyFit",
    business_address: {
      street: "123 Main St",
      city: "Mohammedia",
      postal_code: "20110",
      country: "Morocco",
    },
    tax_id: "001754517000028",
    phone: "06.60.15.10.98",
    email: "contact@ironbodyfit.ma",
    logo_url: "https://example.com/logo.png",
  };

  const mockStudioSettings = {
    data: {
      id: "123",
      setting_key: "general_settings",
      setting_value: mockGeneralSettings,
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
    scheduledData: null,
    isLoadingScheduled: false,
    scheduledError: null,
    refetch: vi.fn(),
    refetchScheduled: vi.fn(),
    updateError: null,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  describe("settings retrieval", () => {
    it("should return general settings from studio settings", () => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue(
        mockStudioSettings
      );

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      expect(result.current.settings).toEqual(mockGeneralSettings);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(studioSettingsHook.useStudioSettings).toHaveBeenCalledWith(
        "general_settings"
      );
    });

    it("should handle loading state", () => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        isLoading: true,
        data: undefined,
      });

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.settings).toBeNull();
    });

    it("should handle error state", () => {
      const mockError = new Error("Failed to load settings");
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        error: mockError,
      });

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      expect(result.current.error).toEqual(mockError);
    });

    it("should handle null settings (no data configured)", () => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        data: null,
      });

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      expect(result.current.settings).toBeNull();
    });
  });

  describe("saveSettings", () => {
    it("should save general settings with immediate effect", async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue(undefined);
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      await result.current.saveSettings(mockGeneralSettings);

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        value: mockGeneralSettings,
        effectiveFrom: null,
      });
    });

    it("should handle save errors", async () => {
      const mockError = new Error("Save failed");
      const mockUpdateSettings = vi.fn().mockRejectedValue(mockError);
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        updateSettings: mockUpdateSettings,
      });

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      await expect(
        result.current.saveSettings(mockGeneralSettings)
      ).rejects.toThrow("Save failed");
    });
  });

  describe("uploadLogo", () => {
    beforeEach(() => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue(
        mockStudioSettings
      );
    });

    it("should upload PNG logo successfully", async () => {
      const mockFile = new File(["logo"], "logo.png", { type: "image/png" });
      const mockPublicUrl = "https://example.com/company-logo.png";

      const mockUpload = vi.fn().mockResolvedValue({ error: null });
      const mockGetPublicUrl = vi
        .fn()
        .mockReturnValue({ data: { publicUrl: mockPublicUrl } });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      } as never);

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      const url = await result.current.uploadLogo(mockFile);

      expect(url).toBe(mockPublicUrl);
      expect(supabase.storage.from).toHaveBeenCalledWith("business-assets");
      expect(mockUpload).toHaveBeenCalledWith("company-logo.png", mockFile, {
        cacheControl: "3600",
        upsert: true,
      });
      expect(mockGetPublicUrl).toHaveBeenCalledWith("company-logo.png");
    });

    it("should upload JPG logo successfully", async () => {
      const mockFile = new File(["logo"], "logo.jpg", { type: "image/jpeg" });
      const mockPublicUrl = "https://example.com/company-logo.jpg";

      const mockUpload = vi.fn().mockResolvedValue({ error: null });
      const mockGetPublicUrl = vi
        .fn()
        .mockReturnValue({ data: { publicUrl: mockPublicUrl } });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      } as never);

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      const url = await result.current.uploadLogo(mockFile);

      expect(url).toBe(mockPublicUrl);
      expect(mockUpload).toHaveBeenCalledWith("company-logo.jpg", mockFile, {
        cacheControl: "3600",
        upsert: true,
      });
    });

    it("should reject invalid file types", async () => {
      const mockFile = new File(["logo"], "logo.pdf", {
        type: "application/pdf",
      });

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      await expect(result.current.uploadLogo(mockFile)).rejects.toThrow(
        "Logo must be PNG or JPG format"
      );
    });

    it("should reject files larger than 2MB", async () => {
      const largeContent = "x".repeat(3 * 1024 * 1024); // 3MB
      const mockFile = new File([largeContent], "logo.png", {
        type: "image/png",
      });

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      await expect(result.current.uploadLogo(mockFile)).rejects.toThrow(
        "Logo file size must be less than 2MB"
      );
    });

    it("should handle upload errors", async () => {
      const mockFile = new File(["logo"], "logo.png", { type: "image/png" });
      const mockError = new Error("Upload failed");

      const mockUpload = vi.fn().mockResolvedValue({ error: mockError });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
      } as never);

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      await expect(result.current.uploadLogo(mockFile)).rejects.toThrow(
        "Upload failed"
      );
    });
  });

  describe("deleteLogo", () => {
    beforeEach(() => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue(
        mockStudioSettings
      );
    });

    it("should delete logo successfully", async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as never);

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      await result.current.deleteLogo();

      expect(supabase.storage.from).toHaveBeenCalledWith("business-assets");
      expect(mockRemove).toHaveBeenCalledWith([
        "company-logo.png",
        "company-logo.jpg",
      ]);
    });

    it("should handle delete errors", async () => {
      const mockError = new Error("Delete failed");
      const mockRemove = vi.fn().mockResolvedValue({ error: mockError });

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as never);

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      await expect(result.current.deleteLogo()).rejects.toThrow(
        "Delete failed"
      );
    });
  });

  describe("loading states", () => {
    it("should provide correct isSaving state", () => {
      vi.mocked(studioSettingsHook.useStudioSettings).mockReturnValue({
        ...mockStudioSettings,
        isUpdating: true,
      });

      const { result } = renderHook(() => useGeneralSettings(), { wrapper });

      expect(result.current.isSaving).toBe(true);
    });
  });
});
