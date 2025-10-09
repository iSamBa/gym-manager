# US-005: Profile Header & Layout Restructure

**Epic:** Member Profile Enhancement - Equipment & Referral Tracking
**Story ID:** US-005
**Priority:** P0 (Must Have)
**Complexity:** Medium (~90 minutes)
**Dependencies:** ✅ US-001, US-002, US-003, US-004
**Status:** ✅ COMPLETED
**Completed Date:** 2025-10-08
**Implementation Notes:**

- All quality issues resolved (linting, component sizes, TypeScript)
- MemberProfileHeader: 93 lines (under 200 limit)
- Display components: 38-69 lines (under 100 limits)
- SubscriptionStatusCard: 87 lines (extracted for reusability)
- page.tsx: 396 lines (under 400 limit)
- 0 linting warnings, 0 TypeScript errors in US-005 files
- Build successful

---

## 📝 User Story

**As a** gym staff member
**I want** a redesigned member profile page with clear visual hierarchy and quick access to common actions
**So that** I can efficiently view member information and perform frequent operations without excessive navigation

---

## 💼 Business Value

**Why This Matters:**

- **Operational Efficiency:** Quick actions reduce clicks for common tasks (book session, record payment)
- **Information Clarity:** Card-based layout makes information easier to scan and digest
- **Professional Appearance:** Modern design improves user experience and staff satisfaction
- **Reduced Training:** Intuitive layout requires less staff onboarding time

**Impact:**

- Without this: Staff spend extra time navigating between modals and pages
- With this: Common operations accessible in 1-2 clicks from profile view

---

## ✅ Acceptance Criteria

### Profile Header Component

- [ ] **AC-001:** Create `MemberProfileHeader` component with:
  - Large avatar (80x80px) on left side
  - Member name (text-2xl font-bold)
  - Member ID badge (last 8 characters, variant="outline")
  - Member since date (text-sm text-muted-foreground)
  - Status badge (interactive MemberStatusBadge component)
  - Quick action buttons aligned to right

- [ ] **AC-002:** Quick action buttons (right side of header):
  - 📅 "Book Session" button (variant="outline")
  - 💰 "Record Payment" button (variant="outline")
  - ✏️ "Edit Profile" button (variant="outline")
  - 🗑️ "Delete" button (variant="destructive")
  - ~~Send Message button~~ (deferred - no messaging system)

- [ ] **AC-003:** Header layout responsive:
  - Desktop: Avatar left, buttons right, single row
  - Tablet: Avatar left, buttons wrap to second row
  - Mobile: Stack vertically (avatar + name, then buttons)

### Layout Restructuring

- [ ] **AC-004:** Page layout uses 2-column grid:
  - Main content: `lg:col-span-2` (2/3 width on desktop)
  - Sidebar: `lg:col-span-1` (1/3 width on desktop)
  - Mobile: Single column stack (main content first, then sidebar)

- [ ] **AC-005:** Remove tabs for Profile view:
  - Convert from Tabs to direct card layout
  - Keep existing tabs for Training Sessions, Subscriptions, Payments
  - Profile information displayed as primary view without tab click

### Display Component Conversion

- [ ] **AC-006:** Convert editor components to display-only versions:
  - Create `EquipmentDisplay.tsx` (shows badges, no dropdowns)
  - Create `ReferralDisplay.tsx` (shows text/link, no combobox)
  - Create `TrainingPreferenceDisplay.tsx` (shows badge, no dropdown)

- [ ] **AC-007:** Display components show formatted values:
  - Equipment: Uniform size badge, vest size badge, hip belt badge, uniform status pill
  - Referral: Source badge, referred-by clickable member link
  - Training: Preference badge (conditional on gender)

- [ ] **AC-008:** All display components are read-only:
  - No inline editing controls (dropdowns, switches, comboboxes)
  - Edit functionality accessed via "Edit Profile" button in header

### Performance & Technical

- [ ] **AC-009:** Apply performance optimizations:
  - `React.memo` on `MemberProfileHeader` component
  - `useCallback` for all quick action handlers
  - No prop drilling (use existing hooks where possible)

- [ ] **AC-010:** Component size constraints:
  - `MemberProfileHeader`: <200 lines
  - Display components: <100 lines each
  - Updated `page.tsx`: <400 lines

- [ ] **AC-011:** TypeScript strict typing:
  - Proper interfaces for all component props
  - No `any` types
  - Proper Member type usage

---

## 🔧 Technical Implementation

### Step 1: Create MemberProfileHeader Component

**File:** `src/features/members/components/MemberProfileHeader.tsx`

