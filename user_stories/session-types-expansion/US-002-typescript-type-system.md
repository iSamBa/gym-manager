# US-002: TypeScript Type System Updates

## User Story

**As a** developer
**I want** comprehensive TypeScript types for all session types
**So that** I have type safety and autocomplete throughout the application

---

## Business Value

**Priority**: P0 (Must Have)
**Complexity**: Small
**Estimated Time**: 1 hour

### Impact

- Prevents runtime errors through compile-time checking
- Improves developer experience with autocomplete
- Documents session type requirements in code
- Enables refactoring with confidence

---

## Acceptance Criteria

### AC-1: SessionType Enum Defined

**Given** I import SessionType from database types
**When** I check the available values
**Then** it should include all 7 types: trial, member, contractual, multi_site, collaboration, makeup, non_bookable

**Verification**:

```typescript
import type { SessionType } from "@/features/database/lib/types";
// Should autocomplete all 7 values
const type: SessionType = "multi_site"; // No TypeScript error
```

### AC-2: TrainingSession Interface Updated

**Given** the TrainingSession interface
**When** I check its properties
**Then** it should include:

- session_type: SessionType
- guest_first_name?: string | null
- guest_last_name?: string | null
- guest_gym_name?: string | null
- collaboration_details?: string | null

**Verification**:

```typescript
import type { TrainingSession } from "@/features/training-sessions/lib/types";
const session: TrainingSession = {
  id: "uuid",
  machine_id: "uuid",
  session_type: "multi_site", // No error
  guest_first_name: "John", // No error
  // ... other required fields
};
```

### AC-3: CreateSessionData Interface Updated

**Given** the CreateSessionData interface
**When** I create session data for different types
**Then** it should include optional fields for:

- Trial: new_member_first_name, new_member_last_name, new_member_phone, new_member_email, new_member_gender, new_member_referral_source
- Multi-Site: guest_first_name, guest_last_name, guest_gym_name
- Collaboration: collaboration_details
- Member/Contractual/Makeup: member_id (optional to handle non-bookable)

**Verification**:

```typescript
import type { CreateSessionData } from "@/features/training-sessions/lib/types";

// Trial session
const trialData: CreateSessionData = {
  session_type: "trial",
  new_member_first_name: "John",
  // ... all trial fields compile
};

// Multi-site session
const guestData: CreateSessionData = {
  session_type: "multi_site",
  guest_first_name: "Jane",
  // ... all guest fields compile
};
```

### AC-4: Type Guards Created

**Given** the type-guards.ts file exists
**When** I call each type guard function
**Then** they should return correct booleans for session types

**Verification**:

```typescript
import {
  isGuestSession,
  requiresMember,
  createsNewMember,
  bypassesWeeklyLimit,
  requiresTrialMember,
  countsTowardsCapacity,
} from "@/features/training-sessions/lib/type-guards";

// All should return true
isGuestSession("multi_site");
requiresMember("member");
createsNewMember("trial");
bypassesWeeklyLimit("makeup");
requiresTrialMember("contractual");
countsTowardsCapacity("trial");

// All should return false
isGuestSession("member");
requiresMember("multi_site");
createsNewMember("member");
bypassesWeeklyLimit("member");
requiresTrialMember("member");
countsTowardsCapacity("non_bookable");
```

### AC-5: No TypeScript Errors

**Given** the type system is updated
**When** I run `npm run build`
**Then** there should be 0 TypeScript errors

**Verification**:

```bash
npm run build
# Exit code 0, no errors
```

---

## Technical Implementation

### Files to Modify

#### 1. Database Types

**File**: `src/features/database/lib/types.ts`

```typescript
// Add SessionType enum
export type SessionType =
  | "trial" // Try-out session (creates trial member)
  | "member" // Regular member session
  | "contractual" // Contract signing (trial members only)
  | "multi_site" // Guest from partner gym
  | "collaboration" // Commercial partnership
  | "makeup" // Additional session (bypasses weekly limit)
  | "non_bookable"; // Time blocker
```

#### 2. Training Session Types

**File**: `src/features/training-sessions/lib/types.ts`

