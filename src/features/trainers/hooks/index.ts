// Main trainer hooks - consolidated and optimized
export {
  // Core CRUD operations
  useTrainers,
  useTrainer,
  useTrainerWithProfile,
  useSearchTrainers,
  useTrainersBySpecialization,
  useAvailableTrainers,
  useTrainerCount,
  useTrainerCountByStatus,
  useTrainersWithExpiringCerts,
  useCreateTrainer,
  useUpdateTrainer,
  useUpdateTrainerAvailability,
  useBulkUpdateTrainerAvailability,
  useDeleteTrainer,
  useTrainersInfinite,
  useTrainersPrefetch,
  // Export functionality (merged from use-export-trainers)
  useExportTrainers,
  // Query key factory
  trainerKeys,
} from "./use-trainers";

// Core search functionality
export {
  useDebouncedTrainerSearch,
  useTrainerValidation,
  useTrainerPrefetch,
  useTrainerCacheUtils,
} from "./use-trainer-search";

// Simple filtering (used in pages)
export {
  useSimpleTrainerFilters,
  type SimpleTrainerFilters,
} from "./use-simple-trainer-filters";
