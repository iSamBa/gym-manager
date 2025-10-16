"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CopyPlus, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface BulkActionsToolbarProps {
  onApplyToWeekdays: () => void;
  onApplyToAllDays: () => void;
  onResetToDefaults: () => void;
  disabled?: boolean;
}

export const BulkActionsToolbar = memo(function BulkActionsToolbar({
  onApplyToWeekdays,
  onApplyToAllDays,
  onResetToDefaults,
  disabled = false,
}: BulkActionsToolbarProps) {
  const handleApplyToWeekdays = () => {
    onApplyToWeekdays();
    toast.success("Applied Monday hours to weekdays");
  };

  const handleApplyToAllDays = () => {
    onApplyToAllDays();
    toast.success("Applied Monday hours to all days");
  };

  const handleResetToDefaults = () => {
    onResetToDefaults();
    toast.success("Reset to default hours");
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="min-w-[180px]"
          >
            <Copy className="mr-2 h-4 w-4" />
            Apply Monday to...
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleApplyToWeekdays}>
            <Copy className="mr-2 h-4 w-4" />
            Weekdays (Tue-Fri)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleApplyToAllDays}>
            <CopyPlus className="mr-2 h-4 w-4" />
            All Days
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        onClick={handleResetToDefaults}
        disabled={disabled}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset to Defaults
      </Button>
    </div>
  );
});
