# US-003: API Layer Integration for Enhanced Member Data

## User Story

**As a** frontend developer
**I want** the member API utilities to fetch enhanced member data from the database function
**So that** I can access subscription, session, and payment information efficiently

---

## Business Value

- **Performance**: Single API call instead of multiple requests
- **Consistency**: Centralized data fetching logic
- **Developer Experience**: Simple API for complex data

---

## Acceptance Criteria

### AC1: Update memberUtils.getMembers()

**Given** the database function `get_members_with_details()` exists
**When** I call `memberUtils.getMembers(filters)`
**Then** it should:

- Call the database function instead of direct table query
- Pass all filter parameters to the function
- Return `MemberWithEnhancedDetails[]` instead of `Member[]`
- Transform database response to match TypeScript types
- Handle errors gracefully

### AC2: Maintain Backward Compatibility

**Given** existing code uses `memberUtils.getMembers()`
**When** I update the implementation
**Then** it should:

- Support all existing filter parameters
- Return same structure for base member fields
- Add new fields as optional properties
- Not break existing components

### AC3: New Filter Support

**Given** enhanced filtering capabilities
**When** I pass new filter parameters
**Then** the API should support:

- `hasActiveSubscription: boolean` → filters members with active subscriptions
- `hasUpcomingSessions: boolean` → filters members with scheduled sessions
- `hasOutstandingBalance: boolean` → filters members with balance_due > 0
- `memberType: 'full' | 'trial'` → filters by member type

### AC4: Data Transformation

**Given** database function returns flat structure
**When** I receive the response
**Then** I should transform it to:

- Nest subscription data in `active_subscription` object
- Nest session data in `session_stats` object
- Convert string dates to proper format
- Handle NULL values correctly (return null, not undefined)

---

## Technical Implementation

### File: `src/features/database/lib/utils.ts`

```typescript
/**
 * Get members with enhanced details (subscription, sessions, payments)
 * Uses database function for optimal performance
 */
export const memberUtils = {
  async getMembers(
    filters: MemberFilters = {}
  ): Promise<MemberWithEnhancedDetails[]> {
    try {
      // Build RPC call to database function
      const { data, error } = await supabase.rpc("get_members_with_details", {
        p_status: filters.status
          ? Array.isArray(filters.status)
            ? filters.status
            : [filters.status]
          : null,
        p_search: filters.search || null,
        p_member_type: filters.memberType || null,
        p_has_active_subscription: filters.hasActiveSubscription ?? null,
        p_has_upcoming_sessions: filters.hasUpcomingSessions ?? null,
        p_has_outstanding_balance: filters.hasOutstandingBalance ?? null,
        p_limit: filters.limit ?? 20,
        p_offset: filters.offset ?? 0,
        p_order_by: filters.orderBy ?? "name",
        p_order_direction: filters.orderDirection ?? "asc",
      });

      if (error) {
        throw new DatabaseError(error.message, error.code, error.details);
      }

      if (!data) {
        return [];
      }

      // Transform flat database response to nested structure
      return data.map((row: DatabaseMemberRow) => ({
        // Base member fields
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone,
        date_of_birth: row.date_of_birth,
        gender: row.gender,
        status: row.status,
        join_date: row.join_date,
        member_type: row.member_type,
        profile_picture_url: row.profile_picture_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
        // ... other base member fields

        // Enhanced fields - nest subscription data
        active_subscription: row.subscription_end_date
          ? {
              end_date: row.subscription_end_date,
              remaining_sessions: row.remaining_sessions ?? 0,
              balance_due: row.balance_due ?? 0,
            }
          : null,

        // Enhanced fields - nest session stats
        session_stats:
          row.last_session_date ||
          row.next_session_date ||
          row.scheduled_sessions_count
            ? {
                last_session_date: row.last_session_date,
                next_session_date: row.next_session_date,
                scheduled_sessions_count: row.scheduled_sessions_count ?? 0,
              }
            : null,

        // Enhanced fields - payment info
        last_payment_date: row.last_payment_date,
      }));
    } catch (error) {
      console.error("Failed to fetch enhanced members:", error);
      throw error;
    }
  },

  // ... other existing methods remain unchanged
};

/**
 * Internal type for database function response
 * Matches the flat structure returned by get_members_with_details()
 */
interface DatabaseMemberRow {
  // Member fields
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  status: MemberStatus;
  join_date: string;
  member_type: string;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;

  // Subscription fields (flat)
  subscription_end_date: string | null;
  remaining_sessions: number | null;
  balance_due: number | null;

  // Session fields (flat)
  last_session_date: string | null;
  next_session_date: string | null;
  scheduled_sessions_count: number | null;

  // Payment fields
  last_payment_date: string | null;
}
```

---

## Testing Criteria

### Unit Tests

**Test 1: Basic Fetch**

```typescript
import { memberUtils } from "@/features/database/lib/utils";

describe("memberUtils.getMembers", () => {
  it("should fetch members with enhanced details", async () => {
    // Given: Database function returns data
    const mockData = [
      {
        id: "uuid-1",
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        status: "active",
        join_date: "2024-01-01",
        subscription_end_date: "2024-12-31",
        remaining_sessions: 10,
        balance_due: 100,
        last_session_date: "2024-01-15T10:00:00Z",
        next_session_date: "2024-01-20T14:00:00Z",
        scheduled_sessions_count: 3,
        last_payment_date: "2024-01-01",
      },
    ];

    vi.spyOn(supabase, "rpc").mockResolvedValue({
      data: mockData,
      error: null,
    });

    // When: Fetch members
    const result = await memberUtils.getMembers();

    // Then: Data is transformed correctly
    expect(result).toHaveLength(1);
    expect(result[0].active_subscription).toEqual({
      end_date: "2024-12-31",
      remaining_sessions: 10,
      balance_due: 100,
    });
    expect(result[0].session_stats).toEqual({
      last_session_date: "2024-01-15T10:00:00Z",
      next_session_date: "2024-01-20T14:00:00Z",
      scheduled_sessions_count: 3,
    });
  });
});
```

