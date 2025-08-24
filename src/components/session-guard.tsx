"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSessionManager } from "@/hooks/use-session-manager";
import { useSessionSecurity } from "@/hooks/use-session-security";
import { SessionTimeoutWarning } from "./session-timeout-warning";

interface SessionGuardProps {
  children: React.ReactNode;
  rememberMe?: boolean;
}

export function SessionGuard({
  children,
  rememberMe = false,
}: SessionGuardProps) {
  const { isAuthenticated, signOut } = useAuth();
  const { sessionState, extendSession, dismissWarning } =
    useSessionManager(rememberMe);
  const [showExpiredNotification, setShowExpiredNotification] = useState(false);

  // Enable session security features
  useSessionSecurity({
    enableMultiTabSync: true,
    enableVisibilityCheck: true,
    logoutOnTabClose: false, // Usually false for better UX
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleSessionExpiring = (event: CustomEvent) => {
      console.log("Session expiring soon:", event.detail);
      // Could save unsaved work here
    };

    const handleSessionWarning = (event: CustomEvent) => {
      console.log("Session warning:", event.detail);
    };

    window.addEventListener(
      "session-expiring",
      handleSessionExpiring as EventListener
    );
    window.addEventListener(
      "session-warning",
      handleSessionWarning as EventListener
    );

    return () => {
      window.removeEventListener(
        "session-expiring",
        handleSessionExpiring as EventListener
      );
      window.removeEventListener(
        "session-warning",
        handleSessionWarning as EventListener
      );
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (sessionState.isSessionExpired) {
      setShowExpiredNotification(true);
    }
  }, [sessionState.isSessionExpired]);

  const handleExtendSession = () => {
    extendSession();
    dismissWarning();
  };

  const handleLogoutNow = async () => {
    dismissWarning();
    await signOut();
  };

  return (
    <>
      {children}

      {isAuthenticated && (
        <SessionTimeoutWarning
          isOpen={sessionState.isWarningVisible}
          timeLeft={sessionState.timeLeft}
          onExtendSession={handleExtendSession}
          onLogoutNow={handleLogoutNow}
        />
      )}

      {/* Session expired notification could be added here */}
      {showExpiredNotification && (
        <div className="bg-destructive text-destructive-foreground fixed top-4 right-4 z-50 rounded-lg p-4 shadow-lg">
          <p className="font-semibold">Session Expired</p>
          <p className="text-sm">You have been logged out due to inactivity.</p>
        </div>
      )}
    </>
  );
}
