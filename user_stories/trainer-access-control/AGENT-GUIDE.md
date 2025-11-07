# AGENT-GUIDE: Trainer Access Control Implementation

This guide provides systematic, step-by-step instructions for implementing trainer access control. Follow this workflow to ensure production-ready, maintainable code.

---

## 🚨 MANDATORY Pre-Flight Checklist

**BEFORE ANY CODE CHANGES:**

```bash
# 1. Check current branch
git branch --show-current
```

**Expected:** `feature/trainer-access-control`

**If NOT on feature branch:**

```bash
# STOP! Create/switch to feature branch
git checkout feature/trainer-access-control
```

**⚠️ NEVER make changes directly on dev or main branches!**

---

## 📋 Implementation Workflow

### Phase 1: Foundation (US-001)

**Goal:** Create reusable `useRequireStaff` hook

**Command:**

```bash
/implement-userstory US-001
```

**Steps:**

1. Open `src/hooks/use-require-auth.ts`
2. Add `useRequireStaff()` function after `useRequireAdmin()`
3. Follow code example in US-001.md
4. Add JSDoc documentation
5. Verify TypeScript types (no `any`)

**Quality Check:**

```bash
npm run lint  # Must pass: 0 errors, 0 warnings
npm run build # Must succeed
```

**Commit:**

```bash
git add src/hooks/use-require-auth.ts
git commit -m "feat(auth): add useRequireStaff hook for trainer access

- Add useRequireStaff hook allowing admin + trainer roles
- Returns isAuthenticated, isLoading, user, isStaff
- Follows existing useRequireAdmin pattern
- Includes JSDoc documentation

Part of US-001

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Phase 2: Training Sessions Access (US-002)

**Goal:** Enable trainers to access training sessions pages

**Command:**

```bash
/implement-userstory US-002
```

**Steps:**

#### 2.1 Update Training Sessions List Page

1. Open `src/app/training-sessions/page.tsx`
2. Line 7: Update import
   ```typescript
   import { useRequireStaff } from "@/hooks/use-require-auth";
   ```
3. Line 15: Replace hook call
   ```typescript
   const { isLoading: isAuthLoading } = useRequireStaff("/login");
   ```
4. Remove `hasRequiredRole` check (lines ~27-29)
5. Keep loading state check only

#### 2.2 Update Training Sessions New Page

1. Open `src/app/training-sessions/new/page.tsx`
2. Apply same changes as 2.1
3. Verify loading states handled

#### 2.3 Verify Machine Toggle

1. Open `src/features/training-sessions/components/MachineAvailabilityToggle.tsx`
2. Confirm lines 57-60 have admin check:
   ```typescript
   if (!isAdmin) return null;
   ```
3. No changes needed - already protected

**Quality Check:**

```bash
npm run lint  # Must pass
npm run build # Must succeed
npm test src/app/training-sessions/ # If tests exist
```

**Manual Test:**

1. Login as karim.elouardi@gymmanager.ma / trainer123456
2. Navigate to /training-sessions
3. Verify page loads (no redirect loop)
4. Verify machine toggle NOT visible
5. Try creating a session
6. Verify edit/cancel actions work

**Commit:**

```bash
git add src/app/training-sessions/
git commit -m "feat(sessions): enable trainer access to training sessions

- Update /training-sessions to use useRequireStaff hook
- Update /training-sessions/new to use useRequireStaff hook
- Trainers can now view, create, edit, cancel sessions
- Machine toggle remains admin-only (already protected)

Trainers tested: Karim El Ouardi (359 sessions), Omar Chakir (167 sessions)

Part of US-002

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Phase 3: Members Access (US-003)

**Goal:** Enable trainers to access member pages with admin UI controls

**Command:**

```bash
/implement-userstory US-003
```

**Steps:**

#### 3.1 Update Members List Page

1. Open `src/app/members/page.tsx`
2. Update import:
   ```typescript
   import { useRequireStaff } from "@/hooks/use-require-auth";
   import { useAuth } from "@/hooks/use-auth";
   ```
