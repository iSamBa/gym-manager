# US-005: Hide Admin-Only UI Features

**Story ID:** US-005
**Title:** Hide Admin-Only UI Features
**Priority:** P1 (Important)
**Complexity:** Small
**Estimated Time:** 25 minutes
**Status:** 🔴 Not Started

**Depends On:** US-002, US-003
**Blocks:** None

---

## 📖 User Story

**As a** system architect
**I want** to verify and document that admin-only UI features are properly hidden from trainers
**So that** trainers have a clean interface and don't see actions they cannot perform

---

## 💼 Business Value

- **Security:** Prevents confusion about permissions
- **Clean UX:** Trainers see only relevant features
- **Documentation:** Clear record of admin-only features
- **Quality assurance:** Verification step before release

---

## ✅ Acceptance Criteria

1. ✅ Machine availability toggle verified hidden from trainers (already implemented)
2. ✅ Export members button hidden from trainers (should be done in US-003)
3. ✅ Bulk operations hidden from trainers (if they exist)
4. ✅ Collaboration member fields hidden from trainers (if present)
5. ✅ Column visibility toggle checked (hide if admin-only)
6. ✅ All admin checks use `isAdmin` flag from `useAuth()` hook
7. ✅ Documentation updated listing all admin-only features
8. ✅ `npm run lint` passes with 0 errors/warnings

---

## 📝 Implementation Guide

### Step 1: Verify Machine Toggle (Already Protected)

**File:** `src/features/training-sessions/components/MachineAvailabilityToggle.tsx`

**Check lines 57-60:**

```typescript
const { isAdmin } = useAuth();

if (!isAdmin) return null;
```

✅ **Status:** Already implemented - no changes needed

---

### Step 2: Verify Export Button (From US-003)

**File:** `src/app/members/page.tsx`

**Verify wrapped with admin check:**

```typescript
{isAdmin && <ExportButton />}
```

✅ **Status:** Should be done in US-003

---

### Step 3: Search for Other Admin Features

**Run these commands to find potential admin-only features:**

```bash
# Search for admin checks
grep -r "isAdmin" src/app/members/
grep -r "isAdmin" src/app/training-sessions/

# Search for role checks
grep -r "role === \"admin\"" src/

# Search for export functionality
grep -r "export" src/app/members/
grep -r "Export" src/app/training-sessions/
```

**Review results and add checks where missing**

---

### Step 4: Document Admin-Only Features

**Update STATUS.md with this list:**

#### Admin-Only Features (Hidden from Trainers)

**Training Sessions:**

- ✅ Machine availability toggle

**Members:**

- ✅ Export members button
- ✅ Bulk operations (if present)
- ✅ Collaboration member fields
- ⚠️ Column visibility toggle (check if admin-only)

**System:**

- ✅ Dashboard page (/)
- ✅ Trainers management
- ✅ Payments page
- ✅ Subscription plans page
- ✅ Subscriptions page
- ✅ Studio settings

---

## 🧪 Verification Checklist

### Visual Inspection (Trainer Account)

**Training Sessions Page:**

- [ ] Machine toggle NOT visible
- [ ] Can see session list
- [ ] Can create/edit/cancel
- [ ] No admin-only buttons

**Members Page:**

- [ ] Export button NOT visible
- [ ] Bulk actions NOT visible (if exist)
- [ ] Can see member list
- [ ] Can create/edit members

**Member Form:**

- [ ] Collaboration fields NOT visible
- [ ] Can fill basic fields
- [ ] Form submits correctly

### Code Review

**Check all admin conditionals use isAdmin:**

```typescript
// ✅ GOOD
{isAdmin && <AdminFeature />}

// ❌ BAD
{user?.role === "admin" && <AdminFeature />}  // Should use isAdmin
```

---

## 📁 Files to Modify

Likely: **No file changes** (verification only)

**If changes needed:**

- Add admin checks where missing
- Update STATUS.md with findings

---

## 📝 Documentation Update

**Add to STATUS.md:**

````markdown
## Admin-Only Features

The following features are hidden from trainers:

### UI Components:

- Machine availability toggle (training sessions)
- Export members button
- Collaboration member fields
- [List any others found]

### Pages:

- Dashboard (/)
- Trainers management
- Payments
- Plans
- Subscriptions
- Settings

### Implementation Pattern:

```typescript
const { isAdmin } = useAuth();
{isAdmin && <AdminFeature />}
```
````

```

---

## ✨ Definition of Done

- [ ] All admin features verified
- [ ] Machine toggle checked (already done)
- [ ] Export button checked (from US-003)
- [ ] No additional admin features found OR properly hidden
- [ ] STATUS.md updated with admin features list
- [ ] Code review complete
- [ ] ESLint passes
- [ ] Build succeeds

---

## 📊 Metrics

**Estimated Time:** 25 minutes
**Actual Time:** _[Fill after completion]_
**Files Modified:** 0-2 (mostly verification)

---

## 🎯 Final Feature Verification

After completing this story, run the **complete testing checklist** from START-HERE.md:

- Trainer login and navigation
- All CRUD operations
- Admin UI features hidden
- No security issues
- Quality checks pass

**When all verified:** Feature is complete! Create PR to dev branch.

---

**Feature Complete!** 🎉
```
