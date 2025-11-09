# US-004: Transaction Handling & Data Integrity

**Status**: ⏳ Not Started
**Priority**: P0 (Must Have - Critical)
**Estimated Effort**: 6-8 hours
**Sprint**: Week 2 - Database Optimization

---

## 📖 User Story

**As a** system administrator and business owner
**I want** atomic database transactions for multi-step operations
**So that** we prevent data corruption and ensure financial integrity

---

## 💼 Business Value

### Why This Matters

1. **Data Integrity**: Prevents orphaned records and inconsistent state
2. **Financial Accuracy**: Ensures payments match subscriptions
3. **Reliability**: Operations complete fully or not at all
4. **Compliance**: Maintains audit trail accuracy
5. **Trust**: Customers can rely on data consistency

### Cost of NOT Doing This

- **Data Corruption**: Subscription created but payment fails → orphaned data
- **Financial Loss**: Payment recorded but subscription not created
- **Support Burden**: Manual data cleanup for failed operations
- **Lost Trust**: Customers see inconsistent billing/access

### Risk Scenarios Without Transactions

| Operation                    | Risk                               | Impact                           |
| ---------------------------- | ---------------------------------- | -------------------------------- |
| Subscription + Payment       | Payment fails, subscription exists | Member has access without paying |
| Refund + Subscription Cancel | Refund succeeds, cancel fails      | Customer charged again           |
| Credit Adjustment            | Credit added, log fails            | No audit trail                   |

---

## ✅ Acceptance Criteria

### 1. RPC Functions Created

- [ ] `create_subscription_with_payment` RPC function deployed
- [ ] `process_refund_with_transaction` RPC function deployed
- [ ] `adjust_member_credits` RPC function deployed
- [ ] All RPC functions tested in Supabase

### 2. Transaction Implementation

- [ ] Subscription creation uses transaction RPC
- [ ] Refund processing uses transaction RPC
- [ ] Credit adjustments use transaction RPC
- [ ] Rollback handling implemented for all operations

### 3. Error Handling

- [ ] Clear error messages for transaction failures
- [ ] Proper rollback on any step failure
- [ ] Failed transactions logged for debugging
- [ ] User notified of transaction status

### 4. Testing

- [ ] Integration tests for successful transactions
- [ ] Integration tests for failed transactions (rollback)
- [ ] Edge cases tested (network failure, timeout)
- [ ] Manual testing with real database

---

## 🔧 Technical Implementation

### Step 1: Create RPC Functions in Supabase

**Function 1: Subscription with Payment**

```sql
CREATE OR REPLACE FUNCTION create_subscription_with_payment(
  p_member_id UUID,
  p_plan_id UUID,
  p_payment_amount DECIMAL,
  p_payment_method VARCHAR,
  p_payment_date DATE DEFAULT CURRENT_DATE
)
RETURNS json AS $$
DECLARE
  v_subscription_id UUID;
  v_payment_id UUID;
  v_plan_sessions INT;
  v_result json;
BEGIN
  -- Get plan session count
  SELECT session_count INTO v_plan_sessions
  FROM subscription_plans
  WHERE id = p_plan_id;

  IF v_plan_sessions IS NULL THEN
    RAISE EXCEPTION 'Invalid plan ID: %', p_plan_id;
  END IF;

  -- Insert subscription
  INSERT INTO member_subscriptions (
    member_id,
    plan_id,
    status,
    start_date,
    remaining_sessions
  )
  VALUES (
    p_member_id,
    p_plan_id,
    'active',
    p_payment_date,
    v_plan_sessions
  )
  RETURNING id INTO v_subscription_id;

  -- Insert payment
  INSERT INTO subscription_payments (
    member_id,
    subscription_id,
    amount,
    payment_method,
    payment_date,
    payment_status
  )
  VALUES (
    p_member_id,
    v_subscription_id,
    p_payment_amount,
    p_payment_method,
    p_payment_date,
    'completed'
  )
  RETURNING id INTO v_payment_id;

  -- Update member status if needed
  UPDATE members
  SET
    status = 'active',
    member_type = CASE
      WHEN member_type = 'trial' THEN 'full'
      ELSE member_type
    END,
    updated_at = NOW()
  WHERE id = p_member_id;

  -- Build success response
  SELECT json_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'payment_id', v_payment_id,
    'message', 'Subscription created successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Function 2: Refund with Subscription Update**

```sql
CREATE OR REPLACE FUNCTION process_refund_with_transaction(
  p_payment_id UUID,
  p_refund_amount DECIMAL,
  p_refund_reason TEXT
)
RETURNS json AS $$
DECLARE
  v_payment RECORD;
  v_result json;
