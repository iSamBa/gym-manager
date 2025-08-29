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
import { RotateCcw, UserCheck, UserX } from "lucide-react";
import { Label } from "@/components/ui/label";

// Import the filter interface from the hook to maintain consistency
import type { SimpleTrainerFilters } from "../hooks/use-simple-trainer-filters";

// Predefined filter options
const AVAILABILITY_OPTIONS = [
  { value: "all", label: "All Trainers", icon: null },
  { value: "accepting", label: "Accepting Clients", icon: UserCheck },
  { value: "not-accepting", label: "Not Accepting", icon: UserX },
] as const;

const SPECIALIZATION_OPTIONS = [
  { value: "all", label: "All Specializations" },
  { value: "personal-training", label: "Personal Training" },
  { value: "group-fitness", label: "Group Fitness" },
  { value: "yoga", label: "Yoga" },
  { value: "pilates", label: "Pilates" },
  { value: "nutrition", label: "Nutrition" },
  { value: "rehabilitation", label: "Rehabilitation" },
];

interface SimpleTrainerFiltersProps {
  filters: SimpleTrainerFilters;
  onFiltersChange: (filters: SimpleTrainerFilters) => void;
  className?: string;
}

export function SimpleTrainerFilters({
  filters,
  onFiltersChange,
  className,
}: SimpleTrainerFiltersProps) {
  const updateFilter = <K extends keyof SimpleTrainerFilters>(
    key: K,
    value: SimpleTrainerFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      status: "all",
      availability: "all",
      specialization: "all",
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.availability !== "all") count++;
    if (filters.specialization !== "all") count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Availability Filter */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium whitespace-nowrap">
            Availability:
          </Label>
          <Select
            value={filters.availability}
            onValueChange={(value) =>
              updateFilter(
                "availability",
                value as SimpleTrainerFilters["availability"]
              )
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY_OPTIONS.map((option) => {
                const IconComponent = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      {option.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Specialization Filter */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium whitespace-nowrap">
            Specialization:
          </Label>
          <Select
            value={filters.specialization}
            onValueChange={(value) =>
              updateFilter(
                "specialization",
                value as SimpleTrainerFilters["specialization"]
              )
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPECIALIZATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset
            </Button>
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
