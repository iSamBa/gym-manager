import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createQueryWrapper } from "@/test/query-test-utils";
import type { MemberComment } from "@/features/database/lib/types";

// Mock database utilities
const mockCommentUtils = {
  fetchMemberComments: vi.fn(),
  fetchActiveCommentAlerts: vi.fn(),
  createMemberComment: vi.fn(),
  updateMemberComment: vi.fn(),
  deleteMemberComment: vi.fn(),
};

vi.mock("@/features/members/lib/comments-utils", () => ({
  fetchMemberComments: (memberId: string) =>
    mockCommentUtils.fetchMemberComments(memberId),
  fetchActiveCommentAlerts: (memberId: string) =>
    mockCommentUtils.fetchActiveCommentAlerts(memberId),
  createMemberComment: (data: unknown) =>
    mockCommentUtils.createMemberComment(data),
  updateMemberComment: (id: string, data: unknown) =>
    mockCommentUtils.updateMemberComment(id, data),
  deleteMemberComment: (id: string) => mockCommentUtils.deleteMemberComment(id),
}));

// Mock toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock("sonner", () => ({
  toast: mockToast,
}));

const mockComment: MemberComment = {
  id: "comment-1",
  member_id: "member-1",
  author: "Test Author",
  body: "This is a test comment",
  due_date: "2025-12-31",
  created_by: "user-1",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("Member Comments Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMemberComments", () => {
    it("should fetch comments for a member", async () => {
      mockCommentUtils.fetchMemberComments.mockResolvedValue([mockComment]);
      const { useMemberComments } = await import("../use-member-comments");

      const { result } = renderHook(() => useMemberComments("member-1"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([mockComment]);
      expect(mockCommentUtils.fetchMemberComments).toHaveBeenCalledWith(
        "member-1"
      );
    });

    it("should return empty array when no comments", async () => {
      mockCommentUtils.fetchMemberComments.mockResolvedValue([]);
      const { useMemberComments } = await import("../use-member-comments");

      const { result } = renderHook(() => useMemberComments("member-1"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should handle fetch errors gracefully", async () => {
      mockCommentUtils.fetchMemberComments.mockRejectedValue(
        new Error("Fetch failed")
      );
      const { useMemberComments } = await import("../use-member-comments");

      const { result } = renderHook(() => useMemberComments("member-1"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useActiveCommentAlerts", () => {
    it("should fetch only comments with future due dates", async () => {
      const alertComment: MemberComment = {
        ...mockComment,
        due_date: "2025-12-31",
      };
      mockCommentUtils.fetchActiveCommentAlerts.mockResolvedValue([
        alertComment,
      ]);
      const { useActiveCommentAlerts } = await import("../use-member-comments");

      const { result } = renderHook(() => useActiveCommentAlerts("member-1"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([alertComment]);
      expect(mockCommentUtils.fetchActiveCommentAlerts).toHaveBeenCalledWith(
        "member-1"
      );
    });

    it("should return empty array when no active alerts", async () => {
      mockCommentUtils.fetchActiveCommentAlerts.mockResolvedValue([]);
      const { useActiveCommentAlerts } = await import("../use-member-comments");

      const { result } = renderHook(() => useActiveCommentAlerts("member-1"), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe("useCreateComment", () => {
    it("should create comment successfully", async () => {
      const newCommentData = {
        member_id: "member-1",
        author: "Test Author",
        body: "New comment",
        due_date: "2025-12-31",
        created_by: "user-1",
      };
      mockCommentUtils.createMemberComment.mockResolvedValue({
        ...mockComment,
        ...newCommentData,
      });
      const { useCreateComment } = await import("../use-member-comments");

      const { result } = renderHook(() => useCreateComment(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync(newCommentData);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          "Comment added successfully"
        );
      });

      expect(mockCommentUtils.createMemberComment).toHaveBeenCalledWith(
        newCommentData
      );
    });

    it("should show error toast on failure", async () => {
      mockCommentUtils.createMemberComment.mockRejectedValue(
        new Error("Creation failed")
      );
      const { useCreateComment } = await import("../use-member-comments");

      const { result } = renderHook(() => useCreateComment(), {
        wrapper: createQueryWrapper(),
      });

      try {
        await result.current.mutateAsync({
          member_id: "member-1",
          author: "Test",
          body: "Test",
        });
      } catch (error) {
        // Expected to fail
      }

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
    });
  });

  describe("useUpdateComment", () => {
    it("should update comment successfully", async () => {
      const updatedData = {
        author: "Updated Author",
        body: "Updated comment",
        due_date: "2026-01-15",
      };
      mockCommentUtils.updateMemberComment.mockResolvedValue({
        ...mockComment,
        ...updatedData,
      });
      const { useUpdateComment } = await import("../use-member-comments");

      const { result } = renderHook(() => useUpdateComment(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync({
        id: "comment-1",
        data: updatedData,
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          "Comment updated successfully"
        );
      });

      expect(mockCommentUtils.updateMemberComment).toHaveBeenCalledWith(
        "comment-1",
        updatedData
      );
    });

    it("should show error toast on failure", async () => {
      mockCommentUtils.updateMemberComment.mockRejectedValue(
        new Error("Update failed")
      );
      const { useUpdateComment } = await import("../use-member-comments");

      const { result } = renderHook(() => useUpdateComment(), {
        wrapper: createQueryWrapper(),
      });

      try {
        await result.current.mutateAsync({
          id: "comment-1",
          data: { body: "Test" },
        });
      } catch (error) {
        // Expected to fail
      }

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
    });
  });

  describe("useDeleteComment", () => {
    it("should delete comment successfully", async () => {
      mockCommentUtils.deleteMemberComment.mockResolvedValue(undefined);
      const { useDeleteComment } = await import("../use-member-comments");

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync({
        id: "comment-1",
        memberId: "member-1",
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          "Comment deleted successfully"
        );
      });

      expect(mockCommentUtils.deleteMemberComment).toHaveBeenCalledWith(
        "comment-1"
      );
    });

    it("should show error toast on failure", async () => {
      mockCommentUtils.deleteMemberComment.mockRejectedValue(
        new Error("Delete failed")
      );
      const { useDeleteComment } = await import("../use-member-comments");

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: createQueryWrapper(),
      });

      try {
        await result.current.mutateAsync({
          id: "comment-1",
          memberId: "member-1",
        });
      } catch (error) {
        // Expected to fail
      }

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
    });
  });
});
