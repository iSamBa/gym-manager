import { supabase } from "@/lib/supabase";
import type { Member } from "@/features/database/lib/types";
import { formatForDatabase } from "@/lib/date-utils";

export interface ConvertCollaborationMemberInput {
  /** ID of the collaboration member to convert */
  member_id: string;
  /** Whether to mark partnership as ended */
  end_partnership?: boolean;
  /** Optional notes about the conversion */
  conversion_notes?: string;
}

export interface ConvertCollaborationMemberResult {
  success: boolean;
  member?: Member;
  error?: string;
}

/**
 * Convert a collaboration member to a full member
 *
 * Business Rules:
 * - Changes member_type from 'collaboration' to 'full'
 * - Preserves all partnership data for historical reference
 * - Optionally sets partnership_contract_end to today (marks as ended)
 * - Does NOT delete any data
 * - Updates status to 'active' if not already
 *
 * @param input - Conversion parameters
 * @returns Result with converted member or error
 */
export async function convertCollaborationMember(
  input: ConvertCollaborationMemberInput
): Promise<ConvertCollaborationMemberResult> {
  try {
    // 1. Validate member exists and is collaboration type
    const { data: member, error: fetchError } = await supabase
      .from("members")
      .select("*")
      .eq("id", input.member_id)
      .single();

    if (fetchError || !member) {
      return {
        success: false,
        error: "Member not found",
      };
    }

    if (member.member_type !== "collaboration") {
      return {
        success: false,
        error: "Member is not a collaboration member",
      };
    }

    // 2. Prepare update data
    const updateData: Partial<Member> = {
      member_type: "full",
      status: "active", // Ensure active status
    };

    // 3. Optionally mark partnership as ended
    if (input.end_partnership) {
      updateData.partnership_contract_end = formatForDatabase(new Date());
    }

    // 4. Add conversion notes to member notes (append)
    if (input.conversion_notes) {
      const conversionNote = `[Converted from collaboration to full member on ${new Date().toLocaleDateString()}]: ${input.conversion_notes}`;
      updateData.notes = member.notes
        ? `${member.notes}\n\n${conversionNote}`
        : conversionNote;
    }

    // 5. Update member
    const { data: updatedMember, error: updateError } = await supabase
      .from("members")
      .update(updateData)
      .eq("id", input.member_id)
      .select("*")
      .single();

    if (updateError) {
      return {
        success: false,
        error: `Failed to convert member: ${updateError.message}`,
      };
    }

    return {
      success: true,
      member: updatedMember,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
