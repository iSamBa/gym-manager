"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { logger } from "@/lib/logger";
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Auth Error Boundary Component
 *
 * Catches authentication-related errors in the React component tree
 * and displays a user-friendly fallback UI with recovery options.
 *
 * @example
 * ```tsx
 * <AuthErrorBoundary>
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 * </AuthErrorBoundary>
 * ```
 *
 * @example Custom fallback
 * ```tsx
 * <AuthErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourApp />
 * </AuthErrorBoundary>
 * ```
 */
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("Auth error caught by boundary:", { error, errorInfo });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoToLogin = () => {
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="flex justify-center">
              <div className="bg-destructive/10 rounded-full p-3">
                <AlertTriangle className="text-destructive h-10 w-10" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Authentication Error
              </h2>
              <p className="text-muted-foreground">
                Something went wrong with the authentication system. This could
                be due to a network issue or an unexpected error.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left">
                <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">
                  Technical Details
                </summary>
                <pre className="bg-muted mt-2 overflow-auto rounded-md p-3 text-xs">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={this.handleRefresh} variant="default">
                Refresh Page
              </Button>
              <Button onClick={this.handleGoToLogin} variant="outline">
                Go to Login
              </Button>
            </div>

            <p className="text-muted-foreground text-xs">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
