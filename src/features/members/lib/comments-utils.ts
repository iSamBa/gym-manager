// Member comments operations and utilities (US-010)
import { supabase } from "@/lib/supabase";
import { DatabaseError } from "@/features/database/lib/query-helpers";
import type { MemberComment } from "@/features/database/lib/types";

/**
 * Fetch all comments for a specific member, ordered by creation date (newest first)
 */
export async function fetchMemberComments(
  memberId: string
): Promise<MemberComment[]> {
  const { data, error } = await supabase
    .from("member_comments")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) throw new DatabaseError(error.message, error.code);
  return data || [];
}

/**
 * Fetch comments with due dates in the future (active alerts)
 */
export async function fetchActiveCommentAlerts(
  memberId: string
): Promise<MemberComment[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("member_comments")
    .select("*")
    .eq("member_id", memberId)
    .gte("due_date", today)
    .order("due_date", { ascending: true });

  if (error) throw new DatabaseError(error.message, error.code);
  return data || [];
}

/**
 * Create a new comment for a member
 */
export async function createMemberComment(
  data: Omit<MemberComment, "id" | "created_at" | "updated_at">
): Promise<MemberComment> {
  const { data: comment, error } = await supabase
    .from("member_comments")
    .insert([data])
    .select()
    .single();

  if (error) throw new DatabaseError(error.message, error.code);
  if (!comment) throw new DatabaseError("Failed to create comment");
  return comment;
}

/**
 * Update an existing comment
 */
export async function updateMemberComment(
  id: string,
  data: Partial<Pick<MemberComment, "author" | "body" | "due_date">>
): Promise<MemberComment> {
  const { data: comment, error } = await supabase
    .from("member_comments")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new DatabaseError(error.message, error.code);
  if (!comment) throw new DatabaseError("Comment not found");
  return comment;
}

/**
 * Delete a comment
 */
export async function deleteMemberComment(id: string): Promise<void> {
  const { error } = await supabase
    .from("member_comments")
    .delete()
    .eq("id", id);

  if (error) throw new DatabaseError(error.message, error.code);
}
