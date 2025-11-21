"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertCircle, RefreshCw, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { isDevelopment } from "@/lib/env";

interface AppErrorBoundaryProps {
  feature: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { feature, onError } = this.props;

    // Log error with context
    logger.error(`Error in ${feature} feature`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      feature,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // TODO: Send to monitoring service (Sentry) when configured
    // Sentry.captureException(error, { contexts: { feature, errorInfo } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex min-h-[400px] items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle
                  className="text-destructive h-6 w-6"
                  aria-hidden="true"
                />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An error occurred in the {this.props.feature} section.
                We&apos;ve logged this issue and will investigate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDevelopment() && this.state.error && (
                <div
                  className="bg-muted rounded-md p-4 font-mono text-sm"
                  role="region"
                  aria-label="Error details"
                >
                  <p className="font-semibold">Error Details:</p>
                  <p className="text-destructive">{this.state.error.message}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                aria-label="Try again"
              >
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Go Back
              </Button>
              <Button
                onClick={() =>
                  (window.location.href =
                    "mailto:support@gym-manager.com?subject=Error Report")
                }
                variant="ghost"
                aria-label="Contact support via email"
              >
                <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                Contact Support
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }

  static displayName = "AppErrorBoundary";
}
