import React from "react";

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
    <div
      data-testid="notification-badge"
      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg"
    >
      {count}
    </div>
  );
};
