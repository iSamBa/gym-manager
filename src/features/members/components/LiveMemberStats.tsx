"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  useMemberCount,
  useMemberCountByStatus,
  useNewMembersThisMonth,
} from "../hooks/use-members";

interface LiveMemberStatsProps {
  className?: string;
  showTrends?: boolean;
  showRefreshStatus?: boolean;
  refreshInterval?: number; // milliseconds
}

export function LiveMemberStats({
  className,
  showTrends = true,
  showRefreshStatus = true,
  refreshInterval = 30000, // 30 seconds
}: LiveMemberStatsProps) {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Member count queries
  const {
    data: totalCount = 0,
    refetch: refetchTotal,
    isFetching: isFetchingTotal,
  } = useMemberCount();
  const {
    data: statusCounts,
    refetch: refetchStatusCounts,
    isFetching: isFetchingStatus,
  } = useMemberCountByStatus();
  const {
    data: newThisMonthData = [],
    refetch: refetchNewThisMonth,
    isFetching: isFetchingNew,
  } = useNewMembersThisMonth();
  const newThisMonth = newThisMonthData.length;

  const activeCount = statusCounts?.active || 0;
  const inactiveCount = statusCounts?.inactive || 0;
  const suspendedCount = statusCounts?.suspended || 0;
  const pendingCount = statusCounts?.pending || 0;

  // Manual refresh function
  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchTotal(),
        refetchStatusCounts(),
        refetchNewThisMonth(),
      ]);
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(refreshStats, refreshInterval);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshInterval]);

  const isLoading = isFetchingTotal || isFetchingStatus || isFetchingNew;

  return (
    <TooltipProvider>
      <div className={cn("space-y-4", className)}>
        {/* Header with refresh button */}
        {showRefreshStatus && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Member Stats</h3>
              {isLoading && (
                <Badge variant="secondary" className="animate-pulse">
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Updating...
                </Badge>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshStats}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Last updated: {lastRefresh.toLocaleTimeString()}
                  <br />
                  Auto-refresh: {refreshInterval / 1000}s
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Members
              </CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              {showTrends && (
                <div className="flex items-center pt-1">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  <span className="text-muted-foreground text-xs">
                    +{newThisMonth} this month
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeCount}
              </div>
              {totalCount > 0 && (
                <Progress
                  value={(activeCount / totalCount) * 100}
                  className="mt-2"
                />
              )}
            </CardContent>
          </Card>

          {/* Inactive Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {inactiveCount}
              </div>
              {totalCount > 0 && (
                <Progress
                  value={(inactiveCount / totalCount) * 100}
                  className="mt-2"
                />
              )}
            </CardContent>
          </Card>

          {/* Pending Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pendingCount}
              </div>
              {suspendedCount > 0 && (
                <div className="flex items-center pt-1">
                  <AlertCircle className="mr-1 h-3 w-3 text-orange-600" />
                  <span className="text-muted-foreground text-xs">
                    {suspendedCount} suspended
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {showTrends && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Activity Rate</span>
                <span className="font-medium">
                  {totalCount > 0
                    ? Math.round((activeCount / totalCount) * 100)
                    : 0}
                  %
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
