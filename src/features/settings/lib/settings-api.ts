import { supabase } from "@/lib/supabase";
import type { StudioSettings } from "./types";

/**
 * Fetches the active studio setting by key
 * Returns the most recent active setting based on effective_from date
 */
export async function fetchStudioSettings(
  settingKey: string
): Promise<StudioSettings | null> {
  const { data, error } = await supabase
    .from("studio_settings")
    .select("*")
    .eq("setting_key", settingKey)
    .eq("is_active", true)
    .order("effective_from", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Creates a new studio setting entry
 * For historical tracking, creates new rows rather than updating existing ones
 */
export async function updateStudioSettings(
  settingKey: string,
  value: unknown,
  effectiveFrom: Date | null
): Promise<StudioSettings> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("studio_settings")
    .insert({
      setting_key: settingKey,
      setting_value: value,
      effective_from: effectiveFrom
        ? effectiveFrom.toISOString().split("T")[0]
        : null,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}
