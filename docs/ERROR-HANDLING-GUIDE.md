# Error Handling Guide

This guide explains the error handling patterns and best practices for the gym management application.

## Table of Contents

- [Overview](#overview)
- [Error Boundary Architecture](#error-boundary-architecture)
- [Usage Patterns](#usage-patterns)
- [When to Use Error Boundaries](#when-to-use-error-boundaries)
- [Testing Error Scenarios](#testing-error-scenarios)
- [Best Practices](#best-practices)
- [Integration with Monitoring](#integration-with-monitoring)
- [Common Examples](#common-examples)

---

## Overview

Our application uses a comprehensive error handling strategy built on React Error Boundaries and Next.js error handling mechanisms. This ensures users see helpful recovery options instead of blank screens when errors occur.

### Key Components

| Component            | Location                                       | Purpose                                    |
| -------------------- | ---------------------------------------------- | ------------------------------------------ |
| **AppErrorBoundary** | `src/components/feedback/AppErrorBoundary.tsx` | Consolidated error boundary for all routes |
| **Route error.tsx**  | `src/app/[route]/error.tsx`                    | Next.js route-level error handling         |
| **ErrorBoundary**    | `src/components/feedback/ErrorBoundary.tsx`    | Advanced error boundary (optional use)     |

---

## Error Boundary Architecture

### AppErrorBoundary Component

The `AppErrorBoundary` component is our standardized error boundary with feature-specific context.

**Features:**

- ✅ Feature-specific error logging
- ✅ User-friendly error messages
- ✅ Recovery actions (Try Again, Go Back, Contact Support)
- ✅ Development-only error details
- ✅ Sentry integration ready
- ✅ Full accessibility (ARIA attributes)

**Props:**

```typescript
interface AppErrorBoundaryProps {
  feature: string; // Feature name for logging context
  fallback?: ReactNode; // Optional custom fallback UI
  onError?: (error: Error, errorInfo: ErrorInfo) => void; // Custom error handler
  children: ReactNode; // Components to protect
}
```

### Next.js error.tsx Files

Error.tsx files provide route-level error handling following Next.js conventions.

**Location Pattern:** `src/app/[route]/error.tsx`

**Example:**

```typescript
'use client';

import { useEffect } from 'react';
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Route error:', {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <AppErrorBoundary feature="feature-name">
      <div className="flex items-center justify-center min-h-screen">
        {/* Error UI handled by AppErrorBoundary */}
      </div>
    </AppErrorBoundary>
  );
}
```

---

## Usage Patterns

### Pattern 1: Route-Level Error Handling (Recommended)

Use Next.js `error.tsx` files for route-level error handling:

```typescript
// src/app/members/error.tsx
'use client';

import { useEffect } from 'react';
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { logger } from '@/lib/logger';

export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Members route error:', { error: error.message });
  }, [error]);

  return (
    <AppErrorBoundary
      feature="members"
      onError={(err, errorInfo) => {
        logger.error('Members error boundary triggered', {
          error: err.message,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <div className="flex items-center justify-center min-h-screen">
        {/* Error UI handled by AppErrorBoundary */}
      </div>
    </AppErrorBoundary>
  );
}
```

### Pattern 2: Component-Level Error Handling

For granular error handling within a component:

```typescript
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';

export function MyFeatureComponent() {
  return (
    <AppErrorBoundary
      feature="my-feature"
      onError={(error, errorInfo) => {
        // Custom error handling logic
      }}
    >
      <ComplexComponent />
    </AppErrorBoundary>
  );
}
```

### Pattern 3: Custom Fallback UI

Provide custom fallback UI when needed:

```typescript
<AppErrorBoundary
  feature="payments"
  fallback={
    <CustomErrorUI
      title="Payment Error"
      message="Unable to process payment. Please try again."
    />
  }
>
  <PaymentForm />
</AppErrorBoundary>
```

---

## When to Use Error Boundaries

### ✅ Use Error Boundaries For:

1. **All Route-Level Components** (Required)
   - Every route should have an `error.tsx` file
   - Prevents entire app crashes

2. **Critical Features**
   - Payment processing
   - Data mutations
   - Complex forms

3. **Third-Party Integrations**
   - External API calls
   - Chart libraries
   - File uploads

4. **Expensive Operations**
   - Large data processing
   - Complex calculations
   - Rendering heavy lists

### ❌ Don't Use Error Boundaries For:

1. **Event Handlers** - Use try-catch instead:

   ```typescript
   const handleClick = async () => {
     try {
       await someOperation();
     } catch (error) {
       logger.error("Operation failed", { error });
       toast.error("Operation failed");
     }
   };
   ```

2. **Async Code** - Use try-catch:

   ```typescript
   useEffect(() => {
     async function fetchData() {
       try {
         const data = await fetch("/api/data");
         setData(data);
       } catch (error) {
         logger.error("Fetch failed", { error });
       }
     }
     fetchData();
   }, []);
   ```

3. **Server-Side Rendering** - Use Next.js error pages

4. **Error Boundaries Themselves** - They can't catch their own errors

---

## Testing Error Scenarios

### Unit Testing Error Boundaries

```typescript
// src/components/feedback/__tests__/AppErrorBoundary.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AppErrorBoundary } from '../AppErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('AppErrorBoundary', () => {
  it('catches errors and displays fallback UI', () => {
    render(
      <AppErrorBoundary feature="test">
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/test section/i)).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <AppErrorBoundary feature="test" onError={onError}>
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('allows reset and retry', () => {
    let shouldThrow = true;
    const TestComponent = () => {
      if (shouldThrow) throw new Error('Test error');
      return <div>Success!</div>;
    };

    const { rerender } = render(
      <AppErrorBoundary feature="test">
        <TestComponent />
      </AppErrorBoundary>
    );

    const resetButton = screen.getByText(/Try Again/i);
    shouldThrow = false;
    fireEvent.click(resetButton);

    rerender(
      <AppErrorBoundary feature="test">
        <TestComponent />
      </AppErrorBoundary>
    );

    expect(screen.getByText(/Success!/i)).toBeInTheDocument();
  });
});
```

### Integration Testing

Test error scenarios in route components:

```typescript
// src/app/members/__tests__/error-handling.test.tsx
import { render, screen } from '@testing-library/react';

describe('Members Route Error Handling', () => {
  it('displays error boundary when component throws', async () => {
    // Mock API to throw error
    vi.mocked(fetchMembers).mockRejectedValueOnce(new Error('API Error'));

    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/members section/i)).toBeInTheDocument();
    });
  });
});
```

### Manual Testing

**Test Checklist:**

- [ ] Navigate to each major route
- [ ] Simulate network failures
- [ ] Test with invalid data
- [ ] Verify error messages are user-friendly
- [ ] Check recovery actions work (Try Again, Go Back)
- [ ] Confirm errors are logged correctly

**How to Simulate Errors:**

1. **Network Errors:**

   ```typescript
   // In development, temporarily add:
   throw new Error("Network request failed");
   ```

2. **Component Errors:**

   ```typescript
   // Add to component:
   if (someCondition) throw new Error("Test error");
   ```

3. **API Errors:**
   - Use browser DevTools to throttle network
   - Block API requests in Network tab

---

## Best Practices

### 1. Error Messages

**✅ Good Error Messages:**

- User-friendly and actionable
- Avoid technical jargon
- Provide recovery steps

```typescript
// ✅ Good
"An error occurred in the members section. We've logged this issue and will investigate.";

// ❌ Bad
"Uncaught TypeError: Cannot read property 'map' of undefined";
```

### 2. Error Logging

**Always provide context:**

```typescript
logger.error("Feature error", {
  feature: "members",
  error: error.message,
  stack: error.stack,
  userId: user?.id,
  action: "delete-member",
  memberId: id,
});
```

### 3. Recovery Actions

**Provide meaningful recovery options:**

```typescript
// ✅ Good: Multiple recovery options
<Button onClick={reset}>Try Again</Button>
<Button onClick={() => router.back()}>Go Back</Button>
<Button onClick={() => router.push('/')}>Go Home</Button>

// ❌ Bad: No recovery options
<div>Error occurred</div>
```

### 4. Development vs Production

**Show details in development only:**

```typescript
{process.env.NODE_ENV === 'development' && error && (
  <div className="rounded-md bg-muted p-4 font-mono text-sm">
    <p className="font-semibold">Error Details:</p>
    <p className="text-destructive">{error.message}</p>
    <pre className="text-xs">{error.stack}</pre>
  </div>
)}
```

### 5. Feature-Specific Logging

**Always set feature context:**

```typescript
// ✅ Good: Helps identify error source
<AppErrorBoundary feature="payments">

// ❌ Bad: Generic logging
<AppErrorBoundary feature="unknown">
```

---

## Integration with Monitoring

### Current Setup

Error boundaries are configured to log errors using the logger utility. Future integration with Sentry is prepared.

```typescript
// Current logging
logger.error(`Error in ${feature} feature`, {
  error: error.message,
  stack: error.stack,
  componentStack: errorInfo.componentStack,
  feature,
});

// TODO: Sentry integration (prepared)
// Sentry.captureException(error, {
//   contexts: {
//     feature,
//     errorInfo,
//   },
// });
```

### Future: Sentry Integration (US-011)

When Sentry is configured (US-011), errors will automatically be sent to Sentry with full context:

1. **Install Sentry:**

   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

2. **Uncomment Sentry code in AppErrorBoundary:**

   ```typescript
   componentDidCatch(error: Error, errorInfo: ErrorInfo) {
     // ... existing logging

     // Send to Sentry
     Sentry.captureException(error, {
       contexts: {
         react: {
           componentStack: errorInfo.componentStack,
         },
         feature: {
           name: this.props.feature,
         },
       },
     });
   }
   ```

3. **Configure source maps** for better error tracking

---

## Common Examples

### Example 1: Members List Page

```typescript
// src/app/members/error.tsx
'use client';

import { useEffect } from 'react';
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { logger } from '@/lib/logger';

export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Members route error:', {
      error: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <AppErrorBoundary feature="members">
      <div className="flex items-center justify-center min-h-screen">
        {/* Error UI handled by AppErrorBoundary */}
      </div>
    </AppErrorBoundary>
  );
}
```

### Example 2: Payment Form with Custom Handling

```typescript
// Component with custom error handling
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';

export function PaymentForm() {
  return (
    <AppErrorBoundary
      feature="payments"
      onError={(error, errorInfo) => {
        // Send to analytics
        analytics.track('payment_error', {
          error: error.message,
          componentStack: errorInfo.componentStack,
        });

        // Show user notification
        toast.error('Payment processing failed', {
          description: 'Please check your payment information and try again.',
        });
      }}
    >
      <PaymentFormFields />
    </AppErrorBoundary>
  );
}
```

### Example 3: Critical Feature with Custom Fallback

```typescript
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { AlertCircle } from 'lucide-react';

function CriticalFeatureFallback() {
  return (
    <div className="text-center p-8">
      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Service Temporarily Unavailable</h2>
      <p className="text-muted-foreground mb-4">
        This critical feature is currently unavailable. Our team has been notified.
      </p>
      <Button onClick={() => window.location.reload()}>Refresh Page</Button>
    </div>
  );
}

export function CriticalFeature() {
  return (
    <AppErrorBoundary
      feature="critical-feature"
      fallback={<CriticalFeatureFallback />}
    >
      <CriticalComponent />
    </AppErrorBoundary>
  );
}
```

---

## Troubleshooting

### Error Boundary Not Catching Errors

**Problem:** Error boundary doesn't catch certain errors

**Solution:** Remember that error boundaries don't catch:

- Errors in event handlers (use try-catch)
- Errors in async code (use try-catch)
- SSR errors (use Next.js error pages)
- Errors in the error boundary itself

### Infinite Error Loop

**Problem:** Error boundary keeps re-rendering error state

**Solution:**

- Check if error is thrown during render
- Ensure error condition is fixable via reset
- Add error boundary at a higher level

### Error Not Logged

**Problem:** Errors occur but not logged

**Solution:**

- Verify logger utility is working
- Check console for any logger errors
- Ensure feature prop is provided to AppErrorBoundary

---

## Related Documentation

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [CLAUDE.md - Production Readiness Standards](../CLAUDE.md#production-readiness-standards)
- [Logger Utility](../src/lib/logger.ts)

---

**Last Updated:** 2025-01-20
**Maintained By:** Development Team
