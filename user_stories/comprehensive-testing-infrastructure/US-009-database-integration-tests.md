# US-009: Database Integration Tests

**Phase**: Phase 3 - Integration Tests (Week 5)
**Priority**: P1 (Should Have)
**Estimated Effort**: 14 hours
**Dependencies**: US-001 (Infrastructure)

---

## User Story

**As a** developer
**I want** integration tests for database operations and RPC functions
**So that** database queries, type mappings, and stored procedures work correctly

---

## Business Value

Database integration tests verify:

- RPC functions return correct data structures
- Type mappings match database schema
- Query filters work correctly
- Transactions handle errors properly

**Impact**: Catches database-related bugs before production

---

## Detailed Acceptance Criteria

### AC1: RPC Function Tests

- [ ] Test get_sessions_with_planning_indicators returns correct structure
- [ ] Test field mapping (session_id → id) works correctly
- [ ] Test calculate_member_balance computes accurately
- [ ] Test get_member_stats aggregates correctly
- [ ] Test all RPC functions documented in docs/RPC_SIGNATURES.md
- [ ] Test RPC error handling (invalid params)

### AC2: Query Builder Tests

- [ ] Test buildMemberQuery applies status filter
- [ ] Test buildMemberQuery applies search filter (name, email, phone)
- [ ] Test buildMemberQuery combines filters correctly
- [ ] Test buildPaymentQuery filters by date range
- [ ] Test buildSubscriptionQuery joins tables correctly
- [ ] Test query sorting (ASC/DESC)

### AC3: Transaction Handling Tests

- [ ] Test successful transaction commits all changes
- [ ] Test failed transaction rolls back all changes
- [ ] Test nested transactions (savepoints)
- [ ] Test concurrent transaction conflicts
- [ ] Test optimistic locking (updated_at checks)

### AC4: Data Integrity Tests

- [ ] Test foreign key constraints prevent orphaned records
- [ ] Test unique constraints prevent duplicates
- [ ] Test check constraints enforce enum values
- [ ] Test cascading deletes work correctly
- [ ] Test triggers fire correctly (updated_at, receipt_number)

---

## Technical Implementation

```typescript
// src/features/database/__tests__/rpc-functions.integration.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { testSupabase } from "@/test/test-supabase";
import { mapSessionRpcResponse } from "../lib/rpc-mappers";

describe("RPC Functions Integration", () => {
  beforeEach(async () => {
    // Reset test database
    await resetTestDatabase();
  });

  it("should return correct structure from get_sessions_with_planning_indicators", async () => {
    // Seed data
    await seedSession({ date: "2025-01-15" });

    // Call RPC
    const { data, error } = await testSupabase.rpc(
      "get_sessions_with_planning_indicators",
      {
        p_start_date: "2025-01-01",
        p_end_date: "2025-01-31",
      }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0]).toHaveProperty("session_id");
    expect(data[0]).toHaveProperty("trainer_name");

    // Test mapper
    const mapped = mapSessionRpcResponse(data);
    expect(mapped[0]).toHaveProperty("id"); // session_id → id
    expect(mapped[0]).not.toHaveProperty("session_id");
  });

  it("should calculate member balance correctly", async () => {
    // Create subscription: $100 total, $60 paid
    const memberId = await seedMemberWithSubscription({
      total: 100,
      paid: 60,
    });

    const { data } = await testSupabase.rpc("calculate_member_balance", {
      p_member_id: memberId,
    });

    expect(data).toBe(40); // $100 - $60 = $40 balance
  });
});

// src/features/database/__tests__/query-builder.integration.test.ts
describe("Query Builder Integration", () => {
  it("should apply multiple filters correctly", async () => {
    await seedMembers([
      { name: "John", status: "active", email: "john@test.com" },
      { name: "Jane", status: "inactive", email: "jane@test.com" },
      { name: "Bob", status: "active", email: "bob@test.com" },
    ]);

    const query = buildMemberQuery({
      status: "active",
      search: "john",
    });

    const { data } = await query.select();

    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("John");
  });
});

// src/features/database/__tests__/transactions.integration.test.ts
describe("Transaction Handling", () => {
  it("should rollback on error", async () => {
    const initialCount = await getMemberCount();

    try {
      await testSupabase.rpc("create_member_with_subscription", {
        member_data: {
          /* invalid data */
        },
        subscription_data: {
          /* valid data */
        },
      });
    } catch (error) {
      // Expected to fail
    }

    const finalCount = await getMemberCount();
    expect(finalCount).toBe(initialCount); // No change due to rollback
  });
});
```

---

## Testing Requirements

1. **Use Test Database**: Never run integration tests against production
2. **Reset Between Tests**: Each test should have clean state
3. **Seed Test Data**: Use minimal data needed for each test
4. **Verify Cleanup**: Ensure no test data leaks

---

## Definition of Done

- [ ] All 4 acceptance criteria met
- [ ] RPC function tests passing (6 tests)
- [ ] Query builder tests passing (6 tests)
- [ ] Transaction tests passing (5 tests)
- [ ] Data integrity tests passing (5 tests)
- [ ] Test database setup documented
- [ ] All tests pass in CI
- [ ] Code reviewed and approved

---

## Dependencies

**Requires**: US-001 (Infrastructure - test database setup)
