"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  Calendar,
  Award,
  DollarSign,
  Clock,
  Activity,
  AlertCircle,
  Star,
  BarChart3,
} from "lucide-react";
import { useTrainerPerformanceInsights } from "../hooks/use-trainer-analytics";

interface TrainerAnalyticsProps {
  trainerId: string;
  className?: string;
}

export function TrainerAnalytics({
  trainerId,
  className,
}: TrainerAnalyticsProps) {
  const { analytics, insights, isLoading, error } =
    useTrainerPerformanceInsights(trainerId);

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load trainer analytics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Primary Stats Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secondary Stats Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="text-muted-foreground h-4 w-4" />;
    }
  };

  const getPerformanceBadgeVariant = (level: string) => {
    switch (level) {
      case "excellent":
        return "default";
      case "good":
        return "secondary";
      case "average":
        return "outline";
      default:
        return "destructive";
    }
  };

  const getUtilizationColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-orange-600";
      default:
        return "text-red-600";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Status Banner */}
      {insights.isTopPerformer && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-900">
                Top Performer
              </span>
              <Badge variant="default" className="bg-green-600">
                {insights.completionRate}% completion rate
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {insights.needsAttention && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-900">
                Needs Attention
              </span>
              <span className="text-sm text-yellow-700">
                Low performance metrics detected
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Performance Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalSessions}</div>
            <div className="text-muted-foreground flex items-center space-x-2 text-xs">
              {getTrendIcon(insights.monthlyTrend)}
              <span>
                {insights.monthlyChange > 0 ? "+" : ""}
                {insights.monthlyChange} this month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <Target className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.completionRate}%</div>
            <Badge
              variant={getPerformanceBadgeVariant(insights.performanceLevel)}
              className="text-xs"
            >
              {insights.performanceLevel.replace("-", " ")}
            </Badge>
          </CardContent>
        </Card>

        {/* Client Retention */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Client Retention
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.clientRetention}%
            </div>
            <Badge
              variant={getPerformanceBadgeVariant(insights.retentionLevel)}
              className="text-xs"
            >
              {insights.retentionLevel.replace("-", " ")}
            </Badge>
          </CardContent>
        </Card>

        {/* Revenue Generated */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${insights.totalRevenue.toLocaleString()}
            </div>
            {insights.avgRating > 0 && (
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{insights.avgRating} rating</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Client Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Client Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Clients</span>
                <span className="font-semibold">{insights.totalClients}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Repeat Clients</span>
                <span className="font-semibold">{insights.repeatClients}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>New Clients</span>
                <span className="font-semibold">{insights.newClients}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Retention Rate</span>
                <span className="font-semibold">
                  {insights.clientRetention}%
                </span>
              </div>
              <Progress value={insights.clientRetention} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Utilization Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Avg Utilization</span>
                <span
                  className={`font-semibold ${getUtilizationColor(insights.utilizationLevel)}`}
                >
                  {insights.utilization}%
                </span>
              </div>
              <Progress value={insights.utilization} className="h-2" />
              <Badge variant="outline" className="text-xs">
                {insights.utilizationLevel.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Hours</span>
                <span className="font-semibold">{insights.totalHours}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Peak Hour</span>
                <span className="font-semibold">
                  {insights.peakHour !== "N/A"
                    ? `${insights.peakHour} (${insights.peakSessionCount} sessions)`
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upcoming Sessions</span>
                <span className="font-semibold">
                  {insights.upcomingSessions}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status</span>
                <Badge
                  variant={insights.hasUpcomingSessions ? "default" : "outline"}
                >
                  {insights.hasUpcomingSessions ? "Active" : "Available"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Analysis */}
      {analytics && analytics.total_sessions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Monthly Performance Trend
              {getTrendIcon(insights.monthlyTrend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {analytics.monthly_trend.last_month}
                </div>
                <p className="text-muted-foreground text-xs">Last Month</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {analytics.monthly_trend.this_month}
                </div>
                <p className="text-muted-foreground text-xs">This Month</p>
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    insights.monthlyChange > 0
                      ? "text-green-600"
                      : insights.monthlyChange < 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {insights.monthlyChange > 0 ? "+" : ""}
                  {insights.monthlyChange}
                </div>
                <p className="text-muted-foreground text-xs">Change</p>
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    insights.monthlyGrowthPercentage > 0
                      ? "text-green-600"
                      : insights.monthlyGrowthPercentage < 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {insights.monthlyGrowthPercentage > 0 ? "+" : ""}
                  {insights.monthlyGrowthPercentage}%
                </div>
                <p className="text-muted-foreground text-xs">Growth</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data state */}
      {analytics && analytics.total_sessions === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <BarChart3 className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No Analytics Data</h3>
            <p className="text-muted-foreground mx-auto max-w-sm text-sm">
              This trainer hasn&apos;t conducted any sessions yet. Once they
              start training clients, analytics will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
