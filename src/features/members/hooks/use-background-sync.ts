import { useEffect, useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { memberKeys } from "./use-members";

// Network status detection
export interface NetworkStatus {
  online: boolean;
  effectiveType?: "2g" | "3g" | "4g" | "slow-2g";
  downlink?: number; // Mbps
  rtt?: number; // ms
  saveData?: boolean;
}

// Background sync configuration
export interface BackgroundSyncConfig {
  enabled: boolean;
  syncInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  staleTime: number; // milliseconds
  adaptToNetworkConditions: boolean;
  respectDataSaver: boolean;
  onlyWhenActive: boolean;
}

// Sync status
export interface SyncStatus {
  isActive: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  failedAttempts: number;
  networkStatus: NetworkStatus;
  syncStrategy: "aggressive" | "balanced" | "conservative" | "off";
}

// Default configuration
const DEFAULT_CONFIG: BackgroundSyncConfig = {
  enabled: true,
  syncInterval: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  staleTime: 60000, // 1 minute
  adaptToNetworkConditions: true,
  respectDataSaver: true,
  onlyWhenActive: true,
};

// Hook for intelligent background sync management
export function useBackgroundSync(config: Partial<BackgroundSyncConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const queryClient = useQueryClient();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    lastSync: null,
    nextSync: null,
    failedAttempts: 0,
    networkStatus: { online: true },
    syncStrategy: "balanced",
  });

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true); // Page visibility
  const networkStatusRef = useRef<NetworkStatus>({ online: true });

  // Detect network status
  const updateNetworkStatus = useCallback(() => {
    interface NetworkConnection {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
      addEventListener?: (event: string, handler: () => void) => void;
      removeEventListener?: (event: string, handler: () => void) => void;
    }

    interface NavigatorWithConnection extends Navigator {
      connection?: NetworkConnection;
      mozConnection?: NetworkConnection;
      webkitConnection?: NetworkConnection;
    }

    const nav = navigator as NavigatorWithConnection;
    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection;

    const status: NetworkStatus = {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType as
        | "2g"
        | "3g"
        | "4g"
        | "slow-2g"
        | undefined,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
    };

    networkStatusRef.current = status;
    setSyncStatus((prev) => ({ ...prev, networkStatus: status }));

    return status;
  }, []);

  // Determine sync strategy based on network conditions and user preferences
  const determineSyncStrategy = useCallback(
    (networkStatus: NetworkStatus): SyncStatus["syncStrategy"] => {
      if (!networkStatus.online) return "off";
      if (!fullConfig.enabled) return "off";
      if (networkStatus.saveData && fullConfig.respectDataSaver)
        return "conservative";

      if (!fullConfig.adaptToNetworkConditions) return "balanced";

      // Adapt based on network conditions
      if (
        networkStatus.effectiveType === "slow-2g" ||
        networkStatus.effectiveType === "2g"
      ) {
        return "conservative";
      } else if (networkStatus.effectiveType === "3g") {
        return "balanced";
      } else {
        return "aggressive";
      }
    },
    [
      fullConfig.enabled,
      fullConfig.respectDataSaver,
      fullConfig.adaptToNetworkConditions,
    ]
  );

  // Get sync interval based on strategy
  const getSyncInterval = useCallback(
    (strategy: SyncStatus["syncStrategy"]) => {
      switch (strategy) {
        case "aggressive":
          return fullConfig.syncInterval * 0.5; // Sync twice as often
        case "balanced":
          return fullConfig.syncInterval;
        case "conservative":
          return fullConfig.syncInterval * 2; // Sync half as often
        case "off":
          return Infinity;
        default:
          return fullConfig.syncInterval;
      }
    },
    [fullConfig.syncInterval]
  );

  // Check if data is stale and needs refresh
  const isDataStale = useCallback(
    (queryKey: readonly unknown[]) => {
      const queryState = queryClient.getQueryState(queryKey);
      if (!queryState) return true;

      const { dataUpdatedAt } = queryState;
      const age = Date.now() - dataUpdatedAt;

      return age > fullConfig.staleTime;
    },
    [queryClient, fullConfig.staleTime]
  );

  // Perform background sync
  const performSync = useCallback(async () => {
    if (!fullConfig.enabled || !networkStatusRef.current.online) {
      return;
    }

    if (fullConfig.onlyWhenActive && !isActiveRef.current) {
      return;
    }

    setSyncStatus((prev) => ({ ...prev, isActive: true }));

    try {
      // Sync member-related queries that are stale
      const syncPromises: Promise<unknown>[] = [];

      // Check and sync member lists
      const memberListKeys = [
        memberKeys.lists(),
        memberKeys.count(),
        memberKeys.countByStatus(),
        memberKeys.newThisMonth(),
      ];

      for (const queryKey of memberListKeys) {
        if (isDataStale(queryKey)) {
          syncPromises.push(queryClient.invalidateQueries({ queryKey }));
        }
      }

      // Sync active member details (recently accessed)
      const activeQueries = queryClient
        .getQueryCache()
        .getAll()
        .filter((query) => {
          return (
            query.queryKey[0] === "members" &&
            query.queryKey.includes("detail") &&
            query.state.fetchStatus !== "idle"
          );
        });

      for (const query of activeQueries) {
        if (isDataStale(query.queryKey)) {
          syncPromises.push(
            queryClient.invalidateQueries({ queryKey: query.queryKey })
          );
        }
      }

      await Promise.all(syncPromises);

      setSyncStatus((prev) => ({
        ...prev,
        isActive: false,
        lastSync: new Date(),
        failedAttempts: 0,
      }));
    } catch (error) {
      console.error("Background sync failed:", error);

      setSyncStatus((prev) => ({
        ...prev,
        isActive: false,
        failedAttempts: prev.failedAttempts + 1,
      }));

      // Retry if we haven't exceeded max attempts
      if (syncStatus.failedAttempts < fullConfig.maxRetries) {
        retryTimeoutRef.current = setTimeout(
          () => {
            performSync();
          },
          fullConfig.retryDelay * (syncStatus.failedAttempts + 1)
        ); // Exponential backoff
      }
    }
  }, [
    fullConfig.enabled,
    fullConfig.onlyWhenActive,
    fullConfig.maxRetries,
    fullConfig.retryDelay,
    isDataStale,
    queryClient,
    syncStatus.failedAttempts,
  ]);

  // Schedule next sync
  const scheduleNextSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearTimeout(syncIntervalRef.current);
    }

    const networkStatus = updateNetworkStatus();
    const strategy = determineSyncStrategy(networkStatus);
    const interval = getSyncInterval(strategy);

    setSyncStatus((prev) => ({
      ...prev,
      syncStrategy: strategy,
      nextSync: strategy === "off" ? null : new Date(Date.now() + interval),
    }));

    if (strategy !== "off" && interval < Infinity) {
      syncIntervalRef.current = setTimeout(() => {
        performSync();
        scheduleNextSync();
      }, interval);
    }
  }, [
    updateNetworkStatus,
    determineSyncStrategy,
    getSyncInterval,
    performSync,
  ]);

  // Handle page visibility changes
  const handleVisibilityChange = useCallback(() => {
    const isActive = !document.hidden;
    isActiveRef.current = isActive;

    if (isActive && fullConfig.enabled) {
      // Page became active - perform immediate sync if data might be stale
      const timeSinceLastSync = syncStatus.lastSync
        ? Date.now() - syncStatus.lastSync.getTime()
        : Infinity;

      if (timeSinceLastSync > fullConfig.staleTime) {
        performSync();
      }

      // Restart sync schedule
      scheduleNextSync();
    } else {
      // Page became inactive - pause sync
      if (syncIntervalRef.current) {
        clearTimeout(syncIntervalRef.current);
      }
    }
  }, [
    fullConfig.enabled,
    fullConfig.staleTime,
    syncStatus.lastSync,
    performSync,
    scheduleNextSync,
  ]);

  // Handle online/offline events
  const handleOnline = useCallback(() => {
    updateNetworkStatus();
    if (fullConfig.enabled && isActiveRef.current) {
      // Connection restored - sync immediately
      performSync();
      scheduleNextSync();
    }
  }, [fullConfig.enabled, updateNetworkStatus, performSync, scheduleNextSync]);

  const handleOffline = useCallback(() => {
    updateNetworkStatus();
    // Connection lost - stop syncing
    if (syncIntervalRef.current) {
      clearTimeout(syncIntervalRef.current);
    }
    setSyncStatus((prev) => ({
      ...prev,
      syncStrategy: "off",
      nextSync: null,
    }));
  }, [updateNetworkStatus]);

  // Manual sync trigger
  const triggerSync = useCallback(() => {
    performSync();
  }, [performSync]);

  // Pause/resume sync
  const pauseSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearTimeout(syncIntervalRef.current);
    }
    setSyncStatus((prev) => ({ ...prev, syncStrategy: "off", nextSync: null }));
  }, []);

  const resumeSync = useCallback(() => {
    if (fullConfig.enabled) {
      scheduleNextSync();
    }
  }, [fullConfig.enabled, scheduleNextSync]);

  // Setup event listeners and initial sync
  useEffect(() => {
    if (!fullConfig.enabled) return;

    // Initial network status
    updateNetworkStatus();

    // Event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Connection change listener (if supported)
    interface NetworkConnection {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
      addEventListener?: (event: string, handler: () => void) => void;
      removeEventListener?: (event: string, handler: () => void) => void;
    }

    interface NavigatorWithConnection extends Navigator {
      connection?: NetworkConnection;
      mozConnection?: NetworkConnection;
      webkitConnection?: NetworkConnection;
    }

    const nav = navigator as NavigatorWithConnection;
    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (connection as any).addEventListener("change", updateNetworkStatus);
    }

    // Start sync schedule
    scheduleNextSync();

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (connection) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (connection as any).removeEventListener("change", updateNetworkStatus);
      }

      if (syncIntervalRef.current) {
        clearTimeout(syncIntervalRef.current);
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [
    fullConfig.enabled,
    updateNetworkStatus,
    handleVisibilityChange,
    handleOnline,
    handleOffline,
    scheduleNextSync,
  ]);

  return {
    syncStatus,
    triggerSync,
    pauseSync,
    resumeSync,
    isOnline: networkStatusRef.current.online,
    networkStatus: networkStatusRef.current,
  };
}

