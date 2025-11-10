/**
 * Error Message Utility
 *
 * Maps technical error messages to user-friendly messages.
 * Provides context-specific error handling for common database and API errors.
 */

/**
 * Database constraint error patterns
 */
const CONSTRAINT_PATTERNS = {
  FOREIGN_KEY: /violates foreign key constraint/i,
  UNIQUE: /duplicate key value violates unique constraint/i,
  NOT_NULL: /null value in column .* violates not-null constraint/i,
  CHECK: /violates check constraint/i,
} as const;

/**
 * Network and API error patterns
 */
const NETWORK_PATTERNS = {
  TIMEOUT: /timeout|timed out/i,
  NETWORK: /network error|failed to fetch/i,
  UNAUTHORIZED: /unauthorized|not authenticated/i,
  FORBIDDEN: /forbidden|permission denied/i,
  NOT_FOUND: /not found|does not exist/i,
  CONFLICT: /conflict|already exists/i,
} as const;

/**
 * Validation error patterns
 */
const VALIDATION_PATTERNS = {
  REQUIRED: /required|cannot be null|cannot be empty/i,
  INVALID_FORMAT: /invalid format|malformed/i,
  OUT_OF_RANGE: /out of range|too large|too small/i,
  INVALID_DATE: /invalid date|date.*invalid/i,
} as const;

/**
 * Extract field name from PostgreSQL error message
 */
function extractFieldName(message: string): string | null {
  // Try to extract from "column X violates..." pattern
  const columnMatch = message.match(/column "([^"]+)"/i);
  if (columnMatch) {
    return columnMatch[1];
  }

  // Try to extract from constraint name pattern (table_column_key)
  const constraintMatch = message.match(/"([^"]+)"/);
  if (constraintMatch) {
    const parts = constraintMatch[1].split("_");
    if (parts.length > 1) {
      return parts[1]; // Usually column name is second part
    }
  }

  return null;
}

/**
 * Convert snake_case to Title Case
 */
function toTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Get user-friendly error message for database constraints
 */
function getDatabaseErrorMessage(error: Error): string | null {
  const message = error.message;

  // Foreign key constraint
  if (CONSTRAINT_PATTERNS.FOREIGN_KEY.test(message)) {
    return "This record is linked to other data and cannot be modified. Please remove related records first.";
  }

  // Unique constraint
  if (CONSTRAINT_PATTERNS.UNIQUE.test(message)) {
    const field = extractFieldName(message);
    if (field) {
      return `A record with this ${toTitleCase(field)} already exists. Please use a different value.`;
    }
    return "A record with these details already exists. Please check for duplicates.";
  }

  // Not null constraint
  if (CONSTRAINT_PATTERNS.NOT_NULL.test(message)) {
    const field = extractFieldName(message);
    if (field) {
      return `${toTitleCase(field)} is required. Please provide a value.`;
    }
    return "A required field is missing. Please fill in all required information.";
  }

  // Check constraint
  if (CONSTRAINT_PATTERNS.CHECK.test(message)) {
    return "The provided data does not meet validation requirements. Please check your input.";
  }

  return null;
}

/**
 * Get user-friendly error message for network/API errors
 */
function getNetworkErrorMessage(error: Error): string | null {
  const message = error.message;

  if (NETWORK_PATTERNS.TIMEOUT.test(message)) {
    return "The request took too long to complete. Please check your connection and try again.";
  }

  if (NETWORK_PATTERNS.NETWORK.test(message)) {
    return "Unable to connect to the server. Please check your internet connection.";
  }

  if (NETWORK_PATTERNS.UNAUTHORIZED.test(message)) {
    return "Your session has expired. Please log in again.";
  }

  if (NETWORK_PATTERNS.FORBIDDEN.test(message)) {
    return "You don't have permission to perform this action. Please contact your administrator.";
  }

  if (NETWORK_PATTERNS.NOT_FOUND.test(message)) {
    return "The requested resource could not be found. It may have been deleted.";
  }

  if (NETWORK_PATTERNS.CONFLICT.test(message)) {
    return "This action conflicts with existing data. Please refresh and try again.";
  }

  return null;
}

/**
 * Get user-friendly error message for validation errors
 */
function getValidationErrorMessage(error: Error): string | null {
  const message = error.message;

  if (VALIDATION_PATTERNS.REQUIRED.test(message)) {
    return "Please fill in all required fields before submitting.";
  }

  if (VALIDATION_PATTERNS.INVALID_FORMAT.test(message)) {
    return "The data format is invalid. Please check your input and try again.";
  }

  if (VALIDATION_PATTERNS.OUT_OF_RANGE.test(message)) {
    return "The value is outside the allowed range. Please adjust and try again.";
  }

  if (VALIDATION_PATTERNS.INVALID_DATE.test(message)) {
    return "The date is invalid. Please select a valid date.";
  }

  return null;
}

/**
 * Get operation-specific error message prefix
 */
function getOperationPrefix(operation: string): string {
  const prefixes: Record<string, string> = {
    create: "Failed to create",
    update: "Failed to update",
    delete: "Failed to delete",
    fetch: "Failed to load",
    save: "Failed to save",
  };

  return prefixes[operation.toLowerCase()] || "Operation failed";
}

/**
 * Get user-friendly error message for any error
 *
 * @param error - The error object
 * @param context - Optional context for more specific messages
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await createMember(data);
 * } catch (error) {
 *   const message = getUserFriendlyErrorMessage(error, {
 *     operation: 'create',
 *     resource: 'member'
 *   });
 *   toast.error(message);
 * }
 * ```
 */
export function getUserFriendlyErrorMessage(
  error: unknown,
  context?: {
    operation?: string;
    resource?: string;
    fallback?: string;
  }
): string {
  // Handle non-Error objects
  if (!(error instanceof Error)) {
    if (typeof error === "string") {
      return error;
    }
    return (
      context?.fallback || "An unexpected error occurred. Please try again."
    );
  }

  // Try to get a specific error message
  const databaseMessage = getDatabaseErrorMessage(error);
  if (databaseMessage) {
    if (context?.operation && context?.resource) {
      return `${getOperationPrefix(context.operation)} ${context.resource}: ${databaseMessage}`;
    }
    return databaseMessage;
  }

  const networkMessage = getNetworkErrorMessage(error);
  if (networkMessage) {
    return networkMessage;
  }

  const validationMessage = getValidationErrorMessage(error);
  if (validationMessage) {
    return validationMessage;
  }

  // Fall back to operation-specific message or generic message
  if (context?.operation && context?.resource) {
    return `${getOperationPrefix(context.operation)} ${context.resource}. ${error.message || "Please try again."}`;
  }

  return (
    context?.fallback ||
    error.message ||
    "An unexpected error occurred. Please try again."
  );
}

/**
 * Check if error is a network error (for retry logic)
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    NETWORK_PATTERNS.TIMEOUT.test(error.message) ||
    NETWORK_PATTERNS.NETWORK.test(error.message)
  );
}

/**
 * Check if error is an authentication error (for redirect logic)
 */
export function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    NETWORK_PATTERNS.UNAUTHORIZED.test(error.message) ||
    NETWORK_PATTERNS.FORBIDDEN.test(error.message)
  );
}

/**
 * Check if error is a validation error (for form handling)
 */
export function isValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return getValidationErrorMessage(error) !== null;
}
