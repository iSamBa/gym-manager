/**
 * @jest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getActivePlans,
  getPlanById,
  getMemberActiveSubscription,
  getMemberSubscriptionHistory,
  getSubscriptionPayments,
  getMemberAllPayments,
} from "../subscription-db-utils";
import type {
  SubscriptionPlanWithSessions,
  MemberSubscriptionWithSnapshot,
  SubscriptionPaymentWithReceipt,
} from "../types";

// Mock the supabase client with proper chaining support
const createMockQueryBuilder = () => ({
  select: vi.fn(() => createMockQueryBuilder()),
  eq: vi.fn(() => createMockQueryBuilder()),
  order: vi.fn(() => createMockQueryBuilder()),
  single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  then: vi.fn(),
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => createMockQueryBuilder()),
  },
}));

describe("subscription-db-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Type compatibility", () => {
    it("should have compatible types for SubscriptionPlanWithSessions", () => {
      const mockPlan: SubscriptionPlanWithSessions = {
        id: "plan-123",
        name: "Test Plan",
        description: "Test Description",
        price: 99.99,
        duration_days: 30,
        is_active: true,
        features: ["feature1", "feature2"],
        sort_order: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        sessions_count: 10,
        duration_type: "constraint",
      };

      expect(mockPlan).toBeDefined();
      expect(mockPlan.sessions_count).toBe(10);
      expect(mockPlan.duration_type).toBe("constraint");
    });

    it("should have compatible types for MemberSubscriptionWithSnapshot", () => {
      const mockSubscription: MemberSubscriptionWithSnapshot = {
        id: "sub-123",
        member_id: "member-123",
        subscription_plan_id: "plan-123",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-01-31T00:00:00Z",
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        plan_name_snapshot: "Test Plan",
        total_sessions_snapshot: 10,
        total_amount_snapshot: 99.99,
        duration_days_snapshot: 30,
        used_sessions: 3,
        paid_amount: 99.99,
        remaining_sessions: 7,
        balance_due: 0,
        completion_percentage: 30,
        days_remaining: 27,
      };

      expect(mockSubscription).toBeDefined();
      expect(mockSubscription.plan_name_snapshot).toBe("Test Plan");
      expect(mockSubscription.remaining_sessions).toBe(7);
    });

    it("should have compatible types for SubscriptionPaymentWithReceipt", () => {
      const mockPayment: SubscriptionPaymentWithReceipt = {
        id: "payment-123",
        subscription_id: "sub-123",
        member_id: "member-123",
        amount: 99.99,
        payment_method: "card",
        payment_date: "2024-01-01T00:00:00Z",
        status: "completed",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        receipt_number: "REC-001",
        receipt_generated_at: "2024-01-01T00:00:00Z",
      };

      expect(mockPayment).toBeDefined();
      expect(mockPayment.receipt_number).toBe("REC-001");
      expect(mockPayment.receipt_generated_at).toBeDefined();
    });
  });

  describe("Function exports", () => {
    it("should export getActivePlans function", () => {
      expect(typeof getActivePlans).toBe("function");
    });

    it("should export getPlanById function", () => {
      expect(typeof getPlanById).toBe("function");
    });

    it("should export getMemberActiveSubscription function", () => {
      expect(typeof getMemberActiveSubscription).toBe("function");
    });

    it("should export getMemberSubscriptionHistory function", () => {
      expect(typeof getMemberSubscriptionHistory).toBe("function");
    });

    it("should export getSubscriptionPayments function", () => {
      expect(typeof getSubscriptionPayments).toBe("function");
    });

    it("should export getMemberAllPayments function", () => {
      expect(typeof getMemberAllPayments).toBe("function");
    });
  });

  describe("Function signatures", () => {
    it("getActivePlans should return Promise<SubscriptionPlanWithSessions[]>", async () => {
      const result = getActivePlans();
      expect(result).toBeInstanceOf(Promise);
    });

    it("getPlanById should accept string parameter and return Promise", async () => {
      const result = getPlanById("test-id");
      expect(result).toBeInstanceOf(Promise);
    });

    it("getMemberActiveSubscription should accept memberId and return Promise", async () => {
      const result = getMemberActiveSubscription("member-123");
      expect(result).toBeInstanceOf(Promise);
    });

    it("getMemberSubscriptionHistory should accept memberId and return Promise", async () => {
      const result = getMemberSubscriptionHistory("member-123");
      expect(result).toBeInstanceOf(Promise);
    });

    it("getSubscriptionPayments should accept subscriptionId and return Promise", async () => {
      const result = getSubscriptionPayments("sub-123");
      expect(result).toBeInstanceOf(Promise);
    });

    it("getMemberAllPayments should accept memberId and return Promise", async () => {
      const result = getMemberAllPayments("member-123");
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
