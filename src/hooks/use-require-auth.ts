import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./use-auth";
import { UserRole } from "@/features/database/lib/types";

interface UseRequireAuthOptions {
  requiredRole?: UserRole;
  redirectTo?: string;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { requiredRole, redirectTo = "/login" } = options;
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      // If user doesn't have required role, redirect to login or unauthorized page
      router.push(redirectTo);
      return;
    }
  }, [isAuthenticated, isLoading, user, requiredRole, redirectTo, router]);

  return {
    isAuthenticated,
    isLoading,
    user,
    hasRequiredRole: !requiredRole || user?.role === requiredRole,
  };
}

// Convenience hook for admin-only access
export function useRequireAdmin(redirectTo?: string) {
  return useRequireAuth({
    requiredRole: "admin",
    redirectTo,
  });
}
