import { useEffect, useCallback } from "react";
import { useAuth } from "./use-auth";

interface SessionSecurityOptions {
  enableMultiTabSync?: boolean;
  enableVisibilityCheck?: boolean;
  logoutOnTabClose?: boolean;
}

export function useSessionSecurity({
  enableMultiTabSync = true,
  enableVisibilityCheck = true,
  logoutOnTabClose = false,
}: SessionSecurityOptions = {}) {
  const { isAuthenticated, signOut } = useAuth();

  // Synchronize authentication state across tabs
  const handleStorageChange = useCallback(
    (event: StorageEvent) => {
      if (!enableMultiTabSync) return;

      // If another tab logged out, log out this tab too
      if (event.key === "auth-storage" && event.newValue === null) {
        window.location.reload();
      }

      // If another tab logged in, refresh this tab to sync state
      if (event.key === "auth-storage" && event.newValue && !isAuthenticated) {
        window.location.reload();
      }
    },
    [isAuthenticated, enableMultiTabSync]
  );

  // Handle tab visibility changes (user switching tabs)
  const handleVisibilityChange = useCallback(() => {
    if (!enableVisibilityCheck || !isAuthenticated) return;

    if (document.visibilityState === "visible") {
      // Check if session is still valid when tab becomes visible
      const lastActivity = localStorage.getItem("last-activity");
      const rememberMe = localStorage.getItem("remember-me") === "true";
      const timeout = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000; // 7 days or 30 minutes

      if (lastActivity && Date.now() - parseInt(lastActivity) > timeout) {
        signOut();
      }
    }
  }, [isAuthenticated, signOut, enableVisibilityCheck]);

  // Handle browser tab/window close
  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (!logoutOnTabClose || !isAuthenticated) return;

      // Check if this is the last tab
      const tabId = sessionStorage.getItem("tab-id");
      if (!tabId) {
        // Generate a unique tab ID if it doesn't exist
        const newTabId = Date.now().toString();
        sessionStorage.setItem("tab-id", newTabId);
      }

      // In a real implementation, you'd need a more sophisticated way
      // to detect if this is the last tab. For now, just set a flag.
      localStorage.setItem("tab-closing", Date.now().toString());

      // Optional: Show confirmation dialog
      // event.preventDefault();
      // event.returnValue = 'You will be logged out when you close this tab.';
    },
    [isAuthenticated, logoutOnTabClose]
  );

  // Clean up tab closing flag after a delay
  const handleUnload = useCallback(() => {
    if (!logoutOnTabClose) return;

    // Set a timeout to clear the closing flag
    // If another tab is still open, it will clear this flag
    setTimeout(() => {
      const tabClosingTime = localStorage.getItem("tab-closing");
      if (tabClosingTime && Date.now() - parseInt(tabClosingTime) > 1000) {
        localStorage.removeItem("tab-closing");
        // If no other tabs cleared this flag, log out
        signOut();
      }
    }, 2000);
  }, [logoutOnTabClose, signOut]);

  // Detect suspicious activity (rapid requests, unusual patterns)
  const detectSuspiciousActivity = useCallback(() => {
    const requestCount = parseInt(localStorage.getItem("request-count") || "0");
    const lastRequestTime = parseInt(
      localStorage.getItem("last-request-time") || "0"
    );
    const now = Date.now();

    // Reset counter every minute
    if (now - lastRequestTime > 60000) {
      localStorage.setItem("request-count", "1");
      localStorage.setItem("last-request-time", now.toString());
      return;
    }

    // Increment counter
    const newCount = requestCount + 1;
    localStorage.setItem("request-count", newCount.toString());

    // If too many requests in a short time, potentially suspicious
    if (newCount > 100) {
      console.warn("Suspicious activity detected: too many requests");
      // Could implement additional security measures here
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events: [string, EventListener][] = [];

    if (enableMultiTabSync) {
      window.addEventListener("storage", handleStorageChange);
      events.push(["storage", handleStorageChange]);
    }

    if (enableVisibilityCheck) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      events.push(["visibilitychange", handleVisibilityChange]);
    }

    if (logoutOnTabClose) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("unload", handleUnload);
      events.push(["beforeunload", handleBeforeUnload]);
      events.push(["unload", handleUnload]);

      // Generate unique tab ID
      if (!sessionStorage.getItem("tab-id")) {
        sessionStorage.setItem("tab-id", Date.now().toString());
      }
    }

    // Set up activity detection for security monitoring
    const activityHandler = () => detectSuspiciousActivity();
    document.addEventListener("click", activityHandler);
    events.push(["click", activityHandler]);

    return () => {
      events.forEach(([event, handler]) => {
        if (event === "visibilitychange") {
          document.removeEventListener(event, handler);
        } else if (event === "click") {
          document.removeEventListener(event, handler);
        } else {
          window.removeEventListener(event, handler);
        }
      });
    };
  }, [
    isAuthenticated,
    enableMultiTabSync,
    enableVisibilityCheck,
    logoutOnTabClose,
    handleStorageChange,
    handleVisibilityChange,
    handleBeforeUnload,
    handleUnload,
    detectSuspiciousActivity,
  ]);

  return {
    // Could return security status or methods here if needed
    isSecurityEnabled:
      enableMultiTabSync || enableVisibilityCheck || logoutOnTabClose,
  };
}
