import { useMemo, useState } from "react";
import { useTrainingSessions } from "./use-training-sessions";
import { transformSessionToCalendarEvent } from "../lib/utils";
import type {
  SessionFilters,
  TrainingSessionCalendarEvent,
  CalendarView,
} from "../lib/types";

export const useCalendarEvents = (filters?: SessionFilters) => {
  const {
    data: sessions,
    isLoading,
    error,
    refetch,
  } = useTrainingSessions(filters);

  const events = useMemo((): TrainingSessionCalendarEvent[] => {
    if (!sessions) return [];
    return sessions.map(transformSessionToCalendarEvent);
  }, [sessions]);

  return {
    events,
    isLoading,
    error,
    refetch,
  };
};

export const useCalendarNavigation = (initialDate = new Date()) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentView, setCurrentView] = useState<CalendarView>("week");

  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (currentView) {
      case "month":
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        break;
      case "week":
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case "day":
        end.setDate(end.getDate() + 1);
        break;
    }

    return { start, end };
  }, [currentDate, currentView]);

  const goToNext = () => {
    const nextDate = new Date(currentDate);
    switch (currentView) {
      case "month":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case "week":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "day":
        nextDate.setDate(nextDate.getDate() + 1);
        break;
    }
    setCurrentDate(nextDate);
  };

  const goToPrevious = () => {
    const prevDate = new Date(currentDate);
    switch (currentView) {
      case "month":
        prevDate.setMonth(prevDate.getMonth() - 1);
        break;
      case "week":
        prevDate.setDate(prevDate.getDate() - 7);
        break;
      case "day":
        prevDate.setDate(prevDate.getDate() - 1);
        break;
    }
    setCurrentDate(prevDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return {
    currentDate,
    currentView,
    dateRange,
    setCurrentDate,
    setCurrentView,
    goToNext,
    goToPrevious,
    goToToday,
  };
};
