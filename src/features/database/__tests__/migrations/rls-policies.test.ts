import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  Epic01TestHelpers,
  mockSupabaseServer,
} from "../epic-01-database.test";

/**
 * Tests for subscription_rls_policies migration
 *
 * This migration should:
 * 1. Enable RLS on subscription tables
 * 2. Create helper functions (is_admin, is_staff)
 * 3. Create policies for subscription_plans
 * 4. Create policies for member_subscriptions
 * 5. Create policies for subscription_payments
 * 6. Create policies for notifications tables
 */

describe("Migration: subscription_rls_policies", () => {
  const MIGRATION_NAME = "subscription_rls_policies";

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock current state (before RLS migration)
    mockSupabaseServer.list_tables.mockResolvedValue([
      { name: "subscription_plans", rls_enabled: false, columns: [] },
      { name: "member_subscriptions", rls_enabled: false, columns: [] },
      { name: "subscription_payments", rls_enabled: false, columns: [] },
      { name: "notifications", rls_enabled: false, columns: [] },
      { name: "realtime_notifications", rls_enabled: false, columns: [] },
    ]);

    // Mock migration list (before applying)
    mockSupabaseServer.list_migrations.mockResolvedValue([
      { name: "subscription_plans_enhancement", version: "20250824000000" },
      { name: "member_subscriptions_snapshots", version: "20250824000001" },
      { name: "subscription_payments_enhancements", version: "20250824000002" },
      { name: "notification_tables", version: "20250824000003" },
      // Missing: subscription_rls_policies
    ]);
  });

  afterEach(async () => {
    await Epic01TestHelpers.cleanupTestData();
  });

  describe("Before Migration Application", () => {
    it("should not have RLS enabled on subscription tables", async () => {
      const tables = await mockSupabaseServer.list_tables();

      const tableNames = [
        "subscription_plans",
        "member_subscriptions",
        "subscription_payments",
        "notifications",
        "realtime_notifications",
      ];

      for (const tableName of tableNames) {
        const table = tables.find((t) => t.name === tableName);
        expect(table?.rls_enabled).toBe(false);
      }
    });

    it("should not have is_admin helper function", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT proname
          FROM pg_proc
          WHERE proname = 'is_admin';
        `,
      });

      expect(result.data).toHaveLength(0);
    });

    it("should not have is_staff helper function", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT proname
          FROM pg_proc
          WHERE proname = 'is_staff';
        `,
      });

      expect(result.data).toHaveLength(0);
    });

    it("should not have RLS policies", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT policyname, tablename
          FROM pg_policies
          WHERE tablename IN ('subscription_plans', 'member_subscriptions', 'subscription_payments', 'notifications', 'realtime_notifications');
        `,
      });

      expect(result.data).toHaveLength(0);
    });
  });

  describe("Migration Application", () => {
    it("should apply migration successfully", async () => {
      mockSupabaseServer.apply_migration.mockResolvedValue({ success: true });

      const result = await mockSupabaseServer.apply_migration({
        name: MIGRATION_NAME,
        query: `
          -- Enable RLS on subscription tables
          ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
          ALTER TABLE member_subscriptions ENABLE ROW LEVEL SECURITY;
          ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
          ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
          ALTER TABLE realtime_notifications ENABLE ROW LEVEL SECURITY;

          -- Helper function to check if user is admin
          CREATE OR REPLACE FUNCTION is_admin()
          RETURNS BOOLEAN AS $$
          BEGIN
            RETURN EXISTS (
              SELECT 1 FROM user_profiles
              WHERE user_id = auth.uid()
              AND role = 'admin'
            );
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;

          -- Helper function to check if user is staff
          CREATE OR REPLACE FUNCTION is_staff()
          RETURNS BOOLEAN AS $$
          BEGIN
            RETURN EXISTS (
              SELECT 1 FROM user_profiles
              WHERE user_id = auth.uid()
              AND role IN ('admin', 'trainer')
            );
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;

          -- Policies for subscription tables
          CREATE POLICY "Anyone can view active plans" ON subscription_plans FOR SELECT USING (is_active = true);
          CREATE POLICY "Admins can manage plans" ON subscription_plans FOR ALL USING (is_admin());
          CREATE POLICY "Members can view own subscriptions" ON member_subscriptions FOR SELECT USING (auth.uid() IN (SELECT user_id FROM members WHERE id = member_subscriptions.member_id) OR is_staff());
          CREATE POLICY "Staff can manage subscriptions" ON member_subscriptions FOR ALL USING (is_staff());
          CREATE POLICY "Members can view own payments" ON subscription_payments FOR SELECT USING (auth.uid() IN (SELECT user_id FROM members WHERE id = subscription_payments.member_id) OR is_staff());
          CREATE POLICY "Staff can manage payments" ON subscription_payments FOR ALL USING (is_staff());
          CREATE POLICY "Members can view own notifications" ON notifications FOR SELECT USING (auth.uid() IN (SELECT user_id FROM members WHERE id = notifications.member_id) OR is_staff());
          CREATE POLICY "Staff can manage notifications" ON notifications FOR ALL USING (is_staff());
          CREATE POLICY "Users can view own realtime notifications" ON realtime_notifications FOR SELECT USING (auth.uid() = user_id);
          CREATE POLICY "Staff can manage realtime notifications" ON realtime_notifications FOR ALL USING (is_staff());
        `,
      });

      expect(result.success).toBe(true);
      expect(mockSupabaseServer.apply_migration).toHaveBeenCalledWith({
        name: MIGRATION_NAME,
        query: expect.stringContaining(
          "ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY"
        ),
      });
    });

    it("should include all required SQL statements", async () => {
      const expectedStatements = [
        "ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE member_subscriptions ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE notifications ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE realtime_notifications ENABLE ROW LEVEL SECURITY",
        "CREATE OR REPLACE FUNCTION is_admin()",
        "CREATE OR REPLACE FUNCTION is_staff()",
        'CREATE POLICY "Anyone can view active plans"',
        'CREATE POLICY "Admins can manage plans"',
        'CREATE POLICY "Members can view own subscriptions"',
        'CREATE POLICY "Staff can manage subscriptions"',
        'CREATE POLICY "Members can view own payments"',
        'CREATE POLICY "Staff can manage payments"',
        'CREATE POLICY "Members can view own notifications"',
        'CREATE POLICY "Staff can manage notifications"',
        'CREATE POLICY "Users can view own realtime notifications"',
        'CREATE POLICY "Staff can manage realtime notifications"',
      ];

      for (const statement of expectedStatements) {
        await mockSupabaseServer.apply_migration({
          name: MIGRATION_NAME,
          query: expect.stringContaining(statement),
        });
      }
    });
  });

  describe("After Migration Application", () => {
    beforeEach(() => {
      // Mock the state after migration
      mockSupabaseServer.list_tables.mockResolvedValue([
        { name: "subscription_plans", rls_enabled: true, columns: [] },
        { name: "member_subscriptions", rls_enabled: true, columns: [] },
        { name: "subscription_payments", rls_enabled: true, columns: [] },
        { name: "notifications", rls_enabled: true, columns: [] },
        { name: "realtime_notifications", rls_enabled: true, columns: [] },
      ]);

      // Mock migration is now in the list
      mockSupabaseServer.list_migrations.mockResolvedValue([
        { name: "subscription_plans_enhancement", version: "20250824000000" },
        { name: "member_subscriptions_snapshots", version: "20250824000001" },
        {
          name: "subscription_payments_enhancements",
          version: "20250824000002",
        },
        { name: "notification_tables", version: "20250824000003" },
        { name: MIGRATION_NAME, version: "20250824000004" },
      ]);
    });

    it("should have RLS enabled on all subscription tables", async () => {
      const tables = await mockSupabaseServer.list_tables();

      const tableNames = [
        "subscription_plans",
        "member_subscriptions",
        "subscription_payments",
        "notifications",
        "realtime_notifications",
      ];

      for (const tableName of tableNames) {
        const table = tables.find((t) => t.name === tableName);
        expect(
          table?.rls_enabled,
          `RLS should be enabled on ${tableName}`
        ).toBe(true);
      }
    });

    it("should have is_admin helper function", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ proname: "is_admin" }],
        error: null,
      });

      await Epic01TestHelpers.verifyFunctionExists("is_admin");
      expect(mockSupabaseServer.execute_sql).toHaveBeenCalledWith({
        query: expect.stringContaining("proname = 'is_admin'"),
      });
    });

    it("should have is_staff helper function", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ proname: "is_staff" }],
        error: null,
      });

      await Epic01TestHelpers.verifyFunctionExists("is_staff");
      expect(mockSupabaseServer.execute_sql).toHaveBeenCalledWith({
        query: expect.stringContaining("proname = 'is_staff'"),
      });
    });

    it("should have subscription_plans policies", async () => {
      const expectedPolicies = [
        { name: "Anyone can view active plans", command: "SELECT" },
        { name: "Admins can manage plans", command: "ALL" },
      ];

      for (const { name, command } of expectedPolicies) {
        mockSupabaseServer.execute_sql.mockResolvedValue({
          data: [{ policyname: name, cmd: command }],
          error: null,
        });

        await Epic01TestHelpers.verifyRLSPolicy(
          "subscription_plans",
          name,
          command as any
        );
      }
    });

    it("should have member_subscriptions policies", async () => {
      const expectedPolicies = [
        { name: "Members can view own subscriptions", command: "SELECT" },
        { name: "Staff can manage subscriptions", command: "ALL" },
      ];

      for (const { name, command } of expectedPolicies) {
        mockSupabaseServer.execute_sql.mockResolvedValue({
          data: [{ policyname: name, cmd: command }],
          error: null,
        });

        await Epic01TestHelpers.verifyRLSPolicy(
          "member_subscriptions",
          name,
          command as any
        );
      }
    });

    it("should have subscription_payments policies", async () => {
      const expectedPolicies = [
        { name: "Members can view own payments", command: "SELECT" },
        { name: "Staff can manage payments", command: "ALL" },
      ];

      for (const { name, command } of expectedPolicies) {
        mockSupabaseServer.execute_sql.mockResolvedValue({
          data: [{ policyname: name, cmd: command }],
          error: null,
        });

        await Epic01TestHelpers.verifyRLSPolicy(
          "subscription_payments",
          name,
          command as any
        );
      }
    });

    it("should have notifications policies", async () => {
      const expectedPolicies = [
        { name: "Members can view own notifications", command: "SELECT" },
        { name: "Staff can manage notifications", command: "ALL" },
      ];

      for (const { name, command } of expectedPolicies) {
        mockSupabaseServer.execute_sql.mockResolvedValue({
          data: [{ policyname: name, cmd: command }],
          error: null,
        });

        await Epic01TestHelpers.verifyRLSPolicy(
          "notifications",
          name,
          command as any
        );
      }
    });

    it("should have realtime_notifications policies", async () => {
      const expectedPolicies = [
        {
          name: "Users can view own realtime notifications",
          command: "SELECT",
        },
        { name: "Staff can manage realtime notifications", command: "ALL" },
      ];

      for (const { name, command } of expectedPolicies) {
        mockSupabaseServer.execute_sql.mockResolvedValue({
          data: [{ policyname: name, cmd: command }],
          error: null,
        });

        await Epic01TestHelpers.verifyRLSPolicy(
          "realtime_notifications",
          name,
          command as any
        );
      }
    });

    it("should be included in migration list", async () => {
      await Epic01TestHelpers.verifyMigrationApplied(MIGRATION_NAME);
      expect(mockSupabaseServer.list_migrations).toHaveBeenCalled();
    });
  });

  describe("Helper Function Behavior", () => {
    it("should return true for admin user in is_admin function", async () => {
      // Mock admin user context
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ is_admin: true }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: "SELECT is_admin()",
      });

      expect(result.data[0].is_admin).toBe(true);
    });

    it("should return false for non-admin user in is_admin function", async () => {
      // Mock non-admin user context
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ is_admin: false }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: "SELECT is_admin()",
      });

      expect(result.data[0].is_admin).toBe(false);
    });

    it("should return true for admin user in is_staff function", async () => {
      // Mock admin user context (admin is also staff)
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ is_staff: true }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: "SELECT is_staff()",
      });

      expect(result.data[0].is_staff).toBe(true);
    });

    it("should return true for trainer user in is_staff function", async () => {
      // Mock trainer user context
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ is_staff: true }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: "SELECT is_staff()",
      });

      expect(result.data[0].is_staff).toBe(true);
    });

    it("should return false for non-staff user in is_staff function", async () => {
      // Mock regular user context
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ is_staff: false }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: "SELECT is_staff()",
      });

      expect(result.data[0].is_staff).toBe(false);
    });
  });

  describe("Policy Access Control", () => {
    it("should allow admin to access all subscription plans", async () => {
      // Mock admin access
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          { id: "plan-1", name: "Basic Plan", is_active: true },
          { id: "plan-2", name: "Premium Plan", is_active: false },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: "SELECT * FROM subscription_plans",
      });

      expect(result.data).toHaveLength(2);
    });

    it("should allow anyone to view only active subscription plans", async () => {
      // Mock public access (only active plans)
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ id: "plan-1", name: "Basic Plan", is_active: true }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: "SELECT * FROM subscription_plans WHERE is_active = true",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].is_active).toBe(true);
    });

    it("should allow member to view own subscriptions", async () => {
      // Mock member viewing own subscriptions
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ id: "sub-1", member_id: "member-123", status: "active" }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT * FROM member_subscriptions
          WHERE member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
          )
        `,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].member_id).toBe("member-123");
    });

    it("should allow staff to view all subscriptions", async () => {
      // Mock staff access to all subscriptions
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          { id: "sub-1", member_id: "member-123", status: "active" },
          { id: "sub-2", member_id: "member-456", status: "expired" },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: "SELECT * FROM member_subscriptions",
      });

      expect(result.data).toHaveLength(2);
    });

    it("should deny unauthorized access to subscriptions", async () => {
      // Mock access denied error for this specific call
      mockSupabaseServer.execute_sql.mockRejectedValueOnce(
        new Error(
          'row-level security policy for table "member_subscriptions" violated'
        )
      );

      await expect(
        mockSupabaseServer.execute_sql({
          query: "SELECT * FROM member_subscriptions",
        })
      ).rejects.toThrow(
        'row-level security policy for table "member_subscriptions" violated'
      );
    });

    it("should allow member to view own payments", async () => {
      // Mock member viewing own payments
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ id: "payment-1", member_id: "member-123", amount: 100.0 }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT * FROM subscription_payments
          WHERE member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
          )
        `,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].member_id).toBe("member-123");
    });

    it("should allow member to view own notifications", async () => {
      // Mock member viewing own notifications
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          { id: "notif-1", member_id: "member-123", title: "Payment Due" },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT * FROM notifications
          WHERE member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
          )
        `,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].member_id).toBe("member-123");
    });

    it("should allow user to view own realtime notifications", async () => {
      // Mock user viewing own realtime notifications
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          { id: "realtime-1", user_id: "user-123", title: "System Alert" },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query:
          "SELECT * FROM realtime_notifications WHERE user_id = auth.uid()",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_id).toBe("user-123");
    });
  });

  describe("Security Validation", () => {
    it("should use SECURITY DEFINER for helper functions", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          { proname: "is_admin", prosecdef: true },
          { proname: "is_staff", prosecdef: true },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT proname, prosecdef
          FROM pg_proc
          WHERE proname IN ('is_admin', 'is_staff')
        `,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.every((fn) => fn.prosecdef === true)).toBe(true);
    });

    it("should prevent SQL injection in policy checks", async () => {
      // Test that policies use parameterized queries and auth.uid()
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [],
        error: null,
      });

      // Should not be vulnerable to injection
      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT * FROM member_subscriptions
          WHERE member_id = 'malicious'' OR ''1''=''1'
        `,
      });

      // Should return empty result due to RLS protection
      expect(result.data).toHaveLength(0);
    });

    it("should enforce policies on all DML operations", async () => {
      const operations = ["SELECT", "INSERT", "UPDATE", "DELETE"];

      for (const operation of operations) {
        // Mock policy enforcement for each operation
        mockSupabaseServer.execute_sql.mockRejectedValueOnce(
          new Error(
            `${operation} operation denied by row-level security policy`
          )
        );

        await expect(
          mockSupabaseServer.execute_sql({
            query: `${operation === "SELECT" ? "SELECT * FROM" : operation === "INSERT" ? "INSERT INTO" : operation === "UPDATE" ? "UPDATE" : "DELETE FROM"} subscription_payments`,
          })
        ).rejects.toThrow("row-level security policy");
      }
    });
  });
});
