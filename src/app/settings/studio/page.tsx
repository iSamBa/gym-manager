import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { StudioSettingsLayout } from "@/features/settings";

/**
 * Studio Settings Page
 * Admin-only page for managing studio configuration
 * Includes opening hours, general settings, and payment settings
 */
export default async function StudioSettingsPage() {
  const supabase = await createSupabaseServerClient();

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profile?.role !== "admin") {
    // Non-admin users are redirected to home
    redirect("/");
  }

  return (
    <div className="container py-6">
      <StudioSettingsLayout />
    </div>
  );
}

// Metadata for the page
export const metadata = {
  title: "Studio Settings | Gym Manager",
  description: "Configure your gym's operational settings and preferences",
};
