// Training session hooks - consolidated and optimized
export {
  // Main session management
  useTrainingSessions,
  useTrainingSession,
  useCreateTrainingSession,
  useUpdateTrainingSession,
  useDeleteTrainingSession,
  TRAINING_SESSIONS_KEYS as trainingSessionKeys,
} from "./use-training-sessions";

// Machine management hooks
export {
  useMachines,
  useUpdateMachine,
  MACHINES_KEYS as machinesKeys,
} from "./use-machines";

// Session alerts hook
export { useSessionAlerts } from "./use-session-alerts";

// Studio session limit hook (US-004)
export { useStudioSessionLimit } from "./use-studio-session-limit";

// Daily statistics hook (US-003)
export { useDailyStatistics } from "./use-daily-statistics";
