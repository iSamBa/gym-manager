# Agent Implementation Guide

## Purpose

This guide provides systematic, step-by-step instructions for implementing the authentication and session management overhaul. Follow this guide to ensure proper implementation order, avoid breaking changes, and maintain code quality.

## Prerequisites

Before starting any user story:

1. ✅ Read `START-HERE.md` to understand the problem and objectives
2. ✅ Review current implementation in these files:
   - `src/lib/supabase.ts`
   - `src/hooks/use-auth.ts`
   - `src/hooks/use-session-manager.ts`
   - `src/lib/store.ts`
   - `src/components/session-guard.tsx`
3. ✅ Ensure you're on the `feature/auth-session-overhaul` branch
4. ✅ All existing tests pass: `npm test`

## Implementation Order

**CRITICAL**: User stories MUST be implemented in this order due to dependencies:

```
US-001 (Unified Session)
    ↓
US-002 (Server Middleware) ← Requires US-001
    ↓
US-003 (Auth Events) ← Requires US-001
    ↓
US-004 (Tab Focus Validation) ← Requires US-003
    ↓
US-005 (Secure Persistence) ← Requires US-001, US-002
    ↓
US-006 (Testing & Docs) ← Requires ALL above
```

## User Story Implementation Workflow

For each user story:

### Step 1: Read User Story File

- Open `US-XXX-[name].md`
- Review acceptance criteria
- Understand technical requirements

### Step 2: Update Status

- Update `STATUS.md` to mark story as "In Progress"
- Note start time

### Step 3: Implement Changes

