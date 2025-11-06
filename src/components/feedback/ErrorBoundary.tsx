"use client";

import React, { Component, ErrorInfo, ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Bug,
  WifiOff,
  Shield,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { logger } from "@/lib/logger";
interface ErrorState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  showRetry?: boolean;
  maxRetries?: number;
  level?: "page" | "component" | "critical";
}

// Error classification
enum ErrorType {
  NETWORK = "network",
  VALIDATION = "validation",
  PERMISSION = "permission",
  TIMEOUT = "timeout",
  UNKNOWN = "unknown",
}

function getErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase();

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection")
  ) {
    return ErrorType.NETWORK;
  }
  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required")
  ) {
    return ErrorType.VALIDATION;
  }
  if (
    message.includes("permission") ||
    message.includes("forbidden") ||
    message.includes("unauthorized")
  ) {
    return ErrorType.PERMISSION;
  }
  if (message.includes("timeout")) {
    return ErrorType.TIMEOUT;
  }

  return ErrorType.UNKNOWN;
}

function generateErrorId(): string {
  return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorState> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorId: "",
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId;

    logger.error("Error Boundary Caught:", {
      error,
      errorInfo,
      errorId,
      level: this.props.level || "component",
    });

    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo, errorId);

    // Show user notification based on error type
    const errorType = getErrorType(error);

    switch (errorType) {
      case ErrorType.NETWORK:
        toast.error("Connection Problem", {
          description: "Please check your internet connection and try again.",
        });
        break;
      case ErrorType.PERMISSION:
        toast.error("Access Denied", {
          description: "You don't have permission to perform this action.",
        });
        break;
      case ErrorType.TIMEOUT:
        toast.error("Request Timeout", {
          description: "The request took too long. Please try again.",
        });
        break;
      default:
        toast.error("Something went wrong", {
          description:
            "An unexpected error occurred. Our team has been notified.",
        });
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;

    if (this.state.retryCount >= maxRetries) {
      toast.warning("Maximum retries reached", {
        description: "Please refresh the page or contact support.",
      });
      return;
    }

    this.setState((prevState) => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
    }));

    // Add a small delay before retry to prevent rapid error loops
    this.retryTimeout = setTimeout(() => {
      // Force a re-render
      this.forceUpdate();
    }, 500);
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = getErrorType(this.state.error);

      return (
        <ErrorDisplay
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          errorType={errorType}
          onRetry={
            this.props.showRetry !== false ? this.handleRetry : undefined
          }
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries || 3}
          level={this.props.level || "component"}
        />
      );
    }

    return this.props.children;
  }
}

// Enhanced Error Display Component
interface ErrorDisplayProps {
  error: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  errorType: ErrorType;
  onRetry?: () => void;
  retryCount: number;
  maxRetries: number;
  level: "page" | "component" | "critical";
}

function ErrorDisplay({
  error,
  errorInfo,
  errorId,
  errorType,
  onRetry,
  retryCount,
  maxRetries,
  level,
}: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getErrorConfig = () => {
    switch (errorType) {
      case ErrorType.NETWORK:
        return {
          title: "Connection Error",
          description:
            "We couldn't connect to the server. Please check your internet connection.",
          icon: WifiOff,
          color: "text-orange-600",
          actions: [
            { label: "Try Again", onClick: onRetry, icon: RefreshCw },
            {
              label: "Work Offline",
              onClick: () => logger.debug("Offline mode"),
            },
          ],
        };
      case ErrorType.VALIDATION:
        return {
          title: "Invalid Information",
          description: "Please check your input and try again.",
          icon: AlertTriangle,
          color: "text-red-600",
          actions: [
            { label: "Fix Errors", onClick: () => window.history.back() },
          ],
        };
      case ErrorType.PERMISSION:
        return {
          title: "Access Denied",
          description: "You don't have permission to access this resource.",
          icon: Shield,
          color: "text-red-600",
          actions: [
            { label: "Go Home", onClick: () => (window.location.href = "/") },
          ],
        };
      case ErrorType.TIMEOUT:
        return {
          title: "Request Timeout",
          description: "The request took too long to complete.",
          icon: Clock,
          color: "text-yellow-600",
          actions: [{ label: "Try Again", onClick: onRetry, icon: RefreshCw }],
        };
      default:
        return {
          title: "Something went wrong",
          description:
            "An unexpected error occurred. Our team has been notified.",
          icon: Bug,
          color: "text-red-600",
          actions: [
            { label: "Try Again", onClick: onRetry, icon: RefreshCw },
            { label: "Go Home", onClick: () => (window.location.href = "/") },
          ],
        };
    }
  };

  const config = getErrorConfig();
  const IconComponent = config.icon;

  const cardSize =
    level === "page"
      ? "max-w-lg"
      : level === "critical"
        ? "max-w-2xl"
        : "max-w-md";

  return (
    <div className={cn("mx-auto mt-8", cardSize)}>
      <Card className="border-destructive/20">
        <CardHeader className="pb-4 text-center">
          <div className="mb-3 flex justify-center">
            <div
              className={cn("bg-destructive/10 rounded-full p-3", config.color)}
            >
              <IconComponent className="h-8 w-8" />
            </div>
          </div>

          <CardTitle className="mb-2 text-xl">{config.title}</CardTitle>

          <div className="mb-2 flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-xs">
              Error ID: {errorId.slice(-8)}
            </Badge>

            {retryCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                Attempt {retryCount + 1}/{maxRetries + 1}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>What happened?</AlertTitle>
            <AlertDescription>{config.description}</AlertDescription>
          </Alert>

          {/* Error Details Collapsible */}
          {(error || errorInfo) && (
            <div className="rounded-lg border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-full justify-between p-3"
                onClick={() => setShowDetails(!showDetails)}
              >
                <span className="text-sm font-medium">Technical Details</span>
                {showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showDetails && (
                <div className="bg-muted/50 border-t p-3">
                  <div className="space-y-2 text-xs">
                    {error && (
                      <div>
                        <strong>Error:</strong>
                        <pre className="bg-background mt-1 overflow-auto rounded p-2 text-wrap">
                          {error.message}
                        </pre>
                      </div>
                    )}

                    {errorInfo && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="bg-background mt-1 max-h-32 overflow-auto rounded p-2 text-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}

                    <div>
                      <strong>Timestamp:</strong> {new Date().toISOString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            {config.actions.map((action, index) => (
              <Button
                key={index}
                variant={index === 0 ? "default" : "outline"}
                size="sm"
                onClick={action.onClick}
                disabled={
                  action.onClick === onRetry && retryCount >= maxRetries
                }
                className="flex items-center gap-2"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </Button>
            ))}
          </div>

          {/* Help Text */}
          <div className="text-muted-foreground pt-2 text-center text-xs">
            {retryCount >= maxRetries
              ? "If the problem persists, please contact support with the error ID above."
              : "This error has been automatically reported to our team."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Validation Error Display Component
interface ValidationErrorProps {
  errors: Array<{
    field: string;
    message: string;
  }>;
  onRetry?: () => void;
  onCancel?: () => void;
}

export function ValidationError({
  errors,
  onRetry,
  onCancel,
}: ValidationErrorProps) {
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Please check the following fields:</AlertTitle>
      <AlertDescription className="mt-2">
        <ul className="list-inside list-disc space-y-1">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">
              <strong>{error.field}:</strong> {error.message}
            </li>
          ))}
        </ul>

        {(onRetry || onCancel) && (
          <div className="mt-4 flex gap-2">
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Fix Errors
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
