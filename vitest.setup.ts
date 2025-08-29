import "@testing-library/jest-dom";

// Global test setup
import { beforeEach, afterEach, vi } from "vitest";
import { globalTestCleanup } from "./src/test/mock-helpers";

// Configure test timeout to 500ms to force fast, reliable tests
vi.setConfig({ testTimeout: 500 });

// Mock ResizeObserver for components that use it
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock environment variables for tests with default values
beforeEach(() => {
  // Reset environment variables before each test
  vi.unstubAllEnvs();

  // Set default environment variables for Supabase
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
});

afterEach(() => {
  // Comprehensive cleanup after each test
  globalTestCleanup();
});
