# US-001: Add Error Boundaries to All Routes

## User Story

**As a** developer  
**I want** comprehensive error boundaries across all routes  
**So that** unhandled errors don't crash the entire application and users see helpful recovery options

## Business Value

Prevents catastrophic user experience failures by providing graceful error handling. When errors occur, users see helpful messages and recovery options instead of blank screens or full application crashes. This is critical for production stability and user trust.

## Current State

- Only 2 error boundaries exist:
  - `/app/trainers/[id]/error.tsx`
  - `/app/members/[id]/error.tsx`
- Missing error boundaries for 10+ other major routes
- Multiple duplicate error boundary implementations:
  - `TrainerErrorBoundary.tsx`
  - `MemberErrorBoundary.tsx`
  - `ErrorBoundary.tsx`
  - `auth-error-boundary.tsx`
  - `error-boundary.tsx`
- No standardized error handling pattern

## Target State

- Consolidated `AppErrorBoundary` component with:
  - Feature-specific context for logging
  - User-friendly error messages
  - Recovery actions (reset, retry, go back)
  - Integration with monitoring service
- `error.tsx` files for all major routes
- Single source of truth for error boundary logic
- Documentation of error handling patterns

## Acceptance Criteria

### 1. Create Consolidated AppErrorBoundary Component

**Location**: `src/components/feedback/AppErrorBoundary.tsx`

**Requirements**:

- [ ] Implement as React Error Boundary class component
- [ ] Accept props: `feature`, `fallback`, `onError`, `children`
- [ ] Feature-specific context for error logging
- [ ] User-friendly error UI with:
  - Clear error message
  - Recovery actions (Reset, Go Back, Contact Support)
  - Error details in development mode only
- [ ] Integration point for future monitoring service (Sentry)
- [ ] Display name set for debugging
- [ ] TypeScript interfaces defined
- [ ] Fully accessible (ARIA attributes)

**Implementation Pattern**:

```typescript
interface AppErrorBoundaryProps {
  feature: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: ReactNode;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, State> {
  // Implementation
}
```

### 2. Add error.tsx to All Major Routes

Create `error.tsx` files for these routes:

- [ ] `/app/payments/error.tsx`
- [ ] `/app/plans/error.tsx`
- [ ] `/app/settings/error.tsx`
- [ ] `/app/subscriptions/error.tsx`
- [ ] `/app/trainers/error.tsx`
- [ ] `/app/members/error.tsx`
- [ ] `/app/dashboard/error.tsx`
- [ ] `/app/equipment/error.tsx`
- [ ] `/app/classes/error.tsx`

**Each error.tsx must**:

- Be a client component (`'use client'`)
- Accept `error` and `reset` props from Next.js
- Use `AppErrorBoundary` with appropriate feature name
- Include retry/reset functionality

### 3. Remove Duplicate Error Boundaries

- [ ] Deprecate `src/features/trainers/components/TrainerErrorBoundary.tsx`
- [ ] Deprecate `src/features/members/components/MemberErrorBoundary.tsx`
- [ ] Update all imports to use `AppErrorBoundary`
- [ ] Remove unused error boundary files
- [ ] Update tests to use new error boundary

### 4. Create Documentation

**Location**: `docs/ERROR-HANDLING-GUIDE.md`

**Contents**:

- [ ] Error boundary usage patterns
- [ ] When to use error boundaries
- [ ] How to test error scenarios
- [ ] Best practices for error messages
- [ ] Integration with monitoring
- [ ] Examples for common scenarios

### 5. Testing Requirements

- [ ] Unit tests for `AppErrorBoundary`:
  - Catches errors correctly
  - Displays fallback UI
  - Calls onError callback
  - Reset functionality works
- [ ] Integration tests for each route:
  - Simulate component errors
  - Verify error boundary activates
  - Test recovery actions
- [ ] Test error logging integration
- [ ] Accessibility testing (ARIA, keyboard navigation)

### 6. Verification

