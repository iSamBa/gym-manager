// Member comments CRUD operations hooks (US-010)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMemberComments,
  fetchActiveCommentAlerts,
  createMemberComment,
  updateMemberComment,
  deleteMemberComment,
} from "@/features/database/lib/utils";
import type { MemberComment } from "@/features/database/lib/types";
import { toast } from "sonner";

/**
 * Fetch all comments for a member
 * Cached for 30 seconds
 */
export function useMemberComments(memberId: string) {
  return useQuery({
    queryKey: ["member-comments", memberId],
    queryFn: () => fetchMemberComments(memberId),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch active alerts (comments with future due dates) for a member
 * Auto-refreshes every minute to keep alerts current
 */
export function useActiveCommentAlerts(memberId: string) {
  return useQuery({
    queryKey: ["member-comment-alerts", memberId],
    queryFn: () => fetchActiveCommentAlerts(memberId),
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Create a new comment for a member
 * Invalidates queries and shows toast notifications
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMemberComment,
    onSuccess: (data) => {
      // Invalidate member comments query
      queryClient.invalidateQueries({
        queryKey: ["member-comments", data.member_id],
      });
      // Invalidate alerts if due date is set
      if (data.due_date) {
        queryClient.invalidateQueries({
          queryKey: ["member-comment-alerts", data.member_id],
        });
      }
      toast.success("Comment added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });
}

/**
 * Update an existing comment
 * Invalidates queries and shows toast notifications
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<MemberComment, "author" | "body" | "due_date">>;
    }) => updateMemberComment(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["member-comments", data.member_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["member-comment-alerts", data.member_id],
      });
      toast.success("Comment updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update comment: ${error.message}`);
    },
  });
}

/**
 * Delete a comment
 * Invalidates queries and shows toast notifications
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; memberId: string }) =>
      deleteMemberComment(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["member-comments", variables.memberId],
      });
      queryClient.invalidateQueries({
        queryKey: ["member-comment-alerts", variables.memberId],
      });
      toast.success("Comment deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete comment: ${error.message}`);
    },
  });
}
