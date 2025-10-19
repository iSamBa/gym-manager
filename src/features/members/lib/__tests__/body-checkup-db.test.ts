/**
 * Body Checkup Database Utilities Tests
 * Test suite for body checkup CRUD operations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getBodyCheckups,
  getLatestBodyCheckup,
  createBodyCheckup,
  updateBodyCheckup,
  deleteBodyCheckup,
  getBodyCheckupCount,
} from "../body-checkup-db";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe("Body Checkup Database Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBodyCheckups", () => {
    it("should fetch all body checkups for a member", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockData = [
        {
          id: "1",
          member_id: "member-1",
          checkup_date: "2025-10-18",
          weight: 75.5,
          notes: "Test note",
          created_at: "2025-10-18T12:00:00Z",
          created_by: null,
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getBodyCheckups("member-1");

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith("member_body_checkups");
    });

    it("should throw error on database failure", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockError = new Error("Database error");

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(getBodyCheckups("member-1")).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getLatestBodyCheckup", () => {
    it("should fetch the latest body checkup using RPC", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockData = [
        {
          id: "1",
          member_id: "member-1",
          checkup_date: "2025-10-18",
          weight: 75.5,
          notes: null,
          created_at: "2025-10-18T12:00:00Z",
          created_by: null,
        },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await getLatestBodyCheckup("member-1");

      expect(result).toEqual(mockData[0]);
      expect(supabase.rpc).toHaveBeenCalledWith("get_latest_body_checkup", {
        p_member_id: "member-1",
      });
    });

    it("should return null when no checkups exist", async () => {
      const { supabase } = await import("@/lib/supabase");

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await getLatestBodyCheckup("member-1");

      expect(result).toBeNull();
    });
  });

  describe("createBodyCheckup", () => {
    it("should create a new body checkup", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockInput = {
        member_id: "member-1",
        checkup_date: "2025-10-18",
        weight: 75.5,
        notes: "First checkup",
        created_by: "user-1",
      };
      const mockData = {
        id: "1",
        ...mockInput,
        created_at: "2025-10-18T12:00:00Z",
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await createBodyCheckup(mockInput);

      expect(result).toEqual(mockData);
    });

    it("should throw user-friendly error on duplicate date", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockInput = {
        member_id: "member-1",
        checkup_date: "2025-10-18",
        weight: 75.5,
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "23505", message: "Unique constraint violation" },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(createBodyCheckup(mockInput)).rejects.toThrow(
        "A body checkup already exists for this date"
      );
    });
  });

  describe("updateBodyCheckup", () => {
    it("should update an existing body checkup", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockUpdates = {
        weight: 76.0,
        notes: "Updated note",
      };
      const mockData = {
        id: "1",
        member_id: "member-1",
        checkup_date: "2025-10-18",
        ...mockUpdates,
        created_at: "2025-10-18T12:00:00Z",
        created_by: null,
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await updateBodyCheckup("1", mockUpdates);

      expect(result).toEqual(mockData);
    });

    it("should throw user-friendly error on duplicate date during update", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "23505", message: "Unique constraint violation" },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(
        updateBodyCheckup("1", { checkup_date: "2025-10-17" })
      ).rejects.toThrow("A body checkup already exists for this date");
    });
  });

  describe("deleteBodyCheckup", () => {
    it("should delete a body checkup", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(deleteBodyCheckup("1")).resolves.toBeUndefined();
    });

    it("should throw error on deletion failure", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockError = new Error("Deletion failed");

      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(deleteBodyCheckup("1")).rejects.toThrow("Deletion failed");
    });
  });

  describe("getBodyCheckupCount", () => {
    it("should return the count of body checkups for a member", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getBodyCheckupCount("member-1");

      expect(result).toBe(5);
    });

    it("should return 0 when count is null", async () => {
      const { supabase } = await import("@/lib/supabase");
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getBodyCheckupCount("member-1");

      expect(result).toBe(0);
    });
  });
});
