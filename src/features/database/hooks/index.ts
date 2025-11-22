/**
 * Database Hooks Barrel Export
 * Clean import path for all database-related hooks
 *
 * Usage:
 *   import { useTrainerAnalytics, useDashboardStats } from '@/features/database/hooks';
 */

export {
  analyticsKeys,
  useTrainerAnalytics,
  useMemberStatusDistribution,
  useDashboardStats,
} from "./use-analytics";
