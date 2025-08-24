"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SessionGuard } from "@/components/session-guard";

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
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Check if user has remember me enabled
    const rememberedSetting = localStorage.getItem("remember-me") === "true";
    setRememberMe(rememberedSetting);
  }, []);

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
      <SessionGuard rememberMe={rememberMe}>{children}</SessionGuard>
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
