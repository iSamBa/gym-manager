# AGENT-GUIDE.md - Implementation Workflow

## 🎯 Purpose

This guide provides a systematic, step-by-step workflow for implementing the Member Profile Enhancement feature. Follow this guide sequentially to ensure proper implementation order and dependency management.

---

## 📋 Pre-Implementation Checklist

Before starting any user story:

- [x] Feature branch created: `feature/member-profile-equipment-referral`
- [ ] Read CLAUDE.md performance optimization guidelines
- [ ] Read START-HERE.md for feature overview
- [ ] Check STATUS.md for current progress
- [ ] Ensure dev environment is running (`npm run dev`)
- [ ] Database connection is active (Supabase)

---

## 🔄 Implementation Workflow

### Phase 1: Database Foundation (US-001)

**User Story:** US-001 - Database Schema Extension

**Implementation Steps:**

1. **Create Migration File**

   ```bash
   # Use Supabase MCP tools to apply migration
   # Migration name: add_member_equipment_and_referral_fields
   ```

2. **Define ENUM Types**
   - `uniform_size_enum`: XS, S, M, L, XL
   - `vest_size_enum`: V1, V2, V2_SMALL_EXT, V2_LARGE_EXT, V2_DOUBLE_EXT
   - `hip_belt_size_enum`: V1, V2
   - `referral_source_enum`: instagram, member_referral, website_ib, prospection, studio, phone, chatbot
   - `training_preference_enum`: mixed, women_only

3. **Add Columns to members Table**
   - `uniform_size` (uniform_size_enum, NOT NULL)
   - `uniform_received` (boolean, NOT NULL DEFAULT false)
   - `vest_size` (vest_size_enum, NOT NULL)
   - `hip_belt_size` (hip_belt_size_enum, NOT NULL)
   - `referral_source` (referral_source_enum, NOT NULL)
   - `referred_by_member_id` (uuid, NULLABLE, FK to members.id)
   - `training_preference` (training_preference_enum, NULLABLE)

4. **Add Constraints**
   - Foreign key: `referred_by_member_id` → `members.id` ON DELETE SET NULL
   - Check constraint: Prevent self-referral (`referred_by_member_id != id`)
   - Check constraint: `training_preference` can only be set if `gender = 'female'`
   - Circular referral prevention (recursive CTE check or trigger)

5. **Update TypeScript Types** (`src/features/database/lib/types.ts`)
   - Add ENUM type definitions
   - Add fields to `Member` interface
   - Ensure no `any` types

6. **Test Migration**
   - Apply migration to development database
   - Verify ENUM types created
   - Verify columns added with correct constraints
   - Test circular referral prevention

**Files to Modify:**

- Migration SQL file (via Supabase MCP)
- `src/features/database/lib/types.ts`

**Acceptance Criteria:**

- [ ] Migration applies without errors
- [ ] All ENUM types created
- [ ] All columns added with correct types
- [ ] Foreign key constraint works
- [ ] Self-referral is blocked
- [ ] TypeScript types match database schema

**Update STATUS.md:** Mark US-001 as COMPLETED

---

### Phase 2: Member Creation Form (US-002)

**User Story:** US-002 - Member Creation Form Enhancement

**Dependencies:** ✅ US-001 must be completed

**Implementation Steps:**

1. **Update Form Schema** (`src/features/members/components/MemberForm.tsx`)
   - Add new fields to `memberFormSchema` (Zod)
   - Set validation rules matching database constraints
   - Add conditional validation for `referred_by_member_id` and `training_preference`

2. **Create Equipment Section Component**
   - File: `src/features/members/components/form-sections/EquipmentSection.tsx`
   - Fields: uniform_size, uniform_received, vest_size, hip_belt_size
   - Use shadcn/ui Select components for dropdowns
   - Use Checkbox for uniform_received

3. **Create Referral Section Component**
   - File: `src/features/members/components/form-sections/ReferralSection.tsx`
   - Field: referral_source (dropdown with 7 options)
   - Conditional field: referred_by_member_id (member selector, shown only if referral_source = 'member_referral')
   - Member selector: Use Combobox or Select with search
   - Prevent circular referrals in member selector

4. **Create Training Preference Section Component**
   - File: `src/features/members/components/form-sections/TrainingPreferenceSection.tsx`
   - Field: training_preference (RadioGroup: Mixed / Women Only)
   - Conditional rendering: Only show if gender = 'female'
   - Watch `gender` field to toggle visibility

5. **Update MemberForm Component**
   - Import new form sections
   - Add sections to form layout
   - Update `defaultValues` to include new fields
   - Ensure React.memo usage
   - Wrap event handlers in useCallback

6. **Update Form Sections Index**
   - File: `src/features/members/components/form-sections/index.ts`
   - Export new sections

7. **Test Form**
   - Test all field validations
   - Test conditional field visibility
   - Test circular referral prevention
   - Test form submission with new fields

**Files to Create:**

- `src/features/members/components/form-sections/EquipmentSection.tsx`
- `src/features/members/components/form-sections/ReferralSection.tsx`
- `src/features/members/components/form-sections/TrainingPreferenceSection.tsx`

**Files to Modify:**

- `src/features/members/components/MemberForm.tsx`
- `src/features/members/components/form-sections/index.ts`

**Acceptance Criteria:**

- [ ] All new fields appear in form
- [ ] Fields are properly validated
- [ ] Conditional fields work (referred_by, training_preference)
- [ ] Circular referrals are prevented
- [ ] Form submission includes all new fields
- [ ] No TypeScript errors
- [ ] Components use React.memo and useCallback

**Update STATUS.md:** Mark US-002 as COMPLETED

