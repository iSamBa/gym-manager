"use client";

import { memo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Edit, Trash, Plus } from "lucide-react";
import { useMemberComments, useDeleteComment } from "@/features/members/hooks";
import type {
  MemberComment,
  MemberWithSubscription,
} from "@/features/database/lib/types";
import { CommentDialog } from "./CommentDialog";
import { format } from "date-fns";

interface MemberCommentsCardProps {
  member: MemberWithSubscription;
}

export const MemberCommentsCard = memo(function MemberCommentsCard({
  member,
}: MemberCommentsCardProps) {
  const { data: comments, isLoading } = useMemberComments(member.id);
  const deleteComment = useDeleteComment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingComment, setEditingComment] = useState<
    MemberComment | undefined
  >();

  const handleAddComment = useCallback(() => {
    setDialogMode("add");
    setEditingComment(undefined);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((comment: MemberComment) => {
    setEditingComment(comment);
    setDialogMode("edit");
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (confirm("Are you sure you want to delete this comment?")) {
        await deleteComment.mutateAsync({ id: commentId, memberId: member.id });
      }
    },
    [member.id, deleteComment]
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Comments & Notes
            </span>
            <Button size="sm" onClick={handleAddComment}>
              <Plus className="mr-2 h-4 w-4" />
              Add Comment
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground text-sm">
                Loading comments...
              </p>
            </div>
          ) : comments?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="text-muted-foreground mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">No comments yet</p>
              <p className="text-muted-foreground text-xs">
                Add a comment to track notes or set reminders
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments?.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onEdit={() => handleEdit(comment)}
                  onDelete={() => handleDelete(comment.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CommentDialog
        member={member}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        comment={editingComment}
      />
    </>
  );
});

// Comment item component
interface CommentItemProps {
  comment: MemberComment;
  onEdit: () => void;
  onDelete: () => void;
}

const CommentItem = memo(function CommentItem({
  comment,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  const isDueSoon = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 3 && diffDays >= 0;
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{comment.author}</span>
          <span className="text-muted-foreground text-xs">•</span>
          <span className="text-muted-foreground text-xs">
            {formatDateTime(comment.created_at)}
          </span>
          {comment.due_date && (
            <Badge
              variant={
                isDueSoon(comment.due_date) ? "destructive" : "secondary"
              }
            >
              Due: {formatDate(comment.due_date)}
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit comment</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete comment</span>
          </Button>
        </div>
      </div>
      <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
    </div>
  );
});
