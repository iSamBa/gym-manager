import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./use-auth";

const VALIDATION_THROTTLE_MS = 30000; // Max once per 30 seconds

/**
 * useSessionValidator Hook
 *
 * Validates the Supabase session when the tab becomes visible.
 * This prevents "zombie sessions" where the user appears logged in
 * but their session has expired while the tab was inactive.
 *
 * Features:
 * - Validates session on tab focus via visibilitychange event
 * - Throttles validation to max once per 30 seconds
 * - Auto-logout if session is expired
 * - Graceful handling of network errors (doesn't logout)
 *
 * @example
 * ```tsx
 * function AuthProvider({ children }) {
 *   useSessionValidator();
 *   return <div>{children}</div>;
 * }
 * ```
 */
export function useSessionValidator() {
  const { isAuthenticated, signOut } = useAuth();
  const lastValidationRef = useRef<number>(0);

  const validateSession = useCallback(async () => {
    // Only validate if authenticated
    if (!isAuthenticated) return;

    // Throttle: don't validate more than once per 30 seconds
    const now = Date.now();
    if (now - lastValidationRef.current < VALIDATION_THROTTLE_MS) {
      console.log("Session validation throttled");
      return;
    }

    lastValidationRef.current = now;

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Session validation error:", error);
        await signOut();
        return;
      }

      if (!session) {
        console.log("Session expired, logging out");
        await signOut();
        return;
      }

      console.log("Session validated successfully");
      // Session is valid, no action needed
      // Supabase will auto-refresh if needed
    } catch (error) {
      console.error("Unexpected error validating session:", error);
      // Don't logout on network errors, user might just be offline
    }
  }, [isAuthenticated, signOut]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab became visible, validating session");
        validateSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [validateSession, isAuthenticated]);

  return {
    validateSession,
  };
}
