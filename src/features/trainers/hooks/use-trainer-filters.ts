import { useState, useCallback, useMemo } from "react";
import type { TrainerFilters } from "@/features/database/lib/utils";

// Define filter state interface
export interface TrainerFilterState {
  status: "all" | "active" | "inactive";
  specializations: string[];
  isAcceptingNewClients: "all" | "yes" | "no";
  experienceLevel: "all" | "entry" | "intermediate" | "experienced" | "expert";
  yearsExperienceMin?: number;
  yearsExperienceMax?: number;
  certificationStatus: "all" | "current" | "expiring" | "expired";
  languages: string[];
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  hasInsurance: "all" | "yes" | "no";
  backgroundCheckCurrent: "all" | "yes" | "no";
}

// Filter preset definitions
export interface FilterPreset {
  name: string;
  description: string;
  filters: Partial<TrainerFilterState>;
}

// Common filter presets
export const trainerFilterPresets: FilterPreset[] = [
  {
    name: "Available Trainers",
    description: "Trainers currently accepting new clients",
    filters: {
      status: "active",
      isAcceptingNewClients: "yes",
    },
  },
  {
    name: "Personal Training",
    description: "Trainers specialized in personal training",
    filters: {
      specializations: ["Personal Training"],
      status: "active",
    },
  },
  {
    name: "Group Fitness",
    description: "Trainers specialized in group fitness classes",
    filters: {
      specializations: ["Group Fitness", "Yoga", "Pilates", "Zumba"],
      status: "active",
    },
  },
  {
    name: "Experienced Trainers",
    description: "Trainers with 5+ years of experience",
    filters: {
      experienceLevel: "experienced",
      status: "active",
    },
  },
  {
    name: "Expiring Certifications",
    description: "Trainers with certifications expiring soon",
    filters: {
      certificationStatus: "expiring",
    },
  },
];

// Experience level mappings
const experienceLevelRanges = {
  entry: { min: 0, max: 2 },
  intermediate: { min: 2, max: 5 },
  experienced: { min: 5, max: 10 },
  expert: { min: 10, max: undefined },
};

