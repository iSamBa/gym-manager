/**
 * Dashboard Analytics Type Definitions
 *
 * Type definitions for dashboard analytics data returned from RPC functions
 */

/**
 * Weekly session statistics grouped by session type
 * Returned from get_weekly_session_stats RPC function
 */
export interface WeeklySessionStats {
  week_start: string; // YYYY-MM-DD format
  week_end: string; // YYYY-MM-DD format
  total_sessions: number;
  trial: number;
  member: number;
  contractual: number;
  multi_site: number;
  collaboration: number;
  makeup: number;
  non_bookable: number;
}

/**
 * Monthly activity statistics including trial conversions and subscription metrics
 * Returned from get_monthly_activity_stats RPC function
 */
export interface MonthlyActivityStats {
  month_start: string; // YYYY-MM-DD format
  month_end: string; // YYYY-MM-DD format
  trial_sessions: number;
  trial_conversions: number;
  subscriptions_expired: number;
  subscriptions_renewed: number;
  subscriptions_cancelled: number;
}

/**
 * Session type breakdown for pie chart display
 */
export interface SessionTypeData {
  type: string;
  count: number;
  fill: string; // Color for the chart
}

/**
 * Three weeks session data for dashboard display
 */
export interface ThreeWeekSessionsData {
  lastWeek: WeeklySessionStats | null;
  currentWeek: WeeklySessionStats | null;
  nextWeek: WeeklySessionStats | null;
}
