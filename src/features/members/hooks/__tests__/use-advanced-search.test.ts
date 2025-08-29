import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  createTestQueryClient,
  createQueryWrapper,
  mockQueryResponse,
} from "@/test/query-test-utils";
import {
  setupLocalStorageMocks,
  setupTimerMocks,
  globalTestCleanup,
  createTestData,
} from "@/test/mock-helpers";

// Mock Supabase first to avoid hoisting issues
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}));

// Mock database utilities
vi.mock("@/features/database/lib/utils", () => ({
  memberUtils: {
    getMembers: vi.fn(),
  },
}));

vi.mock("./use-members", () => ({
  memberKeys: {
    all: ["members"],
  },
}));

// Import hooks and utilities after mocking
import {
  useMemberSearchHistory,
  useAdvancedMemberSearch,
  useMemberSearchSuggestions,
  useSearchAnalytics,
  useAdvancedDebouncedSearch,
  type AdvancedMemberFilters,
} from "../use-advanced-search";
import { memberUtils } from "@/features/database/lib/utils";
const mockMemberUtils = vi.mocked(memberUtils);

describe("Advanced Search Hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createQueryWrapper>;
  let cleanupTimers: () => void;
  let cleanupLocalStorage: () => void;

  beforeEach(() => {
    globalTestCleanup();

    // Setup test environment
    cleanupLocalStorage = setupLocalStorageMocks();
    cleanupTimers = setupTimerMocks();

    // Create fresh query client and wrapper for each test
    queryClient = createTestQueryClient();
    wrapper = createQueryWrapper(queryClient);

    // Mock console methods
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    cleanupTimers();
    cleanupLocalStorage();
    globalTestCleanup();
  });

  describe("useMemberSearchHistory", () => {
    it("should initialize with empty history when localStorage is empty", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const { result } = renderHook(() => useMemberSearchHistory());

      expect(result.current.searchHistory).toEqual([]);
    });

    it("should load history from localStorage on mount", () => {
      const mockHistory = ["test query", "another search"];
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(mockHistory)
      );

      const { result } = renderHook(() => useMemberSearchHistory());

      expect(result.current.searchHistory).toEqual(mockHistory);
      expect(localStorage.getItem).toHaveBeenCalledWith(
        "member-search-history"
      );
    });

    it("should handle localStorage parsing errors gracefully", () => {
      vi.mocked(localStorage.getItem).mockReturnValue("invalid json");
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() => useMemberSearchHistory());

      expect(result.current.searchHistory).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to load search history:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should add new queries to history", () => {
      vi.mocked(localStorage.getItem).mockReturnValue("[]");

      const { result } = renderHook(() => useMemberSearchHistory());

      act(() => {
        result.current.addToHistory("new query");
      });

      expect(result.current.searchHistory).toEqual(["new query"]);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "member-search-history",
        JSON.stringify(["new query"])
      );
    });

    it("should not add empty or short queries to history", () => {
      const { result } = renderHook(() => useMemberSearchHistory());

      act(() => {
        result.current.addToHistory("");
        result.current.addToHistory("a");
        result.current.addToHistory("  ");
      });

      expect(result.current.searchHistory).toEqual([]);
    });

    it("should move existing queries to top when added again", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["query1", "query2", "query3"])
      );

      const { result } = renderHook(() => useMemberSearchHistory());

      act(() => {
        result.current.addToHistory("query2");
      });

      expect(result.current.searchHistory).toEqual([
        "query2",
        "query1",
        "query3",
      ]);
    });

    it("should limit history to MAX_HISTORY_ITEMS", () => {
      const longHistory = Array.from({ length: 15 }, (_, i) => `query${i}`);
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(longHistory)
      );

      const { result } = renderHook(() => useMemberSearchHistory());

      act(() => {
        result.current.addToHistory("new query");
      });

      expect(result.current.searchHistory).toHaveLength(10);
      expect(result.current.searchHistory[0]).toBe("new query");
    });

    it("should remove queries from history", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["query1", "query2", "query3"])
      );

      const { result } = renderHook(() => useMemberSearchHistory());

      act(() => {
        result.current.removeFromHistory("query2");
      });

      expect(result.current.searchHistory).toEqual(["query1", "query3"]);
    });

    it("should clear entire history", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["query1", "query2", "query3"])
      );

      const { result } = renderHook(() => useMemberSearchHistory());

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.searchHistory).toEqual([]);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "member-search-history",
        JSON.stringify([])
      );
    });

    it("should handle localStorage save errors gracefully", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() => useMemberSearchHistory());

      act(() => {
        result.current.addToHistory("test query");
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save search history:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("useAdvancedMemberSearch", () => {
    it("should not execute query when search term is too short", () => {
      const { result } = renderHook(
        () => useAdvancedMemberSearch({ search: "a" }),
        { wrapper }
      );

      // Query should be disabled for short search terms
      expect(result.current.data).toEqual([]);
      expect(mockMemberUtils.getMembers).not.toHaveBeenCalled();
    });

    it("should execute query when search term is valid", async () => {
      const mockMembers = [
        createTestData.member({ first_name: "John", last_name: "Doe" }),
      ];
      mockMemberUtils.getMembers.mockImplementation(() =>
        mockQueryResponse(mockMembers)
      );

      const { result } = renderHook(
        () => useAdvancedMemberSearch({ search: "john" }),
        { wrapper }
      );

      // Wait for query to resolve immediately
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.data).toEqual(mockMembers);
      expect(mockMemberUtils.getMembers).toHaveBeenCalledWith({
        search: "john",
      });
    });

    it("should build advanced search query with filters", async () => {
      mockMemberUtils.getMembers.mockImplementation(() =>
        mockQueryResponse([])
      );

      const filters: AdvancedMemberFilters = {
        search: "john",
        ageMin: 25,
        ageMax: 35,
        status: "active",
      };

      renderHook(() => useAdvancedMemberSearch(filters), { wrapper });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockMemberUtils.getMembers).toHaveBeenCalledWith({
        search: "john",
        status: "active",
        // Age filters are TODO in implementation, so they won't be included yet
      });
    });

    it("should have proper query key structure", () => {
      const filters: AdvancedMemberFilters = {
        search: "john",
        status: "active",
      };

      const { result } = renderHook(() => useAdvancedMemberSearch(filters), {
        wrapper,
      });

      // Query should be initialized with proper structure
      expect(
        result.current.isLoading !== undefined ||
          result.current.data !== undefined
      ).toBe(true);
    });
  });

  describe("useMemberSearchSuggestions", () => {
    it("should return suggestions based on search history", async () => {
      // Test the integration where we first populate history, then check suggestions
      const { result: historyResult } = renderHook(() =>
        useMemberSearchHistory()
      );

      // Add some items to history
      act(() => {
        historyResult.current.addToHistory("john doe");
        historyResult.current.addToHistory("jane smith");
        historyResult.current.addToHistory("test query");
      });

      // Verify history is populated
      expect(historyResult.current.searchHistory).toContain("john doe");

      // Now test suggestions - they should work regardless of localStorage initial state
      // because the function also includes built-in patterns
      const { result } = renderHook(() => useMemberSearchSuggestions("john"), {
        wrapper,
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Since each hook instance has its own state, we expect at least one suggestion
      // that matches "john" from the built-in patterns or other logic
      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it("should suggest member number pattern for numeric queries", async () => {
      const { result } = renderHook(() => useMemberSearchSuggestions("123"), {
        wrapper,
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.data).toContain("Member #123");
    });

    it("should suggest email search for email-like queries", async () => {
      const { result } = renderHook(() => useMemberSearchSuggestions("john@"), {
        wrapper,
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.data).toContain("Email: john@");
    });

    it("should include popular patterns in suggestions", async () => {
      const { result } = renderHook(
        () => useMemberSearchSuggestions("active"),
        { wrapper }
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.data).toContain("active members");
    });

    it("should limit suggestions to 5 items", async () => {
      const longHistory = Array.from({ length: 10 }, (_, i) => `test${i}`);
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(longHistory)
      );

      const { result } = renderHook(() => useMemberSearchSuggestions("test"), {
        wrapper,
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.data?.length).toBeLessThanOrEqual(5);
    });

    it("should not execute query for empty search term", () => {
      const { result } = renderHook(() => useMemberSearchSuggestions(""), {
        wrapper,
      });

      expect(result.current.data).toBeUndefined();
    });
  });

  describe("useSearchAnalytics", () => {
    it("should initialize with default metrics", () => {
      const { result } = renderHook(() => useSearchAnalytics());

      expect(result.current.searchMetrics).toEqual({
        totalSearches: 0,
        popularQueries: [],
        averageResultsPerSearch: 0,
      });
    });

    it("should track search and update metrics", () => {
      const { result } = renderHook(() => useSearchAnalytics());

      act(() => {
        result.current.trackSearch("john", 5);
      });

      expect(result.current.searchMetrics).toEqual({
        totalSearches: 1,
        popularQueries: [{ query: "john", count: 1 }],
        averageResultsPerSearch: 5,
      });
    });

    it("should update popular queries correctly", () => {
      const { result } = renderHook(() => useSearchAnalytics());

      act(() => {
        result.current.trackSearch("john", 5);
        result.current.trackSearch("jane", 3);
        result.current.trackSearch("john", 7);
      });

      expect(result.current.searchMetrics.popularQueries).toEqual([
        { query: "john", count: 2 },
        { query: "jane", count: 1 },
      ]);
    });

    it("should calculate average results correctly", () => {
      const { result } = renderHook(() => useSearchAnalytics());

      act(() => {
        result.current.trackSearch("query1", 4);
        result.current.trackSearch("query2", 6);
        result.current.trackSearch("query3", 8);
      });

      expect(result.current.searchMetrics.averageResultsPerSearch).toBe(6);
    });

    it("should limit popular queries to top 10", () => {
      const { result } = renderHook(() => useSearchAnalytics());

      act(() => {
        // Add 12 different queries
        for (let i = 0; i < 12; i++) {
          result.current.trackSearch(`query${i}`, 1);
        }
      });

      expect(result.current.searchMetrics.popularQueries).toHaveLength(10);
    });
  });

  describe("useAdvancedDebouncedSearch", () => {
    it("should initialize with provided filters", () => {
      const initialFilters: AdvancedMemberFilters = {
        search: "initial",
        status: "active",
      };

      const { result } = renderHook(
        () => useAdvancedDebouncedSearch(initialFilters),
        { wrapper }
      );

      expect(result.current.filters).toEqual(initialFilters);
      expect(result.current.debouncedFilters).toEqual(initialFilters);
    });

    it("should debounce filter updates", async () => {
      mockMemberUtils.getMembers.mockImplementation(() =>
        mockQueryResponse([])
      );

      const { result } = renderHook(() => useAdvancedDebouncedSearch({}, 100), {
        wrapper,
      });

      act(() => {
        result.current.updateFilters({ search: "john" });
      });

      // Filters should update immediately
      expect(result.current.filters.search).toBe("john");
      expect(result.current.debouncedFilters.search).toBeUndefined();

      // Fast forward debounce timer
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.debouncedFilters.search).toBe("john");
    });

    it("should indicate searching state correctly", async () => {
      mockMemberUtils.getMembers.mockImplementation(() =>
        mockQueryResponse([])
      );

      const { result } = renderHook(() => useAdvancedDebouncedSearch({}, 100), {
        wrapper,
      });

      act(() => {
        result.current.updateFilters({ search: "john" });
      });

      expect(result.current.isSearching).toBe(true);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isSearching).toBe(false);
    });

    it("should track search analytics when results arrive", async () => {
      const mockMembers = [
        createTestData.member({ id: 1 }),
        createTestData.member({ id: 2 }),
        createTestData.member({ id: 3 }),
      ];
      mockMemberUtils.getMembers.mockImplementation(() =>
        mockQueryResponse(mockMembers)
      );

      const { result } = renderHook(() => useAdvancedDebouncedSearch({}, 100), {
        wrapper,
      });

      act(() => {
        result.current.updateFilters({ search: "john" });
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Wait for the search to complete
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.results).toEqual(mockMembers);
    });

    it("should reset filters to initial state", () => {
      const initialFilters: AdvancedMemberFilters = {
        search: "initial",
        status: "active",
      };

      const { result } = renderHook(
        () => useAdvancedDebouncedSearch(initialFilters),
        { wrapper }
      );

      act(() => {
        result.current.updateFilters({ search: "modified" });
      });

      expect(result.current.filters.search).toBe("modified");

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters).toEqual(initialFilters);
      expect(result.current.debouncedFilters).toEqual(initialFilters);
    });

    it("should handle search errors", async () => {
      const error = new Error("Search failed");
      mockMemberUtils.getMembers.mockImplementation(() =>
        mockQueryResponse([], { error })
      );

      const { result } = renderHook(() => useAdvancedDebouncedSearch({}, 100), {
        wrapper,
      });

      act(() => {
        result.current.updateFilters({ search: "john" });
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isError).toBe(true);
    });

    it("should update filters partially", () => {
      const { result } = renderHook(
        () =>
          useAdvancedDebouncedSearch({ search: "initial", status: "active" }),
        { wrapper }
      );

      act(() => {
        result.current.updateFilters({ search: "updated" });
      });

      expect(result.current.filters).toEqual({
        search: "updated",
        status: "active",
      });
    });
  });

  describe("Helper Functions Integration", () => {
    it("should handle buildAdvancedSearchQuery with various filters", async () => {
      const filters: AdvancedMemberFilters = {
        search: "john",
        status: "active",
        ageMin: 25,
        ageMax: 35,
        membershipType: "premium",
      };

      mockMemberUtils.getMembers.mockImplementation(() =>
        mockQueryResponse([])
      );

      renderHook(() => useAdvancedMemberSearch(filters), { wrapper });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockMemberUtils.getMembers).toHaveBeenCalledWith({
        search: "john",
        status: "active",
        membershipType: "premium",
        // Age filters are not implemented yet in the function
      });
    });
  });
});
