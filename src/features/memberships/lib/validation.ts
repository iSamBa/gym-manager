import { z } from "zod";

export const createSubscriptionSchema = z.object({
  member_id: z.string().uuid("Invalid member ID"),
  plan_id: z.string().uuid("Invalid plan ID"),
  start_date: z.string().datetime().optional(),
  initial_payment_amount: z
    .number()
    .min(0, "Payment amount must be positive")
    .optional(),
  payment_method: z
    .enum(["cash", "card", "bank_transfer", "online", "check"])
    .optional(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

export const recordPaymentSchema = z.object({
  subscription_id: z.string().uuid("Invalid subscription ID"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  payment_method: z.enum(["cash", "card", "bank_transfer", "online", "check"]),
  payment_date: z.string().datetime().optional(),
  reference_number: z.string().max(100).optional(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

export const upgradeSubscriptionSchema = z.object({
  current_subscription_id: z.string().uuid("Invalid subscription ID"),
  new_plan_id: z.string().uuid("Invalid plan ID"),
  credit_amount: z.number().min(0, "Credit amount must be positive"),
  effective_date: z.string().datetime().optional(),
});

export const pauseSubscriptionSchema = z.object({
  subscription_id: z.string().uuid("Invalid subscription ID"),
  reason: z
    .string()
    .max(200, "Reason must be less than 200 characters")
    .optional(),
});

export type CreateSubscriptionData = z.infer<typeof createSubscriptionSchema>;
export type RecordPaymentData = z.infer<typeof recordPaymentSchema>;
export type UpgradeSubscriptionData = z.infer<typeof upgradeSubscriptionSchema>;
export type PauseSubscriptionData = z.infer<typeof pauseSubscriptionSchema>;
