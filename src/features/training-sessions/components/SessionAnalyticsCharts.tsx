import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Calendar,
  Clock,
  Users,
  Target,
} from "lucide-react";
import { format } from "date-fns";

// Note: Using simple visual representations instead of a charting library
// In production, you would use Recharts, Chart.js, or similar

interface SessionAnalyticsChartsProps {
  analytics: {
    session_trends: Array<{
      period: string;
      session_count: number;
      attendance_rate: number;
      revenue: number;
    }>;
    session_types: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    hourly_distribution: Array<{
      hour: number;
      session_count: number;
      utilization_rate: number;
    }>;
    trainer_performance: Array<{
      trainer_id: string;
      trainer_name: string;
      session_count: number;
      attendance_rate: number;
      revenue: number;
    }>;
  };
  isLoading?: boolean;
}

const SessionAnalyticsCharts: React.FC<SessionAnalyticsChartsProps> = ({
  analytics,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="bg-muted h-6 w-48 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-muted h-32 animate-pulse rounded" />
                <div className="bg-muted h-4 animate-pulse rounded" />
                <div className="bg-muted h-4 animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const maxSessions = Math.max(
    ...analytics.session_trends.map((t) => t.session_count)
  );
  const avgAttendance = Math.round(
    analytics.session_trends.reduce((avg, t) => avg + t.attendance_rate, 0) /
      analytics.session_trends.length || 0
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Session Trends Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Session Trends Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Simple bar chart representation */}
            <div className="grid h-40 grid-cols-6 gap-2">
              {analytics.session_trends.slice(-6).map((trend) => {
                const height =
                  maxSessions > 0
                    ? (trend.session_count / maxSessions) * 100
                    : 0;

                return (
                  <div
                    key={trend.period}
                    className="group flex flex-col items-center"
                  >
                    <div className="relative flex flex-1 items-end">
                      <div
                        className="bg-primary hover:bg-primary/80 w-full rounded-t transition-colors"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${trend.session_count} sessions - ${Math.round(trend.attendance_rate)}% attendance`}
                      />
                      <div className="bg-popover text-popover-foreground absolute -top-6 left-1/2 z-10 -translate-x-1/2 transform rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                        {trend.session_count} sessions
                        <br />
                        {Math.round(trend.attendance_rate)}% attendance
                        <br />${trend.revenue?.toLocaleString() || 0} revenue
                      </div>
                    </div>
                    <div className="text-muted-foreground mt-2 text-center text-xs">
                      {format(new Date(trend.period), "MMM")}
                    </div>
                    <div className="text-sm font-medium">
                      {trend.session_count}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend and Summary */}
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1">
                  <div className="bg-primary h-3 w-3 rounded"></div>
                  <span>Sessions</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Avg. Attendance: </span>
                  <Badge variant="outline">{avgAttendance}%</Badge>
                </div>
              </div>
              <div className="text-xs">
                Total Revenue: $
                {analytics.session_trends
                  .reduce((sum, t) => sum + (t.revenue || 0), 0)
                  .toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Types Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Session Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.session_types.map((type, index) => {
              const colors = [
                "bg-blue-500",
                "bg-purple-500",
                "bg-amber-500",
                "bg-teal-500",
                "bg-indigo-500",
                "bg-rose-500",
              ];

              return (
                <div key={type.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded ${colors[index % colors.length]}`}
                      />
                      <span className="font-medium capitalize">
                        {type.category}
                      </span>
                    </div>
                    <span>
                      {type.count} ({type.percentage}%)
                    </span>
                  </div>
                  <Progress value={type.percentage} className="h-2" />
                </div>
              );
            })}

            {analytics.session_types.length === 0 && (
              <div className="text-muted-foreground py-4 text-center">
                <PieChart className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No session data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Peak Hours Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Peak Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.hourly_distribution
              .sort((a, b) => b.session_count - a.session_count)
              .slice(0, 6)
              .map((hour, index) => (
                <div
                  key={hour.hour}
                  className="group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-muted flex h-8 w-8 items-center justify-center rounded text-sm font-medium">
                      #{index + 1}
                    </div>
                    <div>
                      <span className="font-medium">
                        {hour.hour.toString().padStart(2, "0")}:00 -{" "}
                        {(hour.hour + 1).toString().padStart(2, "0")}:00
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {hour.session_count} sessions
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {Math.round(hour.utilization_rate)}% utilization
                      </div>
                    </div>
                    <Progress
                      value={hour.utilization_rate}
                      className="h-2 w-16"
                    />
                  </div>
                </div>
              ))}

            {analytics.hourly_distribution.length === 0 && (
              <div className="text-muted-foreground py-4 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No hourly data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trainer Performance */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Trainer Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.trainer_performance
              .sort((a, b) => b.session_count - a.session_count)
              .slice(0, 5)
              .map((trainer, index) => {
                const maxTrainerSessions =
                  analytics.trainer_performance[0]?.session_count || 1;
                const relativePerformance =
                  (trainer.session_count / maxTrainerSessions) * 100;

                return (
                  <div key={trainer.trainer_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                          #{index + 1}
                        </div>
                        <div>
                          <span className="font-medium">
                            {trainer.trainer_name}
                          </span>
                          <div className="text-muted-foreground text-sm">
                            ID: {trainer.trainer_id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-medium">
                            {trainer.session_count}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Sessions
                          </div>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="font-medium">
                            {Math.round(trainer.attendance_rate)}%
                          </Badge>
                          <div className="text-muted-foreground text-xs">
                            Attendance
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">
                            ${trainer.revenue?.toLocaleString() || 0}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Revenue
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance bar */}
                    <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                        style={{ width: `${relativePerformance}%` }}
                      />
                    </div>
                  </div>
                );
              })}

            {analytics.trainer_performance.length === 0 && (
              <div className="text-muted-foreground py-8 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">No trainer data available</p>
                <p className="text-sm">
                  Performance metrics will appear here once sessions are
                  completed
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Key Performance Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Calendar className="mx-auto mb-2 h-8 w-8 text-blue-500" />
              <div className="text-2xl font-bold">
                {analytics.session_trends.reduce(
                  (sum, t) => sum + t.session_count,
                  0
                )}
              </div>
              <div className="text-muted-foreground text-sm">
                Total Sessions
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Target className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <div className="text-2xl font-bold">{avgAttendance}%</div>
              <div className="text-muted-foreground text-sm">
                Avg Attendance
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-purple-500" />
              <div className="text-2xl font-bold">
                {analytics.trainer_performance.length}
              </div>
              <div className="text-muted-foreground text-sm">
                Active Trainers
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <TrendingUp className="mx-auto mb-2 h-8 w-8 text-amber-500" />
              <div className="text-2xl font-bold">
                $
                {analytics.session_trends
                  .reduce((sum, t) => sum + (t.revenue || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-muted-foreground text-sm">Total Revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionAnalyticsCharts;
