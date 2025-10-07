# US-003: Member Details View Enhancement

**Epic:** Member Profile Enhancement - Equipment & Referral Tracking
**Story ID:** US-003
**Priority:** P0 (Must Have)
**Complexity:** Small (~30 minutes)
**Dependencies:** ✅ US-001 (Database Schema Extension)

---

## 📝 User Story

**As a** gym staff member
**I want** to view equipment, referral, and training preference information in the member details modal
**So that** I can quickly access complete member information without navigating elsewhere

---

## 💼 Business Value

**Why This Matters:**

- **Quick Access:** Staff can instantly see equipment sizes and distribution status
- **Referral Insights:** Understand how member joined for better communication
- **Training Planning:** Know member preferences for session scheduling
- **Operational Efficiency:** All information in one view reduces clicks/navigation

**Impact:**

- Without this: Staff must guess sizes or check external records
- With this: Complete member profile available in 1 click

---

## ✅ Acceptance Criteria

### Display Requirements

- [ ] **AC-001:** Equipment section displays after "Personal Information" section with:
  - Section header "Equipment Information" with Package icon
  - Uniform Size: Badge showing size (XS, S, M, L, XL)
  - Uniform Received: Badge showing "Received" (green) or "Not Received" (gray)
  - Vest Size: Badge with formatted size (e.g., "V2 with Small Extension")
  - Hip Belt Size: Badge showing size (V1, V2)

- [ ] **AC-002:** Referral Information section displays after Equipment section with:
  - Section header "Referral Information" with UserPlus icon
  - Referral Source: Badge with formatted channel name (e.g., "Member Referral", "Instagram")
  - Referred By: Link to referring member (if applicable)
    - Format: "{First Name} {Last Name}"
    - Clicking opens that member's detail modal
    - Only shown if referred_by_member_id is not null

- [ ] **AC-003:** Training Preferences section displays after Referral section with:
  - Conditional rendering: ONLY shown if member.gender = 'female'
  - Section header "Training Preferences" with Users icon
  - Training Preference: Badge showing "Mixed Sessions" or "Women Only Sessions"
  - If training_preference is null: Display "Not Specified" in secondary badge

### Formatting & Styling

- [ ] **AC-004:** ENUM values formatted for display:
  - `V2_SMALL_EXT` → "V2 with Small Extension"
  - `V2_LARGE_EXT` → "V2 with Large Extension"
  - `V2_DOUBLE_EXT` → "V2 with Double Extension"
  - `member_referral` → "Member Referral"
  - `website_ib` → "Website (Inbound)"
  - `prospection` → "Prospection (Outbound)"
  - All other values: Capitalize first letter

- [ ] **AC-005:** Sections follow existing modal styling:
  - Consistent spacing between sections (Separator component)
  - Consistent heading styles (flex items-center gap-2, font-medium)
  - Consistent grid layout for fields (grid grid-cols-1 gap-4 md:grid-cols-2)
  - Badges use appropriate variants (default, secondary)

### Interaction

- [ ] **AC-006:** Clicking "Referred By" member name:
  - Closes current member detail modal
  - Opens new modal for referring member
  - Or: Opens referring member profile page (if routing implemented)

- [ ] **AC-007:** Sections are read-only (no inline editing)
  - Use "Edit" button at top to modify fields

### Conditional Rendering

- [ ] **AC-008:** Training Preferences section:
  - Hidden completely if member.gender != 'female'
  - No empty section or placeholder shown

- [ ] **AC-009:** Referred By field:
  - Hidden if referred_by_member_id is null
  - Only "Referral Source" shown in that case

---

## 🔧 Technical Implementation

### Step 1: Create Formatting Helper Functions

Add to `MemberDetailsModal.tsx` or separate utility file:

```typescript
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

const formatTrainingPreference = (pref?: TrainingPreference): string => {
  if (!pref) return "Not Specified";
  return pref === "mixed" ? "Mixed Sessions" : "Women Only Sessions";
};
```

