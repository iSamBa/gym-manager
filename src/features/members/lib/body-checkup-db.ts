/**
 * Body Checkup Database Utilities
 * Functions for managing member body checkup records (CRUD operations)
 */

import { supabase } from "@/lib/supabase";
import type { BodyCheckup, CreateBodyCheckupInput } from "./types";

/**
 * Get all body checkups for a member
 * @param memberId - Member UUID
 * @returns Array of body checkups ordered by date (newest first)
 * @throws Error if database query fails
 */
export async function getBodyCheckups(
  memberId: string
): Promise<BodyCheckup[]> {
  const { data, error } = await supabase
    .from("member_body_checkups")
    .select("*")
    .eq("member_id", memberId)
    .order("checkup_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get the latest body checkup for a member
 * @param memberId - Member UUID
 * @returns Latest body checkup or null if none exist
 * @throws Error if database query fails
 */
export async function getLatestBodyCheckup(
  memberId: string
): Promise<BodyCheckup | null> {
  const { data, error } = await supabase.rpc("get_latest_body_checkup", {
    p_member_id: memberId,
  });

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Create a new body checkup record
 * @param input - Body checkup data
 * @returns Created body checkup record
 * @throws Error if creation fails or duplicate date exists
 */
export async function createBodyCheckup(
  input: CreateBodyCheckupInput
): Promise<BodyCheckup> {
  const { data, error } = await supabase
    .from("member_body_checkups")
    .insert({
      member_id: input.member_id,
      checkup_date: input.checkup_date,
      weight: input.weight,
      notes: input.notes,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation (duplicate date)
    if (error.code === "23505") {
      throw new Error(
        "A body checkup already exists for this date. Please choose a different date."
      );
    }
    throw error;
  }

  return data;
}

/**
 * Update an existing body checkup record
 * @param id - Body checkup UUID
 * @param updates - Partial body checkup data to update
 * @returns Updated body checkup record
 * @throws Error if update fails or record not found
 */
export async function updateBodyCheckup(
  id: string,
  updates: Partial<CreateBodyCheckupInput>
): Promise<BodyCheckup> {
  const { data, error } = await supabase
    .from("member_body_checkups")
    .update({
      checkup_date: updates.checkup_date,
      weight: updates.weight,
      notes: updates.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation
    if (error.code === "23505") {
      throw new Error(
        "A body checkup already exists for this date. Please choose a different date."
      );
    }
    throw error;
  }

  return data;
}

/**
 * Delete a body checkup record
 * @param id - Body checkup UUID
 * @throws Error if deletion fails or record not found
 */
export async function deleteBodyCheckup(id: string): Promise<void> {
  const { error } = await supabase
    .from("member_body_checkups")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Get body checkup count for a member
 * @param memberId - Member UUID
 * @returns Total number of body checkups
 * @throws Error if database query fails
 */
export async function getBodyCheckupCount(memberId: string): Promise<number> {
  const { count, error } = await supabase
    .from("member_body_checkups")
    .select("*", { count: "exact", head: true })
    .eq("member_id", memberId);

  if (error) throw error;
  return count || 0;
}
