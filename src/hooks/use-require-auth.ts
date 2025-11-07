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
      // Store current path for redirect after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "auth-redirect",
          window.location.pathname + window.location.search
        );
      }
      router.push(redirectTo);
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      // If user doesn't have required role, redirect to login
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "auth-redirect",
          window.location.pathname + window.location.search
        );
      }
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

/**
 * Convenience hook for staff access (admin + trainer)
 *
 * Allows authenticated users with admin or trainer role to access protected pages.
 * Non-staff users are redirected to the login page.
 *
 * @example Basic usage
 * ```tsx
 * function StaffOnlyPage() {
 *   const { isLoading, isStaff } = useRequireStaff();
 *
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   return <PageContent />;
 * }
 * ```
 *
 * @example Custom redirect
 * ```tsx
 * const { user, isStaff } = useRequireStaff("/unauthorized");
 * ```
 *
 * @param redirectTo - Optional redirect path for unauthorized users (default: "/login")
 * @returns Auth state with staff validation
 */
export function useRequireStaff(redirectTo?: string) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Store current path for redirect after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "auth-redirect",
          window.location.pathname + window.location.search
        );
      }
      router.push(redirectTo || "/login");
      return;
    }

    // Check if user is staff (admin or trainer)
    const isStaff = user?.role === "admin" || user?.role === "trainer";
    if (!isStaff) {
      // Non-staff roles (e.g., member) are not allowed
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "auth-redirect",
          window.location.pathname + window.location.search
        );
      }
      router.push(redirectTo || "/login");
      return;
    }
  }, [isAuthenticated, isLoading, user, redirectTo, router]);

  return {
    isAuthenticated,
    isLoading,
    user,
    isStaff: user?.role === "admin" || user?.role === "trainer",
  };
}
