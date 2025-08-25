import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MemberErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Member component error:", error, errorInfo);

    this.props.onError?.(error, errorInfo);

    toast.error("Component Error", {
      description:
        "A member component encountered an error. Please try refreshing.",
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="mx-auto mt-8 max-w-md">
          <CardHeader className="text-center">
            <div className="mb-2 flex justify-center">
              <AlertTriangle className="text-destructive h-12 w-12" />
            </div>
            <CardTitle className="text-lg">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground text-sm">
              The member component encountered an unexpected error. This issue
              has been logged and will be investigated.
            </p>

            {this.state.error && (
              <details className="text-left">
                <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium">
                  Error Details
                </summary>
                <pre className="bg-muted mt-2 overflow-auto rounded p-2 text-xs">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={this.handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withMemberErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <MemberErrorBoundary fallback={fallback}>
      <Component {...props} />
    </MemberErrorBoundary>
  );

  WrappedComponent.displayName = `withMemberErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
