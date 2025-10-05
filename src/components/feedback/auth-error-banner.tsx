"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AuthErrorBannerProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

interface ErrorConfig {
  title: string;
  message: string;
  action: "retry" | "login" | "dismiss";
}

/**
 * Error message mappings for common authentication errors.
 * Provides user-friendly, actionable error messages.
 */
const ERROR_MESSAGES: Record<string, ErrorConfig> = {
  "Invalid login credentials": {
    title: "Login Failed",
    message:
      "The email or password you entered is incorrect. Please try again.",
    action: "retry",
  },
  "Email not confirmed": {
    title: "Email Not Verified",
    message:
      "Please check your email and click the verification link before logging in.",
    action: "dismiss",
  },
  refresh_token_not_found: {
    title: "Session Expired",
    message: "Your session has expired. Please log in again.",
    action: "login",
  },
  "Network request failed": {
    title: "Connection Error",
    message:
      "Unable to connect to the server. Please check your internet connection and try again.",
    action: "retry",
  },
  "Failed to fetch": {
    title: "Connection Error",
    message:
      "Unable to connect to the server. Please check your internet connection and try again.",
    action: "retry",
  },
  "Token refresh failed": {
    title: "Session Expired",
    message: "Your session has expired. Please log in again.",
    action: "login",
  },
  "User not found": {
    title: "Account Not Found",
    message: "No account found with this email address. Please sign up first.",
    action: "dismiss",
  },
};

/**
 * Auth Error Banner Component
 *
 * Displays user-friendly authentication error messages with contextual actions.
 * Automatically maps technical error messages to human-readable format.
 * Shows as a fixed banner at the top-right of the screen.
 *
 * @example
 * ```tsx
 * <AuthErrorBanner
 *   error={authError}
 *   onRetry={handleRetry}
 *   onDismiss={() => setAuthError(null)}
 * />
 * ```
 *
 * @param error - Error message to display (null = hidden)
 * @param onRetry - Optional retry handler for recoverable errors
 * @param onDismiss - Handler to dismiss the error banner
 */
export function AuthErrorBanner({
  error,
  onRetry,
  onDismiss,
}: AuthErrorBannerProps) {
  const router = useRouter();

  if (!error) return null;

  // Find matching error configuration
  const errorConfig: ErrorConfig = ERROR_MESSAGES[error] ||
    Object.entries(ERROR_MESSAGES).find(([key]) =>
      error.includes(key)
    )?.[1] || {
      title: "Authentication Error",
      message:
        "An unexpected error occurred. Please try again or contact support if the problem persists.",
      action: "retry" as const,
    };

  const handleAction = () => {
    if (errorConfig.action === "login") {
      router.push("/login");
    } else if (errorConfig.action === "retry" && onRetry) {
      onRetry();
    } else if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{errorConfig.title}</AlertTitle>
        <AlertDescription className="mt-2">
          {errorConfig.message}
          <div className="mt-3 flex gap-2">
            {errorConfig.action === "retry" && onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry
              </Button>
            )}
            {errorConfig.action === "login" && (
              <Button size="sm" variant="outline" onClick={handleAction}>
                Log In
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="outline" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