BEGIN
  -- Get payment details
  SELECT * INTO v_payment
  FROM subscription_payments
  WHERE id = p_payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found: %', p_payment_id;
  END IF;

  IF v_payment.payment_status != 'completed' THEN
    RAISE EXCEPTION 'Cannot refund payment with status: %', v_payment.payment_status;
  END IF;

  IF p_refund_amount > v_payment.amount THEN
    RAISE EXCEPTION 'Refund amount exceeds payment amount';
  END IF;

  -- Update payment status
  UPDATE subscription_payments
  SET
    payment_status = 'refunded',
    refund_amount = p_refund_amount,
    refund_date = CURRENT_DATE,
    refund_reason = p_refund_reason,
    updated_at = NOW()
  WHERE id = p_payment_id;

  -- Cancel associated subscription
  UPDATE member_subscriptions
  SET
    status = 'cancelled',
    cancellation_date = CURRENT_DATE,
    cancellation_reason = p_refund_reason,
    updated_at = NOW()
  WHERE id = v_payment.subscription_id;

  -- Log the refund for audit trail
  INSERT INTO payment_audit_log (
    payment_id,
    action,
    amount,
    reason,
    created_at
  )
  VALUES (
    p_payment_id,
    'refund',
    p_refund_amount,
    p_refund_reason,
    NOW()
  );

  SELECT json_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'refund_amount', p_refund_amount,
    'message', 'Refund processed successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Refund transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Function 3: Credit Adjustment**

```sql
CREATE OR REPLACE FUNCTION adjust_member_credits(
  p_member_id UUID,
  p_subscription_id UUID,
  p_credit_adjustment INT,
  p_reason TEXT
)
RETURNS json AS $$
DECLARE
  v_new_balance INT;
  v_result json;
BEGIN
  -- Update subscription credits
  UPDATE member_subscriptions
  SET
    remaining_sessions = remaining_sessions + p_credit_adjustment,
    updated_at = NOW()
  WHERE id = p_subscription_id
    AND member_id = p_member_id
  RETURNING remaining_sessions INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found or member mismatch';
  END IF;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Credit adjustment would result in negative balance';
  END IF;

  -- Log the adjustment
  INSERT INTO credit_adjustment_log (
    member_id,
    subscription_id,
    adjustment,
    new_balance,
    reason,
    created_at
  )
  VALUES (
    p_member_id,
    p_subscription_id,
    p_credit_adjustment,
    v_new_balance,
    p_reason,
    NOW()
  );

  SELECT json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'adjustment', p_credit_adjustment,
    'message', 'Credits adjusted successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Credit adjustment failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 2: Create TypeScript Wrappers

**Create** `src/features/memberships/lib/transaction-utils.ts`:

```typescript
import { createClient } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export interface CreateSubscriptionParams {
  member_id: string;
  plan_id: string;
  payment_amount: number;
  payment_method: string;
  payment_date?: string;
}

export interface ProcessRefundParams {
  payment_id: string;
  refund_amount: number;
  refund_reason: string;
}

export interface AdjustCreditsParams {
  member_id: string;
  subscription_id: string;
  credit_adjustment: number;
  reason: string;
}

