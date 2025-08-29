import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  createTestQueryClient,
  createQueryWrapper,
} from "@/test/query-test-utils";
import {
  setupLocalStorageMocks,
  setupTimerMocks,
  setupDOMMocks,
  globalTestCleanup,
} from "@/test/mock-helpers";
import {
  useRouteCacheManager,
  usePageCacheStrategy,
} from "../use-route-cache-manager";

// Mock Next.js navigation
const mockPathname = vi.fn().mockReturnValue("/members");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

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
    getMemberCountByStatus: vi.fn(),
  },
}));

// Mock member keys and cache utils
vi.mock("../use-members", () => ({
  memberKeys: {
    all: ["members"],
    lists: () => ["members", "list"],
    detail: (id: string) => ["members", "detail", id],
    details: () => ["members", "details"],
    count: () => ["members", "count"],
    countByStatus: () => ["members", "count-by-status"],
  },
}));

vi.mock("../use-member-search", () => ({
  useMemberCacheUtils: () => ({
    refreshMemberInBackground: vi.fn(),
  }),
}));

describe("Route Cache Manager Hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createQueryWrapper>;
  let cleanupTimers: () => void;
  let cleanupLocalStorage: () => void;

  const mockSessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    globalTestCleanup();

    // Setup test environment
    cleanupLocalStorage = setupLocalStorageMocks();
    cleanupTimers = setupTimerMocks();
    setupDOMMocks();

    // Create fresh query client and wrapper for each test
    queryClient = createTestQueryClient();
    wrapper = createQueryWrapper(queryClient);

    // Mock sessionStorage
    Object.defineProperty(window, "sessionStorage", {
      value: mockSessionStorage,
      writable: true,
    });

    // Mock document properties for visibility API
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      writable: true,
    });

    // Reset mocks
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/members");

    // Mock console methods
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    cleanupTimers();
    cleanupLocalStorage();
    globalTestCleanup();
  });

  describe("useRouteCacheManager", () => {
    describe("Route Change Handling", () => {
      it("should refetch member lists when navigating to /members", () => {
        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

        mockPathname.mockReturnValue("/members");
        renderHook(() => useRouteCacheManager(), { wrapper });

        expect(refetchSpy).toHaveBeenCalledWith({
          queryKey: ["members", "list"],
          type: "active",
        });
        expect(refetchSpy).toHaveBeenCalledWith({
          queryKey: ["members", "count"],
          type: "active",
        });
        expect(refetchSpy).toHaveBeenCalledWith({
          queryKey: ["members", "count-by-status"],
          type: "active",
        });
      });

      it("should refresh member details when navigating to member detail page", () => {
        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

        mockPathname.mockReturnValue("/members/1");
        renderHook(() => useRouteCacheManager(), { wrapper });

        // Should call refreshMemberInBackground for the member
        expect(refetchSpy).toHaveBeenCalled();
      });

      it("should not refresh for new member page", () => {
        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

        mockPathname.mockReturnValue("/members/new");
        renderHook(() => useRouteCacheManager(), { wrapper });

        // Should not call refresh for "new" member
        expect(refetchSpy).not.toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ["members", "detail", "new"],
          })
        );
      });

      it("should force refresh for member edit pages", () => {
        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

        mockPathname.mockReturnValue("/members/1/edit");
        renderHook(() => useRouteCacheManager(), { wrapper });

        expect(refetchSpy).toHaveBeenCalledWith({
          queryKey: ["members", "detail", "1"],
          type: "active",
        });
      });

      it("should update pathname changes", () => {
        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

        const { rerender } = renderHook(() => useRouteCacheManager(), {
          wrapper,
        });

        // Initially at /members
        expect(refetchSpy).toHaveBeenCalledWith({
          queryKey: ["members", "list"],
          type: "active",
        });

        refetchSpy.mockClear();

        // Navigate to member detail
        mockPathname.mockReturnValue("/members/1");
        rerender();

        // Should handle the new route
        expect(refetchSpy).toHaveBeenCalled();
      });
    });

    describe("Visibility Change Handling", () => {
      it("should refresh member lists when tab becomes visible on members page", () => {
        mockPathname.mockReturnValue("/members");
        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

        renderHook(() => useRouteCacheManager(), { wrapper });
        refetchSpy.mockClear();

        act(() => {
          document.dispatchEvent(new Event("visibilitychange"));
        });

        expect(refetchSpy).toHaveBeenCalledWith({
          queryKey: ["members", "list"],
          type: "active",
        });
      });

      it("should refresh member detail when tab becomes visible on member detail page", () => {
        mockPathname.mockReturnValue("/members/1");
        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

        renderHook(() => useRouteCacheManager(), { wrapper });
        refetchSpy.mockClear();

        act(() => {
          document.dispatchEvent(new Event("visibilitychange"));
        });

        // Should call refreshMemberInBackground
        expect(refetchSpy).toHaveBeenCalled();
      });

      it("should not refresh when tab is hidden", () => {
        Object.defineProperty(document, "visibilityState", {
          value: "hidden",
          writable: true,
        });

        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

        renderHook(() => useRouteCacheManager(), { wrapper });
        refetchSpy.mockClear();

        act(() => {
          document.dispatchEvent(new Event("visibilitychange"));
        });

        expect(refetchSpy).not.toHaveBeenCalled();
      });

      it("should not refresh for new member page on visibility change", () => {
        mockPathname.mockReturnValue("/members/new");
        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

        renderHook(() => useRouteCacheManager(), { wrapper });
        refetchSpy.mockClear();

        act(() => {
          document.dispatchEvent(new Event("visibilitychange"));
        });

        // Should not refresh for new member page
        expect(refetchSpy).not.toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ["members", "detail", "new"],
          })
        );
      });
    });

    describe("Window Focus Handling", () => {
      it("should refresh when window gains focus", () => {
        mockSessionStorage.getItem.mockReturnValue(null);
        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

        renderHook(() => useRouteCacheManager(), { wrapper });
        refetchSpy.mockClear();

        act(() => {
          window.dispatchEvent(new Event("focus"));
        });

        expect(refetchSpy).toHaveBeenCalled();
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          "last-member-refresh",
          expect.any(String)
        );
      });

      it("should not refresh if recently refreshed", () => {
        const fiveMinutesAgo = Date.now() - 4 * 60 * 1000; // 4 minutes ago
        mockSessionStorage.getItem.mockReturnValue(fiveMinutesAgo.toString());

        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

        renderHook(() => useRouteCacheManager(), { wrapper });
        refetchSpy.mockClear();

        act(() => {
          window.dispatchEvent(new Event("focus"));
        });

        // Should not refresh because it's within 5 minutes
        expect(refetchSpy).not.toHaveBeenCalled();
      });

      it("should refresh if last refresh was over 5 minutes ago", () => {
        const sixMinutesAgo = Date.now() - 6 * 60 * 1000;
        mockSessionStorage.getItem.mockReturnValue(sixMinutesAgo.toString());

        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

        renderHook(() => useRouteCacheManager(), { wrapper });
        refetchSpy.mockClear();

        act(() => {
          window.dispatchEvent(new Event("focus"));
        });

        expect(refetchSpy).toHaveBeenCalled();
      });
    });

    describe("Cache Warming", () => {
      it("should warm member list cache", () => {
        const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");
        const { result } = renderHook(() => useRouteCacheManager(), {
          wrapper,
        });

        result.current.warmCache("member-list");

        expect(prefetchSpy).toHaveBeenCalledWith({
          queryKey: ["members", "list"],
          queryFn: expect.any(Function),
          staleTime: 5 * 60 * 1000,
        });
      });

      it("should warm member counts cache", () => {
        const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");
        const { result } = renderHook(() => useRouteCacheManager(), {
          wrapper,
        });

        result.current.warmCache("member-counts");

        expect(prefetchSpy).toHaveBeenCalledWith({
          queryKey: ["members", "count-by-status"],
          queryFn: expect.any(Function),
          staleTime: 15 * 60 * 1000,
        });
      });

      it("should handle member detail cache warming", () => {
        const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");
        const { result } = renderHook(() => useRouteCacheManager(), {
          wrapper,
        });

        result.current.warmCache("member-detail");

        // Should not crash for unhandled cache type
        expect(prefetchSpy).not.toHaveBeenCalled();
      });
    });

    describe("Cache Cleanup", () => {
      it("should clean up stale queries when leaving members section", () => {
        const removeSpy = vi.spyOn(queryClient, "removeQueries");

        mockPathname.mockReturnValue("/dashboard");
        renderHook(() => useRouteCacheManager(), { wrapper });

        expect(removeSpy).toHaveBeenCalledWith({
          queryKey: ["members"],
          predicate: expect.any(Function),
        });
      });

      it("should not clean up when on members pages", () => {
        const removeSpy = vi.spyOn(queryClient, "removeQueries");

        mockPathname.mockReturnValue("/members");
        renderHook(() => useRouteCacheManager(), { wrapper });

        expect(removeSpy).not.toHaveBeenCalled();
      });

      it("should test predicate function for search queries", () => {
        const removeSpy = vi.spyOn(queryClient, "removeQueries");

        mockPathname.mockReturnValue("/dashboard");
        renderHook(() => useRouteCacheManager(), { wrapper });

        expect(removeSpy).toHaveBeenCalledWith({
          queryKey: ["members"],
          predicate: expect.any(Function),
        });

        // Test the predicate function
        const call = removeSpy.mock.calls.find(
          (call) => call[0].predicate && call[0].queryKey[0] === "members"
        );
        expect(call).toBeDefined();

        const predicate = call![0].predicate!;

        // Should remove search queries with no data updates
        expect(
          predicate({
            queryKey: ["members", "search", "test"],
            state: { dataUpdateCount: 0 },
          } as { queryKey: string[]; state: { dataUpdateCount: number } })
        ).toBe(true);

        // Should not remove non-search queries
        expect(
          predicate({
            queryKey: ["members", "list"],
            state: { dataUpdateCount: 0 },
          } as { queryKey: string[]; state: { dataUpdateCount: number } })
        ).toBe(false);

        // Should not remove search queries with updates
        expect(
          predicate({
            queryKey: ["members", "search", "test"],
            state: { dataUpdateCount: 1 },
          } as { queryKey: string[]; state: { dataUpdateCount: number } })
        ).toBe(false);
      });

      it("should test predicate function for stale member details", () => {
        const removeSpy = vi.spyOn(queryClient, "removeQueries");

        mockPathname.mockReturnValue("/dashboard");
        renderHook(() => useRouteCacheManager(), { wrapper });

        // Find the call for member details cleanup
        const call = removeSpy.mock.calls.find(
          (call) =>
            call[0].queryKey?.[0] === "members" &&
            call[0].queryKey?.[1] === "details"
        );
        expect(call).toBeDefined();

        const predicate = call![0].predicate!;
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

        // Should remove old queries
        expect(
          predicate({
            state: { dataUpdatedAt: tenMinutesAgo },
          } as { queryKey: string[]; state: { dataUpdateCount: number } })
        ).toBe(true);

        // Should keep recent queries
        expect(
          predicate({
            state: { dataUpdatedAt: fiveMinutesAgo + 1000 },
          } as { queryKey: string[]; state: { dataUpdateCount: number } })
        ).toBe(false);
      });
    });

    describe("Manual Refresh", () => {
      it("should provide manual refresh function", () => {
        const refetchSpy = vi.spyOn(queryClient, "refetchQueries");
        const { result } = renderHook(() => useRouteCacheManager(), {
          wrapper,
        });

        refetchSpy.mockClear();

        act(() => {
          result.current.refreshCurrentPage();
        });

        expect(refetchSpy).toHaveBeenCalled();
      });
    });

    describe("Event Listener Cleanup", () => {
      it("should clean up event listeners on unmount", () => {
        const removeEventListenerSpy = vi.spyOn(
          document,
          "removeEventListener"
        );
        const windowRemoveEventListenerSpy = vi.spyOn(
          window,
          "removeEventListener"
        );

        const { unmount } = renderHook(() => useRouteCacheManager(), {
          wrapper,
        });

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith(
          "visibilitychange",
          expect.any(Function)
        );
        expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith(
          "focus",
          expect.any(Function)
        );
      });
    });
  });

  describe("usePageCacheStrategy", () => {
    it("should warm up member counts for list pages", () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      renderHook(() => usePageCacheStrategy("list"), { wrapper });

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: ["members", "count-by-status"],
        queryFn: expect.any(Function),
        staleTime: 15 * 60 * 1000,
      });
    });

    it("should pre-warm validation cache for create pages", () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      renderHook(() => usePageCacheStrategy("create"), { wrapper });

      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: ["member-validation", "recent-numbers"],
        queryFn: expect.any(Function),
        staleTime: 10 * 60 * 1000,
      });
    });

    it("should not do additional prefetching for detail pages", () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");
      const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

      renderHook(() => usePageCacheStrategy("detail"), { wrapper });

      expect(prefetchSpy).not.toHaveBeenCalled();
      expect(refetchSpy).not.toHaveBeenCalled();
    });

    it("should ensure fresh data for edit pages", () => {
      const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

      renderHook(() => usePageCacheStrategy("edit"), { wrapper });

      expect(refetchSpy).toHaveBeenCalledWith({
        queryKey: ["members"],
        type: "active",
      });
    });

    it("should handle page type changes", () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");
      const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

      const { rerender } = renderHook(
        (props: { pageType: "list" | "detail" | "create" | "edit" }) =>
          usePageCacheStrategy(props.pageType),
        { wrapper, initialProps: { pageType: "list" as const } }
      );

      expect(prefetchSpy).toHaveBeenCalled();
      prefetchSpy.mockClear();
      refetchSpy.mockClear();

      rerender({ pageType: "edit" });

      expect(refetchSpy).toHaveBeenCalled();
    });
  });

  describe("Integration Tests", () => {
    it("should work with both hooks together", () => {
      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");
      const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

      const routeResult = renderHook(() => useRouteCacheManager(), { wrapper });
      renderHook(() => usePageCacheStrategy("list"), { wrapper });

      // Both hooks should have been called
      expect(prefetchSpy).toHaveBeenCalled();
      expect(refetchSpy).toHaveBeenCalled();

      // Route cache manager should provide warmCache function
      expect(typeof routeResult.result.current.warmCache).toBe("function");
      expect(typeof routeResult.result.current.refreshCurrentPage).toBe(
        "function"
      );
    });

    it("should handle complex route navigation scenarios", () => {
      const refetchSpy = vi.spyOn(queryClient, "refetchQueries");
      const removeSpy = vi.spyOn(queryClient, "removeQueries");

      const { rerender } = renderHook(() => useRouteCacheManager(), {
        wrapper,
      });

      refetchSpy.mockClear();
      removeSpy.mockClear();

      // Navigate to different routes
      mockPathname.mockReturnValue("/members/1");
      rerender();

      mockPathname.mockReturnValue("/members/1/edit");
      rerender();

      mockPathname.mockReturnValue("/dashboard");
      rerender();

      expect(refetchSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });
  });
});
