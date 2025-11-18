# US-003: Comprehensive Testing Suite

## 📋 User Story

**As a** developer

**I want** comprehensive automated tests for the weekly session limit feature

**So that** we can confidently maintain and extend the feature without introducing regressions

---

## 🎯 Business Value

**Why This Matters**:

- Prevents regressions when modifying code
- Documents expected behavior through tests
- Enables safe refactoring and feature additions
- Catches edge cases that manual testing might miss
- Provides confidence for production deployment

**Impact**:

- **Quality**: 100% test coverage of critical business logic
- **Confidence**: Safe to deploy without manual testing
- **Documentation**: Tests serve as executable specifications
- **Maintainability**: Easy to verify changes don't break functionality

---

## ✅ Acceptance Criteria

### AC1: Unit Tests for Helper Functions

**Given** the helper functions are implemented

**When** I run the test suite

**Then** all helper function tests should pass

**Coverage Required**:

- `checkMemberWeeklyLimit()` - all scenarios
- `getWeekRange()` - week boundaries, timezones
- Error handling in helpers

**Verification**: `npm test -- member-weekly-limit.test.ts`

---

### AC2: Integration Tests for Booking Flow

**Given** the booking hook is implemented

**When** I run integration tests

**Then** all booking scenarios should be tested end-to-end

**Coverage Required**:

- Member session booking (success and failure)
- Makeup session bypass logic
- Trial/contractual/collaboration session bypass
- Error handling in booking flow

**Verification**: Run full test suite

---

### AC3: All Session Types Tested

**Given** multiple session types exist

**When** I run the test suite

**Then** each session type should have specific test cases

**Session Types to Test**:

- ✅ Member (subject to limit)
- ✅ Makeup (bypass)
- ✅ Trial (bypass)
- ✅ Contractual (bypass)
- ✅ Collaboration (bypass)

**Verification**: Check test file for each session type

---

### AC4: Edge Cases Covered

**Given** various edge cases exist

**When** I run the test suite

**Then** all edge cases should have test coverage

**Edge Cases**:

- ✅ Cancelled sessions don't count
- ✅ Week boundary handling (Sunday/Saturday)
- ✅ Member with no sessions (first booking)
- ✅ Member with 1 session (blocking case)
- ✅ Sessions from previous week don't affect current week
- ✅ Concurrent booking attempts
- ✅ Invalid member ID

**Verification**: Test file includes all edge cases

---

### AC5: Test Coverage Meets Standards

**When** I run `npm run test:coverage`

**Then** the weekly limit feature should have:

- ✅ Line coverage: ≥90%
- ✅ Branch coverage: ≥90%
- ✅ Function coverage: 100%
- ✅ Statement coverage: ≥90%

**Verification**: Coverage report shows thresholds met

---

### AC6: Tests Pass in CI/CD

**When** I run `npm test`

**Then** all tests should pass with:

- ✅ 100% pass rate
- ✅ No flaky tests
- ✅ Execution time <2 minutes
- ✅ No console errors or warnings

**Verification**: CI/CD pipeline passes

---

## 🔧 Technical Implementation

### Test File Structure

**File**: `src/features/training-sessions/__tests__/lib/member-weekly-limit.test.ts`

**Structure**:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkMemberWeeklyLimit } from "../../lib/session-limit-utils";
import { bypassesWeeklyLimit } from "../../lib/type-guards";
import { supabase } from "@/lib/supabase";

