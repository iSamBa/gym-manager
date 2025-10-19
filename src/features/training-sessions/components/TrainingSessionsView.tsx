"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, addDays, subDays, startOfWeek } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";

// Import machine slot grid
import { MachineSlotGrid } from "./MachineSlotGrid";
import { SessionDialog } from "./forms/SessionDialog";
import { SessionBookingDialog } from "./forms/SessionBookingDialog";
import { WeeklyDayTabs } from "./WeeklyDayTabs";
import { useTrainingSessions } from "../hooks";
import type { TrainingSession } from "../lib/types";

const TrainingSessionsView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSession, setSelectedSession] =
    useState<TrainingSession | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingDefaults, setBookingDefaults] = useState<{
    machine_id: string;
    scheduled_start: string;
    scheduled_end: string;
  } | null>(null);

  // Calculate week start (Monday) for the selected date
  const weekStart = useMemo(() => {
    return startOfWeek(selectedDate, { weekStartsOn: 1 });
  }, [selectedDate]);

  // Get current date range
  const dateRange = React.useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }, []);

  // Fetch sessions data (MachineSlotGrid fetches its own data, but we keep this for cache warming)
  const { isLoading, error } = useTrainingSessions({
    date_range: dateRange,
  });

  // Check URL params for sessionId and auto-open dialog
  useEffect(() => {
    const sessionId = searchParams.get("sessionId");
    if (sessionId) {
      // Create a minimal session object with just the ID
      // SessionDialog will fetch the full session data
      setSelectedSession({ id: sessionId } as TrainingSession);
      setShowSessionDialog(true);
    }
  }, [searchParams]);

  const handleSessionClick = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowSessionDialog(true);
  };

  const handleSessionDialogClose = () => {
    setShowSessionDialog(false);
    setSelectedSession(null);
    // Clean up URL params when dialog closes
    const sessionId = searchParams.get("sessionId");
    if (sessionId) {
      router.push("/training-sessions");
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-2 text-sm">
              Failed to load training sessions
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <>
      <Card className="flex flex-1 flex-col">
        <CardContent className="flex flex-1 flex-col pt-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Loading sessions...
                </p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Day Navigation Bar */}
              <div className="mb-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousDay}
                  aria-label="Previous day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="min-w-[240px] justify-center gap-2"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextDay}
                  aria-label="Next day"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button variant="outline" onClick={handleToday}>
                  Today
                </Button>
              </div>

              {/* Weekly Day Tabs */}
              <div className="mb-4">
                <WeeklyDayTabs
                  selectedDate={selectedDate}
                  weekStart={weekStart}
                  onDateSelect={setSelectedDate}
                />
              </div>

              <MachineSlotGrid
                selectedDate={selectedDate}
                onSessionClick={handleSessionClick}
                onSlotClick={(machineId, timeSlot) => {
                  // Open booking dialog with pre-filled data
                  setBookingDefaults({
                    machine_id: machineId,
                    scheduled_start: timeSlot.start.toISOString(),
                    scheduled_end: timeSlot.end.toISOString(),
                  });
                  setShowBookingDialog(true);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Dialog (View/Edit with Alerts) */}
      <SessionDialog
        open={showSessionDialog}
        onOpenChange={(open) => {
          if (!open) handleSessionDialogClose();
        }}
        sessionId={selectedSession?.id}
      />

      {/* Session Booking Dialog */}
      <SessionBookingDialog
        open={showBookingDialog}
        onOpenChange={(open) => {
          setShowBookingDialog(open);
          if (!open) {
            setBookingDefaults(null);
          }
        }}
        defaultValues={bookingDefaults || undefined}
      />
    </>
  );
};

export default TrainingSessionsView;
