# Member Profile Enhancement - Equipment & Referral Tracking

## 🎯 Feature Overview

This feature enhances member profiles by adding essential tracking capabilities for gym equipment sizing, distribution status, member acquisition channels, and training preferences.

### What This Feature Adds

**Equipment Management:**

- Uniform size tracking (XS, S, M, L, XL)
- Uniform distribution status (received/not received)
- Vest size tracking (V1, V2, V2 with extensions)
- Hip belt size tracking (V1, V2)

**Referral Tracking:**

- 7 acquisition channels: Instagram, Member Referral, Website IB, Prospection, Studio, Phone, Chatbot
- Conditional member referral selection when "Member Referral" is chosen
- Circular referral prevention

**Training Preferences:**

- Mixed vs Women-only session preference (for female members only)

All fields are required during member creation, editable afterward, and displayed in the member details view.

---

## 📁 Project Structure

```
user_stories/member-profile-equipment-referral/
├── START-HERE.md          (This file - Entry point)
├── AGENT-GUIDE.md         (Step-by-step implementation workflow)
├── README.md              (Feature documentation)
├── STATUS.md              (Progress tracking)
├── US-001-database-schema-extension.md
├── US-002-member-creation-form-enhancement.md
├── US-003-member-details-view-enhancement.md
└── US-004-member-edit-functionality.md
```

---

## 🚀 Quick Start

### For Implementing Agent

1. **Read this file first** to understand the feature scope
2. **Read AGENT-GUIDE.md** for the systematic implementation workflow
3. **Start with US-001** and follow the dependency order
4. **Update STATUS.md** after completing each milestone

### For Human Reviewer

1. **Read README.md** for business context and technical architecture
2. **Check STATUS.md** for current progress
3. **Review individual user stories** for acceptance criteria

---

## 📋 User Stories Summary

### US-001: Database Schema Extension

**Priority:** P0 (Must Have)
**Complexity:** Small
**Dependencies:** None

Adds new columns to the `members` table with proper ENUM types, constraints, and circular referral prevention.

**Key Deliverables:**

- Migration SQL with new columns
- Updated TypeScript types
- Database utility updates

---

### US-002: Member Creation Form Enhancement

**Priority:** P0 (Must Have)
**Complexity:** Medium
**Dependencies:** US-001

Extends the member creation form with new fields, conditional logic, and validation.

**Key Deliverables:**

- Updated `MemberForm.tsx` and form schema
- New form sections: `EquipmentSection`, `ReferralSection`, `TrainingPreferenceSection`
- Conditional field logic (referred_by, training_preference)

---

### US-003: Member Details View Enhancement

**Priority:** P0 (Must Have)
**Complexity:** Small
**Dependencies:** US-001

Displays new fields in the member details modal, grouped into logical sections.

**Key Deliverables:**

- Updated `MemberDetailsModal.tsx`
- Three new display sections: Equipment, Referral Info, Training Preferences

---

### US-004: Member Edit Functionality

**Priority:** P0 (Must Have)
**Complexity:** Medium
**Dependencies:** US-001, US-003

Enables editing of all new fields with proper validation rules.

**Key Deliverables:**

- Updated `EditMemberDialog.tsx`
- Validation: allow uniform size changes after distribution
- Circular referral prevention on edits

---

## 🎯 Acceptance Criteria (Feature-Level)

### Functional Requirements

✅ **Member Creation:**

- [ ] All new fields appear in member creation form
- [ ] All fields are required and validated
- [ ] "Referred by" field appears only when "Member Referral" is selected
- [ ] "Training preference" field appears only for female members
- [ ] Circular referrals are prevented
- [ ] Form submission saves all new fields correctly

✅ **Member Details View:**

- [ ] Equipment section displays: uniform size, received status, vest size, belt size
- [ ] Referral section displays: source, referring member (if applicable)
- [ ] Training preference section displays for female members
- [ ] All fields are properly formatted and labeled

✅ **Member Editing:**

- [ ] All new fields are editable
- [ ] Uniform size can be changed even after "received" is marked
- [ ] Validation prevents circular referrals
- [ ] Changes are saved correctly

### Technical Requirements

✅ **Database:**

- [ ] Migration creates all required columns
- [ ] ENUM types are defined correctly
- [ ] Foreign key constraint for `referred_by_member_id`
- [ ] Circular referral check constraint or trigger

✅ **Type Safety:**

- [ ] TypeScript types updated in `types.ts`
- [ ] No `any` types used
- [ ] Form schema matches database schema

✅ **Performance:**

- [ ] Components use React.memo where appropriate
- [ ] Event handlers wrapped in useCallback
- [ ] No unnecessary re-renders

✅ **Testing:**

- [ ] Unit tests for form validation
- [ ] Unit tests for circular referral prevention
- [ ] Integration tests for CRUD operations

---

## 🔗 Related Documentation

- **AGENT-GUIDE.md** - Implementation workflow
- **README.md** - Feature documentation
- **STATUS.md** - Progress tracking
- **CLAUDE.md** - Project coding standards
- **docs/TROUBLESHOOTING.md** - Common issues

---

## ⚠️ Important Notes

### Circular Referral Prevention

When implementing referral tracking, ensure:

- Member A cannot refer Member A (self-referral)
- Member A → Member B → Member A chains are prevented
- Use recursive CTE or application-level checks

### Conditional Field Logic

- `referred_by_member_id`: Only show/validate when `referral_source = 'member_referral'`
- `training_preference`: Only show/validate when `gender = 'female'`

### Equipment Inventory

Equipment inventory reporting is **NOT** part of this feature. This feature only tracks individual member equipment information.

---

## 🎓 Next Steps

1. ✅ Feature branch created: `feature/member-profile-equipment-referral`
2. ➡️ **Read AGENT-GUIDE.md** for implementation workflow
3. ➡️ **Start with US-001** (Database Schema Extension)
4. ➡️ Update STATUS.md as you progress

---

**Ready to implement? Open AGENT-GUIDE.md to begin!**
