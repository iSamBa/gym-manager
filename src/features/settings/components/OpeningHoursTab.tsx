"use client";

import { memo, useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useStudioSettings } from "../hooks/use-studio-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WeeklyOpeningHoursGrid } from "./WeeklyOpeningHoursGrid";
import { EffectiveDatePicker } from "./EffectiveDatePicker";
import { EffectiveDatePreview } from "./EffectiveDatePreview";
import { SaveConfirmationDialog } from "./SaveConfirmationDialog";
import { hasValidationErrors, validateOpeningHours } from "../lib/validation";
import { toast } from "sonner";
import type { OpeningHoursWeek } from "../lib/types";

function OpeningHoursTabComponent() {
  const {
    data: settings,
    isLoading,
    error,
    updateSettings,
    isUpdating,
  } = useStudioSettings("opening_hours");

  // Local state for editing
  const [editedHours, setEditedHours] = useState<OpeningHoursWeek | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Use edited hours if available, otherwise use settings data
  const currentHours = useMemo(() => {
    if (editedHours) return editedHours;
    if (settings?.setting_value)
      return settings.setting_value as OpeningHoursWeek;
    return null;
  }, [editedHours, settings]);

  // Check for validation errors
  const validationErrors = useMemo(() => {
    if (!currentHours) return {};
    return validateOpeningHours(currentHours);
  }, [currentHours]);

  const hasErrors = useMemo(() => {
    return hasValidationErrors(validationErrors);
  }, [validationErrors]);

  // Handle changes to opening hours
  const handleChange = useCallback((newHours: OpeningHoursWeek) => {
    setEditedHours(newHours);
  }, []);

  // Handle save confirmation
  const handleSave = useCallback(async () => {
    if (!editedHours) return;

    try {
      await updateSettings({
        value: editedHours,
        effectiveFrom: effectiveDate,
      });

      toast.success("Opening hours updated successfully");
      setEditedHours(null); // Clear edited state
      setShowConfirmDialog(false);
    } catch (err) {
      console.error("Failed to save opening hours:", err);
      toast.error("Failed to save opening hours. Please try again.");
    }
  }, [editedHours, effectiveDate, updateSettings]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return editedHours !== null;
  }, [editedHours]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load opening hours settings. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentHours) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No opening hours configuration found. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Studio Opening Hours</CardTitle>
          <CardDescription>
            Set the days and times when your studio is open for training
            sessions. Changes will affect available booking slots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weekly Grid */}
          <WeeklyOpeningHoursGrid
            value={currentHours}
            onChange={handleChange}
            disabled={isUpdating}
          />

          <Separator />

          {/* Effective Date Picker */}
          <EffectiveDatePicker
            value={effectiveDate}
            onChange={setEffectiveDate}
            disabled={isUpdating}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-muted-foreground text-sm">
            {hasUnsavedChanges && "You have unsaved changes"}
          </div>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={!hasUnsavedChanges || hasErrors || isUpdating}
          >
            <Save className="mr-2 h-4 w-4" />
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      {/* Preview Section */}
      <EffectiveDatePreview
        openingHours={currentHours}
        effectiveDate={effectiveDate}
      />

      {/* Confirmation Dialog */}
      <SaveConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        openingHours={currentHours}
        effectiveDate={effectiveDate}
        onConfirm={handleSave}
        isLoading={isUpdating}
      />
    </div>
  );
}

// Use React.memo for performance optimization
export const OpeningHoursTab = memo(OpeningHoursTabComponent);
OpeningHoursTab.displayName = "OpeningHoursTab";
