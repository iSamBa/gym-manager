"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/lib/store";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn, isLoading } = useAuth();
  const router = useRouter();

  /**
   * Handle login form submission with role-based redirects
   * - Admins redirect to dashboard (/)
   * - Trainers redirect to training sessions (/training-sessions)
   * - Respects middleware redirect parameter if present
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      const { user, error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(
          (signInError as { message?: string })?.message || "Failed to sign in"
        );
        return;
      }

      if (user) {
        // Check for redirect parameter from middleware
        const searchParams = new URLSearchParams(window.location.search);
        const middlewareRedirect = searchParams.get("redirect");

        // If middleware provided a redirect, use it
        if (middlewareRedirect) {
          router.push(middlewareRedirect);
          return;
        }

        // Wait for profile to load (AuthProvider loads user_profiles data)
        // Poll for the user profile with role data (max 3 seconds)
        const maxAttempts = 30; // 30 attempts * 100ms = 3 seconds max
        let attempts = 0;

        const checkProfile = () => {
          const { user: profileUser } = useAuthStore.getState();

          if (profileUser?.role) {
            // Profile loaded with role - perform role-based redirect
            if (profileUser.role === "admin") {
              router.push("/");
            } else if (profileUser.role === "trainer") {
              router.push("/training-sessions");
            } else {
              // Unknown role - redirect to login
              router.push("/login");
            }
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkProfile, 100);
          } else {
            // Timeout - fallback to dashboard
            router.push("/");
          }
        };

        checkProfile();
      }
    },
    [email, password, signIn, router]
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Admin Login</CardTitle>
          <CardDescription>
            Sign in to your gym management dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              {error && (
                <div className="bg-destructive/15 text-destructive border-destructive/30 rounded-md border p-3 text-sm">
                  {error}
                </div>
              )}
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@gym.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        Authorized gym administration access only
      </div>
    </div>
  );
}
