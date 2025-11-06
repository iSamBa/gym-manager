import { memo } from "react";
import { CheckCircle, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Props for the SessionStatsCards component
 */
export interface SessionStatsCardsProps {
  /** Number of completed sessions (past sessions) */
  done: number;
  /** Number of remaining sessions from active subscription (null for unlimited) */
  remaining: number | null;
  /** Number of scheduled/upcoming sessions */
  scheduled: number;
}

/**
 * Displays three stat cards showing session statistics
 *
 * Card 1: Sessions Done - Completed past sessions
 * Card 2: Sessions Remaining - Available sessions from active subscription (or "Unlimited")
 * Card 3: Sessions Scheduled - Upcoming future sessions with confirmed/waitlisted bookings
 *
 * Uses same counting logic as members table for consistency (time + status based).
 * Responsive: 1 column on mobile, 3 columns on desktop
 *
 * @param props - Session statistics
 * @returns Three cards in a responsive grid
 */
export const SessionStatsCards = memo(function SessionStatsCards({
  done,
  remaining,
  scheduled,
}: SessionStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Card 1: Sessions Done */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sessions Done</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{done}</div>
          <p className="text-muted-foreground mt-1 text-xs">
            Completed sessions
          </p>
        </CardContent>
      </Card>

      {/* Card 2: Sessions Remaining */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Sessions Remaining
          </CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {remaining === null ? "Unlimited" : remaining}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Available to book
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Sessions Scheduled */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Sessions Scheduled
          </CardTitle>
          <Calendar className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{scheduled}</div>
          <p className="text-muted-foreground mt-1 text-xs">
            Upcoming sessions
          </p>
        </CardContent>
      </Card>
    </div>
  );
});
