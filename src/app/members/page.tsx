"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { SearchInput } from "@/components/forms/search-input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AdvancedMemberTable,
  AddMemberDialog,
  EditMemberDialog,
  MemberFilters,
} from "@/features/members/components";
import type { Member } from "@/features/database/lib/types";
import {
  useMembers,
  useMemberCount,
  useMemberCountByStatus,
  useMemberPrefetch,
  useRouteCacheManager,
  usePageCacheStrategy,
  useMemberFilters,
} from "@/features/members/hooks";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MembersPage() {
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();

  // Filter state management
  const { filters, updateFilter } = useMemberFilters();

  // Convert filter state to database filters
  const databaseFilters = {
    search: filters.search,
    status: filters.status,
    joinDateFrom: filters.joinDateFrom,
    joinDateTo: filters.joinDateTo,
  };

  // Main member data with auto-refresh
  const {
    data: members,
    isLoading: isMembersLoading,
    error,
    isFetching,
    isRefetching,
  } = useMembers({
    ...databaseFilters,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Member count for stats
  const { data: totalMemberCount } = useMemberCount();
  const { data: memberCountByStatus } = useMemberCountByStatus();

  // Prefetching utilities
  const { prefetchOnHover } = useMemberPrefetch();

  // Route-based cache management
  useRouteCacheManager();
  usePageCacheStrategy("list");

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
          <AddMemberDialog
            onMemberCreated={() => {
              // The dialog handles navigation to the member profile
              // Could add member list refresh here if needed
            }}
          />
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
          <div className="flex flex-1 items-center gap-4">
            <div className="max-w-md flex-1">
              <SearchInput
                placeholder="Search members by name..."
                value={filters.search || ""}
                onChange={(value) => updateFilter("search", value)}
                isLoading={isMembersLoading && !!filters.search}
              />
            </div>
            <MemberFilters compact className="shrink-0" />
          </div>

          {/* Background sync indicator */}
          {isRefetching && (
            <Badge variant="secondary" className="animate-pulse">
              <Clock className="mr-1 h-3 w-3" />
              Syncing
            </Badge>
          )}
        </div>

        {/* Members Table */}
        <Card>
          <AdvancedMemberTable
            members={members}
            isLoading={isMembersLoading}
            error={error}
            onView={handleViewMember}
            onEdit={handleEditMember}
            onMemberClick={handleMemberClick}
            onMemberHover={handleMemberHover}
            enableInfiniteScroll={!filters.search} // Only enable infinite scroll when not searching
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
