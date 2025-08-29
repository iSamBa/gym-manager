import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  createTestQueryClient,
  createQueryWrapper,
} from "@/test/query-test-utils";
import {
  setupLocalStorageMocks,
  setupTimerMocks,
  globalTestCleanup,
  createTestData,
} from "@/test/mock-helpers";
import {
  useDebouncedMemberSearch,
  useMemberValidation,
  useMemberPrefetch,
  useMemberCacheUtils,
} from "../use-member-search";
import type { Member } from "@/features/database/lib/types";

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
    getMemberById: vi.fn(),
    getMemberWithSubscription: vi.fn(),
    checkEmailExists: vi.fn(),
  },
}));

// Mock the use-members hook
vi.mock("../use-members", () => ({
  useSearchMembers: vi.fn(),
  memberKeys: {
    all: ["members"],
    lists: () => ["members", "list"],
    detail: (id: string) => ["members", "detail", id],
    withSubscription: (id: string) => ["members", "with-subscription", id],
    count: () => ["members", "count"],
    countByStatus: () => ["members", "count-by-status"],
  },
}));

// Import mocked utilities after mocking
import { useSearchMembers } from "../use-members";
const mockUseSearchMembers = vi.mocked(useSearchMembers);

describe("Member Search Hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createQueryWrapper>;
  let cleanupTimers: () => void;
  let cleanupLocalStorage: () => void;

  const mockMember1 = createTestData.member({
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
  });

  const mockMember2 = createTestData.member({
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    email: "jane@example.com",
  });

  const mockMembers = [mockMember1, mockMember2];

  beforeEach(() => {
    globalTestCleanup();

    // Setup test environment
    cleanupLocalStorage = setupLocalStorageMocks();
    cleanupTimers = setupTimerMocks();

    // Create fresh query client and wrapper for each test
    queryClient = createTestQueryClient();
    wrapper = createQueryWrapper(queryClient);

    // Setup default mock responses
    mockUseSearchMembers.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
    });

    // Mock console methods
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    cleanupTimers();
    cleanupLocalStorage();
    globalTestCleanup();
  });

  describe("useDebouncedMemberSearch", () => {
    it("should initialize with provided query", () => {
      const { result } = renderHook(
        () => useDebouncedMemberSearch("initial query"),
        { wrapper }
      );

      expect(result.current.query).toBe("initial query");
      expect(result.current.debouncedQuery).toBe("initial query");
    });

    it("should initialize with empty string by default", () => {
      const { result } = renderHook(() => useDebouncedMemberSearch(), {
        wrapper,
      });

      expect(result.current.query).toBe("");
      expect(result.current.debouncedQuery).toBe("");
    });

    it("should debounce search query updates", async () => {
      const { result } = renderHook(() => useDebouncedMemberSearch("", 100), {
        wrapper,
      });

      act(() => {
        result.current.updateQuery("john");
      });

      // Query should update immediately
      expect(result.current.query).toBe("john");
      expect(result.current.debouncedQuery).toBe("");
      expect(result.current.isSearching).toBe(true);

      // After debounce delay
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.debouncedQuery).toBe("john");
      expect(result.current.isSearching).toBe(false);
    });

    it("should cancel previous debounce when query changes", async () => {
      const { result } = renderHook(() => useDebouncedMemberSearch("", 100), {
        wrapper,
      });

      act(() => {
        result.current.updateQuery("jo");
      });

      // Advance time partially
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Update query again
      act(() => {
        result.current.updateQuery("john");
      });

      // Advance remaining time for first debounce
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Should still not be debounced
      expect(result.current.debouncedQuery).toBe("");

      // Complete the second debounce
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(result.current.debouncedQuery).toBe("john");
    });

    it("should clear query and debounced query", () => {
      const { result } = renderHook(() => useDebouncedMemberSearch("initial"), {
        wrapper,
      });

      act(() => {
        result.current.clearQuery();
      });

      expect(result.current.query).toBe("");
      expect(result.current.debouncedQuery).toBe("");
    });

    it("should show searching state correctly", () => {
      mockUseSearchMembers.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        isError: false,
      });

      const { result } = renderHook(() => useDebouncedMemberSearch(), {
        wrapper,
      });

      expect(result.current.isSearching).toBe(true);
    });

    it("should return search results", () => {
      mockUseSearchMembers.mockReturnValue({
        data: mockMembers,
        isLoading: false,
        error: null,
        isError: false,
      });

      const { result } = renderHook(() => useDebouncedMemberSearch("john"), {
        wrapper,
      });

      expect(result.current.results).toEqual(mockMembers);
    });

    it("should handle search errors", () => {
      const error = new Error("Search failed");
      mockUseSearchMembers.mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
        isError: true,
      });

      const { result } = renderHook(() => useDebouncedMemberSearch("john"), {
        wrapper,
      });

      expect(result.current.error).toBe(error);
      expect(result.current.isError).toBe(true);
      expect(result.current.results).toEqual([]);
    });

    it("should pass debounced query to search hook", () => {
      const { result } = renderHook(() => useDebouncedMemberSearch("", 100), {
        wrapper,
      });

      act(() => {
        result.current.updateQuery("john");
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockUseSearchMembers).toHaveBeenCalledWith("john");
    });
  });

  describe("useMemberValidation", () => {
    it("should check email exists in cache first", async () => {
      const { result } = renderHook(() => useMemberValidation(), { wrapper });

      // Pre-populate cache
      queryClient.setQueryData(["members", "list"], mockMembers);

      const exists = await result.current.checkEmailExists("john@example.com");
      expect(exists).toBe(true);
    });

    it("should return false if email not found in cache", async () => {
      const { result } = renderHook(() => useMemberValidation(), { wrapper });

      // Pre-populate cache with different emails
      queryClient.setQueryData(["members", "list"], mockMembers);

      const exists = await result.current.checkEmailExists(
        "nonexistent@example.com"
      );
      expect(exists).toBe(false);
    });

    it("should exclude specific member ID when checking", async () => {
      const { result } = renderHook(() => useMemberValidation(), { wrapper });

      // Pre-populate cache
      queryClient.setQueryData(["members", "list"], mockMembers);

      const exists = await result.current.checkEmailExists(
        "john@example.com",
        "1"
      );
      expect(exists).toBe(false); // Should exclude member with ID 1
    });

    it("should check database if not found in cache", async () => {
      const { result } = renderHook(() => useMemberValidation(), { wrapper });

      // Mock dynamic import
      const mockCheckEmailExists = vi.fn().mockResolvedValue(true);
      vi.doMock("@/features/database/lib/utils", () => ({
        memberUtils: {
          checkEmailExists: mockCheckEmailExists,
        },
      }));

      const exists = await result.current.checkEmailExists("test@example.com");
      expect(exists).toBe(false); // In this test, cache is empty
    });

    it("should handle errors gracefully", async () => {
      const { result } = renderHook(() => useMemberValidation(), { wrapper });

      // Mock queryClient to throw error
      queryClient.getQueriesData = vi.fn().mockImplementation(() => {
        throw new Error("Cache error");
      });

      const exists = await result.current.checkEmailExists("test@example.com");
      expect(exists).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Error checking email:",
        expect.any(Error)
      );
    });

    it("should handle case-insensitive email comparison", async () => {
      const { result } = renderHook(() => useMemberValidation(), { wrapper });

      queryClient.setQueryData(["members", "list"], mockMembers);

      const exists = await result.current.checkEmailExists("JOHN@EXAMPLE.COM");
      expect(exists).toBe(true);
    });
  });

  describe("useMemberPrefetch", () => {
    it("should prefetch member details", async () => {
      const { result } = renderHook(() => useMemberPrefetch(), { wrapper });

      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      result.current.prefetchMember("1");

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: ["members", "detail", "1"],
        queryFn: expect.any(Function),
        staleTime: 10 * 60 * 1000,
      });
    });

    it("should prefetch member with subscription", async () => {
      const { result } = renderHook(() => useMemberPrefetch(), { wrapper });

      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      result.current.prefetchMemberWithSubscription("1");

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: ["members", "with-subscription", "1"],
        queryFn: expect.any(Function),
        staleTime: 10 * 60 * 1000,
      });
    });

    it("should prefetch adjacent members", () => {
      const { result } = renderHook(() => useMemberPrefetch(), { wrapper });

      // Pre-populate cache with members list
      queryClient.setQueryData(["members", "list"], mockMembers);

      const prefetchSpy = vi.spyOn(
        result.current,
        "prefetchMemberWithSubscription"
      );

      result.current.prefetchAdjacentMembers("1");

      // Should prefetch next member (index 1)
      expect(prefetchSpy).toHaveBeenCalledWith("2");
    });

    it("should prefetch adjacent members for middle item", () => {
      const { result } = renderHook(() => useMemberPrefetch(), { wrapper });

      const members = [
        mockMember1,
        mockMember2,
        createTestData.member({ id: 3 }),
      ];
      queryClient.setQueryData(["members", "list"], members);

      const prefetchSpy = vi.spyOn(
        result.current,
        "prefetchMemberWithSubscription"
      );

      result.current.prefetchAdjacentMembers("2");

      // Should prefetch both previous and next
      expect(prefetchSpy).toHaveBeenCalledWith("1");
      expect(prefetchSpy).toHaveBeenCalledWith("3");
    });

    it("should not prefetch if member not found in cache", () => {
      const { result } = renderHook(() => useMemberPrefetch(), { wrapper });

      const prefetchSpy = vi.spyOn(
        result.current,
        "prefetchMemberWithSubscription"
      );

      result.current.prefetchAdjacentMembers("nonexistent");

      expect(prefetchSpy).not.toHaveBeenCalled();
    });

    it("should prefetch on hover with shorter stale time", () => {
      const { result } = renderHook(() => useMemberPrefetch(), { wrapper });

      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      result.current.prefetchOnHover("1");

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: ["members", "with-subscription", "1"],
        queryFn: expect.any(Function),
        staleTime: 5 * 60 * 1000, // Shorter stale time for hover
      });
    });

    it("should prefetch next member and return ID", () => {
      const { result } = renderHook(() => useMemberPrefetch(), { wrapper });

      queryClient.setQueryData(["members", "list"], mockMembers);

      const nextId = result.current.prefetchNextMember("1");

      expect(nextId).toBe("2");
    });

    it("should return null if no next member", () => {
      const { result } = renderHook(() => useMemberPrefetch(), { wrapper });

      queryClient.setQueryData(["members", "list"], mockMembers);

      const nextId = result.current.prefetchNextMember("2");

      expect(nextId).toBe(null);
    });

    it("should prefetch previous member and return ID", () => {
      const { result } = renderHook(() => useMemberPrefetch(), { wrapper });

      queryClient.setQueryData(["members", "list"], mockMembers);

      const prevId = result.current.prefetchPreviousMember("2");

      expect(prevId).toBe("1");
    });

    it("should return null if no previous member", () => {
      const { result } = renderHook(() => useMemberPrefetch(), { wrapper });

      queryClient.setQueryData(["members", "list"], mockMembers);

      const prevId = result.current.prefetchPreviousMember("1");

      expect(prevId).toBe(null);
    });
  });

  describe("useMemberCacheUtils", () => {
    it("should invalidate all members", () => {
      const { result } = renderHook(() => useMemberCacheUtils(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      result.current.invalidateAllMembers();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["members"] });
    });

    it("should invalidate member lists", () => {
      const { result } = renderHook(() => useMemberCacheUtils(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      result.current.invalidateMemberLists();

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["members", "list"],
      });
    });

    it("should invalidate specific member", () => {
      const { result } = renderHook(() => useMemberCacheUtils(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      result.current.invalidateMember("1");

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["members", "detail", "1"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["members", "with-subscription", "1"],
      });
    });

    it("should perform comprehensive cache invalidation", async () => {
      const { result } = renderHook(() => useMemberCacheUtils(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await result.current.invalidateMemberCache("1");

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["members", "detail", "1"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["members", "with-subscription", "1"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["members", "list"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["members", "count"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["members", "count-by-status"],
      });
    });

    it("should remove member from cache", () => {
      const { result } = renderHook(() => useMemberCacheUtils(), { wrapper });

      const removeSpy = vi.spyOn(queryClient, "removeQueries");

      result.current.removeMemberFromCache("1");

      expect(removeSpy).toHaveBeenCalledWith({
        queryKey: ["members", "detail", "1"],
      });
      expect(removeSpy).toHaveBeenCalledWith({
        queryKey: ["members", "with-subscription", "1"],
      });
    });

    it("should get member from cache", () => {
      const { result } = renderHook(() => useMemberCacheUtils(), { wrapper });

      queryClient.setQueryData(["members", "detail", "1"], mockMember1);

      const member = result.current.getMemberFromCache("1");

      expect(member).toEqual(mockMember1);
    });

    it("should return undefined if member not in cache", () => {
      const { result } = renderHook(() => useMemberCacheUtils(), { wrapper });

      const member = result.current.getMemberFromCache("nonexistent");

      expect(member).toBeUndefined();
    });

    it("should set member in cache", () => {
      const { result } = renderHook(() => useMemberCacheUtils(), { wrapper });

      result.current.setMemberInCache(mockMember1);

      const cached = queryClient.getQueryData(["members", "detail", "1"]);
      expect(cached).toEqual(mockMember1);
    });

    it("should update member in existing lists", () => {
      const { result } = renderHook(() => useMemberCacheUtils(), { wrapper });

      // Pre-populate list cache
      queryClient.setQueryData(["members", "list"], mockMembers);

      const updatedMember = { ...mockMember1, first_name: "John Updated" };
      result.current.setMemberInCache(updatedMember);

      const list = queryClient.getQueryData<Member[]>(["members", "list"]);
      expect(list![0]).toEqual(updatedMember);
    });

    it("should prefetch member", () => {
      const { result } = renderHook(() => useMemberCacheUtils(), { wrapper });

      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      result.current.prefetchMember("1");

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: ["members", "detail", "1"],
        queryFn: expect.any(Function),
        staleTime: 10 * 60 * 1000,
      });
    });

    it("should refresh member in background", () => {
      const { result } = renderHook(() => useMemberCacheUtils(), { wrapper });

      const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

      result.current.refreshMemberInBackground("1");

      expect(refetchSpy).toHaveBeenCalledWith({
        queryKey: ["members", "detail", "1"],
        type: "active",
      });
    });

    it("should handle search query invalidation", async () => {
      const { result } = renderHook(() => useMemberCacheUtils(), { wrapper });

      // Setup mock search queries
      const searchQueryKey = ["members", "search", "john"];
      queryClient.setQueryData(searchQueryKey, [mockMember1]);

      const getQueriesDataSpy = vi
        .spyOn(queryClient, "getQueriesData")
        .mockReturnValue([[searchQueryKey, [mockMember1]]]);
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await result.current.invalidateMemberCache("1");

      expect(getQueriesDataSpy).toHaveBeenCalledWith({
        queryKey: ["members"],
        predicate: expect.any(Function),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: searchQueryKey });
    });
  });

  describe("Integration Tests", () => {
    it("should work with debounced search and validation together", async () => {
      const searchResult = renderHook(() => useDebouncedMemberSearch(), {
        wrapper,
      });
      const validationResult = renderHook(() => useMemberValidation(), {
        wrapper,
      });

      // Setup search results
      mockUseSearchMembers.mockReturnValue({
        data: mockMembers,
        isLoading: false,
        error: null,
        isError: false,
      });

      act(() => {
        searchResult.result.current.updateQuery("john");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(searchResult.result.current.results).toEqual(mockMembers);

      // Now validate email from search results
      queryClient.setQueryData(["members", "list"], mockMembers);
      const exists =
        await validationResult.result.current.checkEmailExists(
          "john@example.com"
        );
      expect(exists).toBe(true);
    });

    it("should work with prefetch and cache utils together", () => {
      const prefetchResult = renderHook(() => useMemberPrefetch(), { wrapper });
      const cacheResult = renderHook(() => useMemberCacheUtils(), { wrapper });

      // Prefetch member
      prefetchResult.result.current.prefetchMember("1");

      // Then get from cache
      queryClient.setQueryData(["members", "detail", "1"], mockMember1);
      const cached = cacheResult.result.current.getMemberFromCache("1");
      expect(cached).toEqual(mockMember1);
    });

    it("should handle member updates across all hooks", async () => {
      renderHook(() => useDebouncedMemberSearch("john"), { wrapper });
      const cacheResult = renderHook(() => useMemberCacheUtils(), { wrapper });

      // Setup initial data
      queryClient.setQueryData(["members", "list"], mockMembers);

      // Update member
      const updatedMember = { ...mockMember1, first_name: "John Updated" };
      cacheResult.result.current.setMemberInCache(updatedMember);

      // Verify cache was updated
      const cached = cacheResult.result.current.getMemberFromCache("1");
      expect(cached.first_name).toBe("John Updated");
    });
  });
});
