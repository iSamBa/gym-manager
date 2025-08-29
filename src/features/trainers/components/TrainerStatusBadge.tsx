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
import { ChevronDown, Loader2, UserCheck, UserX } from "lucide-react";
import { useUpdateTrainerAvailability } from "@/features/trainers/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TrainerStatusBadgeProps {
  isAcceptingNewClients: boolean;
  trainerId: string;
  readonly?: boolean;
  onStatusChange?: (isAccepting: boolean) => void;
  className?: string;
}

const statusConfig = {
  available: {
    label: "Available",
    icon: UserCheck,
    color:
      "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300",
  },
  unavailable: {
    label: "Unavailable",
    icon: UserX,
    color:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300",
  },
} as const;

export function TrainerStatusBadge({
  isAcceptingNewClients,
  trainerId,
  readonly = false,
  onStatusChange,
  className,
}: TrainerStatusBadgeProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    newStatus: boolean | null;
  }>({ isOpen: false, newStatus: null });

  const updateAvailabilityMutation = useUpdateTrainerAvailability();

  const currentStatus = isAcceptingNewClients ? "available" : "unavailable";
  const config = statusConfig[currentStatus];
  const IconComponent = config.icon;

  const handleStatusChange = async (newStatus: boolean) => {
    if (!newStatus) {
      // Confirm when making trainer unavailable
      setConfirmDialog({ isOpen: true, newStatus });
      return;
    }

    await executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus: boolean) => {
    try {
      await updateAvailabilityMutation.mutateAsync({
        id: trainerId,
        isAccepting: newStatus,
      });

      onStatusChange?.(newStatus);

      toast.success("Availability Updated", {
        description: `Trainer is now ${newStatus ? "accepting" : "not accepting"} new clients`,
      });
    } catch {
      toast.error("Update Failed", {
        description: "Failed to update trainer availability. Please try again.",
      });
    }
  };

  const handleConfirmStatusChange = async () => {
    if (confirmDialog.newStatus !== null) {
      await executeStatusChange(confirmDialog.newStatus);
    }
    setConfirmDialog({ isOpen: false, newStatus: null });
  };

  // Readonly colors without hover effects
  const readonlyColors = {
    available:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    unavailable:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  } as const;

  if (readonly) {
    return (
      <Badge
        className={cn(
          readonlyColors[currentStatus],
          "cursor-default",
          className
        )}
        variant="secondary"
      >
        <IconComponent className="mr-1 h-3 w-3" />
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
              !updateAvailabilityMutation.isPending && "hover:bg-transparent",
              className
            )}
            disabled={updateAvailabilityMutation.isPending}
          >
            <Badge
              className={cn(config.color, "cursor-pointer")}
              variant="secondary"
            >
              {updateAvailabilityMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <IconComponent className="mr-1 h-3 w-3" />
              )}
              {config.label}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Badge>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => handleStatusChange(true)}
            className="cursor-pointer"
            disabled={isAcceptingNewClients}
          >
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
            Available for New Clients
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleStatusChange(false)}
            className="cursor-pointer"
            disabled={!isAcceptingNewClients}
          >
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gray-500" />
            Not Accepting New Clients
          </DropdownMenuItem>
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
            <AlertDialogTitle>Confirm Availability Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this trainer as not accepting new
              clients? They won&apos;t appear in available trainer lists until
              changed back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusChange}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Mark Unavailable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
