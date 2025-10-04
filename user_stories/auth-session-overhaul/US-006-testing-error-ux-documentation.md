# US-006: Testing, Error UX, and Documentation

**Status**: 📝 Not Started
**Priority**: P0 (Critical)
**Effort**: Large
**Dependencies**: US-001, US-002, US-003, US-004, US-005 (ALL previous stories)

---

## User Story

**As a** development team
**I want** comprehensive testing, improved error UX, and complete documentation
**So that** the auth system is reliable, user-friendly, and maintainable

---

## Problem Statement

After implementing US-001 through US-005, we have:

- ✅ Unified session management
- ✅ Server-side middleware
- ✅ Complete auth event handling
- ✅ Session validation on tab focus
- ✅ Secure state persistence

**But we're missing**:

- ❌ Comprehensive test coverage
- ❌ User-friendly error messages
- ❌ Documentation for maintainers
- ❌ Edge case handling verification

---

## Objectives

1. ✅ Achieve 90%+ test coverage for auth code
2. ✅ Create unit tests for all auth hooks
3. ✅ Create integration tests for auth flows
4. ✅ Improve error messages for common failures
5. ✅ Add error boundaries for auth failures
6. ✅ Document new architecture in `CLAUDE.md`
7. ✅ Create `docs/AUTH.md` guide
8. ✅ Add JSDoc comments to all auth hooks
9. ✅ Complete manual testing checklist

---

## Technical Requirements

### Part 1: Unit Tests (40% of effort)

#### Test 1: `use-auth.test.ts`

**File**: `src/hooks/__tests__/use-auth.test.ts`

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "../use-auth";
import { supabase } from "@/lib/supabase";
import { vi } from "vitest";

vi.mock("@/lib/supabase");

describe("useAuth", () => {
  describe("Event Handling", () => {
    test("handles SIGNED_IN event", async () => {
      // Arrange
      const mockUser = { id: "123", email: "test@example.com" };
      const mockSession = { user: mockUser, access_token: "token" };

      // Act
      const { result } = renderHook(() => useAuth());

      // Simulate SIGNED_IN event
      const authStateChange = vi.mocked(supabase.auth.onAuthStateChange);
      const callback = authStateChange.mock.calls[0][0];
      await callback("SIGNED_IN", mockSession);

      // Assert
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toBeTruthy();
      });
    });

    test("handles SIGNED_OUT event", async () => {
      // ... similar test
    });

    test("handles TOKEN_REFRESHED event", async () => {
      // ... similar test
    });

    test("handles USER_UPDATED event", async () => {
      // ... similar test
    });
  });

  describe("Error Handling", () => {
    test("handles token refresh failure", async () => {
      // ... test retry logic
    });

    test("sets error state on auth failure", async () => {
      // ... test error state
    });
  });

  describe("Sign In/Out", () => {
    test("signIn with valid credentials", async () => {
      // ... test login
    });

    test("signIn with invalid credentials", async () => {
      // ... test error handling
    });

    test("signOut clears user state", async () => {
      // ... test logout
    });
  });

  describe("Race Conditions", () => {
    test("handles rapid sign in/out", async () => {
      // ... test race condition handling
    });
  });
});
```

#### Test 2: `use-session-validator.test.ts`

**File**: `src/hooks/__tests__/use-session-validator.test.ts`

```typescript
describe("useSessionValidator", () => {
  test("validates session on visibility change", async () => {
    /* ... */
  });
  test("throttles validation calls", async () => {
    /* ... */
  });
  test("logs out on expired session", async () => {
    /* ... */
  });
  test("maintains session if valid", async () => {
    /* ... */
  });
});
```

#### Test 3: `middleware.test.ts`

**File**: `src/middleware.test.ts`

```typescript
import { middleware } from "./middleware";
import { NextRequest } from "next/server";

