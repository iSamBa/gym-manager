import { useEffect, useCallback, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Member } from "@/features/database/lib/types";
import { memberKeys } from "./use-members";

// Real-time connection status
export interface RealtimeConnectionStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
  latency?: number; // ms
}

// Real-time member change event
export interface MemberChangeEvent {
  type: "INSERT" | "UPDATE" | "DELETE";
  member: Member;
  old?: Partial<Member>;
  timestamp: Date;
}

// Hook for real-time member updates
export function useRealtimeMembers(
  options: {
    enabled?: boolean;
    onMemberChange?: (event: MemberChangeEvent) => void;
    onConnectionChange?: (status: RealtimeConnectionStatus) => void;
    autoReconnect?: boolean;
    maxReconnectAttempts?: number;
  } = {}
) {
  const {
    enabled = true,
    onMemberChange,
    onConnectionChange,
    autoReconnect = true,
    maxReconnectAttempts = 5,
  } = options;

  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeConnectionStatus>({
      connected: false,
      connecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0,
    });

  const channelRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Update connection status
  const updateConnectionStatus = useCallback(
    (updates: Partial<RealtimeConnectionStatus>) => {
      setConnectionStatus((prev) => {
        const newStatus = { ...prev, ...updates };
        onConnectionChange?.(newStatus);
        return newStatus;
      });
    },
    [onConnectionChange]
  );

  // Handle member changes from real-time events
  const handleMemberChange = useCallback(
    (payload: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      const { eventType, new: newRecord, old: oldRecord } = payload;

      try {
        let member: Member;
        let changeEvent: MemberChangeEvent;

        switch (eventType) {
          case "INSERT":
            member = newRecord as Member;
            changeEvent = {
              type: "INSERT",
              member,
              timestamp: new Date(),
            };

            // Add new member to cache
            queryClient.setQueryData(memberKeys.detail(member.id), member);

            // Update lists by invalidating them (will trigger refetch)
            queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
            queryClient.invalidateQueries({ queryKey: memberKeys.count() });
            queryClient.invalidateQueries({
              queryKey: memberKeys.countByStatus(),
            });
            break;

          case "UPDATE":
            member = newRecord as Member;
            const oldMember = oldRecord as Partial<Member>;
            changeEvent = {
              type: "UPDATE",
              member,
              old: oldMember,
              timestamp: new Date(),
            };

            // Update member in cache
            queryClient.setQueryData(memberKeys.detail(member.id), member);

            // Update member in all lists
            queryClient.setQueriesData(
              { queryKey: memberKeys.lists() },
              (oldData: Member[] | undefined) =>
                oldData?.map((m) => (m.id === member.id ? member : m))
            );

            // If status changed, invalidate status-related queries
            if (oldMember.status !== member.status) {
              queryClient.invalidateQueries({
                queryKey: memberKeys.countByStatus(),
              });
            }
            break;

          case "DELETE":
            const deletedMember = oldRecord as Member;
            changeEvent = {
              type: "DELETE",
              member: deletedMember,
              timestamp: new Date(),
            };

            // Remove member from cache
            queryClient.removeQueries({
              queryKey: memberKeys.detail(deletedMember.id),
            });

            // Remove from lists
            queryClient.setQueriesData(
              { queryKey: memberKeys.lists() },
              (oldData: Member[] | undefined) =>
                oldData?.filter((m) => m.id !== deletedMember.id)
            );

            // Update counts
            queryClient.invalidateQueries({ queryKey: memberKeys.count() });
            queryClient.invalidateQueries({
              queryKey: memberKeys.countByStatus(),
            });
            break;

          default:
            console.warn("Unknown real-time event type:", eventType);
            return;
        }

        // Notify parent component
        onMemberChange?.(changeEvent);

        // Reset reconnect attempts on successful event
        if (connectionStatus.reconnectAttempts > 0) {
          updateConnectionStatus({ reconnectAttempts: 0 });
        }
      } catch (error) {
        console.error("Error handling real-time member change:", error);
      }
    },
    [
      queryClient,
      onMemberChange,
      connectionStatus.reconnectAttempts,
      updateConnectionStatus,
      scheduleReconnect,
    ]
  );

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!enabled || channelRef.current) return;

    updateConnectionStatus({ connecting: true, error: null });

    try {
      // Create channel for members table
      const channel = supabase
        .channel("members-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "members",
          },
          handleMemberChange
        )
        .subscribe((status) => {
          switch (status) {
            case "SUBSCRIBED":
              updateConnectionStatus({
                connected: true,
                connecting: false,
                lastConnected: new Date(),
                error: null,
              });
              break;
            case "CHANNEL_ERROR":
              updateConnectionStatus({
                connected: false,
                connecting: false,
                error: "Channel subscription error",
              });

              // Auto-reconnect if enabled
              if (
                autoReconnect &&
                connectionStatus.reconnectAttempts < maxReconnectAttempts
              ) {
                scheduleReconnect();
              }
              break;
            case "TIMED_OUT":
              updateConnectionStatus({
                connected: false,
                connecting: false,
                error: "Connection timed out",
              });

              if (
                autoReconnect &&
                connectionStatus.reconnectAttempts < maxReconnectAttempts
              ) {
                scheduleReconnect();
              }
              break;
            case "CLOSED":
              updateConnectionStatus({
                connected: false,
                connecting: false,
              });
              break;
          }
        });

      channelRef.current = channel;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to setup real-time subscription";
      updateConnectionStatus({
        connected: false,
        connecting: false,
        error: errorMessage,
      });
    }
  }, [
    enabled,
    handleMemberChange,
    updateConnectionStatus,
    autoReconnect,
    connectionStatus.reconnectAttempts,
    maxReconnectAttempts,
  ]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(
      1000 * Math.pow(2, connectionStatus.reconnectAttempts),
      30000
    ); // Exponential backoff, max 30s

    reconnectTimeoutRef.current = setTimeout(() => {
      updateConnectionStatus({
        reconnectAttempts: connectionStatus.reconnectAttempts + 1,
      });

      // Clean up existing channel
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      setupRealtimeSubscription();
    }, delay);
  }, [
    connectionStatus.reconnectAttempts,
    updateConnectionStatus,
    setupRealtimeSubscription,
  ]);

  // Cleanup real-time subscription
  const cleanupRealtimeSubscription = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    updateConnectionStatus({
      connected: false,
      connecting: false,
    });
  }, [updateConnectionStatus]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    cleanupRealtimeSubscription();
    updateConnectionStatus({ reconnectAttempts: 0 });
    setupRealtimeSubscription();
  }, [
    cleanupRealtimeSubscription,
    updateConnectionStatus,
    setupRealtimeSubscription,
  ]);

  // Setup subscription when enabled
  useEffect(() => {
    if (enabled) {
      setupRealtimeSubscription();
    } else {
      cleanupRealtimeSubscription();
    }

    return cleanupRealtimeSubscription;
  }, [enabled, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  // Measure connection latency
  const measureLatency = useCallback(async () => {
    if (!connectionStatus.connected || !channelRef.current) {
      return null;
    }

    const startTime = Date.now();

    try {
      // Send a ping through the channel (this is a simplified approach)
      // In real implementation, you might use a dedicated ping mechanism
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Latency test timeout")),
          5000
        );

        // Simulate latency test by checking if channel is still responsive
        if (channelRef.current) {
          clearTimeout(timeout);
          resolve(null);
        } else {
          reject(new Error("Channel not available"));
        }
      });

      const latency = Date.now() - startTime;
      updateConnectionStatus({ latency });
      return latency;
    } catch (error) {
      console.error("Failed to measure latency:", error);
      return null;
    }
  }, [connectionStatus.connected, updateConnectionStatus]);

  return {
    connectionStatus,
    reconnect,
    measureLatency,
    isConnected: connectionStatus.connected,
    isConnecting: connectionStatus.connecting,
    hasError: !!connectionStatus.error,
  };
}

