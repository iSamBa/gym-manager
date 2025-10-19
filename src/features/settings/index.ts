// Components
export {
  StudioSettingsLayout,
  OpeningHoursTab,
  PlanningTab,
} from "./components";

// Hooks
export { useStudioSettings, usePlanningSettings } from "./hooks";

// Types
export type {
  OpeningHoursDay,
  OpeningHoursWeek,
  StudioSettings,
  DayOfWeek,
  PlanningSettings,
  UpdatePlanningSettingsInput,
} from "./lib/types";

// API (for testing purposes)
export { fetchStudioSettings, updateStudioSettings } from "./lib/settings-api";
