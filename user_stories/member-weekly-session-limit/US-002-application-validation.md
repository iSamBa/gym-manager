# US-002: Application-Level Booking Validation

## 📋 User Story

**As a** gym administrator or trainer

**I want** real-time validation when booking sessions

**So that** I receive immediate feedback if a member has reached their weekly limit and can choose an alternative session type

---

## 🎯 Business Value

**Why This Matters**:

- Provides instant feedback to users before submission
- Guides users to correct action (use makeup session instead)
- Prevents wasted time and frustration
- Ensures smooth booking workflow
- Leverages database validation for data integrity

**Impact**:

- **User Experience**: Immediate, clear error messages
- **Efficiency**: Guides users to correct solution (makeup session)
- **Data Quality**: Prevents invalid bookings at application layer
- **Support Reduction**: Self-service error resolution

---

## ✅ Acceptance Criteria

### AC1: Validation Integrated in Booking Hook

**Given** a trainer/admin is booking a "member" session

**When** they submit the booking form

**Then** the system should check the weekly limit before creating the session

**Verification**: Code inspection in `use-training-sessions.ts`

---

### AC2: Block Second Member Session

**Given** a member has 1 "member" session this week

**When** I try to book another "member" session for the same week

**Then** the booking should fail with error: "Member already has 1 member session booked this week. Please use the 'Makeup' session type for additional sessions."

**Verification**: Manual UI test

**Steps**:

1. Book a "member" session for Member A on Monday
2. Try to book another "member" session for Member A on Wednesday
3. Verify error toast appears with proper message
4. Verify session was NOT created in database

---

### AC3: Allow Makeup Sessions Regardless

**Given** a member has 1 "member" session this week

**When** I book a "makeup" session for the same week

**Then** the booking should succeed without validation

**Verification**: Manual UI test

**Steps**:

1. Member A has 1 "member" session on Monday
2. Book a "makeup" session for Member A on Wednesday
3. Verify success toast appears
4. Verify session created in database

---

### AC4: Allow First Member Session

**Given** a member has 0 "member" sessions this week

**When** I book a "member" session

**Then** the booking should succeed

**Verification**: Manual UI test

---

### AC5: Bypass Validation for Other Session Types

**Given** a member has 1 "member" session this week

**When** I book a "trial", "contractual", or "collaboration" session

**Then** the booking should succeed without validation

**Verification**: Manual UI test for each session type

---

### AC6: Handle Cancelled Sessions Correctly

**Given** a member has 1 "member" session with status "cancelled"

**When** I book a new "member" session for the same week

