// Query optimization utilities for efficient data fetching and caching
import { QueryClient } from "@tanstack/react-query";
import { memberUtils } from "@/features/database/lib/utils";
import type { Member } from "@/features/database/lib/types";
// import { memberKeys } from "../hooks/use-members"; // Reserved for future use

// Query deduplication manager
export class QueryDeduplicator {
  private pendingQueries = new Map<string, Promise<any>>(); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Deduplicate identical queries
  async deduplicate<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    if (this.pendingQueries.has(key)) {
      return this.pendingQueries.get(key) as Promise<T>;
    }

    const promise = queryFn().finally(() => {
      this.pendingQueries.delete(key);
    });

    this.pendingQueries.set(key, promise);
    return promise;
  }

  // Get pending query count
  getPendingCount(): number {
    return this.pendingQueries.size;
  }

  // Clear all pending queries
  clear(): void {
    this.pendingQueries.clear();
  }

  // Get pending query keys
  getPendingKeys(): string[] {
    return Array.from(this.pendingQueries.keys());
  }
}

// Request batching for multiple single-member queries
export class MemberBatchLoader {
  private batchQueue: string[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchSize = 50;
  private readonly batchDelay = 50; // ms

  async loadMember(memberId: string): Promise<Member | null> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push(memberId);

      // Add to batch timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      this.batchTimeout = setTimeout(async () => {
        try {
          const results = await this.executeBatch();
          const memberResult = results.find((m) => m?.id === memberId) || null;
          resolve(memberResult);
        } catch (error) {
          reject(error);
        }
      }, this.batchDelay);

      // Execute immediately if batch is full
      if (this.batchQueue.length >= this.batchSize) {
        this.executeBatch();
      }
    });
  }

  private async executeBatch(): Promise<(Member | null)[]> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const memberIds = [...this.batchQueue];
    this.batchQueue = [];

    if (memberIds.length === 0) return [];

    try {
      // In a real implementation, this would be a batch query
      // For now, we'll simulate with individual queries
      const batchPromises = memberIds.map((id) =>
        memberUtils.getMemberById(id).catch(() => null)
      );

      return await Promise.all(batchPromises);
    } catch (error) {
      console.error("Batch loading failed:", error);
      throw error;
    }
  }
}

// Selective field fetching to reduce payload
export interface MemberFieldSelection {
  basic?: boolean; // id, name, email, status
  contact?: boolean; // phone, address
  membership?: boolean; // join_date, membership details
  personal?: boolean; // date_of_birth, gender, etc.
  compliance?: boolean; // waiver_signed, medical_conditions
  metadata?: boolean; // created_at, updated_at, notes
}

export function createSelectiveFieldQuery(
  selection: MemberFieldSelection = { basic: true }
): (member: Member) => Partial<Member> {
  return (member: Member) => {
    const result: Partial<Member> = {};

    if (selection.basic) {
      result.id = member.id;
      result.member_number = member.member_number;
      result.first_name = member.first_name;
      result.last_name = member.last_name;
      result.email = member.email;
      result.status = member.status;
    }

    if (selection.contact) {
      result.phone = member.phone;
      result.address = member.address;
    }

    if (selection.membership) {
      result.join_date = member.join_date;
      result.membership_type = member.membership_type;
    }

    if (selection.personal) {
      result.date_of_birth = member.date_of_birth;
      result.gender = member.gender;
    }

    if (selection.compliance) {
      result.waiver_signed = member.waiver_signed;
      result.medical_conditions = member.medical_conditions;
      result.marketing_consent = member.marketing_consent;
    }

    if (selection.metadata) {
      result.created_at = member.created_at;
      result.updated_at = member.updated_at;
      result.notes = member.notes;
    }

    return result;
  };
}

// Computed field caching
export class ComputedFieldCache {
  private cache = new Map<
    string,
    { value: any; timestamp: number; ttl: number }
  >(); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Cache a computed field
  set<T>(key: string, value: T, ttlMs = 5 * 60 * 1000): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  // Get a computed field
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  // Check if a field exists and is valid
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Clear expired entries
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all entries
  clear(): void {
    this.cache.clear();
  }

  // Get cache stats
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: validEntries / (validEntries + expiredEntries) || 0,
    };
  }
}

