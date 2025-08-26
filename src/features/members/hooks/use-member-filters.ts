import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { MemberStatus } from "@/features/database/lib/types";

// Filter interface matching the component expectations
export interface MemberFilterState {
  status?: MemberStatus;
  joinDateFrom?: string;
  joinDateTo?: string;
  ageMin?: number;
  ageMax?: number;
  membershipType?: string;
  paymentStatus?: "current" | "overdue" | "cancelled";
  lastVisitFrom?: string;
  lastVisitTo?: string;
  search?: string;
}

// Filter preset interface
export interface FilterPreset {
  name: string;
  filters: MemberFilterState;
  createdAt: string;
}

// Local storage keys
const FILTER_PRESETS_KEY = "member-filter-presets";
// const FILTER_DEFAULTS_KEY = 'member-filter-defaults'; // Reserved for future use

export function useMemberFilters(
  onFiltersChange?: (filters: MemberFilterState) => void
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<MemberFilterState>(() => {
    const initialFilters: MemberFilterState = {};

    // Parse URL parameters
    const status = searchParams.get("status");
    if (
      status &&
      ["active", "inactive", "suspended", "pending"].includes(status)
    ) {
      initialFilters.status = status as MemberStatus;
    }

    const joinDateFrom = searchParams.get("joinDateFrom");
    if (joinDateFrom) initialFilters.joinDateFrom = joinDateFrom;

    const joinDateTo = searchParams.get("joinDateTo");
    if (joinDateTo) initialFilters.joinDateTo = joinDateTo;

    const ageMin = searchParams.get("ageMin");
    if (ageMin) initialFilters.ageMin = parseInt(ageMin);

    const ageMax = searchParams.get("ageMax");
    if (ageMax) initialFilters.ageMax = parseInt(ageMax);

    const membershipType = searchParams.get("membershipType");
    if (membershipType) initialFilters.membershipType = membershipType;

    const paymentStatus = searchParams.get("paymentStatus");
    if (
      paymentStatus &&
      ["current", "overdue", "cancelled"].includes(paymentStatus)
    ) {
      initialFilters.paymentStatus = paymentStatus as
        | "current"
        | "overdue"
        | "cancelled";
    }

    const search = searchParams.get("search");
    if (search) initialFilters.search = search;

    return initialFilters;
  });

  // Load filter presets from localStorage
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    try {
      const stored = localStorage.getItem(FILTER_PRESETS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });

    // Update URL without causing navigation
    const newUrl = params.toString()
      ? `?${params.toString()}`
      : window.location.pathname;
    router.replace(newUrl, { scroll: false });

    // Notify parent component
    onFiltersChange?.(filters);
  }, [filters, router, onFiltersChange]);

  // Save presets to localStorage
  const savePresetsToStorage = useCallback((newPresets: FilterPreset[]) => {
    try {
      localStorage.setItem(FILTER_PRESETS_KEY, JSON.stringify(newPresets));
      setPresets(newPresets);
    } catch (error) {
      console.warn("Failed to save filter presets:", error);
    }
  }, []);

  // Update a specific filter
  const updateFilter = useCallback(
    <K extends keyof MemberFilterState>(
      key: K,
      value: MemberFilterState[K]
    ) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  // Remove a specific filter
  const removeFilter = useCallback((key: keyof MemberFilterState) => {
    setFilters((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Get count of active filters
  const getActiveFilterCount = useCallback(() => {
    return Object.values(filters).filter(
      (value) => value !== undefined && value !== null && value !== ""
    ).length;
  }, [filters]);

  // Export filters as JSON
  const exportFilters = useCallback(() => {
    const filterData = {
      filters,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(filterData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `member-filters-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }, [filters]);

  // Import filters from JSON
  const importFilters = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          const data = JSON.parse(result);

          if (data.filters && typeof data.filters === "object") {
            setFilters(data.filters);
            resolve();
          } else {
            reject(new Error("Invalid filter file format"));
          }
        } catch {
          reject(new Error("Failed to parse filter file"));
        }
      };

      reader.onerror = () => reject(new Error("Failed to read filter file"));
      reader.readAsText(file);
    });
  }, []);

  // Save current filters as a preset
  const savePreset = useCallback(
    (name: string) => {
      if (!name.trim()) return;

      const newPreset: FilterPreset = {
        name: name.trim(),
        filters: { ...filters },
        createdAt: new Date().toISOString(),
      };

      const updatedPresets = [
        ...presets.filter((p) => p.name !== name), // Remove existing preset with same name
        newPreset,
      ].sort((a, b) => a.name.localeCompare(b.name));

      savePresetsToStorage(updatedPresets);
    },
    [filters, presets, savePresetsToStorage]
  );

  // Load a filter preset
  const loadPreset = useCallback(
    (name: string) => {
      const preset = presets.find((p) => p.name === name);
      if (preset) {
        setFilters(preset.filters);
      }
    },
    [presets]
  );

  // Delete a filter preset
  const deletePreset = useCallback(
    (name: string) => {
      const updatedPresets = presets.filter((p) => p.name !== name);
      savePresetsToStorage(updatedPresets);
    },
    [presets, savePresetsToStorage]
  );

  // Get filter summary for display
  const getFilterSummary = useCallback(() => {
    const summary: string[] = [];

    if (filters.status) {
      summary.push(`Status: ${filters.status}`);
    }

    if (filters.joinDateFrom || filters.joinDateTo) {
      if (filters.joinDateFrom && filters.joinDateTo) {
        summary.push(
          `Joined: ${filters.joinDateFrom} to ${filters.joinDateTo}`
        );
      } else if (filters.joinDateFrom) {
        summary.push(`Joined after: ${filters.joinDateFrom}`);
      } else if (filters.joinDateTo) {
        summary.push(`Joined before: ${filters.joinDateTo}`);
      }
    }

    if (filters.ageMin || filters.ageMax) {
      if (filters.ageMin && filters.ageMax) {
        summary.push(`Age: ${filters.ageMin}-${filters.ageMax}`);
      } else if (filters.ageMin) {
        summary.push(`Age: ${filters.ageMin}+`);
      } else if (filters.ageMax) {
        summary.push(`Age: under ${filters.ageMax}`);
      }
    }

    if (filters.membershipType) {
      summary.push(`Type: ${filters.membershipType}`);
    }

    if (filters.paymentStatus) {
      summary.push(`Payment: ${filters.paymentStatus}`);
    }

    return summary;
  }, [filters]);

  // Validate filters
  const validateFilters = useCallback(() => {
    const errors: string[] = [];

    // Age validation
    if (filters.ageMin && filters.ageMax && filters.ageMin > filters.ageMax) {
      errors.push("Minimum age cannot be greater than maximum age");
    }

    // Date validation
    if (
      filters.joinDateFrom &&
      filters.joinDateTo &&
      new Date(filters.joinDateFrom) > new Date(filters.joinDateTo)
    ) {
      errors.push('Join date "from" cannot be later than "to"');
    }

    if (
      filters.lastVisitFrom &&
      filters.lastVisitTo &&
      new Date(filters.lastVisitFrom) > new Date(filters.lastVisitTo)
    ) {
      errors.push('Last visit "from" cannot be later than "to"');
    }

    return errors;
  }, [filters]);

  // Apply common filter presets
  const applyQuickFilter = useCallback((filterType: string) => {
    const quickFilters: Record<string, MemberFilterState> = {
      active: { status: "active" },
      inactive: { status: "inactive" },
      "new-this-month": {
        joinDateFrom: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        )
          .toISOString()
          .split("T")[0],
      },
      "overdue-payments": { paymentStatus: "overdue" },
      "premium-members": { membershipType: "premium" },
    };

    const quickFilter = quickFilters[filterType];
    if (quickFilter) {
      setFilters(quickFilter);
    }
  }, []);

  return {
    filters,
    updateFilter,
    removeFilter,
    resetFilters,
    getActiveFilterCount,
    exportFilters,
    importFilters,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    getFilterSummary,
    validateFilters,
    applyQuickFilter,
  };
}
