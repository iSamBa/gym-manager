/**
 * Performance Benchmarks for US-002: Database Indexes & Query Optimization
 *
 * Purpose: Verify that all database queries execute in <100ms after index optimization
 * Expected Impact: 22x-100x performance improvement with indexes
 *
 * Test Strategy:
 * - Benchmark common query patterns (members, payments, subscriptions, sessions)
 * - Verify <100ms target for all queries
 * - Use realistic data volumes (simulating 1000+ records)
 *
 * Note: These tests verify query performance with indexes in place
 * Tests are marked as skipped in unit test environment (with mocks)
 * Run manually against real database to verify performance
 */

import { describe, it, expect, vi } from "vitest";
import { memberUtils } from "@/features/members/lib/database-utils";
import { paymentUtils } from "@/features/payments/lib/payment-utils";
import { subscriptionUtils } from "@/features/memberships/lib/subscription-utils";
import { supabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date-utils";

// Performance threshold: All queries must complete in <100ms
const PERFORMANCE_TARGET_MS = 100;

// Check if we're running in a mocked environment
const isMocked = vi.isMockFunction(supabase.from);

describe("Database Performance Benchmarks (US-002)", () => {
  // Skip entire suite if mocked (unit test environment)
  if (isMocked) {
    it.skip("Performance benchmarks require real database (skipped in unit tests)", () => {
      expect(true).toBe(true);
    });
    return;
  }
  describe("Members Queries", () => {
    it("should fetch members with enhanced details in <100ms", async () => {
      const start = performance.now();

      await memberUtils.getMembers({
        limit: 20,
        offset: 0,
      });

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(`✓ Members query: ${duration.toFixed(2)}ms`);
    });

    it("should fetch members by status in <100ms", async () => {
      const start = performance.now();

      await memberUtils.getMembersByStatus("active");

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(`✓ Members by status query: ${duration.toFixed(2)}ms`);
    });

    it("should search members in <100ms", async () => {
      const start = performance.now();

      await memberUtils.searchMembers("test");

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(`✓ Member search query: ${duration.toFixed(2)}ms`);
    });

    it("should fetch member with subscription in <100ms", async () => {
      // Get a member ID first
      const members = await memberUtils.getMembers({ limit: 1 });
      if (members.length === 0) {
        console.log("⚠ Skipping test - no members in database");
        return;
      }

      const start = performance.now();

      await memberUtils.getMemberWithSubscription(members[0].id);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(`✓ Member with subscription query: ${duration.toFixed(2)}ms`);
    });

    it("should count members by status in <100ms", async () => {
      const start = performance.now();

      await memberUtils.getMemberCountByStatus();

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(`✓ Member count by status query: ${duration.toFixed(2)}ms`);
    });
  });

  describe("Payments Queries", () => {
    it("should fetch all payments with filters in <100ms", async () => {
      const start = performance.now();

      await paymentUtils.getAllPayments({
        page: 1,
        limit: 20,
      });

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(`✓ All payments query: ${duration.toFixed(2)}ms`);
    });

    it("should fetch member payments in <100ms", async () => {
      // Get a member ID first
      const members = await memberUtils.getMembers({ limit: 1 });
      if (members.length === 0) {
        console.log("⚠ Skipping test - no members in database");
        return;
      }

      const start = performance.now();

      await paymentUtils.getMemberPayments(members[0].id);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(`✓ Member payments query: ${duration.toFixed(2)}ms`);
    });

    it("should fetch payment statistics in <100ms", async () => {
      const today = new Date();
      const startDate = getLocalDateString(
        new Date(today.getFullYear(), today.getMonth(), 1)
      );
      const endDate = getLocalDateString(today);

      const start = performance.now();

      await paymentUtils.getPaymentStats(startDate, endDate);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(`✓ Payment statistics query: ${duration.toFixed(2)}ms`);
    });
  });

  describe("Subscriptions Queries", () => {
    it("should fetch all subscriptions in <100ms", async () => {
      const start = performance.now();

      await subscriptionUtils.getAllSubscriptions({
        page: 1,
        limit: 20,
      });

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(`✓ All subscriptions query: ${duration.toFixed(2)}ms`);
    });

    it("should fetch member active subscription in <100ms", async () => {
      // Get a member ID first
      const members = await memberUtils.getMembers({ limit: 1 });
      if (members.length === 0) {
        console.log("⚠ Skipping test - no members in database");
        return;
      }

      const start = performance.now();

      await subscriptionUtils.getMemberActiveSubscription(members[0].id);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(
        `✓ Member active subscription query: ${duration.toFixed(2)}ms`
      );
    });

    it("should fetch member subscription history in <100ms", async () => {
      // Get a member ID first
      const members = await memberUtils.getMembers({ limit: 1 });
      if (members.length === 0) {
        console.log("⚠ Skipping test - no members in database");
        return;
      }

      const start = performance.now();

      await subscriptionUtils.getMemberSubscriptionHistory(members[0].id);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(
        `✓ Member subscription history query: ${duration.toFixed(2)}ms`
      );
    });
  });

  describe("Training Sessions Queries", () => {
    it("should fetch sessions with planning indicators in <100ms", async () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

      const start = performance.now();

      await supabase.rpc("get_sessions_with_planning_indicators", {
        p_start_date: getLocalDateString(startOfWeek),
        p_end_date: getLocalDateString(endOfWeek),
      });

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(
        `✓ Sessions with planning indicators query: ${duration.toFixed(2)}ms`
      );
    });

    it("should fetch daily session statistics in <100ms", async () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

      const start = performance.now();

      await supabase.rpc("get_daily_session_statistics", {
        p_start_date: getLocalDateString(startOfWeek),
        p_end_date: getLocalDateString(endOfWeek),
      });

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(`✓ Daily session statistics query: ${duration.toFixed(2)}ms`);
    });

    it("should fetch training sessions by trainer in <100ms", async () => {
      // Get a trainer ID first
      const { data: trainers } = await supabase
        .from("trainers")
        .select("id")
        .limit(1);

      if (!trainers || trainers.length === 0) {
        console.log("⚠ Skipping test - no trainers in database");
        return;
      }

      const start = performance.now();

      await supabase
        .from("training_sessions")
        .select("*")
        .eq("trainer_id", trainers[0].id)
        .order("scheduled_start", { ascending: false })
        .limit(20);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(`✓ Sessions by trainer query: ${duration.toFixed(2)}ms`);
    });

    it("should fetch training sessions by status in <100ms", async () => {
      const start = performance.now();

      await supabase
        .from("training_sessions")
        .select("*")
        .eq("status", "scheduled")
        .order("scheduled_start", { ascending: false })
        .limit(20);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);
      console.log(`✓ Sessions by status query: ${duration.toFixed(2)}ms`);
    });
  });

  describe("Complex Queries (Joins)", () => {
    it("should verify members query uses joins (no N+1)", async () => {
      // This query should fetch members with their subscription data in a single query
      // The RPC function get_members_with_details should use joins, not separate queries

      const start = performance.now();

      const members = await memberUtils.getMembers({
        limit: 10,
        hasActiveSubscription: true,
      });

      const duration = performance.now() - start;

      // Should be fast because it's a single query with joins
      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);

      // Verify we got subscription data (proves join worked)
      if (members.length > 0) {
        const firstMember = members[0];
        // Check that subscription data is included in the response
        expect(firstMember).toHaveProperty("active_subscription");
      }

      console.log(
        `✓ Members with subscriptions (joined) query: ${duration.toFixed(2)}ms`
      );
    });

    it("should verify payments query uses joins (no N+1)", async () => {
      // This query should fetch payments with member data in a single query

      const start = performance.now();

      const result = await paymentUtils.getAllPayments({
        limit: 10,
      });

      const duration = performance.now() - start;

      // Should be fast because it's a single query with joins
      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);

      // Verify we got member data (proves join worked)
      if (result.payments.length > 0) {
        const firstPayment = result.payments[0];
        // Check that member data is included
        expect(firstPayment).toHaveProperty("member");
      }

      console.log(
        `✓ Payments with members (joined) query: ${duration.toFixed(2)}ms`
      );
    });

    it("should verify sessions query uses joins (no N+1)", async () => {
      // This query should fetch sessions with all related data in a single query

      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

      const start = performance.now();

      const { data: sessions } = await supabase.rpc(
        "get_sessions_with_planning_indicators",
        {
          p_start_date: getLocalDateString(startOfWeek),
          p_end_date: getLocalDateString(endOfWeek),
        }
      );

      const duration = performance.now() - start;

      // Should be fast because it's a single query with joins
      expect(duration).toBeLessThan(PERFORMANCE_TARGET_MS);

      // Verify we got planning indicators (proves join worked)
      if (sessions && sessions.length > 0) {
        const firstSession = sessions[0];
        // Check that planning indicators are included
        expect(firstSession).toHaveProperty("member_name");
      }

      console.log(
        `✓ Sessions with planning indicators (joined) query: ${duration.toFixed(2)}ms`
      );
    });
  });

  describe("Index Verification", () => {
    it("should verify all required indexes exist", async () => {
      const { data: indexes } = await supabase.rpc("execute_sql", {
        query: `
          SELECT
            tablename,
            indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename IN ('members', 'member_subscriptions', 'subscription_payments', 'training_sessions')
            AND indexname LIKE 'idx_%'
          ORDER BY tablename, indexname
        `,
      });

      // Expected indexes from US-002 migration
      const expectedIndexes = [
        // Members
        "idx_members_status",
        "idx_members_type",
        "idx_members_join_date",
        "idx_members_email",
        "idx_members_status_type",

        // Subscriptions
        "idx_subscriptions_member",
        "idx_subscriptions_status",
        "idx_subscriptions_end_date",
        "idx_subscriptions_member_status",

        // Payments
        "idx_payments_member",
        "idx_payments_date",
        "idx_payments_status",
        "idx_payments_member_date",

        // Training Sessions
        "idx_sessions_scheduled_start",
        "idx_sessions_trainer",
        "idx_sessions_status",
        "idx_sessions_trainer_start",
      ];

      if (indexes) {
        const indexNames = indexes.map(
          (idx: { indexname: string }) => idx.indexname
        );

        for (const expectedIndex of expectedIndexes) {
          expect(indexNames, `Missing index: ${expectedIndex}`).toContain(
            expectedIndex
          );
        }

        console.log(
          `✓ All ${expectedIndexes.length} required indexes exist in database`
        );
      }
    });
  });
});
