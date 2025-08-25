import "@testing-library/jest-dom";

// Global test setup
import { beforeEach, afterEach, vi } from "vitest";

// Mock ResizeObserver for components that use it
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock environment variables for tests
beforeEach(() => {
  // Reset environment variables before each test
  vi.unstubAllEnvs();
});

afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks();
  vi.resetModules();
});
