/**
 * Multi-Site Sessions Tab
 * Displays and manages multi-site session data for financial tracking
 */

"use client";

import { memo, useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, AlertCircle, FileDown, X, Filter } from "lucide-react";
import { useMultiSiteSessions } from "../hooks/use-multi-site-sessions";
import { exportToCSV } from "../lib/multi-site-export";
import { MultiSiteSessionDetailsDialog } from "./MultiSiteSessionDetailsDialog";
import type { MultiSiteSession } from "../lib/types";

function MultiSiteSessionsTabComponent() {
  const {
    sessions,
    isLoading,
    error,
    originStudios,
    setSearch,
    setDateRange,
    setOriginStudio,
    clearFilters,
    hasActiveFilters,
  } = useMultiSiteSessions();

  const [selectedSession, setSelectedSession] =
    useState<MultiSiteSession | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedStudio, setSelectedStudio] = useState<string>("");

  // Apply search filter with debouncing
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      setSearch(value);
    },
    [setSearch]
  );

  // Apply date range filter
  const handleDateFromChange = useCallback(
    (value: string) => {
      setDateFrom(value);
      setDateRange(value || undefined, dateTo || undefined);
    },
    [setDateRange, dateTo]
  );

  const handleDateToChange = useCallback(
    (value: string) => {
      setDateTo(value);
      setDateRange(dateFrom || undefined, value || undefined);
    },
    [setDateRange, dateFrom]
  );

  // Apply origin studio filter
  const handleStudioChange = useCallback(
    (value: string) => {
      setSelectedStudio(value);
      setOriginStudio(value === "all" ? undefined : value);
    },
    [setOriginStudio]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    setDateFrom("");
    setDateTo("");
    setSelectedStudio("");
    clearFilters();
  }, [clearFilters]);

  // View session details
  const handleViewDetails = useCallback((session: MultiSiteSession) => {
    setSelectedSession(session);
    setDetailsDialogOpen(true);
  }, []);

  // Export handler
  const handleExportCSV = useCallback(() => {
    exportToCSV(sessions);
  }, [sessions]);

  // Count of filtered results
  const resultCount = useMemo(() => sessions.length, [sessions.length]);

  if (error) {
    return (
      <Card className="max-w-6xl">
        <CardHeader>
          <CardTitle>Multi-Site Sessions</CardTitle>
          <CardDescription>
            Track and export cross-studio session bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load multi-site sessions. Please refresh the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="max-w-6xl">
        <CardHeader>
          <CardTitle>Multi-Site Sessions</CardTitle>
          <CardDescription>
            Track and export cross-studio session bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Multi-Site Sessions</CardTitle>
              <CardDescription>
                Track and export cross-studio session bookings for financial
                reporting
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={sessions.length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Search by name */}
            <div className="min-w-[200px] flex-1">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search by member name..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Date from */}
            <div className="w-[160px]">
              <Input
                type="date"
                placeholder="From date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
              />
            </div>

            {/* Date to */}
            <div className="w-[160px]">
              <Input
                type="date"
                placeholder="To date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
              />
            </div>

            {/* Origin studio filter */}
            <div className="w-[200px]">
              <Select value={selectedStudio} onValueChange={handleStudioChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Studios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Studios</SelectItem>
                  {originStudios.map((studio) => (
                    <SelectItem key={studio} value={studio}>
                      {studio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Results count */}
          <div className="flex items-center gap-2">
            <Filter className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm">
              {resultCount} {resultCount === 1 ? "session" : "sessions"} found
            </span>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Member Name</TableHead>
                  <TableHead>Origin Studio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground h-24 text-center"
                    >
                      {hasActiveFilters
                        ? "No sessions match your filters"
                        : "No multi-site sessions found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => {
                    const fullName =
                      `${session.guest_first_name || ""} ${session.guest_last_name || ""}`.trim();

                    return (
                      <TableRow key={session.id}>
                        <TableCell>{session.session_date}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {session.session_time}
                        </TableCell>
                        <TableCell className="font-medium">
                          {fullName || "N/A"}
                        </TableCell>
                        <TableCell>{session.guest_gym_name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              session.status === "completed"
                                ? "default"
                                : session.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="capitalize"
                          >
                            {session.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(session)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <MultiSiteSessionDetailsDialog
        session={selectedSession}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </div>
  );
}

export const MultiSiteSessionsTab = memo(MultiSiteSessionsTabComponent);
MultiSiteSessionsTab.displayName = "MultiSiteSessionsTab";
