import { describe, it, expect } from "vitest";
import {
  getUserFriendlyErrorMessage,
  isNetworkError,
  isAuthError,
  isValidationError,
} from "./error-messages";

describe("getUserFriendlyErrorMessage", () => {
  describe("Database Constraint Errors", () => {
    it("handles foreign key constraint violations", () => {
      const error = new Error(
        'violates foreign key constraint "fk_member_subscription"'
      );
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("linked to other data");
    });

    it("handles unique constraint violations", () => {
      const error = new Error(
        'duplicate key value violates unique constraint "members_email_key"'
      );
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("already exists");
    });

    it("handles unique constraint with field name extraction", () => {
      const error = new Error(
        'duplicate key value violates unique constraint "members_email_key"'
      );
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("Email");
    });

    it("handles not-null constraint violations", () => {
      const error = new Error(
        'null value in column "name" violates not-null constraint'
      );
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("required");
      expect(message).toContain("Name");
    });

    it("handles check constraint violations", () => {
      const error = new Error(
        'violates check constraint "check_positive_amount"'
      );
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("validation requirements");
    });
  });

  describe("Network and API Errors", () => {
    it("handles timeout errors", () => {
      const error = new Error("Request timeout exceeded");
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("took too long");
    });

    it("handles network errors", () => {
      const error = new Error("Network error: Failed to fetch");
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("connect to the server");
    });

    it("handles unauthorized errors", () => {
      const error = new Error("Unauthorized: Not authenticated");
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("session has expired");
    });

    it("handles forbidden errors", () => {
      const error = new Error("Forbidden: Permission denied");
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("don't have permission");
    });

    it("handles not found errors", () => {
      const error = new Error("Resource not found");
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("could not be found");
    });

    it("handles conflict errors", () => {
      const error = new Error("Conflict: Record already exists");
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("conflicts with existing data");
    });
  });

  describe("Validation Errors", () => {
    it("handles required field errors", () => {
      const error = new Error("Field is required");
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("required fields");
    });

    it("handles invalid format errors", () => {
      const error = new Error("Invalid format for email");
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("format is invalid");
    });

    it("handles out of range errors", () => {
      const error = new Error("Value is out of range");
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("outside the allowed range");
    });

    it("handles invalid date errors", () => {
      const error = new Error("Invalid date provided");
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("date is invalid");
    });
  });

  describe("Context-Specific Messages", () => {
    it("includes operation and resource in message", () => {
      const error = new Error("Database error");
      const message = getUserFriendlyErrorMessage(error, {
        operation: "create",
        resource: "member",
      });
      expect(message).toContain("Failed to create member");
    });

    it("handles different operations", () => {
      const error = new Error("Database error");

      const updateMessage = getUserFriendlyErrorMessage(error, {
        operation: "update",
        resource: "trainer",
      });
      expect(updateMessage).toContain("Failed to update trainer");

      const deleteMessage = getUserFriendlyErrorMessage(error, {
        operation: "delete",
        resource: "subscription",
      });
      expect(deleteMessage).toContain("Failed to delete subscription");

      const fetchMessage = getUserFriendlyErrorMessage(error, {
        operation: "fetch",
        resource: "members",
      });
      expect(fetchMessage).toContain("Failed to load members");
    });

    it("uses fallback message when provided", () => {
      const error = new Error("Unknown error");
      const message = getUserFriendlyErrorMessage(error, {
        fallback: "Custom fallback message",
      });
      expect(message).toContain("Custom fallback");
    });
  });

  describe("Edge Cases", () => {
    it("handles string errors", () => {
      const message = getUserFriendlyErrorMessage("Simple string error");
      expect(message).toBe("Simple string error");
    });

    it("handles null/undefined errors", () => {
      const message = getUserFriendlyErrorMessage(null);
      expect(message).toContain("unexpected error");
    });

    it("handles errors without messages", () => {
      const error = new Error();
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("unexpected error");
    });

    it("handles non-Error objects", () => {
      const message = getUserFriendlyErrorMessage({ custom: "error" });
      expect(message).toContain("unexpected error");
    });
  });
});

describe("isNetworkError", () => {
  it("returns true for timeout errors", () => {
    const error = new Error("Request timed out");
    expect(isNetworkError(error)).toBe(true);
  });

  it("returns true for network errors", () => {
    const error = new Error("Network error occurred");
    expect(isNetworkError(error)).toBe(true);
  });

  it("returns false for non-network errors", () => {
    const error = new Error("Database constraint violation");
    expect(isNetworkError(error)).toBe(false);
  });

  it("returns false for non-Error objects", () => {
    expect(isNetworkError("error")).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});

describe("isAuthError", () => {
  it("returns true for unauthorized errors", () => {
    const error = new Error("Unauthorized access");
    expect(isAuthError(error)).toBe(true);
  });

  it("returns true for forbidden errors", () => {
    const error = new Error("Forbidden: Permission denied");
    expect(isAuthError(error)).toBe(true);
  });

  it("returns false for non-auth errors", () => {
    const error = new Error("Database error");
    expect(isAuthError(error)).toBe(false);
  });

  it("returns false for non-Error objects", () => {
    expect(isAuthError("error")).toBe(false);
    expect(isAuthError(null)).toBe(false);
  });
});

describe("isValidationError", () => {
  it("returns true for required field errors", () => {
    const error = new Error("Field cannot be null");
    expect(isValidationError(error)).toBe(true);
  });

  it("returns true for invalid format errors", () => {
    const error = new Error("Invalid format detected");
    expect(isValidationError(error)).toBe(true);
  });

  it("returns true for out of range errors", () => {
    const error = new Error("Value too large");
    expect(isValidationError(error)).toBe(true);
  });

  it("returns true for invalid date errors", () => {
    const error = new Error("Date is invalid");
    expect(isValidationError(error)).toBe(true);
  });

  it("returns false for non-validation errors", () => {
    const error = new Error("Network error");
    expect(isValidationError(error)).toBe(false);
  });

  it("returns false for non-Error objects", () => {
    expect(isValidationError("error")).toBe(false);
    expect(isValidationError(null)).toBe(false);
  });
});
