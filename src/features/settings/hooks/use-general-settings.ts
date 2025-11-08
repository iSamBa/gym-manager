import { useCallback } from "react";
import { toast } from "sonner";
import { useStudioSettings } from "./use-studio-settings";
import type { GeneralSettings } from "@/features/database/lib/types";
import { supabase } from "@/lib/supabase";

/**
 * Hook for managing general business settings
 * Provides CRUD operations for business information and logo
 *
 * @returns General settings data, loading state, and save/upload functions
 */
export function useGeneralSettings() {
  const { data, isLoading, error, updateSettings, isUpdating } =
    useStudioSettings("general_settings");

  /**
   * Save general settings with immediate effect
   */
  const saveGeneralSettings = useCallback(
    async (newSettings: GeneralSettings) => {
      try {
        await updateSettings({
          value: newSettings,
          effectiveFrom: null, // Immediate effect
        });
        toast.success("General settings saved successfully");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save settings";
        toast.error(`Failed to save settings: ${errorMessage}`);
        throw err;
      }
    },
    [updateSettings]
  );

  /**
   * Upload logo to Supabase Storage
   * Uploads to business-assets/company-logo.{ext}
   *
   * @param file - The logo file to upload (PNG or JPG)
   * @returns The public URL of the uploaded logo
   */
  const uploadLogo = useCallback(async (file: File): Promise<string> => {
    try {
      // Validate file type
      const validTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        throw new Error("Logo must be PNG or JPG format");
      }

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        throw new Error("Logo file size must be less than 2MB");
      }

      // Determine file extension
      const extension = file.type === "image/png" ? "png" : "jpg";
      const filePath = `company-logo.${extension}`;

      // Upload file (upsert: true to replace existing)
      const { error: uploadError } = await supabase.storage
        .from("business-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("business-assets").getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload logo";
      toast.error(`Failed to upload logo: ${errorMessage}`);
      throw err;
    }
  }, []);

  /**
   * Delete logo from Supabase Storage
   * Removes both PNG and JPG versions if they exist
   */
  const deleteLogo = useCallback(async () => {
    try {
      // Try to delete both possible file extensions
      const filesToDelete = ["company-logo.png", "company-logo.jpg"];

      const { error } = await supabase.storage
        .from("business-assets")
        .remove(filesToDelete);

      if (error) throw error;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete logo";
      toast.error(`Failed to delete logo: ${errorMessage}`);
      throw err;
    }
  }, []);

  return {
    settings: (data?.setting_value as GeneralSettings | undefined) ?? null,
    isLoading,
    error,
    saveSettings: saveGeneralSettings,
    uploadLogo,
    deleteLogo,
    isSaving: isUpdating,
  };
}
