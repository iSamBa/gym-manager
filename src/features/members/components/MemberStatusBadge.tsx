import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, Loader2 } from "lucide-react";
import { useUpdateMemberStatus } from "@/features/members/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MemberStatus } from "@/features/database/lib/types";

interface MemberStatusBadgeProps {
  status: MemberStatus;
  memberId: string;
  readonly?: boolean;
  onStatusChange?: (newStatus: MemberStatus) => void;
  className?: string;
}

const statusConfig = {
  active: {
    label: "Active",
    color:
      "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300",
  },
  inactive: {
    label: "Inactive",
    color:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300",
  },
  suspended: {
    label: "Suspended",
    color:
      "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300",
  },
  expired: {
    label: "Expired",
    color:
      "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300",
  },
  pending: {
    label: "Pending",
    color:
      "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300",
  },
} as const;

const statusTransitions: Record<MemberStatus, MemberStatus[]> = {
  active: ["inactive", "suspended", "pending"],
  inactive: ["active", "suspended", "pending"],
  suspended: ["active", "inactive", "pending"],
  expired: ["active", "pending"],
  pending: ["active", "inactive", "suspended"],
};

export function MemberStatusBadge({
  status,
  memberId,
  readonly = false,
  onStatusChange,
  className,
}: MemberStatusBadgeProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    newStatus: MemberStatus | null;
  }>({ isOpen: false, newStatus: null });

  const updateStatusMutation = useUpdateMemberStatus();

  const config = statusConfig[status];
  const availableTransitions = statusTransitions[status];

  const handleStatusChange = async (newStatus: MemberStatus) => {
    if (newStatus === "suspended") {
      setConfirmDialog({ isOpen: true, newStatus });
      return;
    }

    await executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus: MemberStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: memberId,
        status: newStatus,
      });

      onStatusChange?.(newStatus);

      toast.success("Status Updated", {
        description: `Member status changed to ${statusConfig[newStatus].label}`,
      });
    } catch {
      toast.error("Status Update Failed", {
        description: "Failed to update member status. Please try again.",
      });
    }
  };

  const handleConfirmStatusChange = async () => {
    if (confirmDialog.newStatus) {
      await executeStatusChange(confirmDialog.newStatus);
    }
    setConfirmDialog({ isOpen: false, newStatus: null });
  };

  // Use same custom colors as interactive badges, but without hover effects for readonly mode
  const readonlyColors = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    expired:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  } as const;

  if (readonly) {
    return (
      <Badge
        className={cn(readonlyColors[status], "cursor-default", className)}
        variant="secondary"
      >
        {config.label}
      </Badge>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-auto p-0 font-medium",
              !updateStatusMutation.isPending && "hover:bg-transparent",
              className
            )}
            disabled={updateStatusMutation.isPending}
          >
            <Badge
              className={cn(config.color, "cursor-pointer")}
              variant="secondary"
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : null}
              {config.label}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Badge>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          {availableTransitions.map((newStatus) => (
            <DropdownMenuItem
              key={newStatus}
              onClick={() => handleStatusChange(newStatus)}
              className="cursor-pointer"
            >
              <span
                className={cn("mr-2 inline-block h-2 w-2 rounded-full", {
                  "bg-green-500": newStatus === "active",
                  "bg-gray-500": newStatus === "inactive",
                  "bg-red-500": newStatus === "suspended",
                  "bg-orange-500": newStatus === "expired",
                  "bg-yellow-500": newStatus === "pending",
                })}
              />
              {statusConfig[newStatus].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ isOpen: false, newStatus: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend this member? This action will
              prevent them from accessing gym facilities.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusChange}
              className="bg-red-600 hover:bg-red-700"
            >
              Suspend Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
