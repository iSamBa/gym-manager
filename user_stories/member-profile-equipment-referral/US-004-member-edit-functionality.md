# US-004: Member Edit Functionality

**Epic:** Member Profile Enhancement - Equipment & Referral Tracking
**Story ID:** US-004
**Priority:** P0 (Must Have)
**Complexity:** Medium (~45 minutes)
**Dependencies:** ✅ US-001 (Database Schema), ✅ US-003 (Details View)
**Status:** ✅ COMPLETED
**Completed:** 2025-10-07

**Implementation Notes:**

- Updated ProgressiveMemberForm with all new fields (equipment, referral, training preference)
- Added 3 new form steps: Equipment (step 4), Referral (step 5), Training Preference (step 6)
- All form sections pre-populate correctly with existing member data
- Conditional logic working: referred_by shows only for member_referral, training_preference only for females
- Circular referral prevention implemented (excludes current member from selector)
- Schema validation matches database constraints
- Linting passed with no errors

---

## 📝 User Story

**As a** gym administrator or front desk staff
**I want** to edit member equipment, referral, and training preference information
**So that** I can keep member records up-to-date when information changes

---

## 💼 Business Value

**Why This Matters:**

- **Flexibility:** Members can change sizes or preferences after registration
- **Data Accuracy:** Keep records current as circumstances change
- **Operational Efficiency:** Update information without contacting technical support
- **Member Experience:** Accommodate changes in member needs

**Use Cases:**

- Member tries uniform and needs different size
- Member changes training preference from mixed to women-only
- Correction needed in referral information
- Mark uniform as received when member picks it up

**Impact:**

- Without this: Data becomes stale, must create new records
- With this: Maintain single source of truth with current information

---

## ✅ Acceptance Criteria

### Edit Form

- [ ] **AC-001:** EditMemberDialog includes all new fields from US-002:
  - Equipment section (uniform_size, uniform_received, vest_size, hip_belt_size)
  - Referral section (referral_source, referred_by_member_id)
  - Training preference section (training_preference)

- [ ] **AC-002:** All form sections from US-002 are reused (no duplication)
  - Import and use EquipmentSection component
  - Import and use ReferralSection component
  - Import and use TrainingPreferenceSection component

- [ ] **AC-003:** Form pre-populates with existing member data:
  - All equipment fields show current values
  - Referral fields show current values
  - Training preference shows current value (if applicable)
  - Null values handled gracefully

### Validation

- [ ] **AC-004:** All validation rules from US-002 apply:
  - Required fields validated
  - Conditional validation (referred_by, training_preference)
  - ENUM values enforced

- [ ] **AC-005:** Uniform size can be changed even if uniform_received = true:
  - No constraint preventing this change
  - No warning message needed (explicitly allowed)

- [ ] **AC-006:** Circular referral prevention on edit:
  - Cannot change referred_by to create circular reference
  - Member selector excludes:
    - Current member (self-referral)
    - Any member that would create a loop
  - Validation error shown if attempted

### Conditional Logic

- [ ] **AC-007:** Same conditional logic as creation form:
  - "Referred By" field shown only if referral_source = 'member_referral'
  - Training preference section shown only if gender = 'female'
  - Values cleared when conditions change

- [ ] **AC-008:** Gender change behavior:
  - If gender changed from 'female' to 'male' → Clear training_preference
  - If gender changed from 'male' to 'female' → Show training preference section (blank)

### Save & Cancel

- [ ] **AC-009:** Save button:
  - Disabled during submission (loading state)
  - Updates member record with all changes
  - Shows success toast on success
  - Shows error toast on failure

- [ ] **AC-010:** Cancel button:
  - Discards all changes
  - Closes dialog
  - Reverts form to original values

- [ ] **AC-011:** Form dirty state tracking:
  - Unsaved changes prompt (optional but recommended)
  - Or: Simple cancel without confirmation

### Performance

- [ ] **AC-012:** Components use React.memo and useCallback
- [ ] **AC-013:** No unnecessary re-renders

### Type Safety

- [ ] **AC-014:** No TypeScript errors
- [ ] **AC-015:** No `any` types used

---

## 🔧 Technical Implementation

### Step 1: Update EditMemberDialog Component

