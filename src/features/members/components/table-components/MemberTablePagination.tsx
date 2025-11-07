import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

interface MemberTablePaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalCount: number;
  selectedCount: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: string) => void;
}

export const MemberTablePagination = memo(function MemberTablePagination({
  currentPage,
  totalPages,
  rowsPerPage,
  totalCount,
  selectedCount,
  onPageChange,
  onRowsPerPageChange,
}: MemberTablePaginationProps) {
  const handleFirstPage = useCallback(() => {
    onPageChange(1);
  }, [onPageChange]);

  const handlePreviousPage = useCallback(() => {
    onPageChange(Math.max(1, currentPage - 1));
  }, [onPageChange, currentPage]);

  const handleNextPage = useCallback(() => {
    onPageChange(Math.min(totalPages, currentPage + 1));
  }, [onPageChange, totalPages, currentPage]);

  const handleLastPage = useCallback(() => {
    onPageChange(totalPages);
  }, [onPageChange, totalPages]);

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <div className="text-muted-foreground text-sm">
        {selectedCount} of {totalCount || 0} row(s) selected.
      </div>

      <div className="flex items-center gap-6">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap">Rows per page</span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={onRowsPerPageChange}
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
          Page {currentPage} of {totalPages}
        </div>

        {/* Navigation buttons */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFirstPage}
                disabled={currentPage === 1}
              >
                First
              </Button>
            </PaginationItem>

            <PaginationPrevious
              onClick={handlePreviousPage}
              className={cn(
                currentPage === 1 && "pointer-events-none opacity-50"
              )}
            />

            <PaginationNext
              onClick={handleNextPage}
              className={cn(
                currentPage === totalPages && "pointer-events-none opacity-50"
              )}
            />

            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLastPage}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
});
