# Member Profile Enhancement - Equipment & Referral Tracking

## 📖 Overview

This feature enhances the gym management system's member profiles by adding comprehensive equipment sizing, distribution tracking, referral source analytics, and training session preferences. These additions enable better operational efficiency, inventory management insights, and marketing channel attribution.

---

## 🎯 Business Value

### Problems Solved

1. **Manual Equipment Tracking**
   - **Before:** Staff manually track equipment sizes and distribution on paper/spreadsheets
   - **After:** Digital tracking integrated into member profiles with instant access

2. **Missing Referral Data**
   - **Before:** No visibility into how members discover the gym
   - **After:** Complete referral source tracking with member-to-member attribution

3. **Limited Training Preferences**
   - **Before:** Female members must manually communicate session preferences
   - **After:** Preferences stored in profile for better session planning

### Expected Outcomes

- **Operational Efficiency:** 50% reduction in time spent tracking equipment
- **Marketing Insights:** Data-driven understanding of acquisition channels
- **Member Experience:** Personalized training session recommendations
- **Inventory Planning:** Future-ready for equipment inventory analytics

---

## 👥 User Personas

### Primary Users

**1. Gym Administrator**

- **Goals:** Efficient member onboarding, accurate record-keeping
- **Benefits:** Streamlined data entry during member registration

**2. Front Desk Staff**

- **Goals:** Quick access to member equipment information
- **Benefits:** Instant visibility of equipment sizes and distribution status

**3. Gym Manager**

- **Goals:** Understand member acquisition, optimize marketing spend
- **Benefits:** Referral source analytics and reporting capabilities

### Secondary Users

**4. Equipment Manager** (Future)

- **Goals:** Track inventory needs, plan purchases
- **Benefits:** Member equipment data foundation for inventory system

---

## ✨ Features

### 1. Equipment Sizing & Tracking

**Uniform Size**

- Sizes: XS, S, M, L, XL
- Required field during member creation
- Editable at any time (even after distribution)

**Uniform Distribution Status**

- Boolean flag: Received / Not Received
- Tracks whether member picked up their uniform
- Default: Not Received

**Vest Size**

- Options: V1, V2, V2 with Small Extension, V2 with Large Extension, V2 with Double Extension
- Required field for all members

**Hip Belt Size**

- Options: V1, V2
- Required field for all members

**Use Cases:**

- New member registration: Capture all sizing information upfront
- Equipment distribution: Check off uniform distribution
- Size updates: Adjust sizes if member needs changes

---

### 2. Referral Source Tracking

**Acquisition Channels:**

1. Instagram
2. Member Referral
3. Website IB (Inbound)
4. Prospection (Outbound sales)
5. Studio (Walk-in)
6. Phone
7. Chatbot

**Member Referral Logic:**

- When "Member Referral" is selected → Show member selector
- Member selector allows choosing which existing member referred them
- Circular referral prevention:
  - Cannot refer themselves
  - Cannot create referral loops (A → B → A)

**Use Cases:**

- Marketing analysis: Identify highest-performing acquisition channels
- Referral programs: Track member-to-member referrals for incentives
- ROI calculation: Attribute members to marketing campaigns

---

### 3. Training Session Preferences

**Training Preference (Female Members Only):**

- Options: Mixed Sessions / Women Only Sessions
- Conditional field: Only appears/applies to female members
- Nullable: Not required (allows member to decide later)

**Use Cases:**

- Session planning: Schedule appropriate sessions based on preferences
- Member experience: Respect cultural/personal preferences
- Gym operations: Balance mixed and women-only class offerings

---

## 🏗️ Technical Architecture

### Database Schema

**Table:** `members`

**New Columns:**

| Column                  | Type    | Nullable | Default | Constraints                                                               |
| ----------------------- | ------- | -------- | ------- | ------------------------------------------------------------------------- |
| `uniform_size`          | ENUM    | NO       | -       | XS, S, M, L, XL                                                           |
| `uniform_received`      | BOOLEAN | NO       | false   | -                                                                         |
| `vest_size`             | ENUM    | NO       | -       | V1, V2, V2_SMALL_EXT, V2_LARGE_EXT, V2_DOUBLE_EXT                         |
| `hip_belt_size`         | ENUM    | NO       | -       | V1, V2                                                                    |
| `referral_source`       | ENUM    | NO       | -       | 7 channels (see above)                                                    |
| `referred_by_member_id` | UUID    | YES      | NULL    | FK → members.id, CHECK (id != referred_by_member_id)                      |
| `training_preference`   | ENUM    | YES      | NULL    | mixed, women_only, CHECK (gender='female' OR training_preference IS NULL) |

**ENUM Types:**

```sql
CREATE TYPE uniform_size_enum AS ENUM ('XS', 'S', 'M', 'L', 'XL');
CREATE TYPE vest_size_enum AS ENUM ('V1', 'V2', 'V2_SMALL_EXT', 'V2_LARGE_EXT', 'V2_DOUBLE_EXT');
CREATE TYPE hip_belt_size_enum AS ENUM ('V1', 'V2');
CREATE TYPE referral_source_enum AS ENUM ('instagram', 'member_referral', 'website_ib', 'prospection', 'studio', 'phone', 'chatbot');
CREATE TYPE training_preference_enum AS ENUM ('mixed', 'women_only');
```

