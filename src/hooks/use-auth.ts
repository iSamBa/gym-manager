import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store";
import { logger } from "@/lib/logger";

/**
 * Retry token refresh with exponential backoff.
 *
 * Attempts to refresh the Supabase session token up to maxAttempts times,
 * with exponential backoff delays (1s, 2s, 4s, etc.) between attempts.
 *
 * @example
 * ```typescript
 * const success = await retryTokenRefresh(1, 3);
 * if (success) {
 *   console.log('Token refreshed successfully');
 * } else {
 *   console.log('All retry attempts failed');
 * }
 * ```
 *
 * @param attempt - Current attempt number (starts at 1)
 * @param maxAttempts - Maximum number of retry attempts (default: 3)
 * @returns Promise<boolean> - True if refresh succeeded, false if all attempts failed
 */
export const retryTokenRefresh = async (
  attempt: number = 1,
  maxAttempts: number = 3
): Promise<boolean> => {
  if (attempt > maxAttempts) {
    return false;
  }

  try {
    const { error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return true;
  } catch (error) {
    logger.error(`Token refresh attempt ${attempt} failed`, { error, attempt });

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, attempt - 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    return retryTokenRefresh(attempt + 1, maxAttempts);
  }
};

/**
 * useAuth Hook
 *
 * Provides access to authentication state and methods for sign in/out.
 * This is the primary hook for accessing auth state throughout the application.
 *
 * **Note:** Auth event handling (SIGNED_IN, SIGNED_OUT, etc.) is done in
 * AuthProvider to avoid duplicate event listeners.
 *
 * **Note:** This hook includes one-time cleanup of legacy localStorage keys
 * from previous auth implementations (migration from US-005).
 *
 * @example Basic usage
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, signIn, signOut } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <LoginForm onSubmit={signIn} />;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user.email}</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Checking admin role
 * ```tsx
 * function AdminPanel() {
 *   const { isAdmin, user } = useAuth();
 *
 *   if (!isAdmin) {
 *     return <AccessDenied />;
 *   }
 *
 *   return <AdminDashboard user={user} />;
 * }
 * ```
 *
 * @returns {Object} Auth state and methods
 * @returns {User | null} user - Current authenticated user (null if not logged in)
 * @returns {boolean} isLoading - Whether auth state is currently loading
 * @returns {boolean} isAuthenticated - True if user is logged in
 * @returns {boolean} isAdmin - True if user has admin role
 * @returns {Function} signIn - Sign in with email and password
 * @returns {Function} signOut - Sign out the current user
 */
export function useAuth() {
  const { user, isLoading, setIsLoading, logout: clearUser } = useAuthStore();

  // One-time cleanup of legacy localStorage keys (migration from US-005)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth-storage");
      localStorage.removeItem("remember-me");
      localStorage.removeItem("last-activity");
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { user: data.user, error: null };
    } catch (error) {
      logger.error("Sign in error", { error });
      return { user: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      clearUser();
    } catch (error) {
      logger.error("Sign out error", { error });
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    signIn,
    signOut,
  };
}
