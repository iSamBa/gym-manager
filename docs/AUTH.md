# Authentication System Guide

Complete documentation for the gym management system's authentication architecture.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Common Tasks](#common-tasks)
5. [API Reference](#api-reference)
6. [Error Handling](#error-handling)
7. [Security](#security)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This application uses **Supabase Auth** with server-side validation for secure session management. The system was designed to eliminate common security vulnerabilities while providing a seamless user experience.

### Key Features

- ✅ Server-side route protection via Next.js middleware
- ✅ Automatic token refresh (no user interruption)
- ✅ Session validation on tab focus (prevents zombie sessions)
- ✅ httpOnly cookies (immune to XSS attacks)
- ✅ No sensitive data in localStorage
- ✅ Multi-tab synchronization
- ✅ User-friendly error messages

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ AuthProvider │───▶│   useAuth    │───▶│  Components  │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                             │
│         │                    │                             │
│  ┌──────▼──────────┐  ┌──────▼──────────┐                 │
│  │ Auth Store      │  │ Session         │                 │
│  │ (Zustand)       │  │ Validator       │                 │
│  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Middleware                         │
├─────────────────────────────────────────────────────────────┤
│  Validates session on every protected route request        │
│  Redirects unauthenticated users to /login                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Auth                            │
├─────────────────────────────────────────────────────────────┤
│  JWT tokens stored in httpOnly cookies                     │
│  Access token: 1 hour expiry                               │
│  Refresh token: 30 days expiry                             │
│  Auto-refresh: ~55 minutes                                 │
└─────────────────────────────────────────────────────────────┘
```

### Session Flow

1. **Login** → User submits credentials → Supabase validates
2. **Token Storage** → Supabase sets httpOnly cookies with JWT tokens
3. **Route Access** → Middleware validates session → Allow or redirect
4. **Auto-Refresh** → Before token expires → Request new access token
5. **Tab Focus** → User returns → Validate session still active
6. **Logout** → Clear cookies → Clear in-memory state → Redirect

---

## Quick Start

### 1. Client-Side Authentication

**Using the `useAuth` hook:**

```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <button onClick={() => signIn('user@example.com', 'password')}>
        Sign In
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### 2. Server-Side Authentication

**In API routes:**

```typescript
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // User is authenticated
  const userId = session.user.id;

  return NextResponse.json({ userId, email: session.user.email });
}
```

### 3. Protected Routes

Routes are automatically protected by middleware. No additional configuration needed for standard routes.

**Middleware protects all routes except:**

- `/` (home page)
- `/login`

To make a route public, update `src/middleware.ts`:

```typescript
const publicRoutes = ["/", "/login", "/signup"]; // Add your route here
```

---

## Common Tasks

### Adding User Profile Data to Session

User profile is automatically loaded from the `user_profiles` table when:

- User signs in
- Page loads with active session
- Token is refreshed
- User profile is updated

**Location:** `src/lib/auth-provider.tsx` → `loadUserProfile()`

### Customizing Error Messages

Error messages are mapped in `src/components/feedback/auth-error-banner.tsx`:

```typescript
const ERROR_MESSAGES: Record<string, ErrorConfig> = {
  "Invalid login credentials": {
    title: "Login Failed",
    message:
      "The email or password you entered is incorrect. Please try again.",
    action: "retry",
  },
  // Add your custom error here
  your_error_key: {
    title: "Custom Error",
    message: "User-friendly message here",
    action: "retry", // or 'login' or 'dismiss'
  },
};
```

### Adding New Auth Events

Supabase emits various auth events. To handle a new one:

**Location:** `src/lib/auth-provider.tsx`

```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  switch (event) {
    // ... existing cases

    case "YOUR_NEW_EVENT":
      // Handle your event
      console.log("New event triggered:", session);
      break;
  }
});
```

### Checking User Permissions

```typescript
import { useAuth } from '@/hooks/use-auth';

function AdminPanel() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}
```

### Manual Session Validation

```typescript
import { supabase } from "@/lib/supabase";

async function validateCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    console.log("Session invalid");
    return false;
  }

  console.log("Session valid, expires:", session.expires_at);
  return true;
}
```

---

## API Reference

### `useAuth()`

Returns auth state and methods.

```typescript
const {
  user, // User object or null
  isLoading, // Boolean: auth state loading
  isAuthenticated, // Boolean: user is logged in
  isAdmin, // Boolean: user has admin role
  signIn, // Function: (email, password) => Promise
  signOut, // Function: () => Promise
} = useAuth();
```

### `useSessionValidator()`

Automatically validates session on tab focus. No manual invocation needed.

```typescript
// In AuthProvider:
useSessionValidator(); // That's it!
```

Returns:

```typescript
{
  validateSession: () => Promise<void>;
}
```

### `retryTokenRefresh(attempt, maxAttempts)`

Retries token refresh with exponential backoff.

```typescript
import { retryTokenRefresh } from "@/hooks/use-auth";

const success = await retryTokenRefresh(1, 3);
// Attempts: 1s delay, 2s delay, 4s delay
```

### `createClient()` (Server)

Creates server-side Supabase client.

```typescript
import { createClient } from "@/lib/supabase-server";

const supabase = createClient();
const {
  data: { session },
} = await supabase.auth.getSession();
```

---

## Error Handling

### Error Categories

| Error Type               | Cause                                 | User Action                    | System Action          |
| ------------------------ | ------------------------------------- | ------------------------------ | ---------------------- |
| **Invalid Credentials**  | Wrong email/password                  | Retry with correct credentials | Show error message     |
| **Session Expired**      | Token expired while inactive          | Log in again                   | Auto-logout + redirect |
| **Network Error**        | No internet connection                | Check connection and retry     | Retry with backoff     |
| **Token Refresh Failed** | Supabase error                        | Log in again                   | 3 retries, then logout |
| **Email Not Verified**   | User hasn't clicked verification link | Check email                    | Show info message      |

### Error Recovery Flow

```
Error Occurs
  ↓
Is it recoverable? (network, timeout)
  ↓ Yes                    ↓ No
Retry (1s, 2s, 4s)    Show error + logout option
  ↓
Success? → Continue
Failure → Show error + logout
```

### Custom Error Handling

```typescript
import { useAuth } from '@/hooks/use-auth';

function LoginForm() {
  const { signIn } = useAuth();
  const [error, setError] = useState(null);

  const handleSubmit = async (email: string, password: string) => {
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Unexpected error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* form fields */}
    </form>
  );
}
```

---

## Security

### Security Measures Implemented

1. **httpOnly Cookies** → Session tokens not accessible via JavaScript
2. **Server-Side Validation** → Every protected route validated by middleware
3. **No localStorage Auth Data** → Prevents XSS token theft
4. **CSRF Protection** → Supabase handles CSRF tokens
5. **Automatic Logout on Expiry** → No zombie sessions
6. **Multi-Tab Sync** → Logout in one tab = logout everywhere
7. **Tab Focus Validation** → Catches expired sessions when user returns

### What's Protected

✅ User session tokens (httpOnly cookies)
✅ User profile data (in-memory only, cleared on logout)
✅ API routes (validated by middleware)
✅ Protected pages (redirected to login if unauthenticated)

### What's NOT Protected

⚠️ Public routes (/, /login)
⚠️ Client-side code (visible in browser)
⚠️ Non-sensitive data in UI state

### Best Practices

**DO:**

- Use `createClient()` from `@/lib/supabase-server` for server-side operations
- Check `isAuthenticated` before showing sensitive UI
- Clear sensitive data from state on logout
- Use middleware for route protection
- Validate user permissions server-side for critical operations

**DON'T:**

- Store sensitive data in localStorage
- Trust client-side auth checks for security-critical operations
- Bypass middleware for protected routes
- Use `any` types in auth-related code
- Expose sensitive error details to users

---

## Troubleshooting

### "Session expired" after refresh

**Cause:** Supabase cookies not persisting

**Solution:**

1. Check browser settings → Cookies enabled for your domain
2. Ensure `@supabase/ssr` is installed
3. Verify `createBrowserClient` is used in `src/lib/supabase.ts`

```bash
npm list @supabase/ssr
# Should show version installed
```

### Multi-tab logout not working

**Cause:** Session validator not integrated or Supabase client issue

**Solution:**

1. Verify `useSessionValidator()` is called in `AuthProvider`
2. Check Supabase client uses `createBrowserClient` from `@supabase/ssr`
3. Test visibility API:

```javascript
// In browser console
document.addEventListener("visibilitychange", () => {
  console.log("Visibility changed:", document.visibilityState);
});
// Switch tabs and check if event fires
```

### Token refresh failing repeatedly

**Cause:** Network issues, Supabase project issues, or expired refresh token

**Solution:**

1. Check network connection
2. Verify Supabase project is active (not paused)
3. Check Supabase dashboard → Auth → Settings → Session duration
4. Clear all cookies and re-login

```javascript
// Force refresh
await supabase.auth.refreshSession();
```

### "Unauthorized" errors on API routes

**Cause:** Middleware or server client not validating session correctly

**Solution:**

1. Check middleware is running:

```typescript
// Add to src/middleware.ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

2. Verify server client creation:

```typescript
// src/lib/supabase-server.ts should use cookies()
import { cookies } from "next/headers";
const cookieStore = cookies();
```

### User profile not loading

**Cause:** Database query error or user_profiles table missing data

**Solution:**

1. Check `user_profiles` table exists in Supabase
2. Verify user has a profile row:

```sql
SELECT * FROM user_profiles WHERE id = 'user-id';
```

3. Check console for error messages from `loadUserProfile()`

---

## Advanced Topics

### Custom Session Duration

Configure in Supabase Dashboard:

1. Go to Auth → Settings
2. "JWT Expiry" → Set access token duration (default: 3600s = 1hr)
3. "Refresh Token Lifetime" → Set refresh token duration (default: 30 days)

### Adding MFA (Multi-Factor Authentication)

Supabase supports MFA. To enable:

1. Enable MFA in Supabase Dashboard → Auth → Providers
2. Handle `MFA_CHALLENGE_VERIFIED` event (already implemented in AuthProvider)
3. Add MFA UI components

### Session Analytics

Track session metrics:

```typescript
// In AuthProvider
supabase.auth.onAuthStateChange((event, session) => {
  // Log to analytics
  analytics.track("auth_event", {
    event,
    userId: session?.user.id,
    timestamp: new Date().toISOString(),
  });
});
```

---

## Migration Guide

### From Custom Auth to This System

1. **Remove old auth code:**
   - Delete custom session managers
   - Remove localStorage auth keys
   - Remove client-side route guards

2. **Update components:**
   - Replace custom auth hooks with `useAuth()`
   - Remove `SessionGuard` wrappers
   - Update login/logout handlers

3. **Test thoroughly:**
   - Login flow
   - Logout flow
   - Page refresh (session persistence)
   - Multi-tab behavior
   - Token refresh

---

## Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Project CLAUDE.md](../CLAUDE.md) - Quick reference

---

**Last Updated:** 2025-10-04
**Auth System Version:** 2.0 (Post-Overhaul)
