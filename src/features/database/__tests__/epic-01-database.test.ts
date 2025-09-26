import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Epic 1: Database Foundation & Migrations - Test Infrastructure
 *
 * This file provides the main test infrastructure for Epic 1 database foundation tests.
 * It sets up utilities and helpers needed for testing database migrations and utilities.
 */

// Mock the Supabase MCP server functions for testing
const mockSupabaseServer = {
  apply_migration: vi.fn(),
  list_migrations: vi.fn(),
  list_tables: vi.fn(),
  execute_sql: vi.fn(),
  get_advisors: vi.fn(),
};

// Mock the MCP server functions
vi.mock(
  "mcp__supabase__apply_migration",
  () => mockSupabaseServer.apply_migration
);
vi.mock(
  "mcp__supabase__list_migrations",
  () => mockSupabaseServer.list_migrations
);
vi.mock("mcp__supabase__list_tables", () => mockSupabaseServer.list_tables);
vi.mock("mcp__supabase__execute_sql", () => mockSupabaseServer.execute_sql);
vi.mock("mcp__supabase__get_advisors", () => mockSupabaseServer.get_advisors);

/**
 * Test helper utilities for Epic 1 database foundation tests
 */
export class Epic01TestHelpers {
  /**
   * Verify that a table exists with expected columns
   */
  static async verifyTableStructure(
    tableName: string,
    expectedColumns: Array<{ name: string; type: string; nullable?: boolean }>
  ): Promise<void> {
    const tables = await mockSupabaseServer.list_tables();
    const table = tables.find((t: any) => t.name === tableName);

    expect(table, `Table ${tableName} should exist`).toBeDefined();

    for (const expectedCol of expectedColumns) {
      const column = table.columns.find(
        (c: any) => c.name === expectedCol.name
      );
      expect(
        column,
        `Column ${expectedCol.name} should exist in ${tableName}`
      ).toBeDefined();
      expect(column.data_type).toBe(expectedCol.type);

      if (expectedCol.nullable !== undefined) {
        const isNullable = column.options?.includes("nullable");
        expect(isNullable).toBe(expectedCol.nullable);
      }
    }
  }

  /**
   * Verify that an index exists on a table
   */
  static async verifyIndexExists(
    tableName: string,
    indexName: string
  ): Promise<void> {
    const result = await mockSupabaseServer.execute_sql({
      query: `
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = '${tableName}'
        AND indexname = '${indexName}';
      `,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].indexname).toBe(indexName);
  }

  /**
   * Verify that a constraint exists on a table
   */
  static async verifyConstraintExists(
    tableName: string,
    constraintName: string,
    constraintType: "CHECK" | "UNIQUE" | "FOREIGN KEY"
  ): Promise<void> {
    const result = await mockSupabaseServer.execute_sql({
      query: `
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = '${tableName}'
        AND constraint_name = '${constraintName}';
      `,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].constraint_type).toBe(constraintType);
  }

  /**
   * Verify that a function exists in the database
   */
  static async verifyFunctionExists(functionName: string): Promise<void> {
    const result = await mockSupabaseServer.execute_sql({
      query: `
        SELECT proname
        FROM pg_proc
        WHERE proname = '${functionName}';
      `,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].proname).toBe(functionName);
  }

  /**
   * Verify that a trigger exists on a table
   */
  static async verifyTriggerExists(
    tableName: string,
    triggerName: string
  ): Promise<void> {
    const result = await mockSupabaseServer.execute_sql({
      query: `
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = '${tableName}'
        AND trigger_name = '${triggerName}';
      `,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].trigger_name).toBe(triggerName);
  }

  /**
   * Verify RLS policy exists and is properly configured
   */
  static async verifyRLSPolicy(
    tableName: string,
    policyName: string,
    command: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL"
  ): Promise<void> {
    const result = await mockSupabaseServer.execute_sql({
      query: `
        SELECT policyname, cmd
        FROM pg_policies
        WHERE tablename = '${tableName}'
        AND policyname = '${policyName}';
      `,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].cmd).toBe(command);
  }

  /**
   * Test that a migration has been applied
   */
  static async verifyMigrationApplied(migrationName: string): Promise<void> {
    const migrations = await mockSupabaseServer.list_migrations();
    const migration = migrations.find((m: any) => m.name === migrationName);

    expect(
      migration,
      `Migration ${migrationName} should be applied`
    ).toBeDefined();
  }

