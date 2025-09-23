import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface SessionQuickStats {
  today_sessions: number;
  today_change: number;
  today_completed: number;
  week_sessions: number;
  week_change: number;
  week_upcoming: number;
  active_trainers: number;
  total_trainers: number;
  active_locations: number;
}

export const useSessionQuickStats = () => {
  return useQuery({
    queryKey: ["session-quick-stats"],
    queryFn: async (): Promise<SessionQuickStats> => {
      // Get today's date range
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      // Get this week's date range
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Get last week's date range for comparison
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(weekStart);

      // Fetch today's sessions
      const { data: todaySessions, error: todayError } = await supabase
        .from("training_sessions")
        .select("id, status")
        .gte("scheduled_start", todayStart.toISOString())
        .lt("scheduled_start", todayEnd.toISOString());

      if (todayError) {
        throw new Error(
          `Failed to fetch today's sessions: ${todayError.message}`
        );
      }

      // Fetch this week's sessions
      const { data: weekSessions, error: weekError } = await supabase
        .from("training_sessions")
        .select("id, status")
        .gte("scheduled_start", weekStart.toISOString())
        .lt("scheduled_start", weekEnd.toISOString());

      if (weekError) {
        throw new Error(`Failed to fetch week sessions: ${weekError.message}`);
      }

      // Fetch last week's sessions for comparison
      const { data: lastWeekSessions, error: lastWeekError } = await supabase
        .from("training_sessions")
        .select("id")
        .gte("scheduled_start", lastWeekStart.toISOString())
        .lt("scheduled_start", lastWeekEnd.toISOString());

      if (lastWeekError) {
        throw new Error(
          `Failed to fetch last week sessions: ${lastWeekError.message}`
        );
      }

      // Fetch active trainers (trainers with sessions this week)
      const { data: activeTrainers, error: activeTrainersError } =
        await supabase
          .from("training_sessions")
          .select("trainer_id")
          .gte("scheduled_start", weekStart.toISOString())
          .lt("scheduled_start", weekEnd.toISOString());

      if (activeTrainersError) {
        throw new Error(
          `Failed to fetch active trainers: ${activeTrainersError.message}`
        );
      }

      // Fetch total trainers count
      const { count: totalTrainers, error: totalTrainersError } = await supabase
        .from("trainers")
        .select("*", { count: "exact", head: true });

      if (totalTrainersError) {
        throw new Error(
          `Failed to fetch total trainers: ${totalTrainersError.message}`
        );
      }

      // Calculate stats
      const todayTotal = todaySessions?.length || 0;
      const todayCompleted =
        todaySessions?.filter((s) => s.status === "completed").length || 0;

      const weekTotal = weekSessions?.length || 0;
      const weekUpcoming =
        weekSessions?.filter((s) => s.status === "scheduled").length || 0;

      const lastWeekTotal = lastWeekSessions?.length || 0;
      const weekChange =
        lastWeekTotal > 0
          ? ((weekTotal - lastWeekTotal) / lastWeekTotal) * 100
          : 0;

      // Get unique trainer IDs for active trainers count
      const uniqueTrainers = new Set(activeTrainers?.map((t) => t.trainer_id));
      const activeTrainersCount = uniqueTrainers.size;

      // Count unique locations from this week's sessions
      const { data: weekLocations } = await supabase
        .from("training_sessions")
        .select("location")
        .gte("scheduled_start", weekStart.toISOString())
        .lt("scheduled_start", weekEnd.toISOString())
        .not("location", "is", null);

      const uniqueLocations = new Set(
        weekLocations?.map((l) => l.location).filter(Boolean)
      );
      const activeLocations = uniqueLocations.size;

      return {
        today_sessions: todayTotal,
        today_change: 0, // Would need yesterday's data for comparison
        today_completed: todayCompleted,
        week_sessions: weekTotal,
        week_change: weekChange,
        week_upcoming: weekUpcoming,
        active_trainers: activeTrainersCount,
        total_trainers: totalTrainers || 0,
        active_locations: activeLocations,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};
