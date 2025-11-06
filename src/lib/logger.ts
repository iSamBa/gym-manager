/**
 * Structured logging utility
 *
 * Provides consistent logging across the application with environment-aware behavior:
 * - Development: Logs to console with readable formatting
 * - Production: Only logs errors, suppresses debug/info logs
 *
 * Future extensions:
 * - Integration with external logging services (Sentry, LogRocket, Datadog)
 * - Log aggregation and querying
 * - Performance metrics tracking
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  /**
   * Check if running in development environment
   */
  private get isDevelopment(): boolean {
    return process.env.NODE_ENV === "development";
  }

  /**
   * Internal log method that handles formatting and environment filtering
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    // In production, suppress debug and info logs to reduce noise
    if (!this.isDevelopment && (level === "debug" || level === "info")) {
      return;
    }

    // Format log data with timestamp in local format
    const now = new Date();
    const localTimestamp = now.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });

    const logData = {
      timestamp: localTimestamp,
      level,
      message,
      ...context,
    };

    // In development, use console with readable formatting
    if (this.isDevelopment) {
      const consoleFn =
        level === "error"
          ? console.error
          : level === "warn"
            ? console.warn
            : console.log;

      // Format: [TIMESTAMP] [LEVEL] message {context}
      consoleFn(
        `[${localTimestamp}] [${level.toUpperCase()}]`,
        message,
        context ? context : ""
      );
    } else {
      // In production, only log errors and warnings to console
      // This can be extended to send to external services
      if (level === "error" || level === "warn") {
        const consoleFn = level === "error" ? console.error : console.warn;
        consoleFn(JSON.stringify(logData));
      }

      // TODO(#issue): Send to external logging service (Sentry, LogRocket, etc.) - Track in GitHub issues
      // if (level === 'error') {
      //   sendToExternalService(logData);
      // }
    }
  }

  /**
   * Debug level: Detailed information for debugging
   * Only shown in development environment
   */
  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  /**
   * Info level: General informational messages
   * Only shown in development environment
   */
  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  /**
   * Warning level: Warning messages that don't prevent functionality
   * Shown in all environments
   */
  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  /**
   * Error level: Error conditions that need attention
   * Always logged in all environments
   */
  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }
}

/**
 * Singleton logger instance
 * Import and use throughout the application:
 *
 * @example
 * import { logger } from '@/lib/logger';
 *
 * logger.debug('Fetching user data', { userId: '123' });
 * logger.error('Failed to save payment', { error: err.message, paymentId });
 */
export const logger = new Logger();
