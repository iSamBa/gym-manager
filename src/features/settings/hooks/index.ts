/**
 * Settings Hooks Barrel Export
 * Clean import path for all settings-related hooks
 *
 * Usage:
 *   import { useGeneralSettings, useInvoiceSettings } from '@/features/settings/hooks';
 */

export { useConflictDetection } from "./use-conflict-detection";
export type { SessionConflict } from "./use-conflict-detection";
export { useGeneralSettings } from "./use-general-settings";
export { useInvoiceSettings } from "./use-invoice-settings";
export { useMultiSiteSessions } from "./use-multi-site-sessions";
export { useOpeningHours } from "./use-opening-hours";
export { usePlanningSettings } from "./use-planning-settings";
export { useStudioSettings } from "./use-studio-settings";
