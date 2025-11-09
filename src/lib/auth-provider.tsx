"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useRef,
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

// Configuration constants
const TIMEOUTS = {
  PROFILE_LOAD: 10000, // 10 seconds for profile load
  AUTH_INIT: 3000, // 3 seconds for auth initialization
  BACKGROUND_RETRY: 2000, // 2 seconds before background retry
} as const;

const RETRY_CONFIG = {
  MAX_RETRIES: 2, // Maximum number of retries for profile load
  TOKEN_REFRESH_RETRIES: 1, // Single retry for token refresh
  JITTER_FACTOR: 0.2, // 20% jitter for exponential backoff
} as const;

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

// Define proper TypeScript interface for user profile
interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "trainer" | "member";
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    user: UserProfile | null;
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

  // Track all timeouts for cleanup
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  // Helper to track timeouts for cleanup
  const trackTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(callback, delay);
    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  // Enable session validation on tab focus
  useSessionValidator();

  // Load user profile from database
  const loadUserProfile = useCallback(
    async (authUser: User, signal?: AbortSignal): Promise<void> => {
      const startTime = Date.now();

      // Check if already aborted
      if (signal?.aborted) {
        logger.debug("loadUserProfile aborted before start");
        return;
      }

      try {
        logger.debug("loadUserProfile started", { userId: authUser.id });
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        // Check if aborted after query
        if (signal?.aborted) {
          logger.debug("loadUserProfile aborted after query");
          return;
        }

        logger.debug("Profile fetch completed", {
          durationMs: Date.now() - startTime,
          userId: authUser.id,
        });

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
          throw error; // Throw to signal failure to caller
        }

        if (profile) {
          logger.debug("Setting user state");
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
            try {
              logger.debug("Running profile integrity check for admin");
              const integrityCheck = await checkCurrentUserProfileIntegrity(
                authUser.id,
                authUser.email
              );

              if (integrityCheck.hasIssues) {
                logger.warn("Profile integrity issues detected", {
                  issueCount: integrityCheck.issues.length,
                  issues: integrityCheck.issues,
                });
                setProfileIntegrityIssues(integrityCheck.issues);
              } else {
                logger.debug("No profile integrity issues found");
                setProfileIntegrityIssues([]);
              }
            } catch (integrityError) {
              // Log but don't fail profile load for integrity check errors
              logger.warn("Profile integrity check failed (non-fatal)", {
                error: integrityError,
                userId: authUser.id,
              });
            }
          }

          logger.debug("loadUserProfile completed successfully", {
            durationMs: Date.now() - startTime,
            userId: authUser.id,
          });
          // Success - function completes normally
          return;
        } else {
          // Profile is null (shouldn't happen with .single(), but defensive check)
          const error = new Error("Profile query returned null");
          logger.error("Profile query returned null", {
            userId: authUser.id,
            userEmail: authUser.email,
            severity: "CRITICAL",
          });
          throw error;
        }
      } catch (error) {
        logger.debug("loadUserProfile failed", { error });
        const errorDetails = extractErrorDetails(error);
        logger.error("Unexpected error loading user profile", {
          ...errorDetails,
          userId: authUser.id,
          userEmail: authUser.email,
        });
        throw error; // Re-throw to signal failure
      }
    },
    [setUser]
  );

  // Load user profile with retry logic for transient failures
  const loadUserProfileWithRetry = useCallback(
    async (authUser: User, maxRetries = 2, signal?: AbortSignal) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Check if operation was cancelled
        if (signal?.aborted) {
          logger.info("Profile load cancelled - component unmounted");
          return;
        }

        try {
          logger.debug("Profile load attempt", { attempt, maxRetries });

          // Simple timeout wrapper - using trailing comma to fix TSX parsing issue
          const withTimeout = <T,>(
            promise: Promise<T>,
            timeoutMs: number
          ): Promise<T> => {
            return new Promise((resolve, reject) => {
              const timer = setTimeout(() => {
                reject(new Error("Profile load timeout"));
              }, timeoutMs);

              promise
                .then((value) => {
                  clearTimeout(timer);
                  resolve(value);
                })
                .catch((error) => {
                  clearTimeout(timer);
                  reject(error);
                });
            });
          };

          await withTimeout(
            loadUserProfile(authUser, signal),
            TIMEOUTS.PROFILE_LOAD
          );
          logger.debug("Profile loaded successfully");
          return; // Success - exit retry loop
        } catch (error) {
          logger.debug("Profile load attempt failed", {
            attempt,
            error: error instanceof Error ? error.message : String(error),
          });

          // Ignore errors if operation was cancelled
          if (signal?.aborted) {
            logger.info("Profile load cancelled during error handling");
            return;
          }

          const isLastAttempt = attempt === maxRetries;
          const errorDetails = extractErrorDetails(error);

          if (isLastAttempt) {
            logger.error("Profile load failed after retries", {
              ...errorDetails,
              attempts: maxRetries,
              userId: authUser.id,
              userEmail: authUser.email,
            });
            throw error; // Re-throw to trigger fallback logic
          } else {
            logger.warn(`Profile load retry ${attempt}/${maxRetries}`, {
              ...errorDetails,
              userId: authUser.id,
              userEmail: authUser.email,
            });
            // True exponential backoff with jitter: 1s, 2s, 4s...
            const baseDelay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
            const jitter =
              baseDelay * RETRY_CONFIG.JITTER_FACTOR * (Math.random() - 0.5); // ±10% random jitter
            const delay = Math.max(0, baseDelay + jitter); // Ensure non-negative
            logger.debug(`Waiting ${Math.round(delay)}ms before retry`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    },
    [loadUserProfile]
  );

  // Auth initialization and event listener
  useEffect(() => {
    let mounted = true;
    let loadingCleared = false;
    const abortController = new AbortController();

    // Helper to ensure loading is only cleared once
    const clearLoading = () => {
      if (!loadingCleared && mounted) {
        loadingCleared = true;
        setIsLoading(false);
      }
    };

    // Set timeout BEFORE starting initialization
    const timeoutId = setTimeout(() => {
      if (!mounted) return;
      logger.warn(
        "Auth initialization timeout - setting loading to false anyway"
      );
      clearLoading();
    }, TIMEOUTS.AUTH_INIT);

    // Proactively check for existing session (don't wait for INITIAL_SESSION event)
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted || abortController.signal.aborted) return;

        if (error) {
          logger.error("Failed to get initial session", {
            error: error.message,
          });
          clearTimeout(timeoutId);
          clearLoading();
          return;
        }

        if (session?.user) {
          // Load profile with retry logic
          try {
            await loadUserProfileWithRetry(
              session.user,
              RETRY_CONFIG.MAX_RETRIES,
              abortController.signal
            );
            if (!mounted || abortController.signal.aborted) return;
            lastLoadedUserId = session.user.id; // Track successful initial load
            setAuthError(null);
          } catch (profileError) {
            if (abortController.signal.aborted) return;

            logger.error("Profile load failed during initialization", {
              error:
                profileError instanceof Error
                  ? profileError.message
                  : String(profileError),
              userId: session.user.id,
            });
            // Set fallback user data from session to allow authentication to proceed
            if (mounted) {
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                role: (session.user.user_metadata?.role as string) || "member",
                first_name: session.user.user_metadata?.first_name || "",
                last_name: session.user.user_metadata?.last_name || "",
                avatar_url: session.user.user_metadata?.avatar_url || null,
                is_active: true,
              });
              // Retry profile load in background after a delay (tracked for cleanup)
              trackTimeout(() => {
                if (mounted && !abortController.signal.aborted) {
                  // Create a new AbortController for this background retry
                  const retryController = new AbortController();

                  // Store controller for cleanup
                  const originalAbort =
                    abortController.abort.bind(abortController);
                  abortController.abort = () => {
                    originalAbort();
                    retryController.abort();
                  };

                  loadUserProfile(session.user, retryController.signal);
                }
              }, TIMEOUTS.BACKGROUND_RETRY);
            }
          }
        }

        clearTimeout(timeoutId);
        clearLoading();
      } catch (error) {
        if (abortController.signal.aborted) return;

        logger.error("Failed to initialize authentication", {
          error: error instanceof Error ? error.message : String(error),
        });
        clearTimeout(timeoutId);
        clearLoading();
      }
    };

    // Start initialization immediately
    logger.debug("Starting initializeAuth");
    initializeAuth();

    // Track if we've already loaded the initial session
    let initialSessionLoaded = false;
    let lastLoadedUserId: string | null = null;

    // Set up auth state change listener for subsequent events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      logger.debug("Auth event received", {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        initialSessionLoaded,
        lastLoadedUserId,
      });

      switch (event) {
        case "INITIAL_SESSION":
          // Skip - already handled by initializeAuth above
          logger.debug("INITIAL_SESSION event - marking as loaded");
          initialSessionLoaded = true;
          if (session?.user?.id) {
            lastLoadedUserId = session.user.id;
          }
          break;

        case "SIGNED_IN":
          // Skip if we already loaded this user's profile
          if (lastLoadedUserId === session?.user?.id) {
            logger.debug(
              "Skipping SIGNED_IN - profile already loaded for this user"
            );
            break;
          }

          // Check if user is already authenticated (session validation, not a new sign-in)
          const currentUser = useAuthStore.getState().user;
          if (currentUser && session?.user?.id === currentUser.id) {
            logger.debug(
              "Skipping SIGNED_IN - user already authenticated (session validation)"
            );
            break;
          }

          if (session?.user) {
            logger.debug(
              "Processing real SIGNED_IN event for new authentication"
            );
            try {
              await loadUserProfileWithRetry(
                session.user,
                RETRY_CONFIG.MAX_RETRIES,
                abortController.signal
              );
              if (!mounted || abortController.signal.aborted) return;
              lastLoadedUserId = session.user.id; // Track successful load
              setAuthError(null);
            } catch (profileError) {
              if (abortController.signal.aborted) return;

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
              if (mounted) {
                setUser({
                  id: session.user.id,
                  email: session.user.email || "",
                  role:
                    (session.user.user_metadata?.role as string) || "member",
                  first_name: session.user.user_metadata?.first_name || "",
                  last_name: session.user.user_metadata?.last_name || "",
                  avatar_url: session.user.user_metadata?.avatar_url || null,
                  is_active: true,
                });
                // Retry profile load in background after a delay (tracked for cleanup)
                trackTimeout(() => {
                  if (mounted && !abortController.signal.aborted) {
                    loadUserProfile(session.user, abortController.signal);
                  }
                }, TIMEOUTS.BACKGROUND_RETRY);
              }
            }
          }
          break;

        case "SIGNED_OUT":
          setUser(null);
          setAuthError(null);
          lastLoadedUserId = null; // Reset on sign out
          break;

        case "TOKEN_REFRESHED":
          // Token refreshed successfully - no need to reload profile (token refresh doesn't change profile data)
          logger.debug("TOKEN_REFRESHED event - token refreshed successfully");
          setAuthError(null);
          break;

        case "USER_UPDATED":
          // User profile updated - reload profile with proper timeout handling
          logger.debug("USER_UPDATED event - reloading profile");
          if (session?.user) {
            try {
              await loadUserProfileWithRetry(
                session.user,
                RETRY_CONFIG.TOKEN_REFRESH_RETRIES, // Only 1 retry for updates
                abortController.signal
              );
            } catch (profileError) {
              if (abortController.signal.aborted) return;

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
              await loadUserProfileWithRetry(
                session.user,
                RETRY_CONFIG.MAX_RETRIES,
                abortController.signal
              );
              if (!mounted || abortController.signal.aborted) return;
              setAuthError(null);
            } catch (profileError) {
              if (abortController.signal.aborted) return;

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
              if (mounted) {
                setUser({
                  id: session.user.id,
                  email: session.user.email || "",
                  role:
                    (session.user.user_metadata?.role as string) || "member",
                  first_name: session.user.user_metadata?.first_name || "",
                  last_name: session.user.user_metadata?.last_name || "",
                  avatar_url: session.user.user_metadata?.avatar_url || null,
                  is_active: true,
                });
                // Retry profile load in background (tracked for cleanup)
                trackTimeout(() => {
                  if (mounted && !abortController.signal.aborted) {
                    loadUserProfile(session.user);
                  }
                }, TIMEOUTS.BACKGROUND_RETRY);
              }
            }
          }
          break;

        default:
          logger.warn("Unhandled auth event received", { event });
      }
    });

    return () => {
      mounted = false;
      abortController.abort(); // Cancel all pending async operations
      clearTimeout(timeoutId);
      // Clear all tracked timeouts
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadUserProfile, loadUserProfileWithRetry, trackTimeout]); // Zustand setters are stable, no need to include them

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
    user: auth.user as UserProfile | null,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    signIn: async (email: string, password: string) => {
      const result = await auth.signIn(email, password);
      return {
        user: result.user as UserProfile | null,
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
