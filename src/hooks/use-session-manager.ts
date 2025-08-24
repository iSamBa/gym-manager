import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./use-auth";
import { useActivityTracker } from "./use-activity-tracker";
import { SESSION_CONFIG } from "@/lib/session-config";

interface SessionState {
  isWarningVisible: boolean;
  timeLeft: number;
  isSessionExpired: boolean;
}

export function useSessionManager(rememberMe: boolean = false) {
  const { signOut, isAuthenticated } = useAuth();
  const [sessionState, setSessionState] = useState<SessionState>({
    isWarningVisible: false,
    timeLeft: 0,
    isSessionExpired: false,
  });

  const timeout = rememberMe
    ? SESSION_CONFIG.REMEMBER_ME_DURATION
    : SESSION_CONFIG.INACTIVITY_TIMEOUT;

  const handleInactivity = useCallback(async () => {
    setSessionState((prev) => ({ ...prev, isSessionExpired: true }));

    // Save any pending data before logout
    try {
      const event = new CustomEvent("session-expiring", {
        detail: { timeLeft: 0 },
      });
      window.dispatchEvent(event);

      // Give components a moment to save data
      setTimeout(async () => {
        await signOut();
      }, 1000);
    } catch (error) {
      console.error("Error during session expiration:", error);
      await signOut();
    }
  }, [signOut]);

  const handleWarning = useCallback((timeLeft: number) => {
    setSessionState((prev) => ({
      ...prev,
      isWarningVisible: true,
      timeLeft,
    }));

    // Dispatch event for components to listen to
    const event = new CustomEvent("session-warning", {
      detail: { timeLeft },
    });
    window.dispatchEvent(event);
  }, []);

  const handleActivity = useCallback(() => {
    setSessionState((prev) => ({
      ...prev,
      isWarningVisible: false,
      isSessionExpired: false,
    }));
  }, []);

  const { extendSession, getTimeUntilTimeout } = useActivityTracker({
    onActivity: handleActivity,
    onInactivity: handleInactivity,
    onWarning: handleWarning,
    inactivityTimeout: timeout,
    warningTime: SESSION_CONFIG.WARNING_BEFORE_LOGOUT,
  });

  const extendSessionManually = useCallback(() => {
    extendSession();
    setSessionState((prev) => ({
      ...prev,
      isWarningVisible: false,
      isSessionExpired: false,
    }));
  }, [extendSession]);

  const dismissWarning = useCallback(() => {
    setSessionState((prev) => ({ ...prev, isWarningVisible: false }));
  }, []);

  // Check for session expiry on tab focus
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleFocus = () => {
      const lastActivity = localStorage.getItem("last-activity");
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        if (timeSinceLastActivity > timeout) {
          handleInactivity();
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isAuthenticated, timeout, handleInactivity]);

  return {
    sessionState,
    extendSession: extendSessionManually,
    dismissWarning,
    getTimeUntilTimeout,
  };
}
