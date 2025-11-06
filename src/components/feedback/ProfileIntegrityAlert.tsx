"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import type { ProfileIntegrityIssue } from "@/lib/profile-integrity-check";

export interface ProfileIntegrityAlertProps {
  issues: ProfileIntegrityIssue[];
  onDismiss?: () => void;
  onViewDetails?: () => void;
}

/**
 * ProfileIntegrityAlert - Shows critical alerts to admins when profile data integrity issues are detected
 *
 * Features:
 * - Only shown to admin users
 * - Displays critical profile mismatches
 * - Provides actionable guidance
 * - Dismissable but persists until fixed
 */
export function ProfileIntegrityAlert({
  issues,
  onDismiss,
  onViewDetails,
}: ProfileIntegrityAlertProps) {
  if (!issues || issues.length === 0) {
    return null;
  }

  const criticalIssues = issues.filter(
    (issue) => issue.severity === "critical"
  );
  const hasCritical = criticalIssues.length > 0;

  return (
    <Alert
      variant={hasCritical ? "destructive" : "default"}
      className="relative mb-4"
    >
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="mb-2">
        {hasCritical
          ? "Critical Profile Data Issue Detected"
          : "Profile Data Warning"}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-sm">
          {hasCritical
            ? `${criticalIssues.length} critical ${criticalIssues.length === 1 ? "issue" : "issues"} detected with user profile data.`
            : `${issues.length} ${issues.length === 1 ? "warning" : "warnings"} detected with user profile data.`}
        </p>

        <div className="space-y-1">
          {issues.slice(0, 3).map((issue, index) => (
            <div
              key={index}
              className="rounded border border-current/20 bg-current/5 p-2 text-xs"
            >
              <p className="font-semibold">{issue.message}</p>
              <p className="text-current/80">Action: {issue.suggestedAction}</p>
            </div>
          ))}
          {issues.length > 3 && (
            <p className="text-xs italic">
              ... and {issues.length - 3} more{" "}
              {issues.length - 3 === 1 ? "issue" : "issues"}
            </p>
          )}
        </div>

        {onViewDetails && (
          <Button
            variant={hasCritical ? "secondary" : "outline"}
            size="sm"
            onClick={onViewDetails}
            className="mt-2"
          >
            View All Details
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default ProfileIntegrityAlert;
