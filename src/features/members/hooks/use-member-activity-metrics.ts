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

      // Sessions this month
      const { count: sessionsCount } = await supabase
        .from("training_session_members")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .eq("attendance_status", "attended")
        .gte(
          "check_in_time",
          new Date(currentYear, currentMonth, 1).toISOString()
        )
        .lt(
          "check_in_time",
          new Date(currentYear, currentMonth + 1, 1).toISOString()
        );

      // Last session
      const { data: lastSession } = await supabase
        .from("training_session_members")
        .select("check_in_time")
        .eq("member_id", memberId)
        .eq("attendance_status", "attended")
        .order("check_in_time", { ascending: false })
        .limit(1)
        .single();

      // Overdue payments
      const { count: overdueCount } = await supabase
        .from("subscription_payments")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .in("payment_status", ["pending", "failed"])
        .lt("due_date", new Date().toISOString().split("T")[0]);

      return {
        sessionsThisMonth: sessionsCount || 0,
        lastSessionDate: lastSession?.check_in_time
          ? new Date(lastSession.check_in_time)
          : null,
        overduePaymentsCount: overdueCount || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
