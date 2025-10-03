/**
 * US-003: Live Integration Test
 * Tests memberUtils.getMembers() with real Supabase database
 *
 * This test verifies the actual database function works correctly
 */

import { describe, it, expect } from "vitest";
import { memberUtils } from "../utils";

describe("memberUtils.getMembers - Live Integration Test", () => {
  /**
   * Integration Test: End-to-End Fetch from Real Database
   * Verifies that the database function exists and returns data in the correct format
   */
  it("should fetch real data from database with enhanced details", async () => {
    // When: Fetch members from live database with a limit
    const result = await memberUtils.getMembers({
      limit: 5,
      orderBy: "name",
      orderDirection: "asc",
    });

    // Then: Should return an array (may be empty if no members exist)
    expect(Array.isArray(result)).toBe(true);

    // If members exist, verify structure
    if (result.length > 0) {
      const member = result[0];

      // Verify base member fields exist
      expect(member).toHaveProperty("id");
      expect(member).toHaveProperty("first_name");
      expect(member).toHaveProperty("last_name");
      expect(member).toHaveProperty("email");
      expect(member).toHaveProperty("status");
      expect(member).toHaveProperty("join_date");

      // Verify enhanced fields exist (may be null)
      expect(member).toHaveProperty("active_subscription");
      expect(member).toHaveProperty("session_stats");
      expect(member).toHaveProperty("last_payment_date");

      // If active_subscription exists, verify its structure
      if (member.active_subscription) {
        expect(member.active_subscription).toHaveProperty("end_date");
        expect(member.active_subscription).toHaveProperty("remaining_sessions");
        expect(member.active_subscription).toHaveProperty("balance_due");
      }

      // If session_stats exists, verify its structure
      if (member.session_stats) {
        expect(member.session_stats).toHaveProperty("last_session_date");
        expect(member.session_stats).toHaveProperty("next_session_date");
        expect(member.session_stats).toHaveProperty("scheduled_sessions_count");
      }
    }
  });

  /**
   * Integration Test: Filter Parameters Work Correctly
   * Verifies that all filter parameters are properly handled by the database function
   */
  it("should respect filter parameters", async () => {
    // Test with search filter
    const searchResult = await memberUtils.getMembers({
      search: "test",
      limit: 10,
    });
    expect(Array.isArray(searchResult)).toBe(true);

    // Test with status filter
    const statusResult = await memberUtils.getMembers({
      status: "active",
      limit: 10,
    });
    expect(Array.isArray(statusResult)).toBe(true);
    // All returned members should have active status
    statusResult.forEach((member) => {
      expect(member.status).toBe("active");
    });
  });

  /**
   * Integration Test: Enhanced Filters Work Correctly
   * Verifies that new enhanced filter parameters work
   */
  it("should handle enhanced filter parameters", async () => {
    // Test hasActiveSubscription filter
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
   * Integration Test: Sorting Works Correctly
   * Verifies that orderBy and orderDirection parameters work
   */
  it("should sort results correctly", async () => {
    // Test ascending sort by name
    const ascResult = await memberUtils.getMembers({
      orderBy: "name",
      orderDirection: "asc",
      limit: 5,
    });

    if (ascResult.length > 1) {
      // Verify ascending order
      for (let i = 1; i < ascResult.length; i++) {
        const prevName =
          `${ascResult[i - 1].first_name} ${ascResult[i - 1].last_name}`.toLowerCase();
        const currName =
          `${ascResult[i].first_name} ${ascResult[i].last_name}`.toLowerCase();
        expect(prevName.localeCompare(currName)).toBeLessThanOrEqual(0);
      }
    }

    // Test descending sort by join_date
    const descResult = await memberUtils.getMembers({
      orderBy: "join_date",
      orderDirection: "desc",
      limit: 5,
    });

    if (descResult.length > 1) {
      // Verify descending order
      for (let i = 1; i < descResult.length; i++) {
        const prevDate = new Date(descResult[i - 1].join_date);
        const currDate = new Date(descResult[i].join_date);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    }
  });

  /**
   * Integration Test: Pagination Works Correctly
   * Verifies that limit and offset parameters work
   */
  it("should handle pagination correctly", async () => {
    // Get first page
    const page1 = await memberUtils.getMembers({
      limit: 3,
      offset: 0,
      orderBy: "name",
      orderDirection: "asc",
    });

    // Get second page
    const page2 = await memberUtils.getMembers({
      limit: 3,
      offset: 3,
      orderBy: "name",
      orderDirection: "asc",
    });

    expect(Array.isArray(page1)).toBe(true);
    expect(Array.isArray(page2)).toBe(true);

    // If both pages have members, they should be different
    if (page1.length > 0 && page2.length > 0) {
      const page1Ids = page1.map((m) => m.id);
      const page2Ids = page2.map((m) => m.id);

      // No overlap between pages
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    }
  });
});
