# US-003: Validation Schema Updates

## User Story

**As a** developer
**I want** comprehensive validation for all session types
**So that** invalid session data is caught before reaching the database

---

## Business Value

**Priority**: P0 (Must Have)
**Complexity**: Small
**Estimated Time**: 45 minutes

### Impact

- Prevents invalid data submission
- Provides user-friendly error messages
- Ensures data integrity
- Reduces backend errors

---

## Acceptance Criteria

### AC-1: Trial Session Validation

- Requires: new_member_first_name, new_member_last_name, new_member_phone, new_member_email, new_member_gender, new_member_referral_source
- Email must be valid format
- All fields must be non-empty strings

### AC-2: Member/Contractual/Makeup Validation

- Requires: member_id (valid UUID)
- Optional: trainer_id, notes

### AC-3: Multi-Site Validation

- Requires: guest_first_name, guest_last_name, guest_gym_name
- All must be non-empty strings
- NO member_id required

### AC-4: Collaboration Validation

- Requires: collaboration_details (non-empty string)
- NO member_id required

### AC-5: Non-Bookable Validation

- NO member_id required
- Optional: notes only

---

## Technical Implementation

**File**: `src/features/training-sessions/lib/validation.ts`

```typescript
import { z } from "zod";

export const createSessionSchema = z
  .object({
    machine_id: z.string().uuid(),
    trainer_id: z.string().uuid().optional().nullable(),
    scheduled_start: z.string(),
    scheduled_end: z.string(),
    session_type: z.enum([
      "trial",
      "member",
      "contractual",
      "multi_site",
      "collaboration",
      "makeup",
      "non_bookable",
    ]),

    // Member selection
    member_id: z.string().uuid().optional(),

    // Trial fields
    new_member_first_name: z.string().min(1).optional(),
    new_member_last_name: z.string().min(1).optional(),
    new_member_phone: z.string().min(1).optional(),
    new_member_email: z.string().email().optional(),
    new_member_gender: z.enum(["male", "female"]).optional(),
    new_member_referral_source: z
      .enum([
        "instagram",
        "member_referral",
        "website_ib",
        "prospection",
        "studio",
        "phone",
        "chatbot",
      ])
      .optional(),

    // Guest fields
    guest_first_name: z.string().min(1).optional(),
    guest_last_name: z.string().min(1).optional(),
    guest_gym_name: z.string().min(1).optional(),
    collaboration_details: z.string().min(1).optional(),

    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Trial: requires new member fields
      if (data.session_type === "trial") {
        return !!(
          data.new_member_first_name &&
          data.new_member_last_name &&
          data.new_member_phone &&
          data.new_member_email &&
          data.new_member_gender &&
          data.new_member_referral_source
        );
      }

      // Member, contractual, makeup: require member_id
      if (["member", "contractual", "makeup"].includes(data.session_type)) {
        return !!data.member_id;
      }

      // Multi-site: requires guest data
      if (data.session_type === "multi_site") {
        return !!(
          data.guest_first_name &&
          data.guest_last_name &&
          data.guest_gym_name
        );
      }

      // Collaboration: requires details
      if (data.session_type === "collaboration") {
        return !!data.collaboration_details;
      }

      // Non-bookable: no requirements
      return true;
    },
    {
      message: "Required fields missing for this session type",
      path: ["session_type"],
    }
  );
// ... existing time validations
```

---

## Testing Requirements

**File**: `src/features/training-sessions/lib/__tests__/validation.test.ts`

```typescript
describe("Session Type Validation", () => {
  it("validates trial session with all fields", () => {
    const valid = createSessionSchema.parse({
      session_type: "trial",
      new_member_first_name: "John",
      new_member_last_name: "Doe",
      new_member_phone: "1234567890",
      new_member_email: "john@test.com",
      new_member_gender: "male",
      new_member_referral_source: "instagram",
      // ... required fields
    });
    expect(valid).toBeDefined();
  });

  it("rejects trial session missing fields", () => {
    expect(() =>
      createSessionSchema.parse({
        session_type: "trial",
        // missing new_member_* fields
      })
    ).toThrow();
  });

  it("validates member session with member_id", () => {
    const valid = createSessionSchema.parse({
      session_type: "member",
      member_id: "valid-uuid",
      // ... required fields
    });
    expect(valid).toBeDefined();
  });

  it("validates multi_site with guest data", () => {
    const valid = createSessionSchema.parse({
      session_type: "multi_site",
      guest_first_name: "Jane",
      guest_last_name: "Smith",
      guest_gym_name: "Partner Gym",
      // ... required fields
    });
    expect(valid).toBeDefined();
  });

  it("validates collaboration with details", () => {
    const valid = createSessionSchema.parse({
      session_type: "collaboration",
      collaboration_details: "Influencer partnership",
      // ... required fields
    });
    expect(valid).toBeDefined();
  });

  it("validates non_bookable without member", () => {
    const valid = createSessionSchema.parse({
      session_type: "non_bookable",
      // NO member_id needed
      // ... required fields
    });
    expect(valid).toBeDefined();
  });
});
```

---

## Dependencies

**Depends On**: US-002 (Types must exist)
**Blocks**: US-006, US-007, US-008

---

## Definition of Done

- [x] createSessionSchema updated with all session types
- [x] Conditional validation implemented with .refine()
- [x] updateSessionSchema updated similarly
- [x] All test cases written and passing (34 tests)
- [x] TypeScript compilation successful
- [x] No validation bypasses or workarounds

---

## Notes

**Status**: ✅ Completed
**Completed**: 2025-10-26
**Implementation Notes**:

- Comprehensive conditional validation for all 7 session types
- 34 unit tests with 100% coverage (all passing)
- Email validation, UUID validation, empty string checks
- Clear error messages for all validation failures
- Both createSessionSchema and updateSessionSchema updated
