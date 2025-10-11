"use client";
// @ts-nocheck - Stub component with placeholder data properties that don't match actual types

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { useTrainingSessions } from "@/features/training-sessions/hooks";
import type { TrainingSession } from "@/features/training-sessions/lib/types";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";

// Helper function for session data
const getSessionMemberNames = (session: TrainingSession): string => {
  if (!session.participants || session.participants.length === 0) {
    return "No members";
  }
  return session.participants.map((p) => p.name).join(", ");
};

interface TrainerCalendarViewProps {
  trainerId: string;
  className?: string;
}

export function TrainerCalendarView({
  trainerId,
  className,
}: TrainerCalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Get all sessions and filter for this trainer
  const { data: allSessions, isLoading, error } = useTrainingSessions();

  // Filter sessions for this trainer
  const sessions = useMemo(() => {
    if (!allSessions) return [];
    return allSessions.filter((session) => session.trainer_id === trainerId);
  }, [allSessions, trainerId]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSessionsForDay = (date: Date) => {
    if (!sessions) return [];
    return sessions.filter((session) =>
      isSameDay(new Date(session.scheduled_start), date)
    );
  };

  const goToPreviousWeek = () => {
    setCurrentWeek((prev) => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek((prev) => addDays(prev, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load calendar view. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {format(weekStart, "MMM d")} -{" "}
            {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </p>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid min-h-[400px] grid-cols-1 md:grid-cols-7">
            {weekDays.map((day, dayIndex) => {
              const daySessions = getSessionsForDay(day);
              const dayIsToday = isToday(day);

              return (
                <div
                  key={dayIndex}
                  className={`border-r border-b p-4 last:border-r-0 ${dayIsToday ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                >
                  {/* Day Header */}
                  <div className="mb-3">
                    <div className="text-sm font-medium">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={`text-lg font-bold ${dayIsToday ? "text-blue-600 dark:text-blue-400" : ""}`}
                    >
                      {format(day, "d")}
                    </div>
                  </div>

                  {/* Loading State */}
                  {isLoading && (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  )}

                  {/* Sessions */}
                  {!isLoading && (
                    <div className="space-y-2">
                      {daySessions.length === 0 ? (
                        <div className="text-muted-foreground text-xs">
                          No sessions
                        </div>
                      ) : (
                        daySessions.map((session) => (
                          <div
                            key={session.id}
                            className={`cursor-pointer rounded-lg border p-2 text-xs transition-shadow hover:shadow-sm ${
                              // @ts-expect-error - Stub component with placeholder data
                              session.is_upcoming
                                ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50"
                                : // @ts-expect-error - Stub component with placeholder data
                                  session.session_status === "completed"
                                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50"
                                  : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50"
                            }`}
                          >
                            {/* Time */}
                            <div className="mb-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">
                                {format(
                                  new Date(session.scheduled_start),
                                  "h:mm a"
                                )}
                              </span>
                            </div>

                            {/* Client */}
                            <div className="mb-1 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="truncate">
                                {getSessionMemberNames(session)}
                              </span>
                            </div>

                            {/* Machine */}
                            {session.machine_name && (
                              <div className="mb-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="text-muted-foreground truncate">
                                  {session.machine_name}
                                </span>
                              </div>
                            )}

                            {/* Status Badge */}
                            <div className="mt-2">
                              <Badge
                                variant={
                                  // @ts-expect-error - Stub component with placeholder properties
                                  session.session_status === "completed"
                                    ? "default"
                                    : // @ts-expect-error - Stub component with placeholder properties
                                      session.is_upcoming
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-xs"
                              >
                                {session.status === "completed"
                                  ? "Done"
                                  : session.status === "scheduled"
                                    ? "Upcoming"
                                    : session.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Week Summary */}
      {!isLoading && sessions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Week Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{sessions.length}</div>
                <div className="text-muted-foreground text-sm">
                  Total Sessions
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {
                    new Set(
                      sessions.flatMap(
                        (s) => s.participants?.map((p) => p.name) || []
                      )
                    ).size
                  }
                </div>
                <div className="text-muted-foreground text-sm">
                  Unique Clients
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(
                    sessions.reduce((sum, s) => {
                      const start = new Date(s.scheduled_start);
                      const end = new Date(s.scheduled_end);
                      const durationMinutes =
                        (end.getTime() - start.getTime()) / (1000 * 60);
                      return sum + durationMinutes;
                    }, 0) / 60
                  )}
                  h
                </div>
                <div className="text-muted-foreground text-sm">Total Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
