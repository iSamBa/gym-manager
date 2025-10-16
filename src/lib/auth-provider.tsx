"use client";

import { createContext, useContext, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/use-auth";
import { useSessionValidator } from "@/hooks/use-session-validator";
import { useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { AuthErrorBanner } from "@/components/feedback/auth-error-banner";

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
          console.error("Error loading user profile:", error);
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
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
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
      console.warn(
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
          console.error("Error getting initial session:", error);
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
            console.error("Error loading user profile:", profileError);
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
        console.error("Error initializing auth:", error);
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
              console.error(
                "Error loading user profile on sign in:",
                profileError
              );
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
              console.warn(
                "Error loading user profile on token refresh:",
                profileError
              );
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
              console.warn("Error loading updated user profile:", profileError);
              // Keep existing user data on profile update failure
            }
          }
          break;

        case "PASSWORD_RECOVERY":
          console.log("Password recovery initiated");
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
              console.error(
                "Error loading user profile after MFA:",
                profileError
              );
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
          console.warn("Unhandled auth event:", event);
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