**File:** `src/features/members/components/EditMemberDialog.tsx`

**Key Changes:**

1. **Import New Form Sections**

```typescript
import {
  PersonalInfoSection,
  ContactInfoSection,
  AddressSection,
  FitnessHealthSection,
  StatusSettingsSection,
  EquipmentSection,
  ReferralSection,
  TrainingPreferenceSection,
} from "./form-sections";
```

2. **Update Form Schema**
   Reuse the same schema from MemberForm.tsx (consider extracting to shared location):

```typescript
import { memberFormSchema } from "./MemberForm";
// Or define in shared location: src/features/members/lib/schemas.ts
```

3. **Update defaultValues**

```typescript
const form = useForm<MemberFormData>({
  resolver: zodResolver(memberFormSchema),
  defaultValues: member ? {
    // ... existing fields ...

    // Equipment fields
    uniform_size: member.uniform_size,
    uniform_received: member.uniform_received,
    vest_size: member.vest_size,
    hip_belt_size: member.hip_belt_size,

    // Referral fields
    referral_source: member.referral_source,
    referred_by_member_id: member.referred_by_member_id || undefined,

    // Training preference
    training_preference: member.training_preference || undefined,
  } : /* ... defaults ... */,
});
```

4. **Add Form Sections to Layout**
   Insert new sections in appropriate location (after existing sections):

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <PersonalInfoSection form={form} />
    <Separator />

    <ContactInfoSection form={form} />
    <Separator />

    <AddressSection form={form} />
    <Separator />

    <EquipmentSection form={form} />
    <Separator />

    <ReferralSection form={form} excludeMemberId={member?.id} />
    <Separator />

    <TrainingPreferenceSection form={form} />
    <Separator />

    <FitnessHealthSection form={form} />
    <Separator />

    <StatusSettingsSection form={form} />

    {/* Form Actions */}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save Changes
      </Button>
    </div>
  </form>
</Form>
```

### Step 2: Circular Referral Prevention in Edit Mode

**Update ReferralSection Component:**

Add `excludeMemberId` prop to exclude current member from selector:

```typescript
interface ReferralSectionProps {
  form: UseFormReturn<any>;
  excludeMemberId?: string; // Current member ID (edit mode)
}

export const ReferralSection = memo(function ReferralSection({
  form,
  excludeMemberId,
}: ReferralSectionProps) {
  // ... existing code ...

  // Filter members to exclude current member and prevent circular refs
  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      // Exclude current member (edit mode)
      if (excludeMemberId && m.id === excludeMemberId) return false;

      // Exclude members that would create circular reference
      // (This requires checking referral chain - implement as needed)
      return true;
    });
  }, [allMembers, excludeMemberId]);

  // Use filteredMembers in member selector
});
```

**Circular Referral Check Options:**

**Option A: Client-side recursive check**

```typescript
const wouldCreateCircularRef = (
  candidateId: string,
  currentMemberId: string
): boolean => {
  // Query member's referral chain
  // Check if currentMemberId appears in the chain
  // Return true if circular reference would be created
};
```

**Option B: Rely on database trigger (simpler)**

- Database trigger from US-001 will catch circular references
- Display error from API response
- Advantage: Single source of truth
- Disadvantage: Error shown after submit (not during selection)

**Recommended:** Option B (database trigger) for MVP, add client-side check if UX needs improvement.

### Step 3: Handle Gender Change

Add watch for gender field and clear training_preference if changed from female to male:

```typescript
const gender = form.watch("gender");
const previousGender = useRef(member?.gender);

