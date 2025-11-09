import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchStudioSettings,
  fetchActiveSettings,
  fetchScheduledSettings,
  updateStudioSettings,
} from "../settings-api";
import { supabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date-utils";

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

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("fetchStudioSettings (deprecated)", () => {
    it("should fetch active settings by key (delegates to fetchActiveSettings)", async () => {
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
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = vi.fn().mockReturnValue({ or: mockOr });
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
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = vi.fn().mockReturnValue({ or: mockOr });
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
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = vi.fn().mockReturnValue({ or: mockOr });
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

  describe("fetchActiveSettings", () => {
    it("should fetch settings where effective_from is null or <= today", async () => {
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
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = vi.fn().mockReturnValue({ or: mockOr });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const result = await fetchActiveSettings("opening_hours");

      expect(supabase.from).toHaveBeenCalledWith("studio_settings");
      expect(result).toEqual(mockData);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith("setting_key", "opening_hours");
      expect(mockEq2).toHaveBeenCalledWith("is_active", true);
      expect(mockOr).toHaveBeenCalledWith(
        expect.stringContaining("effective_from.is.null")
      );
    });

    it("should return null when no active settings found", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockLimit = vi
        .fn()
        .mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = vi.fn().mockReturnValue({ or: mockOr });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const result = await fetchActiveSettings("opening_hours");

      expect(result).toBeNull();
    });
  });

  describe("fetchScheduledSettings", () => {
    it("should fetch settings where effective_from > today", async () => {
      const mockData = {
        id: "456",
        setting_key: "opening_hours",
        setting_value: {
          monday: { is_open: true, open_time: "10:00", close_time: "20:00" },
        },
        effective_from: "2025-11-01",
        is_active: true,
        created_at: "2025-10-16",
        updated_at: "2025-10-16",
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      const mockLimit = vi
        .fn()
        .mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockGt = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = vi.fn().mockReturnValue({ gt: mockGt });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const result = await fetchScheduledSettings("opening_hours");

      expect(supabase.from).toHaveBeenCalledWith("studio_settings");
      expect(result).toEqual(mockData);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith("setting_key", "opening_hours");
      expect(mockEq2).toHaveBeenCalledWith("is_active", true);
      expect(mockGt).toHaveBeenCalledWith(
        "effective_from",
        expect.stringContaining("2025")
      );
    });

    it("should return null when no scheduled settings found", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockLimit = vi
        .fn()
        .mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockGt = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = vi.fn().mockReturnValue({ gt: mockGt });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const result = await fetchScheduledSettings("opening_hours");

      expect(result).toBeNull();
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
        upsert: mockInsert,
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
      expect(mockInsert).toHaveBeenCalledWith(
        {
          setting_key: "opening_hours",
          setting_value: value,
          effective_from: "2025-02-01",
          created_by: "user123",
        },
        {
          onConflict: "setting_key,effective_from",
          ignoreDuplicates: false,
        }
      );
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
        upsert: mockInsert,
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

      expect(mockInsert).toHaveBeenCalledWith(
        {
          setting_key: "business_name",
          setting_value: { name: "My Gym" },
          effective_from: null,
          created_by: "user123",
        },
        {
          onConflict: "setting_key,effective_from",
          ignoreDuplicates: false,
        }
      );
      expect(result).toEqual(mockData);
    });

    it("should throw error on upsert failure", async () => {
      const mockUser = { id: "user123" };
      const mockError = new Error("Upsert failed");

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const mockUpsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
        select: mockSelect,
        single: mockSingle,
      } as never);

      mockUpsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await expect(
        updateStudioSettings("opening_hours", {}, new Date())
      ).rejects.toThrow("Upsert failed");
    });
  });

  describe("Timezone-safe date handling", () => {
    it("should use getLocalDateString() for date comparisons", async () => {
      // Set a known time
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-10-18T12:00:00Z"));

      const today = getLocalDateString();

      const mockData = {
        id: "tz-test-1",
        setting_key: "opening_hours",
        setting_value: { test: true },
        effective_from: "2025-10-20",
        is_active: true,
        created_at: "2025-10-18",
        updated_at: "2025-10-18",
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      const mockLimit = vi
        .fn()
        .mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockGt = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = vi.fn().mockReturnValue({ gt: mockGt });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      await fetchScheduledSettings("opening_hours");

      // Verify that the function uses the local date string, not UTC
      expect(mockGt).toHaveBeenCalledWith("effective_from", today);
    });

    it("should use getLocalDateString() for active settings with or() query", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-10-18T12:00:00Z"));

      const today = getLocalDateString();

      const mockData = {
        id: "tz-test-2",
        setting_key: "opening_hours",
        setting_value: { test: true },
        effective_from: "2025-10-15",
        is_active: true,
        created_at: "2025-10-15",
        updated_at: "2025-10-15",
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      const mockLimit = vi
        .fn()
        .mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = vi.fn().mockReturnValue({ or: mockOr });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      await fetchActiveSettings("opening_hours");

      // Verify that the function uses the local date string in the or() query
      expect(mockOr).toHaveBeenCalledWith(
        `effective_from.is.null,effective_from.lte.${today}`
      );
    });

    it("should use formatForDatabase() when updating settings", async () => {
      const mockUser = { id: "user123" };
      vi.useFakeTimers();
      const testDate = new Date("2025-11-01T10:00:00Z");
      vi.setSystemTime(testDate);

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: "test",
          setting_key: "test",
          setting_value: {},
          effective_from: "2025-11-01",
          is_active: true,
          created_at: "2025-11-01",
          updated_at: "2025-11-01",
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      } as never);

      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const effectiveDate = new Date("2025-11-01");
      await updateStudioSettings("test", {}, effectiveDate);

      // Verify formatForDatabase was used (returns local date string)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          effective_from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
        expect.anything()
      );
    });
  });
});
