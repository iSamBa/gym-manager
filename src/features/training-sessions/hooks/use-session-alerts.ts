import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface SessionAlertsResult {
  session_id: string;
  member_id: string;
  alert_count: number;
}

/**
 * Fetch notification alerts for a training session
 * Queries member_comments with due_date >= session.scheduled_start
 * Used to display badge count on TimeSlot components
 */
export function useSessionAlerts(
  sessionId: string | undefined,
  memberId: string | undefined,
  scheduledStart: string | undefined
) {
  return useQuery<SessionAlertsResult | null>({
    queryKey: ["session-alerts", sessionId, memberId, scheduledStart],
    queryFn: async () => {
      if (!memberId || !sessionId || !scheduledStart) return null;

      // Query member_comments with due_date >= session scheduled_start
      const { data: comments, error } = await supabase
        .from("member_comments")
        .select("id, due_date")
        .eq("member_id", memberId)
        .not("due_date", "is", null)
        .gte("due_date", scheduledStart);

      if (error) {
        console.error("Error fetching session alerts:", error);
        return null;
      }

      return {
        session_id: sessionId,
        member_id: memberId,
        alert_count: comments?.length || 0,
      };
    },
    enabled: !!memberId && !!sessionId && !!scheduledStart,
    staleTime: 60000, // Cache for 1 minute
  });
}
