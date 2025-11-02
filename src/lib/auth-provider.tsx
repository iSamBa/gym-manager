"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
} from "react";
import { User } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/use-auth";
import { useSessionValidator } from "@/hooks/use-session-validator";
import { useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { AuthErrorBanner } from "@/components/feedback/auth-error-banner";
import { ProfileIntegrityAlert } from "@/components/feedback/ProfileIntegrityAlert";
import { logger } from "@/lib/logger";
import {
  checkCurrentUserProfileIntegrity,
  type ProfileIntegrityIssue,
} from "./profile-integrity-check";

/**
 * Extract detailed error information from various error types
 * Handles Supabase errors, standard Error objects, and unknown error types
 */
function extractErrorDetails(error: unknown) {
  const details: {
    message: string;
    name?: string;
    code?: string;
    hint?: string;
    supabaseCode?: string;
    supabaseDetails?: string;
    stack?: string;
  } = {
    message: "Unknown error",
  };

  if (error instanceof Error) {
    details.message = error.message;
    details.name = error.name;
    details.stack = error.stack;
  } else if (typeof error === "string") {
    details.message = error;
  } else if (error && typeof error === "object") {
    // Supabase error object structure
    const err = error as {
      message?: string;
      code?: string;
      hint?: string;
      details?: string;
    };
    details.message = err.message || String(error);
    details.code = err.code;
    details.hint = err.hint;
    details.supabaseCode = err.code;
    details.supabaseDetails = err.details;
  } else {
    details.message = String(error);
  }

  return details;
}

interface AuthContextType {
  user: Record<string, unknown> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    user: Record<string, unknown> | null;
    error: unknown;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { authError, setAuthError, setUser, setIsLoading } = useAuthStore();
  const [profileIntegrityIssues, setProfileIntegrityIssues] = useState<
    ProfileIntegrityIssue[]
  >([]);

  // Enable session validation on tab focus
  useSessionValidator();

  // Load user profile from database
  const loadUserProfile = useCallback(
    async (authUser: User) => {
      try {
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (error) {
          const errorDetails = extractErrorDetails(error);

          // Distinguish between "profile doesn't exist" vs "query failed"
          const isProfileMissing =
            error.code === "PGRST116" || // PostgREST: no rows returned
            error.message?.includes("No rows") ||
            error.message?.includes("not found");

          if (isProfileMissing) {
            // CRITICAL: Profile doesn't exist for authenticated user
            logger.error(
              "CRITICAL: User profile missing for authenticated user",
              {
                ...errorDetails,
                userId: authUser.id,
                userEmail: authUser.email,
                severity: "CRITICAL",
                action: "Profile record must be created in user_profiles table",
              }
            );
          } else {
            // Query failed for other reasons (network, RLS, etc.)
            logger.error("Failed to load user profile from database", {
              ...errorDetails,
              userId: authUser.id,
              userEmail: authUser.email,
            });
          }
          return;
        }

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            role: profile.role,
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
            is_active: profile.is_active,
          });

          // Run profile integrity check (only for admins)
          if (profile.role === "admin") {
            const integrityCheck = await checkCurrentUserProfileIntegrity(
              authUser.id,
              authUser.email
            );

            if (integrityCheck.hasIssues) {
              setProfileIntegrityIssues(integrityCheck.issues);
            } else {
              setProfileIntegrityIssues([]);
            }
          }
        } else {
          // Profile is null (shouldn't happen with .single(), but defensive check)
          logger.error("Profile query returned null", {
            userId: authUser.id,
            userEmail: authUser.email,
            severity: "CRITICAL",
          });
        }
      } catch (error) {
        const errorDetails = extractErrorDetails(error);
        logger.error("Unexpected error loading user profile", {
          ...errorDetails,
          userId: authUser.id,
          userEmail: authUser.email,
        });
      }
    },
    [setUser]
  );

  // Auth initialization and event listener
  useEffect(() => {
    let mounted = true;
    let loadingCleared = false;

    // Helper to ensure loading is only cleared once
    const clearLoading = () => {
      if (!loadingCleared && mounted) {
        loadingCleared = true;
        setIsLoading(false);
      }
    };

    // Set timeout BEFORE starting initialization
    const timeoutId = setTimeout(() => {
      logger.warn(
        "Auth initialization timeout - setting loading to false anyway"
      );
      clearLoading();
    }, 3000); // 3 second timeout

    // Proactively check for existing session (don't wait for INITIAL_SESSION event)
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          logger.error("Failed to get initial session", {
            error: error.message,
          });
          clearTimeout(timeoutId);
          clearLoading();
          return;
        }

        if (session?.user) {
          // Load profile with timeout protection
          try {
            await Promise.race([
              loadUserProfile(session.user),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Profile load timeout")),
                  5000
                )
              ),
            ]);
            setAuthError(null);
          } catch (profileError) {
            logger.error("Profile load timeout during initialization", {
              error:
                profileError instanceof Error
                  ? profileError.message
                  : String(profileError),
              userId: session.user.id,
            });
            // Set fallback user data from session to allow authentication to proceed
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              role: (session.user.user_metadata?.role as string) || "member",
              first_name: session.user.user_metadata?.first_name || "",
              last_name: session.user.user_metadata?.last_name || "",
              avatar_url: session.user.user_metadata?.avatar_url || null,
              is_active: true,
            });
            // Retry profile load in background after a delay
            setTimeout(() => loadUserProfile(session.user), 2000);
          }
        }

        clearTimeout(timeoutId);
        clearLoading();
      } catch (error) {
        logger.error("Failed to initialize authentication", {
          error: error instanceof Error ? error.message : String(error),
        });
        clearTimeout(timeoutId);
        clearLoading();
      }
    };

    // Start initialization immediately
    initializeAuth();

    // Set up auth state change listener for subsequent events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      switch (event) {
        case "INITIAL_SESSION":
          // Skip - already handled by initializeAuth above
          break;

        case "SIGNED_IN":
          if (session?.user) {
            try {
              await Promise.race([
                loadUserProfile(session.user),
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error("Profile load timeout")),
                    5000
                  )
                ),
              ]);
              setAuthError(null);
            } catch (profileError) {
              const errorDetails = extractErrorDetails(profileError);
              logger.error("Profile load error on sign in", {
                ...errorDetails,
                userId: session.user.id,
                userEmail: session.user.email,
                authEvent: "SIGNED_IN",
                hasMetadata: !!session.user.user_metadata,
                metadataRole: session.user.user_metadata?.role,
              });
              // Set fallback user data from session to allow authentication to proceed
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                role: (session.user.user_metadata?.role as string) || "member",
                first_name: session.user.user_metadata?.first_name || "",
                last_name: session.user.user_metadata?.last_name || "",
                avatar_url: session.user.user_metadata?.avatar_url || null,
                is_active: true,
              });
              // Retry profile load in background after a delay
              setTimeout(() => loadUserProfile(session.user), 2000);
            }
          }
          break;

        case "SIGNED_OUT":
          setUser(null);
          setAuthError(null);
          break;

        case "TOKEN_REFRESHED":
          // Token successfully refreshed - reload profile
          if (session?.user) {
            try {
              await Promise.race([
                loadUserProfile(session.user),
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error("Profile load timeout")),
                    5000
                  )
                ),
              ]);
              setAuthError(null);
            } catch (profileError) {
              const errorDetails = extractErrorDetails(profileError);
              logger.warn("Profile load failed on token refresh", {
                ...errorDetails,
                userId: session?.user.id,
                userEmail: session?.user.email,
                authEvent: "TOKEN_REFRESHED",
              });
              // Keep existing user data on token refresh failure - don't disrupt the session
            }
          }
          break;

        case "USER_UPDATED":
          // User profile updated - reload profile
          if (session?.user) {
            try {
              await Promise.race([
                loadUserProfile(session.user),
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error("Profile load timeout")),
                    5000
                  )
                ),
              ]);
            } catch (profileError) {
              const errorDetails = extractErrorDetails(profileError);
              logger.warn("Profile load failed on user update", {
                ...errorDetails,
                userId: session?.user.id,
                userEmail: session?.user.email,
                authEvent: "USER_UPDATED",
              });
              // Keep existing user data on profile update failure
            }
          }
          break;

        case "PASSWORD_RECOVERY":
          logger.info("Password recovery initiated");
          break;

        case "MFA_CHALLENGE_VERIFIED":
          if (session?.user) {
            try {
              await Promise.race([
                loadUserProfile(session.user),
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error("Profile load timeout")),
                    5000
                  )
                ),
              ]);
              setAuthError(null);
            } catch (profileError) {
              const errorDetails = extractErrorDetails(profileError);
              logger.error("Profile load error after MFA verification", {
                ...errorDetails,
                userId: session.user.id,
                userEmail: session.user.email,
                authEvent: "MFA_CHALLENGE_VERIFIED",
                hasMetadata: !!session.user.user_metadata,
                metadataRole: session.user.user_metadata?.role,
              });
              // Set fallback user data from session
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                role: (session.user.user_metadata?.role as string) || "member",
                first_name: session.user.user_metadata?.first_name || "",
                last_name: session.user.user_metadata?.last_name || "",
                avatar_url: session.user.user_metadata?.avatar_url || null,
                is_active: true,
              });
              // Retry profile load in background
              setTimeout(() => loadUserProfile(session.user), 2000);
            }
          }
          break;

        default:
          logger.warn("Unhandled auth event received", { event });
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [setUser, setIsLoading, setAuthError, loadUserProfile]);

  const handleRetry = async () => {
    setAuthError(null);
    // Attempt to refresh session
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      setAuthError(error.message);
    }
  };

  const handleDismiss = () => {
    setAuthError(null);
  };

  // Create a wrapper that matches the expected context type
  const contextValue: AuthContextType = {
    user: auth.user,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    signIn: async (email: string, password: string) => {
      const result = await auth.signIn(email, password);
      return {
        user: result.user as Record<string, unknown> | null,
        error: result.error,
      };
    },
    signOut: auth.signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <AuthErrorBanner
        error={authError}
        onRetry={handleRetry}
        onDismiss={handleDismiss}
      />
      {auth.isAdmin && profileIntegrityIssues.length > 0 && (
        <div className="fixed top-20 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4">
          <ProfileIntegrityAlert
            issues={profileIntegrityIssues}
            onDismiss={() => setProfileIntegrityIssues([])}
          />
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
