import { useEffect, useRef, useCallback } from "react";
import { ACTIVITY_EVENTS, SESSION_CONFIG } from "@/lib/session-config";

interface ActivityTrackerOptions {
  onActivity?: () => void;
  onInactivity?: () => void;
  onWarning?: (timeLeft: number) => void;
  inactivityTimeout?: number;
  warningTime?: number;
}

export function useActivityTracker({
  onActivity,
  onInactivity,
  onWarning,
  inactivityTimeout = SESSION_CONFIG.INACTIVITY_TIMEOUT,
  warningTime = SESSION_CONFIG.WARNING_BEFORE_LOGOUT,
}: ActivityTrackerOptions = {}) {
  const lastActivityRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const warningTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isWarningActiveRef = useRef(false);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    isWarningActiveRef.current = false;

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      isWarningActiveRef.current = true;
      onWarning?.(warningTime);
    }, inactivityTimeout - warningTime);

    // Set inactivity timeout
    timeoutRef.current = setTimeout(() => {
      onInactivity?.();
    }, inactivityTimeout);
  }, [inactivityTimeout, warningTime, onInactivity, onWarning]);

  const handleActivity = useCallback(() => {
    onActivity?.();
    resetTimer();
  }, [onActivity, resetTimer]);

  useEffect(() => {
    // Store last activity in localStorage
    const updateLastActivity = () => {
      localStorage.setItem("last-activity", Date.now().toString());
    };

    // Add event listeners for activity
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
      document.addEventListener(event, updateLastActivity, { passive: true });
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
        document.removeEventListener(event, updateLastActivity);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [handleActivity, resetTimer]);

  const getTimeUntilTimeout = useCallback(() => {
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    return Math.max(0, inactivityTimeout - timeSinceLastActivity);
  }, [inactivityTimeout]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return {
    lastActivity: lastActivityRef.current,
    getTimeUntilTimeout,
    extendSession,
    isWarningActive: isWarningActiveRef.current,
  };
}
