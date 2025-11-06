import { useState, useCallback, useMemo } from "react";
import type { SimpleMemberFilters } from "../components/SimpleMemberFilters";
import type { MemberStatus, MemberType } from "@/features/database/lib/types";

// Convert simple filters to database query filters
export function useSimpleMemberFilters() {
  const [filters, setFilters] = useState<SimpleMemberFilters>({
    status: "all",
  });

  const updateFilters = useCallback((newFilters: SimpleMemberFilters) => {
    setFilters(newFilters);
  }, []);

  const updateFilter = useCallback(
    (
      key: keyof SimpleMemberFilters,
      value: SimpleMemberFilters[keyof SimpleMemberFilters]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({
      status: "all",
      memberType: undefined,
      hasActiveSubscription: undefined,
      hasUpcomingSessions: undefined,
      hasOutstandingBalance: undefined,
    });
  }, []);

  // Convert simple filters to database-compatible format
  const databaseFilters = useMemo(() => {
    const dbFilters: {
      status?: MemberStatus;
      memberType?: MemberType;
      hasActiveSubscription?: boolean;
      hasUpcomingSessions?: boolean;
      hasOutstandingBalance?: boolean;
    } = {};

    // Status filter
    if (filters.status && filters.status !== "all") {
      dbFilters.status = filters.status as MemberStatus;
    }

    // Member type filter
    if (filters.memberType) {
      dbFilters.memberType = filters.memberType;
    }

    // Active subscription filter
    if (filters.hasActiveSubscription !== undefined) {
      dbFilters.hasActiveSubscription = filters.hasActiveSubscription;
    }

    // Upcoming sessions filter
    if (filters.hasUpcomingSessions !== undefined) {
      dbFilters.hasUpcomingSessions = filters.hasUpcomingSessions;
    }

    // Outstanding balance filter
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

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.status !== undefined && filters.status !== "all") ||
      filters.memberType !== undefined ||
      filters.hasActiveSubscription !== undefined ||
      filters.hasUpcomingSessions !== undefined ||
      filters.hasOutstandingBalance !== undefined
    );
  }, [filters]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status !== "all") count++;
    if (filters.memberType) count++;
    if (filters.hasActiveSubscription !== undefined) count++;
    if (filters.hasUpcomingSessions !== undefined) count++;
    if (filters.hasOutstandingBalance !== undefined) count++;
    return count;
  }, [filters]);

  // Quick filter helpers
  const setStatusFilter = useCallback(
    (status: SimpleMemberFilters["status"]) => {
      setFilters((prev) => ({ ...prev, status }));
    },
    []
  );

  const setMemberTypeFilter = useCallback(
    (memberType: SimpleMemberFilters["memberType"]) => {
      setFilters((prev) => ({ ...prev, memberType }));
    },
    []
  );

  const setSubscriptionFilter = useCallback(
    (hasActiveSubscription: boolean | undefined) => {
      setFilters((prev) => ({ ...prev, hasActiveSubscription }));
    },
    []
  );

  const setSessionsFilter = useCallback(
    (hasUpcomingSessions: boolean | undefined) => {
      setFilters((prev) => ({ ...prev, hasUpcomingSessions }));
    },
    []
  );

  const setBalanceFilter = useCallback(
    (hasOutstandingBalance: boolean | undefined) => {
      setFilters((prev) => ({ ...prev, hasOutstandingBalance }));
    },
    []
  );

  // Common filter presets
  const applyPreset = useCallback(
    (presetName: string) => {
      switch (presetName) {
        case "active-members":
          setFilters({
            status: "active",
            memberType: undefined,
            hasActiveSubscription: undefined,
            hasUpcomingSessions: undefined,
            hasOutstandingBalance: undefined,
          });
          break;
        case "trial-members":
          setFilters({
            status: "all",
            memberType: "trial",
            hasActiveSubscription: undefined,
            hasUpcomingSessions: undefined,
            hasOutstandingBalance: undefined,
          });
          break;
        case "active-subscribers":
          setFilters({
            status: "active",
            memberType: undefined,
            hasActiveSubscription: true,
            hasUpcomingSessions: undefined,
            hasOutstandingBalance: undefined,
          });
          break;
        case "outstanding-balance":
          setFilters({
            status: "all",
            memberType: undefined,
            hasActiveSubscription: undefined,
            hasUpcomingSessions: undefined,
            hasOutstandingBalance: true,
          });
          break;
        default:
          resetFilters();
      }
    },
    [resetFilters]
  );

  // Filter options for dropdowns
  const filterOptions = useMemo(
    () => ({
      status: [
        { value: "all", label: "All Statuses" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "suspended", label: "Suspended" },
        { value: "pending", label: "Pending" },
      ] as const,
      memberType: [
        { value: "all", label: "All Types" },
        { value: "full", label: "Full Members" },
        { value: "trial", label: "Trial Members" },
        { value: "collaboration", label: "Collaboration" },
      ] as const,
      subscription: [
        { value: "all", label: "All Subscriptions" },
        { value: "yes", label: "Active Subscription" },
        { value: "no", label: "No Subscription" },
      ] as const,
      sessions: [
        { value: "all", label: "All Sessions" },
        { value: "yes", label: "Has Upcoming" },
        { value: "no", label: "No Upcoming" },
      ] as const,
      balance: [
        { value: "all", label: "All Balances" },
        { value: "yes", label: "Has Balance Due" },
        { value: "no", label: "Fully Paid" },
      ] as const,
    }),
    []
  );

  return {
    filters,
    updateFilters,
    updateFilter,
    resetFilters,
    databaseFilters,
    getFilterSummary,
    hasActiveFilters,
    activeFilterCount,
    // Quick filter setters
    setStatusFilter,
    setMemberTypeFilter,
    setSubscriptionFilter,
    setSessionsFilter,
    setBalanceFilter,
    // Presets
    applyPreset,
    // Options for UI components
    filterOptions,
  };
}
