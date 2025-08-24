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
    error: Error | null;
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

  return (
    <AuthContext.Provider value={auth}>
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
