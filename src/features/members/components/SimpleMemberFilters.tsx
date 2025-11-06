"use client";

import { memo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MemberStatus, MemberType } from "@/features/database/lib/types";

// Simple filter state - only the essentials
export interface SimpleMemberFilters {
  status?: MemberStatus | "all";
  memberType?: MemberType;
  hasActiveSubscription?: boolean;
  hasUpcomingSessions?: boolean;
  hasOutstandingBalance?: boolean;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

interface SimpleMemberFiltersProps {
  filters: SimpleMemberFilters;
  onFiltersChange: (filters: SimpleMemberFilters) => void;
  className?: string;
}

export const SimpleMemberFilters = memo(function SimpleMemberFilters({
  filters,
  onFiltersChange,
  className,
}: SimpleMemberFiltersProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {/* Status Filter */}
      <Select
        value={filters.status || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value === "all" ? "all" : (value as MemberStatus),
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* NEW: Member Type Filter */}
      <Select
        value={filters.memberType || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            memberType: value === "all" ? undefined : (value as MemberType),
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Member Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="full">Full Members</SelectItem>
          <SelectItem value="trial">Trial Members</SelectItem>
          <SelectItem value="collaboration">Collaboration</SelectItem>
        </SelectContent>
      </Select>

      {/* NEW: Has Active Subscription Filter */}
      <Select
        value={
          filters.hasActiveSubscription === undefined
            ? "all"
            : filters.hasActiveSubscription
              ? "yes"
              : "no"
        }
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            hasActiveSubscription:
              value === "all" ? undefined : value === "yes",
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Subscription" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Subscriptions</SelectItem>
          <SelectItem value="yes">Active Subscription</SelectItem>
          <SelectItem value="no">No Subscription</SelectItem>
        </SelectContent>
      </Select>

      {/* NEW: Has Upcoming Sessions Filter */}
      <Select
        value={
          filters.hasUpcomingSessions === undefined
            ? "all"
            : filters.hasUpcomingSessions
              ? "yes"
              : "no"
        }
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            hasUpcomingSessions: value === "all" ? undefined : value === "yes",
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sessions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sessions</SelectItem>
          <SelectItem value="yes">Has Upcoming</SelectItem>
          <SelectItem value="no">No Upcoming</SelectItem>
        </SelectContent>
      </Select>

      {/* NEW: Has Outstanding Balance Filter */}
      <Select
        value={
          filters.hasOutstandingBalance === undefined
            ? "all"
            : filters.hasOutstandingBalance
              ? "yes"
              : "no"
        }
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            hasOutstandingBalance:
              value === "all" ? undefined : value === "yes",
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Balance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Balances</SelectItem>
          <SelectItem value="yes">Has Balance Due</SelectItem>
          <SelectItem value="no">Fully Paid</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});