describe("Member Weekly Session Limit", () => {
  describe("checkMemberWeeklyLimit", () => {
    // Unit tests for helper function
  });

  describe("getWeekRange", () => {
    // Unit tests for week calculation
  });

  describe("bypassesWeeklyLimit type guard", () => {
    // Tests for type guard logic
  });

  describe("Session Booking Integration", () => {
    // Integration tests with real database calls
  });

  describe("Edge Cases", () => {
    // Edge case scenarios
  });
});
```

---

### Test Cases

#### Test Suite 1: Helper Function Tests

```typescript
describe("checkMemberWeeklyLimit", () => {
  const testMemberId = "test-member-123";

  beforeEach(async () => {
    // Clean up test data
    await supabase
      .from("training_sessions")
      .delete()
      .eq("member_id", testMemberId);
  });

  it("should allow booking when member has 0 sessions", async () => {
    const result = await checkMemberWeeklyLimit(
      testMemberId,
      new Date("2025-11-18T10:00:00")
    );

    expect(result.can_book).toBe(true);
    expect(result.current_member_sessions).toBe(0);
    expect(result.max_allowed).toBe(1);
  });

  it("should block booking when member has 1 member session", async () => {
    // Insert member session
    await supabase.from("training_sessions").insert({
      member_id: testMemberId,
      session_type: "member",
      scheduled_start: "2025-11-18T10:00:00",
      status: "scheduled",
    });

    const result = await checkMemberWeeklyLimit(
      testMemberId,
      new Date("2025-11-19T14:00:00")
    );

    expect(result.can_book).toBe(false);
    expect(result.current_member_sessions).toBe(1);
    expect(result.message).toContain("already has 1 member session");
  });

  it("should exclude cancelled sessions from count", async () => {
    // Insert cancelled member session
    await supabase.from("training_sessions").insert({
      member_id: testMemberId,
      session_type: "member",
      scheduled_start: "2025-11-18T10:00:00",
      status: "cancelled",
    });

    const result = await checkMemberWeeklyLimit(
      testMemberId,
      new Date("2025-11-19T14:00:00")
    );

    expect(result.can_book).toBe(true);
    expect(result.current_member_sessions).toBe(0);
  });

  it("should handle week boundaries correctly", async () => {
    // Session on Saturday (end of week)
    await supabase.from("training_sessions").insert({
      member_id: testMemberId,
      session_type: "member",
      scheduled_start: "2025-11-22T10:00:00", // Saturday
      status: "scheduled",
    });

    // Try to book on Sunday (new week)
    const result = await checkMemberWeeklyLimit(
      testMemberId,
      new Date("2025-11-23T14:00:00") // Sunday
    );

    expect(result.can_book).toBe(true); // Different week
    expect(result.current_member_sessions).toBe(0);
  });

  it("should not count sessions from previous week", async () => {
    // Session from last week
    await supabase.from("training_sessions").insert({
      member_id: testMemberId,
      session_type: "member",
      scheduled_start: "2025-11-10T10:00:00", // Previous week
      status: "scheduled",
    });

    // Check current week
    const result = await checkMemberWeeklyLimit(
      testMemberId,
      new Date("2025-11-18T14:00:00") // This week
    );

    expect(result.can_book).toBe(true);
    expect(result.current_member_sessions).toBe(0);
  });

  it("should throw error on database failure", async () => {
    // Mock database error
    vi.spyOn(supabase, "rpc").mockRejectedValueOnce(
      new Error("Database connection failed")
    );

    await expect(
      checkMemberWeeklyLimit(testMemberId, new Date())
    ).rejects.toThrow("Failed to check weekly limit");
  });
});
```

---

#### Test Suite 2: Week Range Calculation

```typescript
import { getWeekRange } from "../../lib/session-limit-utils";

describe("getWeekRange", () => {
  it("should calculate week range for Sunday", () => {
    const date = new Date("2025-11-16T10:00:00"); // Sunday
    const range = getWeekRange(date);

    expect(range.start.getDay()).toBe(0); // Sunday
    expect(range.end.getDay()).toBe(6); // Saturday
  });

  it("should calculate week range for Monday", () => {
    const date = new Date("2025-11-17T10:00:00"); // Monday
    const range = getWeekRange(date);

    expect(range.start.getDay()).toBe(0); // Sunday (previous day)
    expect(range.end.getDay()).toBe(6); // Saturday
  });

  it("should calculate week range for Saturday", () => {
    const date = new Date("2025-11-22T10:00:00"); // Saturday
    const range = getWeekRange(date);

    expect(range.start.getDay()).toBe(0); // Sunday
    expect(range.end.getDay()).toBe(6); // Saturday (same day)
  });

  it("should set start time to midnight", () => {
    const date = new Date("2025-11-18T14:30:45");
    const range = getWeekRange(date);

    expect(range.start.getHours()).toBe(0);
    expect(range.start.getMinutes()).toBe(0);
    expect(range.start.getSeconds()).toBe(0);
  });

  it("should set end time to 23:59:59", () => {
    const date = new Date("2025-11-18T14:30:45");
    const range = getWeekRange(date);

    expect(range.end.getHours()).toBe(23);
    expect(range.end.getMinutes()).toBe(59);
    expect(range.end.getSeconds()).toBe(59);
  });
});
```

---

#### Test Suite 3: Type Guard Tests

```typescript
describe("bypassesWeeklyLimit type guard", () => {
  it("should return false for member sessions", () => {
    expect(bypassesWeeklyLimit("member")).toBe(false);
  });

  it("should return true for makeup sessions", () => {
    expect(bypassesWeeklyLimit("makeup")).toBe(true);
  });

  it("should return true for trial sessions", () => {
    expect(bypassesWeeklyLimit("trial")).toBe(true);
  });

  it("should return true for contractual sessions", () => {
    expect(bypassesWeeklyLimit("contractual")).toBe(true);
  });

  it("should return true for collaboration sessions", () => {
    expect(bypassesWeeklyLimit("collaboration")).toBe(true);
  });
});
```

---

#### Test Suite 4: Integration Tests

```typescript
import { useCreateTrainingSession } from "../../hooks/use-training-sessions";
import { renderHook, waitFor } from "@testing-library/react";

