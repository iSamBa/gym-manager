import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useStudioSettings } from "../use-studio-settings";
import * as settingsApi from "../../lib/settings-api";

// Mock the settings API
vi.mock("../../lib/settings-api");

describe("useStudioSettings", () => {
  let queryClient: QueryClient;

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

  describe("query", () => {
    it("should fetch active and scheduled settings successfully", async () => {
      const mockActiveSettings = {
        id: "123",
        setting_key: "opening_hours",
        setting_value: {
          monday: { is_open: true, open_time: "09:00", close_time: "21:00" },
        },
        effective_from: "2025-01-01",
        is_active: true,
        created_by: null,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      };

      const mockScheduledSettings = {
        id: "456",
        setting_key: "opening_hours",
        setting_value: {
          monday: { is_open: true, open_time: "10:00", close_time: "20:00" },
        },
        effective_from: "2025-11-01",
        is_active: true,
        created_by: null,
        created_at: "2025-10-16",
        updated_at: "2025-10-16",
      };

      vi.mocked(settingsApi.fetchActiveSettings).mockResolvedValue(
        mockActiveSettings
      );
      vi.mocked(settingsApi.fetchScheduledSettings).mockResolvedValue(
        mockScheduledSettings
      );

      const { result } = renderHook(() => useStudioSettings("opening_hours"), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockActiveSettings);
      expect(result.current.scheduledData).toEqual(mockScheduledSettings);
      expect(result.current.error).toBeNull();
      expect(settingsApi.fetchActiveSettings).toHaveBeenCalledWith(
        "opening_hours"
      );
      expect(settingsApi.fetchScheduledSettings).toHaveBeenCalledWith(
        "opening_hours"
      );
    });

    it("should handle fetch error", async () => {
      const mockError = new Error("Fetch failed");

      vi.mocked(settingsApi.fetchActiveSettings).mockRejectedValue(mockError);
      vi.mocked(settingsApi.fetchScheduledSettings).mockResolvedValue(null);

      const { result } = renderHook(() => useStudioSettings("opening_hours"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toEqual(mockError);
    });

    it("should handle null settings (no data)", async () => {
      vi.mocked(settingsApi.fetchActiveSettings).mockResolvedValue(null);
      vi.mocked(settingsApi.fetchScheduledSettings).mockResolvedValue(null);

      const { result } = renderHook(() => useStudioSettings("opening_hours"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.scheduledData).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe("mutation", () => {
    it("should update settings successfully", async () => {
      const mockSettings = {
        id: "123",
        setting_key: "opening_hours",
        setting_value: {
          monday: { is_open: true, open_time: "09:00", close_time: "21:00" },
        },
        effective_from: "2025-02-01",
        is_active: true,
        created_by: "user123",
        created_at: "2025-01-15",
        updated_at: "2025-01-15",
      };

      vi.mocked(settingsApi.fetchActiveSettings).mockResolvedValue(null);
      vi.mocked(settingsApi.fetchScheduledSettings).mockResolvedValue(null);
      vi.mocked(settingsApi.updateStudioSettings).mockResolvedValue(
        mockSettings
      );

      const { result } = renderHook(() => useStudioSettings("opening_hours"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newValue = {
        monday: { is_open: true, open_time: "09:00", close_time: "21:00" },
      };
      const effectiveFrom = new Date("2025-02-01");

      await result.current.updateSettings({ value: newValue, effectiveFrom });

      expect(settingsApi.updateStudioSettings).toHaveBeenCalledWith(
        "opening_hours",
        newValue,
        effectiveFrom
      );
    });

    it("should invalidate query after successful update", async () => {
      const mockSettings = {
        id: "123",
        setting_key: "opening_hours",
        setting_value: {},
        effective_from: "2025-02-01",
        is_active: true,
        created_by: "user123",
        created_at: "2025-01-15",
        updated_at: "2025-01-15",
      };

      vi.mocked(settingsApi.fetchActiveSettings).mockResolvedValue(
        mockSettings
      );
      vi.mocked(settingsApi.fetchScheduledSettings).mockResolvedValue(null);
      vi.mocked(settingsApi.updateStudioSettings).mockResolvedValue(
        mockSettings
      );

      const { result } = renderHook(() => useStudioSettings("opening_hours"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear the fetch mocks to verify refetch
      vi.mocked(settingsApi.fetchActiveSettings).mockClear();
      vi.mocked(settingsApi.fetchScheduledSettings).mockClear();

      await result.current.updateSettings({
        value: {},
        effectiveFrom: new Date("2025-02-01"),
      });

      // Wait for cache invalidation and refetch
      await waitFor(
        () => {
          expect(settingsApi.fetchActiveSettings).toHaveBeenCalledWith(
            "opening_hours"
          );
          expect(settingsApi.fetchScheduledSettings).toHaveBeenCalledWith(
            "opening_hours"
          );
        },
        { timeout: 2000 }
      );
    });

    it("should handle update error", async () => {
      const mockError = new Error("Update failed");

      vi.mocked(settingsApi.fetchActiveSettings).mockResolvedValue(null);
      vi.mocked(settingsApi.fetchScheduledSettings).mockResolvedValue(null);
      vi.mocked(settingsApi.updateStudioSettings).mockRejectedValue(mockError);

      const { result } = renderHook(() => useStudioSettings("opening_hours"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.updateSettings({
          value: {},
          effectiveFrom: new Date(),
        })
      ).rejects.toThrow("Update failed");

      // Wait for error state to update
      await waitFor(() => {
        expect(result.current.updateError).toEqual(mockError);
      });
    });

    it("should support null effective date for immediate effect", async () => {
      const mockSettings = {
        id: "123",
        setting_key: "business_name",
        setting_value: { name: "My Gym" },
        effective_from: null,
        is_active: true,
        created_by: "user123",
        created_at: "2025-01-15",
        updated_at: "2025-01-15",
      };

      vi.mocked(settingsApi.fetchActiveSettings).mockResolvedValue(null);
      vi.mocked(settingsApi.fetchScheduledSettings).mockResolvedValue(null);
      vi.mocked(settingsApi.updateStudioSettings).mockResolvedValue(
        mockSettings
      );

      const { result } = renderHook(() => useStudioSettings("business_name"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.updateSettings({
        value: { name: "My Gym" },
        effectiveFrom: null,
      });

      expect(settingsApi.updateStudioSettings).toHaveBeenCalledWith(
        "business_name",
        { name: "My Gym" },
        null
      );
    });
  });

  describe("loading states", () => {
    it("should provide correct loading state for query", async () => {
      vi.mocked(settingsApi.fetchActiveSettings).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
      );
      vi.mocked(settingsApi.fetchScheduledSettings).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
      );

      const { result } = renderHook(() => useStudioSettings("opening_hours"), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.scheduledData).toBeNull();
    });

    it("should provide correct loading state for mutation", async () => {
      vi.mocked(settingsApi.fetchActiveSettings).mockResolvedValue(null);
      vi.mocked(settingsApi.fetchScheduledSettings).mockResolvedValue(null);
      vi.mocked(settingsApi.updateStudioSettings).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: "123",
                  setting_key: "opening_hours",
                  setting_value: {},
                  effective_from: null,
                  is_active: true,
                  created_by: null,
                  created_at: "2025-01-01",
                  updated_at: "2025-01-01",
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useStudioSettings("opening_hours"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start mutation
      const updatePromise = result.current.updateSettings({
        value: {},
        effectiveFrom: null,
      });

      // Wait for updating state to be true
      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });

      await updatePromise;

      // Wait for updating state to be false
      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });
  });
});
