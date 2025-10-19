/**
 * Auto-Inactivation Section Component
 * UI for managing automatic member inactivation in Studio Settings
 */

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PreviewInactivationDialog } from "./PreviewInactivationDialog";
import {
  useRunAutoInactivation,
  useLastAutoInactivationRun,
} from "../hooks/use-auto-inactivation";

/**
 * Section for automatic member inactivation settings and actions
 * Displays info and buttons to preview/run auto-inactivation
 */
export function AutoInactivationSection() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const runInactivation = useRunAutoInactivation();
  const { data: lastRun, isLoading } = useLastAutoInactivationRun();

  const formatLastRun = () => {
    if (isLoading) return "Loading...";
    if (!lastRun) return "Never";
    return format(new Date(lastRun.run_at), "PPp"); // e.g., "Oct 19, 2025, 1:10:31 PM"
  };

  const formatLastRunResult = () => {
    if (isLoading) return "-";
    if (!lastRun) return "-";
    if (lastRun.inactivated_count === 0) return "No members inactivated";
    return `${lastRun.inactivated_count} member${lastRun.inactivated_count !== 1 ? "s" : ""} inactivated`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatic Member Inactivation</CardTitle>
        <CardDescription>
          Automatically mark members as inactive if they haven&apos;t attended
          sessions for the configured period.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <div className="space-y-1">
              <p>
                <strong>Last Run:</strong> {formatLastRun()}
              </p>
              <p>
                <strong>Last Run Result:</strong> {formatLastRunResult()}
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            Preview Affected Members
          </Button>
          <Button onClick={() => setPreviewOpen(true)}>
            Run Auto-Inactivation
          </Button>
        </div>

        <PreviewInactivationDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          onConfirm={async () => {
            await runInactivation.mutateAsync();
            setPreviewOpen(false);
          }}
        />
      </CardContent>
    </Card>
  );
}