// Hook for user activity tracking (helps optimize sync behavior)
export function useUserActivityTracking() {
  const [activityLevel, setActivityLevel] = useState<
    "idle" | "low" | "moderate" | "high"
  >("moderate");
  const [lastActivity, setLastActivity] = useState(new Date());

  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityCountRef = useRef(0);

  // Track user activity
  const trackActivity = useCallback(() => {
    const now = new Date();
    setLastActivity(now);
    activityCountRef.current += 1;

    // Clear previous timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    // Set user as idle after 5 minutes of inactivity
    activityTimeoutRef.current = setTimeout(
      () => {
        setActivityLevel("idle");
      },
      5 * 60 * 1000
    );

    // Calculate activity level based on recent interactions
    const activityInLastMinute = activityCountRef.current;

    if (activityInLastMinute > 20) {
      setActivityLevel("high");
    } else if (activityInLastMinute > 10) {
      setActivityLevel("moderate");
    } else if (activityInLastMinute > 5) {
      setActivityLevel("low");
    }

    // Reset counter periodically
    setTimeout(() => {
      activityCountRef.current = Math.max(0, activityCountRef.current - 1);
    }, 60000);
  }, []);

  // Setup activity listeners
  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, trackActivity);
      });

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [trackActivity]);

  return {
    activityLevel,
    lastActivity,
    isActive: activityLevel !== "idle",
  };
}