- [ ] All 9 routes have `error.tsx` files
- [ ] Consolidated error boundary created and tested
- [ ] Documentation complete and reviewed
- [ ] All tests passing (100% pass rate)
- [ ] No console errors during error scenarios
- [ ] `npm run lint` passes (0 errors, 0 warnings)
- [ ] `npm run build` succeeds
- [ ] TypeScript compilation passes

## Technical Implementation

### AppErrorBoundary Component

```typescript
// src/components/feedback/AppErrorBoundary.tsx
'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

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

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
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
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An error occurred in the {this.props.feature} section.
                We've logged this issue and will investigate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-md bg-muted p-4 font-mono text-sm">
                  <p className="font-semibold">Error Details:</p>
                  <p className="text-destructive">{this.state.error.message}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={() => window.history.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button
                onClick={() => window.location.href = 'mailto:support@gym-manager.com?subject=Error Report'}
                variant="ghost"
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

AppErrorBoundary.displayName = 'AppErrorBoundary';
```

### Route error.tsx Template

```typescript
// Example: app/members/error.tsx
'use client';

import { useEffect } from 'react';
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error on mount
    console.error('Members route error:', error);
  }, [error]);

  return (
    <AppErrorBoundary
      feature="members"
      onError={(err) => {
        // Additional error handling if needed
      }}
    >
      <div className="flex items-center justify-center min-h-screen">
        {/* Error UI handled by AppErrorBoundary */}
      </div>
    </AppErrorBoundary>
  );
}
```

## Testing Strategy

### Unit Tests

```typescript
// src/components/feedback/__tests__/AppErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react';
import { AppErrorBoundary } from '../AppErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('AppErrorBoundary', () => {
  it('should catch errors and display fallback UI', () => {
    render(
      <AppErrorBoundary feature="test">
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/test section/i)).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();
    render(
      <AppErrorBoundary feature="test" onError={onError}>
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });

  it('should allow reset and retry', async () => {
    const { rerender } = render(
      <AppErrorBoundary feature="test">
        <ThrowError />
      </AppErrorBoundary>
    );

    const resetButton = screen.getByText(/Try Again/i);
    resetButton.click();

    // After reset, component should attempt to render children again
    rerender(
      <AppErrorBoundary feature="test">
        <div>Success!</div>
      </AppErrorBoundary>
    );

    expect(screen.getByText(/Success!/i)).toBeInTheDocument();
  });
});
```

## Definition of Done

- [x] All acceptance criteria met
- [x] AppErrorBoundary component created and tested
- [x] All 9 routes have error.tsx files
- [x] Duplicate error boundaries removed
- [x] Documentation created (ERROR-HANDLING-GUIDE.md)
- [x] All unit tests passing
- [x] Integration tests passing
- [x] Accessibility verified
- [x] `npm run lint` passes (0 errors, 0 warnings)
- [x] `npm run build` succeeds
- [x] `npx tsc --noEmit` passes
- [x] Manual testing completed for error scenarios
- [x] STATUS.md updated
- [x] Changes committed to git

## Dependencies

None - This user story can be started immediately

## Estimated Effort

**8 hours**

Breakdown:

- AppErrorBoundary component: 2 hours
- error.tsx files (9 routes): 2 hours
- Remove duplicates and update imports: 1 hour
- Documentation: 1 hour
- Testing: 2 hours

## Priority

**P0 (Must Have)** - Critical for production stability

## Sprint

Sprint 1: Critical Stability Fixes (Week 1)

## Related User Stories

- US-002: Add Loading States (complementary UX improvement)
- US-012: Production Readiness Audit (validates this implementation)

## Notes

- Error boundaries only catch errors in React component tree
- They do NOT catch:
  - Event handlers (use try-catch)
  - Async code (use try-catch)
  - Server-side rendering errors
  - Errors in error boundary itself
- Consider adding error boundaries at multiple levels (route + feature)
- Integration with Sentry will be added in US-011

## References

- [React Error Boundaries Documentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- CLAUDE.md Production Readiness Standards - Error Handling Requirements
