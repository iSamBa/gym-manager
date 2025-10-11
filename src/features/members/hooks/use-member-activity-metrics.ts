import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface ActivityMetrics {
  sessionsThisMonth: number;
  lastSessionDate: Date | null;
  overduePaymentsCount: number;
}

export function useMemberActivityMetrics(memberId: string) {
  return useQuery({
    queryKey: ["member-activity-metrics", memberId],
    queryFn: async (): Promise<ActivityMetrics> => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Sessions this month - use session status instead of attendance_status
      const { count: sessionsCount } = await supabase
        .from("training_session_members")
        .select("training_sessions!inner(status, scheduled_start)", {
          count: "exact",
          head: true,
        })
        .eq("member_id", memberId)
        .eq("training_sessions.status", "completed")
        .gte(
          "training_sessions.scheduled_start",
          new Date(currentYear, currentMonth, 1).toISOString()
        )
        .lt(
          "training_sessions.scheduled_start",
          new Date(currentYear, currentMonth + 1, 1).toISOString()
        );

      // Last session - use scheduled_start from training_sessions
      const { data: lastSession } = await supabase
        .from("training_session_members")
        .select("training_sessions!inner(scheduled_start, status)")
        .eq("member_id", memberId)
        .eq("training_sessions.status", "completed")
        .order("training_sessions.scheduled_start", { ascending: false })
        .limit(1)
        .single();

      // Overdue payments
      const { count: overdueCount } = await supabase
        .from("subscription_payments")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .in("payment_status", ["pending", "failed"])
        .lt("due_date", new Date().toISOString().split("T")[0]);

      // Type assertion: training_sessions is a single object when using .single()
      const sessionData = lastSession?.training_sessions as
        | { scheduled_start: string; status: string }
        | undefined;

      return {
        sessionsThisMonth: sessionsCount || 0,
        lastSessionDate: sessionData?.scheduled_start
          ? new Date(sessionData.scheduled_start)
          : null,
        overduePaymentsCount: overdueCount || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
