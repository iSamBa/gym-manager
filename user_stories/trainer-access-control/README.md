# Trainer Access Control - Technical Documentation

**Feature:** Enable trainer role access to training sessions and members
**Status:** 🔴 Not Started
**Priority:** P0 - Critical (Blocks all 5 trainers from using system)
**Branch:** `feature/trainer-access-control`

---

## 📊 Overview

### Problem Statement

All 5 trainers have valid auth accounts but cannot use the system due to an infinite redirect loop:

1. Trainer logs in successfully
2. App redirects to `/` (dashboard)
3. Dashboard requires admin role → redirects to `/login`
4. Login redirects back to `/` → infinite loop

**Result:** System completely unusable for trainers managing 530+ active sessions.

### Solution

Implement role-based access control allowing trainers to access specific pages while maintaining admin-only features and security.

---

## 🏗️ Architecture

### Access Control Layers

```
┌─────────────────────────────────────────────┐
│         Layer 1: Middleware                 │
│    (Server-side authentication check)       │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Layer 2: Page-Level Hooks           │
│    (useRequireStaff, useRequireAdmin)       │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│       Layer 3: Component-Level Checks       │
│    (isAdmin conditionals, role gates)       │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Layer 4: Database RLS               │
│    (Row-level security policies)            │
└─────────────────────────────────────────────┘
```

### Role Hierarchy

```typescript
type UserRole = "admin" | "trainer" | "member";

// Access levels:
Admin:   Full access to all pages and features
Trainer: Access to sessions + members (limited UI)
Member:  No system access (future: member portal)
```

---

## 🔐 Security Design

### Authentication Hook Pattern

**Existing Pattern (Admin-Only):**

```typescript
export function useRequireAdmin(redirectTo?: string) {
  return useRequireAuth({
    requiredRole: "admin",
    redirectTo,
  });
}
```

**New Pattern (Staff Access):**

```typescript
export function useRequireStaff(redirectTo?: string) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(redirectTo || "/login");
      return;
    }

    // Allow both admin AND trainer
    const isStaff = user?.role === "admin" || user?.role === "trainer";
    if (!isStaff) {
      router.push(redirectTo || "/login");
      return;
    }
  }, [isAuthenticated, isLoading, user, redirectTo, router]);

  return { isAuthenticated, isLoading, user, isStaff };
}
```

**Key Differences:**

- ✅ No `requiredRole` parameter (checks both roles inline)
- ✅ Returns `isStaff` flag for components
- ✅ Follows same redirect pattern
- ✅ Maintains session storage for post-login redirect

### Component-Level Access Control

**Pattern:**

```typescript
import { useAuth } from "@/hooks/use-auth";

function MyComponent() {
  const { isAdmin } = useAuth();

  return (
    <div>
      {/* Visible to all staff */}
      <CreateButton />

      {/* Admin-only */}
      {isAdmin && <ExportButton />}
      {isAdmin && <MachineToggle />}
    </div>
  );
}
```

**Benefits:**

- Granular control
- Clear visibility in code
- Easy to audit
- Performance optimized (early return)

---

## 📁 File Structure

### Affected Files

| File                                     | Change Type  | Lines Changed | Purpose                  |
| ---------------------------------------- | ------------ | ------------- | ------------------------ |
| `src/hooks/use-require-auth.ts`          | Addition     | +35           | Add useRequireStaff hook |
| `src/app/training-sessions/page.tsx`     | Modification | ~5            | Change to staff access   |
| `src/app/training-sessions/new/page.tsx` | Modification | ~5            | Change to staff access   |
| `src/app/members/page.tsx`               | Modification | ~10           | Staff access + admin UI  |
| `src/app/members/new/page.tsx`           | Modification | ~5            | Change to staff access   |
| `src/app/members/[id]/page.tsx`          | Modification | ~8            | Add staff auth check     |
| `src/components/layout/sidebar.tsx`      | Modification | ~30           | Role-based navigation    |
| `[login-form].tsx`                       | Modification | ~10           | Role-based redirect      |

**Total:** 8 files, ~108 lines changed