describe("Auth Middleware", () => {
  test("allows public routes without auth", async () => {
    /* ... */
  });
  test("redirects to login for protected routes", async () => {
    /* ... */
  });
  test("allows authenticated users to protected routes", async () => {
    /* ... */
  });
  test("preserves redirect URL in query params", async () => {
    /* ... */
  });
});
```

---

### Part 2: Integration Tests (30% of effort)

#### Test: `auth-flow.test.tsx`

**File**: `src/features/auth/__tests__/auth-flow.test.tsx`

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/login-form";
import { AuthProvider } from "@/lib/auth-provider";

describe("Complete Auth Flow", () => {
  test("full login flow", async () => {
    // 1. Render login form
    // 2. Enter credentials
    // 3. Submit form
    // 4. Verify redirect
    // 5. Verify user state updated
  });

  test("logout flow", async () => {
    // 1. User logged in
    // 2. Click logout
    // 3. Verify redirect to login
    // 4. Verify state cleared
  });

  test("token refresh flow", async () => {
    // 1. User logged in
    // 2. Simulate token expiry
    // 3. Trigger refresh
    // 4. Verify seamless refresh
  });

  test("session expiry flow", async () => {
    // 1. User logged in
    // 2. Simulate session expiry
    // 3. Verify auto-logout
    // 4. Verify redirect to login
  });

  test("multi-tab synchronization", async () => {
    // 1. Open two tabs
    // 2. Login in tab 1
    // 3. Verify tab 2 updates
    // 4. Logout in tab 1
    // 5. Verify tab 2 logs out
  });
});
```

---

### Part 3: Error UX Improvements (15% of effort)

#### Improve Error Messages

**File**: `src/components/auth-error-banner.tsx`

Update to show specific, actionable messages:

```typescript
const ERROR_MESSAGES = {
  'Invalid login credentials': {
    title: 'Login Failed',
    message: 'The email or password you entered is incorrect. Please try again.',
    action: 'retry',
  },
  'refresh_token_not_found': {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
    action: 'login',
  },
  'Network request failed': {
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    action: 'retry',
  },
  default: {
    title: 'Authentication Error',
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    action: 'retry',
  },
};

export function AuthErrorBanner({ error, onRetry, onDismiss }: AuthErrorBannerProps) {
  const errorConfig = ERROR_MESSAGES[error] || ERROR_MESSAGES.default;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{errorConfig.title}</AlertTitle>
      <AlertDescription>
        {errorConfig.message}
        <div className="mt-3 flex gap-2">
          {errorConfig.action === 'retry' && (
            <Button size="sm" onClick={onRetry}>Retry</Button>
          )}
          {errorConfig.action === 'login' && (
            <Button size="sm" onClick={() => router.push('/login')}>
              Log In
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

#### Add Error Boundary

**File**: `src/components/auth-error-boundary.tsx`

```typescript
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Auth error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold">Authentication Error</h2>
            <p className="text-muted-foreground mt-2">
              Something went wrong. Please refresh the page or log in again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### Part 4: Documentation (15% of effort)

#### Update `CLAUDE.md`

**File**: `CLAUDE.md`

Add new section:

```markdown
## Authentication Architecture

### Overview

This application uses Supabase Auth with server-side validation for secure session management.

### Key Components

- **Supabase Client** (`src/lib/supabase.ts`) - Client-side auth operations
- **Supabase Server** (`src/lib/supabase-server.ts`) - Server-side validation
- **Auth Middleware** (`src/middleware.ts`) - Route protection
- **useAuth Hook** (`src/hooks/use-auth.ts`) - Auth state management
- **Session Validator** (`src/hooks/use-session-validator.ts`) - Tab focus validation

### Session Management

- Sessions managed by Supabase (JWT tokens)
- Access tokens: 1 hour expiry (auto-refreshed)
- Refresh tokens: 30 days expiry
- Server validates session on every protected route
- Client validates session on tab focus

### Security Features

- ✅ Server-side route protection
- ✅ No sensitive data in localStorage
- ✅ Automatic token refresh
- ✅ Session expiry handling
- ✅ Multi-tab synchronization

For detailed guide, see `docs/AUTH.md`.
```

#### Create `docs/AUTH.md`

**File**: `docs/AUTH.md`

```markdown
# Authentication Guide

## Architecture

[Detailed explanation of auth system]

## Usage

### Client-Side Auth

[How to use useAuth hook]

### Server-Side Auth

[How to use server client in API routes]

### Protected Routes

[How middleware works]

## Common Tasks

### Adding a Protected Route

[Step-by-step guide]

### Customizing Error Messages

[How to update error banner]

### Debugging Auth Issues

[Common problems and solutions]

## API Reference

[Documentation of all auth hooks and utilities]
```

