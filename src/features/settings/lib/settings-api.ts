import { supabase } from "@/lib/supabase";
import type { StudioSettings } from "./types";
import { getLocalDateString, formatForDatabase } from "@/lib/date-utils";

/**
 * Fetches the currently active studio setting by key
 * Returns the most recent setting where effective_from <= today
 */
export async function fetchActiveSettings(
  settingKey: string
): Promise<StudioSettings | null> {
  const today = getLocalDateString();

  const { data, error } = await supabase
    .from("studio_settings")
    .select("*")
    .eq("setting_key", settingKey)
    .eq("is_active", true)
    .lte("effective_from", today)
    .order("effective_from", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Fetches scheduled studio settings (future effective dates)
 * Returns the earliest scheduled setting where effective_from > today
 */
export async function fetchScheduledSettings(
  settingKey: string
): Promise<StudioSettings | null> {
  const today = getLocalDateString();

  const { data, error } = await supabase
    .from("studio_settings")
    .select("*")
    .eq("setting_key", settingKey)
    .eq("is_active", true)
    .gt("effective_from", today)
    .order("effective_from", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * @deprecated Use fetchActiveSettings instead
 * Kept for backward compatibility
 */
export async function fetchStudioSettings(
  settingKey: string
): Promise<StudioSettings | null> {
  return fetchActiveSettings(settingKey);
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
    ? formatForDatabase(effectiveFrom)
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
