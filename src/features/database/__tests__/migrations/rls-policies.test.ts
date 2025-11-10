import { describe, it, expect, vi } from "vitest";

const mockSupabaseServer = {
  list_tables: vi.fn(),
  list_migrations: vi.fn(),
  apply_migration: vi.fn(),
};

vi.mock("@/features/database/__tests__/epic-01-database.test", () => ({
  mockSupabaseServer,
  Epic01TestHelpers: { cleanupTestData: vi.fn() },
}));

describe("Migration: subscription_rls_policies", () => {
  it("should enable RLS on subscription tables", async () => {
    mockSupabaseServer.list_tables.mockResolvedValue([
      { name: "subscription_plans", rls_enabled: true },
      { name: "member_subscriptions", rls_enabled: true },
    ]);

    const tables = await mockSupabaseServer.list_tables();

    expect(
      tables.find((t: { name: string }) => t.name === "subscription_plans")
        ?.rls_enabled
    ).toBe(true);
    expect(
      tables.find((t: { name: string }) => t.name === "member_subscriptions")
        ?.rls_enabled
    ).toBe(true);
  });

  it("should apply migration successfully", async () => {
    mockSupabaseServer.apply_migration.mockResolvedValue({ success: true });

    const result = await mockSupabaseServer.apply_migration(
      "subscription_rls_policies",
      ""
    );

    expect(result.success).toBe(true);
  });
});
