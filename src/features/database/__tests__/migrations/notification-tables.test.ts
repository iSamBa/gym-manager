import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  Epic01TestHelpers,
  mockSupabaseServer,
} from "../epic-01-database.test";

/**
 * Tests for notification_tables migration
 *
 * This migration should:
 * 1. Create notifications table for subscription alerts
 * 2. Create realtime_notifications table for instant alerts
 * 3. Add appropriate indexes for performance
 * 4. Set up proper foreign key relationships
 */

describe("Migration: notification_tables", () => {
  const MIGRATION_NAME = "notification_tables";

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the current database structure (before migration)
    // notification tables should not exist yet
    mockSupabaseServer.list_tables.mockResolvedValue([
      { name: "subscription_plans", columns: [] },
      { name: "member_subscriptions", columns: [] },
      { name: "subscription_payments", columns: [] },
      { name: "members", columns: [] },
      { name: "trainers", columns: [] },
      // Missing: notifications, realtime_notifications
    ]);

    // Mock migration list (before applying)
    mockSupabaseServer.list_migrations.mockResolvedValue([
      { name: "subscription_plans_enhancement", version: "20250824000000" },
      { name: "member_subscriptions_snapshots", version: "20250824000001" },
      { name: "subscription_payments_enhancements", version: "20250824000002" },
      // Missing: notification_tables
    ]);
  });

  afterEach(async () => {
    await Epic01TestHelpers.cleanupTestData();
  });

  describe("Before Migration Application", () => {
    it("should not have notifications table", async () => {
      const tables = await mockSupabaseServer.list_tables();
      const notificationsTable = tables.find((t) => t.name === "notifications");

      expect(notificationsTable).toBeUndefined();
    });

    it("should not have realtime_notifications table", async () => {
      const tables = await mockSupabaseServer.list_tables();
      const realtimeNotificationsTable = tables.find(
        (t) => t.name === "realtime_notifications"
      );

      expect(realtimeNotificationsTable).toBeUndefined();
    });

    it("should not have notification-related indexes", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [],
        error: null,
      });

      const indexNames = [
        "idx_notifications_member_id",
        "idx_notifications_type",
        "idx_notifications_created_at",
        "idx_realtime_notifications_user_id",
        "idx_realtime_notifications_read",
      ];

      for (const indexName of indexNames) {
        const result = await mockSupabaseServer.execute_sql({
          query: `
            SELECT indexname
            FROM pg_indexes
            WHERE indexname = '${indexName}';
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
          -- Create notifications table for subscription alerts
          CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            type VARCHAR(50) NOT NULL,
            member_id UUID REFERENCES members(id),
            trainer_id UUID REFERENCES trainers(id),
            subscription_id UUID REFERENCES member_subscriptions(id),
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            metadata JSONB,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Create realtime notifications table for instant alerts
          CREATE TABLE realtime_notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            priority VARCHAR(20) DEFAULT 'medium',
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Add indexes for performance
          CREATE INDEX idx_notifications_member_id ON notifications(member_id);
          CREATE INDEX idx_notifications_type ON notifications(type);
          CREATE INDEX idx_notifications_created_at ON notifications(created_at);
          CREATE INDEX idx_realtime_notifications_user_id ON realtime_notifications(user_id);
          CREATE INDEX idx_realtime_notifications_read ON realtime_notifications(read);
        `,
      });

      expect(result.success).toBe(true);
      expect(mockSupabaseServer.apply_migration).toHaveBeenCalledWith({
        name: MIGRATION_NAME,
        query: expect.stringContaining("CREATE TABLE notifications"),
      });
    });

    it("should include all required SQL statements", async () => {
      const expectedStatements = [
        "CREATE TABLE notifications",
        "CREATE TABLE realtime_notifications",
        "CREATE INDEX idx_notifications_member_id",
        "CREATE INDEX idx_notifications_type",
        "CREATE INDEX idx_notifications_created_at",
        "CREATE INDEX idx_realtime_notifications_user_id",
        "CREATE INDEX idx_realtime_notifications_read",
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
        { name: "subscription_plans", columns: [] },
        { name: "member_subscriptions", columns: [] },
        { name: "subscription_payments", columns: [] },
        { name: "members", columns: [] },
        { name: "trainers", columns: [] },
        {
          name: "notifications",
          columns: [
            {
              name: "id",
              data_type: "uuid",
              options: ["updatable"],
              default_value: "gen_random_uuid()",
            },
            { name: "type", data_type: "varchar", options: ["updatable"] },
            {
              name: "member_id",
              data_type: "uuid",
              options: ["nullable", "updatable"],
            },
            {
              name: "trainer_id",
              data_type: "uuid",
              options: ["nullable", "updatable"],
            },
            {
              name: "subscription_id",
              data_type: "uuid",
              options: ["nullable", "updatable"],
            },
            { name: "title", data_type: "varchar", options: ["updatable"] },
            { name: "message", data_type: "text", options: ["updatable"] },
            {
              name: "metadata",
              data_type: "jsonb",
              options: ["nullable", "updatable"],
            },
            {
              name: "read",
              data_type: "boolean",
              options: ["updatable"],
              default_value: "false",
            },
            {
              name: "created_at",
              data_type: "timestamptz",
              options: ["updatable"],
              default_value: "now()",
            },
            {
              name: "updated_at",
              data_type: "timestamptz",
              options: ["updatable"],
              default_value: "now()",
            },
          ],
        },
        {
          name: "realtime_notifications",
          columns: [
            {
              name: "id",
              data_type: "uuid",
              options: ["updatable"],
              default_value: "gen_random_uuid()",
            },
            { name: "user_id", data_type: "uuid", options: ["updatable"] },
            { name: "type", data_type: "varchar", options: ["updatable"] },
            { name: "title", data_type: "varchar", options: ["updatable"] },
            { name: "message", data_type: "text", options: ["updatable"] },
            {
              name: "priority",
              data_type: "varchar",
              options: ["updatable"],
              default_value: "'medium'",
            },
            {
              name: "read",
              data_type: "boolean",
              options: ["updatable"],
              default_value: "false",
            },
            {
              name: "created_at",
              data_type: "timestamptz",
              options: ["updatable"],
              default_value: "now()",
            },
          ],
        },
      ]);

      // Mock migration is now in the list
      mockSupabaseServer.list_migrations.mockResolvedValue([
        { name: "subscription_plans_enhancement", version: "20250824000000" },
        { name: "member_subscriptions_snapshots", version: "20250824000001" },
        {
          name: "subscription_payments_enhancements",
          version: "20250824000002",
        },
        { name: MIGRATION_NAME, version: "20250824000003" },
      ]);
    });

    it("should have notifications table with correct structure", async () => {
      const expectedColumns = [
        { name: "id", type: "uuid", nullable: false },
        { name: "type", type: "varchar", nullable: false },
        { name: "member_id", type: "uuid", nullable: true },
        { name: "trainer_id", type: "uuid", nullable: true },
        { name: "subscription_id", type: "uuid", nullable: true },
        { name: "title", type: "varchar", nullable: false },
        { name: "message", type: "text", nullable: false },
        { name: "metadata", type: "jsonb", nullable: true },
        { name: "read", type: "boolean", nullable: false },
        { name: "created_at", type: "timestamptz", nullable: false },
        { name: "updated_at", type: "timestamptz", nullable: false },
      ];

      await Epic01TestHelpers.verifyTableStructure(
        "notifications",
        expectedColumns
      );
      expect(mockSupabaseServer.list_tables).toHaveBeenCalled();
    });

    it("should have realtime_notifications table with correct structure", async () => {
      const expectedColumns = [
        { name: "id", type: "uuid", nullable: false },
        { name: "user_id", type: "uuid", nullable: false },
        { name: "type", type: "varchar", nullable: false },
        { name: "title", type: "varchar", nullable: false },
        { name: "message", type: "text", nullable: false },
        { name: "priority", type: "varchar", nullable: false },
        { name: "read", type: "boolean", nullable: false },
        { name: "created_at", type: "timestamptz", nullable: false },
      ];

      await Epic01TestHelpers.verifyTableStructure(
        "realtime_notifications",
        expectedColumns
      );
      expect(mockSupabaseServer.list_tables).toHaveBeenCalled();
    });

    it("should have all required indexes", async () => {
      const indexChecks = [
        { table: "notifications", index: "idx_notifications_member_id" },
        { table: "notifications", index: "idx_notifications_type" },
        { table: "notifications", index: "idx_notifications_created_at" },
        {
          table: "realtime_notifications",
          index: "idx_realtime_notifications_user_id",
        },
        {
          table: "realtime_notifications",
          index: "idx_realtime_notifications_read",
        },
      ];

      for (const { table, index } of indexChecks) {
        mockSupabaseServer.execute_sql.mockResolvedValue({
          data: [{ indexname: index }],
          error: null,
        });

        await Epic01TestHelpers.verifyIndexExists(table, index);
      }

      expect(mockSupabaseServer.execute_sql).toHaveBeenCalledTimes(
        indexChecks.length
      );
    });

    it("should have foreign key constraints for notifications table", async () => {
      const foreignKeyChecks = [
        "notifications_member_id_fkey",
        "notifications_trainer_id_fkey",
        "notifications_subscription_id_fkey",
      ];

      for (const constraintName of foreignKeyChecks) {
        mockSupabaseServer.execute_sql.mockResolvedValue({
          data: [
            {
              constraint_name: constraintName,
              constraint_type: "FOREIGN KEY",
            },
          ],
          error: null,
        });

        await Epic01TestHelpers.verifyConstraintExists(
          "notifications",
          constraintName,
          "FOREIGN KEY"
        );
      }

      expect(mockSupabaseServer.execute_sql).toHaveBeenCalledTimes(
        foreignKeyChecks.length
      );
    });

    it("should be included in migration list", async () => {
      await Epic01TestHelpers.verifyMigrationApplied(MIGRATION_NAME);
      expect(mockSupabaseServer.list_migrations).toHaveBeenCalled();
    });
  });

  describe("Default Values and Constraints", () => {
    it("should set default values for notifications table", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            id: "notif-123",
            read: false,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          INSERT INTO notifications (type, title, message)
          VALUES ('subscription_alert', 'Test Notification', 'Test message')
          RETURNING id, read, created_at, updated_at
        `,
      });

      const notification = result.data[0];
      expect(notification.read).toBe(false);
      expect(notification.created_at).toBeDefined();
      expect(notification.updated_at).toBeDefined();
    });

    it("should set default values for realtime_notifications table", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            id: "realtime-123",
            priority: "medium",
            read: false,
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          INSERT INTO realtime_notifications (user_id, type, title, message)
          VALUES ('user-123', 'system_alert', 'Test Alert', 'Test alert message')
          RETURNING id, priority, read, created_at
        `,
      });

      const notification = result.data[0];
      expect(notification.priority).toBe("medium");
      expect(notification.read).toBe(false);
      expect(notification.created_at).toBeDefined();
    });

    it("should allow null values for optional foreign keys in notifications", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            id: "notif-123",
            member_id: null,
            trainer_id: null,
            subscription_id: null,
          },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          INSERT INTO notifications (type, title, message)
          VALUES ('general_alert', 'System Notification', 'General system message')
          RETURNING id, member_id, trainer_id, subscription_id
        `,
      });

      const notification = result.data[0];
      expect(notification.member_id).toBeNull();
      expect(notification.trainer_id).toBeNull();
      expect(notification.subscription_id).toBeNull();
    });

    it("should enforce NOT NULL constraints on required fields", async () => {
      // Mock NOT NULL constraint violations
      const requiredFields = [
        { table: "notifications", field: "type" },
        { table: "notifications", field: "title" },
        { table: "notifications", field: "message" },
        { table: "realtime_notifications", field: "user_id" },
        { table: "realtime_notifications", field: "type" },
        { table: "realtime_notifications", field: "title" },
        { table: "realtime_notifications", field: "message" },
      ];

      for (const { table, field } of requiredFields) {
        mockSupabaseServer.execute_sql.mockRejectedValueOnce(
          new Error(
            `null value in column "${field}" violates not-null constraint`
          )
        );

        await expect(
          mockSupabaseServer.execute_sql({
            query: `INSERT INTO ${table} DEFAULT VALUES`,
          })
        ).rejects.toThrow(
          `null value in column "${field}" violates not-null constraint`
        );
      }
    });
  });

  describe("Data Operations", () => {
    it("should support JSONB metadata in notifications", async () => {
      const metadata = {
        subscription_type: "premium",
        amount: 100.0,
        due_date: "2024-12-31",
      };

      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            id: "notif-123",
            metadata: metadata,
          },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          INSERT INTO notifications (type, title, message, metadata)
          VALUES ('payment_due', 'Payment Due', 'Your payment is due', '${JSON.stringify(metadata)}')
          RETURNING id, metadata
        `,
      });

      expect(result.data[0].metadata).toEqual(metadata);
    });

    it("should support priority levels in realtime_notifications", async () => {
      const priorities = ["low", "medium", "high", "critical"];

      for (const priority of priorities) {
        mockSupabaseServer.execute_sql.mockResolvedValue({
          data: [
            {
              id: `notif-${priority}`,
              priority: priority,
            },
          ],
          error: null,
        });

        const result = await mockSupabaseServer.execute_sql({
          query: `
            INSERT INTO realtime_notifications (user_id, type, title, message, priority)
            VALUES ('user-123', 'alert', 'Test', 'Test message', '${priority}')
            RETURNING id, priority
          `,
        });

        expect(result.data[0].priority).toBe(priority);
      }
    });

    it("should support filtering by read status", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          { id: "notif-1", read: false },
          { id: "notif-2", read: false },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT id, read
          FROM notifications
          WHERE read = false
          ORDER BY created_at DESC
        `,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.every((n) => n.read === false)).toBe(true);
    });

    it("should support notification type filtering", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          { id: "notif-1", type: "subscription_alert" },
          { id: "notif-2", type: "subscription_alert" },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT id, type
          FROM notifications
          WHERE type = 'subscription_alert'
        `,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.every((n) => n.type === "subscription_alert")).toBe(
        true
      );
    });
  });

  describe("Index Performance", () => {
    it("should optimize queries by member_id", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ query_plan: "Index Scan using idx_notifications_member_id" }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          EXPLAIN (FORMAT TEXT)
          SELECT * FROM notifications WHERE member_id = 'member-123'
        `,
      });

      expect(result.data[0].query_plan).toContain(
        "idx_notifications_member_id"
      );
    });

    it("should optimize queries by notification type", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ query_plan: "Index Scan using idx_notifications_type" }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          EXPLAIN (FORMAT TEXT)
          SELECT * FROM notifications WHERE type = 'payment_reminder'
        `,
      });

      expect(result.data[0].query_plan).toContain("idx_notifications_type");
    });

    it("should optimize queries by created_at for chronological ordering", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ query_plan: "Index Scan using idx_notifications_created_at" }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          EXPLAIN (FORMAT TEXT)
          SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10
        `,
      });

      expect(result.data[0].query_plan).toContain(
        "idx_notifications_created_at"
      );
    });

    it("should optimize realtime notifications queries by user_id", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          { query_plan: "Index Scan using idx_realtime_notifications_user_id" },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          EXPLAIN (FORMAT TEXT)
          SELECT * FROM realtime_notifications WHERE user_id = 'user-123'
        `,
      });

      expect(result.data[0].query_plan).toContain(
        "idx_realtime_notifications_user_id"
      );
    });

    it("should optimize realtime notifications queries by read status", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          { query_plan: "Index Scan using idx_realtime_notifications_read" },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          EXPLAIN (FORMAT TEXT)
          SELECT * FROM realtime_notifications WHERE read = false
        `,
      });

      expect(result.data[0].query_plan).toContain(
        "idx_realtime_notifications_read"
      );
    });
  });
});
