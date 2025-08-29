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
  useBackgroundSync,
  useUserActivityTracking,
  useSyncConflictResolution,
  type BackgroundSyncConfig,
} from "../use-background-sync";

// Mock member keys
vi.mock("./use-members", () => ({
  memberKeys: {
    lists: () => ["members", "list"],
    count: () => ["members", "count"],
    countByStatus: () => ["members", "count-by-status"],
    newThisMonth: () => ["members", "new-this-month"],
  },
}));

// Mock navigator properties
const mockNavigator = {
  onLine: true,
  connection: {
    effectiveType: "4g",
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
};

describe("Background Sync Hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createQueryWrapper>;
  let cleanupTimers: () => void;
  let cleanupLocalStorage: () => void;

  beforeEach(() => {
    globalTestCleanup();

    // Setup test environment
    cleanupLocalStorage = setupLocalStorageMocks();
    cleanupTimers = setupTimerMocks();
    setupDOMMocks();

    // Create fresh query client and wrapper for each test
    queryClient = createTestQueryClient();
    wrapper = createQueryWrapper(queryClient);

    // Mock navigator
    Object.defineProperty(window, "navigator", {
      value: mockNavigator,
      writable: true,
    });

    // Mock document.hidden for visibility API
    Object.defineProperty(document, "hidden", {
      value: false,
      writable: true,
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

  describe("useBackgroundSync", () => {
    describe("Initialization", () => {
      it("should initialize with default configuration", () => {
        const { result } = renderHook(() => useBackgroundSync(), { wrapper });

        expect(result.current.syncStatus.isActive).toBe(false);
        expect(result.current.syncStatus.lastSync).toBe(null);
        expect(result.current.syncStatus.failedAttempts).toBe(0);
        expect(result.current.syncStatus.networkStatus.online).toBe(true);
        expect(result.current.syncStatus.syncStrategy).toBe("balanced");
      });

      it("should initialize with custom configuration", () => {
        const customConfig: Partial<BackgroundSyncConfig> = {
          enabled: false,
          syncInterval: 60000,
          maxRetries: 5,
        };

        const { result } = renderHook(() => useBackgroundSync(customConfig), {
          wrapper,
        });

        expect(result.current.syncStatus.syncStrategy).toBe("off");
      });

      it("should detect initial network status", () => {
        const { result } = renderHook(() => useBackgroundSync(), { wrapper });

        expect(result.current.isOnline).toBe(true);
        expect(result.current.networkStatus.online).toBe(true);
        expect(result.current.networkStatus.effectiveType).toBe("4g");
      });
    });

    describe("Network Status Detection", () => {
      it("should update network status when online status changes", async () => {
        const { result } = renderHook(() => useBackgroundSync(), { wrapper });

        // Simulate going offline
        Object.defineProperty(mockNavigator, "onLine", { value: false });

        act(() => {
          window.dispatchEvent(new Event("offline"));
        });

        await act(async () => {
          await vi.runAllTimersAsync();
        });

        expect(result.current.isOnline).toBe(false);
        expect(result.current.syncStatus.syncStrategy).toBe("off");
      });

      it("should adapt sync strategy based on network conditions", () => {
        // Test slow network
        Object.defineProperty(mockNavigator, "connection", {
          value: { ...mockNavigator.connection, effectiveType: "2g" },
        });

        const { result } = renderHook(() => useBackgroundSync(), { wrapper });

        expect(result.current.syncStatus.syncStrategy).toBe("conservative");
      });

      it("should respect data saver mode", () => {
        Object.defineProperty(mockNavigator, "connection", {
          value: { ...mockNavigator.connection, saveData: true },
        });

        const { result } = renderHook(() => useBackgroundSync(), { wrapper });

        expect(result.current.syncStatus.syncStrategy).toBe("conservative");
      });

      it("should disable sync when disabled in config", () => {
        const { result } = renderHook(
          () => useBackgroundSync({ enabled: false }),
          { wrapper }
        );

        expect(result.current.syncStatus.syncStrategy).toBe("off");
      });
    });

    describe("Sync Interval Management", () => {
      it("should use different intervals for different strategies", () => {
        const config = { syncInterval: 30000 };

        // Test aggressive strategy (should be faster)
        Object.defineProperty(mockNavigator, "connection", {
          value: { ...mockNavigator.connection, effectiveType: "4g" },
        });

        const { result: aggressiveResult } = renderHook(
          () => useBackgroundSync(config),
          { wrapper }
        );

        // Test conservative strategy (should be slower)
        Object.defineProperty(mockNavigator, "connection", {
          value: { ...mockNavigator.connection, effectiveType: "2g" },
        });

        const { result: conservativeResult } = renderHook(
          () => useBackgroundSync(config),
          { wrapper }
        );

        expect(aggressiveResult.current.syncStatus.syncStrategy).toBe(
          "aggressive"
        );
        expect(conservativeResult.current.syncStatus.syncStrategy).toBe(
          "conservative"
        );
      });

      it("should schedule next sync based on strategy", async () => {
        const { result } = renderHook(
          () => useBackgroundSync({ syncInterval: 1000 }),
          { wrapper }
        );

        await act(async () => {
          await vi.runAllTimersAsync();
        });

        expect(result.current.syncStatus.nextSync).not.toBe(null);
      });
    });

    describe("Manual Sync Control", () => {
      it("should trigger manual sync", async () => {
        const { result } = renderHook(() => useBackgroundSync(), { wrapper });

        // Add some mock data to query cache
        queryClient.setQueryData(["members", "list"], []);

        act(() => {
          result.current.triggerSync();
        });

        await act(async () => {
          await vi.runAllTimersAsync();
        });

        expect(result.current.syncStatus.lastSync).not.toBe(null);
      });

      it("should pause and resume sync", async () => {
        const { result } = renderHook(() => useBackgroundSync(), { wrapper });

        act(() => {
          result.current.pauseSync();
        });

        expect(result.current.syncStatus.syncStrategy).toBe("off");
        expect(result.current.syncStatus.nextSync).toBe(null);

        act(() => {
          result.current.resumeSync();
        });

        expect(result.current.syncStatus.syncStrategy).not.toBe("off");
      });
    });

    describe("Page Visibility Handling", () => {
      it("should sync when page becomes active after being stale", async () => {
        const { result } = renderHook(
          () => useBackgroundSync({ staleTime: 1000 }),
          { wrapper }
        );

        // Set last sync to be stale
        act(() => {
          result.current.triggerSync();
        });

        await act(async () => {
          await vi.runAllTimersAsync();
        });

        // Fast forward time to make data stale
        act(() => {
          vi.advanceTimersByTime(2000);
        });

        // Simulate page becoming hidden then visible
        Object.defineProperty(document, "hidden", { value: true });
        act(() => {
          document.dispatchEvent(new Event("visibilitychange"));
        });

        Object.defineProperty(document, "hidden", { value: false });
        act(() => {
          document.dispatchEvent(new Event("visibilitychange"));
        });

        await act(async () => {
          await vi.runAllTimersAsync();
        });

        expect(result.current.syncStatus.lastSync).toBeTruthy();
      });

      it("should pause sync when page is hidden with onlyWhenActive option", () => {
        const { result } = renderHook(
          () => useBackgroundSync({ onlyWhenActive: true }),
          { wrapper }
        );

        Object.defineProperty(document, "hidden", { value: true });
        act(() => {
          document.dispatchEvent(new Event("visibilitychange"));
        });

        // Sync should be paused when page is hidden
        expect(result.current.syncStatus.nextSync).toBe(null);
      });
    });

    describe("Error Handling and Retries", () => {
      it("should handle sync errors and retry", async () => {
        // Mock queryClient to simulate error
        const mockInvalidateQueries = vi
          .fn()
          .mockRejectedValue(new Error("Network error"));
        queryClient.invalidateQueries = mockInvalidateQueries;

        const { result } = renderHook(
          () => useBackgroundSync({ maxRetries: 2, retryDelay: 100 }),
          { wrapper }
        );

        act(() => {
          result.current.triggerSync();
        });

        await act(async () => {
          await vi.runAllTimersAsync();
        });

        expect(result.current.syncStatus.failedAttempts).toBeGreaterThan(0);
        expect(console.error).toHaveBeenCalledWith(
          "Background sync failed:",
          expect.any(Error)
        );
      });

      it("should stop retrying after max attempts", async () => {
        const mockInvalidateQueries = vi
          .fn()
          .mockRejectedValue(new Error("Network error"));
        queryClient.invalidateQueries = mockInvalidateQueries;

        const { result } = renderHook(
          () => useBackgroundSync({ maxRetries: 1, retryDelay: 50 }),
          { wrapper }
        );

        act(() => {
          result.current.triggerSync();
        });

        // Let retries complete
        await act(async () => {
          await vi.runAllTimersAsync();
        });

        expect(result.current.syncStatus.failedAttempts).toBeGreaterThan(0);
      });
    });

    describe("Data Staleness Detection", () => {
      it("should identify stale data correctly", async () => {
        const { result } = renderHook(
          () => useBackgroundSync({ staleTime: 1000 }),
          { wrapper }
        );

        // Set some data in cache
        queryClient.setQueryData(["test"], { data: "test" });

        // Fast forward time to make data stale
        act(() => {
          vi.advanceTimersByTime(2000);
        });

        act(() => {
          result.current.triggerSync();
        });

        await act(async () => {
          await vi.runAllTimersAsync();
        });

        // Should have attempted to sync stale data
        expect(result.current.syncStatus.lastSync).toBeTruthy();
      });
    });

    describe("Connection Event Handling", () => {
      it("should handle online event", async () => {
        const { result } = renderHook(() => useBackgroundSync(), { wrapper });

        // Simulate going offline then online
        Object.defineProperty(mockNavigator, "onLine", { value: false });
        act(() => {
          window.dispatchEvent(new Event("offline"));
        });

        Object.defineProperty(mockNavigator, "onLine", { value: true });
        act(() => {
          window.dispatchEvent(new Event("online"));
        });

        await act(async () => {
          await vi.runAllTimersAsync();
        });

        expect(result.current.isOnline).toBe(true);
        expect(result.current.syncStatus.lastSync).toBeTruthy();
      });
    });
  });

  describe("useUserActivityTracking", () => {
    it("should initialize with moderate activity level", () => {
      const { result } = renderHook(() => useUserActivityTracking());

      expect(result.current.activityLevel).toBe("moderate");
      expect(result.current.isActive).toBe(true);
      expect(result.current.lastActivity).toBeInstanceOf(Date);
    });

    it("should track user activity", () => {
      const { result } = renderHook(() => useUserActivityTracking());

      const initialActivity = result.current.lastActivity;

      // Simulate user activity
      act(() => {
        document.dispatchEvent(new Event("click"));
      });

      expect(result.current.lastActivity.getTime()).toBeGreaterThan(
        initialActivity.getTime()
      );
    });

    it("should set user as idle after inactivity", async () => {
      const { result } = renderHook(() => useUserActivityTracking());

      // Fast forward 5 minutes + buffer
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.activityLevel).toBe("idle");
      expect(result.current.isActive).toBe(false);
    });

    it("should calculate activity levels based on interaction frequency", () => {
      const { result } = renderHook(() => useUserActivityTracking());

      // Simulate high activity (many clicks)
      act(() => {
        for (let i = 0; i < 25; i++) {
          document.dispatchEvent(new Event("click"));
        }
      });

      expect(result.current.activityLevel).toBe("high");
    });

    it("should handle different event types", () => {
      const { result } = renderHook(() => useUserActivityTracking());

      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
      ];

      events.forEach((eventType) => {
        act(() => {
          document.dispatchEvent(new Event(eventType));
        });
      });

      expect(result.current.isActive).toBe(true);
    });
  });

  describe("useSyncConflictResolution", () => {
    it("should initialize with no conflicts", () => {
      const { result } = renderHook(() => useSyncConflictResolution(), {
        wrapper,
      });

      expect(result.current.conflicts).toEqual([]);
      expect(result.current.hasUnresolvedConflicts).toBe(false);
    });

    it("should detect conflicts between local and server data", () => {
      const { result } = renderHook(() => useSyncConflictResolution(), {
        wrapper,
      });

      const queryKey = ["test", "data"];
      const localData = { id: 1, name: "local" };
      const serverData = { id: 1, name: "server" };

      // Set local data
      queryClient.setQueryData(queryKey, localData);

      act(() => {
        result.current.detectConflict(queryKey, serverData);
      });

      expect(result.current.conflicts).toHaveLength(1);
      expect(result.current.hasUnresolvedConflicts).toBe(true);
      expect(result.current.conflicts[0].localVersion).toEqual(localData);
      expect(result.current.conflicts[0].serverVersion).toEqual(serverData);
    });

    it("should not detect conflicts when data is identical", () => {
      const { result } = renderHook(() => useSyncConflictResolution(), {
        wrapper,
      });

      const queryKey = ["test", "data"];
      const data = { id: 1, name: "same" };

      queryClient.setQueryData(queryKey, data);

      act(() => {
        const hasConflict = result.current.detectConflict(queryKey, data);
        expect(hasConflict).toBe(false);
      });

      expect(result.current.conflicts).toHaveLength(0);
    });

    it("should resolve conflicts manually", () => {
      const { result } = renderHook(() => useSyncConflictResolution(), {
        wrapper,
      });

      const queryKey = ["test", "data"];
      const localData = { id: 1, name: "local" };
      const serverData = { id: 1, name: "server" };

      queryClient.setQueryData(queryKey, localData);

      act(() => {
        result.current.detectConflict(queryKey, serverData);
      });

      expect(result.current.conflicts).toHaveLength(1);

      act(() => {
        result.current.resolveConflict(0, "server");
      });

      expect(result.current.conflicts).toHaveLength(0);
      expect(queryClient.getQueryData(queryKey)).toEqual(serverData);
    });

    it("should resolve conflicts with merge strategy", () => {
      const { result } = renderHook(() => useSyncConflictResolution(), {
        wrapper,
      });

      const queryKey = ["test", "data"];
      const localData = { id: 1, name: "local" };
      const serverData = { id: 1, name: "server" };
      const mergedData = { id: 1, name: "merged" };

      queryClient.setQueryData(queryKey, localData);

      act(() => {
        result.current.detectConflict(queryKey, serverData);
      });

      act(() => {
        result.current.resolveConflict(0, "merge", mergedData);
      });

      expect(queryClient.getQueryData(queryKey)).toEqual(mergedData);
    });

    it("should auto-resolve conflicts with different strategies", () => {
      const { result } = renderHook(() => useSyncConflictResolution(), {
        wrapper,
      });

      const queryKey = ["test", "data"];
      const localData = { id: 1, name: "local" };
      const serverData = { id: 1, name: "server" };

      queryClient.setQueryData(queryKey, localData);

      act(() => {
        result.current.detectConflict(queryKey, serverData);
      });

      // Test server-wins strategy
      act(() => {
        result.current.autoResolveConflicts("server-wins");
      });

      expect(queryClient.getQueryData(queryKey)).toEqual(serverData);
      expect(result.current.conflicts).toHaveLength(0);
    });

    it("should auto-resolve with local-wins strategy", () => {
      const { result } = renderHook(() => useSyncConflictResolution(), {
        wrapper,
      });

      const queryKey = ["test", "data"];
      const localData = { id: 1, name: "local" };
      const serverData = { id: 1, name: "server" };

      queryClient.setQueryData(queryKey, localData);

      act(() => {
        result.current.detectConflict(queryKey, serverData);
      });

      act(() => {
        result.current.autoResolveConflicts("local-wins");
      });

      expect(queryClient.getQueryData(queryKey)).toEqual(localData);
    });

    it("should handle multiple conflicts", () => {
      const { result } = renderHook(() => useSyncConflictResolution(), {
        wrapper,
      });

      const queryKey1 = ["test", "data1"];
      const queryKey2 = ["test", "data2"];

      queryClient.setQueryData(queryKey1, { id: 1, name: "local1" });
      queryClient.setQueryData(queryKey2, { id: 2, name: "local2" });

      act(() => {
        result.current.detectConflict(queryKey1, { id: 1, name: "server1" });
        result.current.detectConflict(queryKey2, { id: 2, name: "server2" });
      });

      expect(result.current.conflicts).toHaveLength(2);

      act(() => {
        result.current.autoResolveConflicts("server-wins");
      });

      expect(result.current.conflicts).toHaveLength(0);
    });

    it("should provide access to all conflicts including resolved ones", () => {
      const { result } = renderHook(() => useSyncConflictResolution(), {
        wrapper,
      });

      const queryKey = ["test", "data"];
      queryClient.setQueryData(queryKey, { id: 1, name: "local" });

      act(() => {
        result.current.detectConflict(queryKey, { id: 1, name: "server" });
      });

      expect(result.current.allConflicts).toHaveLength(1);

      act(() => {
        result.current.resolveConflict(0, "server");
      });

      expect(result.current.conflicts).toHaveLength(0);
      expect(result.current.allConflicts).toHaveLength(1);
      expect(result.current.allConflicts[0].resolved).toBe(true);
    });
  });

  describe("Integration Tests", () => {
    it("should work together - sync with activity tracking", async () => {
      const syncResult = renderHook(
        () => useBackgroundSync({ syncInterval: 1000 }),
        { wrapper }
      );
      const activityResult = renderHook(() => useUserActivityTracking());

      // Simulate user activity
      act(() => {
        document.dispatchEvent(new Event("click"));
      });

      expect(activityResult.result.current.isActive).toBe(true);

      // Trigger sync
      act(() => {
        syncResult.result.current.triggerSync();
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(syncResult.result.current.syncStatus.lastSync).toBeTruthy();
    });

    it("should handle conflict resolution during background sync", async () => {
      renderHook(() => useBackgroundSync(), { wrapper });
      const conflictResult = renderHook(() => useSyncConflictResolution(), {
        wrapper,
      });

      const queryKey = ["members", "list"];
      const localData = [{ id: 1, name: "local" }];
      const serverData = [{ id: 1, name: "server" }];

      queryClient.setQueryData(queryKey, localData);

      act(() => {
        conflictResult.result.current.detectConflict(queryKey, serverData);
      });

      expect(conflictResult.result.current.hasUnresolvedConflicts).toBe(true);

      act(() => {
        conflictResult.result.current.autoResolveConflicts("server-wins");
      });

      expect(conflictResult.result.current.hasUnresolvedConflicts).toBe(false);
    });
  });
});
