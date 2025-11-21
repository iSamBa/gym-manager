"use client";

import { useEffect } from "react";
import { AppErrorBoundary } from "@/components/feedback/AppErrorBoundary";
import { logger } from "@/lib/logger";

export default function Error({
  error,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error on mount
    logger.error("Plans route error:", {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <AppErrorBoundary
      feature="plans"
      onError={(err, errorInfo) => {
        // Additional error handling if needed
        logger.error("Plans error boundary triggered", {
          error: err.message,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <div className="flex min-h-screen items-center justify-center">
        {/* Error UI handled by AppErrorBoundary */}
      </div>
    </AppErrorBoundary>
  );
}
