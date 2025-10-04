# US-005: Secure State Persistence

**Status**: 📝 Not Started
**Priority**: P0 (Critical - Security)
**Effort**: Small to Medium (depending on chosen approach)
**Dependencies**: US-001 (Unified Session), US-002 (Server Middleware)

---

## User Story

**As a** security-conscious developer
**I want** secure session state persistence
**So that** user sessions cannot be compromised via localStorage manipulation or XSS attacks

---

## Problem Statement

### Current Security Issues

**File**: `src/lib/store.ts` (lines 13-28)

```typescript
export const useAuthStore = create<AuthState>()(
  persist((set) => ({ user: null /* ... */ }), {
    name: "auth-storage",
    storage: createJSONStorage(() => localStorage), // ⚠️ INSECURE
    partialize: (state) => ({ user: state.user }), // ⚠️ Persists without validation
  })
);
```

### Vulnerabilities

1. **Plain localStorage Storage** 🔴
   - Accessible to any JavaScript (including XSS attacks)
   - No encryption
   - User object stored in plaintext
   - Can be manipulated via browser DevTools

2. **No Expiry Validation** 🔴
   - User data persisted indefinitely
   - No check if Supabase session still valid
   - Stale data can show user as "logged in" when session expired

3. **Hydration Mismatches** 🟡
   - Persisted state loads before Supabase session check
   - Brief flash of "logged in" UI before logout
   - Race condition between Zustand hydration and auth validation

