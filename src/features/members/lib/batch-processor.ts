// Batch processing utilities for bulk operations
import type {
  BulkOperationProgress,
  BulkOperationResult,
} from "../hooks/use-bulk-operations";

// Batch processing configuration
export interface BatchProcessorConfig {
  batchSize: number;
  delayBetweenBatches: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  timeoutPerBatch: number; // milliseconds
}

// Default configuration
const DEFAULT_CONFIG: BatchProcessorConfig = {
  batchSize: 50,
  delayBetweenBatches: 100,
  maxRetries: 3,
  retryDelay: 1000,
  timeoutPerBatch: 30000, // 30 seconds
};

// Batch operation context
export interface BatchContext<T> {
  items: T[];
  config: BatchProcessorConfig;
  onProgress?: (progress: BulkOperationProgress) => void;
  onBatchComplete?: (batchIndex: number, results: BatchResult<T>[]) => void;
  onError?: (error: Error, batchIndex: number) => void;
}

// Individual batch result
export interface BatchResult<T> {
  item: T;
  success: boolean;
  error?: string;
  retries: number;
  processingTime: number;
}

// Enhanced batch processor class
export class BatchProcessor<T> {
  private readonly config: BatchProcessorConfig;
  private startTime = 0;
  private processedCount = 0;

  constructor(config: Partial<BatchProcessorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Process items in batches with comprehensive error handling
  async processBatches<R>(
    items: T[],
    processFn: (item: T) => Promise<R>,
    context: Partial<BatchContext<T>> = {}
  ): Promise<BulkOperationResult> {
    const fullContext: BatchContext<T> = {
      items,
      config: this.config,
      ...context,
    };

    this.startTime = Date.now();
    this.processedCount = 0;

    const result: BulkOperationResult = {
      successful: [],
      failed: [],
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0,
    };

    const totalBatches = Math.ceil(items.length / this.config.batchSize);
    const allBatchResults: BatchResult<T>[] = [];

    try {
      // Process each batch
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStartIndex = batchIndex * this.config.batchSize;
        const batchEndIndex = Math.min(
          batchStartIndex + this.config.batchSize,
          items.length
        );
        const batch = items.slice(batchStartIndex, batchEndIndex);

        // Update progress before processing batch
        this.updateProgress(
          fullContext,
          batchStartIndex,
          items.length,
          batchIndex + 1,
          totalBatches
        );

        try {
          // Process batch with timeout
          const batchResults = await this.processBatchWithRetry(
            batch,
            processFn,
            batchIndex
          );
          allBatchResults.push(...batchResults);

          // Update result counters
          batchResults.forEach((batchResult) => {
            if (batchResult.success) {
              // For successful items, we need to identify them somehow
              // This assumes items have an 'id' property or can be converted to string
              result.successful.push(this.getItemId(batchResult.item));
            } else {
              result.failed.push({
                id: this.getItemId(batchResult.item),
                error: batchResult.error || "Unknown error",
              });
            }
          });

          // Notify batch completion
          fullContext.onBatchComplete?.(batchIndex, batchResults);

          this.processedCount = batchEndIndex;

          // Delay between batches to prevent server overload
          if (
            batchIndex < totalBatches - 1 &&
            this.config.delayBetweenBatches > 0
          ) {
            await this.delay(this.config.delayBetweenBatches);
          }
        } catch (error) {
          // Handle batch-level errors
          const errorMessage =
            error instanceof Error ? error.message : "Batch processing failed";

          // Mark all items in the batch as failed
          batch.forEach((item) => {
            result.failed.push({
              id: this.getItemId(item),
              error: errorMessage,
            });
          });

          fullContext.onError?.(
            error instanceof Error ? error : new Error(errorMessage),
            batchIndex
          );
          this.processedCount = batchEndIndex;
        }

        // Update progress after processing batch
        this.updateProgress(
          fullContext,
          this.processedCount,
          items.length,
          batchIndex + 1,
          totalBatches
        );
      }

      // Final result calculation
      result.totalProcessed = items.length;
      result.totalSuccessful = result.successful.length;
      result.totalFailed = result.failed.length;

      return result;
    } catch (error) {
      // Handle overall processing errors
      const errorMessage =
        error instanceof Error ? error.message : "Processing failed";

      // Mark any unprocessed items as failed
      const unprocessedItems = items.slice(this.processedCount);
      unprocessedItems.forEach((item) => {
        result.failed.push({
          id: this.getItemId(item),
          error: errorMessage,
        });
      });

      result.totalProcessed = items.length;
      result.totalSuccessful = result.successful.length;
      result.totalFailed = result.failed.length;

      throw error;
    }
  }

  // Process a single batch with retry logic
  private async processBatchWithRetry<R>(
    batch: T[],
    processFn: (item: T) => Promise<R>,
    batchIndex: number // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<BatchResult<T>[]> {
    const results: BatchResult<T>[] = [];

    // Process each item in the batch
    const batchPromises = batch.map(async (item) => {
      return this.processItemWithRetry(item, processFn);
    });

    // Wait for all items in the batch to complete
    const batchResults = await Promise.allSettled(
      batchPromises.map((promise) =>
        this.withTimeout(promise, this.config.timeoutPerBatch)
      )
    );

    // Process settled results
    batchResults.forEach((settledResult, index) => {
      const item = batch[index];

      if (settledResult.status === "fulfilled") {
        results.push(settledResult.value);
      } else {
        // Handle rejected promises
        const error =
          settledResult.reason instanceof Error
            ? settledResult.reason.message
            : "Unknown error";

        results.push({
          item,
          success: false,
          error,
          retries: this.config.maxRetries,
          processingTime: 0,
        });
      }
    });

    return results;
  }

