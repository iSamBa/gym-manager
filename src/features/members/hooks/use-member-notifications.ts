import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner"; // Assuming sonner is used for toast notifications
import type { Member, MemberStatus } from "@/features/database/lib/types";
import type { BulkOperationResult } from "./use-bulk-operations";

// Notification types
export type NotificationType =
  | "member_created"
  | "member_updated"
  | "member_deleted"
  | "status_changed"
  | "bulk_operation_completed"
  | "bulk_operation_failed"
  | "sync_error"
  | "connection_restored"
  | "connection_lost"
  | "validation_error"
  | "permission_denied";

// Notification configuration
export interface NotificationConfig {
  enabled: boolean;
  types: Record<NotificationType, boolean>;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  duration: number; // milliseconds
  maxVisible: number;
  showUndoOptions: boolean;
  groupSimilar: boolean;
  respectUserPreferences: boolean;
}

// Individual notification
export interface MemberNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  member?: Member;
  data?: unknown;
  actions?: Array<{
    label: string;
    action: () => void | Promise<void>;
    style?: "primary" | "secondary" | "destructive";
  }>;
  persistent?: boolean;
  undoable?: boolean;
  onUndo?: () => void | Promise<void>;
}

// Undo action context
interface UndoContext {
  action: string;
  data: unknown;
  undoFunction: () => void | Promise<void>;
  timestamp: Date;
  expiresAt: Date;
}

// Default configuration
const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  types: {
    member_created: true,
    member_updated: true,
    member_deleted: true,
    status_changed: true,
    bulk_operation_completed: true,
    bulk_operation_failed: true,
    sync_error: true,
    connection_restored: true,
    connection_lost: true,
    validation_error: true,
    permission_denied: true,
  },
  position: "top-right",
  duration: 5000,
  maxVisible: 5,
  showUndoOptions: true,
  groupSimilar: true,
  respectUserPreferences: true,
};

