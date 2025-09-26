"use client";

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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Columns,
  Download,
  RefreshCw,
  Grid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
  className?: string;
  mobileHidden?: boolean;
  width?: string;
}

interface TableAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (item: T) => void;
  variant?: "default" | "destructive" | "outline";
  hidden?: (item: T) => boolean;
}

interface EnhancedDataTableProps<T extends { id: string | number }> {
  data: T[];
  columns: Column<T>[];
  actions?: TableAction<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  pagination?: {
    pageSize: number;
    showSizeSelector?: boolean;
  };
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  mobileLayout?: "table" | "cards";
}

type SortConfig<T> = {
  key: keyof T | string;
  direction: "asc" | "desc";
} | null;

const EnhancedDataTable = memo(function EnhancedDataTable<
  T extends { id: string | number },
>({
  data,
  columns,
  actions = [],
  searchable = false,
  searchPlaceholder = "Search...",
  filterable = false,
  selectable = false,
  onSelectionChange,
  pagination,
  loading = false,
  error,
  emptyMessage = "No data available",
  title,
  subtitle,
  className,
  mobileLayout = "cards",
}: EnhancedDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(null);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 50);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.map((col) => col.key as string)
  );
  const [viewMode, setViewMode] = useState<"table" | "cards">(
    window.innerWidth < 768 ? mobileLayout : "table"
  );

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data;

    // Search filtering
    if (searchable && searchTerm) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof T];
        const bValue = b[sortConfig.key as keyof T];

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, searchable]);

  // Pagination
  const totalPages = useMemo(
    () => (pagination ? Math.ceil(processedData.length / pageSize) : 1),
    [pagination, processedData.length, pageSize]
  );
  const paginatedData = useMemo(
    () =>
      pagination
        ? processedData.slice(
            (currentPage - 1) * pageSize,
            currentPage * pageSize
          )
        : processedData,
    [pagination, processedData, currentPage, pageSize]
  );

  // Handlers
  const handleSort = useCallback(
    (key: keyof T | string) => {
      const column = columns.find((col) => col.key === key);
      if (!column?.sortable) return;

      setSortConfig((current) => {
        if (current?.key === key) {
          if (current.direction === "asc") {
            return { key, direction: "desc" };
          } else {
            return null; // Clear sort
          }
        } else {
          return { key, direction: "asc" };
        }
      });
    },
    [columns]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIds = paginatedData.map((item) => item.id);
        setSelectedIds(allIds);
        onSelectionChange?.(allIds);
      } else {
        setSelectedIds([]);
        onSelectionChange?.([]);
      }
    },
    [paginatedData, onSelectionChange]
  );

  const handleSelectItem = useCallback(
    (id: string | number, checked: boolean) => {
      const newSelected = checked
        ? [...selectedIds, id]
        : selectedIds.filter((selectedId) => selectedId !== id);

      setSelectedIds(newSelected);
      onSelectionChange?.(newSelected);
    },
    [selectedIds, onSelectionChange]
  );

  const getSortIcon = useCallback(
    (key: keyof T | string) => {
      if (sortConfig?.key === key) {
        return sortConfig.direction === "asc" ? ArrowUp : ArrowDown;
      }
      return ArrowUpDown;
    },
    [sortConfig]
  );

  const renderTableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedIds.length === paginatedData.length &&
                    paginatedData.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}

            {columns
              .filter((col) => visibleColumns.includes(col.key as string))
              .map((column) => {
                const SortIcon = getSortIcon(column.key);
                return (
                  <TableHead
                    key={column.key as string}
                    className={cn(
                      column.className,
                      column.sortable &&
                        "hover:bg-muted/50 cursor-pointer select-none",
                      column.mobileHidden && "hidden md:table-cell"
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && <SortIcon className="h-4 w-4" />}
                    </div>
                  </TableHead>
                );
              })}

            {actions.length > 0 && (
              <TableHead className="w-[50px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedData.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/50">
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={(checked) =>
                      handleSelectItem(item.id, checked as boolean)
                    }
                    aria-label={`Select row ${item.id}`}
                  />
                </TableCell>
              )}

              {columns
                .filter((col) => visibleColumns.includes(col.key as string))
                .map((column) => (
                  <TableCell
                    key={column.key as string}
                    className={cn(
                      column.className,
                      column.mobileHidden && "hidden md:table-cell"
                    )}
                  >
                    {column.render
                      ? column.render(item[column.key as keyof T], item)
                      : String(item[column.key as keyof T] || "")}
                  </TableCell>
                ))}

              {actions.length > 0 && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {actions
                        .filter((action) => !action.hidden?.(item))
                        .map((action, index) => (
                          <DropdownMenuItem
                            key={index}
                            onClick={() => action.onClick(item)}
                            className={cn(
                              action.variant === "destructive" &&
                                "text-destructive focus:text-destructive"
                            )}
                          >
                            {action.icon && (
                              <action.icon className="mr-2 h-4 w-4" />
                            )}
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderCardView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {paginatedData.map((item) => (
        <Card key={item.id} className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            {selectable && (
              <div className="mb-3 flex items-center space-x-2">
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={(checked) =>
                    handleSelectItem(item.id, checked as boolean)
                  }
                  aria-label={`Select ${item.id}`}
                />
              </div>
            )}

            <div className="space-y-2">
              {columns
                .filter((col) => visibleColumns.includes(col.key as string))
                .slice(0, 4) // Show first 4 columns in card view
                .map((column) => (
                  <div
                    key={column.key as string}
                    className="flex items-start justify-between"
                  >
                    <span className="text-muted-foreground min-w-0 flex-1 text-sm font-medium">
                      {column.label}:
                    </span>
                    <span className="ml-2 min-w-0 flex-1 text-right text-sm">
                      {column.render
                        ? column.render(item[column.key as keyof T], item)
                        : String(item[column.key as keyof T] || "")}
                    </span>
                  </div>
                ))}
            </div>

            {actions.length > 0 && (
              <div className="mt-4 flex gap-2 border-t pt-3">
                {actions
                  .filter((action) => !action.hidden?.(item))
                  .slice(0, 3) // Show first 3 actions directly
                  .map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      size="sm"
                      onClick={() => action.onClick(item)}
                      className="flex-1"
                    >
                      {action.icon && <action.icon className="mr-2 h-3 w-3" />}
                      {action.label}
                    </Button>
                  ))}

                {actions.length > 3 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {actions.slice(3).map((action, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => action.onClick(item)}
                        >
                          {action.icon && (
                            <action.icon className="mr-2 h-4 w-4" />
                          )}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="flex h-64 flex-col items-center justify-center space-y-4">
          <div className="text-destructive">Error loading data: {error}</div>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      {(title || subtitle || searchable || filterable) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {title && (
                  <CardTitle className="text-xl">
                    {title}{" "}
                    {data.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {processedData.length.toLocaleString()}
                      </Badge>
                    )}
                  </CardTitle>
                )}
                {subtitle && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {viewMode === "table" ? (
                          <List className="h-4 w-4" />
                        ) : (
                          <Grid className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setViewMode("table")}>
                        <List className="mr-2 h-4 w-4" />
                        Table View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setViewMode("cards")}>
                        <Grid className="mr-2 h-4 w-4" />
                        Card View
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Column Visibility */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Columns className="h-4 w-4" />
                      <span className="sr-only">Toggle columns</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {columns.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.key as string}
                        checked={visibleColumns.includes(column.key as string)}
                        onCheckedChange={(checked) => {
                          setVisibleColumns((prev) =>
                            checked
                              ? [...prev, column.key as string]
                              : prev.filter((key) => key !== column.key)
                          );
                        }}
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Export */}
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Export data</span>
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            {(searchable || filterable) && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {searchable && (
                  <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                )}

                {filterable && (
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
        </Card>
      )}

      {/* Data Display */}
      {processedData.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center space-y-2">
            <div className="text-muted-foreground">{emptyMessage}</div>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "table" ? renderTableView() : renderCardView()}

          {/* Pagination */}
          {pagination && totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 px-2 sm:flex-row">
              <div className="text-muted-foreground text-sm">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, processedData.length)} of{" "}
                {processedData.length} results
              </div>

              <div className="flex items-center gap-2">
                {pagination.showSizeSelector && (
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="text-sm">
                  Page {currentPage} of {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Selected Items Actions */}
      {selectable && selectedIds.length > 0 && (
        <Card className="border-primary">
          <CardContent className="flex items-center justify-between p-3">
            <span className="text-sm font-medium">
              {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""}{" "}
              selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Export Selected
              </Button>
              <Button variant="destructive" size="sm">
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}) as <T extends { id: string | number }>(
  props: EnhancedDataTableProps<T>
) => JSX.Element;

export { EnhancedDataTable };
