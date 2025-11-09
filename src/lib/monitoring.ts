/**
 * Performance Monitoring Utilities
 *
 * Provides utilities for tracking Core Web Vitals, custom performance metrics,
 * and database query performance.
 *
 * @see https://web.dev/vitals/ - Web Vitals documentation
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/performance/ - Sentry performance monitoring
 */

import * as Sentry from "@sentry/nextjs";
import { logger } from "./logger";

/**
 * Core Web Vitals metric names
 */
export type WebVitalMetric = "FCP" | "LCP" | "CLS" | "FID" | "TTFB" | "INP";

/**
 * Web Vitals metric data structure
 */
export interface WebVitalData {
  id: string;
  name: WebVitalMetric;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  navigationType: string;
}

/**
 * Custom performance metric data structure
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: number;
}

/**
 * Database query performance data
 */
export interface QueryPerformance {
  query: string;
  duration: number;
  status: "success" | "error";
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Web Vitals thresholds (in milliseconds)
 * Based on Google's Core Web Vitals recommendations
 *
 * @see https://web.dev/defining-core-web-vitals-thresholds/
 */
const VITAL_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FID: { good: 100, poor: 300 }, // First Input Delay
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint
} as const;

/**
 * Get rating for a web vital metric
 */
function getVitalRating(
  name: WebVitalMetric,
  value: number
): "good" | "needs-improvement" | "poor" {
  const thresholds = VITAL_THRESHOLDS[name];
  if (value <= thresholds.good) return "good";
  if (value <= thresholds.poor) return "needs-improvement";
  return "poor";
}

/**
 * Report Web Vitals to Sentry
 *
 * This function should be called from Next.js `reportWebVitals` export
 * in your app or pages directory.
 *
 * @example
 * ```typescript
 * // In app/layout.tsx or pages/_app.tsx
 * export function reportWebVitals(metric: NextWebVitalsMetric) {
 *   reportWebVital(metric);
 * }
 * ```
 */
export function reportWebVital(metric: WebVitalData): void {
  // Only report in production
  if (process.env.NODE_ENV !== "production") {
    logger.debug("Web Vital", { metric });
    return;
  }

  // Add rating to metric
  const rating = getVitalRating(metric.name, metric.value);

  // Send to Sentry as measurement
  Sentry.setMeasurement(metric.name, metric.value, "millisecond");

  // Add as breadcrumb for context
  Sentry.addBreadcrumb({
    category: "web-vital",
    message: `${metric.name}: ${metric.value}ms (${rating})`,
    level: rating === "poor" ? "warning" : "info",
    data: {
      ...metric,
      rating,
    },
  });

  // Log warning for poor vitals
  if (rating === "poor") {
    logger.warn(`Poor ${metric.name} performance`, {
      value: metric.value,
      threshold: VITAL_THRESHOLDS[metric.name].poor,
    });
  }
}

/**
 * Track a custom performance metric
 *
 * @example
 * ```typescript
 * const start = performance.now();
 * await fetchMembers();
 * trackPerformance({
 *   name: "members_fetch_time",
 *   value: performance.now() - start,
 *   unit: "ms",
 *   tags: { page: "members-list" }
 * });
 * ```
 */
export function trackPerformance(metric: PerformanceMetric): void {
  const {
    name,
    value,
    unit = "ms",
    tags = {},
    timestamp = Date.now(),
  } = metric;

  // Log locally
  logger.debug(`Performance: ${name}`, { value, unit, tags });

  // Only send to Sentry in production
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  // Send as Sentry measurement
  Sentry.setMeasurement(name, value, unit);

  // Add as breadcrumb with tags
  Sentry.addBreadcrumb({
    category: "performance",
    message: `${name}: ${value}${unit}`,
    level: "info",
    data: {
      value,
      unit,
      timestamp,
      ...tags,
    },
  });
}

/**
 * Track database query performance
 *
 * Monitors query execution time and alerts if exceeding threshold (500ms).
 *
 * @example
 * ```typescript
 * const start = performance.now();
 * try {
 *   const result = await supabase.from("members").select("*");
 *   trackQueryPerformance({
 *     query: "fetch_all_members",
 *     duration: performance.now() - start,
 *     status: "success",
 *     timestamp: Date.now(),
 *     tags: { table: "members" }
 *   });
 * } catch (error) {
 *   trackQueryPerformance({
 *     query: "fetch_all_members",
 *     duration: performance.now() - start,
 *     status: "error",
 *     timestamp: Date.now(),
 *     tags: { table: "members", error: error.message }
 *   });
 * }
 * ```
 */
export function trackQueryPerformance(queryData: QueryPerformance): void {
  const { query, duration, status, timestamp, tags = {} } = queryData;

  // Slow query threshold: 500ms
  const SLOW_QUERY_THRESHOLD = 500;
  const isSlowQuery = duration > SLOW_QUERY_THRESHOLD;

  // Log query performance
  const logData = {
    query,
    duration: `${duration.toFixed(2)}ms`,
    status,
    timestamp,
    ...tags,
  };

  if (isSlowQuery) {
    logger.warn("Slow database query detected", logData);
  } else {
    logger.debug("Database query", logData);
  }

  // Only send to Sentry in production
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  // Send as Sentry measurement
  Sentry.setMeasurement(`db.query.${query}`, duration, "millisecond");

  // Add as breadcrumb
  Sentry.addBreadcrumb({
    category: "query",
    message: `Query ${query}: ${duration.toFixed(2)}ms`,
    level: isSlowQuery ? "warning" : "info",
    data: {
      duration,
      status,
      timestamp,
      slow_query: isSlowQuery,
      ...tags,
    },
  });

  // Create Sentry event for slow queries
  if (isSlowQuery) {
    Sentry.captureMessage(`Slow query: ${query}`, {
      level: "warning",
      tags: {
        query,
        status,
        ...tags,
      },
      extra: {
        duration,
        threshold: SLOW_QUERY_THRESHOLD,
        timestamp,
      },
    });
  }
}

/**
 * Create a performance tracker for measuring execution time
 *
 * @example
 * ```typescript
 * const tracker = createPerformanceTracker("data_processing");
 * await processData();
 * tracker.end({ tags: { rows: 1000 } });
 * ```
 */
export function createPerformanceTracker(name: string) {
  const startTime = performance.now();

  return {
    /**
     * End tracking and report performance
     */
    end: (options?: { tags?: Record<string, string>; unit?: string }) => {
      const duration = performance.now() - startTime;
      trackPerformance({
        name,
        value: duration,
        unit: options?.unit || "ms",
        tags: options?.tags,
        timestamp: Date.now(),
      });
      return duration;
    },
  };
}

/**
 * Higher-order function to track async function performance
 *
 * @example
 * ```typescript
 * const fetchMembersWithTracking = trackAsyncPerformance(
 *   "fetch_members",
 *   async () => {
 *     const { data } = await supabase.from("members").select("*");
 *     return data;
 *   }
 * );
 *
 * const members = await fetchMembersWithTracking();
 * ```
 */
export function trackAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): () => Promise<T> {
  return async () => {
    const tracker = createPerformanceTracker(name);
    try {
      const result = await fn();
      tracker.end({ tags });
      return result;
    } catch (error) {
      tracker.end({ tags: { ...tags, error: "true" } });
      throw error;
    }
  };
}
