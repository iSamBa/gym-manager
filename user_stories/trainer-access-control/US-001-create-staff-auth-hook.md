# US-001: Create Staff Authentication Hook

**Story ID:** US-001
**Title:** Create Staff Authentication Hook
**Priority:** P0 (Critical - Foundation)
**Complexity:** Small
**Estimated Time:** 20 minutes
**Status:** ✅ Completed
**Completed:** 2025-01-15
**Actual Time:** 20 minutes
**Implementation Notes:** Created useRequireStaff hook following existing useRequireAdmin pattern. Hook successfully allows both admin and trainer roles with proper redirect handling and session storage. All tests passed.

**Depends On:** None (Foundation story)
**Blocks:** US-002, US-003, US-004

---

## 📖 User Story

**As a** system architect
**I want** a reusable authentication hook that allows both admins and trainers to access protected pages
**So that** I can implement role-based access control consistently across the application

---

## 💼 Business Value

- **Critical Foundation:** Enables all subsequent user stories
- **Reusability:** Single hook pattern for staff access
- **Consistency:** Follows existing `useRequireAdmin` pattern
- **Maintainability:** Centralized access control logic
- **Security:** Proper redirect handling and session storage

**Impact:** Blocks 5 trainers from using system (530+ active sessions)

---

## ✅ Acceptance Criteria

1. ✅ New `useRequireStaff()` hook created in `src/hooks/use-require-auth.ts`
2. ✅ Hook accepts optional `redirectTo` parameter (default: "/login")
3. ✅ Hook returns `{ isAuthenticated, isLoading, user, isStaff }` object
4. ✅ Hook redirects non-authenticated users to login
5. ✅ Hook allows both admin AND trainer roles to pass (rejects others)
6. ✅ Follows existing code patterns (useEffect, router, sessionStorage)
7. ✅ Has JSDoc documentation with examples
8. ✅ TypeScript types are proper (no `any` types)

---

## 🔧 Technical Scope

### Database Changes

❌ None

### API Changes

❌ None

### UI Changes

❌ None (hook only)

### Tests Required

⚠️ Optional (add if time permits)

- Test admin access allowed
- Test trainer access allowed
- Test member access blocked
- Test redirect behavior

---

## 📝 Implementation Guide

### Step 1: Open File

```bash
# Open the authentication hooks file
code src/hooks/use-require-auth.ts
```

### Step 2: Add Import (If Needed)

Verify these imports exist at the top:

```typescript
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./use-auth";
```

### Step 3: Add useRequireStaff Hook

Add this function after the `useRequireAdmin` function (around line 59):

````typescript
/**
 * Convenience hook for staff access (admin + trainer)
 *
 * Allows authenticated users with admin or trainer role to access protected pages.
 * Non-staff users are redirected to the login page.
 *
 * @example Basic usage
 * ```tsx
 * function StaffOnlyPage() {
 *   const { isLoading, isStaff } = useRequireStaff();
 *
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   return <PageContent />;
 * }
 * ```
 *
 * @example Custom redirect
 * ```tsx
 * const { user, isStaff } = useRequireStaff("/unauthorized");
 * ```
 *
 * @param redirectTo - Optional redirect path for unauthorized users (default: "/login")
 * @returns Auth state with staff validation
 */
export function useRequireStaff(redirectTo?: string) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Store current path for redirect after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "auth-redirect",
          window.location.pathname + window.location.search
        );
      }
      router.push(redirectTo || "/login");
      return;
    }

    // Check if user is staff (admin or trainer)
    const isStaff = user?.role === "admin" || user?.role === "trainer";
    if (!isStaff) {
      // Non-staff roles (e.g., member) are not allowed
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "auth-redirect",
          window.location.pathname + window.location.search
        );
      }
      router.push(redirectTo || "/login");
      return;
    }
  }, [isAuthenticated, isLoading, user, redirectTo, router]);

  return {
    isAuthenticated,
    isLoading,
    user,
    isStaff: user?.role === "admin" || user?.role === "trainer",
  };
}
````

### Step 4: Verify TypeScript

Ensure no TypeScript errors:

```bash
npx tsc --noEmit
```