// Hook for advanced trainer filtering
export function useTrainerFilters() {
  const [filters, setFilters] = useState<TrainerFilterState>({
    status: "all",
    specializations: [],
    isAcceptingNewClients: "all",
    experienceLevel: "all",
    certificationStatus: "all",
    languages: [],
    hasInsurance: "all",
    backgroundCheckCurrent: "all",
  });

  const updateFilters = useCallback(
    (newFilters: Partial<TrainerFilterState>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({
      status: "all",
      specializations: [],
      isAcceptingNewClients: "all",
      experienceLevel: "all",
      certificationStatus: "all",
      languages: [],
      hasInsurance: "all",
      backgroundCheckCurrent: "all",
    });
  }, []);

  const applyPreset = useCallback((preset: FilterPreset) => {
    setFilters((prev) => ({ ...prev, ...preset.filters }));
  }, []);

  // Convert UI filters to database query format
  const databaseFilters = useMemo((): TrainerFilters => {
    const dbFilters: TrainerFilters = {};

    // Status filter
    if (filters.status !== "all") {
      dbFilters.status = filters.status;
    }

    // Specializations filter
    if (filters.specializations.length > 0) {
      dbFilters.specializations = filters.specializations;
    }

    // Accepting new clients filter
    if (filters.isAcceptingNewClients !== "all") {
      dbFilters.isAcceptingNewClients = filters.isAcceptingNewClients === "yes";
    }

    // Experience level filter
    if (filters.experienceLevel !== "all") {
      const range = experienceLevelRanges[filters.experienceLevel];
      dbFilters.yearsExperienceMin = range.min;
      if (range.max !== undefined) {
        dbFilters.yearsExperienceMax = range.max;
      }
    }

    // Custom experience range (overrides experience level)
    if (filters.yearsExperienceMin !== undefined) {
      dbFilters.yearsExperienceMin = filters.yearsExperienceMin;
    }
    if (filters.yearsExperienceMax !== undefined) {
      dbFilters.yearsExperienceMax = filters.yearsExperienceMax;
    }

    return dbFilters;
  }, [filters]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.status !== "all") count++;
    if (filters.specializations.length > 0) count++;
    if (filters.isAcceptingNewClients !== "all") count++;
    if (filters.experienceLevel !== "all") count++;
    if (filters.certificationStatus !== "all") count++;
    if (filters.languages.length > 0) count++;
    if (filters.yearsExperienceMin !== undefined) count++;
    if (filters.yearsExperienceMax !== undefined) count++;
    if (filters.hourlyRateMin !== undefined) count++;
    if (filters.hourlyRateMax !== undefined) count++;
    if (filters.hasInsurance !== "all") count++;
    if (filters.backgroundCheckCurrent !== "all") count++;

    return count;
  }, [filters]);

  // Get human-readable filter summary
  const getFilterSummary = useCallback(() => {
    const summary: string[] = [];

    if (filters.status !== "all") {
      summary.push(`Status: ${filters.status}`);
    }

    if (filters.specializations.length > 0) {
      if (filters.specializations.length === 1) {
        summary.push(`Specialization: ${filters.specializations[0]}`);
      } else {
        summary.push(
          `Specializations: ${filters.specializations.length} selected`
        );
      }
    }

    if (filters.isAcceptingNewClients !== "all") {
      const accepting =
        filters.isAcceptingNewClients === "yes" ? "Accepting" : "Not accepting";
      summary.push(`${accepting} new clients`);
    }

    if (filters.experienceLevel !== "all") {
      const levelLabels = {
        entry: "Entry Level (0-2 years)",
        intermediate: "Intermediate (2-5 years)",
        experienced: "Experienced (5-10 years)",
        expert: "Expert (10+ years)",
      };
      summary.push(`Experience: ${levelLabels[filters.experienceLevel]}`);
    }

    if (filters.certificationStatus !== "all") {
      const statusLabels = {
        current: "Current Certifications",
        expiring: "Expiring Certifications",
        expired: "Expired Certifications",
      };
      summary.push(`Certs: ${statusLabels[filters.certificationStatus]}`);
    }

    if (filters.languages.length > 0) {
      if (filters.languages.length === 1) {
        summary.push(`Language: ${filters.languages[0]}`);
      } else {
        summary.push(`Languages: ${filters.languages.length} selected`);
      }
    }

    if (
      filters.yearsExperienceMin !== undefined ||
      filters.yearsExperienceMax !== undefined
    ) {
      let range = "Experience: ";
      if (
        filters.yearsExperienceMin !== undefined &&
        filters.yearsExperienceMax !== undefined
      ) {
        range += `${filters.yearsExperienceMin}-${filters.yearsExperienceMax} years`;
      } else if (filters.yearsExperienceMin !== undefined) {
        range += `${filters.yearsExperienceMin}+ years`;
      } else if (filters.yearsExperienceMax !== undefined) {
        range += `up to ${filters.yearsExperienceMax} years`;
      }
      summary.push(range);
    }

    if (
      filters.hourlyRateMin !== undefined ||
      filters.hourlyRateMax !== undefined
    ) {
      let range = "Rate: $";
      if (
        filters.hourlyRateMin !== undefined &&
        filters.hourlyRateMax !== undefined
      ) {
        range += `${filters.hourlyRateMin}-${filters.hourlyRateMax}/hr`;
      } else if (filters.hourlyRateMin !== undefined) {
        range += `${filters.hourlyRateMin}+/hr`;
      } else if (filters.hourlyRateMax !== undefined) {
        range += `up to ${filters.hourlyRateMax}/hr`;
      }
      summary.push(range);
    }

    if (filters.hasInsurance !== "all") {
      summary.push(
        filters.hasInsurance === "yes" ? "Has Insurance" : "No Insurance"
      );
    }

    if (filters.backgroundCheckCurrent !== "all") {
      summary.push(
        filters.backgroundCheckCurrent === "yes"
          ? "Background Check Current"
          : "Background Check Needed"
      );
    }

    return summary;
  }, [filters]);

  // Check if filters are empty/default
  const hasActiveFilters = useMemo(() => {
    return activeFilterCount > 0;
  }, [activeFilterCount]);

  // Specialization management helpers
  const addSpecialization = useCallback((specialization: string) => {
    setFilters((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations
        : [...prev.specializations, specialization],
    }));
  }, []);

  const removeSpecialization = useCallback((specialization: string) => {
    setFilters((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((s) => s !== specialization),
    }));
  }, []);

  const toggleSpecialization = useCallback((specialization: string) => {
    setFilters((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter((s) => s !== specialization)
        : [...prev.specializations, specialization],
    }));
  }, []);

  // Language management helpers
  const addLanguage = useCallback((language: string) => {
    setFilters((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages
        : [...prev.languages, language],
    }));
  }, []);

  const removeLanguage = useCallback((language: string) => {
    setFilters((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== language),
    }));
  }, []);

  const toggleLanguage = useCallback((language: string) => {
    setFilters((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  }, []);

  // Set experience range
  const setExperienceRange = useCallback((min?: number, max?: number) => {
    setFilters((prev) => ({
      ...prev,
      yearsExperienceMin: min,
      yearsExperienceMax: max,
      experienceLevel: "all", // Reset level when custom range is set
    }));
  }, []);

  // Set hourly rate range
  const setHourlyRateRange = useCallback((min?: number, max?: number) => {
    setFilters((prev) => ({
      ...prev,
      hourlyRateMin: min,
      hourlyRateMax: max,
    }));
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
    applyPreset,
    databaseFilters,
    activeFilterCount,
    hasActiveFilters,
    getFilterSummary,
    // Specialization helpers
    addSpecialization,
    removeSpecialization,
    toggleSpecialization,
    // Language helpers
    addLanguage,
    removeLanguage,
    toggleLanguage,
    // Range helpers
    setExperienceRange,
    setHourlyRateRange,
    // Presets
    presets: trainerFilterPresets,
  };
}

// TrainerFilterState and FilterPreset types are already exported in their interface declarations above
