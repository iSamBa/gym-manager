"use client";

import dynamic from "next/dynamic";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthErrorBoundary } from "@/components/error-boundary";

const AuthProvider = dynamic(
  () =>
    import("@/lib/auth-provider").then((mod) => ({
      default: mod.AuthProvider,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    ),
  }
);

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="gym-manager-theme">
      <AuthErrorBoundary>
        <AuthProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
      </AuthErrorBoundary>
    </ThemeProvider>
  );
}
