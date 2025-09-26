"use client";

import type { MemberStatus } from "@/features/database/lib/types";

// Member filter state interface (simplified for basic usage)
export interface MemberFilterState {
  status?: MemberStatus | "all";
  search?: string;
  joinDateFrom?: Date;
  joinDateTo?: Date;
  membershipType?: string;
  paymentStatus?: string;
}

export interface MemberFiltersProps {
  onFiltersChange?: (filters: MemberFilterState) => void;
  className?: string;
  compact?: boolean;
}

// Simple stub component - actual filtering is handled by SimpleMemberFilters
export function MemberFilters({ className }: MemberFiltersProps) {
  return (
    <div className={className}>
      <p className="text-muted-foreground text-sm">
        Use SimpleMemberFilters for filtering functionality
      </p>
    </div>
  );
}