**Then** the booking should succeed (cancelled session doesn't count)

**Verification**: Manual UI test

---

## 🔧 Technical Implementation

### 1. Helper Function

**File**: `src/features/training-sessions/lib/session-limit-utils.ts`

**Add function**:

```typescript
import { supabase } from "@/lib/supabase";
import { formatForDatabase } from "@/lib/date-utils";
import type { MemberWeeklyLimitResult } from "@/features/database/lib/types";

/**
 * Get week range for a given date (Sunday to Saturday)
 */
function getWeekRange(date: Date) {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  // Start of week (Sunday)
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  // End of week (Saturday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    start: weekStart,
    end: weekEnd,
  };
}

/**
 * Check if member has reached weekly session limit
 * @param memberId - UUID of the member
 * @param scheduledStart - Start time of the session being booked
 * @returns Validation result from RPC function
 */
export async function checkMemberWeeklyLimit(
  memberId: string,
  scheduledStart: Date,
  sessionType: string = "member"
): Promise<MemberWeeklyLimitResult> {
  const weekRange = getWeekRange(scheduledStart);

  const { data, error } = await supabase.rpc(
    "check_member_weekly_session_limit",
    {
      p_member_id: memberId,
      p_week_start: formatForDatabase(weekRange.start),
      p_week_end: formatForDatabase(weekRange.end),
      p_session_type: sessionType,
    }
  );

  if (error) {
    throw new Error(`Failed to check weekly limit: ${error.message}`);
  }

  return data;
}
```

---

### 2. Hook Integration

**File**: `src/features/training-sessions/hooks/use-training-sessions.ts`

**Modify `useCreateTrainingSession` mutation**:

```typescript
import { bypassesWeeklyLimit } from "@/features/training-sessions/lib/type-guards";
import { checkMemberWeeklyLimit } from "@/features/training-sessions/lib/session-limit-utils";

export function useCreateTrainingSession() {
  return useMutation({
    mutationFn: async (data: CreateSessionInput) => {
      // MEMBER SESSION: Validate weekly limit (max 1 per week)
      if (!bypassesWeeklyLimit(data.session_type) && data.member_id) {
        const result = await checkMemberWeeklyLimit(
          data.member_id,
          new Date(data.scheduled_start),
          data.session_type
        );

        if (!result.can_book) {
          throw new Error(result.message);
        }
      }

      // ... rest of existing validation (subscription check, etc.)

      // Create the session
      const { data: session, error } = await supabase
        .from("training_sessions")
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
      toast.success("Session created successfully");
    },
    onError: (error) => {
      logger.error("Failed to create session", { error });
      toast.error(error.message || "Failed to create session");
    },
  });
}
```

**Key changes**:

1. Import `bypassesWeeklyLimit` type guard
2. Import `checkMemberWeeklyLimit` helper
3. Add validation BEFORE subscription check (fail fast)
4. Only validate for "member" type sessions (others bypass)
5. Throw error with user-friendly message if limit exceeded
6. Error handler shows message in toast

---

### 3. Type Guard Usage

**File**: `src/features/training-sessions/lib/type-guards.ts` (already exists)

**Existing function**:

```typescript
/**
 * Check if session type bypasses weekly limit
 * Makeup sessions bypass the member's weekly session limit
 */
export function bypassesWeeklyLimit(type: SessionType): boolean {
  return type === "makeup";
}
```

**Note**: This function already exists and will be used as-is. No changes needed.

---

## 🧪 Testing

### Manual Testing Steps

#### Test 1: Block Second Member Session

**Setup**:

1. Navigate to Training Sessions page
2. Click "New Session"
3. Select member: "John Doe"
4. Session type: "Member"
5. Date: Today
6. Time: 10:00 AM
7. Click "Create Session"
8. Verify success toast appears

**Test**:

1. Click "New Session" again
2. Select same member: "John Doe"
3. Session type: "Member"
4. Date: Tomorrow (same week)
5. Time: 2:00 PM
6. Click "Create Session"
7. **Expected**: Error toast with message: "Member already has 1 member session booked this week. Please use the 'Makeup' session type for additional sessions."
8. **Expected**: Session NOT created (check sessions list)

---

#### Test 2: Allow Makeup Session

**Setup**: John Doe has 1 "member" session this week (from Test 1)

**Test**:

1. Click "New Session"
2. Select member: "John Doe"
3. Session type: "Makeup"
4. Date: Tomorrow (same week)
5. Time: 3:00 PM
6. Click "Create Session"
7. **Expected**: Success toast appears
8. **Expected**: Makeup session created successfully
9. **Expected**: John Doe now has 2 sessions this week (1 member, 1 makeup)

---

#### Test 3: Allow Trial/Contractual/Collaboration

**Setup**: John Doe has 1 "member" session this week

**Test** (repeat for each session type):

1. Click "New Session"
2. Select member: "John Doe"
3. Session type: "Trial" (then repeat with "Contractual", "Collaboration")
4. Date: Tomorrow (same week)
5. Time: 4:00 PM
6. Click "Create Session"
7. **Expected**: Success toast appears (no validation)
8. **Expected**: Session created successfully

---

#### Test 4: Cancelled Session Doesn't Count

**Setup**:

1. John Doe has 1 "member" session this week
2. Cancel that session (set status to "cancelled")

**Test**:

1. Click "New Session"
2. Select member: "John Doe"
3. Session type: "Member"
4. Date: Tomorrow (same week)
5. Time: 5:00 PM
6. Click "Create Session"
7. **Expected**: Success toast appears (cancelled session ignored)
8. **Expected**: New member session created successfully

---

#### Test 5: Week Boundary

**Test**:

1. Create member session for John Doe on Saturday (end of week)
2. Try to create another member session on Sunday (start of new week)
3. **Expected**: Success toast appears (different weeks)
4. **Expected**: Second session created successfully

---

### Error Scenarios

#### Error 1: RPC Function Fails

**Simulate**: Disconnect Supabase connection

**Expected**:

- Error toast: "Failed to create session"
- Logger captures full error for debugging
- Session NOT created

#### Error 2: Network Timeout

**Simulate**: Slow network connection

**Expected**:

- Loading state shown during validation
- Error toast if timeout occurs
- Session NOT created

---

## 📊 Definition of Done

- [ ] Helper function `checkMemberWeeklyLimit()` created in session-limit-utils.ts
- [ ] `getWeekRange()` helper function implemented
- [ ] Validation integrated in `useCreateTrainingSession` hook
- [ ] Uses `bypassesWeeklyLimit()` type guard correctly
- [ ] Error handling with user-friendly messages
- [ ] All 6 acceptance criteria verified with manual tests
- [ ] Test 1: Block second member session ✅
- [ ] Test 2: Allow makeup session ✅
- [ ] Test 3: Allow trial/contractual/collaboration ✅
- [ ] Test 4: Cancelled session doesn't count ✅
- [ ] Test 5: Week boundary handling ✅
- [ ] Error scenarios tested and handled properly
- [ ] Code follows CLAUDE.md standards (no `any` types, no console.log)
- [ ] STATUS.md updated with completion

---

## 🔗 Dependencies

**Depends On**:

- ✅ US-001: Database RPC Function (MUST be complete)

**Blocks**:

- US-003: Comprehensive Testing Suite
- US-004: Production Readiness & Optimization

---

## 📝 Notes

**Design Decisions**:

1. **Fail Fast**: Check weekly limit before subscription validation to provide immediate feedback
2. **Type Guard**: Use existing `bypassesWeeklyLimit()` function for consistency
3. **Week Calculation**: Local timezone, Sunday to Saturday (matches business expectations)
4. **Error Message**: Suggests using "Makeup" session type as alternative

**Edge Cases Handled**:

- Cancelled sessions don't count toward limit
- Non-member session types bypass validation entirely
- Week boundaries calculated in local timezone
- Network/database errors handled gracefully

**Performance Considerations**:

- Additional RPC call adds ~10-50ms to booking flow
- Only runs for "member" type sessions (others bypass)
- No impact on session list/view operations

**User Experience**:

- Clear, actionable error message
- Toast notification for immediate feedback
- Suggests alternative (makeup session)
- No confusing technical jargon

---

## 🎯 Success Criteria

**This story is complete when**:

- ✅ Weekly limit validation works end-to-end
- ✅ All session types behave correctly (member blocked, others allowed)
- ✅ Error messages are clear and actionable
- ✅ All manual tests pass
- ✅ No breaking changes to existing functionality
- ✅ Code quality meets CLAUDE.md standards
- ✅ STATUS.md updated

---

**Priority**: P0 (Must Have)

**Complexity**: Medium

**Estimated Effort**: 2-3 hours

**Story Points**: 5

---

**Ready for implementation? Ensure US-001 is complete, then use `/implement-userstory US-002`!**
