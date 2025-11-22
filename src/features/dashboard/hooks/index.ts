/**
 * Dashboard Hooks Barrel Export
 * Clean import path for all dashboard-related hooks
 *
 * Usage:
 *   import { useMemberEvolution, useWeeklySessions } from '@/features/dashboard/hooks';
 */

// Member Analytics (3 hooks from one file)
export {
  useMemberEvolution,
  useMemberTypeDistribution,
  useMemberStatusDistribution,
} from "./use-member-analytics";

// Other Dashboard Hooks
export { useMembersWithoutReservations } from "./use-members-without-reservations";
export {
  useMonthlyActivity,
  monthlyActivityKeys,
} from "./use-monthly-activity";
export { useRecentActivities } from "./use-recent-activities";
export {
  useWeeklySessions,
  useThreeWeekSessions,
  weeklySessionsKeys,
} from "./use-weekly-sessions";
