import { describe, it, expect } from "vitest";
import {
  createSubscriptionSchema,
  recordPaymentSchema,
  upgradeSubscriptionSchema,
  pauseSubscriptionSchema,
} from "../validation";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("validation schemas", () => {
  describe("createSubscriptionSchema", () => {
    it("should validate valid subscription data", () => {
      const data = {
        member_id: validUUID,
        plan_id: validUUID,
        initial_payment_amount: 50,
        payment_method: "cash",
      };

      const result = createSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUIDs", () => {
      const data = {
        member_id: "invalid",
        plan_id: validUUID,
      };

      const result = createSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject negative amounts", () => {
      const data = {
        member_id: validUUID,
        plan_id: validUUID,
        initial_payment_amount: -10,
      };

      const result = createSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("recordPaymentSchema", () => {
    it("should validate valid payment data", () => {
      const data = {
        subscription_id: validUUID,
        amount: 50.99,
        payment_method: "card",
      };

      const result = recordPaymentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject zero amount", () => {
      const data = {
        subscription_id: validUUID,
        amount: 0,
        payment_method: "cash",
      };

      const result = recordPaymentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("upgradeSubscriptionSchema", () => {
    it("should validate valid upgrade data", () => {
      const data = {
        current_subscription_id: validUUID,
        new_plan_id: validUUID,
        credit_amount: 25.5,
      };

      const result = upgradeSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject negative credit amount", () => {
      const data = {
        current_subscription_id: validUUID,
        new_plan_id: validUUID,
        credit_amount: -10,
      };

      const result = upgradeSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("pauseSubscriptionSchema", () => {
    it("should validate valid pause data", () => {
      const data = {
        subscription_id: validUUID,
        reason: "Vacation",
      };

      const result = pauseSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid subscription ID", () => {
      const data = {
        subscription_id: "invalid",
        reason: "Vacation",
      };

      const result = pauseSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
