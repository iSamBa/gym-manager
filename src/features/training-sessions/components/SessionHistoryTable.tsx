import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Download,
  Search,
  Clock,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getSessionStatusColor, getSessionCategoryColor } from "../lib/utils";
import { exportToCSV, exportToPDF } from "../lib/export-utils";
import type { SessionHistoryEntry } from "../lib/types";

const columnHelper = createColumnHelper<SessionHistoryEntry>();

interface SessionHistoryTableProps {
  sessions: SessionHistoryEntry[];
  showSelectionColumn?: boolean;
  showTrainerColumn?: boolean;
  showMemberColumn?: boolean;
  onSessionClick?: (session: SessionHistoryEntry) => void;
  onExport?: (sessions: SessionHistoryEntry[], format: "csv" | "pdf") => void;
  onBulkAction?: (sessions: SessionHistoryEntry[], action: string) => void;
  isLoading?: boolean;
}

const SessionHistoryTable: React.FC<SessionHistoryTableProps> = ({
  sessions,
  showSelectionColumn = false,
  showTrainerColumn = true,
  onSessionClick,
  onExport,
  onBulkAction,
  isLoading = false,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<SessionHistoryEntry, any>[] = [];

    // Selection column
    if (showSelectionColumn) {
      cols.push(
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        })
      );
    }

    // Date column
    cols.push(
      columnHelper.display({
        id: "date",
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
            >
              Date
              {isSorted === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = row.original.scheduled_start;
          return (
            <div className="font-medium">
              {format(new Date(date), "MMM dd, yyyy")}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.scheduled_start);
          const dateB = new Date(rowB.original.scheduled_start);
          return dateA.getTime() - dateB.getTime();
        },
      })
    );

    // Time column
    cols.push(
      columnHelper.display({
        id: "time",
        header: "Time",
        cell: ({ row }) => {
          const start = row.original.scheduled_start;
          const end = row.original.scheduled_end;
          return (
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(start), "HH:mm")} -{" "}
                {format(new Date(end), "HH:mm")}
              </span>
            </div>
          );
        },
        enableSorting: false,
      })
    );

    // Category column
    cols.push(
      columnHelper.accessor("session_category", {
        id: "category",
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
            >
              Category
              {isSorted === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ getValue }) => {
          const category = getValue();
          return (
            <Badge className={getSessionCategoryColor(category)}>
              {category}
            </Badge>
          );
        },
      })
    );

    // Status column
    cols.push(
      columnHelper.accessor("status", {
        id: "status",
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
            >
              Status
              {isSorted === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <Badge className={getSessionStatusColor(status)}>{status}</Badge>
          );
        },
      })
    );

    // Trainer column
    if (showTrainerColumn) {
      cols.push(
        columnHelper.accessor("trainer_name", {
          id: "trainer",
          header: ({ column }) => {
            const isSorted = column.getIsSorted();
            return (
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="h-auto p-0 font-medium"
              >
                Trainer
                {isSorted === "asc" ? (
                  <ArrowUp className="ml-2 h-4 w-4" />
                ) : isSorted === "desc" ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                )}
              </Button>
            );
          },
          cell: ({ getValue }) => (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="font-medium">{getValue()}</span>
            </div>
          ),
        })
      );
    }

    // Participants column
    cols.push(
      columnHelper.display({
        id: "participants",
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
            >
              Participants
              {isSorted === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const session = row.original;
          const count = session.participant_count || 0;
          return (
            <div className="text-center">
              {count === 1 ? "1 member" : "Empty"}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const rateA = rowA.original.participant_count || 0;
          const rateB = rowB.original.participant_count || 0;
          return rateA - rateB;
        },
      })
    );

    // Attendance column
    cols.push(
      columnHelper.display({
        id: "attendance",
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
            >
              Attendance
              {isSorted === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const session = row.original;
          const attendanceRate = session.attendance_rate || 0;
          return (
            <div className="text-center">
              <span
                className={cn(
                  "font-medium",
                  attendanceRate >= 80
                    ? "text-green-600"
                    : attendanceRate >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                )}
              >
                {Math.round(attendanceRate)}%
              </span>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const rateA = rowA.original.attendance_rate || 0;
          const rateB = rowB.original.attendance_rate || 0;
          return rateA - rateB;
        },
      })
    );

    // Duration column
    cols.push(
      columnHelper.accessor("duration_minutes", {
        id: "duration",
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
            >
              Duration
              {isSorted === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue()} min</span>
        ),
      })
    );

    // Actions column
    cols.push(
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const session = row.original;
          const canEdit = session.status === "scheduled";
          const canCancel = session.status === "scheduled";

          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSessionClick?.(session)}
                className="h-8 px-2"
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">View session</span>
              </Button>

              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSessionClick?.(session)}
                  className="h-8 px-2"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit session</span>
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Handle cancel action
                    console.log("Cancel session:", session);
                  }}
                  className="text-destructive hover:text-destructive h-8 px-2"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cancel session</span>
                </Button>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      })
    );

    return cols;
  }, [showSelectionColumn, showTrainerColumn, onSessionClick]);

  const table = useReactTable({
    data: sessions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  const selectedSessions = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);

  const handleExport = (format: "csv" | "pdf") => {
    const sessionsToExport =
      Object.keys(rowSelection).length > 0
        ? selectedSessions
        : table.getFilteredRowModel().rows.map((row) => row.original);

    if (onExport) {
      onExport(sessionsToExport, format);
    } else {
      // Default export behavior
      if (format === "csv") {
        exportToCSV(sessionsToExport);
      } else {
        exportToPDF(sessionsToExport);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
        <div className="bg-muted h-64 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-print-table>
      {/* Table Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Global Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search sessions..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-64 pl-8"
            />
          </div>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="no-print">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          {selectedSessions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {selectedSessions.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction?.(selectedSessions, "cancel")}
                className="no-print"
              >
                Cancel Selected
              </Button>
            </div>
          )}

          {/* Export Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="no-print">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={(e) => {
                    // Only trigger row click if not clicking on selection checkbox or action menu
                    const target = e.target as HTMLElement;
                    if (
                      !target.closest('[role="checkbox"]') &&
                      !target.closest('[role="button"]') &&
                      !showSelectionColumn
                    ) {
                      onSessionClick?.(row.original);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No sessions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="no-print flex items-center justify-between px-2">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="border-input bg-background h-8 w-[70px] rounded border px-3 py-2 text-sm"
            >
              {[25, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              {"<<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              {"<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              {">"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              {">>"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionHistoryTable;
