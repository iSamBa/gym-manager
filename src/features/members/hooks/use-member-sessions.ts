import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Types for member sessions
export interface MemberSession {
  session_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  location: string | null;
  notes: string | null;
  trainer_id: string;
  trainer_name: string;
  booking_status: "confirmed" | "waitlisted" | "cancelled";
  attendance_status: "registered" | "attended" | "no_show" | "cancelled";
  check_in_time: string | null;
  booking_date: string;
  created_at: string;
  duration_minutes: number;
  is_upcoming: boolean;
  is_today: boolean;
}

export interface SessionFilters {
  status?: "all" | "upcoming" | "completed" | "cancelled";
  trainer_id?: string;
  date_range?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

interface UseMemberSessionsOptions
  extends Omit<
    UseQueryOptions<MemberSession[], Error>,
    "queryKey" | "queryFn"
  > {
  filters?: SessionFilters;
}

// Hook to fetch member sessions with filtering
export function useMemberSessions(
  memberId: string,
  options: UseMemberSessionsOptions = {}
) {
  const { filters = {}, ...queryOptions } = options;

  return useQuery<MemberSession[], Error>({
    queryKey: ["member-sessions", memberId, filters],
    queryFn: async () => {
      let query = supabase
        .from("member_session_history")
        .select("*")
        .eq("member_id", memberId);

      // Apply status filter
      if (filters.status && filters.status !== "all") {
        if (filters.status === "upcoming") {
          query = query
            .eq("is_upcoming", true)
            .in("booking_status", ["confirmed", "waitlisted"]);
        } else if (filters.status === "completed") {
          query = query.eq("status", "completed");
        } else if (filters.status === "cancelled") {
          query = query.or("status.eq.cancelled,booking_status.eq.cancelled");
        }
      }

      // Apply trainer filter
      if (filters.trainer_id) {
        query = query.eq("trainer_id", filters.trainer_id);
      }

      // Apply date range filter
      if (filters.date_range) {
        query = query
          .gte("scheduled_start", filters.date_range.start.toISOString())
          .lte("scheduled_start", filters.date_range.end.toISOString());
      }

      // Apply search filter (search in trainer name, location, or notes)
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(
          `trainer_name.ilike.${searchTerm},location.ilike.${searchTerm},notes.ilike.${searchTerm}`
        );
      }

      // Order by scheduled date (most recent first for completed, upcoming first for future)
      query = query.order("scheduled_start", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching member sessions:", error);
        throw new Error(`Failed to fetch member sessions: ${error.message}`);
      }

      return data || [];
    },
    enabled: Boolean(memberId),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    ...queryOptions,
  });
}

// Hook to fetch upcoming sessions only (for quick actions)
export function useUpcomingMemberSessions(memberId: string) {
  return useMemberSessions(memberId, {
    filters: { status: "upcoming" },
    staleTime: 60 * 1000, // 1 minute for upcoming sessions
  });
}

// Hook to fetch session history (completed and cancelled sessions)
export function useMemberSessionHistory(
  memberId: string,
  options: UseMemberSessionsOptions = {}
) {
  const { filters = {}, ...queryOptions } = options;

  return useMemberSessions(memberId, {
    ...queryOptions,
    filters: {
      ...filters,
      status:
        filters.status === "all" ? undefined : filters.status || "completed",
    },
  });
}

// Hook to fetch sessions for today
export function useTodayMemberSessions(memberId: string) {
  return useQuery<MemberSession[], Error>({
    queryKey: ["member-sessions-today", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_session_history")
        .select("*")
        .eq("member_id", memberId)
        .eq("is_today", true)
        .order("scheduled_start", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch today's sessions: ${error.message}`);
      }

      return data || [];
    },
    enabled: Boolean(memberId),
    staleTime: 5 * 60 * 1000, // 5 minutes for today's sessions
  });
}

// Export query key factory for external cache invalidation
export const memberSessionsQueryKeys = {
  all: (memberId: string) => ["member-sessions", memberId],
  withFilters: (memberId: string, filters: SessionFilters) => [
    "member-sessions",
    memberId,
    filters,
  ],
  today: (memberId: string) => ["member-sessions-today", memberId],
  upcoming: (memberId: string) => [
    "member-sessions",
    memberId,
    { status: "upcoming" },
  ],
};
