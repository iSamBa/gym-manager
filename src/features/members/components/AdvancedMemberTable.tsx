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
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  Users,
} from "lucide-react";
import { MemberAvatar } from "./MemberAvatar";
import { MemberStatusBadge } from "./MemberStatusBadge";
import {
  useMembersInfinite,
  useBulkUpdateMemberStatus,
  useDeleteMember,
} from "@/features/members/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Member, MemberStatus } from "@/features/database/lib/types";
import type { MemberFilters } from "@/features/database/lib/utils";

type SortField = "name" | "email" | "status" | "join_date" | "phone";
type SortDirection = "asc" | "desc";

interface AdvancedMemberTableProps {
  // Support both filtering and direct member list approaches
  filters?: MemberFilters;
  members?: Member[];
  isLoading?: boolean;
  error?: Error | null;
  onEdit?: (member: Member) => void;
  onView?: (member: Member) => void;
  onMemberClick?: (member: Member) => void;
  onMemberHover?: (member: Member) => void;
  enableInfiniteScroll?: boolean;
  showActions?: boolean;
  className?: string;
}

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const AdvancedMemberTable = memo(function AdvancedMemberTable({
  filters,
  members: propMembers,
  isLoading: propIsLoading,
  error: propError,
  onEdit,
  onView,
  onMemberClick,
  onMemberHover,
  enableInfiniteScroll = true,
  showActions = true,
  className,
}: AdvancedMemberTableProps) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "name",
    direction: "asc",
  });
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    isOpen: boolean;
    action: "status" | "delete" | null;
    newStatus?: MemberStatus;
  }>({ isOpen: false, action: null });

  // Enhanced filters with server-side sorting
  const enhancedFilters = useMemo(() => {
    const baseFilters = filters || {};

    // Map sortConfig to database sorting parameters
    const orderBy:
      | "name"
      | "email"
      | "status"
      | "join_date"
      | "phone"
      | undefined =
      sortConfig.field === "join_date"
        ? "join_date"
        : sortConfig.field === "name"
          ? "name"
          : sortConfig.field === "email"
            ? "email"
            : sortConfig.field === "status"
              ? "status"
              : sortConfig.field === "phone"
                ? "phone"
                : undefined;

    return {
      ...baseFilters,
      orderBy,
      orderDirection: sortConfig.direction,
    };
  }, [filters, sortConfig]);

  // Use infinite query when filters are provided, otherwise use passed props
  const infiniteQuery = useMembersInfinite(enhancedFilters, 20);

  // Determine data source based on what's provided
  const data = propMembers ? { pages: [propMembers] } : infiniteQuery.data;
  const fetchNextPage = infiniteQuery.fetchNextPage;
  const hasNextPage = enableInfiniteScroll && infiniteQuery.hasNextPage;
  const isFetchingNextPage = infiniteQuery.isFetchingNextPage;
  const isLoading = propIsLoading ?? infiniteQuery.isLoading;
  const isError = propError ? true : infiniteQuery.isError;
  const isFetching = infiniteQuery.isFetching;
  const refetch = infiniteQuery.refetch;

  const bulkUpdateMutation = useBulkUpdateMemberStatus();
  const deleteMemberMutation = useDeleteMember();

  // Data is now sorted by the database, no need for client-side sorting
  const allMembers = useMemo(() => {
    if (!data) return [];
    return data.pages.flat();
  }, [data]);

  const isAllSelected = useMemo(
    () => allMembers.length > 0 && selectedMembers.size === allMembers.length,
    [allMembers.length, selectedMembers.size]
  );
  const isPartiallySelected = useMemo(
    () => selectedMembers.size > 0 && selectedMembers.size < allMembers.length,
    [selectedMembers.size, allMembers.length]
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
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(allMembers.map((member) => member.id)));
    }
  }, [isAllSelected, allMembers]);

  const handleSelectMember = useCallback(
    (memberId: string, checked: boolean) => {
      const newSelected = new Set(selectedMembers);
      if (checked) {
        newSelected.add(memberId);
      } else {
        newSelected.delete(memberId);
      }
      setSelectedMembers(newSelected);
    },
    [selectedMembers]
  );

  const handleBulkStatusUpdate = useCallback(
    async (newStatus: MemberStatus) => {
      try {
        await bulkUpdateMutation.mutateAsync({
          memberIds: Array.from(selectedMembers),
          status: newStatus,
        });

        setSelectedMembers(new Set());
        setBulkActionDialog({ isOpen: false, action: null });

        toast.success("Status Updated", {
          description: `${selectedMembers.size} members updated to ${newStatus}`,
        });
      } catch {
        toast.error("Update Failed", {
          description: "Failed to update member statuses. Please try again.",
        });
      }
    },
    [selectedMembers, bulkUpdateMutation]
  );

  const handleBulkDelete = useCallback(async () => {
    try {
      // Delete members one by one (could be optimized with batch delete)
      await Promise.all(
        Array.from(selectedMembers).map((id) =>
          deleteMemberMutation.mutateAsync(id)
        )
      );

      setSelectedMembers(new Set());
      setBulkActionDialog({ isOpen: false, action: null });

      toast.success("Members Deleted", {
        description: `${selectedMembers.size} members have been deleted`,
      });
    } catch {
      toast.error("Delete Failed", {
        description: "Failed to delete members. Please try again.",
      });
    }
  }, [selectedMembers, deleteMemberMutation]);

  const handleSingleDelete = useCallback((member: Member) => {
    setMemberToDelete(member);
  }, []);

  const handleConfirmSingleDelete = useCallback(async () => {
    if (!memberToDelete) return;

    try {
      await deleteMemberMutation.mutateAsync(memberToDelete.id);

      toast.success("Member Deleted", {
        description: `${memberToDelete.first_name} ${memberToDelete.last_name} has been deleted`,
      });

      // Clear selection if the deleted member was selected
      const updatedSelection = new Set(selectedMembers);
      updatedSelection.delete(memberToDelete.id);
      setSelectedMembers(updatedSelection);
      setMemberToDelete(null);
    } catch {
      toast.error("Delete Failed", {
        description: "Failed to delete member. Please try again.",
      });
    }
  }, [memberToDelete, deleteMemberMutation, selectedMembers]);

  const formatJoinDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 1000 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const SortButton = memo(function SortButton({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium hover:bg-transparent"
        onClick={() => handleSort(field)}
      >
        <span className="flex items-center gap-1">
          {children}
          {sortConfig.field === field ? (
            sortConfig.direction === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          )}
        </span>
      </Button>
    );
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">Failed to load members</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Bulk Actions Bar */}
      {selectedMembers.size > 0 && (
        <div className="bg-muted flex items-center justify-between rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-medium">
              {selectedMembers.size} member
              {selectedMembers.size !== 1 ? "s" : ""} selected
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
                <DropdownMenuItem
                  onClick={() =>
                    setBulkActionDialog({
                      isOpen: true,
                      action: "status",
                      newStatus: "active",
                    })
                  }
                >
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setBulkActionDialog({
                      isOpen: true,
                      action: "status",
                      newStatus: "inactive",
                    })
                  }
                >
                  Set Inactive
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setBulkActionDialog({
                      isOpen: true,
                      action: "status",
                      newStatus: "suspended",
                    })
                  }
                >
                  Set Suspended
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                setBulkActionDialog({ isOpen: true, action: "delete" })
              }
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showActions && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    {...(isPartiallySelected && { "data-indeterminate": true })}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all members"
                  />
                </TableHead>
              )}
              <TableHead>
                <SortButton field="name">Member</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="email">Email</SortButton>
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>
                <SortButton field="status">Status</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="join_date">Join Date</SortButton>
              </TableHead>
              {showActions && (
                <TableHead className="w-[120px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 7 : 6}
                  className="py-12 text-center"
                >
                  <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                  <p className="text-muted-foreground">Loading members...</p>
                </TableCell>
              </TableRow>
            ) : allMembers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 7 : 6}
                  className="py-12 text-center"
                >
                  <p className="text-muted-foreground">No members found</p>
                </TableCell>
              </TableRow>
            ) : (
              allMembers.map((member) => (
                <TableRow
                  key={member.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => onMemberClick?.(member)}
                  onMouseEnter={() => onMemberHover?.(member)}
                >
                  {showActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedMembers.has(member.id)}
                        onCheckedChange={(checked) =>
                          handleSelectMember(member.id, !!checked)
                        }
                        aria-label={`Select ${member.first_name} ${member.last_name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <MemberAvatar member={member} size="sm" />
                      <span className="font-medium">
                        {member.first_name} {member.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{member.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-muted-foreground text-sm">
                      {member.phone || "Not provided"}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <MemberStatusBadge
                      status={member.status}
                      memberId={member.id}
                      readonly={!showActions}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatJoinDate(member.join_date)}
                  </TableCell>
                  {showActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView?.(member);
                          }}
                          className="h-8 w-8 p-0"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(member);
                          }}
                          className="h-8 w-8 p-0"
                          title="Edit Member"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleDelete(member);
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Delete Member"
                          disabled={deleteMemberMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Background Fetching Indicator */}
        {isFetching && !isLoading && (
          <div className="flex items-center justify-center border-t py-2">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-3 w-3 animate-spin" />
              Refreshing data...
            </div>
          </div>
        )}

        {/* Load More Button */}
        {hasNextPage && (
          <div className="flex justify-center border-t p-4">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More Members"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Action Confirmation Dialogs */}
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
                ? "Delete Members"
                : "Update Status"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkActionDialog.action === "delete" ? (
                <>
                  Are you sure you want to delete{" "}
                  <strong>{selectedMembers.size}</strong> member
                  {selectedMembers.size !== 1 ? "s" : ""}? This action cannot be
                  undone.
                </>
              ) : (
                <>
                  Are you sure you want to change the status of{" "}
                  <strong>{selectedMembers.size}</strong> member
                  {selectedMembers.size !== 1 ? "s" : ""} to{" "}
                  <strong>{bulkActionDialog.newStatus}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                bulkActionDialog.action === "delete"
                  ? handleBulkDelete
                  : () => handleBulkStatusUpdate(bulkActionDialog.newStatus!)
              }
              className={
                bulkActionDialog.action === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
              disabled={
                bulkUpdateMutation.isPending || deleteMemberMutation.isPending
              }
            >
              {bulkUpdateMutation.isPending ||
              deleteMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : bulkActionDialog.action === "delete" ? (
                "Delete Members"
              ) : (
                "Update Status"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Member Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
        onConfirm={handleConfirmSingleDelete}
        title="Delete Member"
        description={
          memberToDelete
            ? `Are you sure you want to delete ${memberToDelete.first_name} ${memberToDelete.last_name}? This action cannot be undone.`
            : ""
        }
        confirmText="Delete Member"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMemberMutation.isPending}
      />
    </div>
  );
});

export { AdvancedMemberTable };