### Component Dependencies

```
useAuth (existing)
  └── useRequireStaff (new)
        ├── Training Sessions Pages
        ├── Members Pages
        └── Login Redirect Logic

Sidebar Navigation
  └── useAuth
        └── Role checks (isAdmin, isStaff)
```

---

## 🎯 Access Matrix

### Pages

| Page                     | Admin | Trainer | Member |
| ------------------------ | ----- | ------- | ------ |
| `/` (Dashboard)          | ✅    | ❌      | ❌     |
| `/training-sessions`     | ✅    | ✅      | ❌     |
| `/training-sessions/new` | ✅    | ✅      | ❌     |
| `/members`               | ✅    | ✅      | ❌     |
| `/members/new`           | ✅    | ✅      | ❌     |
| `/members/[id]`          | ✅    | ✅      | ❌     |
| `/trainers`              | ✅    | ❌      | ❌     |
| `/payments`              | ✅    | ❌      | ❌     |
| `/plans`                 | ✅    | ❌      | ❌     |
| `/subscriptions`         | ✅    | ❌      | ❌     |
| `/settings`              | ✅    | ❌      | ❌     |

### Features

| Feature                     | Admin | Trainer | Implementation             |
| --------------------------- | ----- | ------- | -------------------------- |
| View training sessions      | ✅    | ✅      | Page-level hook            |
| Create training sessions    | ✅    | ✅      | Page-level hook            |
| Edit training sessions      | ✅    | ✅      | Page-level hook            |
| Cancel training sessions    | ✅    | ✅      | Page-level hook            |
| Machine availability toggle | ✅    | ❌      | Component check (existing) |
| View members                | ✅    | ✅      | Page-level hook            |
| Create members              | ✅    | ✅      | Page-level hook            |
| Edit members                | ✅    | ✅      | Page-level hook            |
| Export members              | ✅    | ❌      | Component check (new)      |
| Collaboration members       | ✅    | ❌      | Component check (new)      |
| Dashboard analytics         | ✅    | ❌      | Page-level hook (existing) |

---

## ⚡ Performance Considerations

### React Optimization Patterns

**Navigation Memoization:**

```typescript
const navigationItems = useMemo(() => {
  const items = [];
  // Build items based on role
  return items;
}, [isAdmin, isStaff]);
```

**Benefits:**

- Prevents recalculation on every render
- Reduces sidebar re-renders
- Follows CLAUDE.md Phase 1 guidelines

**Event Handler Optimization:**

```typescript
const handleLogin = useCallback(
  async (email, password) => {
    // Login logic
  },
  [signIn, router]
);
```

**Component Memoization:**

```typescript
export const MachineAvailabilityToggle = memo(function MachineToggle(props) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  // ...
});
```

### Performance Targets

- ✅ Components < 300 lines
- ✅ React re-renders < 30% unnecessary
- ✅ Database queries < 5 per page
- ✅ Hook count < 4 per feature
- ✅ Bundle size impact < 5KB

---

## 🧪 Testing Strategy

### Manual Testing Priority

**P0 - Critical Path:**

1. Trainer login succeeds
2. No redirect loop
3. Can view sessions
4. Can create session
5. Can view members
6. Can create member

**P1 - Feature Verification:**

1. Machine toggle hidden
2. Export button hidden
3. Navigation shows correct items
4. Collaboration fields hidden (if present)

**P2 - Edge Cases:**

1. Direct URL access (admin pages)
2. Browser back/forward navigation
3. Token expiration handling
4. Multi-tab behavior

### Automated Testing (If Time Permits)

**Hook Tests:**

```typescript
describe("useRequireStaff", () => {
  it("allows admin access", () => {});
  it("allows trainer access", () => {});
  it("blocks member access", () => {});
  it("redirects unauthenticated users", () => {});
});
```

**Component Tests:**

```typescript
describe("MachineToggle", () => {
  it("shows for admin", () => {});
  it("hides for trainer", () => {});
});
```

---

## 🔄 Data Flow

### Login Flow