**Constraints:**

- Self-referral prevention: `referred_by_member_id != id`
- Training preference constraint: Only female members can have training preference
- Foreign key: `referred_by_member_id` → `members.id` ON DELETE SET NULL

**Circular Referral Prevention:**
Implemented via recursive CTE check or database trigger to prevent referral loops.

---

### Frontend Components

**New Components:**

1. **EquipmentSection.tsx**
   - Form section for equipment fields
   - Used in MemberForm and EditMemberDialog
   - Dropdowns for sizes, checkbox for uniform_received

2. **ReferralSection.tsx**
   - Form section for referral tracking
   - Dropdown for referral_source
   - Conditional member selector for referred_by

3. **TrainingPreferenceSection.tsx**
   - Form section for training preferences
   - RadioGroup for preference selection
   - Conditional rendering based on gender

**Modified Components:**

1. **MemberForm.tsx**
   - Integrate new form sections
   - Update Zod schema with new validations
   - Conditional field logic

2. **MemberDetailsModal.tsx**
   - Add Equipment display section
   - Add Referral Info display section
   - Add Training Preferences display section (conditional)

3. **EditMemberDialog.tsx**
   - Reuse form sections from MemberForm
   - Pre-populate with existing data
   - Handle nullable fields

---

### Type Definitions

**TypeScript Types (types.ts):**

```typescript
export type UniformSize = "XS" | "S" | "M" | "L" | "XL";
export type VestSize =
  | "V1"
  | "V2"
  | "V2_SMALL_EXT"
  | "V2_LARGE_EXT"
  | "V2_DOUBLE_EXT";
export type HipBeltSize = "V1" | "V2";
export type ReferralSource =
  | "instagram"
  | "member_referral"
  | "website_ib"
  | "prospection"
  | "studio"
  | "phone"
  | "chatbot";
export type TrainingPreference = "mixed" | "women_only";

export interface Member {
  // ... existing fields ...
  uniform_size: UniformSize;
  uniform_received: boolean;
  vest_size: VestSize;
  hip_belt_size: HipBeltSize;
  referral_source: ReferralSource;
  referred_by_member_id?: string;
  training_preference?: TrainingPreference;
  // ... existing fields ...
}
```

---

## 🧪 Testing Strategy

### Unit Tests

1. **Form Validation**
   - Test all field validations (required fields, enum values)
   - Test conditional field visibility (referred_by, training_preference)
   - Test circular referral prevention logic

2. **Display Formatting**
   - Test ENUM value formatting helpers
   - Test conditional section rendering

### Integration Tests

1. **Member Creation**
   - Create member with all equipment fields
   - Create member with member referral
   - Create female member with training preference
   - Verify circular referral prevention

2. **Member Details View**
   - Load member and verify all fields display correctly
   - Verify conditional sections render appropriately

3. **Member Edit**
   - Edit equipment fields
   - Change uniform size after received = true
   - Edit referral information
   - Test circular referral prevention on edit

### E2E Tests (Manual)

1. **Full Member Lifecycle**
   - Create → View → Edit → Save
   - Test all field combinations
   - Verify database persistence

---

## 📊 Success Metrics

### Operational Metrics

- **Data Completeness:** 100% of new members have equipment sizing data
- **Equipment Distribution:** Tracking rate of uniform pickup
- **Time Savings:** Reduction in manual equipment tracking time

### Business Metrics

- **Referral Attribution:** % of members from each acquisition channel
- **Member Referral Rate:** % of members acquired through member referrals
- **Preference Tracking:** % of female members specifying session preferences

---

## 🚀 Future Enhancements

### Phase 2: Equipment Inventory Management

- Aggregate member sizing data for inventory planning
- Equipment distribution dashboard
- Automated reorder suggestions based on size distribution

### Phase 3: Referral Program

- Referral leaderboard (top referring members)
- Automated referral rewards/credits
- Referral campaign tracking

### Phase 4: Advanced Analytics

- Acquisition channel ROI analysis
- Cohort analysis by referral source
- Predictive modeling for member retention by acquisition channel

---

## 📚 Related Documentation

- **START-HERE.md** - Quick start guide
- **AGENT-GUIDE.md** - Implementation workflow
- **STATUS.md** - Progress tracking
- **CLAUDE.md** - Project coding standards

---

## 🤝 Contributors

- **Feature Design:** Gym Manager
- **Implementation:** Claude Code Agent
- **Review:** Development Team

---

## 📝 Change Log

### Version 1.0.0 (Initial Release)

- Equipment sizing fields (uniform, vest, hip belt)
- Uniform distribution tracking
- Referral source tracking with member attribution
- Training session preferences for female members
- Circular referral prevention
- Full CRUD support (create, view, edit)

---

**Status:** In Development
**Target Release:** TBD
**Feature Branch:** `feature/member-profile-equipment-referral`
