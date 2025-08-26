import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { memberUtils, type MemberFilters } from "@/features/database/lib/utils";
// import type { MemberStatus } from "@/features/database/lib/types"; // Reserved for future use
import { memberKeys } from "./use-members";

// Enhanced search interface for complex queries
export interface AdvancedMemberFilters extends MemberFilters {
  // Multi-field search
  searchFields?: Array<"name" | "email" | "member_number" | "phone">;

  // Advanced filters
  ageMin?: number;
  ageMax?: number;
  membershipType?: string;
  paymentStatus?: "current" | "overdue" | "cancelled";
  lastVisitFrom?: string;
  lastVisitTo?: string;

  // Logical operators
  operator?: "AND" | "OR";
}

// Search history management
const SEARCH_HISTORY_KEY = "member-search-history";
const MAX_HISTORY_ITEMS = 10;

export function useMemberSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Failed to load search history:", error);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((history: string[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
      setSearchHistory(history);
    } catch (error) {
      console.warn("Failed to save search history:", error);
    }
  }, []);

  const addToHistory = useCallback(
    (query: string) => {
      if (!query.trim() || query.length < 2) return;

      setSearchHistory((prev) => {
        const filtered = prev.filter((item) => item !== query);
        const updated = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);
        saveHistory(updated);
        return updated;
      });
    },
    [saveHistory]
  );

  const removeFromHistory = useCallback(
    (query: string) => {
      setSearchHistory((prev) => {
        const updated = prev.filter((item) => item !== query);
        saveHistory(updated);
        return updated;
      });
    },
    [saveHistory]
  );

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}

// Advanced member search with complex query building
export function useAdvancedMemberSearch(filters: AdvancedMemberFilters = {}) {
  const { searchFields = ["name", "email", "member_number"], ...otherFilters } =
    filters; // eslint-disable-line @typescript-eslint/no-unused-vars

  return useQuery({
    queryKey: [...memberKeys.all, "advanced-search", filters],
    queryFn: async () => {
      // Build complex search query based on filters
      const searchQuery = buildAdvancedSearchQuery(filters);
      return memberUtils.getMembers(searchQuery);
    },
    enabled: !!(filters.search && filters.search.length >= 2),
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    placeholderData: [],
  });
}

// Search suggestions based on popular searches and existing data
export function useMemberSearchSuggestions(query: string) {
  const { searchHistory } = useMemberSearchHistory();

  return useQuery({
    queryKey: [...memberKeys.all, "search-suggestions", query],
    queryFn: async () => {
      const suggestions = new Set<string>();

      // Add matching history items
      searchHistory
        .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
        .forEach((item) => suggestions.add(item));

      // If query looks like a member number pattern, suggest it
      if (/^\d+$/.test(query) && query.length >= 3) {
        suggestions.add(`Member #${query}`);
      }

      // If query looks like email, suggest email search
      if (query.includes("@")) {
        suggestions.add(`Email: ${query}`);
      }

      // Add popular search patterns
      const popularPatterns = [
        "active members",
        "new members this month",
        "overdue payments",
        "expired memberships",
      ];

      popularPatterns
        .filter((pattern) =>
          pattern.toLowerCase().includes(query.toLowerCase())
        )
        .forEach((pattern) => suggestions.add(pattern));

      return Array.from(suggestions).slice(0, 5);
    },
    enabled: query.length >= 1,
    staleTime: 5 * 60 * 1000, // 5 minutes for suggestions
  });
}

// Analytics for search behavior
export function useSearchAnalytics() {
  const [searchMetrics, setSearchMetrics] = useState({
    totalSearches: 0,
    popularQueries: [] as Array<{ query: string; count: number }>,
    averageResultsPerSearch: 0,
  });

  const trackSearch = useCallback((query: string, resultCount: number) => {
    // In a real app, this would send analytics to a service
    setSearchMetrics((prev) => ({
      totalSearches: prev.totalSearches + 1,
      popularQueries: updatePopularQueries(prev.popularQueries, query),
      averageResultsPerSearch: calculateAverage(
        prev.averageResultsPerSearch,
        resultCount,
        prev.totalSearches + 1
      ),
    }));
  }, []);

  return {
    searchMetrics,
    trackSearch,
  };
}

// Helper functions
function buildAdvancedSearchQuery(
  filters: AdvancedMemberFilters
): MemberFilters {
  const { search, searchFields, ageMin, ageMax, ...basicFilters } = filters; // eslint-disable-line @typescript-eslint/no-unused-vars

  // Start with basic filters
  const query: MemberFilters = { ...basicFilters };

  // Handle search term
  if (search) {
    query.search = search;
  }

  // Handle date-based age filters (convert to birth date ranges)
  if (ageMin !== undefined || ageMax !== undefined) {
    const today = new Date();

    if (ageMax !== undefined) {
      const minBirthDate = new Date(
        today.getFullYear() - ageMax - 1,
        today.getMonth(),
        today.getDate()
      ); // eslint-disable-line @typescript-eslint/no-unused-vars
      // Note: This would need to be implemented in the database utils
      // query.birthDateFrom = minBirthDate.toISOString();
    }

    if (ageMin !== undefined) {
      const maxBirthDate = new Date(
        today.getFullYear() - ageMin,
        today.getMonth(),
        today.getDate()
      ); // eslint-disable-line @typescript-eslint/no-unused-vars
      // query.birthDateTo = maxBirthDate.toISOString();
    }
  }

  return query;
}

function updatePopularQueries(
  current: Array<{ query: string; count: number }>,
  newQuery: string
): Array<{ query: string; count: number }> {
  const existing = current.find((item) => item.query === newQuery);

  if (existing) {
    return current
      .map((item) =>
        item.query === newQuery ? { ...item, count: item.count + 1 } : item
      )
      .sort((a, b) => b.count - a.count);
  } else {
    return [...current, { query: newQuery, count: 1 }]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Keep top 10
  }
}

function calculateAverage(
  currentAvg: number,
  newValue: number,
  totalCount: number
): number {
  return (currentAvg * (totalCount - 1) + newValue) / totalCount;
}

// Debounced search hook specifically for advanced search
export function useAdvancedDebouncedSearch(
  initialFilters: AdvancedMemberFilters = {},
  debounceMs = 300
) {
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(initialFilters);

  // Debounce the filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters, debounceMs]);

  const searchResult = useAdvancedMemberSearch(debouncedFilters);
  const { trackSearch } = useSearchAnalytics();

  // Track search when results come back
  useEffect(() => {
    if (searchResult.data && debouncedFilters.search) {
      trackSearch(debouncedFilters.search, searchResult.data.length);
    }
  }, [searchResult.data, debouncedFilters.search, trackSearch]);

  const updateFilters = useCallback(
    (newFilters: Partial<AdvancedMemberFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setDebouncedFilters(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    debouncedFilters,
    updateFilters,
    resetFilters,
    isSearching:
      JSON.stringify(filters) !== JSON.stringify(debouncedFilters) ||
      searchResult.isLoading,
    results: searchResult.data || [],
    error: searchResult.error,
    isError: searchResult.isError,
  };
}
