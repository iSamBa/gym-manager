# US-003: Complete Auth Event Handling

**Status**: ✅ Completed
**Priority**: P0 (Critical)
**Effort**: Medium
**Dependencies**: US-001 (Unified Session Management)
**Completed**: 2025-10-04

**Implementation Notes**:

- Added authError state to Zustand store
- Implemented all 7 auth event handlers (INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY, MFA_CHALLENGE_VERIFIED)
- Created retryTokenRefresh function with exponential backoff (1s, 2s, 4s delays)
- Built AuthErrorBanner component with retry/dismiss actions
- Moved auth event listener to AuthProvider to prevent duplicate registrations
- All events fire exactly once (fixed duplicate event issue)

---

## User Story

**As a** developer
**I want** comprehensive handling of all Supabase auth events
**So that** token refresh failures and auth state changes are properly managed with user feedback

---

## Problem Statement

### Current Implementation Gaps

Currently, `use-auth.ts` only handles **2 of 8+ auth events**:

```typescript
// Current (INCOMPLETE):
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_IN" && session?.user) {
    await loadUserProfile(session.user); // ✅ Handled
  } else if (event === "SIGNED_OUT") {
    setUser(null); // ✅ Handled
  }
  // ❌ Missing: TOKEN_REFRESHED
  // ❌ Missing: USER_UPDATED
  // ❌ Missing: PASSWORD_RECOVERY
  // ❌ Missing: MFA_CHALLENGE_VERIFIED
  // ❌ Missing: Error handling for any event
});
```

### Real-World Failure Scenarios

**Scenario 1: Token Refresh Fails (Network Error)**

```
User has been active for 2 hours
→ Access token expires
→ Supabase tries to refresh using refresh token
→ Network error (WiFi drops, server timeout)
→ Current behavior: Silent failure, no user feedback
→ User sees: All API calls return 401, app appears broken
→ No retry logic, no error message
```

**Scenario 2: Refresh Token Expired**

```
User hasn't used app for 35 days
→ Refresh token expired (Supabase default: 30 days)
→ Cannot obtain new access token
→ Current behavior: User appears logged in, but all API calls fail
→ No automatic logout, no "session expired" message
```

**Scenario 3: User Updates Profile**

```
User updates profile in another tab/device
→ `USER_UPDATED` event fires
→ Current behavior: Local state not updated
→ User sees stale profile data until page refresh
```

---

## Objectives

1. ✅ Handle all Supabase auth events
2. ✅ Implement error recovery for token refresh failures
3. ✅ Add retry logic for network errors
4. ✅ Provide clear user feedback for auth failures
5. ✅ Keep local state synchronized with Supabase

---

## Technical Requirements

### 1. Complete Event Coverage

Handle all Supabase auth events:

| Event                    | Current | Required                            |
| ------------------------ | ------- | ----------------------------------- |
| `SIGNED_IN`              | ✅      | ✅ Load user profile                |
| `SIGNED_OUT`             | ✅      | ✅ Clear local state                |
| `TOKEN_REFRESHED`        | ❌      | ✅ Update local state, clear errors |
| `USER_UPDATED`           | ❌      | ✅ Reload user profile              |
| `PASSWORD_RECOVERY`      | ❌      | ✅ Handle password reset flow       |
| `MFA_CHALLENGE_VERIFIED` | ❌      | ⚠️ If MFA enabled                   |

### 2. Error Handling

Add error states to Zustand store:

```typescript
interface AuthState {
  user: Record<string, unknown> | null;
  isLoading: boolean;
  authError: string | null; // NEW
  setUser: (user: Record<string, unknown> | null) => void;
  setIsLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void; // NEW
  logout: () => void;
}
```

### 3. Retry Logic

Implement exponential backoff for token refresh failures:

```typescript
const retryTokenRefresh = async (
  attempt: number = 1,
  maxAttempts: number = 3
): Promise<boolean> => {
  if (attempt > maxAttempts) {
    return false;
  }

  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Token refresh attempt ${attempt} failed:`, error);

    // Wait before retry: 1s, 2s, 4s
    const delay = Math.pow(2, attempt - 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    return retryTokenRefresh(attempt + 1, maxAttempts);
  }
};
```

### 4. User Feedback Component

Create `src/components/auth-error-banner.tsx`:

```typescript
interface AuthErrorBannerProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function AuthErrorBanner({ error, onRetry, onDismiss }: AuthErrorBannerProps) {
  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription className="mt-2">
          {error}
          <div className="mt-3 flex gap-2">
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

---

## Implementation Steps

### Step 1: Update Zustand Store

**File**: `src/lib/store.ts`

```typescript
interface AuthState {
  user: Record<string, unknown> | null;
  isLoading: boolean;
  authError: string | null; // ADD
  setUser: (user: Record<string, unknown> | null) => void;
  setIsLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void; // ADD
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  authError: null, // ADD
  setUser: (user) => set({ user }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setAuthError: (error) => set({ authError: error }), // ADD
  logout: () => set({ user: null, authError: null }), // UPDATE
}));
```

### Step 2: Update use-auth Hook

**File**: `src/hooks/use-auth.ts`

Add complete event handling:

```typescript
useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Auth event:", event, session);

    switch (event) {
      case "SIGNED_IN":
        if (session?.user) {
          await loadUserProfile(session.user);
          setAuthError(null); // Clear any previous errors
        }
        break;

      case "SIGNED_OUT":
        setUser(null);
        setAuthError(null);
        break;

      case "TOKEN_REFRESHED":
        // Token successfully refreshed
        if (session?.user) {
          await loadUserProfile(session.user);
          setAuthError(null);
        }
        break;

      case "USER_UPDATED":
        // User profile updated (e.g., email, metadata)
        if (session?.user) {
          await loadUserProfile(session.user);
        }
        break;

      case "PASSWORD_RECOVERY":
        // User initiated password recovery
        // Could show a notification or redirect to password reset page
        console.log("Password recovery initiated");
        break;

      case "MFA_CHALLENGE_VERIFIED":
        // MFA challenge completed successfully
        if (session?.user) {
          await loadUserProfile(session.user);
        }
        break;

      default:
        console.warn("Unhandled auth event:", event);
    }
  });

  // Initialize auth state
  initializeAuth();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### Step 3: Add Error Recovery

Add retry logic for token refresh failures:

```typescript
// Add to use-auth.ts
const handleTokenRefreshError = useCallback(async () => {
  console.error("Token refresh failed, attempting retry...");

  const success = await retryTokenRefresh();

  if (!success) {
    // All retries failed, log out user
    setAuthError("Your session has expired. Please log in again.");
    await supabase.auth.signOut();
  }
}, []);

// Listen for auth errors
useEffect(() => {
  const handleAuthError = (error: any) => {
    if (error?.message?.includes("refresh")) {
      handleTokenRefreshError();
    } else {
      setAuthError(error?.message || "An authentication error occurred");
    }
  };

  // Supabase doesn't have a global error listener,
  // so we catch errors in individual auth methods
  // This is handled in signIn, signOut, etc.
}, [handleTokenRefreshError]);
```

### Step 4: Create Error Banner Component

**File**: `src/components/auth-error-banner.tsx`

(See code in Technical Requirements section above)

### Step 5: Integrate Error Banner

**File**: `src/lib/auth-provider.tsx`

```typescript
import { AuthErrorBanner } from "@/components/auth-error-banner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { authError, setAuthError } = useAuthStore();
  const { signOut } = useAuth();

