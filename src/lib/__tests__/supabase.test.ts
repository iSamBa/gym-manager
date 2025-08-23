import { createClient } from "@supabase/supabase-js";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

// Mock the createClient function
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

describe("Supabase Client Configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateClient.mockClear();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Environment Variables", () => {
    it("should use NEXT_PUBLIC_SUPABASE_URL environment variable", async () => {
      // Set test environment variables
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

      // Dynamic import to ensure fresh module loading
      await import("../supabase");

      expect(mockCreateClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key",
        expect.any(Object)
      );
    });

    it("should use NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-different-key");

      await import("../supabase");

      expect(mockCreateClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-different-key",
        expect.any(Object)
      );
    });
  });

  describe("Client Configuration", () => {
    it("should create client with correct auth configuration", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

      await import("../supabase");

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
        }
      );
    });

    it("should enable auto refresh token", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

      await import("../supabase");

      expect(mockCreateClient).toHaveBeenCalledTimes(1);
      const callArgs = mockCreateClient.mock.calls[0];
      expect(callArgs[2].auth.autoRefreshToken).toBe(true);
    });

    it("should enable session persistence", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

      await import("../supabase");

      const callArgs = mockCreateClient.mock.calls[0];
      expect(callArgs[2].auth.persistSession).toBe(true);
    });

    it("should enable session detection in URL", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

      await import("../supabase");

      const callArgs = mockCreateClient.mock.calls[0];
      expect(callArgs[2].auth.detectSessionInUrl).toBe(true);
    });
  });

  describe("Module Export", () => {
    it("should export supabase client instance", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

      const mockClient = { mock: "client" };
      mockCreateClient.mockReturnValue(
        mockClient as ReturnType<typeof createClient>
      );

      const { supabase } = await import("../supabase");

      expect(supabase).toBe(mockClient);
    });

    it("should create client instance only once when imported multiple times", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

      // Import multiple times (should be cached due to vi.resetModules() in beforeEach)
      await import("../supabase");
      await import("../supabase");
      await import("../supabase");

      // Should only be called once due to module caching
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });
  });

  describe("Integration", () => {
    it("should work with real Supabase createClient function signature", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

      await import("../supabase");

      // Verify the call signature matches what Supabase expects
      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.stringMatching(/^https?:\/\/.+/), // URL format
        expect.stringMatching(/.+/), // Non-empty string
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: expect.any(Boolean),
            persistSession: expect.any(Boolean),
            detectSessionInUrl: expect.any(Boolean),
          }),
        })
      );
    });

    it("should handle various URL formats", async () => {
      const testCases = [
        "https://abc123.supabase.co",
        "https://my-project.supabase.co",
        "https://localhost:54321",
      ];

      for (let index = 0; index < testCases.length; index++) {
        const url = testCases[index];
        vi.resetModules();
        mockCreateClient.mockClear();
        vi.unstubAllEnvs();

        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", `test-key-${index}`);

        await import("../supabase");

        expect(mockCreateClient).toHaveBeenCalledWith(
          url,
          `test-key-${index}`,
          expect.any(Object)
        );
      }
    });
  });

  describe("Configuration Validation", () => {
    it("should have correct default auth settings", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

      await import("../supabase");

      const callArgs = mockCreateClient.mock.calls[0];
      const authConfig = callArgs[2].auth;

      // Verify all expected auth properties are present and correctly set
      expect(authConfig).toEqual({
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      });
    });

    it("should pass through environment variables exactly as provided", async () => {
      const testUrl = "https://very-specific-url.supabase.co";
      const testKey = "very-specific-anon-key-12345";

      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", testUrl);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", testKey);

      await import("../supabase");

      expect(mockCreateClient).toHaveBeenCalledWith(
        testUrl,
        testKey,
        expect.any(Object)
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle missing environment variables gracefully", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

      // This should not throw, but might create client with empty strings
      await expect(import("../supabase")).resolves.toBeDefined();

      expect(mockCreateClient).toHaveBeenCalledWith("", "", expect.any(Object));
    });
  });
});
