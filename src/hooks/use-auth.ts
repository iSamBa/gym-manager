import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store";

/**
 * Retry token refresh with exponential backoff
 * Exported for use in error recovery scenarios
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
    console.error(`Token refresh attempt ${attempt} failed:`, error);

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, attempt - 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    return retryTokenRefresh(attempt + 1, maxAttempts);
  }
};

/**
 * useAuth Hook
 *
 * Provides access to authentication state and actions.
 * Auth event handling is done in AuthProvider to avoid duplicate listeners.
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
      console.error("Sign in error:", error);
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
      console.error("Sign out error:", error);
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
