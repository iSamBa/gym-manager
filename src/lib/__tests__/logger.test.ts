import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "../logger";

describe("Logger", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.NODE_ENV;

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.NODE_ENV = originalEnv;
    }

    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("Development Environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should log debug messages in development", () => {
      logger.debug("test debug message", { key: "value" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG]"),
        "test debug message",
        { key: "value" }
      );
    });

    it("should log info messages in development", () => {
      logger.info("test info message", { userId: "123" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        "test info message",
        { userId: "123" }
      );
    });

    it("should log warn messages in development", () => {
      logger.warn("test warning", { warning: "details" });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[WARN]"),
        "test warning",
        { warning: "details" }
      );
    });

    it("should log error messages in development", () => {
      logger.error("test error", { error: "details" });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]"),
        "test error",
        { error: "details" }
      );
    });

    it("should handle missing context gracefully", () => {
      logger.debug("message without context");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG]"),
        "message without context",
        ""
      );
    });
  });

  describe("Production Environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("should NOT log debug messages in production", () => {
      logger.debug("test debug message", { key: "value" });

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should NOT log info messages in production", () => {
      logger.info("test info message", { userId: "123" });

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should log warn messages in production as JSON", () => {
      logger.warn("test warning", { warning: "details" });

      expect(consoleWarnSpy).toHaveBeenCalled();

      // Verify warning is logged as JSON in production
      const warnCall = consoleWarnSpy.mock.calls[0][0];
      expect(typeof warnCall).toBe("string");

      const parsedLog = JSON.parse(warnCall);
      expect(parsedLog).toMatchObject({
        level: "warn",
        message: "test warning",
        warning: "details",
      });
      expect(parsedLog.timestamp).toBeDefined();
    });

    it("should log error messages in production as JSON", () => {
      logger.error("test error", { error: "details" });

      expect(consoleErrorSpy).toHaveBeenCalled();

      // Verify error is logged as JSON in production
      const errorCall = consoleErrorSpy.mock.calls[0][0];
      expect(typeof errorCall).toBe("string");

      const parsedLog = JSON.parse(errorCall);
      expect(parsedLog).toMatchObject({
        level: "error",
        message: "test error",
        error: "details",
      });
      expect(parsedLog.timestamp).toBeDefined();
    });
  });

  describe("Context Handling", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should handle complex context objects", () => {
      const complexContext = {
        userId: "123",
        action: "create",
        metadata: {
          nested: "value",
          count: 42,
        },
      };

      logger.info("complex log", complexContext);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        "complex log",
        complexContext
      );
    });

    it("should handle arrays in context", () => {
      logger.debug("array context", { items: [1, 2, 3], tags: ["a", "b"] });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG]"),
        "array context",
        { items: [1, 2, 3], tags: ["a", "b"] }
      );
    });

    it("should handle null and undefined values in context", () => {
      logger.warn("nullable context", { value: null, other: undefined });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[WARN]"),
        "nullable context",
        { value: null, other: undefined }
      );
    });
  });
});