3. Update hook calls:
   ```typescript
   const { isLoading: isAuthLoading } = useRequireStaff("/login");
   const { isAdmin } = useAuth();
   ```
4. Remove `hasRequiredRole` check
5. Find export button and wrap with admin check:
   ```typescript
   {isAdmin && <ExportButton />}
   ```

#### 3.2 Update Members New Page

1. Open `src/app/members/new/page.tsx`
2. Update import and hook (same as 3.1)
3. Check if collaboration fields exist in form
4. If found, wrap with admin check:
   ```typescript
   {isAdmin && <CollaborationSection />}
   ```

#### 3.3 Update Member Detail Page

1. Open `src/app/members/[id]/page.tsx`
2. Add at top of component:

   ```typescript
   import { useRequireStaff } from "@/hooks/use-require-auth";

   const { isLoading: isAuthLoading } = useRequireStaff("/login");

   if (isAuthLoading) {
     return <LoadingSkeleton variant="detail" />;
   }
   ```

**Quality Check:**

```bash
npm run lint  # Must pass
npm run build # Must succeed
npm test src/app/members/ # If tests exist
```

**Manual Test:**

1. Login as trainer
2. Navigate to /members
3. Verify list loads
4. Verify export button NOT visible
5. Click "Add Member"
6. Verify can create member
7. Verify collaboration fields NOT visible
8. Click member name to view detail
9. Verify detail page loads
10. Verify can edit member

**Commit:**

```bash
git add src/app/members/
git commit -m "feat(members): enable trainer access to member pages

- Update /members to use useRequireStaff hook
- Update /members/new to use useRequireStaff hook
- Update /members/[id] to require staff authentication
- Hide export button from trainers (admin only)
- Hide collaboration fields from trainers (if present)
- Trainers can now view, create, edit members

Part of US-003

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Phase 4: Navigation & Redirects (US-004)

**Goal:** Update sidebar and login redirects for role-based access

**Command:**

```bash
/implement-userstory US-004
```

**Steps:**

#### 4.1 Update Sidebar Navigation

1. Open `src/components/layout/sidebar.tsx`
2. Add import:
   ```typescript
   import { useAuth } from "@/hooks/use-auth";
   import { useMemo } from "react";
   ```
3. Add inside component:
   ```typescript
   const { user } = useAuth();
   const isAdmin = user?.role === "admin";
   const isStaff = isAdmin || user?.role === "trainer";
   ```
4. Create memoized navigation items:

   ```typescript
   const navigationItems = useMemo(() => {
     const items = [];

     // Staff-accessible
     if (isStaff) {
       items.push(
         { href: "/members", label: "Members", icon: Users },
         { href: "/training-sessions", label: "Sessions", icon: Calendar }
       );
     }

     // Admin-only
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

5. Update rendering to use `navigationItems` array

#### 4.2 Update Login Redirect Logic

1. Find login form component (likely in `src/features/auth/` or `src/app/login/`)
2. Add role-based redirect after successful login:

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
         router.push("/login");
       }
     },
     [signIn, router]
   );
   ```

**Quality Check:**

```bash
npm run lint  # Must pass
npm run build # Must succeed
```

**Manual Test:**

1. Login as trainer
2. Verify redirects to /training-sessions (not dashboard)
3. Check sidebar shows: Members, Training Sessions
4. Check sidebar hides: Dashboard, Trainers, Payments, Plans, Subscriptions, Settings
5. Logout and login as admin
6. Verify admin sees all menu items
7. Verify admin redirects to dashboard

**Commit:**

```bash
git add src/components/layout/sidebar.tsx src/[login-form-file]
git commit -m "feat(navigation): add role-based sidebar and login redirects

- Update sidebar to show role-appropriate menu items
- Trainers see: Members, Training Sessions
- Admins see: All menu items (unchanged)
- Navigation items memoized for performance
- Trainers redirect to /training-sessions after login
- Admins redirect to / (dashboard) after login
- Fixes infinite redirect loop for trainers

