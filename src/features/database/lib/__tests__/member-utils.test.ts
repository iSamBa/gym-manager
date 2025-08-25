import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Member, MemberStatus } from "../types";

// Mock the Supabase client directly at the module level
const mockSupabaseClient = {
  from: vi.fn(),
};

// Mock the supabase module that utils.ts imports
vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabaseClient,
}));

// Mock console.error to avoid noise in tests
const consoleErrorMock = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});

// Import the utils after mocks are set up to ensure proper mock application
let memberUtils: typeof import("../utils").memberUtils;

// Sample test data
const mockMember: Member = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  member_number: "MEM001",
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  phone: "+1234567890",
  date_of_birth: "1990-01-01",
  gender: "male",
  address: {
    street: "123 Main St",
    city: "Anytown",
    state: "CA",
    postal_code: "12345",
    country: "USA",
  },
  profile_picture_url: null,
  status: "active",
  join_date: "2024-01-15",
  notes: "Test member",
  medical_conditions: null,
  fitness_goals: "Weight loss",
  preferred_contact_method: "email",
  marketing_consent: true,
  waiver_signed: true,
  waiver_signed_date: "2024-01-15",
  created_by: null,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

// Type for the mock query object with chainable methods
type MockQueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  then?: ReturnType<typeof vi.fn>;
};

