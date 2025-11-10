"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { logger } from "@/lib/logger";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for trainer detail pages
 *
 * Provides user-friendly error UI with recovery actions:
 * - Reset (retry current operation)
 * - Return to trainers list
 * - Return to home
 */
export default function TrainerError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log error to monitoring service
    logger.error("Trainer page error", {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  const handleRetry = () => {
    reset();
  };

  const handleBackToList = () => {
    router.push("/trainers");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-destructive/10 rounded-full p-3">
              <AlertTriangle className="text-destructive h-6 w-6" />
            </div>
            <div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                We encountered an error while loading trainer information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground font-mono text-sm break-words">
              {error.message || "An unexpected error occurred"}
            </p>
            {error.digest && (
              <p className="text-muted-foreground mt-2 text-xs">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              onClick={handleRetry}
              variant="default"
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={handleBackToList}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              Back to Trainers
            </Button>
          </div>
          <Button
            onClick={handleBackToHome}
            variant="ghost"
            size="sm"
            className="w-full sm:w-auto"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
