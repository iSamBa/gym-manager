"use client";

import { memo, useState, useCallback, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useStudioSettings } from "../hooks/use-studio-settings";
import { useConflictDetection } from "../hooks/use-conflict-detection";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Save, Edit } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WeeklyOpeningHoursGrid } from "./WeeklyOpeningHoursGrid";
import { EffectiveDatePicker } from "./EffectiveDatePicker";
import { EffectiveDatePreview } from "./EffectiveDatePreview";
import { OpeningHoursDisplay } from "./OpeningHoursDisplay";
import { SaveConfirmationDialog } from "./SaveConfirmationDialog";
import { ConflictDetectionDialog } from "./ConflictDetectionDialog";
import { hasValidationErrors, validateOpeningHours } from "../lib/validation";
import { toast } from "sonner";
import type { OpeningHoursWeek } from "../lib/types";
import { getLocalDateString, getStartOfDay } from "@/lib/date-utils";

function OpeningHoursTabComponent() {
  const {
    data: activeSettings,
    scheduledData: scheduledSettings,
    isLoading,
    error,
    updateSettings,
    isUpdating,
  } = useStudioSettings("opening_hours");

  // Local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedHours, setEditedHours] = useState<OpeningHoursWeek | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<Date>(() => {
    const tomorrow = getStartOfDay(new Date());
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Use edited hours if available, otherwise use active settings data
  const currentHours = useMemo(() => {
    if (editedHours) return editedHours;
    if (activeSettings?.setting_value)
      return activeSettings.setting_value as OpeningHoursWeek;
    return null;
  }, [editedHours, activeSettings]);

  // Check for validation errors
  const validationErrors = useMemo(() => {
    if (!currentHours) return {};
    return validateOpeningHours(currentHours);
  }, [currentHours]);

  const hasErrors = useMemo(() => {
    return hasValidationErrors(validationErrors);
  }, [validationErrors]);

  // Conflict detection hook (manual trigger)
  const {
    data: conflicts,
    refetch: checkConflicts,
    isFetching: isFetchingConflicts,
  } = useConflictDetection(
    editedHours || currentHours || ({} as OpeningHoursWeek),
    effectiveDate,
    false // Disabled by default, trigger manually
  );

  // Handle changes to opening hours
  const handleChange = useCallback((newHours: OpeningHoursWeek) => {
    setEditedHours(newHours);
  }, []);

  // Handle save button click - trigger conflict detection
  const handleSaveClick = useCallback(async () => {
    if (!editedHours) return;

    setIsCheckingConflicts(true);
    try {
      await checkConflicts();
    } catch (err) {
      console.error("Failed to check conflicts:", err);
      toast.error("Failed to check for conflicts. Please try again.");
      setIsCheckingConflicts(false);
    }
  }, [editedHours, checkConflicts]);

  // Handle conflict detection results
  useEffect(() => {
    if (!isCheckingConflicts) return;
    if (isFetchingConflicts) return;

    setIsCheckingConflicts(false);

    if (conflicts !== undefined) {
      if (conflicts.length === 0) {
        // No conflicts - show confirmation dialog
        setShowConfirmDialog(true);
      } else {
        // Conflicts found - show conflict dialog
        setShowConflictDialog(true);
      }
    }
  }, [conflicts, isFetchingConflicts, isCheckingConflicts]);

  // Handle actual save (after conflict check passed and user confirmed)
  const handleSave = useCallback(async () => {
    if (!editedHours) return;

    try {
      await updateSettings({
        value: editedHours,
        effectiveFrom: effectiveDate,
      });

      toast.success("Opening hours updated successfully");
      setEditedHours(null); // Clear edited state
      setIsEditing(false); // Exit edit mode
      setShowConfirmDialog(false);
    } catch (err) {
      console.error("Failed to save opening hours:", err);
      toast.error("Failed to save opening hours. Please try again.");
    }
  }, [editedHours, effectiveDate, updateSettings]);

  // Handle cancel - revert changes and exit edit mode
  const handleCancel = useCallback(() => {
    setEditedHours(null);
    setIsEditing(false);
  }, []);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return editedHours !== null;
  }, [editedHours]);

  // Determine if preview should be shown
  // Show preview only when scheduled settings exist (not when editing)
  const shouldShowPreview = useMemo(() => {
    if (!scheduledSettings) return false;
    if (!scheduledSettings.effective_from) return false;

    // Use local date strings for consistent comparison (avoids timezone issues)
    const todayStr = getLocalDateString(new Date());
    const effectiveFromStr =
      typeof scheduledSettings.effective_from === "string"
        ? scheduledSettings.effective_from
        : getLocalDateString(new Date(scheduledSettings.effective_from));

    // Show only if scheduled for future date
    return effectiveFromStr > todayStr;
  }, [scheduledSettings]);

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Studio Opening Hours Editor */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Current Opening Hours</CardTitle>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <>
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
              </>
            ) : (
              /* Display Mode */
              <OpeningHoursDisplay openingHours={currentHours} />
            )}
          </CardContent>
          {isEditing && (
            <CardFooter className="flex justify-between">
              <div className="text-muted-foreground text-sm">
                {hasUnsavedChanges && "You have unsaved changes"}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveClick}
                  disabled={
                    !hasUnsavedChanges ||
                    hasErrors ||
                    isUpdating ||
                    isCheckingConflicts
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isCheckingConflicts
                    ? "Checking conflicts..."
                    : isUpdating
                      ? "Saving..."
                      : "Save Changes"}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Scheduled Changes Preview - Only show when scheduled settings exist */}
        {shouldShowPreview && scheduledSettings && (
          <EffectiveDatePreview
            openingHours={scheduledSettings.setting_value as OpeningHoursWeek}
            effectiveDate={new Date(scheduledSettings.effective_from as string)}
            isScheduled={true}
          />
        )}
      </div>

      {/* Conflict Detection Dialog */}
      {conflicts && conflicts.length > 0 && (
        <ConflictDetectionDialog
          open={showConflictDialog}
          onOpenChange={setShowConflictDialog}
          conflicts={conflicts}
        />
      )}

      {/* Confirmation Dialog (shown only when no conflicts) */}
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
