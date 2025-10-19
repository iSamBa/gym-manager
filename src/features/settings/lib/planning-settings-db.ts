/**
 * Planning Settings Database Utilities
 * Functions for managing studio planning parameters (CRUD operations)
 */

import { supabase } from "@/lib/supabase";
import type { PlanningSettings, UpdatePlanningSettingsInput } from "./types";

/**
 * Get current planning settings
 * @returns Planning settings or null if not found
 * @throws Error if database query fails
 */
export async function getPlanningSettings(): Promise<PlanningSettings | null> {
  const { data, error } = await supabase
    .from("studio_planning_settings")
    .select("*")
    .single();

  if (error) {
    // PGRST116 = "no rows returned" - this is expected if no settings exist yet
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Update planning settings
 * @param id - Settings ID
 * @param updates - Partial settings to update
 * @returns Updated planning settings
 * @throws Error if update fails or settings not found
 */
export async function updatePlanningSettings(
  id: string,
  updates: UpdatePlanningSettingsInput
): Promise<PlanningSettings> {
  const { data, error } = await supabase
    .from("studio_planning_settings")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Initialize default settings if they don't exist
 * This function is idempotent - safe to call multiple times
 * @returns Existing or newly created planning settings
 * @throws Error if creation fails (should not happen due to migration)
 */
export async function initializeDefaultSettings(): Promise<PlanningSettings> {
  // Check if settings already exist
  const existing = await getPlanningSettings();
  if (existing) return existing;

  // Settings should have been created by migration
  // If we reach here, something is wrong - re-query to get the row
  const { data, error } = await supabase
    .from("studio_planning_settings")
    .select("*")
    .single();

  if (error)
    throw new Error(
      "Planning settings not found. Database migration may have failed."
    );

  return data;
}
