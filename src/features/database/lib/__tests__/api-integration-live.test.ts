/**
 * US-003: Database Function Business Logic Tests
 * Tests for memberUtils.getMembers() behavior with mocked Supabase client
 *
 * Tests business logic without requiring live database connection
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { memberUtils } from "@/features/members/lib/database-utils";
import { supabase } from "@/lib/supabase";

// Mock the Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe("memberUtils.getMembers - Business Logic Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 1: Fetch Members with Enhanced Details
   * Verifies that the function correctly transforms database response
   */
  it("should fetch members with enhanced details", async () => {
    // Given: Mocked database response
    const mockMembers = [
      {
        id: "member-1",
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone: "555-1234",
        date_of_birth: "1990-01-01",
        gender: "male",
        status: "active",
        join_date: "2024-01-01",
        member_type: "full",
        profile_picture_url: null,
        address: null,
        notes: null,
        medical_conditions: null,
        fitness_goals: null,
        preferred_contact_method: "email",
        marketing_consent: true,
        waiver_signed: true,
        waiver_signed_date: "2024-01-01",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        subscription_end_date: "2024-12-31",
        remaining_sessions: 10,
        balance_due: 100,
        last_session_date: "2024-01-15T10:00:00Z",
        next_session_date: "2024-01-20T14:00:00Z",
        scheduled_sessions_count: 3,
        last_payment_date: "2024-01-01",
      },
    ];

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockMembers,
      error: null,
    } as any);

    // When: Fetch members with limit
    const result = await memberUtils.getMembers({
      limit: 5,
      orderBy: "name",
      orderDirection: "asc",
    });

    // Then: Should return array with enhanced details
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);

    const member = result[0];

    // Verify base member fields
    expect(member).toHaveProperty("id");
    expect(member).toHaveProperty("first_name");
    expect(member).toHaveProperty("last_name");
    expect(member).toHaveProperty("email");
    expect(member).toHaveProperty("status");
    expect(member).toHaveProperty("join_date");

    // Verify enhanced fields
    expect(member).toHaveProperty("active_subscription");
    expect(member).toHaveProperty("session_stats");
    expect(member).toHaveProperty("last_payment_date");

    // Verify active_subscription structure
    expect(member.active_subscription).toEqual({
      end_date: "2024-12-31",
      remaining_sessions: 10,
      balance_due: 100,
    });

    // Verify session_stats structure
    expect(member.session_stats).toEqual({
      last_session_date: "2024-01-15T10:00:00Z",
      next_session_date: "2024-01-20T14:00:00Z",
      scheduled_sessions_count: 3,
    });

    expect(member.last_payment_date).toBe("2024-01-01");
  });

  /**
   * Test 2: Filter Parameters Work Correctly
   * Verifies that filter parameters are properly passed to database function
   */
  it("should respect filter parameters", async () => {
    const mockActiveMembers = [
      {
        id: "member-1",
        first_name: "Active",
        last_name: "User",
        email: "active@example.com",
        phone: null,
        date_of_birth: null,
        gender: null,
        status: "active",
        join_date: "2024-01-01",
        member_type: "full",
        profile_picture_url: null,
        address: null,
        notes: null,
        medical_conditions: null,
        fitness_goals: null,
        preferred_contact_method: "email",
        marketing_consent: false,
        waiver_signed: true,
        waiver_signed_date: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        subscription_end_date: null,
        remaining_sessions: null,
        balance_due: null,
        last_session_date: null,
        next_session_date: null,
        scheduled_sessions_count: null,
        last_payment_date: null,
      },
    ];

    // Test with search filter
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [],
      error: null,
    } as any);

    const searchResult = await memberUtils.getMembers({
      search: "test",
      limit: 10,
    });
    expect(Array.isArray(searchResult)).toBe(true);

    // Test with status filter
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockActiveMembers,
      error: null,
    } as any);

    const statusResult = await memberUtils.getMembers({
      status: "active",
      limit: 10,
    });
    expect(Array.isArray(statusResult)).toBe(true);
    // All returned members should have active status
    statusResult.forEach((member) => {
      expect(member.status).toBe("active");
    });

    // Verify RPC was called with correct filter
    expect(supabase.rpc).toHaveBeenCalledWith(
      "get_members_with_details",
      expect.objectContaining({
        p_status: ["active"],
      })
    );
  });

  /**
   * Test 3: Enhanced Filters Work Correctly
   * Verifies that new enhanced filter parameters work
   */
  it("should handle enhanced filter parameters", async () => {
    // Test hasActiveSubscription filter
    const withSubscriptionData = [
      {
        id: "member-1",
        first_name: "Has",
        last_name: "Subscription",
        email: "has@example.com",
        phone: null,
        date_of_birth: null,
        gender: null,
        status: "active",
        join_date: "2024-01-01",
        member_type: "full",
        profile_picture_url: null,
        address: null,
        notes: null,
        medical_conditions: null,
        fitness_goals: null,
        preferred_contact_method: "email",
        marketing_consent: false,
        waiver_signed: true,
        waiver_signed_date: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        subscription_end_date: "2024-12-31",
        remaining_sessions: 5,
        balance_due: 0,
        last_session_date: null,
        next_session_date: null,
        scheduled_sessions_count: null,
        last_payment_date: null,
      },
    ];

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: withSubscriptionData,
      error: null,
    } as any);

    const withSubscription = await memberUtils.getMembers({
      hasActiveSubscription: true,
      limit: 5,
    });
    expect(Array.isArray(withSubscription)).toBe(true);
    // All returned members should have active_subscription
    withSubscription.forEach((member) => {
      expect(member.active_subscription).not.toBeNull();
    });

    // Test hasActiveSubscription: false filter
    const withoutSubscriptionData = [
      {
        id: "member-2",
        first_name: "No",
        last_name: "Subscription",
        email: "no@example.com",
        phone: null,
        date_of_birth: null,
        gender: null,
        status: "active",
        join_date: "2024-01-01",
        member_type: "trial",
        profile_picture_url: null,
        address: null,
        notes: null,
        medical_conditions: null,
        fitness_goals: null,
        preferred_contact_method: "email",
        marketing_consent: false,
        waiver_signed: true,
        waiver_signed_date: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        subscription_end_date: null,
        remaining_sessions: null,
        balance_due: null,
        last_session_date: null,
        next_session_date: null,
        scheduled_sessions_count: null,
        last_payment_date: null,
      },
    ];

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: withoutSubscriptionData,
      error: null,
    } as any);

    const withoutSubscription = await memberUtils.getMembers({
      hasActiveSubscription: false,
      limit: 5,
    });
    expect(Array.isArray(withoutSubscription)).toBe(true);
    // All returned members should NOT have active_subscription
    withoutSubscription.forEach((member) => {
      expect(member.active_subscription).toBeNull();
    });
  });

  /**
   * Test 4: Sorting Works Correctly
   * Verifies that orderBy and orderDirection parameters are passed correctly
   */
  it("should pass sorting parameters correctly", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [],
      error: null,
    } as any);

    // Test ascending sort by name
    await memberUtils.getMembers({
      orderBy: "name",
      orderDirection: "asc",
      limit: 5,
    });

    expect(supabase.rpc).toHaveBeenCalledWith(
      "get_members_with_details",
      expect.objectContaining({
        p_order_by: "name",
        p_order_direction: "asc",
      })
    );

    vi.clearAllMocks();

    // Test descending sort by join_date
    await memberUtils.getMembers({
      orderBy: "join_date",
      orderDirection: "desc",
      limit: 5,
    });

    expect(supabase.rpc).toHaveBeenCalledWith(
      "get_members_with_details",
      expect.objectContaining({
        p_order_by: "join_date",
        p_order_direction: "desc",
      })
    );
  });

  /**
   * Test 5: Pagination Works Correctly
   * Verifies that limit and offset parameters are passed correctly
   */
  it("should handle pagination correctly", async () => {
    const page1Data = [{ id: "member-1" }];
    const page2Data = [{ id: "member-4" }];

    // Get first page
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: page1Data as any,
      error: null,
    } as any);

    await memberUtils.getMembers({
      limit: 3,
      offset: 0,
      orderBy: "name",
      orderDirection: "asc",
    });

    expect(supabase.rpc).toHaveBeenCalledWith(
      "get_members_with_details",
      expect.objectContaining({
        p_limit: 3,
        p_offset: 0,
      })
    );

    // Get second page
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: page2Data as any,
      error: null,
    } as any);

    await memberUtils.getMembers({
      limit: 3,
      offset: 3,
      orderBy: "name",
      orderDirection: "asc",
    });

    expect(supabase.rpc).toHaveBeenCalledWith(
      "get_members_with_details",
      expect.objectContaining({
        p_limit: 3,
        p_offset: 3,
      })
    );
  });
});
