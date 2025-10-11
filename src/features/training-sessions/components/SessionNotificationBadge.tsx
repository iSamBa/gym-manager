import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SessionNotificationBadgeProps {
  count: number;
}

/**
 * SessionNotificationBadge - displays notification count for training sessions
 * Shows red badge with count when member has due-date comments before/on session date
 */
export const SessionNotificationBadge: React.FC<
  SessionNotificationBadgeProps
> = ({ count }) => {
  if (count === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            data-testid="notification-badge"
            className="absolute -top-2 -right-2 flex h-6 w-6 cursor-help items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg"
          >
            {count}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {count} upcoming reminder{count > 1 ? "s" : ""}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
