import { describe, it, expect, vi, beforeEach } from "vitest";
import { notificationUtils } from "../notification-utils";
import { supabase } from "@/lib/supabase";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    single: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      }),
    },
  },
}));

describe("notificationUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendPaymentAlert", () => {
    it("should create payment alert notification", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const input = {
        memberId: "member-123",
        trainerId: "trainer-456",
        subscriptionId: "sub-789",
        balance: 150.5,
        sessionDate: "2024-01-15",
      };

      await notificationUtils.sendPaymentAlert(input);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "payment_alert",
          member_id: "member-123",
          trainer_id: "trainer-456",
          subscription_id: "sub-789",
          title: "Outstanding Balance Alert",
          message:
            "Member has an outstanding balance of $150.50 for session on 2024-01-15",
          metadata: {
            balance: 150.5,
            sessionDate: "2024-01-15",
            severity: "warning",
          },
        })
      );
    });
  });

  describe("getPaymentStatistics", () => {
    it("should return payment statistics for outstanding balances", async () => {
      const mockData = [
        {
          id: "sub-1",
          member_id: "member-1",
          total_amount_snapshot: 200,
          paid_amount: 150,
          members: { first_name: "John", last_name: "Doe" },
        },
        {
          id: "sub-2",
          member_id: "member-2",
          total_amount_snapshot: 300,
          paid_amount: 200,
          members: { first_name: "Jane", last_name: "Smith" },
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      } as any);

      const result = await notificationUtils.getPaymentStatistics();

      expect(result).toEqual({
        membersWithOutstandingBalance: 2,
        totalOutstandingAmount: 150, // (200-150) + (300-200)
        outstandingBalances: [
          {
            memberId: "member-1",
            memberName: "John Doe",
            balance: 50,
          },
          {
            memberId: "member-2",
            memberName: "Jane Smith",
            balance: 100,
          },
        ],
      });
    });
  });
});
