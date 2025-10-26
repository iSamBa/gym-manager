# Session Types Expansion

## Overview

Comprehensive expansion of the training session booking system to support 7 distinct session types with dynamic form handling, guest session tracking, and visual differentiation through color coding.

---

## Business Value

### Current Problem

The existing system only supports 2 session types (trial/standard), which is insufficient for real-world gym operations:

- Cannot handle guests from partner gyms
- No way to track commercial collaborations
- Trial member creation requires separate workflow
- Make-up sessions counted against weekly limits
- No mechanism for blocking time slots
- Time-based colors don't convey session purpose

### Solution

A flexible session type system that:

- **Reduces booking time** by 50% through quick trial registration
- **Enables financial tracking** of multi-site and collaboration sessions
- **Improves schedule clarity** with purpose-based color coding
- **Supports business rules** (weekly limits, member filtering, capacity management)

---

## Feature Specifications

### Session Types

| Type              | Description            | Member Requirement       | Color     | Special Rules                     |
| ----------------- | ---------------------- | ------------------------ | --------- | --------------------------------- |
| **Trial**         | Try-out session        | Creates new trial member | Blue      | Quick registration (6 fields)     |
| **Member**        | Regular training       | Existing member          | Green     | Counts toward weekly limit        |
| **Contractual**   | Contract signing       | Trial members only       | Orange    | Filtered member selection         |
| **Multi-Site**    | Guest from partner gym | Guest (no member_id)     | Purple    | Stores gym name for billing       |
| **Collaboration** | Commercial partnership | Guest (no member_id)     | Lime      | Stores influencer/partner details |
| **Make-Up**       | Additional session     | Existing member          | Dark Blue | Bypasses weekly limit             |
| **Non-Bookable**  | Time blocker           | None                     | Red       | Doesn't count toward capacity     |

### Quick Trial Registration

**Fields Required**:

1. First Name \*
2. Last Name \*
3. Phone \*
4. Email \* (uniqueness checked)
5. Gender \* (male/female)
6. Referral Source \* (instagram, member_referral, website_ib, prospection, studio, phone, chatbot)

**Auto-Set Values**:

- `member_type`: 'trial'
- `status`: 'pending'
- `join_date`: today
- Creates `training_session_members` record automatically

### Guest Session Tracking

**Multi-Site Sessions**:

- Stores: guest_first_name, guest_last_name, guest_gym_name
- Purpose: Financial reconciliation with partner gyms
- No member record created

**Collaboration Sessions**:

- Stores: collaboration_details (free text)
- Purpose: Track influencer partnerships
- No member record created

---

## Technical Architecture

### Database Changes

**New Columns** (`training_sessions` table):

```sql
guest_first_name TEXT
guest_last_name TEXT
guest_gym_name TEXT
collaboration_details TEXT
```

**Updated Constraint** (`session_type`):

```sql
CHECK (session_type IN (
  'trial', 'member', 'contractual',
  'multi_site', 'collaboration',
  'makeup', 'non_bookable'
))
```

**Data Migration**:

- 'standard' → 'member' (547 rows updated)
- 'trail' → 'trial' (typo fix)

**Indexes**:

- `idx_training_sessions_session_type` - For filtering
- `idx_training_sessions_guest_gym` - For financial reports

### Type System

**Core Type**:

```typescript
export type SessionType =
  | "trial"
  | "member"
  | "contractual"
  | "multi_site"
  | "collaboration"
  | "makeup"
  | "non_bookable";
```

**Type Guards**:

```typescript
isGuestSession(type): boolean
requiresMember(type): boolean
createsNewMember(type): boolean
bypassesWeeklyLimit(type): boolean
requiresTrialMember(type): boolean
countsTowardsCapacity(type): boolean
```

### Component Hierarchy

```
SessionBookingDialog (orchestrator)
├─ SessionTypeSelector (step 1: choose type)
├─ Conditional Sections (step 2: based on type)
│   ├─ TrialMemberRegistration
│   ├─ MemberCombobox (filtered or all)
│   └─ GuestSessionInfo (multi-site or collaboration)
└─ Common Fields (machine, trainer, time, notes)
```

### Color System

**OLD** (Time-Based):

```typescript
// Removed: past (gray), today (blue), future (purple)
```

**NEW** (Session Type-Based):

```typescript
getSessionTypeColor(sessionType: SessionType): string
// Returns: Tailwind classes like "bg-blue-500 text-white"
```

### Business Logic

**Weekly Limit Calculation**:

