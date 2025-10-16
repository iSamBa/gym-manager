"use client";

import { memo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStudioSettings } from "../hooks/use-studio-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function OpeningHoursTabComponent() {
  const {
    data: settings,
    isLoading,
    error,
  } = useStudioSettings("opening_hours");

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Studio Opening Hours</CardTitle>
        <CardDescription>
          Set the days and times when your studio is open for training sessions.
          Changes will affect available booking slots.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Placeholder for WeeklyOpeningHoursGrid (US-003) */}
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            Opening hours editor will appear here (US-003)
          </p>
          {settings && (
            <p className="text-muted-foreground mt-2 text-xs">
              Current setting loaded: {settings.setting_key}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Use React.memo for performance optimization
export const OpeningHoursTab = memo(OpeningHoursTabComponent);
OpeningHoursTab.displayName = "OpeningHoursTab";