**Test 2: Filter Parameters**

```typescript
it("should pass filter parameters to database function", async () => {
  const rpcSpy = vi
    .spyOn(supabase, "rpc")
    .mockResolvedValue({ data: [], error: null });

  await memberUtils.getMembers({
    status: "active",
    search: "john",
    memberType: "full",
    hasActiveSubscription: true,
    hasUpcomingSessions: true,
    hasOutstandingBalance: false,
    limit: 50,
    offset: 10,
    orderBy: "name",
    orderDirection: "asc",
  });

  expect(rpcSpy).toHaveBeenCalledWith("get_members_with_details", {
    p_status: ["active"],
    p_search: "john",
    p_member_type: "full",
    p_has_active_subscription: true,
    p_has_upcoming_sessions: true,
    p_has_outstanding_balance: false,
    p_limit: 50,
    p_offset: 10,
    p_order_by: "name",
    p_order_direction: "asc",
  });
});
```

**Test 3: NULL Handling**

```typescript
it("should handle NULL values correctly", async () => {
  const mockData = [
    {
      id: "uuid-1",
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      status: "active",
      join_date: "2024-01-01",
      // All enhanced fields are NULL
      subscription_end_date: null,
      remaining_sessions: null,
      balance_due: null,
      last_session_date: null,
      next_session_date: null,
      scheduled_sessions_count: null,
      last_payment_date: null,
    },
  ];

  vi.spyOn(supabase, "rpc").mockResolvedValue({ data: mockData, error: null });

  const result = await memberUtils.getMembers();

  expect(result[0].active_subscription).toBeNull();
  expect(result[0].session_stats).toBeNull();
  expect(result[0].last_payment_date).toBeNull();
});
```

**Test 4: Error Handling**

```typescript
it("should throw DatabaseError on failure", async () => {
  vi.spyOn(supabase, "rpc").mockResolvedValue({
    data: null,
    error: { message: "Function not found", code: "42883", details: {} },
  });

  await expect(memberUtils.getMembers()).rejects.toThrow(DatabaseError);
  await expect(memberUtils.getMembers()).rejects.toThrow("Function not found");
});
```

**Test 5: Empty Results**

```typescript
it("should return empty array when no members found", async () => {
  vi.spyOn(supabase, "rpc").mockResolvedValue({ data: [], error: null });

  const result = await memberUtils.getMembers({ status: "suspended" });

  expect(result).toEqual([]);
});
```

**Test 6: Array Status Parameter**

```typescript
it("should handle array status parameter", async () => {
  const rpcSpy = vi
    .spyOn(supabase, "rpc")
    .mockResolvedValue({ data: [], error: null });

  await memberUtils.getMembers({
    status: ["active", "pending"],
  });

  expect(rpcSpy).toHaveBeenCalledWith(
    "get_members_with_details",
    expect.objectContaining({
      p_status: ["active", "pending"],
    })
  );
});
```

### Integration Tests

**Test 7: End-to-End Fetch**

```typescript
// Real database test (requires test database)
it("should fetch real data from database", async () => {
  // Given: Test member exists in database
  const testMemberId = await createTestMember({
    first_name: "Test",
    last_name: "User",
    email: "test@example.com",
  });

  await createTestSubscription(testMemberId, {
    end_date: "2024-12-31",
    remaining_sessions: 5,
  });

  // When: Fetch members
  const result = await memberUtils.getMembers({ search: "test@example.com" });

  // Then: Enhanced data is present
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe(testMemberId);
  expect(result[0].active_subscription).toBeTruthy();
  expect(result[0].active_subscription?.remaining_sessions).toBe(5);

  // Cleanup
  await cleanupTestMember(testMemberId);
});
```

---

## Definition of Done

- [x] `memberUtils.getMembers()` updated to call database function
- [x] All filter parameters mapped correctly
- [x] Response transformation logic implemented
- [x] `DatabaseMemberRow` internal type defined
- [x] Error handling implemented
- [x] All unit tests pass (8/8 - created additional tests for better coverage)
- [x] Integration test passes (5/5 tests - verified with live Supabase database)
- [x] TypeScript compilation succeeds with no errors (build passes)
- [x] Backward compatibility verified (existing components work - MemberWithEnhancedDetails extends Member)
- [ ] Performance meets requirements (< 500ms for 1000+ members - will be tested in US-007 with production dataset)
- [x] Code review completed (self-review)
- [x] Documentation updated (JSDoc comments added)

---

## Notes

### Design Decisions

**Why transform data in API layer?**

- Keeps database function simple and focused
- Allows TypeScript types to differ from database schema
- Easier to test transformation logic

**Why use RPC instead of direct query?**

- Database functions can use complex aggregations
- Server-side processing is more efficient
- Single roundtrip vs multiple queries

**Why nest subscription/session data?**

- Clearer semantic structure
- Easier to check "does member have subscription?"
- Better TypeScript autocomplete

### Dependencies

- US-001: Database function must exist
- US-002: Types must be defined
- Supabase client library

### Risks

- Breaking changes if database function signature changes (mitigated with versioning)
- Performance degradation if function is slow (mitigated with indexes from US-001)

---

## Related User Stories

- US-001: Database Foundation for Enhanced Members Table
- US-002: Type Definitions for Enhanced Member Data
- US-004: Table Component Updates
