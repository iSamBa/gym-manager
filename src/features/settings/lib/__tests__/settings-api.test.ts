import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchStudioSettings, updateStudioSettings } from "../settings-api";
import { supabase } from "@/lib/supabase";

// Mock the supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe("settings-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchStudioSettings", () => {
    it("should fetch active settings by key", async () => {
      const mockData = {
        id: "123",
        setting_key: "opening_hours",
        setting_value: {
          monday: { is_open: true, open_time: "09:00", close_time: "21:00" },
        },
        effective_from: "2025-01-01",
        is_active: true,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      const mockLimit = vi
        .fn()
        .mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const result = await fetchStudioSettings("opening_hours");

      expect(supabase.from).toHaveBeenCalledWith("studio_settings");
      expect(result).toEqual(mockData);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith("setting_key", "opening_hours");
      expect(mockEq2).toHaveBeenCalledWith("is_active", true);
    });

    it("should return null when no settings found", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockLimit = vi
        .fn()
        .mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const result = await fetchStudioSettings("opening_hours");

      expect(result).toBeNull();
    });

    it("should throw error on database error", async () => {
      const mockError = new Error("Database error");
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      const mockLimit = vi
        .fn()
        .mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      await expect(fetchStudioSettings("opening_hours")).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("updateStudioSettings", () => {
    it("should create new settings entry with effective date", async () => {
      const mockUser = { id: "user123" };
      const mockData = {
        id: "456",
        setting_key: "opening_hours",
        setting_value: { monday: { is_open: true } },
        effective_from: "2025-02-01",
        is_active: true,
        created_by: "user123",
        created_at: "2025-01-15",
        updated_at: "2025-01-15",
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      } as never);

      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const effectiveDate = new Date("2025-02-01");
      const value = { monday: { is_open: true } };

      const result = await updateStudioSettings(
        "opening_hours",
        value,
        effectiveDate
      );

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith("studio_settings");
      expect(mockInsert).toHaveBeenCalledWith({
        setting_key: "opening_hours",
        setting_value: value,
        effective_from: "2025-02-01",
        created_by: "user123",
      });
      expect(result).toEqual(mockData);
    });

    it("should create settings with null effective date for immediate effect", async () => {
      const mockUser = { id: "user123" };
      const mockData = {
        id: "789",
        setting_key: "business_name",
        setting_value: { name: "My Gym" },
        effective_from: null,
        is_active: true,
        created_by: "user123",
        created_at: "2025-01-15",
        updated_at: "2025-01-15",
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      } as never);

      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const result = await updateStudioSettings(
        "business_name",
        { name: "My Gym" },
        null
      );

      expect(mockInsert).toHaveBeenCalledWith({
        setting_key: "business_name",
        setting_value: { name: "My Gym" },
        effective_from: null,
        created_by: "user123",
      });
      expect(result).toEqual(mockData);
    });

    it("should throw error on insert failure", async () => {
      const mockUser = { id: "user123" };
      const mockError = new Error("Insert failed");

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      } as never);

      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await expect(
        updateStudioSettings("opening_hours", {}, new Date())
      ).rejects.toThrow("Insert failed");
    });
  });
});
