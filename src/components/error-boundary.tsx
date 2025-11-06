"use client";

import React, { Component, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { logger } from "@/lib/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to error reporting service
    logger.error("ErrorBoundary caught an error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error info in state for display
    this.setState({
      errorInfo,
    });
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetErrorBoundary);
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                {this.state.error.message || "An unexpected error occurred"}
              </AlertDescription>
            </Alert>

            {/* Show error details in development */}
            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <div className="bg-muted space-y-2 rounded-lg p-4">
                <h3 className="text-sm font-semibold">Error Details</h3>
                <pre className="text-muted-foreground max-h-48 overflow-auto text-xs">
                  {this.state.error.stack}
                </pre>
                <h3 className="mt-4 text-sm font-semibold">Component Stack</h3>
                <pre className="text-muted-foreground max-h-48 overflow-auto text-xs">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <Button
              onClick={this.resetErrorBoundary}
              className="w-full"
              variant="outline"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Auth-specific error boundary with custom fallback
export function AuthErrorBoundary({ children }: { children: ReactNode }) {
  const handleAuthError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log auth-specific errors with additional context
    logger.error("Authentication error caught by boundary", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      authContext: true,
    });
  };

  const authFallback = (error: Error, reset: () => void) => {
    const isNetworkError =
      error.message?.toLowerCase().includes("network") ||
      error.message?.toLowerCase().includes("fetch");

    const isSupabaseError = error.message?.toLowerCase().includes("supabase");

    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant={isNetworkError ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {isNetworkError
                ? "Connection Problem"
                : isSupabaseError
                  ? "Authentication Service Error"
                  : "Authentication Error"}
            </AlertTitle>
            <AlertDescription className="mt-2">
              {isNetworkError
                ? "Unable to connect to the authentication service. Please check your internet connection and try again."
                : isSupabaseError
                  ? "The authentication service is temporarily unavailable. Please try again in a few moments."
                  : "An error occurred during authentication. Please refresh the page to try again."}
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={() => window.location.reload()}
              className="flex-1"
              variant="default"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
            <Button onClick={reset} className="flex-1" variant="outline">
              Try Again
            </Button>
          </div>

          {/* Development mode - show technical details */}
          {process.env.NODE_ENV === "development" && (
            <details className="bg-muted rounded-lg p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Technical Details
              </summary>
              <pre className="text-muted-foreground mt-2 max-h-48 overflow-auto text-xs">
                {error.message}
                {"\n\n"}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary fallback={authFallback} onError={handleAuthError}>
      {children}
    </ErrorBoundary>
  );
}
