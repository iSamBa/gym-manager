import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  CreateSubscriptionInput,
  MemberSubscriptionWithSnapshot,
  SubscriptionPlanWithSessions,
} from "@/features/database/lib/types";

// Mock Supabase client - create function to avoid hoisting issues
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock date utils
vi.mock("@/lib/date-utils", () => ({
  formatForDatabase: vi.fn((date: Date) => {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  }),
  formatTimestampForDatabase: vi.fn((date?: Date) => {
    const d = date || new Date();
    return d.toISOString();
  }),
}));

// Mock subscription database utils
vi.mock("@/features/database/lib/subscription-db-utils", () => ({
  getPlanById: vi.fn(),
  getMemberActiveSubscription: vi.fn(),
  getMemberSubscriptionHistory: vi.fn(),
}));

// Import after mocks are set up
import { subscriptionUtils } from "../subscription-utils";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { getPlanById } from "@/features/database/lib/subscription-db-utils";

const mockSupabase = vi.mocked(supabase);
const mockLogger = vi.mocked(logger);
const mockGetPlanById = vi.mocked(getPlanById);

// Test data
const mockPlan: SubscriptionPlanWithSessions = {
  id: "plan-123",
  name: "Premium Plan",
  price: 100,
  sessions_count: 10,
  contract_length_months: 1,
  duration_months: 1,
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
};

const mockSubscription: MemberSubscriptionWithSnapshot = {
  id: "sub-123",
  member_id: "member-123",
  plan_id: "plan-123",
  status: "active",
  start_date: "2024-01-01",
  end_date: "2024-02-01",
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
  used_sessions: 0,
  paid_amount: 0,
};

