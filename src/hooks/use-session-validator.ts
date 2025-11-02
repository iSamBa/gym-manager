import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./use-auth";
import { logger } from "@/lib/logger";

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
      logger.info("Session validation throttled");
      return;
    }

    lastValidationRef.current = now;

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        // Distinguish between error types - only logout for auth errors
        const errorMessage = error.message?.toLowerCase() || "";

        const isNetworkError =
          errorMessage.includes("network") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("fetch") ||
          errorMessage.includes("connect") ||
          errorMessage.includes("offline");

        const isAuthError =
          errorMessage.includes("jwt") ||
          errorMessage.includes("expired") ||
          errorMessage.includes("invalid") ||
          errorMessage.includes("token") ||
          error.status === 401;

        if (isNetworkError) {
          logger.warn(
            "Network error validating session, will retry on next focus",
            {
              message: error.message,
            }
          );
          return; // DON'T LOGOUT - just a network hiccup
        }

        if (isAuthError) {
          logger.error("Auth error - session invalid", { error });
          await signOut();
          return;
        }

        // Unknown error - log but don't logout immediately
        logger.warn("Unknown session validation error (not logging out)", {
          error,
        });
        return;
      }

      if (!session) {
        logger.info("Session expired, logging out");
        await signOut();
        return;
      }

      logger.info("Session validated successfully");
      // Session is valid, no action needed
      // Supabase will auto-refresh if needed
    } catch (error) {
      logger.error("Unexpected error validating session", { error });
      // Don't logout on network errors, user might just be offline
    }
  }, [isAuthenticated, signOut]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        logger.info("Tab became visible, validating session");
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
