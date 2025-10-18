// Components
export { StudioSettingsLayout, OpeningHoursTab } from "./components";

// Hooks
export { useStudioSettings } from "./hooks";

// Types
export type {
  OpeningHoursDay,
  OpeningHoursWeek,
  StudioSettings,
  DayOfWeek,
} from "./lib/types";

// API (for testing purposes)
export { fetchStudioSettings, updateStudioSettings } from "./lib/settings-api";
