"use client";

import { useState, useCallback } from "react";
import { CalendarIcon, Filter, X, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { MemberStatus } from "@/features/database/lib/types";
import { useSimpleMemberFilters } from "../hooks/use-simple-member-filters";

// Filter configuration
const STATUS_OPTIONS: Array<{ value: MemberStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

const MEMBERSHIP_TYPE_OPTIONS = [
  { value: "basic", label: "Basic" },
  { value: "premium", label: "Premium" },
  { value: "vip", label: "VIP" },
  { value: "student", label: "Student" },
  { value: "senior", label: "Senior" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "current", label: "Current" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export interface MemberFiltersProps {
  onFiltersChange?: (filters: MemberFilterState) => void;
  className?: string;
  compact?: boolean;
}

export function MemberFilters({
  onFiltersChange,
  className,
  compact = false,
}: MemberFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { filters, updateFilters, databaseFilters } = useSimpleMemberFilters();

  // Calculate active filters count
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = useCallback(() => {
    updateFilters({ search: "", status: "", joinDate: "" });
    onFiltersChange?.({});
  }, [updateFilters, onFiltersChange]);

  const activeFilterCount = getActiveFilterCount();

  // Date picker handlers
  const handleDateChange = useCallback(
    (
      field: "joinDateFrom" | "joinDateTo" | "lastVisitFrom" | "lastVisitTo",
      date: Date | undefined
    ) => {
      if (date) {
        updateFilter(field, format(date, "yyyy-MM-dd"));
      } else {
        removeFilter(field);
      }
    },
    [updateFilter, removeFilter]
  );

  // Age range handlers
  const handleAgeChange = useCallback(
    (field: "ageMin" | "ageMax", value: string) => {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue > 0) {
        updateFilter(field, numValue);
      } else {
        removeFilter(field);
      }
    },
    [updateFilter, removeFilter]
  );

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Member Status</Label>
        <div className="flex gap-2">
          <Select
            value={filters.status || undefined}
            onValueChange={(value) =>
              updateFilter("status", value as MemberStatus)
            }
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.status && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter("status")}
              className="h-10 w-10 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Join Date Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Join Date Range</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !filters.joinDateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.joinDateFrom
                  ? format(new Date(filters.joinDateFrom), "PPP")
                  : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  filters.joinDateFrom
                    ? new Date(filters.joinDateFrom)
                    : undefined
                }
                onSelect={(date) => handleDateChange("joinDateFrom", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !filters.joinDateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.joinDateTo
                  ? format(new Date(filters.joinDateTo), "PPP")
                  : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  filters.joinDateTo ? new Date(filters.joinDateTo) : undefined
                }
                onSelect={(date) => handleDateChange("joinDateTo", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Age Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Age Range</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Min age"
              value={filters.ageMin || ""}
              onChange={(e) => handleAgeChange("ageMin", e.target.value)}
              min="1"
              max="120"
            />
          </div>
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Max age"
              value={filters.ageMax || ""}
              onChange={(e) => handleAgeChange("ageMax", e.target.value)}
              min="1"
              max="120"
            />
          </div>
        </div>
      </div>

      {/* Membership Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Membership Type</Label>
        <div className="flex gap-2">
          <Select
            value={filters.membershipType || undefined}
            onValueChange={(value) => updateFilter("membershipType", value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              {MEMBERSHIP_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.membershipType && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter("membershipType")}
              className="h-10 w-10 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Payment Status */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Payment Status</Label>
        <div className="flex gap-2">
          <Select
            value={filters.paymentStatus || undefined}
            onValueChange={(value) =>
              updateFilter(
                "paymentStatus",
                value as "current" | "overdue" | "cancelled"
              )
            }
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.paymentStatus && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter("paymentStatus")}
              className="h-10 w-10 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Presets */}
      <Separator />
      <div className="space-y-2">
        <Label className="text-sm font-medium">Filter Presets</Label>
        <div className="space-y-2">
          {presets.map((preset) => (
            <div key={preset.name} className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPreset(preset.name)}
                className="flex-1 justify-start"
              >
                {preset.name}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deletePreset(preset.name)}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const name = prompt("Enter preset name:");
              if (name) savePreset(name);
            }}
            className="w-full"
            disabled={activeFilterCount === 0}
          >
            Save Current Filters
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={resetFilters}
          disabled={activeFilterCount === 0}
          className="flex-1"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );

  // Compact filter badges display
  const FilterBadges = () => {
    const badges = [];

    if (filters.status) {
      badges.push(
        <Badge key="status" variant="secondary" className="gap-1">
          Status: {filters.status}
          <X
            className="hover:text-destructive h-3 w-3 cursor-pointer"
            onClick={() => removeFilter("status")}
          />
        </Badge>
      );
    }

    if (filters.joinDateFrom || filters.joinDateTo) {
      const dateText =
        filters.joinDateFrom && filters.joinDateTo
          ? `${format(new Date(filters.joinDateFrom), "MMM dd")} - ${format(new Date(filters.joinDateTo), "MMM dd")}`
          : filters.joinDateFrom
            ? `From ${format(new Date(filters.joinDateFrom), "MMM dd")}`
            : `Until ${format(new Date(filters.joinDateTo!), "MMM dd")}`;

      badges.push(
        <Badge key="joinDate" variant="secondary" className="gap-1">
          Joined: {dateText}
          <X
            className="hover:text-destructive h-3 w-3 cursor-pointer"
            onClick={() => {
              removeFilter("joinDateFrom");
              removeFilter("joinDateTo");
            }}
          />
        </Badge>
      );
    }

    if (filters.ageMin || filters.ageMax) {
      const ageText =
        filters.ageMin && filters.ageMax
          ? `${filters.ageMin}-${filters.ageMax} years`
          : filters.ageMin
            ? `${filters.ageMin}+ years`
            : `Under ${filters.ageMax} years`;

      badges.push(
        <Badge key="age" variant="secondary" className="gap-1">
          Age: {ageText}
          <X
            className="hover:text-destructive h-3 w-3 cursor-pointer"
            onClick={() => {
              removeFilter("ageMin");
              removeFilter("ageMax");
            }}
          />
        </Badge>
      );
    }

    if (filters.membershipType) {
      badges.push(
        <Badge key="membership" variant="secondary" className="gap-1">
          Type: {filters.membershipType}
          <X
            className="hover:text-destructive h-3 w-3 cursor-pointer"
            onClick={() => removeFilter("membershipType")}
          />
        </Badge>
      );
    }

    if (filters.paymentStatus) {
      badges.push(
        <Badge key="payment" variant="secondary" className="gap-1">
          Payment: {filters.paymentStatus}
          <X
            className="hover:text-destructive h-3 w-3 cursor-pointer"
            onClick={() => removeFilter("paymentStatus")}
          />
        </Badge>
      );
    }

    return badges;
  };

  if (compact) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <FilterBadges />
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Members</SheetTitle>
              <SheetDescription>
                Apply filters to narrow down the member list
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 rounded-lg border p-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filter Members</h3>
        {activeFilterCount > 0 && (
          <Badge variant="secondary">
            {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}{" "}
            active
          </Badge>
        )}
      </div>
      <FilterContent />
    </div>
  );
}