// Hook for sync conflict detection and resolution
export function useSyncConflictResolution() {
  const queryClient = useQueryClient();
  const [conflicts, setConflicts] = useState<
    Array<{
      queryKey: readonly unknown[];
      localVersion: unknown;
      serverVersion: unknown;
      timestamp: Date;
      resolved: boolean;
    }>
  >([]);

  // Detect conflicts between local and server data
  const detectConflict = useCallback(
    (queryKey: readonly unknown[], serverData: unknown) => {
      const localData = queryClient.getQueryData(queryKey);

      // Simple conflict detection (in reality, you'd use more sophisticated logic)
      if (
        localData &&
        JSON.stringify(localData) !== JSON.stringify(serverData)
      ) {
        setConflicts((prev) => [
          ...prev,
          {
            queryKey,
            localVersion: localData,
            serverVersion: serverData,
            timestamp: new Date(),
            resolved: false,
          },
        ]);
        return true;
      }

      return false;
    },
    [queryClient]
  );

  // Resolve conflict by choosing a version
  const resolveConflict = useCallback(
    (
      conflictIndex: number,
      resolution: "local" | "server" | "merge",
      mergedData?: unknown
    ) => {
      setConflicts((prev) => {
        const newConflicts = [...prev];
        const conflict = newConflicts[conflictIndex];

        if (!conflict) return prev;

        let resolvedData: unknown;
        switch (resolution) {
          case "local":
            resolvedData = conflict.localVersion;
            break;
          case "server":
            resolvedData = conflict.serverVersion;
            break;
          case "merge":
            resolvedData = mergedData || conflict.serverVersion;
            break;
        }

        // Update query cache with resolved data
        queryClient.setQueryData(conflict.queryKey, resolvedData);

        // Mark conflict as resolved
        newConflicts[conflictIndex] = { ...conflict, resolved: true };

        return newConflicts;
      });
    },
    [queryClient]
  );

  // Auto-resolve conflicts using simple strategies
  const autoResolveConflicts = useCallback(
    (
      strategy: "server-wins" | "local-wins" | "newest-wins" = "server-wins"
    ) => {
      setConflicts((prev) =>
        prev.map((conflict) => {
          if (conflict.resolved) return conflict;

          let resolution: "local" | "server";
          switch (strategy) {
            case "server-wins":
              resolution = "server";
              break;
            case "local-wins":
              resolution = "local";
              break;
            case "newest-wins":
              // This would require timestamp comparison in the actual data
              resolution = "server"; // Default fallback
              break;
          }

          const resolvedData =
            resolution === "local"
              ? conflict.localVersion
              : conflict.serverVersion;
          queryClient.setQueryData(conflict.queryKey, resolvedData);

          return { ...conflict, resolved: true };
        })
      );
    },
    [queryClient]
  );

  return {
    conflicts: conflicts.filter((c) => !c.resolved),
    allConflicts: conflicts,
    hasUnresolvedConflicts: conflicts.some((c) => !c.resolved),
    detectConflict,
    resolveConflict,
    autoResolveConflicts,
  };
}
