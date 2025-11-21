import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/nextjs";
import {
  reportWebVital,
  trackPerformance,
  trackQueryPerformance,
  createPerformanceTracker,
  trackAsyncPerformance,
  type WebVitalData,
  type PerformanceMetric,
  type QueryPerformance,
} from "./monitoring";
import { logger } from "./logger";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  setMeasurement: vi.fn(),
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
}));

// Mock logger
vi.mock("./logger", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("monitoring utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe("reportWebVital", () => {
    it("should log web vital in development mode", () => {
      vi.stubEnv("NODE_ENV", "development");

      const metric: WebVitalData = {
        id: "test-id",
        name: "FCP",
        value: 1500,
        rating: "good",
        delta: 1500,
        navigationType: "navigate",
      };

      reportWebVital(metric);

      expect(logger.debug).toHaveBeenCalledWith("Web Vital", { metric });
      expect(Sentry.setMeasurement).not.toHaveBeenCalled();
    });

    it("should report good FCP metric to Sentry in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.resetModules();

      const { reportWebVital: prodReportWebVital } = await import(
        "./monitoring"
      );

      const metric: WebVitalData = {
        id: "test-id",
        name: "FCP",
        value: 1500,
        rating: "good",
        delta: 1500,
        navigationType: "navigate",
      };

      prodReportWebVital(metric);

      expect(Sentry.setMeasurement).toHaveBeenCalledWith(
        "FCP",
        1500,
        "millisecond"
      );
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "web-vital",
        message: "FCP: 1500ms (good)",
        level: "info",
        data: expect.objectContaining({
          name: "FCP",
          value: 1500,
          rating: "good",
        }),
      });
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("should warn about poor LCP metric", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.resetModules();

      const { reportWebVital: prodReportWebVital } = await import(
        "./monitoring"
      );

      const metric: WebVitalData = {
        id: "test-id",
        name: "LCP",
        value: 5000,
        rating: "poor",
        delta: 5000,
        navigationType: "navigate",
      };

      prodReportWebVital(metric);

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "web-vital",
        message: "LCP: 5000ms (poor)",
        level: "warning",
        data: expect.objectContaining({
          rating: "poor",
        }),
      });
      expect(logger.warn).toHaveBeenCalledWith("Poor LCP performance", {
        value: 5000,
        threshold: 4000,
      });
    });

    it("should handle CLS metric correctly", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.resetModules();

      const { reportWebVital: prodReportWebVital } = await import(
        "./monitoring"
      );

      const metric: WebVitalData = {
        id: "test-id",
        name: "CLS",
        value: 0.05,
        rating: "good",
        delta: 0.05,
        navigationType: "navigate",
      };

      prodReportWebVital(metric);

      expect(Sentry.setMeasurement).toHaveBeenCalledWith(
        "CLS",
        0.05,
        "millisecond"
      );
    });
  });

  describe("trackPerformance", () => {
    it("should log performance metric in development", () => {
      vi.stubEnv("NODE_ENV", "development");

      const metric: PerformanceMetric = {
        name: "test_operation",
        value: 250,
        unit: "ms",
        tags: { page: "test" },
      };

      trackPerformance(metric);

      expect(logger.debug).toHaveBeenCalledWith("Performance: test_operation", {
        value: 250,
        unit: "ms",
        tags: { page: "test" },
      });
      expect(Sentry.setMeasurement).not.toHaveBeenCalled();
    });

    it("should send performance metric to Sentry in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.resetModules();

      const { trackPerformance: prodTrackPerformance } = await import(
        "./monitoring"
      );

      const metric: PerformanceMetric = {
        name: "data_fetch",
        value: 150,
        unit: "ms",
        tags: { endpoint: "/api/members" },
      };

      prodTrackPerformance(metric);

      expect(Sentry.setMeasurement).toHaveBeenCalledWith(
        "data_fetch",
        150,
        "ms"
      );
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "performance",
        message: "data_fetch: 150ms",
        level: "info",
        data: expect.objectContaining({
          value: 150,
          unit: "ms",
          endpoint: "/api/members",
        }),
      });
    });

    it("should use default values for optional parameters", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.resetModules();

      const { trackPerformance: prodTrackPerformance } = await import(
        "./monitoring"
      );

      const metric: PerformanceMetric = {
        name: "simple_metric",
        value: 100,
      };

      prodTrackPerformance(metric);

      expect(Sentry.setMeasurement).toHaveBeenCalledWith(
        "simple_metric",
        100,
        "ms"
      );
    });
  });

  describe("trackQueryPerformance", () => {
    it("should log fast query in development", () => {
      vi.stubEnv("NODE_ENV", "development");

      const queryData: QueryPerformance = {
        query: "fetch_members",
        duration: 50,
        status: "success",
        timestamp: Date.now(),
      };

      trackQueryPerformance(queryData);

      expect(logger.debug).toHaveBeenCalledWith(
        "Database query",
        expect.objectContaining({
          query: "fetch_members",
          duration: "50.00ms",
          status: "success",
        })
      );
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("should warn about slow queries", () => {
      vi.stubEnv("NODE_ENV", "development");

      const queryData: QueryPerformance = {
        query: "slow_query",
        duration: 600,
        status: "success",
        timestamp: Date.now(),
        tags: { table: "members" },
      };

      trackQueryPerformance(queryData);

      expect(logger.warn).toHaveBeenCalledWith(
        "Slow database query detected",
        expect.objectContaining({
          query: "slow_query",
          duration: "600.00ms",
          status: "success",
          table: "members",
        })
      );
    });

    it("should send slow query to Sentry in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.resetModules();

      const { trackQueryPerformance: prodTrackQueryPerformance } = await import(
        "./monitoring"
      );

      const queryData: QueryPerformance = {
        query: "complex_join",
        duration: 750,
        status: "success",
        timestamp: Date.now(),
        tags: { table: "subscriptions" },
      };

      prodTrackQueryPerformance(queryData);

      expect(Sentry.setMeasurement).toHaveBeenCalledWith(
        "db.query.complex_join",
        750,
        "millisecond"
      );
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Slow query: complex_join",
        expect.objectContaining({
          level: "warning",
          tags: expect.objectContaining({
            query: "complex_join",
            status: "success",
            table: "subscriptions",
          }),
          extra: expect.objectContaining({
            duration: 750,
            threshold: 500,
          }),
        })
      );
    });

    it("should handle failed queries", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.resetModules();

      const { trackQueryPerformance: prodTrackQueryPerformance } = await import(
        "./monitoring"
      );

      const queryData: QueryPerformance = {
        query: "failed_query",
        duration: 100,
        status: "error",
        timestamp: Date.now(),
        tags: { error: "connection_timeout" },
      };

      prodTrackQueryPerformance(queryData);

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "query",
          data: expect.objectContaining({
            status: "error",
            error: "connection_timeout",
          }),
        })
      );
    });
  });

  describe("createPerformanceTracker", () => {
    it("should track execution time", () => {
      const tracker = createPerformanceTracker("test_task");
      const duration = tracker.end();

      expect(duration).toBeGreaterThanOrEqual(0);
      expect(logger.debug).toHaveBeenCalledWith(
        "Performance: test_task",
        expect.objectContaining({
          value: expect.any(Number),
          unit: "ms",
        })
      );
    });

    it("should accept custom tags and unit", () => {
      const tracker = createPerformanceTracker("custom_task");
      tracker.end({ tags: { category: "data" }, unit: "seconds" });

      expect(logger.debug).toHaveBeenCalledWith(
        "Performance: custom_task",
        expect.objectContaining({
          tags: { category: "data" },
          unit: "seconds",
        })
      );
    });
  });

  describe("trackAsyncPerformance", () => {
    it("should track successful async operation", async () => {
      const asyncFn = vi.fn().mockResolvedValue("result");
      const tracked = trackAsyncPerformance("async_test", asyncFn);

      const result = await tracked();

      expect(result).toBe("result");
      expect(asyncFn).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith(
        "Performance: async_test",
        expect.any(Object)
      );
    });

    it("should track failed async operation", async () => {
      const error = new Error("Test error");
      const asyncFn = vi.fn().mockRejectedValue(error);
      const tracked = trackAsyncPerformance("failing_test", asyncFn);

      await expect(tracked()).rejects.toThrow("Test error");
      expect(logger.debug).toHaveBeenCalledWith(
        "Performance: failing_test",
        expect.objectContaining({
          tags: { error: "true" },
        })
      );
    });

    it("should include custom tags", async () => {
      const asyncFn = vi.fn().mockResolvedValue("data");
      const tracked = trackAsyncPerformance("tagged_test", asyncFn, {
        source: "api",
      });

      await tracked();

      expect(logger.debug).toHaveBeenCalledWith(
        "Performance: tagged_test",
        expect.objectContaining({
          tags: expect.objectContaining({
            source: "api",
          }),
        })
      );
    });
  });
});