  // Process individual item with retry logic
  private async processItemWithRetry<R>(
    item: T,
    processFn: (item: T) => Promise<R>
  ): Promise<BatchResult<T>> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let retryCount = 0;

    while (retryCount <= this.config.maxRetries) {
      try {
        await processFn(item);
        return {
          item,
          success: true,
          retries: retryCount,
          processingTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        retryCount++;

        // If we haven't exhausted retries, wait before trying again
        if (retryCount <= this.config.maxRetries) {
          await this.delay(this.config.retryDelay * retryCount); // Exponential backoff
        }
      }
    }

    // All retries exhausted
    return {
      item,
      success: false,
      error: lastError?.message || "Max retries exceeded",
      retries: retryCount - 1,
      processingTime: Date.now() - startTime,
    };
  }

  // Update progress and call progress callback
  private updateProgress(
    context: BatchContext<T>,
    current: number,
    total: number,
    currentBatch: number,
    totalBatches: number
  ) {
    if (!context.onProgress) return;

    const elapsed = Date.now() - this.startTime;
    const processingRate = current > 0 ? current / (elapsed / 1000) : 0;
    const estimatedTimeRemaining =
      processingRate > 0
        ? ((total - current) / processingRate) * 1000
        : undefined;

    const progress: BulkOperationProgress = {
      current,
      total,
      percentage: (current / total) * 100,
      currentBatch,
      totalBatches,
      estimatedTimeRemaining,
      processingRate,
    };

    context.onProgress(progress);
  }

  // Helper to extract ID from item (assumes items have id property or are strings)
  private getItemId(item: T): string {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null && "id" in item) {
      return String((item as { id: unknown }).id);
    }
    return String(item);
  }

  // Promise timeout wrapper
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Get processing statistics
  getProcessingStats() {
    const elapsed = Date.now() - this.startTime;
    const processingRate =
      this.processedCount > 0 ? this.processedCount / (elapsed / 1000) : 0;

    return {
      totalProcessed: this.processedCount,
      elapsedTime: elapsed,
      processingRate,
      averageTimePerItem:
        this.processedCount > 0 ? elapsed / this.processedCount : 0,
    };
  }
}

// Convenience function for simple batch processing
export async function processBatch<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  options: Partial<
    BatchProcessorConfig & {
      onProgress?: (progress: BulkOperationProgress) => void;
    }
  > = {}
): Promise<BulkOperationResult> {
  const { onProgress, ...config } = options;
  const processor = new BatchProcessor<T>(config);

  return processor.processBatches(items, processFn, { onProgress });
}

// Specialized processors for common operations
export class MemberBatchProcessor extends BatchProcessor<string> {
  constructor(config: Partial<BatchProcessorConfig> = {}) {
    super({
      batchSize: 50, // Optimal for member operations
      delayBetweenBatches: 100,
      maxRetries: 2,
      retryDelay: 500,
      timeoutPerBatch: 15000, // 15 seconds for member operations
      ...config,
    });
  }
}

// Error recovery utilities
export class BatchErrorRecovery {
  // Analyze failed operations and suggest recovery actions
  static analyzeFailures(result: BulkOperationResult): {
    canRetry: boolean;
    retryableFailures: string[];
    permanentFailures: string[];
    suggestedActions: string[];
  } {
    const retryableErrors = [
      "timeout",
      "network",
      "temporary",
      "rate limit",
      "connection",
    ];

    const retryableFailures: string[] = [];
    const permanentFailures: string[] = [];

    result.failed.forEach((failure) => {
      const isRetryable = retryableErrors.some((keyword) =>
        failure.error.toLowerCase().includes(keyword)
      );

      if (isRetryable) {
        retryableFailures.push(failure.id);
      } else {
        permanentFailures.push(failure.id);
      }
    });

    const suggestedActions: string[] = [];

    if (retryableFailures.length > 0) {
      suggestedActions.push(
        `Retry ${retryableFailures.length} failed operations`
      );
    }

    if (permanentFailures.length > 0) {
      suggestedActions.push(
        `Review ${permanentFailures.length} permanent failures`
      );
    }

    const failureRate = result.totalFailed / result.totalProcessed;
    if (failureRate > 0.1) {
      suggestedActions.push("High failure rate - check system health");
    }

    return {
      canRetry: retryableFailures.length > 0,
      retryableFailures,
      permanentFailures,
      suggestedActions,
    };
  }

  // Create a recovery plan for failed operations
  static createRecoveryPlan(result: BulkOperationResult): {
    retryBatch: string[];
    investigateItems: string[];
    skipItems: string[];
  } {
    const analysis = this.analyzeFailures(result);

    return {
      retryBatch: analysis.retryableFailures,
      investigateItems: analysis.permanentFailures.slice(0, 10), // Investigate first 10
      skipItems: analysis.permanentFailures.slice(10), // Skip the rest
    };
  }
}
