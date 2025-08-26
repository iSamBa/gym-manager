import { useState, useCallback, useMemo } from "react";
import type { SimpleMemberFilters } from "../components/SimpleMemberFilters";
import type { MemberStatus } from "@/features/database/lib/types";

// Convert simple filters to database query filters
export function useSimpleMemberFilters() {
  const [filters, setFilters] = useState<SimpleMemberFilters>({
    status: "all",
    dateRange: "all",
  });

  const updateFilters = useCallback((newFilters: SimpleMemberFilters) => {
    setFilters(newFilters);
  }, []);

  // Convert simple filters to database-compatible format
  const databaseFilters = useMemo(() => {
    const dbFilters: {
      status?: MemberStatus;
      joinDateFrom?: string;
      joinDateTo?: string;
    } = {};

    // Status filter
    if (filters.status && filters.status !== "all") {
      dbFilters.status = filters.status as MemberStatus;
    }

    // Date range filter - convert to actual dates
    if (filters.dateRange && filters.dateRange !== "all") {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      switch (filters.dateRange) {
        case "this-month":
          dbFilters.joinDateFrom = new Date(currentYear, currentMonth, 1)
            .toISOString()
            .split("T")[0];
          break;
        case "last-3-months":
          dbFilters.joinDateFrom = new Date(currentYear, currentMonth - 3, 1)
            .toISOString()
            .split("T")[0];
          break;
        case "this-year":
          dbFilters.joinDateFrom = new Date(currentYear, 0, 1)
            .toISOString()
            .split("T")[0];
          break;
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

    if (filters.dateRange && filters.dateRange !== "all") {
      const dateLabels = {
        "this-month": "This Month",
        "last-3-months": "Last 3 Months",
        "this-year": "This Year",
      };
      summary.push(`Joined: ${dateLabels[filters.dateRange]}`);
    }

    return summary;
  }, [filters]);

  return {
    filters,
    updateFilters,
    databaseFilters,
    getFilterSummary,
  };
}
