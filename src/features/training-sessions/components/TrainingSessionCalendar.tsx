import React, { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  View,
  NavigateAction,
  ToolbarProps,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Users,
  Clock,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrainingSessions } from "../hooks/use-training-sessions";
import {
  transformSessionToCalendarEvent,
  createEventPropGetter,
} from "../lib/utils";
import { CALENDAR_CONFIG, type CalendarViewMode } from "../lib/constants";
import type {
  TrainingSession,
  CalendarView,
  TrainingSessionCalendarEvent,
} from "../lib/types";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TrainingSessionCalendarProps {
  onSelectSession?: (session: TrainingSession) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  defaultView?: CalendarView;
  defaultDate?: Date;
  defaultViewMode?: CalendarViewMode;
}

const TrainingSessionCalendar: React.FC<TrainingSessionCalendarProps> = ({
  onSelectSession,
  onSelectSlot,
  defaultView = "week",
  defaultDate = new Date(),
  defaultViewMode = CALENDAR_CONFIG.defaultViewMode,
}) => {
  const [currentView, setCurrentView] = useState<View>(defaultView);
  const [currentDate, setCurrentDate] = useState(defaultDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(defaultViewMode);

  // Calculate date range for current view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (currentView) {
      case "month":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case "day":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }, [currentDate, currentView]);

  // Fetch sessions for current view
  const {
    data: sessions = [],
    isLoading,
    error,
    refetch,
  } = useTrainingSessions({
    date_range: dateRange,
  });

  // Transform sessions to calendar events
  const events = useMemo(() => {
    return sessions.map(transformSessionToCalendarEvent);
  }, [sessions]);

  // Create eventPropGetter for dynamic styling
  const eventPropGetter = useMemo(() => {
    return createEventPropGetter(viewMode, currentView);
  }, [viewMode, currentView]);

  // Custom event component - displays full information for all sessions
  const EventComponent = ({
    event,
  }: {
    event: TrainingSessionCalendarEvent;
  }) => {
    // Calculate event duration in minutes for tooltip display
    const durationMinutes = Math.floor(
      (event.end.getTime() - event.start.getTime()) / (1000 * 60)
    );

    // Determine content visibility based on duration and view mode
    const isVeryShort = durationMinutes <= 15;
    const isCompactMode = viewMode === "compact";
    const showFullDetails = !isVeryShort || isCompactMode;

    return (
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "event-content h-full cursor-pointer rounded px-1 py-0.5 text-xs",
              "border-opacity-30 border",
              // Base styling with status-based colors
              "border-blue-300 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
              event.status === "cancelled" && "line-through opacity-50",
              event.status === "in_progress" &&
                "border-orange-300 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
              event.status === "completed" &&
                "border-green-300 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
            )}
          >
            {/* Trainer name - always shown */}
            <div className="trainer-name mb-0.5 text-xs font-semibold">
              {event.trainer_name}
            </div>

            {/* Session details - conditional based on space */}
            {showFullDetails && (
              <div className="session-details space-y-0.5">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 flex-shrink-0" />
                  <span className="text-xs">
                    {event.current_participants === 1 ? "1 member" : "Empty"}
                  </span>
                </div>
                {event.machine_name && (
                  <div className="flex items-center gap-1">
                    <span className="truncate text-xs">
                      {event.machine_name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Condensed display for very short sessions in standard mode */}
            {!showFullDetails && (
              <div className="session-details-condensed">
                <div className="text-xs">
                  {event.current_participants === 1 ? "1 member" : "Empty"}
                  {event.machine_name && ` • ${event.machine_name}`}
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">{event.trainer_name}</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                </span>
                <span className="text-xs opacity-70">({durationMinutes}m)</span>
              </div>
              {event.machine_name && (
                <div className="flex items-center gap-2">
                  <span>Machine: {event.machine_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span>
                  {event.current_participants === 1 ? "1 member" : "Empty"}
                </span>
              </div>
              {event.session_type && (
                <div className="flex items-center gap-2">
                  <Badge className="h-3 w-3" />
                  <span className="capitalize">
                    {event.session_type} session
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    event.status === "scheduled" && "bg-blue-500",
                    event.status === "in_progress" && "bg-orange-500",
                    event.status === "completed" && "bg-green-500",
                    event.status === "cancelled" && "bg-gray-500"
                  )}
                />
                <span className="capitalize">
                  {event.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Custom toolbar component
  const CustomToolbar: React.FC<
    ToolbarProps<TrainingSessionCalendarEvent, object>
  > = (toolbar) => {
    const goToBack = () => {
      toolbar.onNavigate("PREV" as NavigateAction);
    };

    const goToNext = () => {
      toolbar.onNavigate("NEXT" as NavigateAction);
    };

    const goToCurrent = () => {
      toolbar.onNavigate("TODAY" as NavigateAction);
    };

    const onViewChange = (view: View) => {
      toolbar.onView(view);
      setCurrentView(view);
    };

    return (
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToBack}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={goToCurrent}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNext}>
            Next
          </Button>
        </div>

        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarIcon className="h-5 w-5" />
          {toolbar.label}
        </h2>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={viewMode === "standard" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("standard")}
              className="h-auto px-2 py-1"
            >
              <Minimize2 className="mr-1 h-3 w-3" />
              Standard
            </Button>
            <Button
              variant={viewMode === "compact" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("compact")}
              className="h-auto px-2 py-1"
            >
              <Maximize2 className="mr-1 h-3 w-3" />
              Compact
            </Button>
          </div>

          {/* Calendar View Buttons */}
          <div className="flex items-center gap-1">
            {["month", "week", "day"].map((view) => (
              <Button
                key={view}
                variant={currentView === view ? "default" : "outline"}
                size="sm"
                onClick={() => onViewChange(view as View)}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Event handlers
  const handleSelectEvent = (event: TrainingSessionCalendarEvent) => {
    if (onSelectSession) {
      onSelectSession(event);
    }
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    if (onSelectSlot) {
      onSelectSlot({
        start: slotInfo.start,
        end: slotInfo.end,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground mt-2 text-sm">
              Loading calendar...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4 text-sm">
              Failed to load calendar
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-1 flex-col p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "calc(100vh - 250px)", minHeight: 600 }}
        views={["month", "week", "day"]}
        view={currentView}
        date={currentDate}
        onNavigate={setCurrentDate}
        onView={setCurrentView}
        selectable
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        eventPropGetter={eventPropGetter}
        components={{
          event: EventComponent,
          toolbar: CustomToolbar,
        }}
        formats={{
          timeGutterFormat: CALENDAR_CONFIG.formats.timeGutterFormat,
          eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, "HH:mm", culture) || format(start, "HH:mm")} - ${localizer?.format(end, "HH:mm", culture) || format(end, "HH:mm")}`,
        }}
        step={CALENDAR_CONFIG.step}
        timeslots={CALENDAR_CONFIG.timeslots}
        min={CALENDAR_CONFIG.min}
        max={CALENDAR_CONFIG.max}
        scrollToTime={CALENDAR_CONFIG.scrollToTime}
        popup
        tooltipAccessor={(event) =>
          `${event.trainer_name}${event.machine_name ? ` - ${event.machine_name}` : ""}`
        }
      />
    </Card>
  );
};

export default TrainingSessionCalendar;
