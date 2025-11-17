"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function LoginPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading skeleton while checking auth state OR if already authenticated
  // This prevents flash of login form during redirect after successful login
  if (isLoading || isAuthenticated) {
    return <LoadingSkeleton variant="auth" />;
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Dumbbell className="size-4" />
          </div>
          Gym Manager
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
