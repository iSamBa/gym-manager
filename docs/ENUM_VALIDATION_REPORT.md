# Enum Validation Report - Phase 3.2

**Generated**: 2025-10-19
**Purpose**: Document discrepancies between TypeScript enums and database CHECK constraints

---

## Summary

This report identifies mismatches between TypeScript type definitions and PostgreSQL CHECK constraints. These discrepancies create type safety risks where the database allows values that TypeScript doesn't recognize.

## Severity Levels

- 🔴 **CRITICAL**: Complete mismatch, will cause runtime errors
- 🟡 **HIGH**: Missing values, potential runtime errors if database contains unrecognized values
- 🟢 **LOW**: Minor inconsistency, no immediate risk

---

## Findings

### 🟡 HIGH: BookingStatus Mismatch

**TypeScript** (`src/features/database/lib/types.ts:58`):

```typescript
export type BookingStatus = "confirmed" | "cancelled";
```

**Database** (`training_session_members.booking_status_check`):

```sql
CHECK ((booking_status = ANY (ARRAY[
  'confirmed'::text,
  'waitlisted'::text,     ← Missing in TypeScript
  'cancelled'::text,
  'no_show'::text,        ← Missing in TypeScript
  'attended'::text        ← Missing in TypeScript
])))
```

**Impact**: If database contains `'waitlisted'`, `'no_show'`, or `'attended'` bookings, TypeScript won't recognize them, causing type errors.

**Recommendation**: Update TypeScript type to include all database values:

```typescript
export type BookingStatus =
  | "confirmed"
  | "waitlisted" // Added
  | "cancelled"
  | "no_show" // Added
  | "attended"; // Added
```

---

### 🟡 HIGH: UserRole Mismatch

**TypeScript** (`src/features/database/lib/types.ts:5`):

```typescript
export type UserRole = "admin" | "trainer";
```

**Database** (`user_profiles.role_check`):

```sql
CHECK ((role = ANY (ARRAY[
  'admin'::text,
  'trainer'::text,
  'member'::text          ← Missing in TypeScript
])))
```

**Impact**: Database allows `'member'` role, but TypeScript doesn't. If a user profile has role='member', it will cause type errors.

**Recommendation**: Update TypeScript type:

```typescript
export type UserRole = "admin" | "trainer" | "member";
```

**Note**: Verify if members actually use user_profiles table or if this is legacy.

---

### 🟢 LOW: SubscriptionStatus Extra Value

**TypeScript** (`src/features/database/lib/types.ts:29-35`):

```typescript
export type SubscriptionStatus =
  | "active"
  | "paused"
  | "cancelled"
  | "expired"
  | "pending"
  | "completed";      ← NOT in database CHECK constraint
```

**Database** (`member_subscriptions.status_check`):

```sql
CHECK ((status = ANY (ARRAY[
  'active'::text,
  'paused'::text,
  'cancelled'::text,
  'expired'::text,
  'pending'::text
])))
-- 'completed' is NOT allowed by database!
```

**Impact**: TypeScript allows `'completed'` but database will reject it with a CHECK constraint violation.

**Recommendation**: Either:

1. Remove `"completed"` from TypeScript type, OR
2. Add `'completed'` to database CHECK constraint

**Investigation needed**: Check if any code uses `status: 'completed'`. If not, remove from TypeScript.

---

### ✅ VERIFIED: Correct Enums

The following enums match their database CHECK constraints correctly:

| Enum            | TypeScript Values                               | Database Values | Status  |
| --------------- | ----------------------------------------------- | --------------- | ------- |
| MemberStatus    | active, inactive, suspended, expired, pending   | ✅ Same         | Correct |
| Gender          | male, female                                    | ✅ Same         | Correct |
| EquipmentStatus | active, maintenance, out_of_order, retired      | ✅ Same         | Correct |
| ClassStatus     | scheduled, in_progress, completed, cancelled    | ✅ Same         | Correct |
| PaymentStatus   | pending, completed, failed, refunded, cancelled | ✅ Same         | Correct |
| PaymentMethod   | cash, card, bank_transfer, online, check        | ✅ Same         | Correct |

---

### 📝 NOTE: SessionType Not Used

**Finding**: The generic `SessionType` enum in `database/lib/types.ts` is NOT used for the `training_sessions` table.

```typescript
// database/lib/types.ts (UNUSED for training_sessions)
export type SessionType =
  | "personal_training"
  | "small_group"
  | "consultation"
  | "assessment";
```

**Actual usage** (`training-sessions/lib/types.ts`):

```typescript
interface TrainingSession {
  session_type: "trail" | "standard"; // Inline type, matches database
}
```

**Recommendation**:

- Keep `SessionType` as-is (might be used elsewhere or legacy)
- Training sessions correctly use inline types
- Document that `SessionType` != `training_sessions.session_type`

---

## Recommended Actions

### Immediate (Phase 3.2)

1. **Fix BookingStatus** - Add missing values to prevent type errors
2. **Fix UserRole** - Add 'member' or verify it's not needed
3. **Investigate SubscriptionStatus** - Remove 'completed' or add to database

### Code Changes Required

**File**: `src/features/database/lib/types.ts`

```typescript
// Line 5: Update UserRole
export type UserRole = "admin" | "trainer" | "member";

// Line 29-35: Update SubscriptionStatus (Option 1: Remove 'completed')
export type SubscriptionStatus =
  | "active"
  | "paused"
  | "cancelled"
  | "expired"
  | "pending";
// Removed: | "completed"

// Line 58: Update BookingStatus
export type BookingStatus =
  | "confirmed"
  | "waitlisted"
  | "cancelled"
  | "no_show"
  | "attended";
```

---

## Testing Checklist

After applying fixes:

- [ ] Run TypeScript compiler - no errors
- [ ] Search codebase for usages of 'completed' subscription status
- [ ] Search codebase for usages of 'waitlisted', 'no_show', 'attended' booking statuses
- [ ] Run full test suite
- [ ] Verify no runtime type errors in production

---

## Maintenance

**Future Prevention**: Add a CI check or script that compares TypeScript enums to database CHECK constraints and fails if mismatches are detected.

**Script idea**:

```bash
# Generate enum validation report
npm run validate:enums

# Or as pre-commit hook
npm run validate:db-types
```

---

**Last Updated**: 2025-10-19
**Related**: Phase 3 - Database-Frontend Unification Plan
