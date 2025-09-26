"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  MapPin,
  ExternalLink,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
} from "lucide-react";
import { useTrainers } from "@/features/trainers/hooks";
import { useTrainingSessions } from "@/features/training-sessions/hooks";
import type { SessionFilters } from "@/features/training-sessions/lib/types";

// Basic trainer session filters type for this component
type LocalTrainerSessionFilters = {
  status?: string;
  dateRange?: { from: Date; to: Date };
};
import { format, isToday, isTomorrow, isYesterday } from "date-fns";

interface TrainerSessionsTableProps {
  trainerId: string;
  className?: string;
  showFilters?: boolean;
  initialFilters?: LocalTrainerSessionFilters;
  pageSize?: number;
}

export function TrainerSessionsTable({
  trainerId,
  className,
  showFilters = true,
  initialFilters = {},
  pageSize = 10,
}: TrainerSessionsTableProps) {
  const [filters, setFilters] =
    useState<LocalTrainerSessionFilters>(initialFilters);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  // Apply search term to filters
  const appliedFilters = useMemo(
    () => ({
      ...filters,
      search: searchTerm.trim() || undefined,
    }),
    [filters, searchTerm]
  );

  // Convert local filters to database filters
  const databaseFilters = useMemo((): SessionFilters => {
    const dbFilters: SessionFilters = {
      trainer_id: trainerId,
    };

    if (appliedFilters.status) {
      dbFilters.status = appliedFilters.status as
        | "scheduled"
        | "completed"
        | "cancelled";
    }

    if (appliedFilters.dateRange) {
      dbFilters.date_range = {
        start: appliedFilters.dateRange.from,
        end: appliedFilters.dateRange.to,
      };
    }

    return dbFilters;
  }, [trainerId, appliedFilters]);

  // Get sessions from database with server-side filtering
  const {
    data: sessions = [],
    isLoading,
    error,
  } = useTrainingSessions(databaseFilters);

  // Pagination
  const paginatedSessions = useMemo(() => {
    if (!sessions) return [];
    const startIndex = currentPage * pageSize;
    return sessions.slice(startIndex, startIndex + pageSize);
  }, [sessions, currentPage, pageSize]);

  const totalPages = Math.ceil((sessions?.length || 0) / pageSize);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  const getStatusBadge = (status: string, isUpcoming: boolean) => {
    if (status === "cancelled") {
      return <Badge variant="outline">Cancelled</Badge>;
    }
    if (isUpcoming) {
      return <Badge variant="default">Upcoming</Badge>;
    }
    if (status === "completed") {
      return <Badge variant="default">Completed</Badge>;
    }
    if (status === "in_progress") {
      return <Badge variant="secondary">In Progress</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  // Removed getAttendanceBadge since we don't have attendance data in trainer view

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";

    return format(date, "MMM d, yyyy");
  };

  const formatSessionTime = (startString: string, endString: string) => {
    const start = new Date(startString);
    const end = new Date(endString);
    return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
  };

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load trainer sessions. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filter Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Search */}
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  placeholder="Search client, location, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Filter */}
              <Select
                value={filters.status || "all"}
                onValueChange={(
                  value: "all" | "upcoming" | "completed" | "cancelled"
                ) =>
                  setFilters({
                    ...filters,
                    status: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({});
                  setSearchTerm("");
                  setCurrentPage(0);
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 border-b p-4 last:border-b-0"
                >
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions Table */}
      {!isLoading && sessions && sessions.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessions.map((session) => (
                  <TableRow key={session.session_id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {formatSessionDate(session.scheduled_start)}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {formatSessionTime(
                            session.scheduled_start,
                            session.scheduled_end
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="text-muted-foreground h-4 w-4" />
                        <span className="font-medium">
                          {session.member_names || "No members"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="text-muted-foreground h-4 w-4" />
                        <span>{session.location || "Not specified"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(
                        session.session_status,
                        session.is_upcoming
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {Math.round(session.duration_minutes)} min
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {session.member_count || 0}/{session.max_participants}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {session.is_upcoming && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Handle edit session
                              console.log("Edit session:", session.session_id);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Handle view session details
                            console.log("View session:", session.session_id);
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && sessions && sessions.length > pageSize && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            Showing {currentPage * pageSize + 1} to{" "}
            {Math.min((currentPage + 1) * pageSize, sessions.length)} of{" "}
            {sessions.length} sessions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
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
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!sessions || sessions.length === 0) && (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Calendar}
              title="No Sessions Found"
              description={
                Object.keys(appliedFilters).length > 0
                  ? "No sessions match your current filters. Try adjusting the search criteria."
                  : "This trainer hasn't had any training sessions yet. Schedule their first session to get started."
              }
              action={
                Object.keys(appliedFilters).length > 0 ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({});
                      setSearchTerm("");
                      setCurrentPage(0);
                    }}
                  >
                    Clear Filters
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
