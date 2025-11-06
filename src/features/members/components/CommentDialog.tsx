"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { useCreateComment, useUpdateComment } from "@/features/members/hooks";
import type {
  MemberComment,
  MemberWithSubscription,
} from "@/features/database/lib/types";
import { toast } from "sonner";
import { getStartOfDay, formatForDatabase } from "@/lib/date-utils";

import { logger } from "@/lib/logger";
interface CommentDialogProps {
  member: MemberWithSubscription;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  comment?: MemberComment;
}

export function CommentDialog({
  member,
  isOpen,
  onOpenChange,
  mode,
  comment,
}: CommentDialogProps) {
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();

  const [formData, setFormData] = useState({
    author: "",
    body: "",
    due_date: undefined as Date | undefined,
  });

  // Initialize form data for edit mode
  useEffect(() => {
    if (mode === "edit" && comment) {
      setFormData({
        author: comment.author,
        body: comment.body,
        due_date: comment.due_date ? new Date(comment.due_date) : undefined,
      });
    } else {
      // Reset for add mode
      setFormData({
        author: "",
        body: "",
        due_date: undefined,
      });
    }
  }, [mode, comment, isOpen]);

  const isValid = () => {
    if (!formData.author.trim()) {
      return false;
    }
    if (formData.body.trim().length < 10) {
      return false;
    }
    // If due date is set, must be today or future
    if (formData.due_date) {
      const today = getStartOfDay();
      if (formData.due_date < today) {
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    // Validation
    if (!formData.author.trim()) {
      toast.error("Author name is required");
      return;
    }

    if (formData.body.trim().length < 10) {
      toast.error("Comment must be at least 10 characters");
      return;
    }

    // Check due date is not in the past
    if (formData.due_date) {
      const today = getStartOfDay();
      if (formData.due_date < today) {
        toast.error("Due date must be today or in the future");
        return;
      }
    }

    try {
      if (mode === "add") {
        await createComment.mutateAsync({
          member_id: member.id,
          author: formData.author.trim(),
          body: formData.body.trim(),
          due_date: formData.due_date
            ? formatForDatabase(formData.due_date)
            : undefined,
          created_by: undefined,
        });
      } else if (comment) {
        await updateComment.mutateAsync({
          id: comment.id,
          data: {
            author: formData.author.trim(),
            body: formData.body.trim(),
            due_date: formData.due_date
              ? formatForDatabase(formData.due_date)
              : undefined,
          },
        });
      }

      onOpenChange(false);
    } catch (error) {
      // Error toast is handled by the mutation hooks
      logger.error("Failed to save comment:", { error });
    }
  };

  const isLoading = createComment.isPending || updateComment.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Comment" : "Edit Comment"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) =>
                setFormData({ ...formData, author: e.target.value })
              }
              placeholder="Your name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Comment *</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              placeholder="Enter your comment... (minimum 10 characters)"
              rows={4}
              disabled={isLoading}
              className="resize-none"
            />
            <p className="text-muted-foreground text-xs">
              {formData.body.trim().length} / 10 characters minimum
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date (Optional)</Label>
            <DatePicker
              value={formData.due_date}
              onChange={(date) => setFormData({ ...formData, due_date: date })}
              placeholder="Set a reminder date"
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-xs">
              If set, this comment will appear as an alert until the due date
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid() || isLoading}>
            {isLoading
              ? "Saving..."
              : mode === "add"
                ? "Add Comment"
                : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
