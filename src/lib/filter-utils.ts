/**
 * Shared filter utilities - centralizes common filtering patterns
 * Replaces duplicate filter logic across features
 */
import React from "react";

/**
 * Common filter types used across the application
 */
export interface DateRangeFilter {
  start: Date;
  end: Date;
}

export interface BaseFilters {
  search?: string;
  status?: string;
  date_range?: DateRangeFilter;
  limit?: number;
  offset?: number;
}

/**
 * Filter utilities for common operations
 */
export const filterUtils = {
  /**
   * Checks if a value is within a date range
   */
  isInDateRange: (
    dateString: string | undefined,
    range: DateRangeFilter | undefined
  ): boolean => {
    if (!range || !dateString) return true;

    const date = new Date(dateString);
    return date >= range.start && date <= range.end;
  },

  /**
   * Checks if a status matches the filter
   */
  matchesStatus: (
    itemStatus: string,
    statusFilter: string | undefined
  ): boolean => {
    if (!statusFilter || statusFilter === "all") return true;
    return itemStatus === statusFilter;
  },

  /**
   * Creates a normalized search term
   */
  normalizeSearchTerm: (term: string): string => {
    return term.trim().toLowerCase();
  },

  /**
   * Checks if a search term matches any field in an item
   */
  matchesSearchTerm: <T extends Record<string, unknown>>(
    item: T,
    searchTerm: string,
    searchFields: (keyof T)[]
  ): boolean => {
    if (!searchTerm) return true;

    const normalizedTerm = filterUtils.normalizeSearchTerm(searchTerm);

    return searchFields.some((field) => {
      const value = item[field];
      if (typeof value === "string") {
        return value.toLowerCase().includes(normalizedTerm);
      }
      return false;
    });
  },

  /**
   * Generic client-side filtering function
   */
  applyFilters: <T extends Record<string, unknown>>(
    items: T[],
    filters: BaseFilters,
    config: {
      searchFields: (keyof T)[];
      statusField: keyof T;
      dateField?: keyof T;
    }
  ): T[] => {
    return items.filter((item) => {
      // Status filter
      if (
        !filterUtils.matchesStatus(
          item[config.statusField] as string,
          filters.status
        )
      ) {
        return false;
      }

      // Date range filter
      if (
        config.dateField &&
        !filterUtils.isInDateRange(
          item[config.dateField] as string,
          filters.date_range
        )
      ) {
        return false;
      }

      // Search filter
      if (
        !filterUtils.matchesSearchTerm(
          item,
          filters.search || "",
          config.searchFields
        )
      ) {
        return false;
      }

      return true;
    });
  },

  /**
   * Pagination utilities
   */
  paginate: <T>(items: T[], limit?: number, offset?: number): T[] => {
    if (!limit) return items;

    const start = offset || 0;
    const end = start + limit;
    return items.slice(start, end);
  },

  /**
   * Sorting utilities
   */
  sortBy: <T>(
    items: T[],
    field: keyof T,
    direction: "asc" | "desc" = "asc"
  ): T[] => {
    return [...items].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return direction === "asc" ? 1 : -1;
      if (bValue == null) return direction === "asc" ? -1 : 1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        const result = aValue.localeCompare(bValue);
        return direction === "asc" ? result : -result;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        const result = aValue - bValue;
        return direction === "asc" ? result : -result;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        const result = aValue.getTime() - bValue.getTime();
        return direction === "asc" ? result : -result;
      }

      // Fallback to string comparison
      const result = String(aValue).localeCompare(String(bValue));
      return direction === "asc" ? result : -result;
    });
  },

  /**
   * Creates SQL WHERE conditions from filters
   * Use this to convert client filters to database filters
   */
  toSQLFilters: <T extends BaseFilters>(
    filters: T,
    fieldMappings: Record<string, string> = {}
  ): Record<string, unknown> => {
    const sqlFilters: Record<string, unknown> = {};

    // Map client filter keys to database column names
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const dbField = fieldMappings[key] || key;

        if (
          key === "date_range" &&
          typeof value === "object" &&
          value !== null &&
          "start" in value
        ) {
          const dateRange = value as DateRangeFilter;
          sqlFilters[`${dbField}_from`] = dateRange.start;
          sqlFilters[`${dbField}_to`] = dateRange.end;
        } else {
          sqlFilters[dbField] = value;
        }
      }
    });

    return sqlFilters;
  },

  /**
   * Validates filter values
   */
  validateFilters: (filters: BaseFilters): string[] => {
    const errors: string[] = [];

    if (filters.date_range) {
      const { start, end } = filters.date_range;
      if (start >= end) {
        errors.push("End date must be after start date");
      }
    }

    if (filters.limit && filters.limit <= 0) {
      errors.push("Limit must be greater than 0");
    }

    if (filters.offset && filters.offset < 0) {
      errors.push("Offset must be non-negative");
    }

    return errors;
  },

  /**
   * Creates a filter summary for display
   */
  getFilterSummary: (filters: BaseFilters): string[] => {
    const summary: string[] = [];

    if (filters.search) {
      summary.push(`Search: "${filters.search}"`);
    }

    if (filters.status && filters.status !== "all") {
      summary.push(`Status: ${filters.status}`);
    }

    if (filters.date_range) {
      const { start, end } = filters.date_range;
      summary.push(
        `Date: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
      );
    }

    return summary;
  },

  /**
   * Merges multiple filter objects
   */
  mergeFilters: <T extends BaseFilters>(...filters: Partial<T>[]): T => {
    return filters.reduce<T>((merged, current) => {
      return { ...merged, ...current } as T;
    }, {} as T);
  },

  /**
   * Removes empty/default filter values
   */
  cleanFilters: <T extends BaseFilters>(filters: T): Partial<T> => {
    const cleaned: Partial<T> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
      ) {
        (cleaned as Record<string, unknown>)[key] = value;
      }
    });

    return cleaned;
  },
};

/**
 * React hook for managing filter state
 */
export function useFilters<T extends BaseFilters>(initialFilters: T) {
  const [filters, setFilters] = React.useState<T>(initialFilters);

  const updateFilter = React.useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateFilters = React.useCallback((newFilters: Partial<T>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = React.useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const removeFilter = React.useCallback(<K extends keyof T>(key: K) => {
    setFilters((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [key]: _, ...rest } = prev;
      return rest as T;
    });
  }, []);

  const hasActiveFilters = React.useMemo(() => {
    const cleaned = filterUtils.cleanFilters(filters);
    return Object.keys(cleaned).length > 0;
  }, [filters]);

  const filterSummary = React.useMemo(() => {
    return filterUtils.getFilterSummary(filters);
  }, [filters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    removeFilter,
    hasActiveFilters,
    filterSummary,
  };
}