  const handleRetry = async () => {
    setAuthError(null);
    // Attempt to refresh session
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      setAuthError(error.message);
    }
  };

  const handleDismiss = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <AuthErrorBanner
        error={authError}
        onRetry={handleRetry}
        onDismiss={handleDismiss}
      />
    </AuthContext.Provider>
  );
}
```

---

## Acceptance Criteria

- [ ] All 6+ auth events handled in `onAuthStateChange`
- [ ] `TOKEN_REFRESHED` updates local state
- [ ] `USER_UPDATED` reloads user profile
- [ ] `PASSWORD_RECOVERY` logged (or handled if implemented)
- [ ] `MFA_CHALLENGE_VERIFIED` handled (if MFA enabled)
- [ ] Auth error state added to Zustand store
- [ ] Retry logic for token refresh failures (3 attempts)
- [ ] Error banner component created and styled
- [ ] Error banner shows on auth failures
- [ ] User can retry failed operations
- [ ] User can dismiss error banner
- [ ] Irrecoverable errors force logout with clear message
- [ ] No unhandled promise rejections
- [ ] `npm test` passes 100%
- [ ] `npm run lint` passes with 0 errors

---

## Files to Create

- `src/components/auth-error-banner.tsx` (NEW)

---

## Files to Modify

- `src/lib/store.ts` - Add `authError` state
- `src/hooks/use-auth.ts` - Add all event handlers + retry logic
- `src/lib/auth-provider.tsx` - Integrate error banner

---

## Testing Checklist

### Unit Tests

Create `src/hooks/__tests__/use-auth-events.test.ts`:

```typescript
describe("Auth Event Handling", () => {
  test("handles SIGNED_IN event", async () => {
    /* ... */
  });
  test("handles SIGNED_OUT event", async () => {
    /* ... */
  });
  test("handles TOKEN_REFRESHED event", async () => {
    /* ... */
  });
  test("handles USER_UPDATED event", async () => {
    /* ... */
  });
  test("handles PASSWORD_RECOVERY event", async () => {
    /* ... */
  });
  test("handles token refresh failure with retry", async () => {
    /* ... */
  });
  test("logs out after max retry attempts", async () => {
    /* ... */
  });
});
```

### Manual Tests

- [ ] Login successfully → no error banner
- [ ] Logout → no error banner
- [ ] Simulate network error during token refresh → error banner shows
- [ ] Click "Retry" on error banner → attempts refresh
- [ ] Successful retry → error banner dismisses
- [ ] Failed retry (3x) → forces logout with message
- [ ] Update profile in another tab → current tab updates
- [ ] Token refresh succeeds automatically → no visible change

### Simulating Errors

To test token refresh failures:

```javascript
// In browser console:
// Intercept network requests to Supabase auth endpoint
// Or manually expire access token in Supabase dashboard
```

---

## Error Message Guidelines

Use clear, actionable error messages:

| Scenario                       | Message                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| Token refresh failed (network) | "Connection lost. Retrying..."                                       |
| Token refresh failed (expired) | "Your session has expired. Please log in again."                     |
| Invalid credentials            | "Invalid email or password. Please try again."                       |
| Unknown error                  | "An unexpected error occurred. Please try again or contact support." |

---

## Performance Considerations

- Event handler should be fast (< 100ms)
- Profile reload should be debounced if rapid USER_UPDATED events
- Retry logic should not block UI
- Error banner should auto-dismiss after successful retry

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All event handlers implemented
- [ ] Retry logic tested and working
- [ ] Error banner component created
- [ ] User feedback implemented
- [ ] All tests passing
- [ ] Linting passing
- [ ] Git commit with descriptive message
- [ ] `STATUS.md` updated to "Completed"

---

**Next Story**: US-004 - Session Validation on Tab Focus
