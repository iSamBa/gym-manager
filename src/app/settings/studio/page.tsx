"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { StudioSettingsLayout } from "@/features/settings";
import { useRequireAdmin } from "@/hooks/use-require-auth";

/**
 * Studio Settings Page
 * Admin-only page for managing studio configuration
 * Includes opening hours, general settings, and payment settings
 */
export default function StudioSettingsPage() {
  // Require admin role for entire page
  const { isLoading: isAuthLoading, hasRequiredRole } =
    useRequireAdmin("/login");

  if (isAuthLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      </MainLayout>
    );
  }

  if (!hasRequiredRole) {
    return null; // Will redirect to login
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <StudioSettingsLayout />
      </div>
    </MainLayout>
  );
}
