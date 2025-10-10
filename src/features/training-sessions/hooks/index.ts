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

// Session booking with credits
export { useSessionBookingWithCredits } from "./use-session-booking-with-credits";

// Machine management hooks
export {
  useMachines,
  useUpdateMachine,
  MACHINES_KEYS as machinesKeys,
} from "./use-machines";