```typescript
// Excludes makeup sessions
countWeeklyMemberSessions(sessions, memberId) {
  return sessions.filter(s =>
    s.member_id === memberId &&
    s.session_type !== 'makeup' &&
    s.status !== 'cancelled'
  ).length;
}
```

**Studio Capacity**:

```typescript
// Excludes non_bookable
countStudioSessions(sessions) {
  return sessions.filter(s =>
    s.session_type !== 'non_bookable' &&
    s.status !== 'cancelled'
  ).length;
}
```

**Member Filtering** (Contractual):

```typescript
// Only show trial members
members.filter((m) => m.member_type === "trial");
```

---

## Implementation Phases

### Phase 1: Foundation ✅

- **US-001**: Database schema expansion
- **US-002**: TypeScript type system

### Phase 2: Core Logic

- **US-003**: Validation schemas
- **US-004**: Session type colors

### Phase 3: UI Components

- **US-005**: Session type selector
- **US-006**: Trial member registration
- **US-007**: Guest session info

### Phase 4: Integration

- **US-008**: Dynamic booking form

---

## Testing Strategy

### Unit Tests

- **Type Guards**: All return correct booleans
- **Validation**: Each session type validates correctly
- **Colors**: Returns correct Tailwind classes
- **Business Logic**: Weekly limits, capacity counts

### Integration Tests

- **Trial Session**: Creates member + session
- **Multi-Site**: Saves guest data
- **Contractual**: Filters members correctly
- **Make-Up**: Bypasses weekly limit
- **Non-Bookable**: Excludes from capacity

### E2E/Manual Tests

- Complete booking flow for each type
- Form validation errors display
- Colors render correctly in calendar
- Email uniqueness prevents duplicates

---

## Performance Considerations

### Optimizations Applied

- ✅ Member filtering done client-side (acceptable - already loaded)
- ✅ Email uniqueness check with proper error handling
- ✅ Indexed columns for common queries (session_type, guest_gym_name)
- ✅ Memoized components (SessionTypeSelector, form components)

### Metrics

- **Database Queries**: +1 for email check (trial sessions only)
- **Form Render Time**: No impact (conditional mounting)
- **Bundle Size**: +~5KB (new components, tree-shakeable)

---

## Migration Guide

### For Existing Sessions

All 547 existing "standard" sessions automatically migrated to "member" type.

### For Existing Code

**Breaking Changes**:

- Replace 'trail' → 'trial' in any hardcoded strings
- Replace 'standard' → 'member' in any hardcoded strings
- Import SessionType from database types, not inline
- Update tests using old session types

**Non-Breaking**:

- Existing sessions continue to work
- API backwards compatible
- No UI disruption during migration

---

## Security Considerations

### Email Uniqueness

- Prevents duplicate trial member creation
- Returns user-friendly error message
- No sensitive data leaked in error

### Guest Data

- Stored in session table, not in members
- No authentication credentials stored
- Used only for financial reconciliation

### Validation

- All inputs sanitized through Zod schemas
- SQL injection prevented by Supabase parameterization
- XSS prevented by React escaping

---

## Future Enhancements

### P2 Features (Not in Scope)

- Session type analytics dashboard
- Bulk session type conversion tool
- Session type templates/presets
- Custom session type creation (admin)
- Session type-based pricing

### Potential Improvements

- Auto-suggest referral source based on history
- Integration with partner gym systems (API)
- Multi-language collaboration details
- Session type permissions (role-based)

---

## Success Metrics

### Operational

- **Booking Time**: Reduced by 50% for trial sessions
- **Data Accuracy**: 100% guest session tracking
- **Schedule Clarity**: Color coding improves at-a-glance understanding

### Technical

- **Test Coverage**: 100% for new code
- **Type Safety**: Zero `any` types, full TypeScript coverage
- **Performance**: No degradation in form load time
- **Maintainability**: Clear component boundaries, reusable pieces

---

## Glossary

- **Guest Session**: Session without a member_id (multi-site, collaboration)
- **Trial Member**: Member with member_type='trial', created during trial session
- **Make-Up Session**: Additional session that doesn't count toward weekly limit
- **Non-Bookable**: Time slot blocker, doesn't count toward studio capacity
- **Session Type**: Category defining session purpose and business rules

---

## References

- **Design**: Reference screenshot showing 7 colored session type buttons
- **Database Schema**: `docs/RPC_SIGNATURES.md`
- **Project Standards**: `CLAUDE.md`
- **User Stories**: Individual US-XXX.md files in this directory

---

**Status**: In Progress
**Last Updated**: 2025-10-26
**Version**: 1.0.0
