/**
 * Environment Variables Validation Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("env validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Ensure VITEST is not set during validation tests
    delete process.env.VITEST;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it("should validate correct environment variables", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
    process.env.NODE_ENV = "development";

    const { env } = await import("../env");

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature"
    );
    expect(env.NODE_ENV).toBe("development");
  });

  it("should throw error for invalid Supabase URL", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
    process.env.NODE_ENV = "development"; // Force non-test mode
    delete process.env.VITEST;

    await expect(async () => {
      await import("../env");
    }).rejects.toThrow();
  });

  it("should throw error for missing Supabase URL", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
    process.env.NODE_ENV = "development"; // Force non-test mode
    delete process.env.VITEST;

    await expect(async () => {
      await import("../env");
    }).rejects.toThrow();
  });

  it("should throw error for invalid JWT format", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "invalid-jwt";
    process.env.NODE_ENV = "development"; // Force non-test mode
    delete process.env.VITEST;

    await expect(async () => {
      await import("../env");
    }).rejects.toThrow();
  });

  it("should throw error for JWT that is too short", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "short";
    process.env.NODE_ENV = "development"; // Force non-test mode
    delete process.env.VITEST;

    await expect(async () => {
      await import("../env");
    }).rejects.toThrow();
  });

  it("should default NODE_ENV to development if not set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
    delete process.env.NODE_ENV;

    const { env } = await import("../env");

    expect(env.NODE_ENV).toBe("development");
  });

  it("should validate production NODE_ENV", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
    process.env.NODE_ENV = "production";

    const { env } = await import("../env");

    expect(env.NODE_ENV).toBe("production");
  });

  it("should validate test NODE_ENV", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
    process.env.NODE_ENV = "test";

    const { env } = await import("../env");

    expect(env.NODE_ENV).toBe("test");
  });
});

describe("environment helper functions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("isProduction should return true in production", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
    process.env.NODE_ENV = "production";

    const { isProduction } = await import("../env");

    expect(isProduction()).toBe(true);
  });

  it("isDevelopment should return true in development", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
    process.env.NODE_ENV = "development";

    const { isDevelopment } = await import("../env");

    expect(isDevelopment()).toBe(true);
  });

  it("isTest should return true in test environment", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
    process.env.NODE_ENV = "test";

    const { isTest } = await import("../env");

    expect(isTest()).toBe(true);
  });
});
