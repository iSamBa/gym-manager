/**
 * Planning Settings Hook Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePlanningSettings } from "../use-planning-settings";
import * as planningSettingsDb from "../../lib/planning-settings-db";
import { toast } from "sonner";

// Mock dependencies
vi.mock("../../lib/planning-settings-db");
vi.mock("sonner");

describe("usePlanningSettings", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should fetch settings on mount", async () => {
    const mockSettings = {
      id: "test-id",
      subscription_warning_days: 35,
      body_checkup_sessions: 5,
      payment_reminder_days: 27,
      max_sessions_per_week: 250,
      inactivity_months: 6,
      created_at: "2025-10-18T00:00:00Z",
      updated_at: "2025-10-18T00:00:00Z",
    };

    vi.mocked(planningSettingsDb.getPlanningSettings).mockResolvedValue(
      mockSettings
    );

    const { result } = renderHook(() => usePlanningSettings(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockSettings);
    expect(planningSettingsDb.getPlanningSettings).toHaveBeenCalled();
  });

  it("should initialize defaults if no settings exist", async () => {
    const mockSettings = {
      id: "test-id",
      subscription_warning_days: 35,
      body_checkup_sessions: 5,
      payment_reminder_days: 27,
      max_sessions_per_week: 250,
      inactivity_months: 6,
      created_at: "2025-10-18T00:00:00Z",
      updated_at: "2025-10-18T00:00:00Z",
    };

    vi.mocked(planningSettingsDb.getPlanningSettings).mockResolvedValue(null);
    vi.mocked(planningSettingsDb.initializeDefaultSettings).mockResolvedValue(
      mockSettings
    );

    const { result } = renderHook(() => usePlanningSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockSettings);
    expect(planningSettingsDb.getPlanningSettings).toHaveBeenCalled();
    expect(planningSettingsDb.initializeDefaultSettings).toHaveBeenCalled();
  });

  it("should update settings and invalidate query", async () => {
    const mockSettings = {
      id: "test-id",
      subscription_warning_days: 35,
      body_checkup_sessions: 5,
      payment_reminder_days: 27,
      max_sessions_per_week: 250,
      inactivity_months: 6,
      created_at: "2025-10-18T00:00:00Z",
      updated_at: "2025-10-18T00:00:00Z",
    };

    const mockUpdatedSettings = {
      ...mockSettings,
      subscription_warning_days: 40,
    };

    vi.mocked(planningSettingsDb.getPlanningSettings).mockResolvedValue(
      mockSettings
    );
    vi.mocked(planningSettingsDb.updatePlanningSettings).mockResolvedValue(
      mockUpdatedSettings
    );

    const { result } = renderHook(() => usePlanningSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.updateSettings({ subscription_warning_days: 40 });

    await waitFor(() => {
      expect(planningSettingsDb.updatePlanningSettings).toHaveBeenCalledWith(
        "test-id",
        { subscription_warning_days: 40 }
      );
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Planning settings updated successfully"
    );
  });

  it("should show error toast when update fails", async () => {
    const mockSettings = {
      id: "test-id",
      subscription_warning_days: 35,
      body_checkup_sessions: 5,
      payment_reminder_days: 27,
      max_sessions_per_week: 250,
      inactivity_months: 6,
      created_at: "2025-10-18T00:00:00Z",
      updated_at: "2025-10-18T00:00:00Z",
    };

    vi.mocked(planningSettingsDb.getPlanningSettings).mockResolvedValue(
      mockSettings
    );
    vi.mocked(planningSettingsDb.updatePlanningSettings).mockRejectedValue(
      new Error("Update failed")
    );

    const { result } = renderHook(() => usePlanningSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      result.current.updateSettings({ subscription_warning_days: 40 })
    ).rejects.toThrow();

    expect(toast.error).toHaveBeenCalledWith(
      "Failed to update settings: Update failed"
    );
  });
});
