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
} from "@/features/members/components";
import type { Member } from "@/features/database/lib/types";
import {
  useMembers,
  useMemberCount,
  useMemberCountByStatus,
  useMemberPrefetch,
  useSimpleMemberFilters,
  useExportMembers,
} from "@/features/members/hooks";
import { useRequireAdmin } from "@/hooks/use-require-auth";
import { mapUserForLayout } from "@/lib/auth-utils";
import { Users, UserCheck, UserX, Clock, Download, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MembersPage() {
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Require admin role for entire page
  const {
    user,
    isLoading: isAuthLoading,
    hasRequiredRole,
  } = useRequireAdmin("/login");

  // Simplified filter state management
  const { filters, updateFilters, databaseFilters } = useSimpleMemberFilters();

  // Export functionality
  const { isExporting, exportMembers } = useExportMembers();

  // Main member data with auto-refresh
  const {
    data: members,
    isLoading: isMembersLoading,
    error,
    isFetching,
    isRefetching,
  } = useMembers({
    search: searchQuery,
    ...databaseFilters,
    // No limit - fetch all members
  });

  // Member count for stats
  const { data: totalMemberCount } = useMemberCount();
  const { data: memberCountByStatus } = useMemberCountByStatus();

  // Prefetching utilities
  const { prefetchOnHover } = useMemberPrefetch();

  if (isAuthLoading) {
    return (
      <MainLayout user={mapUserForLayout(user)}>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      </MainLayout>
    );
  }

  if (!hasRequiredRole) {
    return null; // Will redirect to login
  }

  const activeMembers = memberCountByStatus?.active || 0;
  const inactiveMembers = memberCountByStatus?.inactive || 0;
  const pendingMembers = memberCountByStatus?.pending || 0;

  // Handler functions for member actions
  const handleViewMember = (member: Member) => {
    router.push(`/members/${member.id}`);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setIsEditDialogOpen(true);
  };

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

  // Convert user object to expected format for MainLayout
  const layoutUser = mapUserForLayout(user);

  return (
    <MainLayout user={layoutUser}>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row">
            {/* Search Input */}
            <div className="max-w-md flex-1">
              <SearchInput
                placeholder="Search members by name..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

            {/* Simplified Filters */}
            <SimpleMemberFilters
              filters={filters}
              onFiltersChange={updateFilters}
              className="shrink-0"
            />
          </div>

          {/* Export, Column Visibility, and Status Indicators */}
          <div className="flex items-center gap-3">
            {/* Column Visibility Toggle */}
            <ColumnVisibilityToggle />

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMembers(members || [])}
              disabled={isExporting || isMembersLoading}
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

        {/* Members Table */}
        <Card>
          <AdvancedMemberTable
            members={members || []}
            isLoading={isMembersLoading}
            error={error}
            onView={handleViewMember}
            onEdit={handleEditMember}
            onMemberClick={handleMemberClick}
            onMemberHover={handleMemberHover}
            enableInfiniteScroll={!searchQuery} // Only enable infinite scroll when not searching
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
