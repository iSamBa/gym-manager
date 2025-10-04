# US-001: Unified Session Management

**Status**: 📝 Not Started
**Priority**: P0 (Critical)
**Effort**: Medium
**Dependencies**: None

---

## User Story

**As a** developer
**I want** a single, unified session management system
**So that** there are no conflicts between Supabase auth and custom session tracking

---

## Problem Statement

Currently, the app has TWO independent session management systems:

1. **Supabase Auth**:
   - JWT-based sessions
   - Auto-refreshes tokens every ~55 minutes
   - Persists sessions in localStorage
   - Default session lifetime: until refresh token expires (~30 days)

2. **Custom Inactivity Tracker**:
   - Tracks user activity (mouse, keyboard events)
   - 30-minute inactivity timeout
   - 7-day timeout with "remember me"
   - Separate state management

### The Conflict

These systems operate independently and can contradict each other:

**Scenario 1: Custom tracker logs out, Supabase session still valid**

```
User inactive for 35 minutes
→ Custom tracker: ❌ Logs out user
→ Supabase: ✅ Session still valid, tokens auto-refreshing
→ Result: User logged out client-side, but API calls still work
→ Inconsistent state!
```

**Scenario 2: Supabase session expires, custom tracker thinks user is active**

```
User actively clicking (no inactivity)
→ Supabase refresh token expires after 30 days
→ Custom tracker: ✅ User is active
→ Supabase: ❌ Session expired
→ Result: All API calls fail with 401, but UI shows "logged in"
→ Broken user experience!
```

---

## Objectives

1. ✅ Establish Supabase Auth as the **single source of truth** for session state
2. ✅ Remove or properly synchronize custom inactivity tracking
3. ✅ Eliminate dual-state conflicts
4. ✅ Maintain (or improve) user experience

---

## Technical Requirements

### Decision Point: Choose ONE Approach

#### Option A: Remove Custom Inactivity Tracking (RECOMMENDED)

**Pros**:

- Simpler architecture
- More reliable (fewer moving parts)
- Follows Supabase best practices
- Less maintenance burden

**Cons**:

- Lose custom 30-minute inactivity timeout feature
- Users remain logged in until Supabase session expires

**Implementation**:

1. Delete these files:
   - `src/hooks/use-session-manager.ts`
   - `src/hooks/use-activity-tracker.ts`
   - `src/components/session-guard.tsx`
   - `src/components/session-timeout-warning.tsx`
   - `src/lib/session-config.ts`

2. Update `src/lib/auth-provider.tsx`:
   - Remove `SessionGuard` wrapper
   - Remove `rememberMe` state
   - Simplify to only wrap children with AuthContext

3. Update `src/hooks/use-auth.ts`:
   - Remove dependency on session manager
   - Rely solely on Supabase auth state

4. Clean up localStorage:
   - Remove `last-activity` tracking
   - Remove session timeout UI

#### Option B: Synchronize Custom Tracker with Supabase

**Pros**:

- Keeps 30-minute inactivity timeout feature
- More granular session control

**Cons**:

- More complex implementation
- Potential for bugs/conflicts
- Requires careful synchronization

**Implementation**:

1. Modify `src/hooks/use-session-manager.ts`:

   ```typescript
   const handleInactivity = useCallback(async () => {
     // CRITICAL: Call Supabase signOut, not just local state
     await supabase.auth.signOut();
     // Local state will be updated via onAuthStateChange listener
   }, []);
   ```

2. Ensure `use-auth.ts` listens to Supabase state only:
   - Never set auth state directly
   - Always trigger via Supabase auth methods
   - Let `onAuthStateChange` update local state

3. Add synchronization tests:
   - Verify inactivity logout calls `supabase.auth.signOut()`
   - Verify Supabase logout triggers local state update
   - Test race conditions

---

## Acceptance Criteria

### For Option A (Remove Custom Tracker)

