import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date-utils";
import { useAuth } from "@/hooks/use-auth";

interface ActivityMetrics {
  sessionsThisMonth: number;
  lastSessionDate: Date | null;
  overduePaymentsCount: number;
}

export function useMemberActivityMetrics(memberId: string) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  return useQuery({
    queryKey: ["member-activity-metrics", memberId],
    enabled: !!memberId && isAuthenticated && !isAuthLoading, // Only run when authenticated
    queryFn: async (): Promise<ActivityMetrics> => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Sessions this month - query from training_sessions for proper filtering
      const { count: sessionsCount } = await supabase
        .from("training_sessions")
        .select("*, training_session_members!inner(member_id)", {
          count: "exact",
          head: true,
        })
        .eq("training_session_members.member_id", memberId)
        .eq("status", "completed")
        .gte(
          "scheduled_start",
          new Date(currentYear, currentMonth, 1).toISOString()
        )
        .lt(
          "scheduled_start",
          new Date(currentYear, currentMonth + 1, 1).toISOString()
        );

      // Last session - query from training_sessions for proper ordering
      const { data: lastSessionData } = await supabase
        .from("training_sessions")
        .select(
          "scheduled_start, status, training_session_members!inner(member_id)"
        )
        .eq("training_session_members.member_id", memberId)
        .eq("status", "completed")
        .order("scheduled_start", { ascending: false })
        .limit(1);

      const lastSession = lastSessionData?.[0] || null;

      // Overdue payments
      const { count: overdueCount } = await supabase
        .from("subscription_payments")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .in("payment_status", ["pending", "failed"])
        .lt("due_date", getLocalDateString(new Date()));

      return {
        sessionsThisMonth: sessionsCount || 0,
        lastSessionDate: lastSession?.scheduled_start
          ? new Date(lastSession.scheduled_start)
          : null,
        overduePaymentsCount: overdueCount || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
