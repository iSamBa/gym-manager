import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { MemberComment } from "@/features/database/lib/types";
import { getLocalDateString } from "@/lib/date-utils";

/**
 * Fetch notification alerts for a training session
 * Returns full MemberComment data for alerts with due dates >= session date
 * Alerts are shown only when their due_date is on or after the session date
 */
export function useSessionAlerts(
  sessionId: string | undefined,
  memberId: string | undefined,
  sessionDate: string | undefined // ISO timestamp of session scheduled_start
) {
  return useQuery<MemberComment[]>({
    queryKey: ["session-alerts", sessionId, memberId, sessionDate],
    queryFn: async () => {
      if (!memberId || !sessionId || !sessionDate) {
        return [];
      }

      // Extract just the date portion from session timestamp for comparison
      const sessionDateOnly = getLocalDateString(new Date(sessionDate));

      // Query member_comments with:
      // 1. due_date IS NOT NULL
      // 2. due_date >= sessionDateOnly (alert due on or after session date)
      const { data: comments, error } = await supabase
        .from("member_comments")
        .select(
          "id, author, body, due_date, created_at, member_id, created_by, updated_at"
        )
        .eq("member_id", memberId)
        .not("due_date", "is", null)
        .gte("due_date", sessionDateOnly)
        .order("due_date", { ascending: true });

      if (error) {
        logger.error("Error fetching session alerts", { error });
        return [];
      }

      return comments || [];
    },
    enabled: !!memberId && !!sessionId && !!sessionDate,
    staleTime: 60000, // Cache for 1 minute
  });
}
