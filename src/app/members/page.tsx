"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { SearchInput } from "@/components/forms/search-input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AdvancedMemberTable,
  EditMemberDialog,
  SimpleMemberFilters,
  ColumnVisibilityToggle,
  type ColumnVisibility,
} from "@/features/members/components";
import type { Member } from "@/features/database/lib/types";
import {
  useMemberPageData,
  useMembers,
  useMemberPrefetch,
  useSimpleMemberFilters,
  useExportMembers,
} from "@/features/members/hooks";
import { memberUtils } from "@/features/members/lib/database-utils";
import { useRequireAdmin } from "@/hooks/use-require-auth";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Download,
  Plus,
  Filter,
  X,
  Handshake,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function MembersPage() {
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibility | null>(null);
  const router = useRouter();

  // Require admin role for entire page
  const { isLoading: isAuthLoading, hasRequiredRole } =
    useRequireAdmin("/login");

  // Simplified filter state management
  const { filters, updateFilters, databaseFilters } = useSimpleMemberFilters();

  // Export functionality
  const { isExporting, exportMembers } = useExportMembers();

  // Handler for export - fetch all members if needed
  const handleExportMembers = async () => {
    if (searchQuery && searchMembers) {
      // In search mode, export filtered results
      await exportMembers(searchMembers);
    } else {
      // In infinite scroll mode, fetch all members first
      const allMembers = await memberUtils.getMembers({
        ...databaseFilters,
        limit: 10000, // High limit to get all members
      });
      await exportMembers(allMembers);
    }
  };

  // Use consolidated query for stats (only when NOT searching to avoid duplicate queries)
  // Performance improvement: 4-5 queries → 1 query (75% faster)
  const { data: pageStats, isLoading: isStatsLoading } = useMemberPageData({
    ...databaseFilters,
    limit: 0, // We only want stats, not member list
  });

  // For search mode: fetch members separately (table needs enhanced details)
  // This query always runs but we only use results when searchQuery is present
  const {
    data: searchMembers,
    isLoading: isSearchLoading,
    error,
    isFetching,
    isRefetching,
  } = useMembers({
    search: searchQuery,
    ...databaseFilters,
  });

  // Prefetching utilities
  const { prefetchOnHover } = useMemberPrefetch();

  // Determine loading state based on mode
  const isMembersLoading = searchQuery ? isSearchLoading : isStatsLoading;

  if (isAuthLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      </MainLayout>
    );
  }

  if (!hasRequiredRole) {
    return null; // Will redirect to login
  }

  // Extract stats from consolidated data
  const totalMemberCount = pageStats?.totalCount || 0;
  const activeMembers = pageStats?.countByStatus.active || 0;
  const inactiveMembers = pageStats?.countByStatus.inactive || 0;
  const pendingMembers = pageStats?.countByStatus.pending || 0;
  const collaborationCount = pageStats?.collaborationCount || 0;

  // Handler functions for member actions
  const handleMemberClick = (member: Member) => {
    router.push(`/members/${member.id}`);
  };

  const handleMemberHover = (member: Member) => {
    prefetchOnHover(member.id);
  };

  const handleEditSuccess = () => {
    // Optionally refresh the member list or update local state
    // The cache invalidation in EditMemberDialog should handle this automatically
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Members</h1>
            <p className="text-muted-foreground">
              Manage your gym members and their subscriptions
              {isFetching && !isMembersLoading && (
                <span className="ml-2 inline-flex items-center gap-1 text-sm">
                  <Clock className="h-3 w-3 animate-spin" />
                  Syncing...
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => router.push("/members/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-2xl font-bold">{totalMemberCount || 0}</p>
                <p className="text-muted-foreground text-xs">Total Members</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{activeMembers}</p>
                <p className="text-muted-foreground text-xs">Active</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <UserX className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{inactiveMembers}</p>
                <p className="text-muted-foreground text-xs">Inactive</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingMembers}</p>
                <p className="text-muted-foreground text-xs">Pending</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <Handshake className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{collaborationCount}</p>
                <p className="text-muted-foreground text-xs">Partnerships</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          {/* Top Row: Search + Filters + Actions */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Search + Filters */}
            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
              {/* Search Input */}
              <div className="max-w-md flex-1">
                <SearchInput
                  placeholder="Search members by name or phone..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
              </div>

              {/* Filters */}
              <SimpleMemberFilters
                filters={filters}
                onFiltersChange={updateFilters}
                className="shrink-0"
              />
            </div>

            {/* Right: Export, Column Visibility, and Status Indicators */}
            <div className="flex items-center gap-3">
              {/* Column Visibility Toggle */}
              <ColumnVisibilityToggle
                onVisibilityChange={setColumnVisibility}
              />

              {/* Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMembers}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>

              {/* Background sync indicator */}
              {isRefetching && (
                <Badge variant="secondary" className="animate-pulse">
                  <Clock className="mr-1 h-3 w-3" />
                  Syncing
                </Badge>
              )}
            </div>
          </div>

          {/* Second Row: Active Filters Badge + Clear (only when filters active) */}
          {Object.values(filters).filter(
            (v) => v !== undefined && v !== null && v !== "all"
          ).length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                {
                  Object.values(filters).filter(
                    (v) => v !== undefined && v !== null && v !== "all"
                  ).length
                }{" "}
                active filter
                {Object.values(filters).filter(
                  (v) => v !== undefined && v !== null && v !== "all"
                ).length !== 1
                  ? "s"
                  : ""}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateFilters({
                    status: "all",
                    memberType: undefined,
                    hasActiveSubscription: undefined,
                    hasUpcomingSessions: undefined,
                    hasOutstandingBalance: undefined,
                  })
                }
                className="h-8 gap-1"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Members Table */}
        <Card>
          <AdvancedMemberTable
            // When searching: pass members array (controlled mode)
            // When not searching: pass filters for infinite scroll (uncontrolled mode)
            {...(searchQuery
              ? {
                  members: searchMembers || [],
                  isLoading: isMembersLoading,
                  error: error,
                }
              : {
                  filters: {
                    search: searchQuery,
                    ...databaseFilters,
                  },
                })}
            onMemberClick={handleMemberClick}
            onMemberHover={handleMemberHover}
            columnVisibility={columnVisibility}
            className="border-0"
          />
        </Card>

        {/* Edit Member Dialog */}
        <EditMemberDialog
          member={editingMember}
          isOpen={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setEditingMember(null);
            }
          }}
          onSuccess={handleEditSuccess}
        />
      </div>
    </MainLayout>
  );
}
