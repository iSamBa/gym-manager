// Training session hooks - consolidated and optimized
export {
  // Main session management
  useTrainingSessions,
  useTrainingSession,
  useCreateTrainingSession,
  useUpdateTrainingSession,
  useDeleteTrainingSession,
  useTrainingSessionsByTrainer,
  useTrainingSessionsByMember,
  useUpcomingTrainingSessions,
  trainingSessionKeys,
} from "./use-training-sessions";

// Session booking with credits
export {
  useSessionBookingWithCredits,
  useBookingValidation,
  useCreditCalculation,
} from "./use-session-booking-with-credits";

// Calendar integration
export {
  useCalendarEvents,
  useCalendarView,
  useEventFiltering,
} from "./use-calendar-events";

// Session statistics with SQL aggregation
export {
  useSessionStats,
  sessionStatsKeys,
  type SessionStats,
} from "./use-session-stats";
