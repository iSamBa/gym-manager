/**
 * Dashboard section showing members with active subscriptions
 * but no session bookings in the selected week
 */

import { memo, useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { AlertCircle, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { SessionCountBadge } from "@/features/members/components/cells";
import { useMembersWithoutReservations } from "../hooks/use-members-without-reservations";
import {
  getCurrentWeekNumber,
  getCurrentYear,
  getWeeksInYear,
  getWeekBoundsForWeekNumber,
  getAvailableYears,
} from "../lib/week-selector-utils";

export const MembersWithoutReservationsCard = memo(
  function MembersWithoutReservationsCard() {
    // Week/Year selection state
    const [selectedWeek, setSelectedWeek] = useState<number>(
      getCurrentWeekNumber()
    );
    const [selectedYear, setSelectedYear] = useState<number>(getCurrentYear());

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const rowsPerPage = 10;

    // Bulk selection state
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
      new Set()
    );

    // Get week bounds based on selected week and year
    const { week_start, week_end } = useMemo(
      () => getWeekBoundsForWeekNumber(selectedWeek, selectedYear),
      [selectedWeek, selectedYear]
    );

    // Fetch members without reservations for the selected week
    const {
      data: members,
      isLoading,
      isError,
    } = useMembersWithoutReservations({
      weekStart: week_start,
      weekEnd: week_end,
    });

    // Paginate members
    const paginatedMembers = useMemo(() => {
      if (!members) return [];
      const startIndex = currentPage * rowsPerPage;
      return members.slice(startIndex, startIndex + rowsPerPage);
    }, [members, currentPage, rowsPerPage]);

    // Pagination calculations
    const totalPages = Math.ceil((members?.length || 0) / rowsPerPage);
    const hasNextPage = currentPage < totalPages - 1;
    const hasPrevPage = currentPage > 0;
    const showingStart =
      members && members.length > 0 ? currentPage * rowsPerPage + 1 : 0;
    const showingEnd = Math.min(
      (currentPage + 1) * rowsPerPage,
      members?.length || 0
    );

    // Bulk selection logic
    const isAllSelected = useMemo(
      () =>
        paginatedMembers.length > 0 &&
        paginatedMembers.every((m) => selectedMembers.has(m.id)),
      [paginatedMembers, selectedMembers]
    );

    const isPartiallySelected = useMemo(
      () =>
        paginatedMembers.some((m) => selectedMembers.has(m.id)) &&
        !isAllSelected,
      [paginatedMembers, selectedMembers, isAllSelected]
    );

    // Generate week options with date ranges for the selected year
    const weekOptions = useMemo(() => {
      const totalWeeks = getWeeksInYear(selectedYear);
      return Array.from({ length: totalWeeks }, (_, i) => {
        const weekNumber = i + 1;
        const { week_start, week_end } = getWeekBoundsForWeekNumber(
          weekNumber,
          selectedYear
        );

        // Format: "Week 47 - 17 to 23 November 2025"
        const startDate = new Date(week_start);
        const endDate = new Date(week_end);

        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const month = endDate.toLocaleDateString("en-US", { month: "long" });
        const year = endDate.getFullYear();

        const label = `Week ${weekNumber} - ${startDay} to ${endDay} ${month} ${year}`;

        return { value: weekNumber, label };
      });
    }, [selectedYear]);

    // Get available years (2020 to current year + 1)
    const yearOptions = useMemo(() => getAvailableYears(2020), []);

    // Event handlers
    const handleWeekChange = useCallback((value: string) => {
      setSelectedWeek(parseInt(value, 10));
      setCurrentPage(0); // Reset to first page
    }, []);

    const handleYearChange = useCallback((value: string) => {
      setSelectedYear(parseInt(value, 10));
      setSelectedWeek(1); // Reset to week 1
      setCurrentPage(0); // Reset to first page
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
      setCurrentPage(newPage);
      setSelectedMembers(new Set()); // Clear selection when changing pages
    }, []);

    const handleSelectAll = useCallback(() => {
      if (isAllSelected) {
        // Deselect all on current page
        const newSelected = new Set(selectedMembers);
        paginatedMembers.forEach((m) => newSelected.delete(m.id));
        setSelectedMembers(newSelected);
      } else {
        // Select all on current page
        const newSelected = new Set(selectedMembers);
        paginatedMembers.forEach((m) => newSelected.add(m.id));
        setSelectedMembers(newSelected);
      }
    }, [isAllSelected, selectedMembers, paginatedMembers]);

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

    return (
      <div className="space-y-4">
        {/* Header with title and selectors */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left side: Title + Description */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Members Without Reservations
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Active members with credits but no bookings in the selected week
            </p>
          </div>

          {/* Right side: Total Count Badge, Week Selector with Date Range, Year Selector */}
          <div className="flex items-center gap-2">
            {/* Total Count Badge */}
            {!isLoading && members && (
              <Badge variant="secondary" className="gap-1 px-3 py-1">
                <Users className="h-3 w-3" />
                {members.length}
              </Badge>
            )}

            {/* Week Selector with Date Range */}
            <Select
              value={selectedWeek.toString()}
              onValueChange={handleWeekChange}
            >
              <SelectTrigger className="w-[320px]">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year Selector */}
            <Select
              value={selectedYear.toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table Card */}
        <Card>
          {/* Loading State */}
          {isLoading && <LoadingSkeleton className="h-96" />}

          {/* Error State */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <AlertCircle className="text-destructive h-12 w-12" />
              <p className="text-muted-foreground text-sm">
                Failed to load members. Please try again.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && (!members || members.length === 0) && (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Users className="text-muted-foreground h-12 w-12" />
              <p className="text-muted-foreground text-sm">
                All members with active subscriptions have bookings this week!
              </p>
            </div>
          )}

          {/* Table with Data */}
          {!isLoading && !isError && members && members.length > 0 && (
            <>
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          {...(isPartiallySelected && {
                            "data-indeterminate": true,
                          })}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all members on this page"
                        />
                      </TableHead>
                      <TableHead className="min-w-[200px]">Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Remaining Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.map((member) => (
                      <TableRow
                        key={member.id}
                        className="hover:bg-muted/50 cursor-pointer"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedMembers.has(member.id)}
                            onCheckedChange={(checked) =>
                              handleSelectMember(member.id, checked as boolean)
                            }
                            aria-label={`Select ${member.first_name} ${member.last_name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {member.first_name} {member.last_name}
                        </TableCell>
                        <TableCell>
                          <div className="text-muted-foreground text-sm">
                            {member.phone || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-muted-foreground text-sm">
                            {member.email || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <SessionCountBadge
                            count={member.remaining_sessions}
                            showTooltip={false}
                            colorVariant="yellow"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between border-t px-6 py-3">
                <div className="text-muted-foreground text-sm">
                  Showing {showingStart} to {showingEnd} of {members.length}{" "}
                  member{members.length !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-muted-foreground text-sm">
                    Page {currentPage + 1} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  }
);