```typescript
import type { SessionType } from "@/features/database/lib/types";

// Update TrainingSession interface
export interface TrainingSession {
  id: string;
  machine_id: string;
  machine_number?: 1 | 2 | 3;
  machine_name?: string;
  trainer_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  session_date?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  session_type: SessionType; // Changed from 'trail' | 'standard'
  notes: string | null;

  // Guest information
  guest_first_name?: string | null;
  guest_last_name?: string | null;
  guest_gym_name?: string | null;
  collaboration_details?: string | null;

  // ... existing fields (trainer_name, participants, etc.)
}

// Update CreateSessionData
export interface CreateSessionData {
  machine_id: string;
  trainer_id?: string | null;
  scheduled_start: string;
  scheduled_end: string;
  session_type: SessionType;

  // Member selection (optional - not needed for guest sessions)
  member_id?: string;

  // Trial session - quick registration
  new_member_first_name?: string;
  new_member_last_name?: string;
  new_member_phone?: string;
  new_member_email?: string;
  new_member_gender?: "male" | "female";
  new_member_referral_source?: ReferralSource;

  // Guest session data
  guest_first_name?: string;
  guest_last_name?: string;
  guest_gym_name?: string;

  // Collaboration session data
  collaboration_details?: string;

  notes?: string;
}

// Update UpdateSessionData
export interface UpdateSessionData {
  machine_id?: string;
  trainer_id?: string | null;
  scheduled_start?: string;
  scheduled_end?: string;
  session_type?: SessionType;
  notes?: string;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  member_id?: string;

  // Guest fields (for updates)
  guest_first_name?: string;
  guest_last_name?: string;
  guest_gym_name?: string;
  collaboration_details?: string;
}
```

#### 3. Type Guards (New File)

**File**: `src/features/training-sessions/lib/type-guards.ts`

```typescript
import type { SessionType } from "./types";

/**
 * Check if session type is a guest session (no member_id)
 */
export function isGuestSession(type: SessionType): boolean {
  return ["multi_site", "collaboration", "non_bookable"].includes(type);
}

/**
 * Check if session type requires member selection
 */
export function requiresMember(type: SessionType): boolean {
  return ["member", "contractual", "makeup"].includes(type);
}

/**
 * Check if session type creates a new member (trial only)
 */
export function createsNewMember(type: SessionType): boolean {
  return type === "trial";
}

/**
 * Check if session type bypasses weekly limit
 */
export function bypassesWeeklyLimit(type: SessionType): boolean {
  return type === "makeup";
}

/**
 * Check if session type requires trial member filter
 */
export function requiresTrialMember(type: SessionType): boolean {
  return type === "contractual";
}

/**
 * Check if session type counts towards studio capacity
 */
export function countsTowardsCapacity(type: SessionType): boolean {
  return type !== "non_bookable";
}
```

### Export Updates

**File**: `src/features/training-sessions/lib/index.ts`

```typescript
// Add to exports
export * from "./type-guards";
```

---

## Testing Requirements

### Unit Tests

**File**: `src/features/training-sessions/lib/__tests__/type-guards.test.ts`

