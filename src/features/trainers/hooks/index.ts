// Main trainer hooks
export {
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
  trainerKeys,
} from "./use-trainers";

// Search and validation utilities
export {
  useDebouncedTrainerSearch,
  useTrainerValidation,
  useTrainerPrefetch,
  useTrainerCacheUtils,
} from "./use-trainer-search";

// Advanced filtering
export {
  useTrainerFilters,
  trainerFilterPresets,
  type TrainerFilterState,
  type FilterPreset,
} from "./use-trainer-filters";

// Simple filtering for UI components
export {
  useSimpleTrainerFilters,
  type SimpleTrainerFilters,
} from "./use-simple-trainer-filters";

// CSV export functionality
export { useExportTrainers } from "./use-export-trainers";
