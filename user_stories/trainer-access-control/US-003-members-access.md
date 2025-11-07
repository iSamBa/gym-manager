# US-003: Enable Trainer Access to Members

**Story ID:** US-003
**Title:** Enable Trainer Access to Members
**Priority:** P0 (Critical)
**Complexity:** Medium
**Estimated Time:** 45 minutes
**Status:** 🔴 Not Started

**Depends On:** US-001
**Blocks:** US-004

---

## 📖 User Story

**As a** trainer
**I want** to access member pages to view, create, and edit member profiles
**So that** I can manage member information and book them into sessions

---

## 💼 Business Value

- **Essential workflow:** Trainers need member access for session bookings
- **Member management:** Create and update member profiles
- **Data accuracy:** Trainers can maintain member information
- **Operational efficiency:** Self-service member management

---

## ✅ Acceptance Criteria

1. ✅ `/members` page uses `useRequireStaff` instead of `useRequireAdmin`
2. ✅ `/members/new` page uses `useRequireStaff` instead of `useRequireAdmin`
3. ✅ `/members/[id]` detail page adds staff auth check
4. ✅ Trainers can view all members (not filtered by trainer)
5. ✅ Trainers can create new members
6. ✅ Trainers can edit member profiles
7. ✅ Trainers can view member detail pages
8. ✅ Export button hidden from trainers (admin only)
9. ✅ Collaboration member fields hidden from trainers (if present)
10. ✅ `npm run lint` passes with 0 errors/warnings

---

## 📝 Implementation Guide

### Step 1: Update Members List Page

**File:** `src/app/members/page.tsx`

**Update Imports:**

```typescript
import { useRequireStaff } from "@/hooks/use-require-auth";
import { useAuth } from "@/hooks/use-auth";
```

**Update Hook Calls:**

```typescript
const { isLoading: isAuthLoading } = useRequireStaff("/login");
const { isAdmin } = useAuth();
```

**Remove hasRequiredRole Check:**

```typescript
// REMOVE
if (!hasRequiredRole) {
  return null;
}
```

**Hide Export Button (Find and Wrap):**
Search for export button and wrap:

```typescript
{isAdmin && (
  <Button onClick={handleExport}>
    <Download className="h-4 w-4 mr-2" />
    Export
  </Button>
)}
```

### Step 2: Update Members New Page

**File:** `src/app/members/new/page.tsx`

**Same changes as Step 1:**

- Import `useRequireStaff`
- Update hook call
- Remove `hasRequiredRole` check

**Check for Collaboration Fields:**
If `MemberForm` or `ProgressiveMemberForm` has collaboration fields:

```typescript
const { isAdmin } = useAuth();

// Wrap collaboration section
{isAdmin && (
  <div>
    <Label>Partnership Company</Label>
    <Input name="partnership_company" />
    {/* Other collaboration fields */}
  </div>
)}
```

### Step 3: Update Member Detail Page

**File:** `src/app/members/[id]/page.tsx`

**Add at Top of Component:**

```typescript
import { useRequireStaff } from "@/hooks/use-require-auth";

// Inside component
const { isLoading: isAuthLoading } = useRequireStaff("/login");

if (isAuthLoading) {
  return <LoadingSkeleton variant="detail" />;
}
```

---

## 🧪 Testing Checklist

### Functional Testing (Trainer Account)

**Members List:**

- [ ] Navigate to `/members`
- [ ] Page loads (no redirect)
- [ ] Can see all members
- [ ] Export button NOT visible
- [ ] Can search/filter members

**Create Member:**

- [ ] Click "Add Member"
- [ ] Form loads
- [ ] Can fill basic info
- [ ] Collaboration fields NOT visible
- [ ] Can submit form
- [ ] Member created

**View Member Detail:**

- [ ] Click member name
- [ ] Detail page loads
- [ ] Can see all member info
- [ ] Can see subscriptions
- [ ] Can see sessions

**Edit Member:**

- [ ] Click edit on detail page
- [ ] Edit form loads
- [ ] Can modify fields
- [ ] Collaboration fields NOT visible
- [ ] Can save changes

---

## 📁 Files to Modify

1. **src/app/members/page.tsx** (~10 lines)
2. **src/app/members/new/page.tsx** (~5 lines)
3. **src/app/members/[id]/page.tsx** (~8 lines)

---

## ✨ Definition of Done

- [ ] All 3 files updated
- [ ] Export button hidden from trainers
- [ ] Collaboration fields hidden (if present)
- [ ] ESLint passes
- [ ] Build succeeds
- [ ] Manual testing complete
- [ ] Admin functionality unchanged

---

**Next Step:** Proceed to US-004
