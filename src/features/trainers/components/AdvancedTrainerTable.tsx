import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  ChevronDown,
  UserCheck,
  DollarSign,
  Clock,
} from "lucide-react";
import { TrainerAvatar } from "./TrainerAvatar";
import { TrainerStatusBadge } from "./TrainerStatusBadge";
import {
  useTrainersInfinite,
  useBulkUpdateTrainerAvailability,
  useDeleteTrainer,
} from "@/features/trainers/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TrainerWithProfile } from "@/features/database/lib/types";
import type { TrainerFilters } from "@/features/database/lib/utils";

type SortField =
  | "name"
  | "hourly_rate"
  | "years_experience"
  | "is_accepting_new_clients";
type SortDirection = "asc" | "desc";

interface AdvancedTrainerTableProps {
  // Support both filtering and direct trainer list approaches
  filters?: TrainerFilters;
  trainers?: TrainerWithProfile[];
  isLoading?: boolean;
  error?: Error | null;
  onEdit?: (trainer: TrainerWithProfile) => void;
  onView?: (trainer: TrainerWithProfile) => void;
  onTrainerClick?: (trainer: TrainerWithProfile) => void;
  onTrainerHover?: (trainer: TrainerWithProfile) => void;
  enableInfiniteScroll?: boolean;
  showActions?: boolean;
  className?: string;
}

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const AdvancedTrainerTable = memo(function AdvancedTrainerTable({
  filters,
  trainers: propTrainers,
  isLoading: propIsLoading,
  error: propError,
  onEdit,
  onView,
  onTrainerClick,
  onTrainerHover,
  enableInfiniteScroll = true,
  showActions = true,
  className,
}: AdvancedTrainerTableProps) {
  const [selectedTrainers, setSelectedTrainers] = useState<Set<string>>(
    new Set()
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "name",
    direction: "asc",
  });
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    isOpen: boolean;
    action: "availability" | "delete" | null;
    newAvailability?: boolean;
  }>({ isOpen: false, action: null });

  // Enhanced filters with server-side sorting
  const enhancedFilters = useMemo(() => {
    const baseFilters = filters || {};

    // Map sortConfig to database sorting parameters
    const orderBy:
      | "name"
      | "email"
      | "hourly_rate"
      | "years_experience"
      | "is_accepting_new_clients"
      | undefined =
      sortConfig.field === "name"
        ? "name"
        : sortConfig.field === "hourly_rate"
          ? "hourly_rate"
          : sortConfig.field === "years_experience"
            ? "years_experience"
            : sortConfig.field === "is_accepting_new_clients"
              ? "is_accepting_new_clients"
              : undefined;

    return {
      ...baseFilters,
      orderBy,
      orderDirection: sortConfig.direction,
    };
  }, [filters, sortConfig]);

  // Use infinite query when filters are provided, otherwise use passed props
  const infiniteQuery = useTrainersInfinite(enhancedFilters, 20);

  // Determine data source based on what's provided
  const data = propTrainers ? { pages: [propTrainers] } : infiniteQuery.data;
  const fetchNextPage = infiniteQuery.fetchNextPage;
  const hasNextPage = enableInfiniteScroll && infiniteQuery.hasNextPage;
  const isFetchingNextPage = infiniteQuery.isFetchingNextPage;
  const isLoading = propIsLoading ?? infiniteQuery.isLoading;
  const isError = propError ? true : infiniteQuery.isError;
  const isFetching = infiniteQuery.isFetching;
  const refetch = infiniteQuery.refetch;

  const bulkUpdateAvailabilityMutation = useBulkUpdateTrainerAvailability();
  const deleteTrainerMutation = useDeleteTrainer();

  // Data is now sorted by the database, no need for client-side sorting
  const allTrainers = useMemo(() => {
    if (!data) return [];
    return data.pages.flat();
  }, [data]);

  const isAllSelected = useMemo(
    () =>
      allTrainers.length > 0 && selectedTrainers.size === allTrainers.length,
    [allTrainers.length, selectedTrainers.size]
  );
  const isPartiallySelected = useMemo(
    () =>
      selectedTrainers.size > 0 && selectedTrainers.size < allTrainers.length,
    [selectedTrainers.size, allTrainers.length]
  );

  const handleSort = useCallback((field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedTrainers(new Set());
    } else {
      setSelectedTrainers(new Set(allTrainers.map((trainer) => trainer.id)));
    }
  }, [isAllSelected, allTrainers]);

  const handleSelectTrainer = useCallback(
    (trainerId: string, checked: boolean) => {
      const newSelected = new Set(selectedTrainers);
      if (checked) {
        newSelected.add(trainerId);
      } else {
        newSelected.delete(trainerId);
      }
      setSelectedTrainers(newSelected);
    },
    [selectedTrainers]
  );

  const handleBulkAvailabilityUpdate = useCallback(
    async (isAccepting: boolean) => {
      try {
        await bulkUpdateAvailabilityMutation.mutateAsync({
          trainerIds: Array.from(selectedTrainers),
          isAccepting: isAccepting,
        });

        setSelectedTrainers(new Set());
        setBulkActionDialog({ isOpen: false, action: null });

        toast.success("Availability Updated", {
          description: `${selectedTrainers.size} trainers marked as ${isAccepting ? "accepting" : "not accepting"} new clients`,
        });
      } catch {
        toast.error("Update Failed", {
          description:
            "Failed to update trainer availability. Please try again.",
        });
      }
    },
    [selectedTrainers, bulkUpdateAvailabilityMutation]
  );

  const handleBulkDelete = useCallback(async () => {
    try {
      // Delete trainers one by one (could be optimized with batch delete)
      await Promise.all(
        Array.from(selectedTrainers).map((id) =>
          deleteTrainerMutation.mutateAsync(id)
        )
      );

      setSelectedTrainers(new Set());
      setBulkActionDialog({ isOpen: false, action: null });

      toast.success("Trainers Deleted", {
        description: `${selectedTrainers.size} trainers removed from the system`,
      });
    } catch {
      toast.error("Delete Failed", {
        description: "Failed to delete trainers. Please try again.",
      });
    }
  }, [selectedTrainers, deleteTrainerMutation]);

  const getSortIcon = useCallback(
    (field: SortField) => {
      if (sortConfig.field !== field) {
        return <ArrowUpDown className="h-4 w-4" />;
      }
      return sortConfig.direction === "asc" ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowDown className="h-4 w-4" />
      );
    },
    [sortConfig.field, sortConfig.direction]
  );

  const formatHourlyRate = useCallback((rate?: number) => {
    if (!rate) return "-";
    return `$${rate}`;
  }, []);

  const formatExperience = useCallback((years?: number) => {
    if (!years) return "-";
    return `${years}y`;
  }, []);

  // Auto-load more data when reaching bottom of table
  useEffect(() => {
    const handleScroll = () => {
      if (
        !enableInfiniteScroll ||
        !hasNextPage ||
        isFetchingNextPage ||
        isLoading
      ) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        fetchNextPage();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    enableInfiniteScroll,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    fetchNextPage,
  ]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load trainers.</p>
        <Button onClick={() => refetch()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  if (allTrainers.length === 0) {
    return (
      <div className="p-8 text-center">
        <UserCheck className="text-muted-foreground mx-auto h-12 w-12" />
        <h3 className="text-muted-foreground mt-2 text-sm font-semibold">
          No trainers found
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          No trainers match your current search criteria.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("rounded-md border", className)}>
        {selectedTrainers.size > 0 && (
          <div className="bg-muted/50 flex items-center justify-between border-b px-4 py-2">
            <p className="text-muted-foreground text-sm">
              {selectedTrainers.size} trainer
              {selectedTrainers.size === 1 ? "" : "s"} selected
            </p>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() =>
                      setBulkActionDialog({
                        isOpen: true,
                        action: "availability",
                        newAvailability: true,
                      })
                    }
                  >
                    Mark as Available
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setBulkActionDialog({
                        isOpen: true,
                        action: "availability",
                        newAvailability: false,
                      })
                    }
                  >
                    Mark as Unavailable
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setBulkActionDialog({ isOpen: true, action: "delete" })
                    }
                    className="text-red-600"
                  >
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTrainers(new Set())}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected || isPartiallySelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className={cn(
                    isPartiallySelected && "data-[state=checked]:bg-muted"
                  )}
                />
              </TableHead>
              <TableHead>Trainer</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Name
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead>Specializations</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("hourly_rate")}
              >
                <div className="flex items-center gap-1">
                  Rate
                  {getSortIcon("hourly_rate")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("years_experience")}
              >
                <div className="flex items-center gap-1">
                  Experience
                  {getSortIcon("years_experience")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("is_accepting_new_clients")}
              >
                <div className="flex items-center gap-1">
                  Status
                  {getSortIcon("is_accepting_new_clients")}
                </div>
              </TableHead>
              {showActions && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {allTrainers.map((trainer) => {
              const trainerWithProfile = trainer as TrainerWithProfile;
              return (
                <TableRow
                  key={trainer.id}
                  className={cn(
                    "hover:bg-muted/50 cursor-pointer",
                    selectedTrainers.has(trainer.id) && "bg-muted/50"
                  )}
                  onClick={() => onTrainerClick?.(trainerWithProfile)}
                  onMouseEnter={() => onTrainerHover?.(trainerWithProfile)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedTrainers.has(trainer.id)}
                      onCheckedChange={(checked) =>
                        handleSelectTrainer(trainer.id, !!checked)
                      }
                      aria-label={`Select trainer ${trainerWithProfile.user_profile?.first_name || ""} ${trainerWithProfile.user_profile?.last_name || ""}`}
                    />
                  </TableCell>
                  <TableCell>
                    <TrainerAvatar
                      trainer={trainerWithProfile}
                      size="sm"
                      showStatus
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {trainerWithProfile.user_profile?.first_name || "Unknown"}{" "}
                    {trainerWithProfile.user_profile?.last_name || "Trainer"}
                  </TableCell>
                  <TableCell>
                    {trainer.specializations &&
                    trainer.specializations.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {trainer.specializations
                          .slice(0, 2)
                          .map((spec, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {spec}
                            </Badge>
                          ))}
                        {trainer.specializations.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{trainer.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        None
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="text-muted-foreground h-3 w-3" />
                      {formatHourlyRate(trainer.hourly_rate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="text-muted-foreground h-3 w-3" />
                      {formatExperience(trainer.years_experience)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TrainerStatusBadge
                      isAcceptingNewClients={trainer.is_accepting_new_clients}
                      trainerId={trainer.id}
                      readonly={!showActions}
                    />
                  </TableCell>
                  {showActions && (
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onView?.(trainerWithProfile)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onEdit?.(trainerWithProfile)}
                          title="Edit Trainer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            setSelectedTrainers(new Set([trainer.id]));
                            setBulkActionDialog({
                              isOpen: true,
                              action: "delete",
                            });
                          }}
                          title="Delete Trainer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {(isFetching || isFetchingNextPage) && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">
              Loading trainers...
            </span>
          </div>
        )}
      </div>

      {/* Bulk Action Dialogs */}
      <AlertDialog
        open={bulkActionDialog.isOpen}
        onOpenChange={(open) =>
          !open && setBulkActionDialog({ isOpen: false, action: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkActionDialog.action === "delete"
                ? `Delete Trainer${selectedTrainers.size === 1 ? "" : "s"}`
                : "Update Availability"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkActionDialog.action === "delete"
                ? selectedTrainers.size === 1
                  ? (() => {
                      const selectedId = Array.from(selectedTrainers)[0];
                      const trainer = allTrainers.find(
                        (t) => t.id === selectedId
                      ) as TrainerWithProfile | undefined;
                      const trainerName = trainer?.user_profile
                        ? `${trainer.user_profile.first_name || ""} ${trainer.user_profile.last_name || ""}`.trim()
                        : "this trainer";
                      return `Are you sure you want to delete ${trainerName}? This action cannot be undone.`;
                    })()
                  : `Are you sure you want to delete ${selectedTrainers.size} trainers? This action cannot be undone.`
                : `Are you sure you want to mark ${selectedTrainers.size} trainer${selectedTrainers.size === 1 ? "" : "s"} as ${bulkActionDialog.newAvailability ? "accepting" : "not accepting"} new clients?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                bulkActionDialog.action === "delete"
                  ? handleBulkDelete
                  : () =>
                      handleBulkAvailabilityUpdate(
                        bulkActionDialog.newAvailability!
                      )
              }
              className={
                bulkActionDialog.action === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : undefined
              }
              disabled={
                bulkUpdateAvailabilityMutation.isPending ||
                deleteTrainerMutation.isPending
              }
            >
              {bulkUpdateAvailabilityMutation.isPending ||
              deleteTrainerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {bulkActionDialog.action === "delete"
                    ? "Deleting..."
                    : "Updating..."}
                </>
              ) : bulkActionDialog.action === "delete" ? (
                `Delete Trainer${selectedTrainers.size === 1 ? "" : "s"}`
              ) : (
                "Update Availability"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

export { AdvancedTrainerTable };
