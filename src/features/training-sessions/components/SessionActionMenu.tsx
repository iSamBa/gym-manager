import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, X, Calendar } from "lucide-react";
import type { SessionHistoryEntry } from "../lib/types";

interface SessionActionMenuProps {
  session: SessionHistoryEntry;
  onView?: (session: SessionHistoryEntry) => void;
  onEdit?: (session: SessionHistoryEntry) => void;
  onCancel?: (session: SessionHistoryEntry) => void;
  onReschedule?: (session: SessionHistoryEntry) => void;
}

const SessionActionMenu: React.FC<SessionActionMenuProps> = ({
  session,
  onView,
  onEdit,
  onCancel,
  onReschedule,
}) => {
  const canEdit = session.status === "scheduled";
  const canCancel = session.status === "scheduled";
  const canReschedule = session.status === "scheduled";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onView && (
          <DropdownMenuItem onClick={() => onView(session)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        )}

        {canEdit && onEdit && (
          <DropdownMenuItem onClick={() => onEdit(session)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Session
          </DropdownMenuItem>
        )}

        {canReschedule && onReschedule && (
          <DropdownMenuItem onClick={() => onReschedule(session)}>
            <Calendar className="mr-2 h-4 w-4" />
            Reschedule
          </DropdownMenuItem>
        )}

        {(canEdit || canCancel || canReschedule) && <DropdownMenuSeparator />}

        {canCancel && onCancel && (
          <DropdownMenuItem
            onClick={() => onCancel(session)}
            className="text-destructive focus:text-destructive"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel Session
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SessionActionMenu;
