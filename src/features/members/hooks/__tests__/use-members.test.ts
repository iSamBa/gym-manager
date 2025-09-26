import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createQueryWrapper } from "@/test/query-test-utils";

const mockMemberUtils = {
  getMembers: vi.fn(),
  getMemberById: vi.fn(),
  createMember: vi.fn(),
  updateMemberStatus: vi.fn(),
  deleteMember: vi.fn(),
  bulkUpdateStatus: vi.fn(),
};

vi.mock("@/features/database/lib/utils", () => ({
  memberUtils: mockMemberUtils,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "admin-user-id", email: "admin@example.com" },
    isAdmin: true,
    isLoading: false,
    error: null,
  }),
}));

const mockMember = {
  id: "test-id",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  status: "active",
};

describe("Members Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMembers", () => {
    it("should fetch members successfully", async () => {
      mockMemberUtils.getMembers.mockResolvedValue([mockMember]);
      const { useMembers } = await import("../use-members");

      const { result } = renderHook(() => useMembers(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([mockMember]);
    });

    it("should apply filters", async () => {
      const filters = { status: "active" };
      mockMemberUtils.getMembers.mockResolvedValue([mockMember]);
      const { useMembers } = await import("../use-members");

      renderHook(() => useMembers(filters), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(mockMemberUtils.getMembers).toHaveBeenCalledWith(filters);
      });
    });
  });

  describe("useMember", () => {
    it("should fetch single member", async () => {
      mockMemberUtils.getMemberById.mockResolvedValue(mockMember);
      const { useMember } = await import("../use-members");

      const { result } = renderHook(() => useMember("test-id"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockMember);
      });
    });
  });

  describe("useCreateMember", () => {
    it("should create member", async () => {
      const newData = {
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      };
      mockMemberUtils.createMember.mockResolvedValue({
        ...mockMember,
        ...newData,
      });
      const { useCreateMember } = await import("../use-members");

      const { result } = renderHook(() => useCreateMember(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync(newData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useUpdateMemberStatus", () => {
    it("should update member status", async () => {
      mockMemberUtils.updateMemberStatus.mockResolvedValue({
        ...mockMember,
        status: "suspended",
      });
      const { useUpdateMemberStatus } = await import("../use-members");

      const { result } = renderHook(() => useUpdateMemberStatus(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync({ id: "test-id", status: "suspended" });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useDeleteMember", () => {
    it("should delete member", async () => {
      mockMemberUtils.deleteMember.mockResolvedValue(undefined);
      const { useDeleteMember } = await import("../use-members");

      const { result } = renderHook(() => useDeleteMember(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync("test-id");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});
