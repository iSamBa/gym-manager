"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
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
import {
  useRealtimeMembers,
  type MemberChangeEvent,
} from "../hooks/use-realtime-members";

interface LiveMemberStatsProps {
  className?: string;
  showTrends?: boolean;
  showRealtimeStatus?: boolean;
  refreshInterval?: number; // milliseconds
  onMemberChange?: (event: MemberChangeEvent) => void;
}

export function LiveMemberStats({
  className,
  showTrends = true,
  showRealtimeStatus = true,
  refreshInterval = 30000, // 30 seconds
  onMemberChange,
}: LiveMemberStatsProps) {
  // Member count queries
  const { data: totalCount = 0, refetch: refetchTotal } = useMemberCount();
  const { data: statusCounts, refetch: refetchStatusCounts } =
    useMemberCountByStatus();
  const { data: newThisMonth = 0, refetch: refetchNewThisMonth } =
    useNewMembersThisMonth();

  // Real-time connection
  const { connectionStatus, isConnected, hasError, reconnect } =
    useRealtimeMembers({
      enabled: true,
      onMemberChange: (event) => {
        // Trigger data refetch on member changes
        refetchTotal();
        refetchStatusCounts();
        refetchNewThisMonth();

        // Notify parent
        onMemberChange?.(event);

        // Update recent activity
        setRecentActivity((prev) => [
          {
            id: Math.random().toString(),
            type: event.type,
            memberName: `${event.member.first_name} ${event.member.last_name}`,
            timestamp: event.timestamp,
          },
          ...prev.slice(0, 4), // Keep last 5 activities
        ]);
      },
      onConnectionChange: (status) => {
        setConnectionStatus(
          status.connected
            ? "connected"
            : status.connecting
              ? "connecting"
              : "disconnected"
        );
        setConnectionError(status.error);
      },
    });

  // Local state
  const [connectionStatusState, setConnectionStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("disconnected");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<
    Array<{
      id: string;
      type: "INSERT" | "UPDATE" | "DELETE";
      memberName: string;
      timestamp: Date;
    }>
  >([]);

  // Previous values for trend calculation
  const [previousStats, setPreviousStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    pending: number;
  } | null>(null);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTotal();
      refetchStatusCounts();
      refetchNewThisMonth();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, refetchTotal, refetchStatusCounts, refetchNewThisMonth]);

  // Track stats changes for trends
  useEffect(() => {
    if (statusCounts) {
      setPreviousStats({
        total: totalCount,
        active: statusCounts.active || 0,
        inactive: statusCounts.inactive || 0,
        suspended: statusCounts.suspended || 0,
        pending: statusCounts.pending || 0,
      });
    }
  }, [totalCount, statusCounts]);

  // Calculate trends
  const getTrend = (current: number, previous?: number) => {
    if (previous === undefined || previous === 0) return null;
    const change = current - previous;
    const percentage = (change / previous) * 100;
    return {
      change,
      percentage,
      direction: change > 0 ? "up" : change < 0 ? "down" : "same",
    };
  };

  // Format relative time
  const formatRelativeTime = (timestamp: Date) => {
    const now = Date.now();
    const diff = now - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "just now";
    if (minutes === 1) return "1 min ago";
    if (minutes < 60) return `${minutes} mins ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;

    return timestamp.toLocaleDateString();
  };

  // Get activity icon
  const getActivityIcon = (type: "INSERT" | "UPDATE" | "DELETE") => {
    switch (type) {
      case "INSERT":
        return <UserCheck className="h-3 w-3 text-green-500" />;
      case "UPDATE":
        return <Clock className="h-3 w-3 text-blue-500" />;
      case "DELETE":
        return <UserX className="h-3 w-3 text-red-500" />;
    }
  };

  // Get activity description
  const getActivityDescription = (type: "INSERT" | "UPDATE" | "DELETE") => {
    switch (type) {
      case "INSERT":
        return "joined";
      case "UPDATE":
        return "updated";
      case "DELETE":
        return "removed";
    }
  };

  const stats = [
    {
      title: "Total Members",
      value: totalCount,
      icon: Users,
      trend: showTrends ? getTrend(totalCount, previousStats?.total) : null,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active",
      value: statusCounts?.active || 0,
      icon: UserCheck,
      trend: showTrends
        ? getTrend(statusCounts?.active || 0, previousStats?.active)
        : null,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Inactive",
      value: statusCounts?.inactive || 0,
      icon: UserX,
      trend: showTrends
        ? getTrend(statusCounts?.inactive || 0, previousStats?.inactive)
        : null,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Suspended",
      value: statusCounts?.suspended || 0,
      icon: Clock,
      trend: showTrends
        ? getTrend(statusCounts?.suspended || 0, previousStats?.suspended)
        : null,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Connection Status */}
        {showRealtimeStatus && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                {connectionStatusState === "connected" && (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    Live Updates Active
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-xs text-green-700"
                    >
                      Real-time
                    </Badge>
                  </>
                )}
                {connectionStatusState === "connecting" && (
                  <>
                    <WifiOff className="h-4 w-4 animate-pulse text-orange-500" />
                    Connecting...
                  </>
                )}
                {connectionStatusState === "disconnected" && (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    Disconnected
                    {hasError && (
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{connectionError || "Connection failed"}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </>
                )}

                {connectionStatus.latency && (
                  <Badge variant="outline" className="text-xs">
                    {connectionStatus.latency}ms
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            {(connectionStatusState === "disconnected" || hasError) && (
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconnect}
                  className="gap-2"
                >
                  <Wifi className="h-3 w-3" />
                  Reconnect
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {/* Member Statistics */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-lg p-2", stat.bgColor)}>
                      <Icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {stat.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-gray-900">
                          {stat.value.toLocaleString()}
                        </p>
                        {stat.trend && (
                          <div className="flex items-center gap-1">
                            {stat.trend.direction === "up" && (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            )}
                            {stat.trend.direction === "down" && (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span
                              className={cn(
                                "text-xs font-medium",
                                stat.trend.direction === "up" &&
                                  "text-green-600",
                                stat.trend.direction === "down" &&
                                  "text-red-600",
                                stat.trend.direction === "same" &&
                                  "text-gray-600"
                              )}
                            >
                              {stat.trend.direction !== "same" && (
                                <>
                                  {stat.trend.change > 0 ? "+" : ""}
                                  {stat.trend.change} (
                                  {stat.trend.percentage.toFixed(1)}%)
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Growth Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Growth This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Members</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{newThisMonth}</span>
                  {totalCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {((newThisMonth / totalCount) * 100).toFixed(1)}% of total
                    </Badge>
                  )}
                </div>
              </div>

              {totalCount > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress towards target</span>
                    <span>{newThisMonth}/30</span>
                  </div>
                  <Progress
                    value={Math.min((newThisMonth / 30) * 100, 100)}
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Recent Activity
                {isConnected && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-xs text-green-700"
                  >
                    Live
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 rounded-lg bg-gray-50 p-2"
                  >
                    {getActivityIcon(activity.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          {activity.memberName}
                        </span>{" "}
                        <span className="text-gray-600">
                          {getActivityDescription(activity.type)}
                        </span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