4. **"Remember Me" Implementation** 🟡
   - Stored in plain localStorage: `localStorage.setItem("remember-me", "true")`
   - Not synchronized with Supabase session lifetime
   - No actual effect on session duration (Supabase doesn't know about it)

---

## Objectives

1. ✅ Remove or encrypt sensitive data from localStorage
2. ✅ Prevent stale auth state from being loaded
3. ✅ Eliminate hydration mismatches
4. ✅ Properly implement "remember me" (or remove it)
5. ✅ Maintain good user experience (sessions persist across page refresh)

---

## Technical Requirements

### Decision Point: Choose ONE Approach

#### Option A: Remove localStorage Persistence (RECOMMENDED for MVP)

**Pros**:

- ✅ Simple to implement
- ✅ Most secure (no client-side state)
- ✅ Eliminates all stale data issues
- ✅ Follows "stateless client" best practice

**Cons**:

- ⚠️ Slight delay on page load (must fetch user profile from DB)
- ⚠️ Loss of user data if Supabase session cookies cleared

**How it Works**:

```
Page Load
  ↓
Check Supabase session (cookies, managed by Supabase)
  ↓
If session valid → Fetch user profile from DB
  ↓
Store in React state (memory only, not persisted)
```

---

#### Option B: Encrypted localStorage (Medium Complexity)

**Pros**:

- ✅ Faster page loads (no DB fetch)
- ✅ More secure than plaintext
- ✅ Can include expiry validation

**Cons**:

- ⚠️ Requires encryption library
- ⚠️ Key management challenges
- ⚠️ Still vulnerable if key compromised

**Implementation**:

- Use `crypto-js` or Web Crypto API
- Encrypt user object before storing
- Decrypt on hydration
- Validate expiry timestamp

---

#### Option C: httpOnly Cookies + Server State (BEST but Complex)

**Pros**:

- ✅ Most secure (immune to XSS)
- ✅ Session tokens in httpOnly cookies
- ✅ Server-side session management
- ✅ Industry best practice

**Cons**:

- ⚠️ Significant refactoring required
- ⚠️ Needs server-side state management
- ⚠️ More complex to implement

**Implementation**:

- Use `@supabase/ssr` with cookie handlers
- Move session state to server
- Client fetches user data from server
- Server validates session on every request

---

### Recommended Approach: Option A

For this user story, we recommend **Option A** (remove persistence) because:

1. US-002 added server-side middleware (validates session on every route)
2. US-004 added tab focus validation (catches expired sessions)
3. Simplicity > premature optimization
4. Can upgrade to Option C later if needed

---

## Implementation (Option A)

### Step 1: Remove Zustand Persistence

**File**: `src/lib/store.ts`

Before:

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      logout: () => set({ user: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
```

After:

```typescript
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  authError: null,
  setUser: (user) => set({ user }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setAuthError: (error) => set({ authError: error }),
  logout: () => set({ user: null, authError: null }),
}));
// ✅ No persist middleware = no localStorage
```

### Step 2: Update use-auth Hook

**File**: `src/hooks/use-auth.ts`

Ensure session restoration relies on Supabase:

```typescript
useEffect(() => {
  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Get session from Supabase (it manages its own persistence)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Load user profile from database
        await loadUserProfile(session.user);
      } else {
        // No session, user not logged in
        setUser(null);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  initializeAuth();

  // ... rest of code
}, []);
```

### Step 3: Remove "Remember Me" Feature

**File**: `src/components/login-form.tsx`

Remove localStorage:

```typescript
// DELETE these lines:
localStorage.setItem("remember-me", rememberMe.toString());
const rememberMe = localStorage.getItem("remember-me") === "true";
```

**File**: `src/lib/auth-provider.tsx`

Remove rememberMe state:

```typescript
// DELETE:
const [rememberMe, setRememberMe] = useState(false);

useEffect(() => {
  const rememberedSetting = localStorage.getItem("remember-me") === "true";
  setRememberMe(rememberedSetting);
}, []);
```

### Step 4: Optional - Implement Real "Remember Me"

If you want to keep the feature, implement it properly:

**Option 1: Extend Supabase Session**

```typescript
// When user checks "remember me", set longer session
await supabase.auth.signInWithPassword({
  email,
  password,
  options: {
    // Extend session duration to 7 days
    // (Requires Supabase project config change)
  },
});
```

**Option 2: Use Supabase Refresh Token Lifetime**

- Configure in Supabase dashboard: Auth → Settings
- Set "Refresh Token Lifetime" to 7 days
- No client-side code needed

**Recommendation**: Use Supabase dashboard config (Option 2)

---

## Acceptance Criteria

### For Option A (Remove Persistence)

- [ ] Zustand `persist` middleware removed from `useAuthStore`
- [ ] `use-auth.ts` initializes via `supabase.auth.getSession()` only
- [ ] "Remember me" localStorage references deleted
- [ ] Login flow works (session persists via Supabase cookies)
- [ ] Logout flow works (session cleared properly)
- [ ] Page refresh maintains session (via Supabase)
- [ ] Expired sessions properly cleared
- [ ] No stale user data in localStorage
- [ ] `npm test` passes 100%
- [ ] `npm run lint` passes with 0 errors

---

## Files to Modify

- `src/lib/store.ts` - Remove `persist` middleware
- `src/hooks/use-auth.ts` - Ensure Supabase-only initialization
- `src/components/login-form.tsx` - Remove "remember me" localStorage
- `src/lib/auth-provider.tsx` - Remove rememberMe state

---

## Testing Checklist

### Unit Tests

Update existing auth tests to reflect new behavior:

- No localStorage checks
- Session restoration via Supabase only

### Manual Tests

#### Test 1: Session Persistence Across Refresh

- [ ] Login to app
- [ ] Refresh page (Cmd+R / Ctrl+R)
- [ ] User remains logged in
- [ ] User profile loaded correctly
- [ ] No console errors

#### Test 2: Logout Clears Session

- [ ] Login to app
- [ ] Logout
- [ ] Refresh page
- [ ] User remains logged out
- [ ] No stale data in memory

#### Test 3: Expired Session Handling

- [ ] Login to app
- [ ] Open DevTools → Application → Cookies
- [ ] Delete Supabase auth cookies
- [ ] Refresh page
- [ ] User logged out (redirected to login)
- [ ] No errors

#### Test 4: No localStorage Auth Data

- [ ] Login to app
- [ ] Open DevTools → Application → Local Storage
- [ ] Verify no `auth-storage` key
- [ ] Verify no `remember-me` key
- [ ] Verify no user data stored

#### Test 5: Cross-Browser

- [ ] Chrome: Login, refresh, verify session persists
- [ ] Firefox: Login, refresh, verify session persists
- [ ] Safari: Login, refresh, verify session persists

---

## Migration Guide (for existing users)

### Cleaning Up Old localStorage

On first load after deployment, clean up old keys:

**File**: `src/hooks/use-auth.ts`

```typescript
useEffect(() => {
  // One-time cleanup of old localStorage keys
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth-storage");
    localStorage.removeItem("remember-me");
    localStorage.removeItem("last-activity");
  }
}, []);
```

This ensures old data doesn't linger.

---

## Security Improvements

### Before (Vulnerabilities)

- ✅ User data in plaintext localStorage
- ✅ No expiry validation
- ✅ XSS can steal user data
- ✅ Client-side state manipulation

### After (Secure)

- ✅ No auth data in localStorage
- ✅ Session managed by Supabase (httpOnly cookies)
- ✅ XSS cannot access session tokens
- ✅ Server validates session (US-002 middleware)

---

## Performance Considerations

### Before (with localStorage)

- Fast initial load (hydrate from localStorage)
- No DB call needed
- Potential for stale data

### After (without localStorage)

- Slight delay on page load (~100-300ms for DB query)
- Always fresh data
- More reliable

**Tradeoff**: We exchange 100-300ms initial load time for better security and data freshness. This is acceptable for most use cases.

---

## Future Enhancements (Out of Scope)

- [ ] Implement Option C (httpOnly cookies + server state)
- [ ] Add session caching at server level
- [ ] Implement session analytics
- [ ] Add "trust this device" feature

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Zustand persistence removed
- [ ] "Remember me" feature removed or reimplemented
- [ ] Session restoration via Supabase only
- [ ] No auth data in localStorage
- [ ] All tests passing
- [ ] Linting passing
- [ ] Manual testing complete
- [ ] Migration cleanup added
- [ ] Git commit with descriptive message
- [ ] `STATUS.md` updated to "Completed"

---

**Next Story**: US-006 - Testing, Error UX, and Documentation