// Hook for conflict resolution in concurrent edits
export function useMemberConflictResolution() {
  const queryClient = useQueryClient();
  const [conflicts, setConflicts] = useState<
    Array<{
      memberId: string;
      localVersion: Member;
      remoteVersion: Member;
      timestamp: Date;
    }>
  >([]);

  // Detect conflicts when real-time updates arrive
  const detectConflict = useCallback(
    (memberId: string, remoteVersion: Member) => {
      const localVersion = queryClient.getQueryData<Member>(
        memberKeys.detail(memberId)
      );

      if (!localVersion) return false;

      // Check if local version was modified after the last known server update
      const localModified = new Date(localVersion.updated_at || 0);
      const remoteModified = new Date(remoteVersion.updated_at || 0);

      // If local version is newer than remote, there might be a conflict
      if (localModified > remoteModified) {
        setConflicts((prev) => [
          ...prev,
          {
            memberId,
            localVersion,
            remoteVersion,
            timestamp: new Date(),
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
      memberId: string,
      resolution: "local" | "remote" | "merge",
      mergedData?: Partial<Member>
    ) => {
      const conflict = conflicts.find((c) => c.memberId === memberId);
      if (!conflict) return;

      let resolvedMember: Member;

      switch (resolution) {
        case "local":
          resolvedMember = conflict.localVersion;
          break;
        case "remote":
          resolvedMember = conflict.remoteVersion;
          break;
        case "merge":
          resolvedMember = {
            ...conflict.remoteVersion,
            ...conflict.localVersion,
            ...mergedData,
            updated_at: new Date().toISOString(),
          };
          break;
      }

      // Update cache with resolved version
      queryClient.setQueryData(memberKeys.detail(memberId), resolvedMember);

      // Remove conflict from list
      setConflicts((prev) => prev.filter((c) => c.memberId !== memberId));

      return resolvedMember;
    },
    [conflicts, queryClient]
  );

  // Auto-resolve conflicts using simple strategies
  const autoResolveConflict = useCallback(
    (memberId: string, strategy: "newest" | "local" | "remote" = "newest") => {
      const conflict = conflicts.find((c) => c.memberId === memberId);
      if (!conflict) return;

      switch (strategy) {
        case "newest":
          const localTime = new Date(
            conflict.localVersion.updated_at || 0
          ).getTime();
          const remoteTime = new Date(
            conflict.remoteVersion.updated_at || 0
          ).getTime();
          return resolveConflict(
            memberId,
            localTime > remoteTime ? "local" : "remote"
          );

        case "local":
          return resolveConflict(memberId, "local");

        case "remote":
          return resolveConflict(memberId, "remote");
      }
    },
    [conflicts, resolveConflict]
  );

  return {
    conflicts,
    detectConflict,
    resolveConflict,
    autoResolveConflict,
    hasConflicts: conflicts.length > 0,
  };
}

// Hook for real-time presence (who's viewing/editing members)
export function useMemberPresence(memberId?: string) {
  const [presence, setPresence] = useState<
    Map<
      string,
      {
        userId: string;
        username: string;
        action: "viewing" | "editing";
        timestamp: Date;
      }
    >
  >(new Map());

  const channelRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Join presence for a specific member
  const joinPresence = useCallback(
    (action: "viewing" | "editing" = "viewing") => {
      if (!memberId) return;

      // In a real implementation, you would get user info from auth
      const userInfo = {
        userId: "current-user-id", // Would come from auth
        username: "Current User", // Would come from auth
        action,
        timestamp: new Date(),
      };

      if (channelRef.current) {
        channelRef.current.track(userInfo);
      }
    },
    [memberId]
  );

  // Leave presence
  const leavePresence = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.untrack();
    }
  }, []);

  // Setup presence channel
  useEffect(() => {
    if (!memberId) return;

    const channel = supabase
      .channel(`member-${memberId}-presence`)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const presenceMap = new Map();

        Object.entries(state).forEach(([userId, presenceArray]) => {
          const latestPresence = (presenceArray as any[])[0]; // eslint-disable-line @typescript-eslint/no-explicit-any
          if (latestPresence) {
            presenceMap.set(userId, latestPresence);
          }
        });

        setPresence(presenceMap);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        setPresence((prev) => {
          const newMap = new Map(prev);
          newPresences.forEach((presence: any) => {
            // eslint-disable-line @typescript-eslint/no-explicit-any
            newMap.set(key, presence);
          });
          return newMap;
        });
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setPresence((prev) => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [memberId]);

  return {
    presence: Array.from(presence.values()),
    joinPresence,
    leavePresence,
    viewerCount: presence.size,
    editors: Array.from(presence.values()).filter(
      (p) => p.action === "editing"
    ),
    viewers: Array.from(presence.values()).filter(
      (p) => p.action === "viewing"
    ),
  };
}
