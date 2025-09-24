"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

import type { SubscriptionPlanWithSessions } from "@/features/database/lib/types";
import {
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
} from "@/features/memberships/hooks/use-subscriptions";

interface PlanEditDialogProps {
  plan: SubscriptionPlanWithSessions | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  signup_fee: number;
  duration_months: number;
  sessions_count: number;
  is_active: boolean;
}

export function PlanEditDialog({
  plan,
  open,
  onOpenChange,
}: PlanEditDialogProps) {
  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    description: "",
    price: 0,
    signup_fee: 0,
    duration_months: 1,
    sessions_count: 0,
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateSubscriptionPlan();
  const updateMutation = useUpdateSubscriptionPlan();

  const isEditing = !!plan?.id;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (plan?.id) {
      setFormData({
        name: plan.name || "",
        description: plan.description || "",
        price: plan.price || 0,
        signup_fee: plan.signup_fee || 0,
        duration_months: plan.duration_months || 1,
        sessions_count: plan.sessions_count || 0,
        is_active: plan.is_active,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        signup_fee: 0,
        duration_months: 1,
        sessions_count: 0,
        is_active: true,
      });
    }
    setErrors({});
  }, [plan, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Plan name is required";
    }

    if (formData.duration_months < 1) {
      newErrors.duration_months = "Duration must be at least 1 month";
    }

    if (formData.price < 0) {
      newErrors.price = "Price cannot be negative";
    }

    if (formData.signup_fee < 0) {
      newErrors.signup_fee = "Signup fee cannot be negative";
    }

    if (formData.sessions_count < 0) {
      newErrors.sessions_count = "Number of sessions cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: plan!.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save plan:", error);
    }
  };

  const handleInputChange = (
    field: keyof PlanFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Plan" : "Create New Plan"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter plan name"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter plan description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price === 0 ? "" : formData.price}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    handleInputChange("price", 0);
                  } else {
                    const parsed = parseFloat(value);
                    handleInputChange("price", isNaN(parsed) ? 0 : parsed);
                  }
                }}
              />
              {errors.price && (
                <p className="text-sm text-red-600">{errors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup_fee">Signup Fee ($)</Label>
              <Input
                id="signup_fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.signup_fee === 0 ? "" : formData.signup_fee}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    handleInputChange("signup_fee", 0);
                  } else {
                    const parsed = parseFloat(value);
                    handleInputChange("signup_fee", isNaN(parsed) ? 0 : parsed);
                  }
                }}
              />
              {errors.signup_fee && (
                <p className="text-sm text-red-600">{errors.signup_fee}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_months">Duration (months)</Label>
              <Input
                id="duration_months"
                type="number"
                min="1"
                value={formData.duration_months}
                onChange={(e) =>
                  handleInputChange(
                    "duration_months",
                    parseInt(e.target.value) || 1
                  )
                }
              />
              {errors.duration_months && (
                <p className="text-sm text-red-600">{errors.duration_months}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessions_count">Number of Sessions</Label>
              <Input
                id="sessions_count"
                type="number"
                min="0"
                value={
                  formData.sessions_count === 0 ? "" : formData.sessions_count
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    handleInputChange("sessions_count", 0);
                  } else {
                    const parsed = parseInt(value);
                    handleInputChange(
                      "sessions_count",
                      isNaN(parsed) ? 0 : parsed
                    );
                  }
                }}
                placeholder="0 for unlimited"
              />
              {errors.sessions_count && (
                <p className="text-sm text-red-600">{errors.sessions_count}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                handleInputChange("is_active", checked)
              }
            />
            <Label htmlFor="is_active">Active Plan</Label>
          </div>

          {(createMutation.error || updateMutation.error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {createMutation.error?.message ||
                  updateMutation.error?.message ||
                  "Failed to save plan"}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : isEditing
                  ? "Update Plan"
                  : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
