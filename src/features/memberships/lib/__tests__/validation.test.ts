import { describe, it, expect } from "vitest";
import {
  createSubscriptionSchema,
  recordPaymentSchema,
  upgradeSubscriptionSchema,
  pauseSubscriptionSchema,
  type CreateSubscriptionData,
  type RecordPaymentData,
  type UpgradeSubscriptionData,
  type PauseSubscriptionData,
} from "../validation";

describe("validation schemas", () => {
  describe("createSubscriptionSchema", () => {
    it("should validate a valid subscription creation", () => {
      const validData: CreateSubscriptionData = {
        member_id: "123e4567-e89b-12d3-a456-426614174000",
        plan_id: "123e4567-e89b-12d3-a456-426614174001",
        start_date: "2024-01-01T00:00:00Z",
        initial_payment_amount: 50,
        payment_method: "cash",
        notes: "Initial subscription creation",
      };

      const result = createSubscriptionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should validate minimal required data", () => {
      const minimalData: CreateSubscriptionData = {
        member_id: "123e4567-e89b-12d3-a456-426614174000",
        plan_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = createSubscriptionSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid member_id", () => {
      const invalidData = {
        member_id: "invalid-uuid",
        plan_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = createSubscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid member ID");
      }
    });

    it("should reject invalid plan_id", () => {
      const invalidData = {
        member_id: "123e4567-e89b-12d3-a456-426614174000",
        plan_id: "invalid-uuid",
      };

      const result = createSubscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid plan ID");
      }
    });

    it("should reject negative payment amount", () => {
      const invalidData = {
        member_id: "123e4567-e89b-12d3-a456-426614174000",
        plan_id: "123e4567-e89b-12d3-a456-426614174001",
        initial_payment_amount: -10,
      };

      const result = createSubscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Payment amount must be positive"
        );
      }
    });

    it("should reject invalid payment method", () => {
      const invalidData = {
        member_id: "123e4567-e89b-12d3-a456-426614174000",
        plan_id: "123e4567-e89b-12d3-a456-426614174001",
        payment_method: "invalid_method",
      };

      const result = createSubscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe("invalid_value");
      }
    });

    it("should reject notes that are too long", () => {
      const invalidData = {
        member_id: "123e4567-e89b-12d3-a456-426614174000",
        plan_id: "123e4567-e89b-12d3-a456-426614174001",
        notes: "a".repeat(501), // 501 characters
      };

      const result = createSubscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Notes must be less than 500 characters"
        );
      }
    });

    it("should reject invalid datetime format", () => {
      const invalidData = {
        member_id: "123e4567-e89b-12d3-a456-426614174000",
        plan_id: "123e4567-e89b-12d3-a456-426614174001",
        start_date: "invalid-date",
      };

      const result = createSubscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe("invalid_format");
      }
    });

    it("should accept all valid payment methods", () => {
      const paymentMethods = [
        "cash",
        "card",
        "bank_transfer",
        "online",
        "check",
      ];

      paymentMethods.forEach((method) => {
        const data = {
          member_id: "123e4567-e89b-12d3-a456-426614174000",
          plan_id: "123e4567-e89b-12d3-a456-426614174001",
          payment_method: method,
        };

        const result = createSubscriptionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("recordPaymentSchema", () => {
    it("should validate a valid payment record", () => {
      const validData: RecordPaymentData = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 50.99,
        payment_method: "card",
        payment_date: "2024-01-01T00:00:00Z",
        reference_number: "REF-123456",
        notes: "Monthly payment",
      };

      const result = recordPaymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should validate minimal required data", () => {
      const minimalData: RecordPaymentData = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 50,
        payment_method: "cash",
      };

      const result = recordPaymentSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid subscription_id", () => {
      const invalidData = {
        subscription_id: "invalid-uuid",
        amount: 50,
        payment_method: "cash",
      };

      const result = recordPaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid subscription ID");
      }
    });

    it("should reject zero amount", () => {
      const invalidData = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 0,
        payment_method: "cash",
      };

      const result = recordPaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Amount must be greater than 0"
        );
      }
    });

    it("should reject negative amount", () => {
      const invalidData = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: -10,
        payment_method: "cash",
      };

      const result = recordPaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Amount must be greater than 0"
        );
      }
    });

    it("should accept minimal valid amount", () => {
      const data = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 0.01,
        payment_method: "cash",
      };

      const result = recordPaymentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject reference number that is too long", () => {
      const invalidData = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 50,
        payment_method: "cash",
        reference_number: "a".repeat(101), // 101 characters
      };

      const result = recordPaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe("too_big");
      }
    });
  });

  describe("upgradeSubscriptionSchema", () => {
    it("should validate a valid upgrade", () => {
      const validData: UpgradeSubscriptionData = {
        current_subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        new_plan_id: "123e4567-e89b-12d3-a456-426614174001",
        credit_amount: 25.5,
        effective_date: "2024-01-01T00:00:00Z",
      };

      const result = upgradeSubscriptionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should validate minimal required data", () => {
      const minimalData: UpgradeSubscriptionData = {
        current_subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        new_plan_id: "123e4567-e89b-12d3-a456-426614174001",
        credit_amount: 0,
      };

      const result = upgradeSubscriptionSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid current_subscription_id", () => {
      const invalidData = {
        current_subscription_id: "invalid-uuid",
        new_plan_id: "123e4567-e89b-12d3-a456-426614174001",
        credit_amount: 25,
      };

      const result = upgradeSubscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid subscription ID");
      }
    });

    it("should reject invalid new_plan_id", () => {
      const invalidData = {
        current_subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        new_plan_id: "invalid-uuid",
        credit_amount: 25,
      };

      const result = upgradeSubscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid plan ID");
      }
    });

    it("should reject negative credit amount", () => {
      const invalidData = {
        current_subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        new_plan_id: "123e4567-e89b-12d3-a456-426614174001",
        credit_amount: -10,
      };

      const result = upgradeSubscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Credit amount must be positive"
        );
      }
    });

    it("should accept zero credit amount", () => {
      const data = {
        current_subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        new_plan_id: "123e4567-e89b-12d3-a456-426614174001",
        credit_amount: 0,
      };

      const result = upgradeSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("pauseSubscriptionSchema", () => {
    it("should validate a valid pause request", () => {
      const validData: PauseSubscriptionData = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        reason: "Going on vacation for 2 months",
      };

      const result = pauseSubscriptionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should validate minimal required data", () => {
      const minimalData: PauseSubscriptionData = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = pauseSubscriptionSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid subscription_id", () => {
      const invalidData = {
        subscription_id: "invalid-uuid",
        reason: "Vacation",
      };

      const result = pauseSubscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid subscription ID");
      }
    });

    it("should reject reason that is too long", () => {
      const invalidData = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        reason: "a".repeat(201), // 201 characters
      };

      const result = pauseSubscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Reason must be less than 200 characters"
        );
      }
    });

    it("should accept maximum length reason", () => {
      const data = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        reason: "a".repeat(200), // Exactly 200 characters
      };

      const result = pauseSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept empty reason", () => {
      const data = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        reason: "",
      };

      const result = pauseSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("edge cases and boundaries", () => {
    it("should handle floating point amounts correctly", () => {
      const data = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 99.99,
        payment_method: "card",
      };

      const result = recordPaymentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should handle very small amounts correctly", () => {
      const data = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 0.01,
        payment_method: "cash",
      };

      const result = recordPaymentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should handle large amounts correctly", () => {
      const data = {
        subscription_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 9999.99,
        payment_method: "bank_transfer",
      };

      const result = recordPaymentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should handle empty optional fields correctly", () => {
      const data = {
        member_id: "123e4567-e89b-12d3-a456-426614174000",
        plan_id: "123e4567-e89b-12d3-a456-426614174001",
        notes: "", // Empty but present
      };

      const result = createSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