**Expected:** 0 errors

### Step 5: Run ESLint

```bash
npm run lint
```

**Expected:** 0 errors, 0 warnings

### Step 6: Test Build

```bash
npm run build
```

**Expected:** Successful compilation

---

## 🎨 Code Standards Applied

✅ **JSDoc Documentation** - Complete with examples
✅ **TypeScript Types** - No `any` types used
✅ **Consistent Pattern** - Mirrors `useRequireAdmin` structure
✅ **Session Storage** - Preserves redirect path for post-login
✅ **Loading States** - Proper handling of async auth state
✅ **Early Returns** - Clean control flow
✅ **Dependency Array** - Correct useEffect dependencies

---

## 📁 Files to Modify

### src/hooks/use-require-auth.ts

**Lines Added:** ~55 lines (including JSDoc)
**Location:** After `useRequireAdmin` function (line ~59)

**Before:**

```typescript
export function useRequireAdmin(redirectTo?: string) {
  return useRequireAuth({
    requiredRole: "admin",
    redirectTo,
  });
}

// End of file
```

**After:**

```typescript
export function useRequireAdmin(redirectTo?: string) {
  return useRequireAuth({
    requiredRole: "admin",
    redirectTo,
  });
}

export function useRequireStaff(redirectTo?: string) {
  // ... implementation ...
}

// End of file
```

---

## 🧪 Testing Checklist

### Manual Testing

**Test 1: Hook Export**

```typescript
import { useRequireStaff } from "@/hooks/use-require-auth";
// ✅ No import errors
```

**Test 2: TypeScript IntelliSense**

- Open any page component
- Type `useRequireStaff(`
- ✅ Verify parameter hints show
- ✅ Verify return type shows correctly

**Test 3: Build Verification**

```bash
npm run build
```

- ✅ No TypeScript errors
- ✅ Build succeeds

### Automated Testing (Optional)

```typescript
// __tests__/use-require-staff.test.ts
import { renderHook } from "@testing-library/react";
import { useRequireStaff } from "@/hooks/use-require-auth";

describe("useRequireStaff", () => {
  it("returns isStaff=true for admin", () => {
    // Mock useAuth to return admin
    const { result } = renderHook(() => useRequireStaff());
    expect(result.current.isStaff).toBe(true);
  });

  it("returns isStaff=true for trainer", () => {
    // Mock useAuth to return trainer
    const { result } = renderHook(() => useRequireStaff());
    expect(result.current.isStaff).toBe(true);
  });

  it("redirects for member role", () => {
    // Mock useAuth to return member
    // Verify router.push called with "/login"
  });
});
```

---

## ⚠️ Common Pitfalls

### Pitfall 1: Missing Dependencies

**Problem:** `useEffect` missing dependencies
**Solution:** Include `isAuthenticated, isLoading, user, redirectTo, router`

### Pitfall 2: Role Check Logic

**Problem:** Using `&&` instead of `||` for role check
**Solution:** `user?.role === "admin" || user?.role === "trainer"`

### Pitfall 3: TypeScript Errors

**Problem:** `user` might be null
**Solution:** Use optional chaining `user?.role`

### Pitfall 4: Infinite Redirect

**Problem:** Not checking `isLoading` first
**Solution:** `if (isLoading) return;` before other checks

---

## ✨ Definition of Done

- [x] Hook implementation complete
- [x] JSDoc documentation added
- [x] No TypeScript errors
- [x] No ESLint errors/warnings
- [x] Build succeeds
- [x] Hook exported from file
- [x] Follows existing patterns
- [x] Session storage handling correct

**Ready for:** US-002, US-003, US-004

---

## 🔗 Related Documentation

- **use-require-auth.ts** - File containing this hook
- **use-auth.ts** - Base auth hook used by this hook
- **CLAUDE.md** - Project coding standards
- **docs/AUTH.md** - Authentication architecture

---

## 📊 Metrics

**Estimated Time:** 20 minutes
**Actual Time:** _[Fill after completion]_
**Lines Added:** ~55 lines
**Files Modified:** 1
**Complexity:** Low

---

**Next Step:** After completing this story, proceed to US-002
