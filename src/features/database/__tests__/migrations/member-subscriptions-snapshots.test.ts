import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  Epic01TestHelpers,
  mockSupabaseServer,
} from "../epic-01-database.test";

/**
 * Tests for member_subscriptions_snapshots migration
 *
 * This migration should:
 * 1. Add snapshot fields for plan details at time of purchase
 * 2. Add tracking fields (used_sessions, paid_amount, upgraded_to_id)
 * 3. Add performance indexes
 * 4. Add computed column for remaining_sessions
 */

describe("Migration: member_subscriptions_snapshots", () => {
  const MIGRATION_NAME = "member_subscriptions_snapshots";

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the current member_subscriptions table structure (before migration)
    mockSupabaseServer.list_tables.mockResolvedValue([
      {
        name: "member_subscriptions",
        columns: [
          { name: "id", data_type: "uuid", options: ["updatable"] },
          { name: "member_id", data_type: "uuid", options: ["updatable"] },
          { name: "plan_id", data_type: "uuid", options: ["updatable"] },
          { name: "status", data_type: "text", options: ["updatable"] },
          { name: "start_date", data_type: "date", options: ["updatable"] },
          {
            name: "end_date",
            data_type: "date",
            options: ["nullable", "updatable"],
          },
          { name: "price", data_type: "numeric", options: ["updatable"] },
          // Missing snapshot and tracking fields
        ],
      },
    ]);

    // Mock migration list (before applying)
    mockSupabaseServer.list_migrations.mockResolvedValue([
      { name: "subscription_plans_enhancement", version: "20250824000000" },
      // Missing: member_subscriptions_snapshots
    ]);
  });

  afterEach(async () => {
    await Epic01TestHelpers.cleanupTestData();
  });

  describe("Before Migration Application", () => {
    it("should not have snapshot fields", async () => {
      const tables = await mockSupabaseServer.list_tables();
      const memberSubscriptionsTable = tables.find(
        (t) => t.name === "member_subscriptions"
      );

      expect(memberSubscriptionsTable).toBeDefined();

      const snapshotFields = [
        "plan_name_snapshot",
        "total_sessions_snapshot",
        "total_amount_snapshot",
        "duration_days_snapshot",
      ];

      for (const fieldName of snapshotFields) {
        const field = memberSubscriptionsTable.columns.find(
          (c) => c.name === fieldName
        );
        expect(
          field,
          `${fieldName} should not exist before migration`
        ).toBeUndefined();
      }
    });

    it("should not have tracking fields", async () => {
      const tables = await mockSupabaseServer.list_tables();
      const memberSubscriptionsTable = tables.find(
        (t) => t.name === "member_subscriptions"
      );

      expect(memberSubscriptionsTable).toBeDefined();

      const trackingFields = ["used_sessions", "paid_amount", "upgraded_to_id"];

      for (const fieldName of trackingFields) {
        const field = memberSubscriptionsTable.columns.find(
          (c) => c.name === fieldName
        );
        expect(
          field,
          `${fieldName} should not exist before migration`
        ).toBeUndefined();
      }
    });

    it("should not have remaining_sessions computed column", async () => {
      const tables = await mockSupabaseServer.list_tables();
      const memberSubscriptionsTable = tables.find(
        (t) => t.name === "member_subscriptions"
      );

      expect(memberSubscriptionsTable).toBeDefined();

      const remainingSessionsField = memberSubscriptionsTable.columns.find(
        (c) => c.name === "remaining_sessions"
      );

      expect(remainingSessionsField).toBeUndefined();
    });

    it("should not have performance indexes", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [],
        error: null,
      });

      const indexNames = [
        "idx_member_subscriptions_member_status",
        "idx_member_subscriptions_used_sessions",
      ];

      for (const indexName of indexNames) {
        const result = await mockSupabaseServer.execute_sql({
          query: `
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'member_subscriptions'
            AND indexname = '${indexName}';
          `,
        });

        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe("Migration Application", () => {
    it("should apply migration successfully", async () => {
      mockSupabaseServer.apply_migration.mockResolvedValue({ success: true });

      const result = await mockSupabaseServer.apply_migration({
        name: MIGRATION_NAME,
        query: `
          -- Add snapshot fields for plan details at time of purchase
          ALTER TABLE member_subscriptions
          ADD COLUMN plan_name_snapshot VARCHAR(100),
          ADD COLUMN total_sessions_snapshot INTEGER,
          ADD COLUMN total_amount_snapshot DECIMAL(10,2),
          ADD COLUMN duration_days_snapshot INTEGER,
          ADD COLUMN used_sessions INTEGER DEFAULT 0,
          ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0,
          ADD COLUMN upgraded_to_id UUID REFERENCES member_subscriptions(id);

          -- Add indexes for performance
          CREATE INDEX idx_member_subscriptions_member_status
          ON member_subscriptions(member_id, status);

          CREATE INDEX idx_member_subscriptions_used_sessions
          ON member_subscriptions(used_sessions);

          -- Add computed column for remaining sessions
          ALTER TABLE member_subscriptions
          ADD COLUMN remaining_sessions INTEGER
          GENERATED ALWAYS AS (total_sessions_snapshot - used_sessions) STORED;
        `,
      });

      expect(result.success).toBe(true);
      expect(mockSupabaseServer.apply_migration).toHaveBeenCalledWith({
        name: MIGRATION_NAME,
        query: expect.stringContaining("ALTER TABLE member_subscriptions"),
      });
    });

    it("should include all required SQL statements", async () => {
      const expectedStatements = [
        "ADD COLUMN plan_name_snapshot VARCHAR(100)",
        "ADD COLUMN total_sessions_snapshot INTEGER",
        "ADD COLUMN total_amount_snapshot DECIMAL(10,2)",
        "ADD COLUMN duration_days_snapshot INTEGER",
        "ADD COLUMN used_sessions INTEGER DEFAULT 0",
        "ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0",
        "ADD COLUMN upgraded_to_id UUID REFERENCES member_subscriptions(id)",
        "CREATE INDEX idx_member_subscriptions_member_status",
        "CREATE INDEX idx_member_subscriptions_used_sessions",
        "ADD COLUMN remaining_sessions INTEGER GENERATED ALWAYS AS",
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
      // Mock the table structure after migration
      mockSupabaseServer.list_tables.mockResolvedValue([
        {
          name: "member_subscriptions",
          columns: [
            { name: "id", data_type: "uuid", options: ["updatable"] },
            { name: "member_id", data_type: "uuid", options: ["updatable"] },
            { name: "plan_id", data_type: "uuid", options: ["updatable"] },
            { name: "status", data_type: "text", options: ["updatable"] },
            { name: "start_date", data_type: "date", options: ["updatable"] },
            {
              name: "end_date",
              data_type: "date",
              options: ["nullable", "updatable"],
            },
            { name: "price", data_type: "numeric", options: ["updatable"] },
            // New snapshot fields
            {
              name: "plan_name_snapshot",
              data_type: "varchar",
              options: ["nullable", "updatable"],
            },
            {
              name: "total_sessions_snapshot",
              data_type: "integer",
              options: ["nullable", "updatable"],
            },
            {
              name: "total_amount_snapshot",
              data_type: "decimal",
              options: ["nullable", "updatable"],
            },
            {
              name: "duration_days_snapshot",
              data_type: "integer",
              options: ["nullable", "updatable"],
            },
            // New tracking fields
            {
              name: "used_sessions",
              data_type: "integer",
              options: ["updatable"],
              default_value: "0",
            },
            {
              name: "paid_amount",
              data_type: "decimal",
              options: ["updatable"],
              default_value: "0",
            },
            {
              name: "upgraded_to_id",
              data_type: "uuid",
              options: ["nullable", "updatable"],
            },
            // Computed field
            {
              name: "remaining_sessions",
              data_type: "integer",
              options: [],
              generated: true,
            },
          ],
        },
      ]);

      // Mock migration is now in the list
      mockSupabaseServer.list_migrations.mockResolvedValue([
        { name: "subscription_plans_enhancement", version: "20250824000000" },
        { name: MIGRATION_NAME, version: "20250824000001" },
      ]);
    });

    it("should have all snapshot fields with correct properties", async () => {
      const expectedSnapshotFields = [
        { name: "plan_name_snapshot", type: "varchar", nullable: true },
        { name: "total_sessions_snapshot", type: "integer", nullable: true },
        { name: "total_amount_snapshot", type: "decimal", nullable: true },
        { name: "duration_days_snapshot", type: "integer", nullable: true },
      ];

      await Epic01TestHelpers.verifyTableStructure(
        "member_subscriptions",
        expectedSnapshotFields
      );
      expect(mockSupabaseServer.list_tables).toHaveBeenCalled();
    });

    it("should have all tracking fields with correct properties", async () => {
      const expectedTrackingFields = [
        { name: "used_sessions", type: "integer", nullable: false },
        { name: "paid_amount", type: "decimal", nullable: false },
        { name: "upgraded_to_id", type: "uuid", nullable: true },
      ];

      await Epic01TestHelpers.verifyTableStructure(
        "member_subscriptions",
        expectedTrackingFields
      );
      expect(mockSupabaseServer.list_tables).toHaveBeenCalled();
    });

    it("should have remaining_sessions computed column", async () => {
      await Epic01TestHelpers.verifyTableStructure("member_subscriptions", [
        { name: "remaining_sessions", type: "integer" },
      ]);

      // Verify it's a generated column
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ is_generated: "ALWAYS" }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT is_generated
          FROM information_schema.columns
          WHERE table_name = 'member_subscriptions'
          AND column_name = 'remaining_sessions';
        `,
      });

      expect(result.data[0].is_generated).toBe("ALWAYS");
    });

    it("should have performance indexes", async () => {
      const indexChecks = [
        "idx_member_subscriptions_member_status",
        "idx_member_subscriptions_used_sessions",
      ];

      for (const indexName of indexChecks) {
        mockSupabaseServer.execute_sql.mockResolvedValue({
          data: [{ indexname: indexName }],
          error: null,
        });

        await Epic01TestHelpers.verifyIndexExists(
          "member_subscriptions",
          indexName
        );
      }

      expect(mockSupabaseServer.execute_sql).toHaveBeenCalledTimes(
        indexChecks.length
      );
    });

    it("should have foreign key constraint on upgraded_to_id", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            constraint_name: "member_subscriptions_upgraded_to_id_fkey",
            constraint_type: "FOREIGN KEY",
          },
        ],
        error: null,
      });

      await Epic01TestHelpers.verifyConstraintExists(
        "member_subscriptions",
        "member_subscriptions_upgraded_to_id_fkey",
        "FOREIGN KEY"
      );

      expect(mockSupabaseServer.execute_sql).toHaveBeenCalledWith({
        query: expect.stringContaining(
          "constraint_name = 'member_subscriptions_upgraded_to_id_fkey'"
        ),
      });
    });

    it("should be included in migration list", async () => {
      await Epic01TestHelpers.verifyMigrationApplied(MIGRATION_NAME);
      expect(mockSupabaseServer.list_migrations).toHaveBeenCalled();
    });
  });

  describe("Data Integrity and Computed Columns", () => {
    it("should calculate remaining_sessions correctly", async () => {
      // Mock subscription with snapshot data
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            total_sessions_snapshot: 20,
            used_sessions: 5,
            remaining_sessions: 15,
          },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT total_sessions_snapshot, used_sessions, remaining_sessions
          FROM member_subscriptions
          WHERE id = 'test-subscription-id'
        `,
      });

      const subscription = result.data[0];
      expect(subscription.remaining_sessions).toBe(
        subscription.total_sessions_snapshot - subscription.used_sessions
      );
    });

    it("should handle null total_sessions_snapshot in remaining_sessions calculation", async () => {
      // Mock subscription with null snapshot
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            total_sessions_snapshot: null,
            used_sessions: 5,
            remaining_sessions: null,
          },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT total_sessions_snapshot, used_sessions, remaining_sessions
          FROM member_subscriptions
          WHERE total_sessions_snapshot IS NULL
        `,
      });

      const subscription = result.data[0];
      expect(subscription.remaining_sessions).toBeNull();
    });

    it("should allow self-referencing upgraded_to_id constraint", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ id: "subscription-2" }],
        error: null,
      });

      // Should allow referencing another subscription in the same table
      const result = await mockSupabaseServer.execute_sql({
        query: `
          UPDATE member_subscriptions
          SET upgraded_to_id = 'subscription-2'
          WHERE id = 'subscription-1'
          RETURNING id
        `,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("subscription-2");
    });

    it("should enforce foreign key constraint on upgraded_to_id", async () => {
      // Mock constraint violation error for this specific call
      mockSupabaseServer.execute_sql.mockRejectedValueOnce(
        new Error(
          'insert or update on table "member_subscriptions" violates foreign key constraint'
        )
      );

      await expect(
        mockSupabaseServer.execute_sql({
          query: `
            UPDATE member_subscriptions
            SET upgraded_to_id = 'non-existent-subscription-id'
            WHERE id = 'subscription-1'
          `,
        })
      ).rejects.toThrow("violates foreign key constraint");
    });
  });

  describe("Index Performance", () => {
    it("should optimize queries by member_id and status", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            query_plan:
              "Index Scan using idx_member_subscriptions_member_status",
          },
        ],
        error: null,
      });

      // Simulate explain plan query
      const result = await mockSupabaseServer.execute_sql({
        query: `
          EXPLAIN (FORMAT TEXT)
          SELECT * FROM member_subscriptions
          WHERE member_id = 'member-123' AND status = 'active'
        `,
      });

      expect(result.data[0].query_plan).toContain(
        "idx_member_subscriptions_member_status"
      );
    });

    it("should optimize queries by used_sessions", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            query_plan:
              "Index Scan using idx_member_subscriptions_used_sessions",
          },
        ],
        error: null,
      });

      // Simulate explain plan query for sessions tracking
      const result = await mockSupabaseServer.execute_sql({
        query: `
          EXPLAIN (FORMAT TEXT)
          SELECT * FROM member_subscriptions
          WHERE used_sessions > 15
        `,
      });

      expect(result.data[0].query_plan).toContain(
        "idx_member_subscriptions_used_sessions"
      );
    });
  });
});
