"use client";

import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";

export interface ColumnVisibility {
  gender: boolean;
  dateOfBirth: boolean;
  memberType: boolean;
  subscriptionEnd: boolean;
  lastSession: boolean;
  nextSession: boolean;
  remainingSessions: boolean;
  scheduledSessions: boolean;
  balanceDue: boolean;
  lastPayment: boolean;
}

export const DEFAULT_VISIBILITY: ColumnVisibility = {
  gender: true,
  dateOfBirth: true,
  memberType: true,
  subscriptionEnd: true,
  lastSession: true,
  nextSession: true,
  remainingSessions: true,
  scheduledSessions: true,
  balanceDue: true,
  lastPayment: true,
};

interface ColumnVisibilityToggleProps {
  onVisibilityChange?: (visibility: ColumnVisibility) => void;
  isAdmin?: boolean;
}

export const ColumnVisibilityToggle = memo(function ColumnVisibilityToggle({
  onVisibilityChange,
  isAdmin = true,
}: ColumnVisibilityToggleProps) {
  const [visibility, setVisibility] = useLocalStorage<ColumnVisibility>(
    "members-table-columns",
    DEFAULT_VISIBILITY
  );

  const handleToggle = useCallback(
    (column: keyof ColumnVisibility) => {
      const newVisibility = {
        ...visibility,
        [column]: !visibility[column],
      };
      setVisibility(newVisibility);
      onVisibilityChange?.(newVisibility);
    },
    [visibility, setVisibility, onVisibilityChange]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Columns className="h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem
          checked={visibility.gender}
          onCheckedChange={() => handleToggle("gender")}
        >
          Gender
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={visibility.dateOfBirth}
          onCheckedChange={() => handleToggle("dateOfBirth")}
        >
          Date of Birth
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={visibility.memberType}
          onCheckedChange={() => handleToggle("memberType")}
        >
          Member Type
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={visibility.subscriptionEnd}
          onCheckedChange={() => handleToggle("subscriptionEnd")}
        >
          Subscription End
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={visibility.lastSession}
          onCheckedChange={() => handleToggle("lastSession")}
        >
          Last Session
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={visibility.nextSession}
          onCheckedChange={() => handleToggle("nextSession")}
        >
          Next Session
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={visibility.remainingSessions}
          onCheckedChange={() => handleToggle("remainingSessions")}
        >
          Remaining Sessions
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={visibility.scheduledSessions}
          onCheckedChange={() => handleToggle("scheduledSessions")}
        >
          Scheduled Sessions
        </DropdownMenuCheckboxItem>

        {/* Admin-only columns */}
        {isAdmin && (
          <>
            <DropdownMenuCheckboxItem
              checked={visibility.balanceDue}
              onCheckedChange={() => handleToggle("balanceDue")}
            >
              Balance Due
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={visibility.lastPayment}
              onCheckedChange={() => handleToggle("lastPayment")}
            >
              Last Payment
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
