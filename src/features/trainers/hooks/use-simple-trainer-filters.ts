import { useState, useCallback, useMemo } from "react";
import type { TrainerFilters } from "@/features/database/lib/utils";

// Simple filter types for UI components
export interface SimpleTrainerFilters {
  status: "all" | "active" | "inactive";
  specialization:
    | "all"
    | "personal-training"
    | "group-fitness"
    | "yoga"
    | "pilates"
    | "nutrition"
    | "rehabilitation";
  availability: "all" | "accepting" | "not-accepting";
  experience: "all" | "entry" | "intermediate" | "experienced" | "expert";
}

// Convert simple filters to database query filters
export function useSimpleTrainerFilters() {
  const [filters, setFilters] = useState<SimpleTrainerFilters>({
    status: "all",
    specialization: "all",
    availability: "all",
    experience: "all",
  });

  const updateFilters = useCallback((newFilters: SimpleTrainerFilters) => {
    setFilters(newFilters);
  }, []);

  const updateFilter = useCallback(
    (
      key: keyof SimpleTrainerFilters,
      value: SimpleTrainerFilters[keyof SimpleTrainerFilters]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({
      status: "all",
      specialization: "all",
      availability: "all",
      experience: "all",
    });
  }, []);

  // Convert simple filters to database-compatible format
  const databaseFilters = useMemo((): TrainerFilters => {
    const dbFilters: TrainerFilters = {};

    // Status filter
    if (filters.status && filters.status !== "all") {
      dbFilters.status = filters.status;
    }

    // Specialization filter
    if (filters.specialization && filters.specialization !== "all") {
      const specializationMap = {
        "personal-training": ["Personal Training"],
        "group-fitness": ["Group Fitness"],
        yoga: ["Yoga"],
        pilates: ["Pilates"],
        nutrition: ["Nutrition", "Nutritional Counseling"],
        rehabilitation: [
          "Physical Therapy",
          "Injury Rehabilitation",
          "Post-Rehabilitation",
        ],
      };

      const specializations = specializationMap[filters.specialization];
      if (specializations) {
        dbFilters.specializations = specializations;
      }
    }

    // Availability filter
    if (filters.availability && filters.availability !== "all") {
      dbFilters.isAcceptingNewClients = filters.availability === "accepting";
    }

    // Experience filter
    if (filters.experience && filters.experience !== "all") {
      const experienceRanges = {
        entry: { min: 0, max: 2 },
        intermediate: { min: 2, max: 5 },
        experienced: { min: 5, max: 10 },
        expert: { min: 10, max: undefined },
      };

      const range = experienceRanges[filters.experience];
      if (range) {
        dbFilters.yearsExperienceMin = range.min;
        if (range.max !== undefined) {
          dbFilters.yearsExperienceMax = range.max;
        }
      }
    }

    return dbFilters;
  }, [filters]);

  // Get a human-readable summary of active filters
  const getFilterSummary = useCallback(() => {
    const summary: string[] = [];

    if (filters.status && filters.status !== "all") {
      summary.push(`Status: ${filters.status}`);
    }

    if (filters.specialization && filters.specialization !== "all") {
      const labels = {
        "personal-training": "Personal Training",
        "group-fitness": "Group Fitness",
        yoga: "Yoga",
        pilates: "Pilates",
        nutrition: "Nutrition",
        rehabilitation: "Rehabilitation",
      };
      summary.push(`Specialization: ${labels[filters.specialization]}`);
    }

    if (filters.availability && filters.availability !== "all") {
      const availabilityLabels = {
        accepting: "Accepting New Clients",
        "not-accepting": "Not Accepting New Clients",
      };
      summary.push(availabilityLabels[filters.availability]);
    }

    if (filters.experience && filters.experience !== "all") {
      const experienceLabels = {
        entry: "Entry Level (0-2 years)",
        intermediate: "Intermediate (2-5 years)",
        experienced: "Experienced (5-10 years)",
        expert: "Expert (10+ years)",
      };
      summary.push(`Experience: ${experienceLabels[filters.experience]}`);
    }

    return summary;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== "all" ||
      filters.specialization !== "all" ||
      filters.availability !== "all" ||
      filters.experience !== "all"
    );
  }, [filters]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.specialization !== "all") count++;
    if (filters.availability !== "all") count++;
    if (filters.experience !== "all") count++;
    return count;
  }, [filters]);

  // Quick filter helpers
  const setStatusFilter = useCallback(
    (status: SimpleTrainerFilters["status"]) => {
      setFilters((prev) => ({ ...prev, status }));
    },
    []
  );

  const setSpecializationFilter = useCallback(
    (specialization: SimpleTrainerFilters["specialization"]) => {
      setFilters((prev) => ({ ...prev, specialization }));
    },
    []
  );

  const setAvailabilityFilter = useCallback(
    (availability: SimpleTrainerFilters["availability"]) => {
      setFilters((prev) => ({ ...prev, availability }));
    },
    []
  );

  const setExperienceFilter = useCallback(
    (experience: SimpleTrainerFilters["experience"]) => {
      setFilters((prev) => ({ ...prev, experience }));
    },
    []
  );

  // Common filter presets
  const applyPreset = useCallback(
    (presetName: string) => {
      switch (presetName) {
        case "available":
          setFilters({
            status: "active",
            specialization: "all",
            availability: "accepting",
            experience: "all",
          });
          break;
        case "personal-trainers":
          setFilters({
            status: "active",
            specialization: "personal-training",
            availability: "all",
            experience: "all",
          });
          break;
        case "group-instructors":
          setFilters({
            status: "active",
            specialization: "group-fitness",
            availability: "all",
            experience: "all",
          });
          break;
        case "experienced":
          setFilters({
            status: "active",
            specialization: "all",
            availability: "all",
            experience: "experienced",
          });
          break;
        default:
          resetFilters();
      }
    },
    [resetFilters]
  );

  // Filter options for dropdowns
  const filterOptions = useMemo(
    () => ({
      status: [
        { value: "all", label: "All Statuses" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ] as const,
      specialization: [
        { value: "all", label: "All Specializations" },
        { value: "personal-training", label: "Personal Training" },
        { value: "group-fitness", label: "Group Fitness" },
        { value: "yoga", label: "Yoga" },
        { value: "pilates", label: "Pilates" },
        { value: "nutrition", label: "Nutrition" },
        { value: "rehabilitation", label: "Rehabilitation" },
      ] as const,
      availability: [
        { value: "all", label: "All Trainers" },
        { value: "accepting", label: "Accepting New Clients" },
        { value: "not-accepting", label: "Not Accepting" },
      ] as const,
      experience: [
        { value: "all", label: "All Experience Levels" },
        { value: "entry", label: "Entry Level (0-2 years)" },
        { value: "intermediate", label: "Intermediate (2-5 years)" },
        { value: "experienced", label: "Experienced (5-10 years)" },
        { value: "expert", label: "Expert (10+ years)" },
      ] as const,
    }),
    []
  );

  return {
    filters,
    updateFilters,
    updateFilter,
    resetFilters,
    databaseFilters,
    getFilterSummary,
    hasActiveFilters,
    activeFilterCount,
    // Quick filter setters
    setStatusFilter,
    setSpecializationFilter,
    setAvailabilityFilter,
    setExperienceFilter,
    // Presets
    applyPreset,
    // Options for UI components
    filterOptions,
  };
}

// SimpleTrainerFilters type is already exported in the interface declaration above
