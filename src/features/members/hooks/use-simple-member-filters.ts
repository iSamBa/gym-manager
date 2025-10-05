import { useState, useCallback, useMemo } from "react";
import type { SimpleMemberFilters } from "../components/SimpleMemberFilters";
import type { MemberStatus } from "@/features/database/lib/types";

// Convert simple filters to database query filters
export function useSimpleMemberFilters() {
  const [filters, setFilters] = useState<SimpleMemberFilters>({
    status: "all",
  });

  const updateFilters = useCallback((newFilters: SimpleMemberFilters) => {
    setFilters(newFilters);
  }, []);

  // Convert simple filters to database-compatible format
  const databaseFilters = useMemo(() => {
    const dbFilters: {
      status?: MemberStatus;
      memberType?: "full" | "trial";
      hasActiveSubscription?: boolean;
      hasUpcomingSessions?: boolean;
      hasOutstandingBalance?: boolean;
    } = {};

    // Status filter
    if (filters.status && filters.status !== "all") {
      dbFilters.status = filters.status as MemberStatus;
    }

    // NEW: Member type filter
    if (filters.memberType) {
      dbFilters.memberType = filters.memberType;
    }

    // NEW: Active subscription filter
    if (filters.hasActiveSubscription !== undefined) {
      dbFilters.hasActiveSubscription = filters.hasActiveSubscription;
    }

    // NEW: Upcoming sessions filter
    if (filters.hasUpcomingSessions !== undefined) {
      dbFilters.hasUpcomingSessions = filters.hasUpcomingSessions;
    }

    // NEW: Outstanding balance filter
    if (filters.hasOutstandingBalance !== undefined) {
      dbFilters.hasOutstandingBalance = filters.hasOutstandingBalance;
    }

    return dbFilters;
  }, [filters]);

  // Get a human-readable summary of active filters
  const getFilterSummary = useCallback(() => {
    const summary: string[] = [];

    if (filters.status && filters.status !== "all") {
      summary.push(`Status: ${filters.status}`);
    }

    if (filters.memberType) {
      summary.push(`Type: ${filters.memberType}`);
    }

    if (filters.hasActiveSubscription !== undefined) {
      summary.push(
        `Subscription: ${filters.hasActiveSubscription ? "Active" : "None"}`
      );
    }

    if (filters.hasUpcomingSessions !== undefined) {
      summary.push(
        `Sessions: ${filters.hasUpcomingSessions ? "Has Upcoming" : "No Upcoming"}`
      );
    }

    if (filters.hasOutstandingBalance !== undefined) {
      summary.push(
        `Balance: ${filters.hasOutstandingBalance ? "Has Balance" : "Fully Paid"}`
      );
    }

    return summary;
  }, [filters]);

  return {
    filters,
    updateFilters,
    databaseFilters,
    getFilterSummary,
  };
}