- Follow technical requirements exactly
- Make incremental commits (don't batch all changes)
- Update tests as you go

### Step 4: Validate

- Run `npm run lint` (must pass)
- Run `npm test` (must pass)
- Manual testing if required

### Step 5: Mark Complete

- Update `STATUS.md` to "Completed"
- List any deviations or notes
- Commit changes with descriptive message

### Step 6: Continue to Next Story

- Do NOT skip stories or work out of order
- If blocked, document blocker in `STATUS.md`

---

## User Story Guides

### US-001: Unified Session Management

**Goal**: Remove dual-session conflict by making Supabase the single source of truth.

**Key Decision Point**: Choose ONE approach:

#### Option A: Remove Custom Inactivity Tracking (RECOMMENDED)

- Delete `use-session-manager.ts`, `use-activity-tracker.ts`, `session-guard.tsx`
- Remove session timeout UI components
- Let Supabase handle session lifetime entirely
- **Pros**: Simpler, more reliable, follows Supabase best practices
- **Cons**: Lose custom inactivity timeout feature

#### Option B: Sync Custom Tracker with Supabase

- Keep custom inactivity tracking
- On inactivity timeout → call `supabase.auth.signOut()`
- Ensure Supabase session state is always synchronized
- **Pros**: Keeps inactivity timeout feature
- **Cons**: More complex, potential for bugs

**Implementation Steps**:

1. Research: Check Supabase docs for session timeout configuration
2. Decide on Option A or B (recommend A for simplicity)
3. If Option A:
   - Remove imports of session manager components
   - Update `AuthProvider` to remove `SessionGuard`
   - Delete unused files after ensuring no dependencies
4. If Option B:
   - Modify `use-session-manager.ts` to call `supabase.auth.signOut()` on timeout
   - Add tests for synchronization
5. Update `use-auth.ts` to be the ONLY auth state manager
6. Remove localStorage `last-activity` tracking
7. Test login/logout flows work correctly

**Files to Modify**:

- `src/hooks/use-auth.ts`
- `src/lib/auth-provider.tsx`
- Delete (if Option A): `src/hooks/use-session-manager.ts`, `src/hooks/use-activity-tracker.ts`, `src/components/session-guard.tsx`, `src/components/session-timeout-warning.tsx`

**Acceptance Criteria**:

- [ ] Only ONE session management system (Supabase)
- [ ] No localStorage `last-activity` tracking
- [ ] Login/logout flows work as before
- [ ] No console errors

---

### US-002: Server-Side Auth Middleware

**Goal**: Add Next.js middleware for server-side route protection.

**Research Required**:

- Next.js 15 middleware with App Router
- Supabase SSR Auth (createServerClient)

**Implementation Steps**:

1. Install required dependencies (if needed):
   ```bash
   npm install @supabase/ssr
   ```
2. Create `src/middleware.ts`:
   - Import `createServerClient` from `@supabase/ssr`
   - Check session on every request
   - Redirect to `/login` if unauthenticated on protected routes
   - Define protected route patterns
3. Create `src/lib/supabase-server.ts`:
   - Server-side Supabase client creation utility
   - Use for API routes and server components
4. Update `src/lib/supabase.ts`:
   - Keep as client-only
   - Add comment explaining when to use server vs client
5. Test:
   - Try accessing protected routes while logged out
   - Verify redirect to `/login`
   - Verify logged-in users can access protected routes

**Files to Create**:

- `src/middleware.ts` (NEW)
- `src/lib/supabase-server.ts` (NEW)

**Files to Modify**:

- `src/lib/supabase.ts` (add comments)

**Acceptance Criteria**:

- [ ] Middleware protects all routes except `/login` and `/`
- [ ] Unauthenticated users redirected to `/login`
- [ ] Authenticated users can access protected routes
- [ ] No console errors or infinite redirects

---

### US-003: Complete Auth Event Handling

**Goal**: Handle all Supabase auth events with proper error recovery.

**Implementation Steps**:

1. Review Supabase auth events:
   - `SIGNED_IN`
   - `SIGNED_OUT`
   - `TOKEN_REFRESHED` ⚠️ Critical missing event
   - `USER_UPDATED`
   - `PASSWORD_RECOVERY`
   - `MFA_CHALLENGE_VERIFIED`
2. Update `use-auth.ts`:
   - Add handlers for all events
   - Add error handling for token refresh failures
   - Add retry logic for network errors
3. Create error state in `useAuthStore`:
   - `authError: string | null`
   - `setAuthError(error: string | null)`
4. Add error UI component:
   - Display auth errors to user
   - "Retry" button for recoverable errors
   - "Logout" button for irrecoverable errors
5. Test scenarios:
   - Successful token refresh
   - Failed token refresh (simulate network error)
   - User updates profile
   - Sign out from another tab

**Files to Modify**:

- `src/hooks/use-auth.ts`
- `src/lib/store.ts`

**Files to Create**:

- `src/components/auth-error-banner.tsx` (NEW)

**Acceptance Criteria**:

- [ ] All 6+ auth events handled
- [ ] Token refresh failures show user-friendly error
- [ ] Network errors trigger retry logic
- [ ] No unhandled promise rejections
- [ ] Error banner appears when auth fails

---

### US-004: Session Validation on Tab Focus

**Goal**: Verify Supabase session is still valid when user returns to tab.

**Implementation Steps**:

1. Remove existing `use-session-security.ts` (conflicts with new approach)
2. Create `use-session-validator.ts`:
   - Listen to `visibilitychange` event
   - When tab visible, call `supabase.auth.getSession()`
   - If session expired → call `supabase.auth.signOut()`
   - If session valid → update local state
3. Add to `AuthProvider`:
   - Use `useSessionValidator()` hook
4. Test:
   - Open app, sign in
   - Wait 2+ hours (or manually expire token in Supabase dashboard)
   - Switch to another tab and back
   - Verify auto-logout if expired

**Files to Create**:

- `src/hooks/use-session-validator.ts` (NEW)

**Files to Delete**:

- `src/hooks/use-session-security.ts` (replaced)

**Files to Modify**:

- `src/lib/auth-provider.tsx`

**Acceptance Criteria**:

- [ ] Session validated when tab gains focus
- [ ] Expired sessions trigger logout
- [ ] Valid sessions remain active
- [ ] No unnecessary API calls (validate max once per 30 seconds)

---

### US-005: Secure State Persistence

**Goal**: Fix localStorage security issues and stale data problems.

**Options**:

#### Option A: Remove localStorage Persistence (RECOMMENDED)

- Remove Zustand `persist` middleware
- Session state stored in memory only
- Rely on Supabase's built-in session persistence
- **Pros**: More secure, no stale data issues
- **Cons**: User state lost on page refresh (but Supabase re-authenticates)

#### Option B: Encrypted localStorage

- Encrypt user data before storing
- Add expiry timestamps
- Validate on hydration
- **Pros**: Faster page loads
- **Cons**: More complex, potential security risks

#### Option C: httpOnly Cookies (BEST but more complex)

- Store session tokens in httpOnly cookies (immune to XSS)
- Requires server-side session management
- Use `@supabase/ssr` cookie handlers
- **Pros**: Most secure
- **Cons**: Requires significant refactoring

**Recommended Approach**: Start with Option A, evaluate if Option C is needed.

**Implementation Steps (Option A)**:

1. Update `src/lib/store.ts`:
   - Remove `persist` middleware from `useAuthStore`
   - Keep state in memory only
2. Update `use-auth.ts`:
   - On mount, call `supabase.auth.getSession()` to restore session
   - Supabase handles session persistence via its own localStorage
3. Remove "remember me" feature (or implement via Supabase config):
   - Delete localStorage `remember-me` storage
   - Research Supabase session duration configuration
4. Test:
   - Login, refresh page → should remain logged in
   - Logout, refresh page → should remain logged out
   - Close browser, reopen → session restored if valid

**Files to Modify**:

- `src/lib/store.ts`
- `src/hooks/use-auth.ts`
- `src/components/login-form.tsx`

**Acceptance Criteria**:

- [ ] No sensitive auth data in plain localStorage
- [ ] Session persists across page refreshes
- [ ] Expired sessions properly cleared
- [ ] Login flow works identically to before

---

### US-006: Testing, Error UX, and Documentation

**Goal**: Comprehensive testing, improved error messages, and documentation.

**Implementation Steps**:

#### 6.1 Unit Tests

1. Create `src/hooks/__tests__/use-auth.test.ts`:
   - Test all auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
   - Test error handling (failed refresh, network errors)
   - Test race conditions (rapid sign in/out)
2. Create `src/middleware.test.ts`:
   - Test route protection
   - Test redirects
   - Test authenticated access
3. Update existing tests:
   - Fix any broken tests due to auth changes
   - Add tests for edge cases

#### 6.2 Integration Tests

1. Create `src/features/auth/__tests__/auth-flow.test.tsx`:
   - Full login flow
   - Logout flow
   - Token refresh flow
   - Session expiry flow
   - Multi-tab synchronization

#### 6.3 Error UX Improvements

1. Update `src/components/auth-error-banner.tsx`:
   - Specific error messages for common failures
   - "Session expired" → prompt re-login
   - "Network error" → retry button
   - "Invalid credentials" → clear message
2. Add error boundaries:
   - Catch auth errors in React tree
   - Fallback UI for auth failures

#### 6.4 Documentation

1. Update `CLAUDE.md`:
   - Document new auth architecture
   - Add troubleshooting section
2. Create `docs/AUTH.md`:
   - Explain session management approach
   - Document auth hooks usage
   - Server vs client Supabase client guide
3. Update component docs:
   - Add JSDoc comments to auth hooks
   - Document AuthProvider props

#### 6.5 Manual Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout
- [ ] Page refresh while logged in
- [ ] Page refresh while logged out
- [ ] Session expiry (wait 1+ hour or manually expire)
- [ ] Multi-tab: login in tab 1, verify tab 2 updates
- [ ] Multi-tab: logout in tab 1, verify tab 2 logs out
- [ ] Network error during login (throttle network)
- [ ] Network error during token refresh
- [ ] Protected route access while logged out
- [ ] Protected route access while logged in

**Files to Create**:

- `src/hooks/__tests__/use-auth.test.ts` (NEW)
- `src/middleware.test.ts` (NEW)
- `src/features/auth/__tests__/auth-flow.test.tsx` (NEW)
- `docs/AUTH.md` (NEW)

**Files to Modify**:

- `CLAUDE.md`
- `src/components/auth-error-banner.tsx`
- All auth-related files (add JSDoc)

**Acceptance Criteria**:

- [ ] 90%+ test coverage for auth code
- [ ] All manual tests pass
- [ ] Clear error messages for all failure scenarios
- [ ] Documentation complete and accurate
- [ ] No TypeScript errors
- [ ] No ESLint warnings

---

## Quality Checklist (Run After EACH User Story)

Before marking a user story complete:

- [ ] `npm run lint` passes with 0 errors, 0 warnings
- [ ] `npm test` passes 100%
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] Manual testing completed (if applicable)
- [ ] Git commit with descriptive message
- [ ] `STATUS.md` updated

## Common Pitfalls to Avoid

1. **Don't skip user stories** - They build on each other
2. **Don't batch all changes** - Make incremental commits
3. **Don't ignore failing tests** - Fix them immediately
4. **Don't forget to update STATUS.md** - Keep progress tracked
5. **Don't use `any` types** - Define proper TypeScript interfaces
6. **Don't leave console.log statements** - Remove debug code
7. **Don't break existing features** - Maintain backward compatibility where possible

## Getting Help

If blocked on a user story:

1. Document the blocker in `STATUS.md`
2. Review Supabase documentation: https://supabase.com/docs/guides/auth
3. Review Next.js middleware docs: https://nextjs.org/docs/app/building-your-application/routing/middleware
4. Check existing similar implementations in the codebase
5. Ask the user for clarification

## Success Definition

The overhaul is complete when:

- ✅ All 6 user stories marked "Completed" in `STATUS.md`
- ✅ All tests passing
- ✅ All quality checks passing
- ✅ Documentation updated
- ✅ No security vulnerabilities
- ✅ User experience matches or exceeds current implementation

---

**Next Step**: Open `STATUS.md` to track progress, then start with `US-001-unified-session-management.md`.
