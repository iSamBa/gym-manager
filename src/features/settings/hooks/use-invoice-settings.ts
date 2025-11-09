import { useCallback } from "react";
import { toast } from "sonner";
import { useStudioSettings } from "./use-studio-settings";
import type { InvoiceSettings } from "@/features/database/lib/types";

/**
 * Hook for managing invoice settings
 * Provides CRUD operations for VAT rate, footer notes, and auto-generation toggle
 *
 * @returns Invoice settings data, loading state, and save function
 */
export function useInvoiceSettings() {
  const { data, isLoading, error, updateSettings, isUpdating } =
    useStudioSettings("invoice_settings");

  /**
   * Default invoice settings
   * Used when no settings exist in database
   */
  const defaultSettings: InvoiceSettings = {
    vat_rate: 20, // 20% default VAT rate
    invoice_footer_notes: "", // Empty footer notes
    auto_generate: true, // Auto-generate enabled by default
  };

  /**
   * Save invoice settings with immediate effect
   */
  const saveInvoiceSettings = useCallback(
    async (newSettings: InvoiceSettings) => {
      try {
        await updateSettings({
          value: newSettings,
          effectiveFrom: null, // Immediate effect
        });
        toast.success("Invoice settings saved successfully");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save settings";
        toast.error(`Failed to save settings: ${errorMessage}`);
        throw err;
      }
    },
    [updateSettings]
  );

  return {
    settings:
      (data?.setting_value as InvoiceSettings | undefined) ?? defaultSettings,
    isLoading,
    error,
    saveSettings: saveInvoiceSettings,
    isSaving: isUpdating,
  };
}
