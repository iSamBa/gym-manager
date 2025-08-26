import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberStatus } from "@/features/database/lib/types";

export interface MemberSearchFilters {
  query: string;
  status: MemberStatus | "all";
  joinDateFrom: string;
  joinDateTo: string;
}

interface MemberSearchFormProps {
  filters: MemberSearchFilters;
  onFiltersChange: (filters: MemberSearchFilters) => void;
  onReset?: () => void;
  className?: string;
  compact?: boolean;
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "expired", label: "Expired" },
] as const;

export function MemberSearchForm({
  filters,
  onFiltersChange,
  onReset,
  className,
  compact = false,
}: MemberSearchFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof MemberSearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleReset = () => {
    const defaultFilters: MemberSearchFilters = {
      query: "",
      status: "all",
      joinDateFrom: "",
      joinDateTo: "",
    };
    onFiltersChange(defaultFilters);
    onReset?.();
    setIsExpanded(false);
  };

  const hasActiveFilters =
    filters.query !== "" ||
    filters.status !== "all" ||
    filters.joinDateFrom !== "" ||
    filters.joinDateTo !== "";

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search members by name..."
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(hasActiveFilters && "border-primary")}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && <span className="ml-1 text-xs">•</span>}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="h-4 w-4" />
          Search & Filter Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name..."
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Status
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Joined From
            </label>
            <Input
              type="date"
              value={filters.joinDateFrom}
              onChange={(e) => updateFilter("joinDateFrom", e.target.value)}
            />
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Joined To
            </label>
            <Input
              type="date"
              value={filters.joinDateTo}
              onChange={(e) => updateFilter("joinDateTo", e.target.value)}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
