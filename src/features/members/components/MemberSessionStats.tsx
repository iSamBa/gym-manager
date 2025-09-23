"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Target,
  Calendar,
  Award,
  User,
  Activity,
  AlertCircle,
} from "lucide-react";
import { useMemberSessionInsights } from "../hooks/use-member-session-stats";

interface MemberSessionStatsProps {
  memberId: string;
  className?: string;
}

export function MemberSessionStats({
  memberId,
  className,
}: MemberSessionStatsProps) {
  const { stats, insights, isLoading, error } =
    useMemberSessionInsights(memberId);

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load session statistics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}
      >
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

  const getAttendanceBadgeVariant = (level: string) => {
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

  const getActivityBadgeVariant = (level: string) => {
    switch (level) {
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Stats Cards */}
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

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Sessions
            </CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.upcomingSessions}
            </div>
            <p className="text-muted-foreground text-xs">
              {insights.hasUpcomingSessions
                ? "Sessions scheduled"
                : "No upcoming sessions"}
            </p>
          </CardContent>
        </Card>

        {/* Attendance Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Rate
            </CardTitle>
            <Target className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.attendanceRate}%</div>
            <Badge
              variant={getAttendanceBadgeVariant(insights.attendanceLevel)}
              className="text-xs"
            >
              {insights.attendanceLevel.replace("-", " ")}
            </Badge>
          </CardContent>
        </Card>

        {/* Training Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Training Hours
            </CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.trainingHours}h</div>
            <p className="text-muted-foreground text-xs">
              ~{insights.avgSessionDuration}h per session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Activity Level */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Activity Level
            </CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge
              variant={getActivityBadgeVariant(insights.activityLevel)}
              className="text-sm"
            >
              {insights.activityLevel.toUpperCase()}
            </Badge>
            <p className="text-muted-foreground text-xs">
              {insights.avgSessionsPerMonth} sessions per month average
            </p>
          </CardContent>
        </Card>

        {/* Favorite Trainer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Favorite Trainer
            </CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg font-semibold">
              {insights.hasFavoriteTrainer
                ? insights.favoriteTrainer
                : "None yet"}
            </div>
            <p className="text-muted-foreground text-xs">
              {insights.hasFavoriteTrainer
                ? "Most sessions with"
                : "Train with different trainers"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Details (if there's significant data) */}
      {stats && stats.total_sessions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              Monthly Trend
              {getTrendIcon(insights.monthlyTrend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">
                  {stats.monthly_trend.last_month}
                </div>
                <p className="text-muted-foreground text-xs">Last Month</p>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {stats.monthly_trend.this_month}
                </div>
                <p className="text-muted-foreground text-xs">This Month</p>
              </div>
              <div>
                <div
                  className={`text-lg font-semibold ${
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data state */}
      {stats && stats.total_sessions === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Calendar className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No Sessions Yet</h3>
            <p className="text-muted-foreground mx-auto max-w-sm text-sm">
              This member hasn&apos;t attended any training sessions yet. Book
              their first session to start tracking their fitness journey.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