// Computed field generators
export const memberComputedFields = {
  fullName: (member: Member) => `${member.first_name} ${member.last_name}`,

  age: (member: Member) => {
    if (!member.date_of_birth) return null;
    const birthDate = new Date(member.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      return age - 1;
    }

    return age;
  },

  membershipDuration: (member: Member) => {
    const joinDate = new Date(member.join_date || member.created_at);
    const now = new Date();
    const durationMs = now.getTime() - joinDate.getTime();
    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

    if (days < 30) {
      return `${days} day${days !== 1 ? "s" : ""}`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} month${months !== 1 ? "s" : ""}`;
    } else {
      const years = Math.floor(days / 365);
      const remainingMonths = Math.floor((days % 365) / 30);
      return `${years} year${years !== 1 ? "s" : ""}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}` : ""}`;
    }
  },

  statusIcon: (member: Member) => {
    const iconMap = {
      active: "✅",
      inactive: "⏸️",
      suspended: "⚠️",
      pending: "🕐",
    };
    return iconMap[member.status] || "❓";
  },

  complianceStatus: (member: Member) => {
    const checks = [
      member.waiver_signed,
      !!member.emergency_contacts,
      !!member.email,
      !!member.phone,
    ];

    const compliantChecks = checks.filter(Boolean).length;
    const percentage = (compliantChecks / checks.length) * 100;

    return {
      percentage: Math.round(percentage),
      status:
        percentage === 100
          ? "complete"
          : percentage >= 75
            ? "good"
            : percentage >= 50
              ? "fair"
              : "poor",
      missingItems: [
        !member.waiver_signed && "Waiver not signed",
        !member.emergency_contacts && "Emergency contact missing",
        !member.email && "Email address missing",
        !member.phone && "Phone number missing",
      ].filter(Boolean),
    };
  },

  searchableText: (member: Member) => {
    return [
      member.first_name,
      member.last_name,
      member.email,
      member.phone,
      member.member_number,
      member.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  },
};

// Query performance analyzer
export class QueryPerformanceAnalyzer {
  private metrics = new Map<
    string,
    {
      queryKey: string;
      executionTimes: number[];
      errorCount: number;
      successCount: number;
      cacheHits: number;
      cacheMisses: number;
      lastExecuted: number;
    }
  >();

  // Record query execution
  recordExecution(
    queryKey: string,
    executionTime: number,
    success: boolean,
    cacheHit: boolean = false
  ): void {
    const keyStr = JSON.stringify(queryKey);

    if (!this.metrics.has(keyStr)) {
      this.metrics.set(keyStr, {
        queryKey: keyStr,
        executionTimes: [],
        errorCount: 0,
        successCount: 0,
        cacheHits: 0,
        cacheMisses: 0,
        lastExecuted: Date.now(),
      });
    }

    const metric = this.metrics.get(keyStr)!;

    metric.executionTimes.push(executionTime);
    metric.lastExecuted = Date.now();

    if (success) {
      metric.successCount++;
    } else {
      metric.errorCount++;
    }

    if (cacheHit) {
      metric.cacheHits++;
    } else {
      metric.cacheMisses++;
    }

    // Keep only last 100 execution times
    if (metric.executionTimes.length > 100) {
      metric.executionTimes = metric.executionTimes.slice(-100);
    }
  }

  // Get performance metrics for a query
  getMetrics(queryKey: string) {
    const keyStr = JSON.stringify(queryKey);
    const metric = this.metrics.get(keyStr);

    if (!metric) return null;

    const executionTimes = metric.executionTimes;
    const avgExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0) /
          executionTimes.length
        : 0;

    const minExecutionTime =
      executionTimes.length > 0 ? Math.min(...executionTimes) : 0;
    const maxExecutionTime =
      executionTimes.length > 0 ? Math.max(...executionTimes) : 0;

    const totalRequests = metric.successCount + metric.errorCount;
    const successRate =
      totalRequests > 0 ? (metric.successCount / totalRequests) * 100 : 0;
    const errorRate =
      totalRequests > 0 ? (metric.errorCount / totalRequests) * 100 : 0;

    const totalCacheRequests = metric.cacheHits + metric.cacheMisses;
    const cacheHitRate =
      totalCacheRequests > 0
        ? (metric.cacheHits / totalCacheRequests) * 100
        : 0;

    return {
      queryKey: metric.queryKey,
      performance: {
        avgExecutionTime: Math.round(avgExecutionTime),
        minExecutionTime,
        maxExecutionTime,
        executionCount: executionTimes.length,
      },
      reliability: {
        successCount: metric.successCount,
        errorCount: metric.errorCount,
        successRate: Math.round(successRate * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
      },
      caching: {
        hitCount: metric.cacheHits,
        missCount: metric.cacheMisses,
        hitRate: Math.round(cacheHitRate * 100) / 100,
      },
      lastExecuted: metric.lastExecuted,
      timeSinceLastExecution: Date.now() - metric.lastExecuted,
    };
  }

  // Get all metrics
  getAllMetrics() {
    return Array.from(this.metrics.keys())
      .map((key) => this.getMetrics(key))
      .filter(Boolean);
  }

  // Get slow queries (above threshold)
  getSlowQueries(thresholdMs: number = 1000) {
    return this.getAllMetrics().filter(
      (metric) => metric && metric.performance.avgExecutionTime > thresholdMs
    );
  }

  // Get queries with high error rates
  getErrorProneQueries(errorRateThreshold: number = 5) {
    return this.getAllMetrics().filter(
      (metric) => metric && metric.reliability.errorRate > errorRateThreshold
    );
  }

  // Get queries with low cache hit rates
  getLowCacheHitQueries(hitRateThreshold: number = 70) {
    return this.getAllMetrics().filter(
      (metric) => metric && metric.caching.hitRate < hitRateThreshold
    );
  }

