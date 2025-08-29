import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Supabase Client Configuration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("Module Export", () => {
    it("should export supabase client instance", async () => {
      const { supabase } = await import("../supabase");

      expect(supabase).toBeDefined();
      expect(supabase).toHaveProperty("auth");
      expect(supabase).toHaveProperty("from");
      expect(supabase).toHaveProperty("storage");
      expect(supabase).toHaveProperty("channel");
    });

    it("should have consistent client instance", async () => {
      const { supabase: instance1 } = await import("../supabase");
      const { supabase: instance2 } = await import("../supabase");

      // Should be the same instance due to module caching
      expect(instance1).toBe(instance2);
    });
  });

  describe("Client Interface", () => {
    it("should have auth methods", async () => {
      const { supabase } = await import("../supabase");

      expect(supabase.auth).toBeDefined();
      expect(supabase.auth.getSession).toBeDefined();
      expect(supabase.auth.getUser).toBeDefined();
      expect(supabase.auth.signInWithPassword).toBeDefined();
      expect(supabase.auth.signOut).toBeDefined();
      expect(supabase.auth.onAuthStateChange).toBeDefined();
    });

    it("should have database methods", async () => {
      const { supabase } = await import("../supabase");

      expect(supabase.from).toBeDefined();
      expect(typeof supabase.from).toBe("function");
    });

    it("should have storage methods", async () => {
      const { supabase } = await import("../supabase");

      expect(supabase.storage).toBeDefined();
      expect(supabase.storage.from).toBeDefined();
      expect(typeof supabase.storage.from).toBe("function");
    });

    it("should have realtime methods", async () => {
      const { supabase } = await import("../supabase");

      expect(supabase.channel).toBeDefined();
      expect(typeof supabase.channel).toBe("function");
    });

    it("should have rpc method", async () => {
      const { supabase } = await import("../supabase");

      expect(supabase.rpc).toBeDefined();
      expect(typeof supabase.rpc).toBe("function");
    });
  });
});
