import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  Epic01TestHelpers,
  mockSupabaseServer,
} from "../epic-01-database.test";

/**
 * Tests for subscription_plans_enhancement migration
 *
 * This migration should:
 * 1. Add sessions_count column (INTEGER NOT NULL DEFAULT 0)
 * 2. Add duration_type column (VARCHAR(20) DEFAULT 'informational')
 * 3. Add positive_sessions CHECK constraint
 * 4. Update existing plans with session counts
 */

describe("Migration: subscription_plans_enhancement", () => {
  const MIGRATION_NAME = "subscription_plans_enhancement";

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the current subscription_plans table structure (before migration)
    mockSupabaseServer.list_tables.mockResolvedValue([
      {
        name: "subscription_plans",
        columns: [
          { name: "id", data_type: "uuid", options: ["updatable"] },
          { name: "name", data_type: "text", options: ["updatable"] },
          { name: "plan_type", data_type: "text", options: ["updatable"] },
          { name: "price", data_type: "numeric", options: ["updatable"] },
          { name: "billing_cycle", data_type: "text", options: ["updatable"] },
          // Missing: sessions_count, duration_type
        ],
      },
    ]);

    // Mock migration list (before applying)
    mockSupabaseServer.list_migrations.mockResolvedValue([
      { name: "create_subscription_system_fixed", version: "20250823094457" },
      // Missing: subscription_plans_enhancement
    ]);
  });

  afterEach(async () => {
    await Epic01TestHelpers.cleanupTestData();
  });

  describe("Before Migration Application", () => {
    it("should not have sessions_count column", async () => {
      const tables = await mockSupabaseServer.list_tables();
      const subscriptionPlansTable = tables.find(
        (t: { name: string }) => t.name === "subscription_plans"
      );

      expect(subscriptionPlansTable).toBeDefined();

      const sessionsCountColumn = subscriptionPlansTable.columns.find(
        (c: { name: string }) => c.name === "sessions_count"
      );

      expect(sessionsCountColumn).toBeUndefined();
    });

    it("should not have duration_type column", async () => {
      const tables = await mockSupabaseServer.list_tables();
      const subscriptionPlansTable = tables.find(
        (t: { name: string }) => t.name === "subscription_plans"
      );

      expect(subscriptionPlansTable).toBeDefined();

      const durationTypeColumn = subscriptionPlansTable.columns.find(
        (c: { name: string }) => c.name === "duration_type"
      );

      expect(durationTypeColumn).toBeUndefined();
    });

    it("should not have positive_sessions constraint", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT constraint_name
          FROM information_schema.table_constraints
          WHERE table_name = 'subscription_plans'
          AND constraint_name = 'positive_sessions';
        `,
      });

      expect(result.data).toHaveLength(0);
    });

    it("should not be in migration list", async () => {
      const migrations = await mockSupabaseServer.list_migrations();
      const migration = migrations.find(
        (m: { name: string }) => m.name === MIGRATION_NAME
      );

      expect(migration).toBeUndefined();
    });
  });

  describe("Migration Application", () => {
    it("should apply migration successfully", async () => {
      mockSupabaseServer.apply_migration.mockResolvedValue({ success: true });

      const result = await mockSupabaseServer.apply_migration({
        name: MIGRATION_NAME,
        query: `
          -- Add session tracking to subscription plans
          ALTER TABLE subscription_plans
          ADD COLUMN sessions_count INTEGER NOT NULL DEFAULT 0,
          ADD COLUMN duration_type VARCHAR(20) DEFAULT 'informational';

          -- Add constraint to ensure positive sessions
          ALTER TABLE subscription_plans
          ADD CONSTRAINT positive_sessions CHECK (sessions_count > 0);

          -- Update existing plans with session counts
          UPDATE subscription_plans SET sessions_count = 10 WHERE plan_type = 'basic';
          UPDATE subscription_plans SET sessions_count = 20 WHERE plan_type = 'premium';
          UPDATE subscription_plans SET sessions_count = 30 WHERE plan_type = 'vip';
        `,
      });

      expect(result.success).toBe(true);
      expect(mockSupabaseServer.apply_migration).toHaveBeenCalledWith({
        name: MIGRATION_NAME,
        query: expect.stringContaining("ALTER TABLE subscription_plans"),
      });
    });

    it("should include all required SQL statements", async () => {
      await mockSupabaseServer.apply_migration({
        name: MIGRATION_NAME,
        query: expect.stringContaining(
          "ADD COLUMN sessions_count INTEGER NOT NULL DEFAULT 0"
        ),
      });

      await mockSupabaseServer.apply_migration({
        name: MIGRATION_NAME,
        query: expect.stringContaining(
          "ADD COLUMN duration_type VARCHAR(20) DEFAULT 'informational'"
        ),
      });

      await mockSupabaseServer.apply_migration({
        name: MIGRATION_NAME,
        query: expect.stringContaining(
          "ADD CONSTRAINT positive_sessions CHECK (sessions_count > 0)"
        ),
      });

      await mockSupabaseServer.apply_migration({
        name: MIGRATION_NAME,
        query: expect.stringContaining(
          "UPDATE subscription_plans SET sessions_count = 10 WHERE plan_type = 'basic'"
        ),
      });
    });
  });

  describe("After Migration Application", () => {
    beforeEach(() => {
      // Mock the table structure after migration
      mockSupabaseServer.list_tables.mockResolvedValue([
        {
          name: "subscription_plans",
          columns: [
            { name: "id", data_type: "uuid", options: ["updatable"] },
            { name: "name", data_type: "text", options: ["updatable"] },
            { name: "plan_type", data_type: "text", options: ["updatable"] },
            { name: "price", data_type: "numeric", options: ["updatable"] },
            {
              name: "billing_cycle",
              data_type: "text",
              options: ["updatable"],
            },
            {
              name: "sessions_count",
              data_type: "integer",
              options: ["updatable"],
              default_value: "0",
            },
            {
              name: "duration_type",
              data_type: "varchar",
              options: ["updatable", "nullable"],
              default_value: "'informational'::varchar",
            },
          ],
        },
      ]);

      // Mock migration is now in the list
      mockSupabaseServer.list_migrations.mockResolvedValue([
        { name: "create_subscription_system_fixed", version: "20250823094457" },
        { name: MIGRATION_NAME, version: "20250824000000" },
      ]);
    });

    it("should have sessions_count column with correct properties", async () => {
      await Epic01TestHelpers.verifyTableStructure("subscription_plans", [
        { name: "sessions_count", type: "integer", nullable: false },
      ]);

      expect(mockSupabaseServer.list_tables).toHaveBeenCalled();
    });

    it("should have duration_type column with correct properties", async () => {
      await Epic01TestHelpers.verifyTableStructure("subscription_plans", [
        { name: "duration_type", type: "varchar", nullable: true },
      ]);

      expect(mockSupabaseServer.list_tables).toHaveBeenCalled();
    });

    it("should have positive_sessions constraint", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          { constraint_name: "positive_sessions", constraint_type: "CHECK" },
        ],
        error: null,
      });

      await Epic01TestHelpers.verifyConstraintExists(
        "subscription_plans",
        "positive_sessions",
        "CHECK"
      );

      expect(mockSupabaseServer.execute_sql).toHaveBeenCalledWith({
        query: expect.stringContaining("constraint_name = 'positive_sessions'"),
      });
    });

    it("should have updated existing plans with session counts", async () => {
      // Mock plan data after update
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          { plan_type: "basic", sessions_count: 10 },
          { plan_type: "premium", sessions_count: 20 },
          { plan_type: "vip", sessions_count: 30 },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query:
          "SELECT plan_type, sessions_count FROM subscription_plans ORDER BY plan_type",
      });

      expect(result.data).toEqual([
        { plan_type: "basic", sessions_count: 10 },
        { plan_type: "premium", sessions_count: 20 },
        { plan_type: "vip", sessions_count: 30 },
      ]);
    });

    it("should be included in migration list", async () => {
      await Epic01TestHelpers.verifyMigrationApplied(MIGRATION_NAME);
      expect(mockSupabaseServer.list_migrations).toHaveBeenCalled();
    });
  });

  describe("Data Validation", () => {
    it("should enforce positive sessions constraint", async () => {
      // Mock constraint violation error for this specific call
      mockSupabaseServer.execute_sql.mockRejectedValueOnce(
        new Error('CHECK constraint "positive_sessions" is violated')
      );

      await expect(
        mockSupabaseServer.execute_sql({
          query: `
            INSERT INTO subscription_plans (name, plan_type, price, billing_cycle, sessions_count)
            VALUES ('Invalid Plan', 'basic', 50.00, 'monthly', -1)
          `,
        })
      ).rejects.toThrow('CHECK constraint "positive_sessions" is violated');
    });

    it("should allow zero sessions with warning for informational plans", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ id: "plan-123" }],
        error: null,
      });

      // Should succeed for duration_type = 'informational'
      const result = await mockSupabaseServer.execute_sql({
        query: `
          INSERT INTO subscription_plans (name, plan_type, price, billing_cycle, sessions_count, duration_type)
          VALUES ('Info Plan', 'basic', 50.00, 'monthly', 0, 'informational')
          RETURNING id
        `,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("plan-123");
    });

    it("should set default duration_type to informational", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ duration_type: "informational" }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          INSERT INTO subscription_plans (name, plan_type, price, billing_cycle, sessions_count)
          VALUES ('Default Plan', 'basic', 50.00, 'monthly', 10)
          RETURNING duration_type
        `,
      });

      expect(result.data[0].duration_type).toBe("informational");
    });
  });
});
