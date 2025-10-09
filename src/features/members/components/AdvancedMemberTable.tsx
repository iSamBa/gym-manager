import React, { useState, useMemo, useCallback, memo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  ChevronDown,
  Users,
} from "lucide-react";
import { MemberAvatar } from "./MemberAvatar";
import { MemberStatusBadge } from "./MemberStatusBadge";
import { DateCell, SessionCountBadge, MemberTypeBadge } from "./cells";
import { AddSessionButton } from "./AddSessionButton";
import { AddPaymentButton } from "./AddPaymentButton";
import {
  useMembers,
  useMemberCount,
  useBulkUpdateMemberStatus,
  useDeleteMember,
} from "@/features/members/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  MemberStatus,
  MemberWithEnhancedDetails,
} from "@/features/database/lib/types";
import type { MemberFilters } from "@/features/database/lib/utils";
import type { ColumnVisibility } from "./ColumnVisibilityToggle";
import { DEFAULT_VISIBILITY } from "./ColumnVisibilityToggle";

type SortField =
  | "name"
  | "email"
  | "status"
  | "phone"
  | "gender"
  | "date_of_birth"
  | "member_type"
  | "subscription_end_date"
  | "balance_due"
  | "last_payment_date";
type SortDirection = "asc" | "desc";

// US-003: Balance display utilities
interface BalanceStyles {
  backgroundColor: string;
  textColor: string;
}

function getBalanceStyles(balance: number): BalanceStyles {
  if (balance > 0) {
    // Positive balance = member OWES money = red (outstanding debt)
    return {
      backgroundColor: "bg-red-50",
      textColor: "text-red-700",
    };
  } else if (balance < 0) {
    // Negative balance = member OVERPAID = green (credit to member)
    return {
      backgroundColor: "bg-green-50",
      textColor: "text-green-700",
    };
  } else {
    // Zero balance = fully paid = gray (neutral)
    return {
      backgroundColor: "bg-gray-50",
      textColor: "text-gray-600",
    };
  }
}

function formatBalance(balance: number): string {
  const absBalance = Math.abs(balance);
  const formatted = absBalance.toFixed(2);

  if (balance < 0) {
    return `-$${formatted}`;
  }
  return `$${formatted}`;
}

