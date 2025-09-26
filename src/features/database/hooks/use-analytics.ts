import { useQuery } from "@tanstack/react-query";
import {
  getTrainerAnalytics,
  getMemberStatusDistribution,
  getDashboardStats,
} from "../lib/analytics-utils";

// Query keys for analytics
export const analyticsKeys = {
  all: ["analytics"] as const,
  trainer: (trainerId: string) =>
    [...analyticsKeys.all, "trainer", trainerId] as const,
  memberStatus: () => [...analyticsKeys.all, "member-status"] as const,
  dashboard: () => [...analyticsKeys.all, "dashboard"] as const,
};

/**
 * Hook to get trainer analytics using SQL aggregation
 * Replaces client-side filtering and reduce operations
 */
export const useTrainerAnalytics = (trainerId: string) => {
  return useQuery({
    queryKey: analyticsKeys.trainer(trainerId),
    queryFn: () => getTrainerAnalytics(trainerId),
    enabled: !!trainerId,
    staleTime: 5 * 60 * 1000, // 5 minutes - analytics don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get member status distribution using SQL GROUP BY
 */
export const useMemberStatusDistribution = () => {
  return useQuery({
    queryKey: analyticsKeys.memberStatus(),
    queryFn: getMemberStatusDistribution,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to get dashboard statistics using SQL aggregations
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: getDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard stats are more dynamic
    gcTime: 5 * 60 * 1000,
  });
};
