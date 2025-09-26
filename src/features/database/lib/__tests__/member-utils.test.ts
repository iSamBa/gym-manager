import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Member } from "../types";

const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: "admin-user-id" } },
      error: null,
    }),
  },
};

vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabaseClient,
}));

// Remove this problematic mock

const mockMember: Member = {
  id: "test-id",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  status: "active",
  join_date: "2024-01-15",
};

describe("Member Utils Database Operations", () => {
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockMember, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    };

    // Mock admin user profile query for validateAdminAccess
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "admin-user-id", role: "admin" },
            error: null,
          }),
        };
      }
      return mockQuery;
    });
  });

  it("should get member by ID", async () => {
    mockQuery.order.mockResolvedValue({ data: [mockMember], error: null });
    const { memberUtils } = await import("../utils");

    const result = await memberUtils.getMemberById("test-id");

    expect(mockSupabaseClient.from).toHaveBeenCalledWith("members");
    expect(result).toEqual(mockMember);
  });

  it("should get all members", async () => {
    mockQuery.order.mockResolvedValue({ data: [mockMember], error: null });
    const { memberUtils } = await import("../utils");

    const result = await memberUtils.getMembers();

    expect(mockSupabaseClient.from).toHaveBeenCalledWith("members");
    expect(result).toEqual([mockMember]);
  });

  it("should create member", async () => {
    const { memberUtils } = await import("../utils");
    const newData = {
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
    };

    const result = await memberUtils.createMember(newData);

    expect(mockQuery.insert).toHaveBeenCalled();
    expect(result).toEqual(mockMember);
  });

  it("should update member", async () => {
    const { memberUtils } = await import("../utils");
    const updateData = { first_name: "Updated" };

    const result = await memberUtils.updateMember("test-id", updateData);

    expect(mockQuery.update).toHaveBeenCalled();
    expect(mockQuery.eq).toHaveBeenCalledWith("id", "test-id");
    expect(result).toEqual(mockMember);
  });

  it("should update member status", async () => {
    const { memberUtils } = await import("../utils");

    const result = await memberUtils.updateMemberStatus("test-id", "suspended");

    expect(mockQuery.update).toHaveBeenCalled();
    expect(result).toEqual(mockMember);
  });

  it("should search members", async () => {
    mockQuery.limit = vi
      .fn()
      .mockResolvedValue({ data: [mockMember], error: null });
    mockQuery.or.mockReturnValue(mockQuery);
    const { memberUtils } = await import("../utils");

    const result = await memberUtils.searchMembers("John");

    expect(mockQuery.or).toHaveBeenCalled();
    expect(result).toEqual([mockMember]);
  });
});
