/**
 * US-003: API Integration Tests
 * Tests for memberUtils.getMembers() with enhanced database function
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { memberUtils, DatabaseError } from "../utils";
import { supabase } from "@/lib/supabase";
import type { MemberWithEnhancedDetails } from "../types";

// Mock the supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe("memberUtils.getMembers - US-003 API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 1: Basic Fetch
   * Verifies that members are fetched with enhanced details and transformed correctly
   */
  it("should fetch members with enhanced details", async () => {
    // Given: Database function returns data
    const mockData = [
      {
        id: "uuid-1",
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
      data: mockData,
      error: null,
    } as any);

    // When: Fetch members
    const result = await memberUtils.getMembers();

    // Then: Data is transformed correctly
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("uuid-1");
    expect(result[0].first_name).toBe("John");
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
    expect(result[0].last_payment_date).toBe("2024-01-01");
  });

  /**
   * Test 2: Filter Parameters
   * Verifies that all filter parameters are correctly passed to the database function
   */
  it("should pass filter parameters to database function", async () => {
    const rpcSpy = vi
      .mocked(supabase.rpc)
      .mockResolvedValue({ data: [], error: null } as any);

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

  /**
   * Test 3: NULL Handling
   * Verifies that NULL values are correctly handled and transformed
   */
  it("should handle NULL values correctly", async () => {
    const mockData = [
      {
        id: "uuid-1",
        first_name: "Jane",
        last_name: "Smith",
        email: "jane@example.com",
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
        waiver_signed: false,
        waiver_signed_date: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
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

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockData,
      error: null,
    } as any);

    const result = await memberUtils.getMembers();

    expect(result[0].active_subscription).toBeNull();
    expect(result[0].session_stats).toBeNull();
    expect(result[0].last_payment_date).toBeNull();
  });

  /**
   * Test 4: Error Handling
   * Verifies that DatabaseError is thrown when the RPC call fails
   */
  it("should throw DatabaseError on failure", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: "Function not found", code: "42883", details: {} },
    } as any);

    await expect(memberUtils.getMembers()).rejects.toThrow(DatabaseError);
    await expect(memberUtils.getMembers()).rejects.toThrow(
      "Function not found"
    );
  });

  /**
   * Test 5: Empty Results
   * Verifies that an empty array is returned when no members are found
   */
  it("should return empty array when no members found", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [],
      error: null,
    } as any);

    const result = await memberUtils.getMembers({ status: "suspended" });

    expect(result).toEqual([]);
  });

  /**
   * Test 6: Array Status Parameter
   * Verifies that array status parameters are correctly handled
   */
  it("should handle array status parameter", async () => {
    const rpcSpy = vi
      .mocked(supabase.rpc)
      .mockResolvedValue({ data: [], error: null } as any);

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

  /**
   * Additional Test: Partial Session Stats
   * Verifies that session_stats is created even when only some fields are present
   */
  it("should create session_stats when any session field is present", async () => {
    const mockData = [
      {
        id: "uuid-1",
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
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
        waiver_signed: false,
        waiver_signed_date: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        subscription_end_date: null,
        remaining_sessions: null,
        balance_due: null,
        // Only one session field is present
        last_session_date: null,
        next_session_date: "2024-02-01T10:00:00Z",
        scheduled_sessions_count: null,
        last_payment_date: null,
      },
    ];

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockData,
      error: null,
    } as any);

    const result = await memberUtils.getMembers();

    expect(result[0].session_stats).toEqual({
      last_session_date: null,
      next_session_date: "2024-02-01T10:00:00Z",
      scheduled_sessions_count: 0,
    });
  });

  /**
   * Additional Test: Default Filter Values
   * Verifies that default values are applied when filters are not provided
   */
  it("should use default filter values when not provided", async () => {
    const rpcSpy = vi
      .mocked(supabase.rpc)
      .mockResolvedValue({ data: [], error: null } as any);

    await memberUtils.getMembers({});

    expect(rpcSpy).toHaveBeenCalledWith("get_members_with_details", {
      p_status: null,
      p_search: null,
      p_member_type: null,
      p_has_active_subscription: null,
      p_has_upcoming_sessions: null,
      p_has_outstanding_balance: null,
      p_limit: 20,
      p_offset: 0,
      p_order_by: "name",
      p_order_direction: "asc",
    });
  });
});