describe("Session Booking Integration", () => {
  const testMemberId = "test-member-integration";

  beforeEach(async () => {
    // Clean up
    await supabase
      .from("training_sessions")
      .delete()
      .eq("member_id", testMemberId);
  });

  it("should allow booking first member session", async () => {
    const { result } = renderHook(() => useCreateTrainingSession());

    await act(async () => {
      await result.current.mutateAsync({
        member_id: testMemberId,
        session_type: "member",
        scheduled_start: "2025-11-18T10:00:00",
        scheduled_end: "2025-11-18T11:00:00",
      });
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it("should block booking second member session", async () => {
    // First booking
    await supabase.from("training_sessions").insert({
      member_id: testMemberId,
      session_type: "member",
      scheduled_start: "2025-11-18T10:00:00",
      status: "scheduled",
    });

    // Second booking should fail
    const { result } = renderHook(() => useCreateTrainingSession());

    await expect(async () => {
      await result.current.mutateAsync({
        member_id: testMemberId,
        session_type: "member",
        scheduled_start: "2025-11-19T14:00:00",
        scheduled_end: "2025-11-19T15:00:00",
      });
    }).rejects.toThrow("already has 1 member session");
  });

  it("should allow unlimited makeup sessions", async () => {
    // Member has 1 member session
    await supabase.from("training_sessions").insert({
      member_id: testMemberId,
      session_type: "member",
      scheduled_start: "2025-11-18T10:00:00",
      status: "scheduled",
    });

    const { result } = renderHook(() => useCreateTrainingSession());

    // Book makeup session - should succeed
    await act(async () => {
      await result.current.mutateAsync({
        member_id: testMemberId,
        session_type: "makeup",
        scheduled_start: "2025-11-19T14:00:00",
        scheduled_end: "2025-11-19T15:00:00",
      });
    });

    expect(result.current.isSuccess).toBe(true);

    // Book another makeup session - should also succeed
    await act(async () => {
      await result.current.mutateAsync({
        member_id: testMemberId,
        session_type: "makeup",
        scheduled_start: "2025-11-20T14:00:00",
        scheduled_end: "2025-11-20T15:00:00",
      });
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it("should allow trial/contractual/collaboration sessions", async () => {
    // Member has 1 member session
    await supabase.from("training_sessions").insert({
      member_id: testMemberId,
      session_type: "member",
      scheduled_start: "2025-11-18T10:00:00",
      status: "scheduled",
    });

    const sessionTypes = ["trial", "contractual", "collaboration"];

    for (const sessionType of sessionTypes) {
      const { result } = renderHook(() => useCreateTrainingSession());

      await act(async () => {
        await result.current.mutateAsync({
          member_id: testMemberId,
          session_type: sessionType,
          scheduled_start: `2025-11-19T${10 + sessionTypes.indexOf(sessionType)}:00:00`,
          scheduled_end: `2025-11-19T${11 + sessionTypes.indexOf(sessionType)}:00:00`,
        });
      });

      expect(result.current.isSuccess).toBe(true);
    }
  });
});
```

---

#### Test Suite 5: Edge Cases

```typescript
describe("Edge Cases", () => {
  it("should handle concurrent booking attempts", async () => {
    const testMemberId = "test-concurrent";

    // Clean up
    await supabase
      .from("training_sessions")
      .delete()
      .eq("member_id", testMemberId);

    // Simulate concurrent bookings
    const booking1 = checkMemberWeeklyLimit(testMemberId, new Date());
    const booking2 = checkMemberWeeklyLimit(testMemberId, new Date());

    const [result1, result2] = await Promise.all([booking1, booking2]);

    // Both should see 0 sessions initially
    expect(result1.current_member_sessions).toBe(0);
    expect(result2.current_member_sessions).toBe(0);
  });

  it("should handle invalid member ID", async () => {
    const result = await checkMemberWeeklyLimit("invalid-uuid", new Date());

    expect(result.can_book).toBe(true);
    expect(result.current_member_sessions).toBe(0);
  });

  it("should handle sessions exactly at week boundary", async () => {
    const testMemberId = "test-boundary";

    // Session at Saturday 23:59
    await supabase.from("training_sessions").insert({
      member_id: testMemberId,
      session_type: "member",
      scheduled_start: "2025-11-22T23:59:00", // Saturday
      status: "scheduled",
    });

    // Check on Sunday 00:01 (new week)
    const result = await checkMemberWeeklyLimit(
      testMemberId,
      new Date("2025-11-23T00:01:00")
    );

    expect(result.can_book).toBe(true); // Different week
  });

  it("should handle multiple cancelled sessions", async () => {
    const testMemberId = "test-cancelled-multiple";

    // Insert multiple cancelled sessions
    await supabase.from("training_sessions").insert([
      {
        member_id: testMemberId,
        session_type: "member",
        scheduled_start: "2025-11-18T10:00:00",
        status: "cancelled",
      },
      {
        member_id: testMemberId,
        session_type: "member",
        scheduled_start: "2025-11-19T10:00:00",
        status: "cancelled",
      },
    ]);

    const result = await checkMemberWeeklyLimit(
      testMemberId,
      new Date("2025-11-20T14:00:00")
    );

    expect(result.can_book).toBe(true);
    expect(result.current_member_sessions).toBe(0);
  });
});
```

---

## 📊 Definition of Done

- [ ] Test file created: `src/features/training-sessions/__tests__/lib/member-weekly-limit.test.ts`
- [ ] All unit tests implemented and passing
- [ ] All integration tests implemented and passing
- [ ] All 5 session types have test coverage
- [ ] All edge cases have test coverage
- [ ] Test coverage meets standards (≥90%)
- [ ] `npm test` passes with 100% success rate
- [ ] `npm run test:coverage` shows adequate coverage
- [ ] No flaky tests (run 10 times, all pass)
- [ ] Test execution time <2 minutes
- [ ] No console errors or warnings in test output
- [ ] Tests follow project conventions (Vitest, Testing Library)
- [ ] Test data cleanup in beforeEach/afterEach
- [ ] STATUS.md updated with completion

---

## 🔗 Dependencies

**Depends On**:

- ✅ US-001: Database RPC Function (MUST be complete)
- ✅ US-002: Application-Level Booking Validation (MUST be complete)

**Blocks**:

- US-004: Production Readiness & Optimization

---

## 📝 Notes

**Testing Strategy**:

1. **Unit Tests**: Test helper functions in isolation
2. **Integration Tests**: Test booking flow end-to-end with real database
3. **Edge Cases**: Cover corner cases and error scenarios
4. **Type Guards**: Verify session type bypass logic

**Test Data Management**:

- Use unique test member IDs (avoid collisions)
- Clean up test data in beforeEach/afterEach
- Use descriptive test member IDs (test-member-123, test-concurrent, etc.)
- Don't pollute production-like data

**Performance**:

- Tests should run in <2 minutes total
- Use parallel test execution where possible
- Mock external dependencies (not database for integration tests)

**Best Practices**:

- Descriptive test names ("should do X when Y")
- Arrange-Act-Assert pattern
- One assertion per test (when possible)
- Test both success and failure paths

---

## 🎯 Success Criteria

**This story is complete when**:

- ✅ All tests implemented and passing (100% pass rate)
- ✅ Coverage meets standards (≥90%)
- ✅ No flaky tests
- ✅ Tests run in <2 minutes
- ✅ All session types covered
- ✅ All edge cases covered
- ✅ Integration tests verify end-to-end flow
- ✅ STATUS.md updated

---

**Priority**: P0 (Must Have)

**Complexity**: Medium-High

**Estimated Effort**: 2-3 hours

**Story Points**: 5

---

**Ready for implementation? Ensure US-001 and US-002 are complete, then use `/implement-userstory US-003`!**