```typescript
import {
  isGuestSession,
  requiresMember,
  createsNewMember,
  bypassesWeeklyLimit,
  requiresTrialMember,
  countsTowardsCapacity,
} from "../type-guards";

describe("Session Type Guards", () => {
  describe("isGuestSession", () => {
    it("returns true for guest session types", () => {
      expect(isGuestSession("multi_site")).toBe(true);
      expect(isGuestSession("collaboration")).toBe(true);
      expect(isGuestSession("non_bookable")).toBe(true);
    });

    it("returns false for member session types", () => {
      expect(isGuestSession("trial")).toBe(false);
      expect(isGuestSession("member")).toBe(false);
      expect(isGuestSession("contractual")).toBe(false);
      expect(isGuestSession("makeup")).toBe(false);
    });
  });

  describe("requiresMember", () => {
    it("returns true for types requiring member selection", () => {
      expect(requiresMember("member")).toBe(true);
      expect(requiresMember("contractual")).toBe(true);
      expect(requiresMember("makeup")).toBe(true);
    });

    it("returns false for types not requiring member", () => {
      expect(requiresMember("trial")).toBe(false);
      expect(requiresMember("multi_site")).toBe(false);
      expect(requiresMember("collaboration")).toBe(false);
      expect(requiresMember("non_bookable")).toBe(false);
    });
  });

  describe("createsNewMember", () => {
    it("returns true only for trial sessions", () => {
      expect(createsNewMember("trial")).toBe(true);
    });

    it("returns false for all other session types", () => {
      expect(createsNewMember("member")).toBe(false);
      expect(createsNewMember("contractual")).toBe(false);
      expect(createsNewMember("multi_site")).toBe(false);
      expect(createsNewMember("collaboration")).toBe(false);
      expect(createsNewMember("makeup")).toBe(false);
      expect(createsNewMember("non_bookable")).toBe(false);
    });
  });

  describe("bypassesWeeklyLimit", () => {
    it("returns true only for makeup sessions", () => {
      expect(bypassesWeeklyLimit("makeup")).toBe(true);
    });

    it("returns false for all other session types", () => {
      expect(bypassesWeeklyLimit("trial")).toBe(false);
      expect(bypassesWeeklyLimit("member")).toBe(false);
      expect(bypassesWeeklyLimit("contractual")).toBe(false);
      expect(bypassesWeeklyLimit("multi_site")).toBe(false);
      expect(bypassesWeeklyLimit("collaboration")).toBe(false);
      expect(bypassesWeeklyLimit("non_bookable")).toBe(false);
    });
  });

  describe("requiresTrialMember", () => {
    it("returns true only for contractual sessions", () => {
      expect(requiresTrialMember("contractual")).toBe(true);
    });

    it("returns false for all other session types", () => {
      expect(requiresTrialMember("trial")).toBe(false);
      expect(requiresTrialMember("member")).toBe(false);
      expect(requiresTrialMember("multi_site")).toBe(false);
      expect(requiresTrialMember("collaboration")).toBe(false);
      expect(requiresTrialMember("makeup")).toBe(false);
      expect(requiresTrialMember("non_bookable")).toBe(false);
    });
  });

  describe("countsTowardsCapacity", () => {
    it("returns true for all types except non_bookable", () => {
      expect(countsTowardsCapacity("trial")).toBe(true);
      expect(countsTowardsCapacity("member")).toBe(true);
      expect(countsTowardsCapacity("contractual")).toBe(true);
      expect(countsTowardsCapacity("multi_site")).toBe(true);
      expect(countsTowardsCapacity("collaboration")).toBe(true);
      expect(countsTowardsCapacity("makeup")).toBe(true);
    });

    it("returns false for non_bookable sessions", () => {
      expect(countsTowardsCapacity("non_bookable")).toBe(false);
    });
  });
});
```

### TypeScript Compilation Test

```bash
npm run build
# Should exit with code 0, no errors
```

---

## Dependencies

**Depends On**: US-001 (Database schema must exist)
**Blocks**: US-003, US-004, US-005, US-006, US-007, US-008

---

## Definition of Done

- [x] SessionType enum added to database types (completed)
- [x] TrainingSession interface updated with guest fields
- [x] CreateSessionData interface updated with trial/guest fields
- [x] UpdateSessionData interface updated
- [x] type-guards.ts file created with 6 functions
- [x] All type guards exported from lib/index.ts
- [x] Unit tests written and passing (100% coverage)
- [x] TypeScript compilation successful (npm run build)
- [x] No TypeScript errors in IDE
- [x] All imports updated throughout codebase

---

## Notes

**Status**: ✅ Completed
**Completed**: 2025-10-26
**Implementation Notes**:

- Created comprehensive type system with 6 type guard functions (100% test coverage)
- Updated 10 files throughout codebase to use new SessionType enum
- Fixed legacy "trail"/"standard" types to "trial"/"member"
- Added guest/trial/collaboration fields to all relevant interfaces
- All tests passing, zero TypeScript errors, production build successful
