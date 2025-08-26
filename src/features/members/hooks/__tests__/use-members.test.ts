import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createQueryWrapper } from "@/test/query-test-utils";

// Mock the database utils
const mockMemberUtils = {
  getMembers: vi.fn(),
  getMemberById: vi.fn(),
  createMember: vi.fn(),
  updateMember: vi.fn(),
  updateMemberStatus: vi.fn(),
  deleteMember: vi.fn(),
  bulkUpdateStatus: vi.fn(),
};

vi.mock("@/features/database/lib/utils", () => ({
  memberUtils: mockMemberUtils,
}));

// Mock console.error
const consoleErrorMock = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});

// Sample test data
const mockMember = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  status: "active",
  join_date: "2024-01-15",
  preferred_contact_method: "email",
  marketing_consent: true,
  waiver_signed: true,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

const mockMembers = [mockMember];

describe("Members Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorMock.mockClear();
  });

  describe("useMembers", () => {
    it("should fetch members list successfully", async () => {
      mockMemberUtils.getMembers.mockResolvedValue(mockMembers);

      // Dynamic import to ensure fresh module
      const { useMembers } = await import("../use-members");

      const { result } = renderHook(() => useMembers(), {
        wrapper: createQueryWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for the query to resolve
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check the results
      expect(result.current.data).toEqual(mockMembers);
      expect(result.current.isError).toBe(false);
      expect(mockMemberUtils.getMembers).toHaveBeenCalledWith({});
    });

    it("should apply filters when provided", async () => {
      const filters = { status: "active", search: "John" };
      mockMemberUtils.getMembers.mockResolvedValue([mockMember]);

      const { useMembers } = await import("../use-members");

      renderHook(() => useMembers(filters), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(mockMemberUtils.getMembers).toHaveBeenCalledWith(filters);
      });
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Failed to fetch members");
      mockMemberUtils.getMembers.mockRejectedValue(error);

      const { useMembers } = await import("../use-members");

      const { result } = renderHook(() => useMembers(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toEqual(error);
      });
    });
  });

  describe("useMember", () => {
    it("should fetch single member by ID", async () => {
      mockMemberUtils.getMemberById.mockResolvedValue(mockMember);

      const { useMember } = await import("../use-members");

      const { result } = renderHook(() => useMember(mockMember.id), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockMember);
      expect(mockMemberUtils.getMemberById).toHaveBeenCalledWith(mockMember.id);
    });

    it("should not fetch when ID is empty", async () => {
      const { useMember } = await import("../use-members");

      const { result } = renderHook(() => useMember(""), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockMemberUtils.getMemberById).not.toHaveBeenCalled();
    });
  });

  describe("useCreateMember", () => {
    it("should create new member successfully", async () => {
      const newMemberData = {
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      };
      const createdMember = { ...mockMember, ...newMemberData, id: "new-id" };

      mockMemberUtils.createMember.mockResolvedValue(createdMember);

      const { useCreateMember } = await import("../use-members");

      const { result } = renderHook(() => useCreateMember(), {
        wrapper: createQueryWrapper(),
      });

      // Execute the mutation
      await result.current.mutateAsync(newMemberData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockMemberUtils.createMember).toHaveBeenCalledWith(newMemberData);
    });

    it("should handle creation errors", async () => {
      const error = new Error("Failed to create member");
      const newMemberData = {
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      };

      mockMemberUtils.createMember.mockRejectedValue(error);

      const { useCreateMember } = await import("../use-members");

      const { result } = renderHook(() => useCreateMember(), {
        wrapper: createQueryWrapper(),
      });

      await expect(result.current.mutateAsync(newMemberData)).rejects.toThrow(
        "Failed to create member"
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("useUpdateMemberStatus", () => {
    it("should update member status successfully", async () => {
      const updatedMember = { ...mockMember, status: "suspended" };
      mockMemberUtils.updateMemberStatus.mockResolvedValue(updatedMember);

      const { useUpdateMemberStatus } = await import("../use-members");

      const { result } = renderHook(() => useUpdateMemberStatus(), {
        wrapper: createQueryWrapper(),
      });

      // Execute the mutation
      await result.current.mutateAsync({
        id: mockMember.id,
        status: "suspended",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockMemberUtils.updateMemberStatus).toHaveBeenCalledWith(
        mockMember.id,
        "suspended"
      );
    });
  });

  describe("useBulkUpdateMemberStatus", () => {
    it("should update multiple members status", async () => {
      const memberIds = [mockMember.id, "member-2"];
      const updatedMembers = mockMembers.map((m) => ({
        ...m,
        status: "suspended",
      }));

      mockMemberUtils.bulkUpdateStatus.mockResolvedValue(updatedMembers);

      const { useBulkUpdateMemberStatus } = await import("../use-members");

      const { result } = renderHook(() => useBulkUpdateMemberStatus(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync({
        memberIds,
        status: "suspended",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockMemberUtils.bulkUpdateStatus).toHaveBeenCalledWith(
        memberIds,
        "suspended"
      );
    });
  });

  describe("useDeleteMember", () => {
    it("should delete member successfully", async () => {
      mockMemberUtils.deleteMember.mockResolvedValue(undefined);

      const { useDeleteMember } = await import("../use-members");

      const { result } = renderHook(() => useDeleteMember(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync(mockMember.id);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockMemberUtils.deleteMember).toHaveBeenCalledWith(mockMember.id);
    });

    it("should handle delete errors", async () => {
      const error = new Error("Delete failed");
      mockMemberUtils.deleteMember.mockRejectedValue(error);

      const { useDeleteMember } = await import("../use-members");

      const { result } = renderHook(() => useDeleteMember(), {
        wrapper: createQueryWrapper(),
      });

      await expect(result.current.mutateAsync(mockMember.id)).rejects.toThrow(
        "Delete failed"
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});

describe("memberKeys", () => {
  it("should generate correct query keys", async () => {
    const { memberKeys } = await import("../use-members");

    expect(memberKeys.all).toEqual(["members"]);
    expect(memberKeys.lists()).toEqual(["members", "list"]);
    expect(memberKeys.list({ status: "active" })).toEqual([
      "members",
      "list",
      { status: "active" },
    ]);
    expect(memberKeys.details()).toEqual(["members", "detail"]);
    expect(memberKeys.detail("123")).toEqual(["members", "detail", "123"]);
    expect(memberKeys.search("query")).toEqual(["members", "search", "query"]);
    expect(memberKeys.count()).toEqual(["members", "count"]);
    expect(memberKeys.countByStatus()).toEqual([
      "members",
      "count",
      "by-status",
    ]);
    expect(memberKeys.newThisMonth()).toEqual(["members", "new-this-month"]);
    expect(memberKeys.withSubscription("123")).toEqual([
      "members",
      "detail",
      "123",
      "with-subscription",
    ]);
  });
});