/**
 * Creates subscription and payment in a single atomic transaction
 */
export async function createSubscriptionWithPayment(
  params: CreateSubscriptionParams
) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc(
      "create_subscription_with_payment",
      {
        p_member_id: params.member_id,
        p_plan_id: params.plan_id,
        p_payment_amount: params.payment_amount,
        p_payment_method: params.payment_method,
        p_payment_date:
          params.payment_date || new Date().toISOString().split("T")[0],
      }
    );

    if (error) {
      logger.error("Failed to create subscription with payment", {
        error,
        params,
      });
      throw new Error(`Transaction failed: ${error.message}`);
    }

    logger.info("Subscription created with payment", { result: data });
    return data;
  } catch (error) {
    logger.error("Exception in createSubscriptionWithPayment", {
      error,
      params,
    });
    throw error;
  }
}

/**
 * Processes refund and updates subscription in a single atomic transaction
 */
export async function processRefundWithTransaction(
  params: ProcessRefundParams
) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc(
      "process_refund_with_transaction",
      {
        p_payment_id: params.payment_id,
        p_refund_amount: params.refund_amount,
        p_refund_reason: params.refund_reason,
      }
    );

    if (error) {
      logger.error("Failed to process refund", { error, params });
      throw new Error(`Refund failed: ${error.message}`);
    }

    logger.info("Refund processed successfully", { result: data });
    return data;
  } catch (error) {
    logger.error("Exception in processRefundWithTransaction", {
      error,
      params,
    });
    throw error;
  }
}

/**
 * Adjusts member credits with audit log in a single atomic transaction
 */
export async function adjustMemberCredits(params: AdjustCreditsParams) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("adjust_member_credits", {
      p_member_id: params.member_id,
      p_subscription_id: params.subscription_id,
      p_credit_adjustment: params.credit_adjustment,
      p_reason: params.reason,
    });

    if (error) {
      logger.error("Failed to adjust credits", { error, params });
      throw new Error(`Credit adjustment failed: ${error.message}`);
    }

    logger.info("Credits adjusted successfully", { result: data });
    return data;
  } catch (error) {
    logger.error("Exception in adjustMemberCredits", { error, params });
    throw error;
  }
}
```

### Step 3: Update Hook to Use Transactions

**Update** `src/features/memberships/hooks/use-subscriptions.ts`:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSubscriptionWithPayment } from "../lib/transaction-utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubscriptionWithPayment,
    onSuccess: (data) => {
      toast.success("Subscription created successfully!");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (error: Error) => {
      logger.error("Subscription creation failed", { error });
      toast.error(`Failed to create subscription: ${error.message}`);
    },
  });
}
```

---

## 🧪 Testing Requirements

**Create** `src/features/memberships/lib/__tests__/transaction-utils.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSubscriptionWithPayment,
  processRefundWithTransaction,
} from "../transaction-utils";

describe("Transaction Utils", () => {
  describe("createSubscriptionWithPayment", () => {
    it("should create subscription and payment atomically", async () => {
      const result = await createSubscriptionWithPayment({
        member_id: "test-member-id",
        plan_id: "test-plan-id",
        payment_amount: 100,
        payment_method: "credit_card",
      });

      expect(result.success).toBe(true);
      expect(result.subscription_id).toBeDefined();
      expect(result.payment_id).toBeDefined();
    });

    it("should rollback on payment failure", async () => {
      // Test rollback scenario
      // Verify subscription not created if payment fails
    });
  });
});
```

---

## 🎯 Definition of Done

- [ ] All RPC functions deployed to Supabase
- [ ] TypeScript wrappers created and tested
- [ ] Hooks updated to use transactions
- [ ] Integration tests passing
- [ ] Manual testing complete
- [ ] STATUS.md updated

---

**Created**: 2025-11-09
**Estimated Time**: 6-8 hours