---

## Acceptance Criteria

### Testing

- [ ] `use-auth.test.ts` created with 90%+ coverage
- [ ] `use-session-validator.test.ts` created
- [ ] `middleware.test.ts` created
- [ ] `auth-flow.test.tsx` integration tests created
- [ ] All tests passing
- [ ] Test coverage report shows 90%+ for auth code

### Error UX

- [ ] Error banner shows specific, actionable messages
- [ ] Auth error boundary implemented
- [ ] Error messages tested for common scenarios
- [ ] No generic "error occurred" messages

### Documentation

- [ ] `CLAUDE.md` updated with auth architecture
- [ ] `docs/AUTH.md` created with comprehensive guide
- [ ] JSDoc comments added to all auth hooks
- [ ] Code examples included in docs

### Quality

- [ ] `npm test` passes 100%
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run build` succeeds
- [ ] Manual testing checklist completed

---

## Files to Create

- `src/hooks/__tests__/use-auth.test.ts` (NEW)
- `src/hooks/__tests__/use-session-validator.test.ts` (NEW)
- `src/middleware.test.ts` (NEW)
- `src/features/auth/__tests__/auth-flow.test.tsx` (NEW)
- `src/components/auth-error-boundary.tsx` (NEW)
- `docs/AUTH.md` (NEW)

---

## Files to Modify

- `CLAUDE.md` - Add auth architecture section
- `src/components/auth-error-banner.tsx` - Improve error messages
- All auth hooks - Add JSDoc comments

---

## Manual Testing Checklist

### Happy Path

- [ ] User can log in with valid credentials
- [ ] User can log out successfully
- [ ] Session persists across page refresh
- [ ] Protected routes accessible when authenticated
- [ ] Public routes accessible without auth

### Error Scenarios

- [ ] Invalid credentials show clear error
- [ ] Network error during login shows retry option
- [ ] Session expiry shows "log in again" message
- [ ] Token refresh failure handled gracefully

### Edge Cases

- [ ] Multi-tab: login in tab 1 → tab 2 updates
- [ ] Multi-tab: logout in tab 1 → tab 2 logs out
- [ ] Tab inactive for 2+ hours → session validated on return
- [ ] Rapid tab switching → validation throttled
- [ ] Browser refresh during login → no broken state
- [ ] Direct URL to protected route → redirect preserves URL

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Performance

- [ ] Login completes in < 2 seconds
- [ ] Session validation in < 500ms
- [ ] No unnecessary re-renders
- [ ] No memory leaks (checked with DevTools)

---

## JSDoc Comment Template

Example for auth hooks:

````typescript
/**
 * Authentication hook providing sign in/out functionality and auth state.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, signIn, signOut } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <LoginForm onSubmit={signIn} />;
 *   }
 *
 *   return <div>Welcome, {user.email}</div>;
 * }
 * ```
 *
 * @returns {Object} Auth state and methods
 * @returns {User | null} user - Current authenticated user
 * @returns {boolean} isAuthenticated - Whether user is logged in
 * @returns {boolean} isLoading - Whether auth state is loading
 * @returns {Function} signIn - Sign in with email/password
 * @returns {Function} signOut - Sign out current user
 */
export function useAuth() {
  // ...
}
````

---

## Definition of Done

- [ ] All unit tests created and passing
- [ ] All integration tests created and passing
- [ ] 90%+ test coverage for auth code
- [ ] Error UX improved with specific messages
- [ ] Error boundary implemented
- [ ] `CLAUDE.md` updated
- [ ] `docs/AUTH.md` created
- [ ] JSDoc comments added to all auth hooks
- [ ] Manual testing checklist 100% complete
- [ ] All acceptance criteria met
- [ ] Linting passing
- [ ] Build succeeds
- [ ] Git commit with descriptive message
- [ ] `STATUS.md` updated to "Completed"
- [ ] Ready for production deployment

---

**This is the final user story. Upon completion, the auth overhaul project is complete!**
