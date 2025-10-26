/**
 * Multi-Site Sessions Hook
 * React Query hook for managing multi-site session data
 */

import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import {
  getMultiSiteSessions,
  getOriginStudios,
} from "../lib/multi-site-sessions-db";
import type { MultiSiteSessionFilters } from "../lib/types";

/**
 * Hook for managing multi-site sessions with filtering
 * @returns Multi-site sessions data, loading state, and filter functions
 */
export function useMultiSiteSessions() {
  const [filters, setFilters] = useState<MultiSiteSessionFilters>({});

  // Fetch sessions with filters
  const sessionsQuery = useQuery({
    queryKey: ["multi-site-sessions", filters],
    queryFn: () => getMultiSiteSessions(filters),
  });

  // Fetch origin studios for filter dropdown
  const studiosQuery = useQuery({
    queryKey: ["origin-studios"],
    queryFn: getOriginStudios,
  });

  // Filter update functions
  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setDateRange = useCallback((date_from?: string, date_to?: string) => {
    setFilters((prev) => ({ ...prev, date_from, date_to }));
  }, []);

  const setOriginStudio = useCallback((origin_studio?: string) => {
    setFilters((prev) => ({ ...prev, origin_studio }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.search ||
      filters.date_from ||
      filters.date_to ||
      filters.origin_studio
    );
  }, [filters]);

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
    originStudios: studiosQuery.data || [],
    filters,
    setSearch,
    setDateRange,
    setOriginStudio,
    clearFilters,
    hasActiveFilters,
  };
}