```tsx
"use client";

import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MemberAvatar, MemberStatusBadge } from "@/features/members/components";
import { Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import type { Member } from "@/features/database/lib/types";

interface MemberProfileHeaderProps {
  member: Member;
  onEdit: () => void;
  onDelete: () => void;
  onBookSession: () => void;
  onRecordPayment: () => void;
}

export const MemberProfileHeader = memo(function MemberProfileHeader({
  member,
  onEdit,
  onDelete,
  onBookSession,
  onRecordPayment,
}: MemberProfileHeaderProps) {
  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-4">
        <MemberAvatar member={member} size="xl" />

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {member.first_name} {member.last_name}
          </h1>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              ID: {member.id.slice(-8)}
            </Badge>
            <span className="text-muted-foreground text-sm">
              Member since {formatDate(new Date(member.join_date))}
            </span>
          </div>

          <MemberStatusBadge
            status={member.status}
            memberId={member.id}
            readonly={false}
          />
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onBookSession}>
          <Calendar className="mr-2 h-4 w-4" />
          Book Session
        </Button>
        <Button variant="outline" onClick={onRecordPayment}>
          <DollarSign className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
        <Button variant="outline" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
});
```

### Step 2: Create Display Components

**File:** `src/features/members/components/EquipmentDisplay.tsx`

```tsx
"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Member, VestSize } from "@/features/database/lib/types";

interface EquipmentDisplayProps {
  member: Member;
  className?: string;
}

const formatVestSize = (size: VestSize): string => {
  const mapping: Record<VestSize, string> = {
    V1: "V1",
    V2: "V2",
    V2_SMALL_EXT: "V2 with Small Extension",
    V2_LARGE_EXT: "V2 with Large Extension",
    V2_DOUBLE_EXT: "V2 with Double Extension",
  };
  return mapping[size];
};

export const EquipmentDisplay = memo(function EquipmentDisplay({
  member,
  className,
}: EquipmentDisplayProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">Uniform Size</span>
        <div>
          <Badge variant="outline">{member.uniform_size}</Badge>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">Uniform Status</span>
        <div>
          <Badge
            className={cn(
              member.uniform_received
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            )}
          >
            {member.uniform_received ? "✓ Received" : "⚠ Not Received"}
          </Badge>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">Vest Size</span>
        <div>
          <Badge variant="outline">{formatVestSize(member.vest_size)}</Badge>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">Hip Belt Size</span>
        <div>
          <Badge variant="outline">{member.hip_belt_size}</Badge>
        </div>
      </div>
    </div>
  );
});
```

**File:** `src/features/members/components/ReferralDisplay.tsx`

```tsx
"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Member, ReferralSource } from "@/features/database/lib/types";

interface ReferralDisplayProps {
  member: Member;
  className?: string;
}

const formatReferralSource = (source: ReferralSource): string => {
  const mapping: Record<ReferralSource, string> = {
    instagram: "Instagram",
    member_referral: "Member Referral",
    website_ib: "Website (Inbound)",
    prospection: "Prospection (Outbound)",
    studio: "Studio (Walk-in)",
    phone: "Phone",
    chatbot: "Chatbot",
  };
  return mapping[source];
};

export const ReferralDisplay = memo(function ReferralDisplay({
  member,
  className,
}: ReferralDisplayProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">Referral Source</span>
        <div>
          <Badge variant="outline">
            {formatReferralSource(member.referral_source)}
          </Badge>
        </div>
      </div>

      {member.referred_by_member_id && (
        <div className="space-y-1">
          <span className="text-muted-foreground text-sm">Referred By</span>
          <div>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link href={`/members/${member.referred_by_member_id}`}>
                View Member
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
```

**File:** `src/features/members/components/TrainingPreferenceDisplay.tsx`

```tsx
"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Member, TrainingPreference } from "@/features/database/lib/types";

interface TrainingPreferenceDisplayProps {
  member: Member;
  className?: string;
}

const formatTrainingPreference = (pref?: TrainingPreference): string => {
  if (!pref) return "Not Specified";
  return pref === "mixed" ? "Mixed Sessions" : "Women Only Sessions";
};

export const TrainingPreferenceDisplay = memo(
  function TrainingPreferenceDisplay({
    member,
    className,
  }: TrainingPreferenceDisplayProps) {
    if (member.gender !== "female") return null;

    return (
      <div className={cn("space-y-1", className)}>
        <span className="text-muted-foreground text-sm">
          Session Preference
        </span>
        <div>
          <Badge variant={member.training_preference ? "default" : "secondary"}>
            {formatTrainingPreference(member.training_preference)}
          </Badge>
        </div>
      </div>
    );
  }
);
```

### Step 3: Restructure page.tsx

Update `src/app/members/[id]/page.tsx`:

