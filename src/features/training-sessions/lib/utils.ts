import { format, parseISO } from "date-fns";
import type { TrainingSession } from "./types";

// Date/time utilities
export const formatSessionTime = (start: string, end: string): string => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`;
};

export const formatSessionDate = (date: string): string => {
  return format(parseISO(date), "MMM dd, yyyy");
};

export const calculateSessionDuration = (
  start: string,
  end: string
): number => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)); // minutes
};

// Session status utilities
export const getSessionStatusColor = (status: string): string => {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
    case "in_progress":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  }
};

// Session category utilities
export const getSessionCategoryColor = (category: string): string => {
  switch (category?.toLowerCase()) {
    case "trial":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
    case "member":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
    case "premium":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
    case "group":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300";
    case "personal":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  }
};

// History and analytics utilities
export const calculateAttendanceRate = (
  currentParticipants: number,
  maxParticipants: number
): number => {
  if (maxParticipants === 0) return 0;
  return Math.round((currentParticipants / maxParticipants) * 100);
};

export const groupSessionsByDate = (
  sessions: TrainingSession[]
): Record<string, TrainingSession[]> => {
  return sessions.reduce(
    (groups, session) => {
      const date = format(parseISO(session.scheduled_start), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
      return groups;
    },
    {} as Record<string, TrainingSession[]>
  );
};
