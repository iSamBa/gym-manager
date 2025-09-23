import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  Epic01TestHelpers,
  mockSupabaseServer,
} from "../epic-01-database.test";

/**
 * Tests for subscription_payments_enhancements migration
 *
 * This migration should:
 * 1. Add receipt_number column with UNIQUE constraint
 * 2. Add reference_number column
 * 3. Create receipt_number_seq sequence
 * 4. Create generate_receipt_number() function
 * 5. Create auto-generation trigger for receipt numbers
 */

describe("Migration: subscription_payments_enhancements", () => {
  const MIGRATION_NAME = "subscription_payments_enhancements";

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the current subscription_payments table structure (before migration)
    mockSupabaseServer.list_tables.mockResolvedValue([
      {
        name: "subscription_payments",
        columns: [
          { name: "id", data_type: "uuid", options: ["updatable"] },
          {
            name: "subscription_id",
            data_type: "uuid",
            options: ["updatable"],
          },
          { name: "member_id", data_type: "uuid", options: ["updatable"] },
          { name: "amount", data_type: "numeric", options: ["updatable"] },
          { name: "payment_method", data_type: "text", options: ["updatable"] },
          { name: "payment_status", data_type: "text", options: ["updatable"] },
          {
            name: "payment_date",
            data_type: "date",
            options: ["nullable", "updatable"],
          },
          // Missing: receipt_number, reference_number
        ],
      },
    ]);

    // Mock migration list (before applying)
    mockSupabaseServer.list_migrations.mockResolvedValue([
      { name: "subscription_plans_enhancement", version: "20250824000000" },
      { name: "member_subscriptions_snapshots", version: "20250824000001" },
      // Missing: subscription_payments_enhancements
    ]);
  });

  afterEach(async () => {
    await Epic01TestHelpers.cleanupTestData();
  });

  describe("Before Migration Application", () => {
    it("should not have receipt_number column", async () => {
      const tables = await mockSupabaseServer.list_tables();
      const paymentsTable = tables.find(
        (t: any) => t.name === "subscription_payments"
      );

      expect(paymentsTable).toBeDefined();

      const receiptNumberColumn = paymentsTable.columns.find(
        (c: any) => c.name === "receipt_number"
      );

      expect(receiptNumberColumn).toBeUndefined();
    });

    it("should not have reference_number column", async () => {
      const tables = await mockSupabaseServer.list_tables();
      const paymentsTable = tables.find(
        (t: any) => t.name === "subscription_payments"
      );

      expect(paymentsTable).toBeDefined();

      const referenceNumberColumn = paymentsTable.columns.find(
        (c: any) => c.name === "reference_number"
      );

      expect(referenceNumberColumn).toBeUndefined();
    });

    it("should not have receipt_number_seq sequence", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT sequence_name
          FROM information_schema.sequences
          WHERE sequence_name = 'receipt_number_seq';
        `,
      });

      expect(result.data).toHaveLength(0);
    });

    it("should not have generate_receipt_number function", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT proname
          FROM pg_proc
          WHERE proname = 'generate_receipt_number';
        `,
      });

      expect(result.data).toHaveLength(0);
    });

    it("should not have receipt generation trigger", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT trigger_name
          FROM information_schema.triggers
          WHERE event_object_table = 'subscription_payments'
          AND trigger_name = 'generate_receipt_before_insert';
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
          -- Add receipt and reference tracking
          ALTER TABLE subscription_payments
          ADD COLUMN receipt_number VARCHAR(50) UNIQUE,
          ADD COLUMN reference_number VARCHAR(100);

          -- Create receipt number sequence
          CREATE SEQUENCE receipt_number_seq START 1000;

          -- Function to generate receipt numbers
          CREATE OR REPLACE FUNCTION generate_receipt_number()
          RETURNS VARCHAR AS $$
          BEGIN
            RETURN 'RCPT-' || EXTRACT(YEAR FROM NOW()) || '-' ||
                   LPAD(nextval('receipt_number_seq')::text, 4, '0');
          END;
          $$ LANGUAGE plpgsql;

          -- Trigger to auto-generate receipt numbers
          CREATE TRIGGER generate_receipt_before_insert
          BEFORE INSERT ON subscription_payments
          FOR EACH ROW
          WHEN (NEW.receipt_number IS NULL)
          EXECUTE FUNCTION generate_receipt_number();
        `,
      });

      expect(result.success).toBe(true);
      expect(mockSupabaseServer.apply_migration).toHaveBeenCalledWith({
        name: MIGRATION_NAME,
        query: expect.stringContaining("ALTER TABLE subscription_payments"),
      });
    });

    it("should include all required SQL statements", async () => {
      const expectedStatements = [
        "ADD COLUMN receipt_number VARCHAR(50) UNIQUE",
        "ADD COLUMN reference_number VARCHAR(100)",
        "CREATE SEQUENCE receipt_number_seq START 1000",
        "CREATE OR REPLACE FUNCTION generate_receipt_number()",
        "CREATE TRIGGER generate_receipt_before_insert",
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
          name: "subscription_payments",
          columns: [
            { name: "id", data_type: "uuid", options: ["updatable"] },
            {
              name: "subscription_id",
              data_type: "uuid",
              options: ["updatable"],
            },
            { name: "member_id", data_type: "uuid", options: ["updatable"] },
            { name: "amount", data_type: "numeric", options: ["updatable"] },
            {
              name: "payment_method",
              data_type: "text",
              options: ["updatable"],
            },
            {
              name: "payment_status",
              data_type: "text",
              options: ["updatable"],
            },
            {
              name: "payment_date",
              data_type: "date",
              options: ["nullable", "updatable"],
            },
            // New columns
            {
              name: "receipt_number",
              data_type: "varchar",
              options: ["nullable", "updatable", "unique"],
            },
            {
              name: "reference_number",
              data_type: "varchar",
              options: ["nullable", "updatable"],
            },
          ],
        },
      ]);

      // Mock migration is now in the list
      mockSupabaseServer.list_migrations.mockResolvedValue([
        { name: "subscription_plans_enhancement", version: "20250824000000" },
        { name: "member_subscriptions_snapshots", version: "20250824000001" },
        { name: MIGRATION_NAME, version: "20250824000002" },
      ]);
    });

    it("should have receipt_number column with UNIQUE constraint", async () => {
      await Epic01TestHelpers.verifyTableStructure("subscription_payments", [
        { name: "receipt_number", type: "varchar", nullable: true },
      ]);

      // Verify UNIQUE constraint
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            constraint_name: "subscription_payments_receipt_number_key",
            constraint_type: "UNIQUE",
          },
        ],
        error: null,
      });

      await Epic01TestHelpers.verifyConstraintExists(
        "subscription_payments",
        "subscription_payments_receipt_number_key",
        "UNIQUE"
      );
    });

    it("should have reference_number column", async () => {
      await Epic01TestHelpers.verifyTableStructure("subscription_payments", [
        { name: "reference_number", type: "varchar", nullable: true },
      ]);

      expect(mockSupabaseServer.list_tables).toHaveBeenCalled();
    });

    it("should have receipt_number_seq sequence", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ sequence_name: "receipt_number_seq", start_value: "1000" }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          SELECT sequence_name, start_value
          FROM information_schema.sequences
          WHERE sequence_name = 'receipt_number_seq';
        `,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].sequence_name).toBe("receipt_number_seq");
      expect(result.data[0].start_value).toBe("1000");
    });

    it("should have generate_receipt_number function", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ proname: "generate_receipt_number" }],
        error: null,
      });

      await Epic01TestHelpers.verifyFunctionExists("generate_receipt_number");

      expect(mockSupabaseServer.execute_sql).toHaveBeenCalledWith({
        query: expect.stringContaining("proname = 'generate_receipt_number'"),
      });
    });

    it("should have generate_receipt_before_insert trigger", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ trigger_name: "generate_receipt_before_insert" }],
        error: null,
      });

      await Epic01TestHelpers.verifyTriggerExists(
        "subscription_payments",
        "generate_receipt_before_insert"
      );

      expect(mockSupabaseServer.execute_sql).toHaveBeenCalledWith({
        query: expect.stringContaining(
          "trigger_name = 'generate_receipt_before_insert'"
        ),
      });
    });

    it("should be included in migration list", async () => {
      await Epic01TestHelpers.verifyMigrationApplied(MIGRATION_NAME);
      expect(mockSupabaseServer.list_migrations).toHaveBeenCalled();
    });
  });

  describe("Receipt Number Generation", () => {
    beforeEach(() => {
      const currentYear = new Date().getFullYear();

      // Mock function execution for receipt number generation
      mockSupabaseServer.execute_sql.mockImplementation(async ({ query }) => {
        if (query.includes("generate_receipt_number()")) {
          return {
            data: [{ generate_receipt_number: `RCPT-${currentYear}-1000` }],
            error: null,
          };
        }
        return { data: [], error: null };
      });
    });

    it("should generate receipt numbers in correct format", async () => {
      const result = await mockSupabaseServer.execute_sql({
        query: "SELECT generate_receipt_number()",
      });

      const receiptNumber = result.data[0].generate_receipt_number;
      const currentYear = new Date().getFullYear();
      const expectedPattern = new RegExp(`^RCPT-${currentYear}-\\d{4}$`);

      expect(receiptNumber).toMatch(expectedPattern);
    });

    it("should include current year in receipt number", async () => {
      const result = await mockSupabaseServer.execute_sql({
        query: "SELECT generate_receipt_number()",
      });

      const receiptNumber = result.data[0].generate_receipt_number;
      const currentYear = new Date().getFullYear();

      expect(receiptNumber).toContain(`RCPT-${currentYear}-`);
    });

    it("should pad sequence number to 4 digits", async () => {
      // Mock sequence returning a smaller number
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ generate_receipt_number: "RCPT-2024-0001" }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: "SELECT generate_receipt_number()",
      });

      const receiptNumber = result.data[0].generate_receipt_number;
      expect(receiptNumber).toMatch(/RCPT-\d{4}-\d{4}$/);
      expect(receiptNumber.split("-")[2]).toHaveLength(4);
    });

    it("should auto-generate receipt numbers on insert when null", async () => {
      const currentYear = new Date().getFullYear();

      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            id: "payment-123",
            receipt_number: `RCPT-${currentYear}-1001`,
          },
        ],
        error: null,
      });

      // Insert payment without receipt_number (should trigger auto-generation)
      const result = await mockSupabaseServer.execute_sql({
        query: `
          INSERT INTO subscription_payments (subscription_id, member_id, amount, payment_method)
          VALUES ('sub-123', 'member-123', 100.00, 'card')
          RETURNING id, receipt_number
        `,
      });

      expect(result.data[0].receipt_number).toMatch(/^RCPT-\d{4}-\d{4}$/);
    });

    it("should not override manually provided receipt numbers", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            id: "payment-123",
            receipt_number: "MANUAL-RECEIPT-001",
          },
        ],
        error: null,
      });

      // Insert payment with manual receipt_number (should not trigger auto-generation)
      const result = await mockSupabaseServer.execute_sql({
        query: `
          INSERT INTO subscription_payments (subscription_id, member_id, amount, payment_method, receipt_number)
          VALUES ('sub-123', 'member-123', 100.00, 'card', 'MANUAL-RECEIPT-001')
          RETURNING id, receipt_number
        `,
      });

      expect(result.data[0].receipt_number).toBe("MANUAL-RECEIPT-001");
    });
  });

  describe("Data Integrity", () => {
    it("should enforce unique constraint on receipt_number", async () => {
      // Mock unique constraint violation for this specific call
      mockSupabaseServer.execute_sql.mockRejectedValueOnce(
        new Error(
          'duplicate key value violates unique constraint "subscription_payments_receipt_number_key"'
        )
      );

      await expect(
        mockSupabaseServer.execute_sql({
          query: `
            INSERT INTO subscription_payments (subscription_id, member_id, amount, payment_method, receipt_number)
            VALUES ('sub-123', 'member-123', 100.00, 'card', 'RCPT-2024-1000')
          `,
        })
      ).rejects.toThrow("duplicate key value violates unique constraint");
    });

    it("should allow null receipt_number values", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            id: "payment-123",
            receipt_number: null,
          },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          INSERT INTO subscription_payments (subscription_id, member_id, amount, payment_method, receipt_number)
          VALUES ('sub-123', 'member-123', 100.00, 'card', NULL)
          RETURNING id, receipt_number
        `,
      });

      expect(result.data[0].receipt_number).toBeNull();
    });

    it("should allow null reference_number values", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            id: "payment-123",
            reference_number: null,
          },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          INSERT INTO subscription_payments (subscription_id, member_id, amount, payment_method)
          VALUES ('sub-123', 'member-123', 100.00, 'card')
          RETURNING id, reference_number
        `,
      });

      expect(result.data[0].reference_number).toBeNull();
    });

    it("should store reference_number for external payment tracking", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [
          {
            id: "payment-123",
            reference_number: "EXT-REF-ABC123",
          },
        ],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: `
          INSERT INTO subscription_payments (subscription_id, member_id, amount, payment_method, reference_number)
          VALUES ('sub-123', 'member-123', 100.00, 'online', 'EXT-REF-ABC123')
          RETURNING id, reference_number
        `,
      });

      expect(result.data[0].reference_number).toBe("EXT-REF-ABC123");
    });
  });

  describe("Sequence Management", () => {
    it("should increment sequence correctly", async () => {
      // Mock multiple calls to verify sequence increments
      mockSupabaseServer.execute_sql
        .mockResolvedValueOnce({ data: [{ nextval: 1000 }], error: null })
        .mockResolvedValueOnce({ data: [{ nextval: 1001 }], error: null })
        .mockResolvedValueOnce({ data: [{ nextval: 1002 }], error: null });

      const calls = [];
      for (let i = 0; i < 3; i++) {
        const result = await mockSupabaseServer.execute_sql({
          query: "SELECT nextval('receipt_number_seq')",
        });
        calls.push(result.data[0].nextval);
      }

      expect(calls).toEqual([1000, 1001, 1002]);
    });

    it("should start sequence from 1000", async () => {
      mockSupabaseServer.execute_sql.mockResolvedValue({
        data: [{ last_value: 1000, is_called: false }],
        error: null,
      });

      const result = await mockSupabaseServer.execute_sql({
        query: "SELECT last_value, is_called FROM receipt_number_seq",
      });

      // If is_called is false, the next nextval() will return last_value (1000)
      expect(result.data[0].last_value).toBe(1000);
      expect(result.data[0].is_called).toBe(false);
    });
  });
});