1. Add `MemberProfileHeader` import and usage
2. Replace tabs-based profile view with direct card layout
3. Update layout to 2-column grid
4. Replace editor components with display components
5. Add handlers for quick actions (Book Session, Record Payment)

**Key Changes:**

- Remove `<Tabs>` wrapper for Profile content
- Use `grid grid-cols-1 lg:grid-cols-3` for main layout
- Left column: `lg:col-span-2` (main content cards)
- Right column: `lg:col-span-1` (sidebar)
- Add `onBookSession` handler (opens AddSessionButton dialog)
- Add `onRecordPayment` handler (opens AddPaymentButton dialog)

### Step 4: Update Component Exports

**File:** `src/features/members/components/index.ts`

```typescript
// Add new exports
export { MemberProfileHeader } from "./MemberProfileHeader";
export { EquipmentDisplay } from "./EquipmentDisplay";
export { ReferralDisplay } from "./ReferralDisplay";
export { TrainingPreferenceDisplay } from "./TrainingPreferenceDisplay";

// Keep existing exports (EquipmentEditor, ReferralEditor, TrainingPreferenceEditor for edit mode)
```

---

## 🧪 Testing Checklist

### Visual Tests

- [ ] Header displays correctly on desktop/tablet/mobile
- [ ] Avatar size appropriate (xl = 80x80px)
- [ ] Quick action buttons aligned properly
- [ ] Status badge interactive and functional
- [ ] 2-column layout responsive

### Component Tests

- [ ] Display components show formatted values correctly
- [ ] Equipment uniform status shows correct color (green/amber)
- [ ] Referral "View Member" link navigates correctly
- [ ] Training preference conditional (female only)

### Functional Tests

- [ ] "Book Session" button opens correct dialog
- [ ] "Record Payment" button opens correct dialog
- [ ] "Edit Profile" button opens EditMemberDialog
- [ ] "Delete" button opens delete confirmation
- [ ] All quick actions work as expected

### Performance Tests

- [ ] React.memo prevents unnecessary re-renders
- [ ] useCallback applied to all handlers
- [ ] No prop drilling
- [ ] Component sizes within limits

---

## 📂 Files to Create/Modify

### Create

- `src/features/members/components/MemberProfileHeader.tsx`
- `src/features/members/components/EquipmentDisplay.tsx`
- `src/features/members/components/ReferralDisplay.tsx`
- `src/features/members/components/TrainingPreferenceDisplay.tsx`

### Modify

- `src/app/members/[id]/page.tsx` (major restructuring)
- `src/features/members/components/index.ts` (add exports)

---

## 🚨 Potential Issues & Solutions

### Issue 1: Quick Action Handlers

**Problem:** Book Session and Record Payment require existing dialogs/buttons

**Solution:**

- Reuse `AddSessionButton` component (extract dialog logic)
- Reuse `AddPaymentButton` component (extract dialog logic)
- Or: Use state to control dialog open/close from header

### Issue 2: Avatar Size

**Problem:** MemberAvatar may not support "xl" size

**Solution:**

- Check `MemberAvatar` component for size prop
- Add "xl" variant if needed: `h-20 w-20 text-2xl`

### Issue 3: Referred By Member Name

**Problem:** Need member name for "Referred By" link

**Solution:**

- Use existing member ID for navigation
- Text can be "View Member" instead of name
- Or: Fetch referring member data if needed

---

## ✅ Definition of Done

This user story is DONE when:

- [ ] All 11 acceptance criteria met
- [ ] All 4 new components created
- [ ] page.tsx restructured with new layout
- [ ] All tests passing (visual, functional, performance)
- [ ] No TypeScript errors
- [ ] Linting passes
- [ ] Component size limits respected (<300 lines)
- [ ] React.memo and useCallback applied
- [ ] Manually tested on desktop/tablet/mobile
- [ ] STATUS.md updated

---

## 🔗 Related User Stories

- **Depends on:** US-001, US-002, US-003, US-004
- **Enables:** US-006 (Information Cards), US-007 (Sidebar)
- **Foundation for:** Complete member profile redesign

---

## 📝 Implementation Notes

**Component Organization:**

- Display components are separate from Editor components
- Editors kept for use in EditMemberDialog (edit mode)
- Display components optimized for read-only viewing

**Quick Actions:**

- Book Session: Opens training session booking
- Record Payment: Opens payment recording dialog
- Edit Profile: Opens existing EditMemberDialog
- Delete: Opens existing ConfirmDialog

**Layout Strategy:**

- Mobile-first responsive design
- Cards stack vertically on mobile
- 2-column layout on desktop (main 2/3, sidebar 1/3)

---

**Next Steps After Completion:**

1. Mark US-005 as COMPLETED in STATUS.md
2. Test member profile view with various member types
3. Move to US-006 (Information Cards Implementation)
