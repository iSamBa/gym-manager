import { useState, useCallback, useMemo } from "react";
import type { SimpleMemberFilters } from "../components/SimpleMemberFilters";
import type { MemberStatus } from "@/features/database/lib/types";

// Convert simple filters to database query filters
export function useSimpleMemberFilters() {
  const [filters, setFilters] = useState<SimpleMemberFilters>({
    status: "all",
    dateRange: "all",
  });

  const updateFilters = useCallback((newFilters: SimpleMemberFilters) => {
    setFilters(newFilters);
  }, []);

  // Convert simple filters to database-compatible format
  const databaseFilters = useMemo(() => {
    const dbFilters: {
      status?: MemberStatus;
      joinDateFrom?: string;
      joinDateTo?: string;
      memberType?: "full" | "trial";
      hasActiveSubscription?: boolean;
      hasUpcomingSessions?: boolean;
      hasOutstandingBalance?: boolean;
    } = {};

    // Status filter
    if (filters.status && filters.status !== "all") {
      dbFilters.status = filters.status as MemberStatus;
    }

    // Date range filter - convert to actual dates
    if (filters.dateRange && filters.dateRange !== "all") {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      switch (filters.dateRange) {
        case "this-month":
          dbFilters.joinDateFrom = new Date(currentYear, currentMonth, 1)
            .toISOString()
            .split("T")[0];
          break;
        case "last-3-months":
          dbFilters.joinDateFrom = new Date(currentYear, currentMonth - 3, 1)
            .toISOString()
            .split("T")[0];
          break;
        case "this-year":
          dbFilters.joinDateFrom = new Date(currentYear, 0, 1)
            .toISOString()
            .split("T")[0];
          break;
      }
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

    if (filters.dateRange && filters.dateRange !== "all") {
      const dateLabels = {
        "this-month": "This Month",
        "last-3-months": "Last 3 Months",
        "this-year": "This Year",
      };
      summary.push(`Joined: ${dateLabels[filters.dateRange]}`);
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