describe("subscriptionUtils", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createSubscriptionWithSnapshot", () => {
    describe("Trial Member Conversion (US-001)", () => {
      it("should convert trial member to permanent member (full type) when subscription is created", async () => {
        // Setup: Plan exists
        mockGetPlanById.mockResolvedValue(mockPlan);

        // Setup: Trial member exists
        const trialMemberQuery = {
          single: vi.fn().mockResolvedValue({
            data: { member_type: "trial" },
            error: null,
          }),
        };
        const memberUpdateQuery = {
          eq: vi.fn().mockReturnValue({
            error: null,
          }),
        };

        // Setup: No trial sessions (simplified test)
        const trialSessionQuery = {
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        // Setup: Subscription creation
        const subscriptionInsertQuery = {
          single: vi.fn().mockResolvedValue({
            data: mockSubscription,
            error: null,
          }),
        };

        // Mock Supabase chaining
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "subscription_plans") {
            return {}; // Not needed for this test
          }
          if (table === "training_sessions") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue(trialSessionQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "members") {
            const selectQuery = {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(trialMemberQuery),
              }),
              update: vi.fn().mockReturnValue(memberUpdateQuery),
            };
            return selectQuery;
          }
          if (table === "member_subscriptions") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue(subscriptionInsertQuery),
              }),
            };
          }
          return {};
        });

        // Execute
        const input: CreateSubscriptionInput = {
          member_id: "member-123",
          plan_id: "plan-123",
        };

        const result =
          await subscriptionUtils.createSubscriptionWithSnapshot(input);

        // Verify subscription was created
        expect(result).toEqual(mockSubscription);

        // Verify member type was checked
        const memberFromCalls = mockSupabase.from.mock.calls.filter(
          ([table]) => table === "members"
        );
        expect(memberFromCalls.length).toBeGreaterThanOrEqual(1);

        // Verify member was updated to 'full' type and 'active' status
        expect(memberUpdateQuery.eq).toHaveBeenCalledWith("id", "member-123");
      });

      it("should set member status to active during conversion", async () => {
        // Setup: Plan exists
        mockGetPlanById.mockResolvedValue(mockPlan);

        // Setup: Trial member with pending status
        const trialMemberQuery = {
          single: vi.fn().mockResolvedValue({
            data: { member_type: "trial" },
            error: null,
          }),
        };

        let updateData: any = null;
        const memberUpdateQuery = {
          eq: vi.fn().mockImplementation(() => {
            return { error: null };
          }),
        };

        // Setup: No trial sessions
        const trialSessionQuery = {
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        // Setup: Subscription creation
        const subscriptionInsertQuery = {
          single: vi.fn().mockResolvedValue({
            data: mockSubscription,
            error: null,
          }),
        };

        // Mock Supabase chaining
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "training_sessions") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue(trialSessionQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "members") {
            const selectQuery = {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(trialMemberQuery),
              }),
              update: vi.fn().mockImplementation((data) => {
                updateData = data;
                return memberUpdateQuery;
              }),
            };
            return selectQuery;
          }
          if (table === "member_subscriptions") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue(subscriptionInsertQuery),
              }),
            };
          }
          return {};
        });

        // Execute
        const input: CreateSubscriptionInput = {
          member_id: "member-123",
          plan_id: "plan-123",
        };

        await subscriptionUtils.createSubscriptionWithSnapshot(input);

        // Verify member status was set to 'active'
        expect(updateData).toEqual({
          member_type: "full",
          status: "active",
        });
      });

      it("should NOT convert non-trial members (member_type should remain 'full')", async () => {
        // Setup: Plan exists
        mockGetPlanById.mockResolvedValue(mockPlan);

        // Setup: Full member (already permanent)
        const fullMemberQuery = {
          single: vi.fn().mockResolvedValue({
            data: { member_type: "full" },
            error: null,
          }),
        };
        const memberUpdateQuery = {
          eq: vi.fn(),
        };

        // Setup: No trial sessions
        const trialSessionQuery = {
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        // Setup: Subscription creation
        const subscriptionInsertQuery = {
          single: vi.fn().mockResolvedValue({
            data: mockSubscription,
            error: null,
          }),
        };

        // Mock Supabase chaining
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "training_sessions") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue(trialSessionQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "members") {
            const selectQuery = {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(fullMemberQuery),
              }),
              update: vi.fn().mockReturnValue(memberUpdateQuery),
            };
            return selectQuery;
          }
          if (table === "member_subscriptions") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue(subscriptionInsertQuery),
              }),
            };
          }
          return {};
        });

        // Execute
        const input: CreateSubscriptionInput = {
          member_id: "member-123",
          plan_id: "plan-123",
        };

        await subscriptionUtils.createSubscriptionWithSnapshot(input);

        // Verify member was NOT updated (because already 'full')
        expect(memberUpdateQuery.eq).not.toHaveBeenCalled();
      });

      it("should succeed subscription creation even if member update fails (graceful degradation)", async () => {
        // Setup: Plan exists
        mockGetPlanById.mockResolvedValue(mockPlan);

        // Setup: Trial member
        const trialMemberQuery = {
          single: vi.fn().mockResolvedValue({
            data: { member_type: "trial" },
            error: null,
          }),
        };
        const memberUpdateQuery = {
          eq: vi.fn().mockReturnValue({
            error: { message: "Database error" },
          }),
        };

        // Setup: No trial sessions
        const trialSessionQuery = {
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        // Setup: Subscription creation succeeds
        const subscriptionInsertQuery = {
          single: vi.fn().mockResolvedValue({
            data: mockSubscription,
            error: null,
          }),
        };

        // Mock Supabase chaining
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "training_sessions") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue(trialSessionQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "members") {
            const selectQuery = {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(trialMemberQuery),
              }),
              update: vi.fn().mockReturnValue(memberUpdateQuery),
            };
            return selectQuery;
          }
          if (table === "member_subscriptions") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue(subscriptionInsertQuery),
              }),
            };
          }
          return {};
        });

        // Execute
        const input: CreateSubscriptionInput = {
          member_id: "member-123",
          plan_id: "plan-123",
        };

        // Should NOT throw error
        const result =
          await subscriptionUtils.createSubscriptionWithSnapshot(input);

        // Subscription should still be created
        expect(result).toEqual(mockSubscription);

        // Error should be logged
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Failed to convert trial member to permanent",
          expect.objectContaining({
            member_id: "member-123",
            subscription_id: mockSubscription.id,
          })
        );
      });

      it("should be idempotent - conversion only happens once (member already 'full')", async () => {
        // Setup: Plan exists
        mockGetPlanById.mockResolvedValue(mockPlan);

        // Setup: Member is already 'full' (converted previously)
        const fullMemberQuery = {
          single: vi.fn().mockResolvedValue({
            data: { member_type: "full" },
            error: null,
          }),
        };
        const memberUpdateSpy = vi.fn();

        // Setup: No trial sessions
        const trialSessionQuery = {
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        // Setup: Subscription creation
        const subscriptionInsertQuery = {
          single: vi.fn().mockResolvedValue({
            data: { ...mockSubscription, id: "sub-456" }, // Second subscription
            error: null,
          }),
        };

        // Mock Supabase chaining
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "training_sessions") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue(trialSessionQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "members") {
            const selectQuery = {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(fullMemberQuery),
              }),
              update: memberUpdateSpy,
            };
            return selectQuery;
          }
          if (table === "member_subscriptions") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue(subscriptionInsertQuery),
              }),
            };
          }
          return {};
        });

        // Execute - create second subscription for already-converted member
        const input: CreateSubscriptionInput = {
          member_id: "member-123",
          plan_id: "plan-123",
        };

        await subscriptionUtils.createSubscriptionWithSnapshot(input);

        // Verify update was NOT called (member is already 'full')
        expect(memberUpdateSpy).not.toHaveBeenCalled();
      });

      it("should handle exception during member query gracefully", async () => {
        // Setup: Plan exists
        mockGetPlanById.mockResolvedValue(mockPlan);

        // Setup: Member query throws exception
        const trialMemberQuery = {
          single: vi
            .fn()
            .mockRejectedValue(new Error("Database connection lost")),
        };

        // Setup: No trial sessions
        const trialSessionQuery = {
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        // Setup: Subscription creation succeeds
        const subscriptionInsertQuery = {
          single: vi.fn().mockResolvedValue({
            data: mockSubscription,
            error: null,
          }),
        };

        // Mock Supabase chaining
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "training_sessions") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue(trialSessionQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "members") {
            const selectQuery = {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(trialMemberQuery),
              }),
            };
            return selectQuery;
          }
          if (table === "member_subscriptions") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue(subscriptionInsertQuery),
              }),
            };
          }
          return {};
        });

        // Execute - should NOT throw
        const input: CreateSubscriptionInput = {
          member_id: "member-123",
          plan_id: "plan-123",
        };

        const result =
          await subscriptionUtils.createSubscriptionWithSnapshot(input);

        // Subscription should still be created
        expect(result).toEqual(mockSubscription);

        // Exception should be logged
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Exception during trial member conversion",
          expect.objectContaining({
            member_id: "member-123",
            subscription_id: mockSubscription.id,
          })
        );
      });
    });

    it("should create subscription successfully for non-trial scenario", async () => {
      // Setup: Plan exists
      mockGetPlanById.mockResolvedValue(mockPlan);

      // Setup: Full member (non-trial)
      const fullMemberQuery = {
        single: vi.fn().mockResolvedValue({
          data: { member_type: "full" },
          error: null,
        }),
      };

      // Setup: No trial sessions
      const trialSessionQuery = {
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // Setup: Subscription creation
      const subscriptionInsertQuery = {
        single: vi.fn().mockResolvedValue({
          data: mockSubscription,
          error: null,
        }),
      };

      // Mock Supabase chaining
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "training_sessions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue(trialSessionQuery),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "members") {
          const selectQuery = {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue(fullMemberQuery),
            }),
          };
          return selectQuery;
        }
        if (table === "member_subscriptions") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue(subscriptionInsertQuery),
            }),
          };
        }
        return {};
      });

      // Execute
      const input: CreateSubscriptionInput = {
        member_id: "member-123",
        plan_id: "plan-123",
      };

      const result =
        await subscriptionUtils.createSubscriptionWithSnapshot(input);

      // Verify result
      expect(result).toEqual(mockSubscription);
      expect(result.status).toBe("active");
    });

    describe("Collaboration Member Handling", () => {
      it("should NOT convert collaboration member to full when creating subscription", async () => {
        // Setup: Plan exists
        mockGetPlanById.mockResolvedValue(mockPlan);

        // Setup: Collaboration member
        const collaborationMemberQuery = {
          single: vi.fn().mockResolvedValue({
            data: { member_type: "collaboration" },
            error: null,
          }),
        };
        const memberUpdateSpy = vi.fn();

        // Setup: No trial sessions
        const trialSessionQuery = {
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        // Setup: Subscription creation
        const subscriptionInsertQuery = {
          single: vi.fn().mockResolvedValue({
            data: mockSubscription,
            error: null,
          }),
        };

        // Mock Supabase chaining
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "training_sessions") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue(trialSessionQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "members") {
            const selectQuery = {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(collaborationMemberQuery),
              }),
              update: memberUpdateSpy,
            };
            return selectQuery;
          }
          if (table === "member_subscriptions") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue(subscriptionInsertQuery),
              }),
            };
          }
          return {};
        });

        // Execute
        const input: CreateSubscriptionInput = {
          member_id: "collab-member-123",
          plan_id: "plan-123",
        };

        const result =
          await subscriptionUtils.createSubscriptionWithSnapshot(input);

        // Verify subscription was created
        expect(result).toEqual(mockSubscription);

        // Verify member was NOT updated (collaboration members stay as 'collaboration')
        expect(memberUpdateSpy).not.toHaveBeenCalled();
      });

      it("should maintain collaboration member status after subscription creation", async () => {
        // Setup: Plan exists
        mockGetPlanById.mockResolvedValue(mockPlan);

        // Setup: Collaboration member
        const collaborationMemberQuery = {
          single: vi.fn().mockResolvedValue({
            data: { member_type: "collaboration" },
            error: null,
          }),
        };

        // Setup: No trial sessions
        const trialSessionQuery = {
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        // Setup: Subscription creation
        const subscriptionInsertQuery = {
          single: vi.fn().mockResolvedValue({
            data: mockSubscription,
            error: null,
          }),
        };

        // Mock Supabase chaining
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === "training_sessions") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue(trialSessionQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "members") {
            const selectQuery = {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(collaborationMemberQuery),
              }),
            };
            return selectQuery;
          }
          if (table === "member_subscriptions") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue(subscriptionInsertQuery),
              }),
            };
          }
          return {};
        });

        // Execute
        const input: CreateSubscriptionInput = {
          member_id: "collab-member-123",
          plan_id: "plan-123",
        };

        const result =
          await subscriptionUtils.createSubscriptionWithSnapshot(input);

        // Verify subscription created successfully
        expect(result).toEqual(mockSubscription);

        // Verify member type check was performed
        const memberFromCalls = mockSupabase.from.mock.calls.filter(
          ([table]) => table === "members"
        );
        expect(memberFromCalls.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
