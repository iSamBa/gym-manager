# Authentication & Session Management Overhaul

## Project Overview

This feature overhauls the authentication and session management system to fix critical security vulnerabilities and architectural issues identified in the current implementation.

## Problem Statement

The current authentication system has **dual-layer session management** that creates conflicts:

1. **Supabase Auth** (automatic JWT-based, auto-refreshes every ~55min)
2. **Custom Client-Side Tracking** (manual 30min inactivity timeout)

### Critical Issues Identified

1. **Conflicting Session Lifetimes**
   - Supabase auto-refreshes tokens while custom tracker enforces 30min timeout
   - User can be "logged out" client-side while Supabase session is still valid
   - Or vice versa: custom tracker thinks user is active, but Supabase token expired

2. **No Server-Side Session Validation** 🔴 SECURITY RISK
   - All authentication checks happen client-side only
   - No Next.js middleware for route protection
   - Anyone can manipulate localStorage to appear "logged in"
   - Direct API access bypasses authentication entirely

3. **Race Conditions in Auth State**
   - User profile loads twice on mount (init + SIGNED_IN event)
   - `isLoading` becomes false before auth listener is ready
   - No error recovery if profile load fails

4. **Zustand + localStorage Persistence Issues**
   - Stale user data persisted without expiry validation
   - Hydration mismatch between persisted state and actual Supabase session
   - Multi-tab synchronization conflicts

5. **Token Refresh Failures Not Handled**
   - Missing error handling for `TOKEN_REFRESHED` event
   - No user feedback when refresh fails
   - App breaks silently (401 errors on all API calls)

6. **Session Timeout Logic Flaws**
   - Uses client-side `Date.now()` (can be manipulated)
   - No server validation of session timestamps
   - Zombie sessions when laptop closes (no focus event)

7. **"Remember Me" Implementation Issues**
   - Stored in plain localStorage (XSS vulnerability)
   - Not synchronized with Supabase session config
   - Inconsistent behavior between custom tracker and Supabase

8. **Incomplete Auth Event Coverage**
   - Only handles `SIGNED_IN` and `SIGNED_OUT`
   - Missing: `TOKEN_REFRESHED`, `USER_UPDATED`, `PASSWORD_RECOVERY`, `MFA_CHALLENGE_VERIFIED`

## Objectives

### Security Goals

- ✅ Implement server-side session validation
- ✅ Add Next.js middleware for route protection
- ✅ Secure session storage (encrypted or httpOnly cookies)
- ✅ Prevent client-side session manipulation

### Reliability Goals

- ✅ Single source of truth for session state (Supabase)
- ✅ Handle all auth events and error cases
- ✅ Graceful token refresh failure recovery
- ✅ Proper race condition handling

### User Experience Goals

- ✅ Clear error messages for auth failures
- ✅ Seamless session refresh (no interruptions)
- ✅ Consistent multi-tab behavior
- ✅ Proper "remember me" functionality

## Architecture Changes

### Before (Current)

```
Client: Supabase Session ──┐
                           ├──❌ CONFLICT
Client: Custom Tracker ────┘

No server-side validation ❌
```

### After (Target)

```
Server: Next.js Middleware ✅ (route protection)
    ↓
Client: Supabase Session (SINGLE source of truth) ✅
    ↓
Client: React State (synced with Supabase) ✅
```

## Success Criteria

- [ ] All auth events handled with error recovery
- [ ] Server-side middleware protects all authenticated routes
- [ ] Session state synchronized across tabs
- [ ] Token refresh failures show user-friendly errors
- [ ] "Remember me" properly extends Supabase session
- [ ] Zero localStorage auth data (or encrypted)
- [ ] All existing tests pass + new tests for auth flows
- [ ] No more dual-session conflicts

## User Stories

This project is broken down into 6 user stories:

- **US-001**: Unified Session Management (eliminate dual-system conflict)
- **US-002**: Server-Side Auth Middleware (Next.js route protection)
- **US-003**: Complete Auth Event Handling (all events + error recovery)
- **US-004**: Session Validation on Tab Focus (verify active sessions)
- **US-005**: Secure State Persistence (fix localStorage issues)
- **US-006**: Testing, Error UX, and Documentation

## Implementation Notes

### Supabase Session Behavior (Research Findings)

From Supabase documentation:

- Access tokens: 1 hour default (configurable 5min - 1hr)
- Refresh tokens: Never expire, but can only be used **once**
- Auto-refresh: Client libraries proactively refresh before expiration
- Refresh token reuse: Allowed within 10-second window (network tolerance)

### Recommended Approach

1. **Remove custom inactivity tracker** - Let Supabase handle session lifetime
2. **OR**: Sync custom tracker with Supabase by calling `supabase.auth.signOut()` on inactivity
3. **Add server middleware** - Verify session on every protected route
4. **Use httpOnly cookies** - More secure than localStorage for session tokens
5. **Handle all auth events** - Especially `TOKEN_REFRESHED` and errors

## Getting Started

**READ THIS FIRST**: Before implementing any user story:

1. Read `AGENT-GUIDE.md` for detailed implementation steps
2. Check `STATUS.md` for current progress
3. Implement user stories in order (they have dependencies)
4. Update `STATUS.md` after completing each milestone
5. Run tests and linting between user stories

## References

- [Supabase Auth Sessions Docs](https://supabase.com/docs/guides/auth/sessions)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- Current implementation files:
  - `src/lib/supabase.ts` - Supabase client
  - `src/hooks/use-auth.ts` - Auth hook
  - `src/hooks/use-session-manager.ts` - Custom session manager
  - `src/lib/store.ts` - Zustand store with localStorage persistence
  - `src/components/session-guard.tsx` - Session guard component

---

**Next Step**: Read `AGENT-GUIDE.md` to begin implementation.
