# US-002: Enable Trainer Access to Training Sessions

**Story ID:** US-002
**Title:** Enable Trainer Access to Training Sessions
**Priority:** P0 (Critical)
**Complexity:** Small
**Estimated Time:** 30 minutes
**Status:** 🔴 Not Started

**Depends On:** US-001
**Blocks:** US-004

---

## 📖 User Story

**As a** trainer
**I want** to access the training sessions pages to view, create, edit, and cancel sessions
**So that** I can manage training sessions for all members

---

## 💼 Business Value

- **Unblocks trainers:** 5 trainers managing 530+ active sessions
- **Core functionality:** Sessions are primary trainer responsibility
- **Business continuity:** Trainers can resume session management
- **User experience:** No more redirect loops

---

## ✅ Acceptance Criteria

1. ✅ `/training-sessions` page uses `useRequireStaff` instead of `useRequireAdmin`
2. ✅ `/training-sessions/new` page uses `useRequireStaff` instead of `useRequireAdmin`
3. ✅ Trainers can view all training sessions (all trainers, not filtered)
4. ✅ Trainers can create new training sessions
5. ✅ Machine availability toggle remains hidden from trainers (already implemented)
6. ✅ Trainers can edit and cancel sessions (verify SessionActionMenu works)
7. ✅ Loading states handled properly
8. ✅ `npm run lint` passes with 0 errors/warnings

---

## 🔧 Technical Scope

### Database Changes

❌ None (verify RLS policies allow trainers)

### API Changes

❌ None (uses existing endpoints)

### UI Changes

✅ Update 2 page files

### Tests Required

⚠️ Manual testing required

---

## 📝 Implementation Guide

### Step 1: Update Training Sessions List Page

**File:** `src/app/training-sessions/page.tsx`

**Line 7 - Update Import:**

```typescript
// Before
import { useRequireAdmin } from "@/hooks/use-require-auth";

// After
import { useRequireStaff } from "@/hooks/use-require-auth";
```

**Line 15 - Update Hook Call:**

```typescript
// Before
const { isLoading: isAuthLoading, hasRequiredRole } = useRequireAdmin("/login");

// After
const { isLoading: isAuthLoading } = useRequireStaff("/login");
```

**Lines 27-29 - Remove Role Check:**

```typescript
// REMOVE these lines:
if (!hasRequiredRole) {
  return null; // Will redirect to login
}

// KEEP only the loading check:
if (isAuthLoading) {
  return <LoadingSpinner />;
}
```

### Step 2: Update Training Sessions New Page

**File:** `src/app/training-sessions/new/page.tsx`

Apply the same 3 changes as Step 1:

1. Update import (line 10)
2. Update hook call (line 19)
3. Remove `hasRequiredRole` check (lines 34-36)

### Step 3: Verify Machine Toggle Protection

**File:** `src/features/training-sessions/components/MachineAvailabilityToggle.tsx`

**Check lines 57-60:**

```typescript
if (!isAdmin) return null;
```

✅ **No changes needed** - already protected

### Step 4: Quality Checks

```bash
# Run linting
npm run lint

# Build project
npm run build
```

**Expected:** 0 errors, 0 warnings, successful build

---

## 🧪 Testing Checklist

### Functional Testing (Trainer Account)

**Login:**

- [ ] Login as: karim.elouardi@gymmanager.ma
- [ ] Password: trainer123456
- [ ] Login succeeds without errors

**View Sessions:**

- [ ] Navigate to `/training-sessions`
- [ ] Page loads successfully (no redirect)
- [ ] Can see list of all sessions
- [ ] Can see sessions from all trainers (not just own)
- [ ] Session list displays correctly

**Create Session:**

- [ ] Click "New Session" button (or navigate to `/training-sessions/new`)
- [ ] Form loads correctly
- [ ] Can fill in session details
- [ ] Can select date/time
- [ ] Can add members
- [ ] Can submit form
- [ ] Session created successfully
- [ ] Redirects to sessions list

**Machine Toggle:**

- [ ] Machine availability toggle NOT visible on page
- [ ] No console errors about permissions

**Edit/Cancel Actions:**

- [ ] Can click edit on existing session
- [ ] Edit form loads
- [ ] Can save changes
- [ ] Can cancel session
- [ ] Actions complete successfully

### Admin Verification (Unchanged)

**Login as Admin:**

- [ ] Admin can still access `/training-sessions`
- [ ] Admin can create sessions
- [ ] Machine toggle IS visible for admin
- [ ] All admin features intact

---

## 📁 Files to Modify

### 1. src/app/training-sessions/page.tsx

**Lines Changed:** ~5 lines
**Changes:**

- Import: `useRequireStaff` instead of `useRequireAdmin`
- Hook call: Update to `useRequireStaff`
- Remove: `hasRequiredRole` check

### 2. src/app/training-sessions/new/page.tsx

**Lines Changed:** ~5 lines
**Changes:** Same as above

---

## ⚠️ Common Pitfalls

### Pitfall 1: Forgot to Remove hasRequiredRole Check

**Problem:** Page still redirects trainers
**Solution:** Remove the `if (!hasRequiredRole)` block entirely

### Pitfall 2: Import Path Wrong

**Problem:** Import error for `useRequireStaff`
**Solution:** Verify: `import { useRequireStaff } from "@/hooks/use-require-auth";`

### Pitfall 3: Machine Toggle Visible to Trainers

**Problem:** Toggle shows for trainers
**Solution:** Verify `MachineAvailabilityToggle.tsx` has admin check (should already exist)

---

## 🔍 RLS Policy Verification

**Check Database Policies:**

```sql
-- Verify trainers can read training_sessions
SELECT * FROM pg_policies
WHERE tablename = 'training_sessions';

-- Expected: Policies allow authenticated users OR check role includes 'trainer'
```

**If policies are admin-only, will need migration (not expected)**

---

## ✨ Definition of Done

- [ ] Both pages updated with `useRequireStaff`
- [ ] `hasRequiredRole` checks removed
- [ ] ESLint passes (0 errors/warnings)
- [ ] Build succeeds
- [ ] Trainer can view sessions
- [ ] Trainer can create sessions
- [ ] Machine toggle hidden from trainers
- [ ] Admin functionality unchanged
- [ ] Manual testing complete

---

## 📊 Metrics

**Estimated Time:** 30 minutes
**Actual Time:** _[Fill after completion]_
**Lines Changed:** ~10 lines
**Files Modified:** 2

---

**Next Step:** Proceed to US-003 (Members Access)
