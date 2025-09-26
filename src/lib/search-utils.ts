/**
 * Unified search utilities - replaces duplicate search patterns
 * across features/members and features/trainers
 */
import React, { useState, useCallback, useEffect } from "react";
import { UseQueryResult } from "@tanstack/react-query";

/**
 * Generic debounced search hook - can be used for any data type
 */
export function useDebouncedSearch<T>(
  searchHook: (query: string) => UseQueryResult<T[], Error>,
  initialQuery = "",
  debounceMs = 300
) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Use the search hook with debounced query
  const searchResult = searchHook(debouncedQuery);

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
  }, []);

  return {
    query,
    debouncedQuery,
    updateQuery,
    clearQuery,
    isSearching: query !== debouncedQuery || searchResult.isLoading,
    results: searchResult.data || [],
    error: searchResult.error,
    isError: searchResult.isError,
  };
}

/**
 * Search term preprocessing utilities
 */
export const searchUtils = {
  /**
   * Normalizes a search term for consistent matching
   */
  normalizeQuery: (query: string): string => {
    return query.trim().toLowerCase();
  },

  /**
   * Checks if a search query is valid (not empty and meets minimum length)
   */
  isValidQuery: (query: string, minLength = 2): boolean => {
    return query.trim().length >= minLength;
  },

  /**
   * Splits a search query into individual terms
   */
  splitQuery: (query: string): string[] => {
    return query.trim().split(/\s+/).filter(Boolean);
  },

  /**
   * Creates a search pattern for partial matching
   */
  createSearchPattern: (query: string): string => {
    return `%${query.toLowerCase()}%`;
  },

  /**
   * Creates a prefix search pattern (more efficient for indexed fields)
   */
  createPrefixPattern: (query: string): string => {
    return `${query.toLowerCase()}%`;
  },

  /**
   * Highlights search terms in text (for UI display)
   */
  highlightMatches: (
    text: string,
    searchTerms: string[],
    highlightClass = "bg-yellow-200"
  ): string => {
    if (!searchTerms.length) return text;

    let highlightedText = text;
    searchTerms.forEach((term) => {
      const regex = new RegExp(`(${term})`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        `<span class="${highlightClass}">$1</span>`
      );
    });

    return highlightedText;
  },

  /**
   * Checks if any field in an object matches the search terms
   */
  matchesAnyField: <T extends Record<string, unknown>>(
    item: T,
    searchTerms: string[],
    fields: (keyof T)[]
  ): boolean => {
    if (!searchTerms.length) return true;

    return searchTerms.some((term) =>
      fields.some((field) => {
        const value = item[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(term.toLowerCase());
        }
        return false;
      })
    );
  },

  /**
   * Scores search results based on relevance
   */
  scoreSearchMatch: <T extends Record<string, unknown>>(
    item: T,
    searchTerms: string[],
    fields: { field: keyof T; weight: number }[]
  ): number => {
    let score = 0;

    fields.forEach(({ field, weight }) => {
      const value = item[field];
      if (typeof value === "string") {
        const lowerValue = value.toLowerCase();
        searchTerms.forEach((term) => {
          const lowerTerm = term.toLowerCase();
          // Exact match gets highest score
          if (lowerValue === lowerTerm) {
            score += weight * 10;
          }
          // Starts with gets high score
          else if (lowerValue.startsWith(lowerTerm)) {
            score += weight * 5;
          }
          // Contains gets medium score
          else if (lowerValue.includes(lowerTerm)) {
            score += weight * 2;
          }
        });
      }
    });

    return score;
  },
};

/**
 * Generic client-side search and filter utility
 * Use this only when server-side search is not available
 */
export function useClientSearch<T extends Record<string, unknown>>(
  data: T[],
  searchFields: (keyof T)[],
  query: string,
  debounceMs = 300
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Filter and sort results
  const results = React.useMemo(() => {
    if (!searchUtils.isValidQuery(debouncedQuery)) {
      return data;
    }

    const searchTerms = searchUtils.splitQuery(debouncedQuery);

    // Filter matching items
    const filtered = data.filter((item) =>
      searchUtils.matchesAnyField(item, searchTerms, searchFields)
    );

    // Score and sort by relevance
    const scored = filtered
      .map((item) => ({
        item,
        score: searchUtils.scoreSearchMatch(
          item,
          searchTerms,
          searchFields.map((field) => ({ field, weight: 1 }))
        ),
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);

    return scored;
  }, [data, searchFields, debouncedQuery]);

  return {
    results,
    isSearching: query !== debouncedQuery,
    hasResults: results.length > 0,
    resultCount: results.length,
  };
}
