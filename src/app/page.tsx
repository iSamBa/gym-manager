"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/features/dashboard/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  Plus,
  Activity,
  Handshake,
} from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-auth";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy chart components to reduce initial bundle size
const MemberEvolutionChart = lazy(() =>
  import("@/features/dashboard/components/member-evolution-chart").then(
    (module) => ({
      default: module.MemberEvolutionChart,
    })
  )
);

const MemberStatusDistributionChart = lazy(() =>
  import(
    "@/features/dashboard/components/member-status-distribution-chart"
  ).then((module) => ({
    default: module.MemberStatusDistributionChart,
  }))
);
import {
  useMemberEvolution,
  useMemberStatusDistribution,
} from "@/features/dashboard/hooks/use-member-analytics";
import { useDashboardStats } from "@/features/database/hooks/use-analytics";
import { useRecentActivities } from "@/features/dashboard/hooks/use-recent-activities";
import { useCollaborationMemberCount } from "@/features/members/hooks/use-members";

export default function Home() {
  const { user, isLoading } = useRequireAdmin();

  // Fetch analytics data
  const { data: memberEvolutionData, isLoading: isEvolutionLoading } =
    useMemberEvolution(12);
  const { data: memberStatusData, isLoading: isStatusDistributionLoading } =
    useMemberStatusDistribution();

  // Get dashboard stats using SQL aggregation (replaces mock data)
  const { data: dashboardStats } = useDashboardStats();

  // Get collaboration member count
  const { data: collaborationCount = 0 } = useCollaborationMemberCount();

  // Get real recent activities data (replaces mock data)
  const { data: recentActivities, isLoading: isActivitiesLoading } =
    useRecentActivities(4);

  if (isLoading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  if (!user) {
    return null; // useRequireAdmin will handle redirect
  }

  // Stats data using real database analytics
  const stats = dashboardStats
    ? [
        {
          title: "Total Members",
          value: dashboardStats.total_members.toLocaleString(),
          description: `${dashboardStats.active_members} active`,
          icon: Users,
          trend: {
            value: Math.round(
              (dashboardStats.active_members / dashboardStats.total_members) *
                100
            ),
            label: "active rate",
          },
        },
        {
          title: "Monthly Revenue",
          value: `$${dashboardStats.monthly_revenue.toLocaleString()}`,
          description: "Current month earnings",
          icon: DollarSign,
          trend: {
            value: Math.round(dashboardStats.member_retention_rate),
            label: "retention rate",
          },
        },
        {
          title: "Classes Today",
          value: dashboardStats.sessions_today.toString(),
          description: `${dashboardStats.sessions_this_week} this week`,
          icon: Calendar,
          trend: { value: 0, label: "today's sessions" },
        },
        {
          title: "Total Revenue",
          value: `$${dashboardStats.total_revenue.toLocaleString()}`,
          description: "All time earnings",
          icon: Activity,
          trend: {
            value: Math.round(dashboardStats.member_retention_rate),
            label: "retention rate",
          },
        },
        {
          title: "Partnerships",
          value: collaborationCount.toLocaleString(),
          description: "Collaboration members",
          icon: Handshake,
          trend: {
            value: collaborationCount,
            label: "active partnerships",
          },
        },
      ]
    : [
        // Loading fallback stats
        {
          title: "Total Members",
          value: "...",
          description: "Loading...",
          icon: Users,
          trend: { value: 0, label: "loading" },
        },
        {
          title: "Monthly Revenue",
          value: "...",
          description: "Loading...",
          icon: DollarSign,
          trend: { value: 0, label: "loading" },
        },
        {
          title: "Classes Today",
          value: "...",
          description: "Loading...",
          icon: Calendar,
          trend: { value: 0, label: "loading" },
        },
        {
          title: "Total Revenue",
          value: "...",
          description: "Loading...",
          icon: Activity,
          trend: { value: 0, label: "loading" },
        },
        {
          title: "Partnerships",
          value: "...",
          description: "Loading...",
          icon: Handshake,
          trend: { value: 0, label: "loading" },
        },
      ];

  // Use real recent activities data or show loading placeholder
  const activitiesData = recentActivities || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here&apos;s what&apos;s happening at your gym today.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              trend={stat.trend}
            />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Register New Member
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Class
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Process Payment
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isActivitiesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                          <div className="h-3 w-32 animate-pulse rounded bg-gray-100"></div>
                        </div>
                        <div className="h-5 w-16 animate-pulse rounded bg-gray-200"></div>
                      </div>
                    ))}
                  </div>
                ) : activitiesData.length > 0 ? (
                  activitiesData.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{activity.member}</p>
                        <p className="text-muted-foreground text-xs">
                          {activity.action}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {activity.time}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    No recent activities found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Morning Yoga</p>
                    <p className="text-muted-foreground text-xs">
                      08:00 - 09:00
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">12/15</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">HIIT Training</p>
                    <p className="text-muted-foreground text-xs">
                      10:00 - 11:00
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">8/10</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Pilates</p>
                    <p className="text-muted-foreground text-xs">
                      18:00 - 19:00
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">15/20</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Strength Training</p>
                    <p className="text-muted-foreground text-xs">
                      19:30 - 20:30
                    </p>
                  </div>
                  <Badge variant="secondary">5/12</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="flex gap-6">
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <MemberEvolutionChart
              data={memberEvolutionData}
              isLoading={isEvolutionLoading}
            />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <MemberStatusDistributionChart
              data={memberStatusData}
              isLoading={isStatusDistributionLoading}
            />
          </Suspense>
        </div>
      </div>
    </MainLayout>
  );
}
