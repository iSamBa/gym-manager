/**
 * Planning Tab
 * Tab content for planning parameters configuration with edit/display modes
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hourglass, Scale, Coins, Edit, Save, X } from "lucide-react";
import { usePlanningSettings } from "../hooks/use-planning-settings";
import { PlanningParameterDisplay } from "./PlanningParameterDisplay";
import { PlanningParameterEdit } from "./PlanningParameterEdit";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { PlanningSettings } from "../lib/types";
import { AutoInactivationSection } from "@/features/members/components/AutoInactivationSection";

export function PlanningTab() {
  const { settings, isLoading, updateSettings, isUpdating, error } =
    usePlanningSettings();

  const [isEditing, setIsEditing] = useState(false);
  const [editedSettings, setEditedSettings] = useState<PlanningSettings | null>(
    null
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Use edited settings if available, otherwise use current settings
  const currentSettings = useMemo(() => {
    return editedSettings || settings;
  }, [editedSettings, settings]);

  // Validation rules
  const validateField = useCallback(
    (field: string, value: number): string | null => {
      const rules: Record<string, { min: number; max: number; label: string }> =
        {
          subscription_warning_days: {
            min: 1,
            max: 999,
            label: "Subscription warning",
          },
          body_checkup_sessions: {
            min: 1,
            max: 999,
            label: "Body checkup sessions",
          },
          payment_reminder_days: {
            min: 1,
            max: 999,
            label: "Payment reminder",
          },
          max_sessions_per_week: {
            min: 1,
            max: 9999,
            label: "Max sessions per week",
          },
          inactivity_months: { min: 1, max: 99, label: "Inactivity months" },
        };

      const rule = rules[field];
      if (!rule) return null;

      if (value < rule.min || value > rule.max) {
        return `Must be between ${rule.min} and ${rule.max}`;
      }

      return null;
    },
    []
  );

  const handleEdit = useCallback(() => {
    if (settings) {
      setEditedSettings({ ...settings });
      setValidationErrors({});
      setIsEditing(true);
    }
  }, [settings]);

  const handleCancel = useCallback(() => {
    setEditedSettings(null);
    setValidationErrors({});
    setIsEditing(false);
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof PlanningSettings, value: number) => {
      if (!editedSettings) return;

      setEditedSettings({
        ...editedSettings,
        [field]: value,
      });

      // Validate
      const error = validateField(field, value);
      setValidationErrors((prev) => {
        if (error) {
          return { ...prev, [field]: error };
        } else {
          // Remove error for this field
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        }
      });
    },
    [editedSettings, validateField]
  );

  const handleSave = useCallback(async () => {
    if (!editedSettings) return;

    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    await updateSettings({
      subscription_warning_days: editedSettings.subscription_warning_days,
      body_checkup_sessions: editedSettings.body_checkup_sessions,
      payment_reminder_days: editedSettings.payment_reminder_days,
      max_sessions_per_week: editedSettings.max_sessions_per_week,
      inactivity_months: editedSettings.inactivity_months,
    });

    setIsEditing(false);
    setEditedSettings(null);
  }, [editedSettings, validationErrors, updateSettings]);

  if (error) {
    return (
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Planning Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load planning settings. Please refresh the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !currentSettings) {
    return (
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Planning Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Planning Parameters</CardTitle>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {isEditing ? (
              <>
                {/* Edit Mode */}
                <PlanningParameterEdit
                  icon={Hourglass}
                  iconColor="text-red-500"
                  label="Subscription Expiration Warning"
                  description="Show warning this many days before subscription ends"
                  value={currentSettings.subscription_warning_days}
                  unit="days"
                  min={1}
                  max={999}
                  onChange={(value) =>
                    handleFieldChange("subscription_warning_days", value)
                  }
                  error={validationErrors.subscription_warning_days}
                />

                <PlanningParameterEdit
                  icon={Scale}
                  iconColor="text-yellow-500"
                  label="Body Checkup Reminder"
                  description="Sessions after last checkup to show reminder"
                  value={currentSettings.body_checkup_sessions}
                  unit="sessions"
                  min={1}
                  max={999}
                  onChange={(value) =>
                    handleFieldChange("body_checkup_sessions", value)
                  }
                  error={validationErrors.body_checkup_sessions}
                />

                <PlanningParameterEdit
                  icon={Coins}
                  iconColor="text-green-500"
                  label="Payment Reminder"
                  description="Days after last payment to show reminder"
                  value={currentSettings.payment_reminder_days}
                  unit="days"
                  min={1}
                  max={999}
                  onChange={(value) =>
                    handleFieldChange("payment_reminder_days", value)
                  }
                  error={validationErrors.payment_reminder_days}
                />

                <PlanningParameterEdit
                  label="Maximum Sessions Per Week"
                  description="Studio-wide booking limit per week"
                  value={currentSettings.max_sessions_per_week}
                  unit="sessions"
                  min={1}
                  max={9999}
                  onChange={(value) =>
                    handleFieldChange("max_sessions_per_week", value)
                  }
                  error={validationErrors.max_sessions_per_week}
                />

                <PlanningParameterEdit
                  label="Auto-Inactivation Threshold"
                  description="Months without attendance before auto-inactivation"
                  value={currentSettings.inactivity_months}
                  unit="months"
                  min={1}
                  max={99}
                  onChange={(value) =>
                    handleFieldChange("inactivity_months", value)
                  }
                  error={validationErrors.inactivity_months}
                />
              </>
            ) : (
              <>
                {/* Display Mode */}
                <PlanningParameterDisplay
                  icon={Hourglass}
                  iconColor="text-red-500"
                  label="Subscription Expiration Warning"
                  description="Show warning this many days before subscription ends"
                  value={currentSettings.subscription_warning_days}
                  unit="days"
                />

                <PlanningParameterDisplay
                  icon={Scale}
                  iconColor="text-yellow-500"
                  label="Body Checkup Reminder"
                  description="Sessions after last checkup to show reminder"
                  value={currentSettings.body_checkup_sessions}
                  unit="sessions"
                />

                <PlanningParameterDisplay
                  icon={Coins}
                  iconColor="text-green-500"
                  label="Payment Reminder"
                  description="Days after last payment to show reminder"
                  value={currentSettings.payment_reminder_days}
                  unit="days"
                />

                <PlanningParameterDisplay
                  label="Maximum Sessions Per Week"
                  description="Studio-wide booking limit per week"
                  value={currentSettings.max_sessions_per_week}
                  unit="sessions"
                />

                <PlanningParameterDisplay
                  label="Auto-Inactivation Threshold"
                  description="Months without attendance before auto-inactivation"
                  value={currentSettings.inactivity_months}
                  unit="months"
                />
              </>
            )}
          </div>
        </CardContent>

        {/* Footer with Save/Cancel buttons in edit mode */}
        {isEditing && (
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating || Object.keys(validationErrors).length > 0}
            >
              <Save className="mr-2 h-4 w-4" />
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Auto-Inactivation Section */}
      <AutoInactivationSection />
    </div>
  );
}
