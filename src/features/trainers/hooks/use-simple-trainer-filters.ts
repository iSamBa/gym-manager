import { useState, useCallback, useMemo } from "react";
import type { TrainerFilters } from "@/features/trainers/lib/database-utils";

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
}

// Convert simple filters to database query filters
export function useSimpleTrainerFilters() {
  const [filters, setFilters] = useState<SimpleTrainerFilters>({
    status: "all",
    specialization: "all",
    availability: "all",
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
    });
  }, []);

  // Convert simple filters to database-compatible format
  const databaseFilters = useMemo((): TrainerFilters => {
    const dbFilters: TrainerFilters = {};

    // Status filter
    if (filters.status && filters.status !== "all") {
      dbFilters.status = filters.status;
    }

    // Specialization filter - mapping UI values to actual database UUIDs
    if (filters.specialization && filters.specialization !== "all") {
      const specializationMap = {
        "personal-training": ["1146be5b-c50c-46c2-b2e8-7d6195d3fa52"],
        "group-fitness": ["41f657b2-fef9-46ff-99e0-1d585a131110"],
        yoga: ["be928a6b-191b-4e87-b036-888f7de53261"],
        pilates: ["5566e075-5e5f-4570-ba83-b1da8cf4ec2c"],
        nutrition: ["def9f5a0-9047-4c93-ac31-a43d094f9b16"],
        rehabilitation: ["81cf7dd4-70cd-4cb1-b873-f692b68a798e"],
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

    return summary;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== "all" ||
      filters.specialization !== "all" ||
      filters.availability !== "all"
    );
  }, [filters]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.specialization !== "all") count++;
    if (filters.availability !== "all") count++;
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

  // Common filter presets
  const applyPreset = useCallback(
    (presetName: string) => {
      switch (presetName) {
        case "available":
          setFilters({
            status: "active",
            specialization: "all",
            availability: "accepting",
          });
          break;
        case "personal-trainers":
          setFilters({
            status: "active",
            specialization: "personal-training",
            availability: "all",
          });
          break;
        case "group-instructors":
          setFilters({
            status: "active",
            specialization: "group-fitness",
            availability: "all",
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
    // Presets
    applyPreset,
    // Options for UI components
    filterOptions,
  };
}
