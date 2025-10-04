"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AuthErrorBannerProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Auth Error Banner Component
 *
 * Displays authentication errors with retry and dismiss actions.
 * Shows as a fixed banner at the top-right of the screen.
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
  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription className="mt-2">
          {error}
          <div className="mt-3 flex gap-2">
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry
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