// Hook for member-related notifications
export function useMemberNotifications(
  config: Partial<NotificationConfig> = {}
) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const [notifications, setNotifications] = useState<MemberNotification[]>([]);
  const [undoHistory, setUndoHistory] = useState<UndoContext[]>([]);
  const notificationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Check if notification type is enabled
  const isTypeEnabled = useCallback(
    (type: NotificationType) => {
      return fullConfig.enabled && fullConfig.types[type];
    },
    [fullConfig.enabled, fullConfig.types]
  );

  // Generate unique notification ID
  const generateNotificationId = useCallback(() => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add notification
  const addNotification = useCallback(
    (notification: Omit<MemberNotification, "id" | "timestamp">) => {
      if (!isTypeEnabled(notification.type)) return;

      const id = generateNotificationId();
      const fullNotification: MemberNotification = {
        ...notification,
        id,
        timestamp: new Date(),
      };

      setNotifications((prev) => {
        let newNotifications = [...prev, fullNotification];

        // Group similar notifications if enabled
        if (fullConfig.groupSimilar) {
          newNotifications = groupSimilarNotifications(newNotifications);
        }

        // Limit visible notifications
        if (newNotifications.length > fullConfig.maxVisible) {
          newNotifications = newNotifications.slice(-fullConfig.maxVisible);
        }

        return newNotifications;
      });

      // Show toast notification
      showToastNotification(fullNotification);

      // Auto-remove after duration (unless persistent)
      if (!notification.persistent) {
        const timeout = setTimeout(() => {
          removeNotification(id);
        }, fullConfig.duration);

        notificationTimeouts.current.set(id, timeout);
      }

      return id;
    },
    [
      isTypeEnabled,
      generateNotificationId,
      fullConfig.groupSimilar,
      fullConfig.maxVisible,
      fullConfig.duration,
      groupSimilarNotifications,
      showToastNotification,
    ]
  );

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    const timeout = notificationTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      notificationTimeouts.current.delete(id);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    notificationTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    notificationTimeouts.current.clear();
  }, []);

  // Show toast notification using external toast library
  const showToastNotification = useCallback(
    (notification: MemberNotification) => {
      const toastOptions: Record<string, unknown> = {
        id: notification.id,
        duration: notification.persistent ? Infinity : fullConfig.duration,
        position: fullConfig.position,
      };

      // Add action buttons
      if (notification.actions && notification.actions.length > 0) {
        toastOptions.action = {
          label: notification.actions[0].label,
          onClick: notification.actions[0].action,
        };
      }

      // Add undo functionality
      if (notification.undoable && notification.onUndo) {
        toastOptions.action = {
          label: "Undo",
          onClick: notification.onUndo,
        };
      }

      // Show appropriate toast based on type
      switch (notification.type) {
        case "member_created":
        case "bulk_operation_completed":
        case "connection_restored":
          toast.success(notification.message, toastOptions);
          break;

        case "member_deleted":
        case "bulk_operation_failed":
        case "sync_error":
        case "connection_lost":
        case "validation_error":
        case "permission_denied":
          toast.error(notification.message, toastOptions);
          break;

        case "member_updated":
        case "status_changed":
          toast.info(notification.message, toastOptions);
          break;

        default:
          toast(notification.message, toastOptions);
      }
    },
    [fullConfig.duration, fullConfig.position]
  );

  // Group similar notifications
  const groupSimilarNotifications = useCallback(
    (notifications: MemberNotification[]) => {
      const grouped = new Map<string, MemberNotification[]>();

      notifications.forEach((notification) => {
        const key = `${notification.type}_${notification.member?.id || "general"}`;
        const group = grouped.get(key) || [];
        group.push(notification);
        grouped.set(key, group);
      });

      const result: MemberNotification[] = [];

      grouped.forEach((group) => {
        if (group.length === 1) {
          result.push(group[0]);
        } else {
          // Create grouped notification
          const firstNotification = group[0];
          const groupedNotification: MemberNotification = {
            ...firstNotification,
            title: `${group.length} ${firstNotification.type.replace("_", " ")} notifications`,
            message: `${group.length} items affected`,
            timestamp: group[group.length - 1].timestamp, // Latest timestamp
          };
          result.push(groupedNotification);
        }
      });

      return result;
    },
    []
  );

  // Add undo context
  const addUndoContext = useCallback(
    (
      action: string,
      data: unknown,
      undoFunction: () => void | Promise<void>,
      expirationMinutes = 5
    ) => {
      const context: UndoContext = {
        action,
        data,
        undoFunction,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
      };

      setUndoHistory((prev) => [...prev, context]);

      // Auto-expire undo context
      setTimeout(
        () => {
          setUndoHistory((prev) => prev.filter((ctx) => ctx !== context));
        },
        expirationMinutes * 60 * 1000
      );
    },
    []
  );

  // Execute undo action
  const executeUndo = useCallback(
    async (action: string) => {
      const context = undoHistory.find(
        (ctx) => ctx.action === action && ctx.expiresAt > new Date()
      );
      if (!context) return false;

      try {
        await context.undoFunction();
        setUndoHistory((prev) => prev.filter((ctx) => ctx !== context));

        addNotification({
          type: "member_updated",
          title: "Action Undone",
          message: `Successfully undone: ${action}`,
        });

        return true;
      } catch (error) {
        console.error("Failed to undo action:", error);

        addNotification({
          type: "sync_error",
          title: "Undo Failed",
          message: `Failed to undo: ${action}`,
        });

        return false;
      }
    },
    [undoHistory, addNotification]
  );

  // Predefined notification creators
  const notifyMemberCreated = useCallback(
    (member: Member) => {
      return addNotification({
        type: "member_created",
        title: "Member Added",
        message: `${member.first_name} ${member.last_name} has been added successfully`,
        member,
      });
    },
    [addNotification]
  );

  const notifyMemberUpdated = useCallback(
    (member: Member, changes?: string[]) => {
      const changeText =
        changes && changes.length > 0 ? ` (${changes.join(", ")})` : "";

      return addNotification({
        type: "member_updated",
        title: "Member Updated",
        message: `${member.first_name} ${member.last_name} has been updated${changeText}`,
        member,
      });
    },
    [addNotification]
  );

  const notifyMemberDeleted = useCallback(
    (member: Member, onUndo?: () => Promise<void>) => {
      return addNotification({
        type: "member_deleted",
        title: "Member Removed",
        message: `${member.first_name} ${member.last_name} has been removed`,
        member,
        undoable: !!onUndo && fullConfig.showUndoOptions,
        onUndo,
      });
    },
    [addNotification, fullConfig.showUndoOptions]
  );

  const notifyStatusChanged = useCallback(
    (member: Member, oldStatus: MemberStatus, newStatus: MemberStatus) => {
      return addNotification({
        type: "status_changed",
        title: "Status Updated",
        message: `${member.first_name} ${member.last_name} status changed from ${oldStatus} to ${newStatus}`,
        member,
      });
    },
    [addNotification]
  );

  const notifyBulkOperationCompleted = useCallback(
    (result: BulkOperationResult, operation: string) => {
      const message =
        result.totalFailed > 0
          ? `${operation} completed: ${result.totalSuccessful} succeeded, ${result.totalFailed} failed`
          : `${operation} completed successfully for ${result.totalSuccessful} members`;

      return addNotification({
        type:
          result.totalFailed > 0
            ? "bulk_operation_failed"
            : "bulk_operation_completed",
        title: "Bulk Operation Completed",
        message,
        data: result,
        persistent: result.totalFailed > 0, // Keep error notifications visible
      });
    },
    [addNotification]
  );

  const notifySyncError = useCallback(
    (error: string, retry?: () => Promise<void>) => {
      return addNotification({
        type: "sync_error",
        title: "Sync Error",
        message: error,
        actions: retry
          ? [
              {
                label: "Retry",
                action: retry,
                style: "primary" as const,
              },
            ]
          : undefined,
        persistent: true,
      });
    },
    [addNotification]
  );

  const notifyConnectionStatus = useCallback(
    (connected: boolean) => {
      return addNotification({
        type: connected ? "connection_restored" : "connection_lost",
        title: connected ? "Connection Restored" : "Connection Lost",
        message: connected
          ? "Real-time updates are now active"
          : "Real-time updates are temporarily unavailable",
      });
    },
    [addNotification]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = notificationTimeouts.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  return {
    notifications,
    undoHistory: undoHistory.filter((ctx) => ctx.expiresAt > new Date()),
    addNotification,
    removeNotification,
    clearAllNotifications,
    executeUndo,

    // Predefined notification methods
    notifyMemberCreated,
    notifyMemberUpdated,
    notifyMemberDeleted,
    notifyStatusChanged,
    notifyBulkOperationCompleted,
    notifySyncError,
    notifyConnectionStatus,

    // Undo functionality
    addUndoContext,
    hasUndoableActions: undoHistory.some((ctx) => ctx.expiresAt > new Date()),
  };
}