```
User enters credentials
  ↓
useAuth.signIn()
  ↓
Supabase authentication
  ↓
Success: User object with role
  ↓
Login form checks role
  ↓
┌─────────────────────┐
│ Admin → /           │
│ Trainer → /training-sessions │
│ Other → /login      │
└─────────────────────┘
```

### Page Access Flow

```
User navigates to page
  ↓
Middleware: Auth check
  ↓
Page: useRequireStaff()
  ↓
┌──────────────────────────────┐
│ Is authenticated?            │
│  No → Redirect /login        │
│  Yes → Check role            │
└──────────────┬───────────────┘
               │
┌──────────────▼────────────────┐
│ Is admin OR trainer?          │
│  No → Redirect /login         │
│  Yes → Render page            │
└───────────────────────────────┘
```

### Component Rendering Flow

```
Component renders
  ↓
useAuth() → { isAdmin, user }
  ↓
┌───────────────────────┐
│ Check isAdmin flag    │
└──────┬────────────────┘
       │
       ├─ True → Render admin features
       └─ False → Hide admin features
```

---

## 🗄️ Database Considerations

### RLS Policies

**Expected Policies:**

```sql
-- Training sessions: Staff can read/write
CREATE POLICY "staff_access_training_sessions"
  ON training_sessions
  FOR ALL
  TO authenticated
  USING (true);  -- Or: user_role() IN ('admin', 'trainer')

-- Members: Staff can read/write
CREATE POLICY "staff_access_members"
  ON members
  FOR ALL
  TO authenticated
  USING (true);  -- Or: user_role() IN ('admin', 'trainer')
```

**Verification Steps:**

1. Check existing policies
2. Ensure trainers have SELECT permission
3. Ensure trainers have INSERT/UPDATE permission
4. Test with trainer credentials

---

## 📈 Success Metrics

### Functional Metrics

- ✅ 0 redirect loops for trainers
- ✅ 100% trainer login success rate
- ✅ All CRUD operations work for trainers
- ✅ 0 security vulnerabilities

### Code Quality Metrics

- ✅ 0 ESLint errors/warnings
- ✅ 100% test pass rate
- ✅ 0 TypeScript `any` types
- ✅ 0 console statements

### Performance Metrics

- ✅ Navigation render time < 50ms
- ✅ Page load time unchanged (baseline)
- ✅ No memory leaks
- ✅ Component re-renders optimized

---

## 🚧 Future Enhancements

### Phase 2 (Post-Launch):

- Trainer-specific dashboard with session stats
- Filter "My Sessions" view for trainers
- Trainer activity logging
- Permission granularity (edit vs read-only)

### Phase 3 (Long-term):

- Role-based data filtering
- Trainer schedule management
- Member portal (different role)
- Advanced audit logging

---

## 📚 References

- **CLAUDE.md** - Project coding standards
- **docs/AUTH.md** - Authentication architecture
- **src/middleware.ts** - Server-side auth
- **src/hooks/use-auth.ts** - Auth hook patterns
- **src/lib/store.ts** - Auth state management

---

## 👥 Affected Users

| Trainer         | Email                         | Active Sessions | Status   |
| --------------- | ----------------------------- | --------------- | -------- |
| Karim El Ouardi | karim.elouardi@gymmanager.ma  | 359             | ✅ Ready |
| Omar Chakir     | omar.chakir@gymmanager.ma     | 167             | ✅ Ready |
| Youssef Bennani | youssef.bennani@gymmanager.ma | 2               | ✅ Ready |
| Samira Mouhib   | samira.mouhib@gymmanager.ma   | 2               | ✅ Ready |
| Fatima Alami    | fatima.alami@gymmanager.ma    | 0               | ✅ Ready |

**All trainers authenticated:** Yes (migration completed previously)
**Test credentials:** trainer123456

---

## 🔗 Related Features

- **auth-session-overhaul** - Base authentication system
- **members-table-rework** - Member management UI
- **training-sessions-rework** - Session management UI

---

**Last Updated:** Auto-generated on feature creation
**Next Review:** After US-005 completion