  // Clear old metrics
  clearOldMetrics(maxAge: number = 24 * 60 * 60 * 1000) {
    // 24 hours
    const cutoff = Date.now() - maxAge;

    for (const [key, metric] of this.metrics.entries()) {
      if (metric.lastExecuted < cutoff) {
        this.metrics.delete(key);
      }
    }
  }

  // Generate performance report
  generateReport() {
    const allMetrics = this.getAllMetrics();

    if (allMetrics.length === 0) {
      return {
        summary: "No metrics available",
        totalQueries: 0,
        averagePerformance: null,
        issues: [],
      };
    }

    const totalExecutions = allMetrics.reduce(
      (sum, m) => sum + m!.performance.executionCount,
      0
    );
    const avgExecutionTime =
      allMetrics.reduce((sum, m) => sum + m!.performance.avgExecutionTime, 0) /
      allMetrics.length;
    const avgSuccessRate =
      allMetrics.reduce((sum, m) => sum + m!.reliability.successRate, 0) /
      allMetrics.length;
    const avgCacheHitRate =
      allMetrics.reduce((sum, m) => sum + m!.caching.hitRate, 0) /
      allMetrics.length;

    const issues = [];

    const slowQueries = this.getSlowQueries(500);
    if (slowQueries.length > 0) {
      issues.push({
        type: "performance",
        severity: "warning",
        message: `${slowQueries.length} queries are executing slowly (>500ms)`,
        queries: slowQueries.map((q) => q!.queryKey).slice(0, 5),
      });
    }

    const errorProneQueries = this.getErrorProneQueries(2);
    if (errorProneQueries.length > 0) {
      issues.push({
        type: "reliability",
        severity: "error",
        message: `${errorProneQueries.length} queries have high error rates (>2%)`,
        queries: errorProneQueries.map((q) => q!.queryKey).slice(0, 5),
      });
    }

    const lowCacheQueries = this.getLowCacheHitQueries(50);
    if (lowCacheQueries.length > 0) {
      issues.push({
        type: "caching",
        severity: "info",
        message: `${lowCacheQueries.length} queries have low cache hit rates (<50%)`,
        queries: lowCacheQueries.map((q) => q!.queryKey).slice(0, 5),
      });
    }

    return {
      summary: `Analyzed ${allMetrics.length} unique queries with ${totalExecutions} total executions`,
      totalQueries: allMetrics.length,
      totalExecutions,
      averagePerformance: {
        executionTime: Math.round(avgExecutionTime),
        successRate: Math.round(avgSuccessRate * 100) / 100,
        cacheHitRate: Math.round(avgCacheHitRate * 100) / 100,
      },
      issues,
      recommendations: this.generateRecommendations(issues),
    };
  }

  private generateRecommendations(issues: any[]) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    const recommendations = [];

    const hasPerformanceIssues = issues.some((i) => i.type === "performance");
    const hasReliabilityIssues = issues.some((i) => i.type === "reliability");
    const hasCachingIssues = issues.some((i) => i.type === "caching");

    if (hasPerformanceIssues) {
      recommendations.push("Consider adding database indexes for slow queries");
      recommendations.push(
        "Implement query result pagination for large datasets"
      );
      recommendations.push("Review and optimize complex query logic");
    }

    if (hasReliabilityIssues) {
      recommendations.push("Implement retry logic for failing queries");
      recommendations.push("Add better error handling and fallbacks");
      recommendations.push("Monitor database connection health");
    }

    if (hasCachingIssues) {
      recommendations.push("Increase cache TTL for stable data");
      recommendations.push(
        "Implement prefetching for predictable access patterns"
      );
      recommendations.push("Review cache invalidation strategies");
    }

    return recommendations;
  }
}

// Global instances
export const queryDeduplicator = new QueryDeduplicator();
export const memberBatchLoader = new MemberBatchLoader();
export const computedFieldCache = new ComputedFieldCache();
export const queryPerformanceAnalyzer = new QueryPerformanceAnalyzer();

// Utility function to enhance QueryClient with optimizations
export function enhanceQueryClient(queryClient: QueryClient) {
  // Add performance monitoring
  const originalQuery = queryClient.fetchQuery.bind(queryClient);

  queryClient.fetchQuery = async (...args: any[]) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    const [options] = args;
    const queryKey = options.queryKey;
    const startTime = Date.now();

    try {
      const result = await originalQuery(...args);
      const executionTime = Date.now() - startTime;

      queryPerformanceAnalyzer.recordExecution(
        queryKey,
        executionTime,
        true,
        false // We don't have cache hit info here
      );

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      queryPerformanceAnalyzer.recordExecution(
        queryKey,
        executionTime,
        false,
        false
      );

      throw error;
    }
  };

  return queryClient;
}

// Auto-optimization hook
export function useQueryOptimizations() {
  // Clean up expired computed fields periodically
  const cleanupInterval = setInterval(
    () => {
      computedFieldCache.clearExpired();
      queryPerformanceAnalyzer.clearOldMetrics();
    },
    5 * 60 * 1000
  ); // Every 5 minutes

  // Cleanup on unmount
  return () => {
    clearInterval(cleanupInterval);
  };
}
