"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { MemberStatus } from "@/features/database/lib/types";

// Simple filter state - only the essentials
export interface SimpleMemberFilters {
  status?: MemberStatus | "all";
  dateRange?: "all" | "this-month" | "last-3-months" | "this-year";
}

// Predefined date filter options
const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "this-month", label: "This Month" },
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "this-year", label: "This Year" },
];

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

export function SimpleMemberFilters({
  filters,
  onFiltersChange,
  className,
}: SimpleMemberFiltersProps) {
  const updateFilter = <K extends keyof SimpleMemberFilters>(
    key: K,
    value: SimpleMemberFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({ status: "all", dateRange: "all" });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status && filters.status !== "all") count++;
    if (filters.dateRange && filters.dateRange !== "all") count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium whitespace-nowrap">
            Status:
          </Label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              updateFilter("status", value as MemberStatus | "all")
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium whitespace-nowrap">
            Joined:
          </Label>
          <Select
            value={filters.dateRange || "all"}
            onValueChange={(value) =>
              updateFilter(
                "dateRange",
                value as SimpleMemberFilters["dateRange"]
              )
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {activeFilterCount}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  );
}
