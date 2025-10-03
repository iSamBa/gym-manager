# US-002: Type Definitions for Enhanced Member Data

## User Story

**As a** frontend developer
**I want** TypeScript type definitions for the enhanced member data structure
**So that** I have type safety and autocomplete when working with the new member details

---

## Business Value

- **Developer Experience**: Autocomplete and IntelliSense support
- **Code Quality**: Compile-time type checking prevents runtime errors
- **Maintainability**: Self-documenting code through types

---

## Acceptance Criteria

### AC1: Base Type Extension

**Given** the existing `Member` interface
**When** I create `MemberWithEnhancedDetails`
**Then** it should:

- Extend the base `Member` interface
- Add optional subscription details
- Add optional session statistics
- Add optional payment information
- Use proper TypeScript type safety (no `any`)

### AC2: Nested Type Definitions

**Given** enhanced member data has nested structures
**When** I define sub-interfaces
**Then** I should create:

- `MemberSubscriptionDetails` for subscription data
- `MemberSessionStats` for session statistics
- All fields properly typed with correct TypeScript primitives

### AC3: Filter Interface Updates

**Given** new filtering capabilities are needed
**When** I update `MemberFilters` interface
**Then** it should include:

- `hasActiveSubscription?: boolean`
- `hasUpcomingSessions?: boolean`
- `hasOutstandingBalance?: boolean`
- `memberType?: 'full' | 'trial'`
- All existing filter fields remain unchanged

### AC4: Type Exports

**Given** types need to be used across the application
**When** I update the exports
**Then** all new types should be exported from:

- `src/features/database/lib/types.ts`
- Accessible via `@/features/database/lib/types` import

---

## Technical Implementation

### File: `src/features/database/lib/types.ts`

```typescript
/**
 * Subscription details for enhanced member view
 * Aggregated from active member_subscriptions
 */
export interface MemberSubscriptionDetails {
  /** Subscription end date */
  end_date: string;
  /** Remaining sessions from subscription */
  remaining_sessions: number;
  /** Outstanding balance (total_amount_snapshot - paid_amount) */
  balance_due: number;
}

/**
 * Session statistics for enhanced member view
 * Aggregated from training_session_members and training_sessions
 */
export interface MemberSessionStats {
  /** Date of last completed/attended session */
  last_session_date: string | null;
  /** Date of next scheduled session */
  next_session_date: string | null;
  /** Count of upcoming confirmed/waitlisted sessions */
  scheduled_sessions_count: number;
}

/**
 * Enhanced member data with subscription, session, and payment info
 * Used for comprehensive member table display
 */
export interface MemberWithEnhancedDetails extends Member {
  /** Active subscription details (null if no active subscription) */
  active_subscription?: MemberSubscriptionDetails | null;
  /** Session statistics (null if no sessions) */
  session_stats?: MemberSessionStats | null;
  /** Date of last completed payment (null if no payments) */
  last_payment_date: string | null;
}
```

### File: `src/features/database/lib/utils.ts`

```typescript
/**
 * Enhanced member filters with new capabilities
 */
export interface MemberFilters {
  // Existing filters
  status?: MemberStatus | MemberStatus[];
  search?: string;
  joinDateFrom?: string;
  joinDateTo?: string;
  limit?: number;
  offset?: number;
  orderBy?: "name" | "email" | "status" | "join_date" | "phone";
  orderDirection?: "asc" | "desc";

  // NEW: Enhanced filters
  /** Filter members with active subscriptions */
  hasActiveSubscription?: boolean;
  /** Filter members with upcoming sessions */
  hasUpcomingSessions?: boolean;
  /** Filter members with outstanding balance */
  hasOutstandingBalance?: boolean;
  /** Filter by member type */
  memberType?: "full" | "trial";
}
```

---

## Testing Criteria

### Type Safety Tests

**Test 1: Type Inference**

```typescript
// Should compile without errors
import { MemberWithEnhancedDetails } from "@/features/database/lib/types";

const member: MemberWithEnhancedDetails = {
  // Base member fields
  id: "uuid",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  status: "active",
  join_date: "2024-01-01",
  // ... other required Member fields

  // Enhanced fields (optional)
  active_subscription: {
    end_date: "2024-12-31",
    remaining_sessions: 10,
    balance_due: 100.0,
  },
  session_stats: {
    last_session_date: "2024-01-15T10:00:00Z",
    next_session_date: "2024-01-20T14:00:00Z",
    scheduled_sessions_count: 3,
  },
  last_payment_date: "2024-01-01",
};

// Verify: No TypeScript errors
// Verify: Autocomplete works for all fields
```

