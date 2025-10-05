# US-004: Session Validation on Tab Focus

**Status**: ✅ Completed
**Priority**: P1 (High)
**Effort**: Small
**Dependencies**: US-003 (Complete Auth Event Handling)
**Completed**: 2025-10-04
**Implementation Notes**: Created `useSessionValidator` hook with throttled validation (30s window). Old `use-session-security.ts` did not exist. All tests passing (9/9 new tests, 847/847 total). Linting clean.

---

## User Story

**As a** user
**I want** my session to be validated when I return to the app tab
**So that** I'm automatically logged out if my session expired while I was away

---

## Problem Statement

### Current Issue: Zombie Sessions

**Scenario**:

```
1. User logs in at 9:00 AM
2. User switches to another tab/app for 3 hours
3. User returns to app tab at 12:00 PM
4. Supabase session expired while user was away
5. Current behavior: User appears logged in, but all API calls fail
6. User sees broken UI, doesn't know why
```

### Why This Happens

- Supabase refresh tokens expire after ~30 days (default)
- Access tokens expire after 1 hour
- If user is inactive (tab not visible), tokens don't auto-refresh
- When user returns, local state shows "logged in" but Supabase session is expired

---

## Objectives

1. ✅ Validate Supabase session when tab becomes visible
2. ✅ Auto-logout if session expired
3. ✅ Maintain session if still valid
4. ✅ Throttle validation to prevent excessive API calls
5. ✅ Replace existing `use-session-security.ts` with simpler approach

---

## Technical Requirements

### 1. Create Session Validator Hook

**File**: `src/hooks/use-session-validator.ts`

```typescript
import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./use-auth";

const VALIDATION_THROTTLE_MS = 30000; // Max once per 30 seconds

export function useSessionValidator() {
  const { isAuthenticated, signOut } = useAuth();
  const lastValidationRef = useRef<number>(0);

  const validateSession = useCallback(async () => {
    // Only validate if authenticated
    if (!isAuthenticated) return;

    // Throttle: don't validate more than once per 30 seconds
    const now = Date.now();
    if (now - lastValidationRef.current < VALIDATION_THROTTLE_MS) {
      console.log("Session validation throttled");
      return;
    }

    lastValidationRef.current = now;

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Session validation error:", error);
        await signOut();
        return;
      }

      if (!session) {
        console.log("Session expired, logging out");
        await signOut();
        return;
      }

      console.log("Session validated successfully");
      // Session is valid, no action needed
      // Supabase will auto-refresh if needed
    } catch (error) {
      console.error("Unexpected error validating session:", error);
      // Don't logout on network errors, user might just be offline
    }
  }, [isAuthenticated, signOut]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab became visible, validating session");
        validateSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [validateSession, isAuthenticated]);

  return {
    validateSession,
  };
}
```

### 2. Integrate into AuthProvider

**File**: `src/lib/auth-provider.tsx`