  /**
   * Setup test data for subscription-related tests
   */
  static async setupTestData(): Promise<{
    planId: string;
    memberId: string;
    subscriptionId: string;
  }> {
    // Insert test data using MCP server
    const planResult = await mockSupabaseServer.execute_sql({
      query: `
        INSERT INTO subscription_plans (name, plan_type, price, billing_cycle)
        VALUES ('Test Plan', 'basic', 50.00, 'monthly')
        RETURNING id;
      `,
    });

    const memberResult = await mockSupabaseServer.execute_sql({
      query: `
        INSERT INTO members (first_name, last_name, email)
        VALUES ('Test', 'User', 'test@example.com')
        RETURNING id;
      `,
    });

    const subscriptionResult = await mockSupabaseServer.execute_sql({
      query: `
        INSERT INTO member_subscriptions (member_id, plan_id, start_date, billing_cycle, price)
        VALUES ('${memberResult.data[0].id}', '${planResult.data[0].id}', CURRENT_DATE, 'monthly', 50.00)
        RETURNING id;
      `,
    });

    return {
      planId: planResult.data[0].id,
      memberId: memberResult.data[0].id,
      subscriptionId: subscriptionResult.data[0].id,
    };
  }

  /**
   * Clean up test data
   */
  static async cleanupTestData(): Promise<void> {
    await mockSupabaseServer.execute_sql({
      query: `
        DELETE FROM subscription_payments WHERE member_id IN (
          SELECT id FROM members WHERE email = 'test@example.com'
        );
        DELETE FROM member_subscriptions WHERE member_id IN (
          SELECT id FROM members WHERE email = 'test@example.com'
        );
        DELETE FROM members WHERE email = 'test@example.com';
        DELETE FROM subscription_plans WHERE name = 'Test Plan';
      `,
    });
  }
}

describe("Epic 01: Database Foundation Test Infrastructure", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock responses
    mockSupabaseServer.list_migrations.mockResolvedValue([]);
    mockSupabaseServer.list_tables.mockResolvedValue([]);
    mockSupabaseServer.execute_sql.mockResolvedValue({ data: [], error: null });
    mockSupabaseServer.apply_migration.mockResolvedValue({ success: true });
    mockSupabaseServer.get_advisors.mockResolvedValue([]);
  });

  afterEach(async () => {
    // Cleanup after each test
    await Epic01TestHelpers.cleanupTestData();
  });

  it("should have test infrastructure available", () => {
    expect(Epic01TestHelpers).toBeDefined();
    expect(typeof Epic01TestHelpers.verifyTableStructure).toBe("function");
    expect(typeof Epic01TestHelpers.verifyIndexExists).toBe("function");
    expect(typeof Epic01TestHelpers.verifyConstraintExists).toBe("function");
    expect(typeof Epic01TestHelpers.verifyFunctionExists).toBe("function");
    expect(typeof Epic01TestHelpers.verifyTriggerExists).toBe("function");
    expect(typeof Epic01TestHelpers.verifyRLSPolicy).toBe("function");
  });

  it("should be able to mock Supabase MCP server functions", () => {
    expect(mockSupabaseServer.apply_migration).toBeDefined();
    expect(mockSupabaseServer.list_migrations).toBeDefined();
    expect(mockSupabaseServer.list_tables).toBeDefined();
    expect(mockSupabaseServer.execute_sql).toBeDefined();
    expect(mockSupabaseServer.get_advisors).toBeDefined();
  });

  it("should handle test data setup and cleanup", async () => {
    // Mock successful test data creation
    mockSupabaseServer.execute_sql
      .mockResolvedValueOnce({ data: [{ id: "plan-1" }], error: null })
      .mockResolvedValueOnce({ data: [{ id: "member-1" }], error: null })
      .mockResolvedValueOnce({ data: [{ id: "subscription-1" }], error: null });

    const testData = await Epic01TestHelpers.setupTestData();

    expect(testData.planId).toBe("plan-1");
    expect(testData.memberId).toBe("member-1");
    expect(testData.subscriptionId).toBe("subscription-1");

    expect(mockSupabaseServer.execute_sql).toHaveBeenCalledTimes(3);
  });
});

// Export the mock server for use in other test files
export { mockSupabaseServer };
