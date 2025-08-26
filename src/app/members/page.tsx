"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { SearchInput } from "@/components/forms/search-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdvancedMemberTable } from "@/features/members/components";
import {
  useMembers,
  useMemberCount,
  useMemberCountByStatus,
  useDebouncedMemberSearch,
  useMemberPrefetch,
  useRouteCacheManager,
  usePageCacheStrategy,
} from "@/features/members/hooks";
import { Plus, Users, UserCheck, UserX, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Main member data with auto-refresh
  const {
    data: members,
    isLoading: isMembersLoading,
    error,
    isFetching,
    isRefetching,
  } = useMembers({
    search: searchQuery,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Member count for stats
  const { data: totalMemberCount } = useMemberCount();
  const { data: memberCountByStatus } = useMemberCountByStatus();

  // Debounced search for real-time filtering
  const { data: searchResults, isLoading: isSearching } =
    useDebouncedMemberSearch(
      searchQuery,
      300 // 300ms debounce
    );

  // Prefetching utilities
  const { prefetchOnHover } = useMemberPrefetch();

  // Route-based cache management
  useRouteCacheManager();
  usePageCacheStrategy("list");

  // Use search results when searching, otherwise use regular members
  const displayMembers = searchQuery ? searchResults : members;

  const activeMembers = memberCountByStatus?.active || 0;
  const inactiveMembers = memberCountByStatus?.inactive || 0;
  const pendingMembers = memberCountByStatus?.pending || 0;

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
          <Link href="/members/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </Link>
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
        <div className="flex items-center justify-between gap-4">
          <div className="max-w-md flex-1">
            <SearchInput
              placeholder="Search members by name, email, or member number..."
              value={searchQuery}
              onChange={setSearchQuery}
              isLoading={isSearching}
            />
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
            members={displayMembers}
            isLoading={isMembersLoading || isSearching}
            error={error}
            onMemberClick={(member) => {
              // Navigate to member detail page using internationalized router
              router.push(`/members/${member.id}`);
            }}
            onMemberHover={(member) => {
              // Prefetch member details on hover for instant navigation
              prefetchOnHover(member.id);
            }}
            enableInfiniteScroll={!searchQuery} // Only enable infinite scroll when not searching
            className="border-0"
          />
        </Card>
      </div>
    </MainLayout>
  );
}
