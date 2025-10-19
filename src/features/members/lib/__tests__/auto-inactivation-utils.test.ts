/**
 * Auto-Inactivation Utilities Tests
 * Unit tests for automatic member inactivation functions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  runAutoInactivation,
  getInactivationCandidates,
  reactivateMember,
} from "../auto-inactivation-utils";
import { supabase } from "@/lib/supabase";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

// Mock date-utils
vi.mock("@/lib/date-utils", () => ({
  formatTimestampForDatabase: vi.fn(() => "2025-10-18T12:00:00.000Z"),
}));

describe("auto-inactivation-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runAutoInactivation", () => {
    it("returns result from database function", async () => {
      const mockResult = {
        inactivated_count: 3,
        member_ids: ["id-1", "id-2", "id-3"],
        member_names: ["John", "Jane", "Bob"],
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [mockResult],
        error: null,
      } as any);

      const result = await runAutoInactivation();

      expect(supabase.rpc).toHaveBeenCalledWith(
        "auto_inactivate_dormant_members"
      );
      expect(result).toEqual(mockResult);
    });

    it("returns empty result when no members inactivated", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await runAutoInactivation();

      expect(result).toEqual({
        inactivated_count: 0,
        member_ids: [],
        member_names: [],
      });
    });

    it("throws error when database operation fails", async () => {
      const mockError = new Error("Database error");
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(runAutoInactivation()).rejects.toThrow("Database error");
    });
  });

  describe("getInactivationCandidates", () => {
    it("returns list of candidates", async () => {
      const mockCandidates = [
        {
          member_id: "id-1",
          member_name: "John Doe",
          last_session_date: "2025-04-01",
          days_inactive: 200,
        },
        {
          member_id: "id-2",
          member_name: "Jane Smith",
          last_session_date: null,
          days_inactive: null,
        },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockCandidates,
        error: null,
      } as any);

      const result = await getInactivationCandidates();

      expect(supabase.rpc).toHaveBeenCalledWith("get_inactivation_candidates");
      expect(result).toEqual(mockCandidates);
    });

    it("returns empty array when no candidates", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await getInactivationCandidates();

      expect(result).toEqual([]);
    });

    it("throws error when database operation fails", async () => {
      const mockError = new Error("Database error");
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(getInactivationCandidates()).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("reactivateMember", () => {
    it("updates member status and adds comment", async () => {
      const memberId = "member-123";
      const adminName = "Admin User";

      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const mockInsert = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "members") return mockUpdate as any;
        if (table === "member_comments") return mockInsert as any;
        return {} as any;
      });

      await reactivateMember(memberId, adminName);

      expect(supabase.from).toHaveBeenCalledWith("members");
      expect(mockUpdate.update).toHaveBeenCalledWith({ status: "active" });
      expect(mockUpdate.eq).toHaveBeenCalledWith("id", memberId);

      expect(supabase.from).toHaveBeenCalledWith("member_comments");
      expect(mockInsert.insert).toHaveBeenCalledWith({
        member_id: memberId,
        body: expect.stringContaining("Member reactivated by Admin User"),
        created_by_system: false,
        created_at: "2025-10-18T12:00:00.000Z",
      });
    });

    it("throws error when update fails", async () => {
      const mockError = new Error("Update failed");
      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockUpdate as any);

      await expect(reactivateMember("member-123", "Admin")).rejects.toThrow(
        "Update failed"
      );
    });

    it("throws error when comment insertion fails", async () => {
      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const mockInsertError = new Error("Insert failed");
      const mockInsert = {
        insert: vi.fn().mockResolvedValue({ error: mockInsertError }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "members") return mockUpdate as any;
        if (table === "member_comments") return mockInsert as any;
        return {} as any;
      });

      await expect(reactivateMember("member-123", "Admin")).rejects.toThrow(
        "Insert failed"
      );
    });
  });
});
