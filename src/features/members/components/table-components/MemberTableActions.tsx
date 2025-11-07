import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, ChevronDown } from "lucide-react";
import type { MemberStatus } from "@/features/database/lib/types";

interface MemberTableActionsProps {
  selectedCount: number;
  onChangeStatus: (status: MemberStatus) => void;
  onDelete: () => void;
}

export const MemberTableActions = memo(function MemberTableActions({
  selectedCount,
  onChangeStatus,
  onDelete,
}: MemberTableActionsProps) {
  const handleSetActive = useCallback(() => {
    onChangeStatus("active");
  }, [onChangeStatus]);

  const handleSetInactive = useCallback(() => {
    onChangeStatus("inactive");
  }, [onChangeStatus]);

  const handleSetSuspended = useCallback(() => {
    onChangeStatus("suspended");
  }, [onChangeStatus]);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-muted flex items-center justify-between rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <span className="font-medium">
          {selectedCount} member{selectedCount !== 1 ? "s" : ""} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Change Status
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleSetActive}>
              Set Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSetInactive}>
              Set Inactive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSetSuspended}>
              Set Suspended
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete Selected
        </Button>
      </div>
    </div>
  );
});