- [ ] All custom session manager files deleted
- [ ] `AuthProvider` simplified (no SessionGuard)
- [ ] Login flow works identically
- [ ] Logout flow works identically
- [ ] No console errors related to missing components
- [ ] `npm test` passes 100%
- [ ] `npm run lint` passes with 0 errors
- [ ] Session persists across page refresh
- [ ] Manual test: Login → refresh page → still logged in
- [ ] Manual test: Logout → refresh page → still logged out

### For Option B (Sync Tracker)

- [ ] `handleInactivity` calls `supabase.auth.signOut()`
- [ ] No direct state updates (only via Supabase)
- [ ] Inactivity timeout triggers proper logout
- [ ] Supabase session and local state always in sync
- [ ] Multi-tab: logout in one tab logs out all tabs
- [ ] `npm test` passes 100% (including new sync tests)
- [ ] `npm run lint` passes with 0 errors
- [ ] Manual test: Inactive for 30min → logged out
- [ ] Manual test: Active use → session stays alive

---

## Files to Modify

### Option A (Remove Custom Tracker)

**Files to Delete**:

- `src/hooks/use-session-manager.ts`
- `src/hooks/use-activity-tracker.ts`
- `src/hooks/use-session-security.ts`
- `src/components/session-guard.tsx`
- `src/components/session-timeout-warning.tsx`
- `src/lib/session-config.ts`

**Files to Modify**:

- `src/lib/auth-provider.tsx` - Remove SessionGuard
- `src/hooks/use-auth.ts` - Clean up any session manager dependencies
- `src/components/login-form.tsx` - Remove "remember me" localStorage (if not used)

### Option B (Sync Tracker)

**Files to Modify**:

- `src/hooks/use-session-manager.ts` - Add `supabase.auth.signOut()` call
- `src/hooks/use-auth.ts` - Ensure no direct state updates
- `src/hooks/__tests__/use-session-manager.test.ts` - Add sync tests

---

## Implementation Steps

### Step 1: Choose Approach

- Review both options
- Consult with team (if applicable)
- Make decision and document in `STATUS.md`

### Step 2: Implement Changes

- Follow chosen option's implementation steps
- Make incremental commits (don't batch everything)

### Step 3: Test Thoroughly

- Run all automated tests
- Perform manual testing
- Check for console errors

### Step 4: Clean Up

- Remove unused imports
- Remove dead code
- Update any related documentation

### Step 5: Verify

- [ ] All tests passing
- [ ] Linting passing
- [ ] Manual testing checklist complete
- [ ] No TypeScript errors

---

## Testing Checklist

### Unit Tests

- [ ] Login flow test passes
- [ ] Logout flow test passes
- [ ] Session persistence test passes
- [ ] Multi-tab sync test passes (if Option B)
- [ ] Inactivity timeout test passes (if Option B)

### Manual Tests

- [ ] User can log in successfully
- [ ] User can log out successfully
- [ ] Session persists after page refresh
- [ ] Session cleared after logout
- [ ] No console errors during auth flows
- [ ] Multi-tab: login in tab 1 → tab 2 updates
- [ ] Multi-tab: logout in tab 1 → tab 2 logs out

---

## Rollback Plan

If issues arise after implementing Option A or B:

1. Revert commits: `git revert <commit-hash>`
2. Return to previous dual-session approach
3. Document issue in `STATUS.md`
4. Consult with team for alternative approach

---

## Notes for Implementation

### Key Principles

1. **Supabase is the source of truth** - Never set auth state without going through Supabase
2. **Let `onAuthStateChange` update state** - Don't manually update auth state
3. **No localStorage for session state** - Supabase manages its own persistence

### Common Pitfalls

- ❌ Setting `setUser(null)` directly → Use `supabase.auth.signOut()`
- ❌ Checking localStorage for auth state → Check Supabase session
- ❌ Mixing custom state with Supabase state → Pick one source of truth

---

## Definition of Done

- [ ] Decision documented (Option A or B)
- [ ] All implementation steps completed
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Linting passing
- [ ] Manual testing complete
- [ ] Git commit with descriptive message
- [ ] `STATUS.md` updated to "Completed"
- [ ] Ready for code review (if applicable)

---

**Next Story**: US-002 - Server-Side Auth Middleware (depends on this story)
