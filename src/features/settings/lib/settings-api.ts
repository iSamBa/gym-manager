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
 * Creates or updates a studio setting entry
 * Uses upsert to handle the unique constraint on (setting_key, effective_from)
 * For historical tracking, creates new rows for different effective dates
 */
export async function updateStudioSettings(
  settingKey: string,
  value: unknown,
  effectiveFrom: Date | null
): Promise<StudioSettings> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const effectiveFromDate = effectiveFrom
    ? effectiveFrom.toISOString().split("T")[0]
    : null;

  const { data, error } = await supabase
    .from("studio_settings")
    .upsert(
      {
        setting_key: settingKey,
        setting_value: value,
        effective_from: effectiveFromDate,
        created_by: user?.id || null,
      },
      {
        onConflict: "setting_key,effective_from",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}