```typescript
import { useSessionValidator } from '@/hooks/use-session-validator';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  // Enable session validation on tab focus
  useSessionValidator();

  const contextValue: AuthContextType = {
    // ... existing code
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 3. Remove Old Session Security Hook

**Delete**: `src/hooks/use-session-security.ts`

The old approach had issues:

- Tried to do too much (multi-tab sync, tab close detection)
- Complex logic prone to bugs
- Used localStorage timestamps (client-side, manipulable)

New approach:

- Single responsibility: validate session on tab focus
- Relies on Supabase as source of truth
- Simpler, more reliable

---

## Acceptance Criteria

- [ ] `use-session-validator.ts` created
- [ ] `visibilitychange` event listener added
- [ ] Session validated when tab becomes visible
- [ ] Validation throttled (max once per 30 seconds)
- [ ] Expired sessions trigger automatic logout
- [ ] Valid sessions remain active without interruption
- [ ] `use-session-security.ts` deleted
- [ ] AuthProvider integrates `useSessionValidator()`
- [ ] No console errors
- [ ] No unnecessary API calls (throttling works)
- [ ] `npm test` passes 100%
- [ ] `npm run lint` passes with 0 errors

---

## Files to Create

- `src/hooks/use-session-validator.ts` (NEW)

---

## Files to Delete

- `src/hooks/use-session-security.ts` (REMOVE - replaced by simpler approach)

---

## Files to Modify

- `src/lib/auth-provider.tsx` - Integrate `useSessionValidator()`

---

## Implementation Steps

### Step 1: Create Session Validator Hook

1. Create `src/hooks/use-session-validator.ts`
2. Implement `validateSession()` function
3. Add throttling logic
4. Add `visibilitychange` listener

### Step 2: Integrate into AuthProvider

1. Import `useSessionValidator` in `auth-provider.tsx`
2. Call hook in `AuthProvider` component
3. Test integration

### Step 3: Remove Old Hook

1. Delete `src/hooks/use-session-security.ts`
2. Remove any imports of old hook
3. Verify no broken references

### Step 4: Test Thoroughly

- Run automated tests
- Perform manual tests (see checklist below)

---

## Testing Checklist

### Unit Tests

Create `src/hooks/__tests__/use-session-validator.test.ts`:

```typescript
describe("useSessionValidator", () => {
  test("validates session on tab visibility change", async () => {
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
  test("does not validate when unauthenticated", async () => {
    /* ... */
  });
});
```

### Manual Tests

#### Test 1: Session Still Valid

- [ ] Login to app
- [ ] Switch to another tab for 10 seconds
- [ ] Return to app tab
- [ ] Session validated in console
- [ ] User remains logged in
- [ ] No errors

#### Test 2: Session Expired (Simulated)

- [ ] Login to app
- [ ] Open browser DevTools → Application → Storage
- [ ] Delete Supabase auth cookies/localStorage
- [ ] Switch to another tab briefly
- [ ] Return to app tab
- [ ] User automatically logged out

- [ ] Redirected to login page

#### Test 3: Throttling

- [ ] Login to app
- [ ] Rapidly switch tabs back and forth 10 times
- [ ] Check console logs
- [ ] Validation should occur max once per 30 seconds
- [ ] No excessive API calls

#### Test 4: Network Error

- [ ] Login to app
- [ ] Open DevTools → Network → Throttle to "Offline"
- [ ] Switch tabs and return
- [ ] Validation fails gracefully (logged, not logged out)

- [ ] User remains logged in
- [ ] Re-enable network, next validation works

#### Test 5: Long Inactivity

- [ ] Login to app
- [ ] Close laptop lid for 2+ hours (or simulate)
- [ ] Open laptop, return to app tab
- [ ] If session expired → auto logout
- [ ] If session valid (auto-refreshed) → stay logged in

---

## Edge Cases to Handle

### 1. User Never Leaves Tab

- Validation only happens on visibility change
- Supabase auto-refresh still works
- ✅ No issue

### 2. User Leaves Tab Open for Days

- Refresh token expires eventually
- Next time tab becomes visible → validation fails

- ✅ User logged out

### 3. Multiple Tabs Open

- Each tab validates independently

- If one tab's session expires, user logged out
- Other tabs will also detect expired session on next focus
- ✅ Consistent behavior

### 4. Tab Visible but Browser in Background

- `visibilityState` is "visible" even if browser minimized
- Validation might fire unnecessarily
- ⚠️ Acceptable tradeoff (throttling prevents spam)

---

## Performance Considerations

### Throttling Strategy

- **30-second minimum** between validation calls
- Prevents rapid API calls from tab switching
- Balances freshness with performance

### Why Not Check on Every Request?

- Middleware already validates on route changes
- Tab focus validation catches "wake up from sleep" scenarios
- Redundant checks slow down app

### Memory Usage

- Uses `useRef` for throttling (no re-renders)
- Single event listener (lightweight)
- ✅ Minimal performance impact

---

## Security Considerations

### ✅ Improvements

1. **Expired sessions caught early** - Before user tries to use app
2. **Server-side validation** - Via `supabase.auth.getSession()`
3. **Graceful degradation** - Network errors don't break auth

### ⚠️ Limitations

1. **Validation only on tab focus** - Not continuous monitoring
2. **Throttling window** - Up to 30 seconds of stale validation
3. **Client-initiated** - Server doesn't push logout events

These are acceptable tradeoffs for performance and user experience.

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All implementation steps completed
- [ ] Session validator hook created
- [ ] Old session security hook deleted
- [ ] AuthProvider integration complete
- [ ] All tests passing (automated + manual)
- [ ] Linting passing
- [ ] No TypeScript errors
- [ ] Git commit with descriptive message
- [ ] `STATUS.md` updated to "Completed"

---

**Next Story**: US-005 - Secure State Persistence