// Hook for notification preferences management
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationConfig>(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem("member-notification-preferences");
      return stored
        ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
        : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  // Save preferences to localStorage
  const savePreferences = useCallback(
    (newPreferences: Partial<NotificationConfig>) => {
      const updated = { ...preferences, ...newPreferences };
      setPreferences(updated);

      try {
        localStorage.setItem(
          "member-notification-preferences",
          JSON.stringify(updated)
        );
      } catch (error) {
        console.warn("Failed to save notification preferences:", error);
      }
    },
    [preferences]
  );

  // Toggle notification type
  const toggleNotificationType = useCallback(
    (type: NotificationType) => {
      savePreferences({
        types: {
          ...preferences.types,
          [type]: !preferences.types[type],
        },
      });
    },
    [preferences.types, savePreferences]
  );

  // Enable/disable all notifications
  const toggleNotifications = useCallback(() => {
    savePreferences({ enabled: !preferences.enabled });
  }, [preferences.enabled, savePreferences]);

  return {
    preferences,
    savePreferences,
    toggleNotificationType,
    toggleNotifications,
  };
}

// Hook for notification sound management
export function useNotificationSounds() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem("member-notification-sounds");
      return stored ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  // Play notification sound
  const playSound = useCallback(
    async (type: NotificationType) => {
      if (!soundEnabled) return;

      try {
        // Initialize audio context if needed
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)(); // eslint-disable-line @typescript-eslint/no-explicit-any
        }

        const context = audioContextRef.current;

        // Generate different tones for different notification types
        const frequency = getFrequencyForType(type);
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          context.currentTime + 0.3
        );

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.3);
      } catch (error) {
        // Silently fail - sound is non-critical
        console.debug("Failed to play notification sound:", error);
      }
    },
    [soundEnabled]
  );

  // Get frequency based on notification type
  const getFrequencyForType = (type: NotificationType): number => {
    const frequencies: Record<NotificationType, number> = {
      member_created: 800,
      member_updated: 600,
      member_deleted: 400,
      status_changed: 500,
      bulk_operation_completed: 700,
      bulk_operation_failed: 300,
      sync_error: 350,
      connection_restored: 750,
      connection_lost: 250,
      validation_error: 450,
      permission_denied: 200,
    };

    return frequencies[type] || 500;
  };

  // Toggle sound
  const toggleSound = useCallback(() => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);

    try {
      localStorage.setItem(
        "member-notification-sounds",
        JSON.stringify(newValue)
      );
    } catch (error) {
      console.warn("Failed to save sound preference:", error);
    }
  }, [soundEnabled]);

  return {
    soundEnabled,
    playSound,
    toggleSound,
  };
}
