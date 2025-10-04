# US-002: Server-Side Auth Middleware

**Status**: 📝 Not Started
**Priority**: P0 (Critical - Security)
**Effort**: Medium
**Dependencies**: US-001 (Unified Session Management)

---

## User Story

**As a** developer
**I want** server-side authentication middleware
**So that** protected routes are actually secure and cannot be bypassed by client-side manipulation

---

## Problem Statement

### Current Security Vulnerability 🔴

**ALL authentication checks happen client-side only**:

```typescript
// Current approach (INSECURE):
// src/hooks/use-require-auth.ts
useEffect(() => {
  if (!isAuthenticated) {
    router.push("/login"); // ❌ Client-side redirect only
  }
}, [isAuthenticated]);
```

**Vulnerabilities**:

1. Anyone can manipulate localStorage to appear "logged in"
2. Direct API access bypasses authentication entirely
3. No server-side validation of JWT tokens
4. Protected route content briefly visible before redirect
5. API routes (if added) have no auth protection

### Example Attack

```javascript
// Attacker opens browser console:
localStorage.setItem(
  "auth-storage",
  JSON.stringify({
    state: { user: { id: "123", role: "admin" } },
  })
);

// Refresh page → appears logged in!
// Can access protected routes (until API call fails)
```

---

## Objectives

1. ✅ Add Next.js middleware for server-side route protection
2. ✅ Validate Supabase session on every protected route request
3. ✅ Redirect unauthenticated users before page renders
4. ✅ Protect future API routes with server-side auth
5. ✅ Maintain good user experience (no flash of protected content)

---

## Technical Requirements

### 1. Install Dependencies (if needed)

Check if `@supabase/ssr` is installed:

```bash
npm list @supabase/ssr
```

If not installed:

```bash
npm install @supabase/ssr
```

### 2. Create Server-Side Supabase Client

**File**: `src/lib/supabase-server.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

### 3. Create Next.js Middleware

**File**: `src/middleware.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes (no auth required)
  const publicRoutes = ["/login", "/"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Create Supabase client for server-side auth check
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, redirect to login
  if (!session) {
    const redirectUrl = new URL("/login", request.url);
    // Preserve current path for redirect after login
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // User is authenticated, allow request
  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 4. Update Login Flow for Redirects

**File**: `src/components/login-form.tsx`

Add redirect handling after successful login:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  const { user, error: signInError } = await signIn(email, password);

  if (signInError) {
    setError(signInError.message || "Failed to sign in");
    return;
  }

  if (user) {
    // Check for redirect parameter
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get("redirect") || "/";
    router.push(redirectTo);
  }
};
```

### 5. Add Comments to Clarify Client vs Server

**File**: `src/lib/supabase.ts`

Add documentation comment:

```typescript
/**
 * CLIENT-SIDE Supabase client
 *
 * Use this for:
 * - Client components
 * - Browser-side auth operations (signIn, signOut)
 * - Real-time subscriptions
 *
 * DO NOT use this for:
 * - Server components
 * - API routes
 * - Middleware
 *
 * For server-side usage, import from '@/lib/supabase-server'
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

---

## Acceptance Criteria

- [ ] `@supabase/ssr` installed and working
- [ ] `src/lib/supabase-server.ts` created with server client
- [ ] `src/middleware.ts` created with route protection
- [ ] Public routes (`/login`, `/`) accessible without auth
- [ ] Protected routes redirect to `/login` when unauthenticated
- [ ] Redirect preserves original URL in query param
- [ ] After login, user redirected to originally requested page
- [ ] No "flash" of protected content before redirect
- [ ] No infinite redirect loops
- [ ] Server-side session validation on every request
- [ ] `npm test` passes 100%
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run build` succeeds without errors

---

## Files to Create

- `src/lib/supabase-server.ts` (NEW)
- `src/middleware.ts` (NEW)

---

## Files to Modify

- `src/lib/supabase.ts` - Add documentation comments
- `src/components/login-form.tsx` - Add redirect parameter handling

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install @supabase/ssr
```

### Step 2: Create Server Client

- Create `src/lib/supabase-server.ts`
- Implement `createSupabaseServerClient()` function
- Test that it compiles without errors

### Step 3: Create Middleware

- Create `src/middleware.ts`
- Define public routes array
- Implement session check logic
- Configure matcher for routes

### Step 4: Update Login Form

- Add redirect parameter handling
- Test login → redirect flow

### Step 5: Add Documentation

- Update `src/lib/supabase.ts` with comments
- Clarify when to use client vs server client

### Step 6: Test Thoroughly

- Manual testing (see checklist below)
- Verify no regressions

---

## Testing Checklist

### Automated Tests

- [ ] Build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] All tests pass: `npm test`

### Manual Tests - Unauthenticated User

- [ ] Go to `/login` → page loads without redirect
- [ ] Go to `/` → page loads without redirect
- [ ] Go to `/members` → redirected to `/login?redirect=/members`
- [ ] Go to `/dashboard` → redirected to `/login?redirect=/dashboard`
- [ ] No flash of protected content before redirect

### Manual Tests - Authenticated User

- [ ] Go to `/login` → can access login page
- [ ] Go to `/` → can access home page
- [ ] Go to `/members` → can access members page
- [ ] Go to `/dashboard` → can access dashboard
- [ ] No unnecessary redirects

### Manual Tests - Redirect Flow

- [ ] Visit `/members` while logged out
- [ ] Redirected to `/login?redirect=/members`
- [ ] Enter credentials and login
- [ ] After login, redirected to `/members` (not `/`)
- [ ] URL is clean (no redirect param after login)

### Manual Tests - Edge Cases

- [ ] Manipulate localStorage → still redirected (server validates)
- [ ] Delete cookies → redirected to login
- [ ] Expired session → redirected to login
- [ ] Network error during session check → appropriate error handling

### Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

---

## Security Considerations

### ✅ Improvements

1. **Server-side validation** - JWT verified on server, not client
2. **No client bypass** - Cannot access protected routes without valid session
3. **Cookie-based session** - More secure than localStorage for tokens
4. **Session validation on every request** - Cannot use stale/expired sessions

### ⚠️ Remaining Considerations

1. **CSRF protection** - Consider adding CSRF tokens for state-changing operations
2. **Rate limiting** - Consider adding rate limiting to prevent brute force
3. **Session fixation** - Supabase handles this, but verify
4. **XSS protection** - Ensure proper CSP headers (separate task)

---

## Rollback Plan

If middleware causes issues:

1. Comment out middleware matcher:

   ```typescript
   export const config = {
     matcher: [], // Disable middleware
   };
   ```

2. Revert to client-side auth only temporarily

3. Debug issue and re-enable

---

## Performance Considerations

### Middleware Performance

- Middleware runs on **every request** (including static assets)
- Use matcher to exclude static files
- Keep middleware logic fast (< 50ms per request)

### Monitoring

After deployment, monitor:

- Middleware execution time
- Redirect frequency
- Failed auth attempts

---

## Future Enhancements (Out of Scope)

- [ ] Role-based route protection (admin-only routes)
- [ ] API route protection (when API routes added)
- [ ] Session timeout configuration
- [ ] MFA support in middleware

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All implementation steps completed
- [ ] All tests passing (automated + manual)
- [ ] Linting passing
- [ ] Build succeeds
- [ ] Security improvements verified
- [ ] No infinite redirects or loops
- [ ] Git commit with descriptive message
- [ ] `STATUS.md` updated to "Completed"

---

**Next Story**: US-003 - Complete Auth Event Handling