describe("Member Utils Database Operations", () => {
  // Create chainable mock functions
  let mockQuery: MockQueryBuilder;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    consoleErrorMock.mockClear();

    // Create a chainable mock query object with proper chaining
    mockQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      or: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      range: vi.fn(),
      limit: vi.fn(),
      order: vi.fn(),
      single: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      neq: vi.fn(),
      not: vi.fn(),
    };

    // Manually set up chaining - each method returns the mockQuery object
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.in.mockReturnValue(mockQuery);
    mockQuery.or.mockReturnValue(mockQuery);
    mockQuery.gte.mockReturnValue(mockQuery);
    mockQuery.lte.mockReturnValue(mockQuery);
    mockQuery.range.mockReturnValue(mockQuery);
    mockQuery.limit.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.insert.mockReturnValue(mockQuery);
    mockQuery.update.mockReturnValue(mockQuery);
    mockQuery.delete.mockReturnValue(mockQuery);
    mockQuery.neq.mockReturnValue(mockQuery);
    mockQuery.not.mockReturnValue(mockQuery);
    // Note: single() doesn't return mockQuery - it's a terminal method

    // Setup mockSupabaseClient.from to return our chainable mock
    mockSupabaseClient.from.mockReturnValue(mockQuery);

    // Make mockQuery thenable with a default successful response
    mockQuery.then = vi.fn().mockImplementation((resolve, reject) => {
      return Promise.resolve({ data: [mockMember], error: null }).then(
        resolve,
        reject
      );
    });

    // Import utils after mock setup and module reset
    const utils = await import("../utils");
    memberUtils = utils.memberUtils;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getMemberById", () => {
    it("should fetch a single member by ID", async () => {
      mockQuery.single.mockResolvedValue({
        data: mockMember,
        error: null,
      });

      const result = await memberUtils.getMemberById(mockMember.id);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("members");
      expect(mockQuery.select).toHaveBeenCalledWith("*");
      expect(mockQuery.eq).toHaveBeenCalledWith("id", mockMember.id);
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual(mockMember);
    });

    it("should throw error when member not found", async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: "Member not found", code: "PGRST116" },
      });

      await expect(memberUtils.getMemberById("nonexistent-id")).rejects.toThrow(
        "Member not found"
      );
    });
  });

  describe("getMembers", () => {
    it("should fetch all members with default filters", async () => {
      mockQuery.order.mockResolvedValue({
        data: [mockMember],
        error: null,
      });

      const result = await memberUtils.getMembers();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("members");
      expect(mockQuery.select).toHaveBeenCalledWith("*");
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
      expect(result).toEqual([mockMember]);
    });

    it("should apply status filter", async () => {
      const result = await memberUtils.getMembers({ status: "active" });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("members");
      expect(mockQuery.select).toHaveBeenCalledWith("*");
      expect(mockQuery.eq).toHaveBeenCalledWith("status", "active");
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
      expect(result).toEqual([mockMember]);
    });

    it("should apply search filter", async () => {
      const result = await memberUtils.getMembers({ search: "John" });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("members");
      expect(mockQuery.select).toHaveBeenCalledWith("*");
      expect(mockQuery.or).toHaveBeenCalledWith(
        "first_name.ilike.%John%,last_name.ilike.%John%,email.ilike.%John%,member_number.ilike.%John%"
      );
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
      expect(result).toEqual([mockMember]);
    });

    it("should apply pagination", async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockMember],
        error: null,
      });

      const { memberUtils } = await import("../utils");
      await memberUtils.getMembers({ offset: 10, limit: 20 });

      expect(mockQuery.range).toHaveBeenCalledWith(10, 29); // offset + limit - 1
    });
  });

  describe("createMember", () => {
    it("should create a new member with defaults", async () => {
      const newMember = {
        ...mockMember,
        id: "new-id",
        member_number: "MEM999",
      };
      mockQuery.single.mockResolvedValue({
        data: newMember,
        error: null,
      });

      const { memberUtils } = await import("../utils");
      const createData = {
        member_number: "MEM999",
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      };

      const result = await memberUtils.createMember(createData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("members");
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createData,
          status: "active",
          preferred_contact_method: "email",
          marketing_consent: false,
          waiver_signed: false,
          join_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      );
      expect(result).toEqual(newMember);
    });
  });

  describe("updateMember", () => {
    it("should update member with provided data", async () => {
      const updatedMember = { ...mockMember, first_name: "Updated" };
      mockQuery.single.mockResolvedValue({
        data: updatedMember,
        error: null,
      });

      const { memberUtils } = await import("../utils");
      const updateData = { first_name: "Updated" };

      const result = await memberUtils.updateMember(mockMember.id, updateData);

      expect(mockQuery.update).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      });
      expect(mockQuery.eq).toHaveBeenCalledWith("id", mockMember.id);
      expect(result).toEqual(updatedMember);
    });
  });

  describe("updateMemberStatus", () => {
    it("should update member status", async () => {
      const updatedMember = {
        ...mockMember,
        status: "suspended" as MemberStatus,
      };
      mockQuery.single.mockResolvedValue({
        data: updatedMember,
        error: null,
      });

      const { memberUtils } = await import("../utils");
      const result = await memberUtils.updateMemberStatus(
        mockMember.id,
        "suspended"
      );

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: "suspended",
        updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      });
      expect(result).toEqual(updatedMember);
    });
  });

  describe("searchMembers", () => {
    it("should return empty array for short queries", async () => {
      const { memberUtils } = await import("../utils");
      const result = await memberUtils.searchMembers("a");

      expect(result).toEqual([]);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it("should search members with valid query", async () => {
      mockQuery.limit.mockResolvedValue({
        data: [mockMember],
        error: null,
      });

      const { memberUtils } = await import("../utils");
      const result = await memberUtils.searchMembers("John");

      expect(mockQuery.or).toHaveBeenCalledWith(
        "first_name.ilike.%John%,last_name.ilike.%John%,email.ilike.%John%,member_number.ilike.%John%"
      );
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(result).toEqual([mockMember]);
    });
  });

  describe("bulkUpdateStatus", () => {
    it("should update multiple members status", async () => {
      const memberIds = ["id1", "id2"];
      const updatedMembers = [mockMember, { ...mockMember, id: "id2" }];

      mockQuery.select.mockResolvedValue({
        data: updatedMembers,
        error: null,
      });

      const { memberUtils } = await import("../utils");
      const result = await memberUtils.bulkUpdateStatus(memberIds, "suspended");

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: "suspended",
        updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      });
      expect(mockQuery.in).toHaveBeenCalledWith("id", memberIds);
      expect(result).toEqual(updatedMembers);
    });
  });

  describe("deleteMember", () => {
    it("should delete member by ID", async () => {
      // For delete operations, we need to mock the final resolved value
      // The delete operation typically returns null data, which is fine
      mockQuery.eq.mockResolvedValue({
        data: [], // DELETE operations often return empty array instead of null
        error: null,
      });

      const { memberUtils } = await import("../utils");
      await memberUtils.deleteMember(mockMember.id);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("members");
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith("id", mockMember.id);
    });
  });

  describe("getMemberCount", () => {
    it("should return total member count", async () => {
      mockQuery.select.mockResolvedValue({
        count: 42,
        error: null,
      });

      const { memberUtils } = await import("../utils");
      const result = await memberUtils.getMemberCount();

      expect(mockQuery.select).toHaveBeenCalledWith("*", {
        count: "exact",
        head: true,
      });
      expect(result).toBe(42);
    });
  });

  describe("checkMemberNumberExists", () => {
    it("should return true when member number exists", async () => {
      mockQuery.eq.mockResolvedValue({
        data: mockMember,
        error: null,
      });

      const { memberUtils } = await import("../utils");
      const result = await memberUtils.checkMemberNumberExists("MEM001");

      expect(mockQuery.select).toHaveBeenCalledWith("id", { head: true });
      expect(mockQuery.eq).toHaveBeenCalledWith("member_number", "MEM001");
      expect(result).toBe(true);
    });

    it("should throw error when member number does not exist", async () => {
      // When member doesn't exist, Supabase returns null data
      mockQuery.eq.mockResolvedValue({
        data: null,
        error: null,
      });

      const { memberUtils } = await import("../utils");

      await expect(
        memberUtils.checkMemberNumberExists("NONEXISTENT")
      ).rejects.toThrow("No data returned from query");
    });

    it("should throw error when member number does not exist after exclusion", async () => {
      // When member doesn't exist after exclusion, Supabase returns null data
      mockQuery.neq.mockResolvedValue({
        data: null,
        error: null,
      });

      const { memberUtils } = await import("../utils");

      await expect(
        memberUtils.checkMemberNumberExists("MEM001", "exclude-id")
      ).rejects.toThrow("No data returned from query");
      expect(mockQuery.eq).toHaveBeenCalledWith("member_number", "MEM001");
      expect(mockQuery.neq).toHaveBeenCalledWith("id", "exclude-id");
    });
  });

  describe("checkEmailExists", () => {
    it("should return true when email exists", async () => {
      mockQuery.eq.mockResolvedValue({
        data: mockMember,
        error: null,
      });

      const { memberUtils } = await import("../utils");
      const result = await memberUtils.checkEmailExists("john.doe@example.com");

      expect(mockQuery.eq).toHaveBeenCalledWith(
        "email",
        "john.doe@example.com"
      );
      expect(result).toBe(true);
    });

    it("should throw error when email does not exist", async () => {
      // When email doesn't exist, Supabase returns null data
      mockQuery.eq.mockResolvedValue({
        data: null,
        error: null,
      });

      const { memberUtils } = await import("../utils");

      await expect(
        memberUtils.checkEmailExists("JOHN.DOE@EXAMPLE.COM")
      ).rejects.toThrow("No data returned from query");
      expect(mockQuery.eq).toHaveBeenCalledWith(
        "email",
        "john.doe@example.com"
      );
    });
  });
});