Part of US-004

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Phase 5: Admin UI Features (US-005)

**Goal:** Verify and document admin-only features are hidden from trainers

**Command:**

```bash
/implement-userstory US-005
```

**Steps:**

#### 5.1 Verify Machine Toggle (Already Done)

1. Open `src/features/training-sessions/components/MachineAvailabilityToggle.tsx`
2. Confirm lines 57-60: `if (!isAdmin) return null;`
3. ✅ No changes needed

#### 5.2 Verify Export Button (Should be done in US-003)

1. Open `src/app/members/page.tsx`
2. Confirm export wrapped with `{isAdmin && ...}`
3. ✅ Should already be done

#### 5.3 Check for Other Admin Features

1. Search codebase for admin-only actions:
   ```bash
   grep -r "isAdmin" src/app/members/
   grep -r "isAdmin" src/app/training-sessions/
   ```
2. Review results and add checks if needed

#### 5.4 Create Documentation

1. Update STATUS.md with admin-only features list
2. Document what's hidden from trainers

**Quality Check:**

```bash
npm run lint  # Must pass: 0 errors, 0 warnings
npm run build # Must succeed
npm test      # All tests pass
```

**Final Manual Testing:**
Run complete test checklist from START-HERE.md

**Commit (if any changes):**

```bash
git add [changed-files]
git commit -m "docs(admin): document admin-only UI features

- Verified machine toggle hidden from trainers
- Verified export button hidden from trainers
- Verified collaboration fields hidden from trainers
- Updated STATUS.md with admin-only features list
- All admin UI controls properly secured

Part of US-005

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## ✅ Final Verification

### Pre-PR Checklist

```bash
# 1. All quality checks pass
npm run lint   # 0 errors, 0 warnings
npm test       # 100% pass rate
npm run build  # Successful compilation

# 2. Manual testing complete
# See START-HERE.md testing section

# 3. All user stories marked complete
# Check STATUS.md

# 4. Git status clean
git status
```

### Create Pull Request

```bash
# 1. Push feature branch
git push -u origin feature/trainer-access-control

# 2. Create PR to dev branch (NOT main!)
# Title: feat(auth): enable trainer access to sessions and members
# Description: Include testing checklist and verification results
```

---

## 🐛 Troubleshooting

### Issue: Trainer still getting redirect loop

**Check:**

1. Verify on feature branch: `git branch --show-current`
2. Verify `useRequireStaff` hook exists
3. Verify pages updated with new hook
4. Verify no TypeScript errors: `npm run build`
5. Clear browser cache and cookies
6. Try hard refresh (Cmd/Ctrl + Shift + R)

### Issue: ESLint errors

**Common fixes:**

1. Missing `useCallback` wrapper on event handlers
2. Missing dependencies in `useMemo`/`useCallback`
3. Unused imports
4. Run `npx eslint --fix [file]` to auto-fix

### Issue: TypeScript errors

**Common fixes:**

1. Check import paths are correct
2. Verify types match interfaces
3. No `any` types used
4. Run `npx tsc --noEmit` to see all errors

### Issue: Tests failing

**Check:**

1. Mock auth state includes trainer role
2. Update test assertions for new behavior
3. Add new test cases for trainer scenarios

---

## 📊 Progress Tracking

Update `STATUS.md` after completing each phase:

- Mark user stories as complete
- Note any blockers or issues
- Update implementation notes

---

## 🎯 Definition of Done

Feature is complete when:

- ✅ All 5 user stories implemented
- ✅ All quality checks pass (lint/test/build)
- ✅ Manual testing checklist complete
- ✅ Admin functionality unchanged
- ✅ Trainers can log in and use system
- ✅ No infinite redirect loops
- ✅ Admin UI features hidden from trainers
- ✅ Navigation shows role-appropriate items
- ✅ PR created to dev branch
- ✅ Documentation updated

---

**Ready to implement? Start with:**

```bash
/implement-userstory US-001
```
