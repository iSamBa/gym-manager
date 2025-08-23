import "@testing-library/jest-dom";

// Global test setup
import { beforeEach, afterEach, vi } from "vitest";

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