**Test 2: Optional Fields**

```typescript
// Should compile - enhanced fields are optional
const memberWithoutExtras: MemberWithEnhancedDetails = {
  id: "uuid",
  first_name: "Jane",
  last_name: "Smith",
  email: "jane@example.com",
  status: "active",
  join_date: "2024-01-01",
  // ... other required Member fields
  last_payment_date: null,
};

// Verify: No TypeScript errors
// Verify: active_subscription and session_stats can be undefined
```

**Test 3: Type Safety Violations**

```typescript
// Should NOT compile - type errors
const invalidMember: MemberWithEnhancedDetails = {
  // @ts-expect-error - balance_due should be number
  active_subscription: {
    end_date: "2024-12-31",
    remaining_sessions: 10,
    balance_due: "100.00", // ERROR: string instead of number
  },
};

// Verify: TypeScript error caught at compile time
```

**Test 4: Filter Type Safety**

```typescript
import { MemberFilters } from "@/features/database/lib/utils";

// Should compile
const validFilters: MemberFilters = {
  status: "active",
  memberType: "full",
  hasActiveSubscription: true,
  hasUpcomingSessions: true,
  hasOutstandingBalance: false,
};

// Should NOT compile
const invalidFilters: MemberFilters = {
  // @ts-expect-error - invalid member type
  memberType: "invalid", // ERROR: not 'full' | 'trial'
};

// Verify: Type errors caught
```

### Integration Tests

**Test 5: Import Paths**

```typescript
// Should successfully import from correct path
import {
  MemberWithEnhancedDetails,
  MemberSubscriptionDetails,
  MemberSessionStats,
} from "@/features/database/lib/types";

import { MemberFilters } from "@/features/database/lib/utils";

// Verify: All imports resolve correctly
// Verify: No circular dependencies
```

**Test 6: Backward Compatibility**

```typescript
// Existing code should still work
import { Member } from "@/features/database/lib/types";

const oldMember: Member = {
  id: "uuid",
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  status: "active",
  join_date: "2024-01-01",
  // ... other fields
};

// Verify: No breaking changes to existing types
```

---

## Code Quality Checks

### ESLint Rules Compliance

- [ ] No `any` types used
- [ ] All interfaces properly documented with JSDoc
- [ ] Consistent naming conventions
- [ ] No unused type parameters

### TypeScript Strict Mode

- [ ] All types compile with `strict: true`
- [ ] No implicit `any`
- [ ] Strict null checks pass
- [ ] No type assertions used unnecessarily

---

## Definition of Done

- [x] `MemberWithEnhancedDetails` interface created and exported
- [x] `MemberSubscriptionDetails` interface created and exported
- [x] `MemberSessionStats` interface created and exported
- [x] `MemberFilters` interface updated with new fields (4 new filter fields)
- [x] All types exported from correct module (`src/features/database/lib/types.ts`)
- [x] JSDoc comments added for all interfaces and fields
- [x] TypeScript compilation passes with no errors (0 errors in our changes)
- [x] All type safety tests pass (interfaces properly typed, no `any`)
- [x] No breaking changes to existing code (extends existing types)
- [x] Import paths verified (accessible via `@/features/database/lib/types`)
- [x] Code review completed
- [x] Documentation updated in CLAUDE.md if needed (N/A for type additions)

---

## Notes

### Design Decisions

**Why extend Member instead of composition?**

- Maintains backward compatibility
- Allows gradual adoption (fields are optional)
- Simplifies type guards and narrowing

**Why separate sub-interfaces?**

- Reusability across different contexts
- Clearer intent and documentation
- Easier to maintain and extend

**Why optional fields?**

- Not all members have subscriptions/sessions/payments
- Allows type to represent all states
- Avoids null pointer exceptions with proper checks

### Dependencies

- Existing `Member` interface
- Existing `MemberFilters` interface
- TypeScript 5.0+

### Risks

- None - purely additive changes
- Existing code continues to work unchanged

---

## Related User Stories

- US-001: Database Foundation for Enhanced Members Table
- US-003: API Layer Integration
- US-004: Table Component Updates
