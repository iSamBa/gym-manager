import React from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Trainer availability checking removed during hook consolidation
import type { SessionAvailabilityCheck } from "../../lib/types";
import { format } from "date-fns";

interface TrainerAvailabilityCheckProps {
  trainerId: string;
  startTime: string;
  endTime: string;
  excludeSessionId?: string;
  className?: string;
}

export const TrainerAvailabilityCheck: React.FC<
  TrainerAvailabilityCheckProps
> = ({ trainerId, startTime, endTime, excludeSessionId, className }) => {
  // Trainer availability checking removed during hook consolidation
  const availability = null;
  const isLoading = false;
  const error = null;
  const refetch = () => {};
  const isFetching = false;

  // Don't render if essential data is missing
  if (!trainerId || !startTime || !endTime) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Alert className={cn("border-blue-200 bg-blue-50", className)}>
        <Clock className="h-4 w-4 animate-pulse text-blue-600" />
        <AlertDescription className="text-blue-700">
          Checking trainer availability...
        </AlertDescription>
      </Alert>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <XCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to check availability. Please try again.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="ml-2 h-6 px-2"
          >
            <RefreshCw
              className={cn("h-3 w-3", isFetching && "animate-spin")}
            />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // No availability data
  if (!availability) {
    return null;
  }

  const { available, conflicts, message } =
    availability as SessionAvailabilityCheck;

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      return format(new Date(timeString), "MMM d, h:mm a");
    } catch {
      return timeString;
    }
  };

  // Available state
  if (available) {
    return (
      <Alert className={cn("border-green-200 bg-green-50", className)}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between text-green-700">
          <span>{message || "Trainer is available for this time slot"}</span>
          <Badge
            variant="outline"
            className="border-green-300 bg-green-100 text-green-700"
          >
            Available
          </Badge>
        </AlertDescription>
      </Alert>
    );
  }

  // Not available - show conflicts
  return (
    <div className={cn("space-y-2", className)}>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{message || "Trainer is not available"}</span>
          <Badge variant="destructive">Conflicts Found</Badge>
        </AlertDescription>
      </Alert>

      {/* Show conflict details if available */}
      {conflicts && conflicts.length > 0 && (
        <div className="mt-2 space-y-1">
          <h4 className="text-muted-foreground text-sm font-medium">
            Conflicting Sessions:
          </h4>
          {conflicts.slice(0, 3).map((conflict, index) => (
            <div
              key={conflict.id || index}
              className="flex items-center justify-between rounded border border-red-200 bg-red-50 p-2 text-xs"
            >
              <div>
                <span className="font-medium">
                  {formatTime(conflict.scheduled_start)} -{" "}
                  {formatTime(conflict.scheduled_end)}
                </span>
                {conflict.location && (
                  <span className="text-muted-foreground ml-2">
                    at {conflict.location}
                  </span>
                )}
              </div>
              <Badge
                variant="outline"
                className="border-red-300 text-xs text-red-700"
              >
                {conflict.current_participants || 0}/
                {conflict.max_participants || 0}
              </Badge>
            </div>
          ))}

          {conflicts.length > 3 && (
            <p className="text-muted-foreground text-xs">
              ...and {conflicts.length - 3} more conflicting sessions
            </p>
          )}
        </div>
      )}

      {/* Refresh button for real-time checking */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw
            className={cn("mr-1 h-3 w-3", isFetching && "animate-spin")}
          />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default TrainerAvailabilityCheck;
