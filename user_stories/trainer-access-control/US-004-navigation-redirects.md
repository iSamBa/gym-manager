# US-004: Role-Based Navigation and Redirects

**Story ID:** US-004
**Title:** Role-Based Navigation and Redirects
**Priority:** P0 (Critical)
**Complexity:** Medium
**Estimated Time:** 40 minutes
**Status:** 🔴 Not Started

**Depends On:** US-001, US-002, US-003
**Blocks:** US-005

---

## 📖 User Story

**As a** trainer
**I want** to see only relevant menu items in the sidebar and be redirected to an appropriate page after login
**So that** I have a clear, focused interface and don't get stuck in redirect loops

---

## 💼 Business Value

- **Fixes critical bug:** Eliminates infinite redirect loop
- **Better UX:** Trainers see only relevant pages
- **Reduced confusion:** Clear role separation
- **Professional appearance:** Polished interface

---

## ✅ Acceptance Criteria

1. ✅ Sidebar shows Members + Training Sessions for trainers
2. ✅ Sidebar hides Dashboard, Trainers, Payments, Plans, Subscriptions, Settings from trainers
3. ✅ Sidebar shows all items for admins (unchanged)
4. ✅ Navigation items memoized with `useMemo` (performance)
5. ✅ Login form redirects trainers to `/training-sessions`
6. ✅ Login form redirects admins to `/` (dashboard)
7. ✅ useAuth hook provides role information
8. ✅ No infinite redirect loops
9. ✅ `npm run lint` passes

---

## 📝 Implementation Guide

### Step 1: Update Sidebar Navigation

**File:** `src/components/layout/sidebar.tsx`

**Add Imports:**

```typescript
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";
```

**Add Inside Component:**

```typescript
const { user } = useAuth();
const isAdmin = user?.role === "admin";
const isStaff = isAdmin || user?.role === "trainer";
```

**Create Memoized Navigation:**

```typescript
const navigationItems = useMemo(() => {
  const items = [];

  // Staff-accessible pages
  if (isStaff) {
    items.push(
      { href: "/members", label: "Members", icon: Users },
      { href: "/training-sessions", label: "Sessions", icon: Calendar }
    );
  }

  // Admin-only pages
  if (isAdmin) {
    items.push(
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/trainers", label: "Trainers", icon: UserCog },
      { href: "/payments", label: "Payments", icon: DollarSign },
      { href: "/plans", label: "Plans", icon: Package },
      { href: "/subscriptions", label: "Subscriptions", icon: FileText },
      { href: "/settings", label: "Settings", icon: Settings }
    );
  }

  return items;
}, [isAdmin, isStaff]);
```

**Update Rendering:**
Replace hard-coded nav items with `navigationItems.map(...)`

### Step 2: Update Login Redirect

**Find Login Form Component** (likely in `src/features/auth/components/` or `src/app/login/`)

**Add Role-Based Redirect:**

```typescript
const handleLogin = useCallback(
  async (email: string, password: string) => {
    const { user, error } = await signIn(email, password);

    if (error) {
      toast.error("Login failed");
      return;
    }

    // Role-based redirect
    if (user?.role === "admin") {
      router.push("/");
    } else if (user?.role === "trainer") {
      router.push("/training-sessions");
    } else {
      router.push("/login"); // Fallback
    }
  },
  [signIn, router]
);
```

---

## 🧪 Testing Checklist

### Trainer Navigation:

- [ ] Login as trainer
- [ ] Redirects to `/training-sessions` (NOT dashboard)
- [ ] Sidebar shows: Members, Training Sessions
- [ ] Sidebar does NOT show: Dashboard, Trainers, Payments, Plans, Subscriptions, Settings
- [ ] Can click navigation items
- [ ] No redirect loops

### Admin Navigation (Unchanged):

- [ ] Login as admin
- [ ] Redirects to `/` (dashboard)
- [ ] Sidebar shows ALL menu items
- [ ] All navigation works

---

## 📁 Files to Modify

1. **src/components/layout/sidebar.tsx** (~30 lines)
2. **[login-form].tsx** (~10 lines)

---

## ✨ Definition of Done

- [ ] Sidebar updated with role checks
- [ ] Navigation memoized
- [ ] Login redirects based on role
- [ ] No redirect loops
- [ ] ESLint passes
- [ ] Manual testing complete

---

**Next Step:** Proceed to US-005
