/**
 * Auto-Inactivation Database Utilities
 * Functions for automatic member inactivation based on attendance
 */

import { supabase } from "@/lib/supabase";
import type { AutoInactivationResult, InactivationCandidate } from "./types";
import { formatTimestampForDatabase } from "@/lib/date-utils";

/**
 * Run auto-inactivation process
 * Marks dormant members as inactive and adds system comments
 *
 * @returns Result containing count and affected member details
 * @throws Error if database operation fails
 */
export async function runAutoInactivation(): Promise<AutoInactivationResult> {
  const { data, error } = await supabase.rpc("auto_inactivate_dormant_members");

  if (error) throw error;

  return data[0] || { inactivated_count: 0, member_ids: [], member_names: [] };
}

/**
 * Get list of members who would be inactivated (dry-run preview)
 * Does NOT modify any data
 *
 * @returns List of members meeting inactivation criteria
 * @throws Error if database operation fails
 */
export async function getInactivationCandidates(): Promise<
  InactivationCandidate[]
> {
  const { data, error } = await supabase.rpc("get_inactivation_candidates");

  if (error) throw error;

  return data || [];
}

/**
 * Manually reactivate a member
 * Sets status to 'active' and adds reactivation comment
 *
 * @param memberId - UUID of member to reactivate
 * @param adminName - Name of admin performing the reactivation
 * @throws Error if update or comment insertion fails
 */
export async function reactivateMember(
  memberId: string,
  adminName: string
): Promise<void> {
  // Update member status
  const { error: updateError } = await supabase
    .from("members")
    .update({ status: "active" })
    .eq("id", memberId);

  if (updateError) throw updateError;

  // Add comment
  const { error: commentError } = await supabase
    .from("member_comments")
    .insert({
      member_id: memberId,
      author: adminName,
      body: `Member reactivated by ${adminName} on ${new Date().toLocaleDateString()}`,
      created_by_system: false,
      created_at: formatTimestampForDatabase(),
    });

  if (commentError) throw commentError;
}
