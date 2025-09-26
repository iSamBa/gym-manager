import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface RecentActivity {
  id: string;
  member: string;
  action: string;
  time: string;
  type: "member" | "subscription" | "class" | "payment";
}

/**
 * Hook to get recent activities from various database sources
 * Replaces hardcoded mock data with real database queries
 */
export const useRecentActivities = (limit = 4) => {
  return useQuery({
    queryKey: ["recent-activities", limit],
    queryFn: async (): Promise<RecentActivity[]> => {
      const activities: RecentActivity[] = [];

      // Get recent member registrations (last 7 days)
      const { data: recentMembers } = await supabase
        .from("members")
        .select("id, first_name, last_name, created_at")
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentMembers) {
        activities.push(
          ...recentMembers.map((member) => ({
            id: `member-${member.id}`,
            member: `${member.first_name} ${member.last_name}`,
            action: "Registered as new member",
            time: getRelativeTime(member.created_at),
            type: "member" as const,
          }))
        );
      }

      // Get recent subscription payments (last 3 days)
      const { data: recentPayments } = await supabase
        .from("subscription_payments")
        .select(
          `
          id,
          created_at,
          member:members(first_name, last_name)
        `
        )
        .gte(
          "created_at",
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        )
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentPayments) {
        activities.push(
          ...recentPayments.map((payment) => {
            const member = Array.isArray(payment.member)
              ? payment.member[0]
              : payment.member;
            return {
              id: `payment-${payment.id}`,
              member:
                `${member?.first_name || ""} ${member?.last_name || ""}`.trim(),
              action: "Made payment",
              time: getRelativeTime(payment.created_at),
              type: "payment" as const,
            };
          })
        );
      }

      // Get recent class bookings (last 2 days)
      const { data: recentBookings } = await supabase
        .from("class_bookings")
        .select(
          `
          id,
          created_at,
          member:members(first_name, last_name),
          class:classes(name)
        `
        )
        .gte(
          "created_at",
          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        )
        .eq("status", "confirmed")
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentBookings) {
        activities.push(
          ...recentBookings.map((booking) => {
            const member = Array.isArray(booking.member)
              ? booking.member[0]
              : booking.member;
            const classInfo = Array.isArray(booking.class)
              ? booking.class[0]
              : booking.class;
            return {
              id: `booking-${booking.id}`,
              member:
                `${member?.first_name || ""} ${member?.last_name || ""}`.trim(),
              action: `Booked ${classInfo?.name || "class"}`,
              time: getRelativeTime(booking.created_at),
              type: "class" as const,
            };
          })
        );
      }

      // Sort all activities by creation time and limit
      return activities
        .filter((activity) => activity.member.trim() !== "") // Filter out activities with no member name
        .sort((a, b) => {
          // Parse relative time back to compare (simple heuristic)
          const aMinutes = parseRelativeTime(a.time);
          const bMinutes = parseRelativeTime(b.time);
          return aMinutes - bMinutes;
        })
        .slice(0, limit);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - activities should be relatively fresh
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Convert ISO date string to relative time
 */
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
}

/**
 * Parse relative time string back to minutes (for sorting)
 */
function parseRelativeTime(timeString: string): number {
  if (timeString === "Just now") return 0;

  const match = timeString.match(/(\d+)\s+(minute|hour|day)s?\s+ago/);
  if (!match) return 999999; // Put unparseable times at the end

  const [, amount, unit] = match;
  const value = parseInt(amount, 10);

  switch (unit) {
    case "minute":
      return value;
    case "hour":
      return value * 60;
    case "day":
      return value * 24 * 60;
    default:
      return 999999;
  }
}
