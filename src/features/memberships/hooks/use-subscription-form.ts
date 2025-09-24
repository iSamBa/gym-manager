import { useState, useMemo } from "react";
import { useSubscriptionPlans } from "./use-subscriptions";
import type {
  CreateSubscriptionInput,
  PaymentMethod,
} from "@/features/database/lib/types";

export interface SubscriptionFormData {
  planId: string;
  startDate: Date;
  initialPayment: number;
  paymentMethod: PaymentMethod;
  notes: string;
}

export function useSubscriptionForm(memberId: string) {
  const [formData, setFormData] = useState<SubscriptionFormData>({
    planId: "",
    startDate: new Date(),
    initialPayment: 0,
    paymentMethod: "cash",
    notes: "",
  });

  const { data: plans, isLoading } = useSubscriptionPlans();

  const selectedPlan = useMemo(
    () => plans?.find((p) => p.id === formData.planId),
    [plans, formData.planId]
  );

  const sessionInfo = useMemo(() => {
    if (!selectedPlan) return null;

    return {
      totalSessions: selectedPlan.sessions_count,
      pricePerSession: selectedPlan.price / selectedPlan.sessions_count,
      duration: 30, // Default duration since billing cycle is removed
    };
  }, [selectedPlan]);

  const balanceInfo = useMemo(() => {
    if (!selectedPlan) return null;

    const remainingBalance = selectedPlan.price - formData.initialPayment;
    const isFullyPaid = remainingBalance <= 0;

    return {
      totalPrice: selectedPlan.price,
      initialPayment: formData.initialPayment,
      remainingBalance: Math.max(0, remainingBalance),
      isFullyPaid,
    };
  }, [selectedPlan, formData.initialPayment]);

  const validation = useMemo(() => {
    const errors: string[] = [];

    if (!formData.planId) {
      errors.push("Please select a subscription plan");
    }

    if (formData.initialPayment < 0) {
      errors.push("Initial payment cannot be negative");
    }

    if (selectedPlan && formData.initialPayment > selectedPlan.price) {
      errors.push("Initial payment cannot exceed plan price");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [formData, selectedPlan]);

  const updateFormData = (updates: Partial<SubscriptionFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const buildCreateInput = (): CreateSubscriptionInput => ({
    member_id: memberId,
    plan_id: formData.planId,
    start_date: formData.startDate.toISOString(),
    initial_payment_amount: formData.initialPayment,
    payment_method: formData.paymentMethod,
    notes: formData.notes || undefined,
  });

  const resetForm = () => {
    setFormData({
      planId: "",
      startDate: new Date(),
      initialPayment: 0,
      paymentMethod: "cash",
      notes: "",
    });
  };

  return {
    formData,
    updateFormData,
    selectedPlan,
    sessionInfo,
    balanceInfo,
    validation,
    buildCreateInput,
    resetForm,
    isLoadingPlans: isLoading,
  };
}