---

### Phase 3: Member Details View (US-003)

**User Story:** US-003 - Member Details View Enhancement

**Dependencies:** ✅ US-001 must be completed

**Implementation Steps:**

1. **Update MemberDetailsModal Component**
   - File: `src/features/members/components/MemberDetailsModal.tsx`
   - Add three new sections (following existing pattern)

2. **Add Equipment Section**
   - Insert after "Personal Information" section
   - Display:
     - Uniform Size: Badge with size
     - Uniform Received: Badge (Yes/No)
     - Vest Size: Badge with size
     - Hip Belt Size: Badge with size
   - Use lucide-react icons (e.g., Package, ShirtIcon)

3. **Add Referral Information Section**
   - Insert after Equipment section
   - Display:
     - Referral Source: Badge with channel name
     - Referred By: Link to member (if applicable)
   - Use lucide-react icons (e.g., UserPlus, TrendingUp)

4. **Add Training Preferences Section**
   - Insert after Referral section
   - Conditional rendering: Only show if member is female
   - Display:
     - Training Preference: Badge (Mixed / Women Only)
   - Use lucide-react icons (e.g., Users, User)

5. **Format Display Values**
   - Create helper functions for formatting ENUM values
   - Examples:
     - `V2_SMALL_EXT` → "V2 with Small Extension"
     - `member_referral` → "Member Referral"
     - `mixed` → "Mixed Sessions"

6. **Test Display**
   - Test with members having all field combinations
   - Test conditional sections (female members)
   - Test referred_by member link

**Files to Modify:**

- `src/features/members/components/MemberDetailsModal.tsx`

**Acceptance Criteria:**

- [ ] Equipment section displays all fields correctly
- [ ] Referral section displays source and referring member
- [ ] Training preference section shows for female members only
- [ ] All values are properly formatted
- [ ] Sections follow existing styling patterns
- [ ] No layout issues or overlaps

**Update STATUS.md:** Mark US-003 as COMPLETED

---

### Phase 4: Member Edit Functionality (US-004)

**User Story:** US-004 - Member Edit Functionality

**Dependencies:** ✅ US-001, US-003 must be completed

**Implementation Steps:**

1. **Update EditMemberDialog Component**
   - File: `src/features/members/components/EditMemberDialog.tsx`
   - Reuse form sections from US-002
   - Include Equipment, Referral, and Training Preference sections

2. **Update Edit Form Schema**
   - Same validation as creation form
   - Allow uniform size changes even if uniform_received = true
   - Prevent circular referrals (exclude current member from referral selector)

3. **Load Existing Values**
   - Pre-populate all new fields with current member data
   - Handle nullable fields (`referred_by_member_id`, `training_preference`)

4. **Implement Circular Referral Prevention**
   - When loading member selector, exclude:
     - Current member (self-referral)
     - Any member that would create a cycle
   - Add database query helper or client-side check

5. **Test Edit Functionality**
   - Test editing all new fields
   - Test uniform size change after received = true
   - Test circular referral prevention
   - Test conditional field visibility
   - Test save and cancel

**Files to Modify:**

- `src/features/members/components/EditMemberDialog.tsx`

**Potential Files to Create:**

- `src/features/members/lib/referral-utils.ts` (if circular check is complex)

**Acceptance Criteria:**

- [ ] All new fields are editable
- [ ] Existing values are pre-populated correctly
- [ ] Uniform size can be changed after received = true
- [ ] Circular referrals are prevented
- [ ] Conditional fields work correctly
- [ ] Changes save successfully
- [ ] Cancel discards changes

**Update STATUS.md:** Mark US-004 as COMPLETED

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] Form validation tests (US-002)
- [ ] Circular referral prevention logic (US-002, US-004)
- [ ] Conditional field rendering (US-002)
- [ ] Display formatting helpers (US-003)

### Integration Tests

- [ ] Create member with all new fields (US-002)
- [ ] View member details with new fields (US-003)
- [ ] Edit member with all new fields (US-004)
- [ ] Circular referral prevention end-to-end (US-002, US-004)

### Manual Testing

- [ ] Full member creation flow
- [ ] Member details view display
- [ ] Member edit flow
- [ ] Edge cases:
  - Female member with training preference
  - Male member (no training preference)
  - Member referral with referred_by
  - Direct acquisition (no referred_by)
  - Uniform size change after received = true

---

## 🚀 Deployment Checklist

Before merging to main:

- [ ] All user stories completed (US-001 through US-004)
- [ ] All tests passing (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Migration tested on development database
- [ ] No TypeScript errors
- [ ] Performance checklist completed (CLAUDE.md)
- [ ] STATUS.md updated to COMPLETED
- [ ] Feature tested end-to-end in development environment

---

## 📝 Commit Strategy

Follow conventional commit format:

```
feat(members): add equipment and referral tracking to member profiles

- Add database schema for equipment sizing and referral tracking
- Create form sections for equipment, referral, and training preferences
- Update member details view with new sections
- Implement circular referral prevention

Closes #[issue-number]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🔗 Quick Reference

- **START-HERE.md** - Feature overview
- **README.md** - Full documentation
- **STATUS.md** - Progress tracking
- **CLAUDE.md** - Coding standards
- **TROUBLESHOOTING.md** - Common issues

---

## ⚠️ Important Reminders

1. **Always read CLAUDE.md** before writing code
2. **Follow performance optimization guidelines**
3. **Use shadcn/ui components only**
4. **Update STATUS.md** after each milestone
5. **Run tests frequently** during development
6. **Commit after each user story** completion

---

**Ready to start? Begin with US-001-database-schema-extension.md**