### Step 2: Add Equipment Section to MemberDetailsModal

Insert after "Personal Information" section (around line 256):

```tsx
<Separator />;

{
  /* Equipment Information */
}
<div>
  <h3 className="mb-3 flex items-center gap-2 font-medium">
    <Package className="h-4 w-4" />
    Equipment Information
  </h3>
  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
    <div>
      <span className="text-muted-foreground">Uniform Size:</span>
      <div className="mt-1">
        <Badge variant="outline">{member.uniform_size}</Badge>
      </div>
    </div>
    <div>
      <span className="text-muted-foreground">Uniform Status:</span>
      <div className="mt-1">
        <Badge variant={member.uniform_received ? "default" : "secondary"}>
          {member.uniform_received ? "Received" : "Not Received"}
        </Badge>
      </div>
    </div>
    <div>
      <span className="text-muted-foreground">Vest Size:</span>
      <div className="mt-1">
        <Badge variant="outline">{formatVestSize(member.vest_size)}</Badge>
      </div>
    </div>
    <div>
      <span className="text-muted-foreground">Hip Belt Size:</span>
      <div className="mt-1">
        <Badge variant="outline">{member.hip_belt_size}</Badge>
      </div>
    </div>
  </div>
</div>;
```

### Step 3: Add Referral Information Section

Insert after Equipment section:

```tsx
<Separator />;

{
  /* Referral Information */
}
<div>
  <h3 className="mb-3 flex items-center gap-2 font-medium">
    <UserPlus className="h-4 w-4" />
    Referral Information
  </h3>
  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
    <div>
      <span className="text-muted-foreground">Referral Source:</span>
      <div className="mt-1">
        <Badge variant="outline">
          {formatReferralSource(member.referral_source)}
        </Badge>
      </div>
    </div>
    {member.referred_by_member_id && member.referred_by_member && (
      <div>
        <span className="text-muted-foreground">Referred By:</span>
        <div className="mt-1">
          <Button
            variant="link"
            className="h-auto p-0 text-sm"
            onClick={() =>
              handleViewReferringMember(member.referred_by_member_id)
            }
          >
            {member.referred_by_member.first_name}{" "}
            {member.referred_by_member.last_name}
          </Button>
        </div>
      </div>
    )}
  </div>
</div>;
```

**Note:** Requires fetching referring member data. Options:

1. Join in query: Fetch member with `referred_by_member` relation
2. Lazy load: Fetch when modal opens
3. Store name in denormalized field (not recommended)

**Recommended:** Extend Member query to include referred_by_member relation.

### Step 4: Add Training Preferences Section

Insert after Referral section (conditional):

```tsx
{
  member.gender === "female" && (
    <>
      <Separator />

      {/* Training Preferences */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-medium">
          <Users className="h-4 w-4" />
          Training Preferences
        </h3>
        <div className="text-sm">
          <span className="text-muted-foreground">Session Preference:</span>
          <div className="mt-1">
            <Badge
              variant={member.training_preference ? "default" : "secondary"}
            >
              {formatTrainingPreference(member.training_preference)}
            </Badge>
          </div>
        </div>
      </div>
    </>
  );
}
```

### Step 5: Update Member Query (if needed)

If referring member name needs to be displayed, update the query to include relation:

**File:** Member query hook (e.g., `useMember` or in MemberDetailsModal)

```typescript
const { data: member } = useQuery({
  queryKey: ["member", memberId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("members")
      .select(
        `
        *,
        referred_by_member:members!referred_by_member_id(
          id,
          first_name,
          last_name
        )
      `
      )
      .eq("id", memberId)
      .single();

    if (error) throw error;
    return data;
  },
});
```

### Step 6: Handle Referring Member Click

Add handler function:

