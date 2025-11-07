// Training session hooks - consolidated and optimized (Phase 3: Hook Consolidation)
export {
  // Main session management
  useTrainingSessions,
  useTrainingSession,
  useCreateTrainingSession,
  useUpdateTrainingSession,
  useDeleteTrainingSession,
  TRAINING_SESSIONS_KEYS as trainingSessionKeys,
  // Member dialog data - consolidated into use-training-sessions
  useMemberDialogData,
  type MemberDialogData,
  type MemberDialogInfo,
  type MemberSessionStats,
  // Daily statistics - consolidated into use-training-sessions
  useDailyStatistics,
  type DailyStatistics,
} from "./use-training-sessions";

// Machine management hooks
export {
  useMachines,
  useUpdateMachine,
  MACHINES_KEYS as machinesKeys,
} from "./use-machines";

// Session alerts hook - expanded with studio session limit
export {
  useSessionAlerts,
  // Studio session limit - consolidated into use-session-alerts
  useStudioSessionLimit,
} from "./use-session-alerts";