useEffect(() => {
  // If gender changed from female to male, clear training_preference
  if (previousGender.current === "female" && gender === "male") {
    form.setValue("training_preference", undefined);
  }
  previousGender.current = gender;
}, [gender, form]);
```

### Step 4: Test Form Submission

Ensure update mutation includes all new fields:

```typescript
const handleSubmit = async (data: MemberFormData) => {
  try {
    await updateMember({
      id: member.id,
      ...data,
      // All new fields automatically included from data
    });

    toast.success("Member Updated", {
      description: "Member information updated successfully",
    });

    onSuccess(); // Close dialog, refresh data
  } catch (error) {
    toast.error("Update Failed", {
      description: error.message || "Failed to update member",
    });
  }
};
```

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] Form pre-populates with existing data
- [ ] All validations work in edit mode
- [ ] Gender change clears training_preference
- [ ] Uniform size can be changed when received = true

### Integration Tests

- [ ] Edit member → Change equipment fields → Save → Success
- [ ] Edit member → Change uniform size after received → Save → Success
- [ ] Edit member → Change referral source → Save → Success
- [ ] Edit member → Attempt circular referral → Error shown
- [ ] Edit female member → Change to male → Training pref cleared
- [ ] Edit male member → Change to female → Training pref section appears

### Manual Testing

- [ ] Open edit dialog → All fields pre-populated
- [ ] Change uniform size → Save → Verify in database
- [ ] Check uniform received → Save → Verify in database
- [ ] Change referral source to "Member Referral" → Referred by appears
- [ ] Select referring member → Save → Verify in database
- [ ] Change gender female → male → Training pref cleared
- [ ] Change all fields → Cancel → Changes discarded

---

## 📂 Files to Modify

### Modify:

- `src/features/members/components/EditMemberDialog.tsx` (main changes)
- `src/features/members/components/form-sections/ReferralSection.tsx` (add excludeMemberId prop)
- Potentially: Extract shared form schema to `src/features/members/lib/schemas.ts`

---

## 🚨 Potential Issues & Solutions

### Issue 1: Form Schema Duplication

**Problem:** MemberForm and EditMemberDialog have same schema

**Solution:**

- Extract schema to shared file: `src/features/members/lib/schemas.ts`
- Import in both components
- Reduces duplication, ensures consistency

### Issue 2: Circular Referral Detection Performance

**Problem:** Checking referral chain on every member selection could be slow

**Solution:**

- MVP: Rely on database trigger (catches on save)
- Enhancement: Lazy-check only when member selected (not on dropdown open)
- Cache referral chains if needed

### Issue 3: Unsaved Changes Warning

**Problem:** User might accidentally cancel with unsaved changes

**Solution:**

- MVP: No warning (simpler)
- Enhancement: Detect form dirty state with `formState.isDirty`
- Show confirmation dialog on cancel if dirty

### Issue 4: Uniform Size Change After Received

**Problem:** User might worry about changing size after marking received

**Solution:**

- No warning needed (explicitly allowed per requirements)
- Consider adding note text: "You can update the size even after the uniform has been received"

---

## ✅ Definition of Done

This user story is DONE when:

- [ ] EditMemberDialog updated with all new fields
- [ ] Form sections reused from US-002 (no duplication)
- [ ] Form pre-populates correctly
- [ ] All validations working
- [ ] Circular referral prevention implemented
- [ ] Uniform size can be changed after received
- [ ] Gender change clears training preference correctly
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Performance checklist completed
- [ ] Manually tested all scenarios
- [ ] STATUS.md updated with completion

---

## 🔗 Related User Stories

- **Depends on:** US-001 (Database Schema) - required for types
- **Depends on:** US-003 (Details View) - Edit button comes from details view
- **Reuses:** US-002 form sections - no duplication of components
- **Completes:** Full CRUD cycle for new fields (Create, Read, Update)

---

## 📝 Implementation Notes

**Component Reuse Strategy:**

- All form sections from US-002 are reused
- No duplication of validation logic
- Consistent UX between create and edit

**Schema Extraction:**
Consider creating `src/features/members/lib/schemas.ts`:

```typescript
export const memberFormSchema = z.object({
  // All form fields with validation
});

export type MemberFormData = z.infer<typeof memberFormSchema>;
```

Then import in both MemberForm and EditMemberDialog.

**Circular Referral Prevention:**

- Database trigger is primary enforcement
- Client-side validation optional (better UX but more complex)
- Error handling for circular ref errors from API

**Gender Change Behavior:**

- Automatic clearing prevents invalid data
- User can re-select training preference if changed back to female
- No data loss risk (training_preference is optional)

---

**Next Steps After Completion:**

1. Update STATUS.md (mark US-004 as COMPLETED)
2. Mark entire feature as COMPLETED
3. Run full test suite
4. Perform end-to-end testing
5. Prepare for PR/merge to main
