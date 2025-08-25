import React, { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  MoreHorizontal,
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

type SortField = "name" | "email" | "status" | "join_date" | "member_number";
type SortDirection = "asc" | "desc";

interface AdvancedMemberTableProps {
  filters: MemberFilters;
  onEdit?: (member: Member) => void;
  onView?: (member: Member) => void;
  showActions?: boolean;
  className?: string;
}

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export function AdvancedMemberTable({
  filters,
  onEdit,
  onView,
  showActions = true,
  className,
}: AdvancedMemberTableProps) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "name",
    direction: "asc",
  });
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    isOpen: boolean;
    action: "status" | "delete" | null;
    newStatus?: MemberStatus;
  }>({ isOpen: false, action: null });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useMembersInfinite(filters);

  const bulkUpdateMutation = useBulkUpdateMemberStatus();
  const deleteMemberMutation = useDeleteMember();

  const allMembers = data?.pages.flat() || [];
  const sortedMembers = [...allMembers].sort((a, b) => {
    const multiplier = sortConfig.direction === "asc" ? 1 : -1;

    switch (sortConfig.field) {
      case "name":
        return (
          multiplier *
          `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          )
        );
      case "email":
        return multiplier * a.email.localeCompare(b.email);
      case "status":
        return multiplier * a.status.localeCompare(b.status);
      case "join_date":
        return (
          multiplier * new Date(a.join_date).getTime() -
          new Date(b.join_date).getTime()
        );
      case "member_number":
        return multiplier * a.member_number.localeCompare(b.member_number);
      default:
        return 0;
    }
  });

  const isAllSelected =
    sortedMembers.length > 0 && selectedMembers.size === sortedMembers.length;
  const isPartiallySelected =
    selectedMembers.size > 0 && selectedMembers.size < sortedMembers.length;

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(sortedMembers.map((member) => member.id)));
    }
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    const newSelected = new Set(selectedMembers);
    if (checked) {
      newSelected.add(memberId);
    } else {
      newSelected.delete(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleBulkStatusUpdate = async (newStatus: MemberStatus) => {
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
  };

  const handleBulkDelete = async () => {
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
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
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
                <SortButton field="email">Contact</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="status">Status</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="member_number">Member #</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="join_date">Join Date</SortButton>
              </TableHead>
              {showActions && <TableHead className="w-[70px]"></TableHead>}
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
            ) : sortedMembers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 7 : 6}
                  className="py-12 text-center"
                >
                  <p className="text-muted-foreground">No members found</p>
                </TableCell>
              </TableRow>
            ) : (
              sortedMembers.map((member) => (
                <TableRow key={member.id}>
                  {showActions && (
                    <TableCell>
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
                    <div className="space-y-1">
                      <div className="text-sm">{member.email}</div>
                      <div className="text-muted-foreground text-xs">
                        {member.phone || "Not provided"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <MemberStatusBadge
                      status={member.status}
                      memberId={member.id}
                      readonly={!showActions}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {member.member_number}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatJoinDate(member.join_date)}
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView?.(member)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit?.(member)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleSelectMember(member.id, true)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Select for Deletion
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
    </div>
  );
}
