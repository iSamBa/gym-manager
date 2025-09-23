import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { subscriptionUtils } from "../subscription-utils";
import type {
  CreateSubscriptionInput,
  UpgradeSubscriptionInput,
  RecordPaymentInput,
  MemberSubscriptionWithSnapshot,
  SubscriptionPlanWithSessions,
} from "@/features/database/lib/types";

// Mock the supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock the database utils
vi.mock("@/features/database/lib/subscription-db-utils", () => ({
  getPlanById: vi.fn(),
  getMemberActiveSubscription: vi.fn(),
  getMemberSubscriptionHistory: vi.fn(),
}));

import { supabase } from "@/lib/supabase";
import {
  getPlanById,
  getMemberActiveSubscription,
  getMemberSubscriptionHistory,
} from "@/features/database/lib/subscription-db-utils";

const mockUser = { id: "user-123" };
const mockSupabase = vi.mocked(supabase);
const mockGetPlanById = vi.mocked(getPlanById);
const mockGetMemberActiveSubscription = vi.mocked(getMemberActiveSubscription);
const mockGetMemberSubscriptionHistory = vi.mocked(
  getMemberSubscriptionHistory
);

describe("subscriptionUtils", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createSubscriptionWithSnapshot", () => {
    it("should create a subscription with plan snapshot data", async () => {
      const mockPlan: SubscriptionPlanWithSessions = {
        id: "plan-123",
        name: "Premium Plan",
        price: 100,
        sessions_count: 10,
        contract_length_months: 1,
        description: "Premium membership",
        plan_type: "premium",
        billing_cycle: "monthly",
        currency: "USD",
        includes_guest_passes: 2,
        signup_fee: 0,
        cancellation_fee: 0,
        freeze_fee: 0,
        auto_renew: true,
        is_active: true,
        sort_order: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        duration_type: "constraint",
      };

      const input: CreateSubscriptionInput = {
        member_id: "member-123",
        plan_id: "plan-123",
        initial_payment_amount: 0, // No initial payment to avoid recordPayment call
        notes: "Initial subscription",
      };

      const mockSubscription: MemberSubscriptionWithSnapshot = {
        id: "sub-123",
        member_id: "member-123",
        plan_id: "plan-123",
        status: "active",
        start_date: expect.any(String),
        end_date: expect.any(String),
        billing_cycle: "monthly",
        price: 100,
        currency: "USD",
        signup_fee_paid: 0,
        auto_renew: true,
        renewal_count: 0,
        notes: "Initial subscription",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        plan_name_snapshot: "Premium Plan",
        total_sessions_snapshot: 10,
        total_amount_snapshot: 100,
        duration_days_snapshot: 30,
        used_sessions: 0,
        paid_amount: 0,
      };

      // Mock getPlanById
      mockGetPlanById.mockResolvedValue(mockPlan);

      // Mock subscription insert
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: mockSubscription, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockChain);

      const result =
        await subscriptionUtils.createSubscriptionWithSnapshot(input);

      expect(mockGetPlanById).toHaveBeenCalledWith("plan-123");
      expect(mockSupabase.from).toHaveBeenCalledWith("member_subscriptions");
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          member_id: "member-123",
          plan_id: "plan-123",
          plan_name_snapshot: "Premium Plan",
          total_sessions_snapshot: 10,
          total_amount_snapshot: 100,
          duration_days_snapshot: 30,
          status: "active",
          used_sessions: 0,
          paid_amount: 0,
          notes: "Initial subscription",
          created_by: "user-123",
        })
      );
      expect(result).toEqual(mockSubscription);
    });

    it("should handle custom start date", async () => {
      const mockPlan: SubscriptionPlanWithSessions = {
        id: "plan-123",
        name: "Premium Plan",
        price: 100,
        sessions_count: 10,
        contract_length_months: 1,
        description: "Premium membership",
        plan_type: "premium",
        billing_cycle: "monthly",
        currency: "USD",
        includes_guest_passes: 2,
        signup_fee: 0,
        cancellation_fee: 0,
        freeze_fee: 0,
        auto_renew: true,
        is_active: true,
        sort_order: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        duration_type: "constraint",
      };

      const customStartDate = "2024-02-01T00:00:00Z";
      const input: CreateSubscriptionInput = {
        member_id: "member-123",
        plan_id: "plan-123",
        start_date: customStartDate,
      };

      mockGetPlanById.mockResolvedValue(mockPlan);

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "sub-123" },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(mockChain);

      await subscriptionUtils.createSubscriptionWithSnapshot(input);

      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          start_date: customStartDate,
          end_date: "2024-03-02T00:00:00.000Z", // 30 days later
        })
      );
    });
  });

  describe("consumeSession", () => {
    it("should decrement session count for active subscription", async () => {
      const mockSubscription: MemberSubscriptionWithSnapshot = {
        id: "sub-123",
        member_id: "member-123",
        plan_id: "plan-123",
        status: "active",
        start_date: "2024-01-01T00:00:00Z",
        billing_cycle: "monthly",
        price: 100,
        currency: "USD",
        signup_fee_paid: 0,
        auto_renew: true,
        renewal_count: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        plan_name_snapshot: "Premium Plan",
        total_sessions_snapshot: 10,
        total_amount_snapshot: 100,
        duration_days_snapshot: 30,
        used_sessions: 5,
        paid_amount: 100,
      };

      // Mock select subscription
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: mockSubscription, error: null }),
      };

      // Mock update subscription
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockSubscription, used_sessions: 6 },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(updateChain);

      const result = await subscriptionUtils.consumeSession("sub-123");

      expect(selectChain.select).toHaveBeenCalledWith("*");
      expect(selectChain.eq).toHaveBeenCalledWith("id", "sub-123");
      expect(updateChain.update).toHaveBeenCalledWith({
        used_sessions: 6,
        status: "active",
        updated_at: expect.any(String),
      });
      expect(result.used_sessions).toBe(6);
    });

    it("should mark subscription as completed when all sessions used", async () => {
      const mockSubscription: MemberSubscriptionWithSnapshot = {
        id: "sub-123",
        member_id: "member-123",
        plan_id: "plan-123",
        status: "active",
        start_date: "2024-01-01T00:00:00Z",
        billing_cycle: "monthly",
        price: 100,
        currency: "USD",
        signup_fee_paid: 0,
        auto_renew: true,
        renewal_count: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        plan_name_snapshot: "Premium Plan",
        total_sessions_snapshot: 10,
        total_amount_snapshot: 100,
        duration_days_snapshot: 30,
        used_sessions: 9, // One session remaining
        paid_amount: 100,
      };

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: mockSubscription, error: null }),
      };

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockSubscription, used_sessions: 10, status: "expired" },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(updateChain);

      const result = await subscriptionUtils.consumeSession("sub-123");

      expect(updateChain.update).toHaveBeenCalledWith({
        used_sessions: 10,
        status: "expired",
        updated_at: expect.any(String),
      });
      expect(result.status).toBe("expired");
    });

    it("should throw error when subscription is not active", async () => {
      const mockSubscription: MemberSubscriptionWithSnapshot = {
        id: "sub-123",
        member_id: "member-123",
        plan_id: "plan-123",
        status: "paused",
        start_date: "2024-01-01T00:00:00Z",
        billing_cycle: "monthly",
        price: 100,
        currency: "USD",
        signup_fee_paid: 0,
        auto_renew: true,
        renewal_count: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        plan_name_snapshot: "Premium Plan",
        total_sessions_snapshot: 10,
        total_amount_snapshot: 100,
        duration_days_snapshot: 30,
        used_sessions: 5,
        paid_amount: 100,
      };

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: mockSubscription, error: null }),
      };

      mockSupabase.from.mockReturnValue(selectChain);

      await expect(subscriptionUtils.consumeSession("sub-123")).rejects.toThrow(
        "Cannot consume session from inactive subscription"
      );
    });

    it("should throw error when no sessions remaining", async () => {
      const mockSubscription: MemberSubscriptionWithSnapshot = {
        id: "sub-123",
        member_id: "member-123",
        plan_id: "plan-123",
        status: "active",
        start_date: "2024-01-01T00:00:00Z",
        billing_cycle: "monthly",
        price: 100,
        currency: "USD",
        signup_fee_paid: 0,
        auto_renew: true,
        renewal_count: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        plan_name_snapshot: "Premium Plan",
        total_sessions_snapshot: 10,
        total_amount_snapshot: 100,
        duration_days_snapshot: 30,
        used_sessions: 10, // All sessions used
        paid_amount: 100,
      };

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: mockSubscription, error: null }),
      };

      mockSupabase.from.mockReturnValue(selectChain);

      await expect(subscriptionUtils.consumeSession("sub-123")).rejects.toThrow(
        "No sessions remaining in subscription"
      );
    });
  });

  describe("calculateUpgradeCredit", () => {
    it("should calculate credit based on remaining sessions", () => {
      const subscription: MemberSubscriptionWithSnapshot = {
        id: "sub-123",
        member_id: "member-123",
        plan_id: "plan-123",
        status: "active",
        start_date: "2024-01-01T00:00:00Z",
        billing_cycle: "monthly",
        price: 100,
        currency: "USD",
        signup_fee_paid: 0,
        auto_renew: true,
        renewal_count: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        plan_name_snapshot: "Premium Plan",
        total_sessions_snapshot: 10,
        total_amount_snapshot: 100,
        duration_days_snapshot: 30,
        used_sessions: 6, // 4 sessions remaining
        paid_amount: 100,
      };

      const credit = subscriptionUtils.calculateUpgradeCredit(subscription);

      expect(credit).toBe(40); // 4 sessions * $10 per session
    });

    it("should return 0 credit when no sessions remaining", () => {
      const subscription: MemberSubscriptionWithSnapshot = {
        id: "sub-123",
        member_id: "member-123",
        plan_id: "plan-123",
        status: "active",
        start_date: "2024-01-01T00:00:00Z",
        billing_cycle: "monthly",
        price: 100,
        currency: "USD",
        signup_fee_paid: 0,
        auto_renew: true,
        renewal_count: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        plan_name_snapshot: "Premium Plan",
        total_sessions_snapshot: 10,
        total_amount_snapshot: 100,
        duration_days_snapshot: 30,
        used_sessions: 10, // No sessions remaining
        paid_amount: 100,
      };

      const credit = subscriptionUtils.calculateUpgradeCredit(subscription);

      expect(credit).toBe(0);
    });

    it("should return 0 credit when sessions exceeded", () => {
      const subscription: MemberSubscriptionWithSnapshot = {
        id: "sub-123",
        member_id: "member-123",
        plan_id: "plan-123",
        status: "active",
        start_date: "2024-01-01T00:00:00Z",
        billing_cycle: "monthly",
        price: 100,
        currency: "USD",
        signup_fee_paid: 0,
        auto_renew: true,
        renewal_count: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        plan_name_snapshot: "Premium Plan",
        total_sessions_snapshot: 10,
        total_amount_snapshot: 100,
        duration_days_snapshot: 30,
        used_sessions: 12, // Somehow exceeded
        paid_amount: 100,
      };

      const credit = subscriptionUtils.calculateUpgradeCredit(subscription);

      expect(credit).toBe(0);
    });
  });

  describe("pauseSubscription", () => {
    it("should pause an active subscription", async () => {
      const mockPausedSubscription: MemberSubscriptionWithSnapshot = {
        id: "sub-123",
        member_id: "member-123",
        plan_id: "plan-123",
        status: "paused",
        start_date: "2024-01-01T00:00:00Z",
        billing_cycle: "monthly",
        price: 100,
        currency: "USD",
        signup_fee_paid: 0,
        auto_renew: true,
        renewal_count: 0,
        pause_start_date: expect.any(String),
        pause_reason: "Vacation",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: expect.any(String),
        plan_name_snapshot: "Premium Plan",
        total_sessions_snapshot: 10,
        total_amount_snapshot: 100,
        duration_days_snapshot: 30,
        used_sessions: 5,
        paid_amount: 100,
      };

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPausedSubscription,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(updateChain);

      const result = await subscriptionUtils.pauseSubscription(
        "sub-123",
        "Vacation"
      );

      expect(updateChain.update).toHaveBeenCalledWith({
        status: "paused",
        pause_start_date: expect.any(String),
        pause_reason: "Vacation",
        updated_at: expect.any(String),
      });
      expect(updateChain.eq).toHaveBeenCalledWith("id", "sub-123");
      expect(updateChain.eq).toHaveBeenCalledWith("status", "active");
      expect(result.status).toBe("paused");
    });
  });

  describe("resumeSubscription", () => {
    it("should resume a paused subscription", async () => {
      const mockResumedSubscription: MemberSubscriptionWithSnapshot = {
        id: "sub-123",
        member_id: "member-123",
        plan_id: "plan-123",
        status: "active",
        start_date: "2024-01-01T00:00:00Z",
        billing_cycle: "monthly",
        price: 100,
        currency: "USD",
        signup_fee_paid: 0,
        auto_renew: true,
        renewal_count: 0,
        pause_end_date: expect.any(String),
        created_at: "2024-01-01T00:00:00Z",
        updated_at: expect.any(String),
        plan_name_snapshot: "Premium Plan",
        total_sessions_snapshot: 10,
        total_amount_snapshot: 100,
        duration_days_snapshot: 30,
        used_sessions: 5,
        paid_amount: 100,
      };

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockResumedSubscription,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(updateChain);

      const result = await subscriptionUtils.resumeSubscription("sub-123");

      expect(updateChain.update).toHaveBeenCalledWith({
        status: "active",
        pause_end_date: expect.any(String),
        updated_at: expect.any(String),
      });
      expect(updateChain.eq).toHaveBeenCalledWith("id", "sub-123");
      expect(updateChain.eq).toHaveBeenCalledWith("status", "paused");
      expect(result.status).toBe("active");
    });
  });

  describe("getSubscriptionWithDetails", () => {
    it("should return subscription with computed fields", async () => {
      const mockSubscription: MemberSubscriptionWithSnapshot = {
        id: "sub-123",
        member_id: "member-123",
        plan_id: "plan-123",
        status: "active",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-02-01T00:00:00Z",
        billing_cycle: "monthly",
        price: 100,
        currency: "USD",
        signup_fee_paid: 0,
        auto_renew: true,
        renewal_count: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        plan_name_snapshot: "Premium Plan",
        total_sessions_snapshot: 10,
        total_amount_snapshot: 100,
        duration_days_snapshot: 30,
        used_sessions: 6,
        paid_amount: 80,
      };

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: mockSubscription, error: null }),
      };

      mockSupabase.from.mockReturnValue(selectChain);

      const result =
        await subscriptionUtils.getSubscriptionWithDetails("sub-123");

      expect(result.remaining_sessions).toBe(4); // 10 - 6
      expect(result.balance_due).toBe(20); // 100 - 80
      expect(result.completion_percentage).toBe(60); // 6/10 * 100
      expect(result.days_remaining).toBeGreaterThanOrEqual(0);
    });
  });
});