```typescript
const handleViewReferringMember = useCallback(
  (referringMemberId: string) => {
    // Option 1: If using modal approach
    onClose(); // Close current modal
    // Then trigger opening new modal with referringMemberId
    // (requires callback from parent)

    // Option 2: If using routing
    router.push(`/members/${referringMemberId}`);

    // For now: Simple implementation - close modal and log
    console.log("View referring member:", referringMemberId);
    onClose();
  },
  [onClose]
);
```

---

## 🧪 Testing Checklist

### Visual Tests

- [ ] Equipment section displays correctly
- [ ] Referral section displays correctly
- [ ] Training preference section shows for female members
- [ ] Training preference section hidden for male members
- [ ] All badges styled consistently
- [ ] Spacing matches existing sections

### Data Display Tests

- [ ] Member with all equipment fields → All displayed
- [ ] Member with "Member Referral" → Referring member shown
- [ ] Member with direct referral → Only source shown (no referring member)
- [ ] Female member with preference → Preference shown
- [ ] Female member without preference → "Not Specified" shown
- [ ] Male member → No training preference section

### Formatting Tests

- [ ] V2_SMALL_EXT → "V2 with Small Extension"
- [ ] member_referral → "Member Referral"
- [ ] instagram → "Instagram"
- [ ] mixed → "Mixed Sessions"
- [ ] women_only → "Women Only Sessions"

### Interaction Tests

- [ ] Click "Edit" button → All new fields included in edit form
- [ ] Click referring member name → Expected action (modal/route)

---

## 📂 Files to Modify

### Modify:

- `src/features/members/components/MemberDetailsModal.tsx`
- Potentially: Member query hooks to include referred_by_member relation

---

## 🚨 Potential Issues & Solutions

### Issue 1: Referred By Member Data Not Available

**Problem:** Member query doesn't include referring member relation

**Solution:**

- Update query to join referred_by_member
- Add type definition for joined relation
- Handle null case gracefully

### Issue 2: Clicking Referred By Link Behavior

**Problem:** Unclear what should happen when clicking referring member

**Solution:**

- For MVP: Close current modal (simple)
- Future: Open referring member modal (requires parent callback)
- Best: Navigate to member profile page (if routing exists)

### Issue 3: Long Vest Size Names

**Problem:** "V2 with Double Extension" might cause layout issues

**Solution:**

- Use Badge with ellipsis if needed
- Or: Adjust grid to single column on mobile
- Test with actual data

---

## ✅ Definition of Done

This user story is DONE when:

- [ ] All three sections added to MemberDetailsModal
- [ ] Formatting helpers implemented
- [ ] Conditional rendering working (female/training pref, referred_by)
- [ ] Styling consistent with existing sections
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Manually tested with various member types
- [ ] STATUS.md updated with completion

---

## 🔗 Related User Stories

- **Depends on:** US-001 (Database Schema) - must be completed first
- **Related to:** US-004 (Edit Functionality) - Edit button leads to editing these fields
- **Enables:** Complete member information visibility

---

## 📝 Implementation Notes

**Section Order:**

1. Contact Information (existing)
2. Personal Information (existing)
3. **Equipment Information** (new)
4. **Referral Information** (new)
5. **Training Preferences** (new, conditional)
6. Fitness Goals (existing)
7. Medical Conditions (existing)
8. Notes (existing)
9. Compliance (existing)

**Badge Color Scheme:**

- Equipment sizes: `variant="outline"` (neutral)
- Uniform received: `variant="default"` (green) if received, `variant="secondary"` (gray) if not
- Referral source: `variant="outline"`
- Training preference: `variant="default"` if set, `variant="secondary"` if "Not Specified"

**Icons Used:**

- Equipment: `Package` from lucide-react
- Referral: `UserPlus` from lucide-react
- Training: `Users` from lucide-react

---

**Next Steps After Completion:**

1. Update STATUS.md (mark US-003 as COMPLETED)
2. Test member details view with various member profiles
3. Move to US-004 (Member Edit Functionality)