interface AdvancedMemberTableProps {
  // Support both filtering and direct member list approaches
  filters?: MemberFilters;
  members?: MemberWithEnhancedDetails[];
  isLoading?: boolean;
  error?: Error | null;
  onMemberClick?: (member: MemberWithEnhancedDetails) => void;
  onMemberHover?: (member: MemberWithEnhancedDetails) => void;
  showActions?: boolean;
  className?: string;
  columnVisibility?: ColumnVisibility | null;
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
  onMemberClick,
  onMemberHover,
  showActions = true,
  className,
  columnVisibility: propColumnVisibility,
}: AdvancedMemberTableProps) {
  // Use provided visibility or default
  const columnVisibility = propColumnVisibility || DEFAULT_VISIBILITY;
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

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Enhanced filters with server-side sorting and pagination
  const enhancedFilters = useMemo(() => {
    const baseFilters = filters || {};

    // Map sortConfig to database sorting parameters
    const orderBy: "name" | "email" | "status" | "phone" | undefined =
      sortConfig.field === "name"
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
      limit: rowsPerPage,
      offset: (page - 1) * rowsPerPage,
    };
  }, [filters, sortConfig, page, rowsPerPage]);

  // Use page-based query or props
  const membersQuery = useMembers(enhancedFilters);
  const { data: totalCount } = useMemberCount();

  // Determine data source based on what's provided
  const isLoading = propIsLoading ?? membersQuery.isLoading;
  const isError = propError ? true : membersQuery.isError;
  const isFetching = membersQuery.isFetching;
  const refetch = membersQuery.refetch;

  // Calculate pagination values
  const totalPages = totalCount ? Math.ceil(totalCount / rowsPerPage) : 1;

  const bulkUpdateMutation = useBulkUpdateMemberStatus();
  const deleteMemberMutation = useDeleteMember();

  // Data is now sorted by the database, no need for client-side sorting
  const allMembers = useMemo(() => {
    if (propMembers) return propMembers;
    return membersQuery.data || [];
  }, [propMembers, membersQuery.data]);

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

  // Pagination handlers
  const handleRowsPerPageChange = useCallback((value: string) => {
    setRowsPerPage(Number(value));
    setPage(1); // Reset to first page when changing rows per page
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top on page change
  }, []);

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
              <TableHead className="min-w-[200px]">
                <SortButton field="name">Member</SortButton>
              </TableHead>
              <TableHead>Phone</TableHead>

              {/* NEW COLUMNS - Gender & DOB */}
              {columnVisibility.gender && (
                <TableHead className="hidden xl:table-cell">
                  <SortButton field="gender">Gender</SortButton>
                </TableHead>
              )}
              {columnVisibility.dateOfBirth && (
                <TableHead className="hidden xl:table-cell">
                  <SortButton field="date_of_birth">DOB</SortButton>
                </TableHead>
              )}

              {/* NEW COLUMN - Member Type */}
              {columnVisibility.memberType && (
                <TableHead>
                  <SortButton field="member_type">Type</SortButton>
                </TableHead>
              )}

              <TableHead>
                <SortButton field="status">Status</SortButton>
              </TableHead>

              {/* NEW COLUMNS - Subscription & Sessions */}
              {columnVisibility.subscriptionEnd && (
                <TableHead className="hidden lg:table-cell">
                  <SortButton field="subscription_end_date">Sub End</SortButton>
                </TableHead>
              )}
              {columnVisibility.lastSession && (
                <TableHead className="hidden lg:table-cell">
                  Last Session
                </TableHead>
              )}
              {columnVisibility.nextSession && (
                <TableHead className="hidden lg:table-cell">
                  Next Session
                </TableHead>
              )}
              {columnVisibility.remainingSessions && (
                <TableHead className="hidden lg:table-cell">
                  Remaining
                </TableHead>
              )}
              {columnVisibility.scheduledSessions && (
                <TableHead className="hidden lg:table-cell">
                  Scheduled
                </TableHead>
              )}
              {columnVisibility.balanceDue && (
                <TableHead className="hidden lg:table-cell">
                  <SortButton field="balance_due">Balance Due</SortButton>
                </TableHead>
              )}
              {columnVisibility.lastPayment && (
                <TableHead className="hidden xl:table-cell">
                  <SortButton field="last_payment_date">
                    Last Payment
                  </SortButton>
                </TableHead>
              )}

              {showActions && (
                <TableHead className="w-[120px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 15 : 14}
                  className="py-12 text-center"
                >
                  <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                  <p className="text-muted-foreground">Loading members...</p>
                </TableCell>
              </TableRow>
            ) : allMembers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 15 : 14}
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
                    <div className="text-muted-foreground text-sm">
                      {member.phone || "-"}
                    </div>
                  </TableCell>

                  {/* Gender */}
                  {columnVisibility.gender && (
                    <TableCell className="hidden xl:table-cell">
                      <span className="text-sm capitalize">
                        {member.gender || "-"}
                      </span>
                    </TableCell>
                  )}

                  {/* Date of Birth */}
                  {columnVisibility.dateOfBirth && (
                    <TableCell className="hidden xl:table-cell">
                      <DateCell date={member.date_of_birth || null} />
                    </TableCell>
                  )}

                  {/* Member Type */}
                  {columnVisibility.memberType && (
                    <TableCell>
                      <MemberTypeBadge
                        type={member.member_type as "full" | "trial"}
                      />
                    </TableCell>
                  )}

                  {/* Status */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <MemberStatusBadge
                      status={member.status}
                      memberId={member.id}
                      readonly={!showActions}
                    />
                  </TableCell>

                  {/* Subscription End Date */}
                  {columnVisibility.subscriptionEnd && (
                    <TableCell className="hidden lg:table-cell">
                      <DateCell
                        date={member.active_subscription?.end_date || null}
                      />
                    </TableCell>
                  )}

                  {/* Last Session */}
                  {columnVisibility.lastSession && (
                    <TableCell className="hidden lg:table-cell">
                      <DateCell
                        date={member.session_stats?.last_session_date || null}
                        format="short"
                      />
                    </TableCell>
                  )}

                  {/* Next Session */}
                  {columnVisibility.nextSession && (
                    <TableCell className="hidden lg:table-cell">
                      <DateCell
                        date={member.session_stats?.next_session_date || null}
                        format="short"
                      />
                    </TableCell>
                  )}

                  {/* Remaining Sessions */}
                  {columnVisibility.remainingSessions && (
                    <TableCell className="hidden lg:table-cell">
                      <SessionCountBadge
                        count={
                          member.active_subscription?.remaining_sessions || 0
                        }
                        showTooltip={false}
                        colorVariant="yellow"
                      />
                    </TableCell>
                  )}

                  {/* Scheduled Sessions */}
                  {columnVisibility.scheduledSessions && (
                    <TableCell className="hidden lg:table-cell">
                      <SessionCountBadge
                        count={
                          member.session_stats?.scheduled_sessions_count || 0
                        }
                        showTooltip={false}
                      />
                    </TableCell>
                  )}

                  {/* Balance Due */}
                  {columnVisibility.balanceDue && (
                    <TableCell className="hidden lg:table-cell">
                      {(() => {
                        const balance =
                          member.active_subscription?.balance_due || 0;
                        const styles = getBalanceStyles(balance);
                        return (
                          <div
                            className={cn(
                              "inline-block rounded-md px-3 py-1 text-sm font-medium",
                              styles.backgroundColor,
                              styles.textColor
                            )}
                          >
                            {formatBalance(balance)}
                          </div>
                        );
                      })()}
                    </TableCell>
                  )}

                  {/* Last Payment */}
                  {columnVisibility.lastPayment && (
                    <TableCell className="hidden xl:table-cell">
                      <DateCell date={member.last_payment_date} />
                    </TableCell>
                  )}

                  {showActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-1">
                        <AddSessionButton
                          member={member}
                          onSuccess={() => refetch()}
                          variant="ghost"
                          size="sm"
                        />
                        <AddPaymentButton
                          member={member}
                          onSuccess={() => refetch()}
                          variant="ghost"
                          size="sm"
                        />
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
      </div>

      {/* Pagination Component */}
      {!isLoading && allMembers.length > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="text-muted-foreground text-sm">
            {selectedMembers.size} of {totalCount || 0} row(s) selected.
          </div>

          <div className="flex items-center gap-6">
            {/* Rows per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">Rows per page</span>
              <Select
                value={String(rowsPerPage)}
                onValueChange={handleRowsPerPageChange}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page indicator */}
            <div className="text-sm whitespace-nowrap">
              Page {page} of {totalPages}
            </div>

            {/* Navigation buttons */}
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1}
                  >
                    First
                  </Button>
                </PaginationItem>

                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  className={cn(page === 1 && "pointer-events-none opacity-50")}
                />

                <PaginationNext
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, page + 1))
                  }
                  className={cn(
                    page === totalPages && "pointer-events-none opacity-50"
                  )}
                />

                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={page === totalPages}
                  >
                    Last
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

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
});

export { AdvancedMemberTable };
