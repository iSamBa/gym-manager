/**
 * Planning Settings Database Utilities Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPlanningSettings,
  updatePlanningSettings,
  initializeDefaultSettings,
} from "../planning-settings-db";
import { supabase } from "@/lib/supabase";

// Mock Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("planning-settings-db", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPlanningSettings", () => {
    it("should return settings when they exist", async () => {
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

      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockSettings, error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const result = await getPlanningSettings();

      expect(result).toEqual(mockSettings);
      expect(supabase.from).toHaveBeenCalledWith("studio_planning_settings");
      expect(mockSelect).toHaveBeenCalledWith("*");
    });

    it("should return null if no settings exist (PGRST116)", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "No rows returned" },
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const result = await getPlanningSettings();

      expect(result).toBeNull();
    });

    it("should throw error for other database errors", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "OTHER_ERROR", message: "Database error" },
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      await expect(getPlanningSettings()).rejects.toThrow();
    });
  });

  describe("updatePlanningSettings", () => {
    it("should update settings correctly", async () => {
      const mockUpdatedSettings = {
        id: "test-id",
        subscription_warning_days: 40,
        body_checkup_sessions: 5,
        payment_reminder_days: 27,
        max_sessions_per_week: 250,
        inactivity_months: 6,
        created_at: "2025-10-18T00:00:00Z",
        updated_at: new Date().toISOString(),
      };

      const mockEq = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValue({ data: mockUpdatedSettings, error: null }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      const result = await updatePlanningSettings("test-id", {
        subscription_warning_days: 40,
      });

      expect(result).toEqual(mockUpdatedSettings);
      expect(supabase.from).toHaveBeenCalledWith("studio_planning_settings");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_warning_days: 40,
          updated_at: expect.any(String),
        })
      );
      expect(mockEq).toHaveBeenCalledWith("id", "test-id");
    });

    it("should throw error if update fails", async () => {
      const mockEq = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Update failed" },
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      await expect(
        updatePlanningSettings("test-id", { subscription_warning_days: 40 })
      ).rejects.toThrow();
    });
  });

  describe("initializeDefaultSettings", () => {
    it("should return existing settings if they exist", async () => {
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

      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockSettings, error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const result = await initializeDefaultSettings();

      expect(result).toEqual(mockSettings);
    });

    it("should fetch settings if they don't exist initially", async () => {
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

      let callCount = 0;
      const mockSelect = vi.fn().mockImplementation(() => ({
        single: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // First call returns null (no settings found)
            return Promise.resolve({
              data: null,
              error: { code: "PGRST116", message: "No rows returned" },
            });
          } else {
            // Second call returns settings (fetched from migration)
            return Promise.resolve({ data: mockSettings, error: null });
          }
        }),
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const result = await initializeDefaultSettings();

      expect(result).toEqual(mockSettings);
      expect(mockSelect).toHaveBeenCalledTimes(2); // Called twice: check + fetch
    });
  });
});
