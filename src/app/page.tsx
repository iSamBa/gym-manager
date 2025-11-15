"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useRequireAdmin } from "@/hooks/use-require-auth";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyActivityCard } from "@/features/dashboard/components/MonthlyActivityCard";
import { useThreeWeekSessions } from "@/features/dashboard/hooks/use-weekly-sessions";
import {
  formatWeekRange,
  getLastWeekBounds,
  getCurrentWeekBounds,
  getNextWeekBounds,
} from "@/features/dashboard/lib/week-utils";

// Lazy load heavy chart components to reduce initial bundle size
const SessionsByTypeChart = lazy(() =>
  import("@/features/dashboard/components/SessionsByTypeChart").then(
    (module) => ({
      default: module.SessionsByTypeChart,
    })
  )
);

export default function Home() {
  const { user, isLoading: isAuthLoading } = useRequireAdmin();

  // Fetch weekly session data for 3 weeks (parallel)
  const {
    data: weeklyData,
    isLoading: isWeeklyLoading,
    isError: isWeeklyError,
  } = useThreeWeekSessions();

  // Get week bounds for titles
  const lastWeek = getLastWeekBounds();
  const currentWeek = getCurrentWeekBounds();
  const nextWeek = getNextWeekBounds();

  if (isAuthLoading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  if (!user) {
    return null; // useRequireAdmin will handle redirect
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Analytics and insights for your gym operations
          </p>
        </div>

        {/* Weekly Session Stats Section - 3 Pie Charts */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            Weekly Session Statistics
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Last Week Chart */}
            <Suspense fallback={<Skeleton className="h-[450px] w-full" />}>
              {isWeeklyError ? (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Last Week (
                      {formatWeekRange(lastWeek.week_start, lastWeek.week_end)})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-[300px] items-center justify-center">
                      <p className="text-destructive">Failed to load data</p>
                    </div>
                  </CardContent>
                </Card>
              ) : isWeeklyLoading || !weeklyData?.lastWeek ? (
                <Skeleton className="h-[450px] w-full" />
              ) : (
                <SessionsByTypeChart
                  data={weeklyData.lastWeek}
                  title={`Last Week (${formatWeekRange(lastWeek.week_start, lastWeek.week_end)})`}
                />
              )}
            </Suspense>

            {/* Current Week Chart */}
            <Suspense fallback={<Skeleton className="h-[450px] w-full" />}>
              {isWeeklyError ? (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Current Week (
                      {formatWeekRange(
                        currentWeek.week_start,
                        currentWeek.week_end
                      )}
                      )
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-[300px] items-center justify-center">
                      <p className="text-destructive">Failed to load data</p>
                    </div>
                  </CardContent>
                </Card>
              ) : isWeeklyLoading || !weeklyData?.currentWeek ? (
                <Skeleton className="h-[450px] w-full" />
              ) : (
                <SessionsByTypeChart
                  data={weeklyData.currentWeek}
                  title={`Current Week (${formatWeekRange(currentWeek.week_start, currentWeek.week_end)})`}
                />
              )}
            </Suspense>

            {/* Next Week Chart */}
            <Suspense fallback={<Skeleton className="h-[450px] w-full" />}>
              {isWeeklyError ? (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Next Week (
                      {formatWeekRange(nextWeek.week_start, nextWeek.week_end)})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-[300px] items-center justify-center">
                      <p className="text-destructive">Failed to load data</p>
                    </div>
                  </CardContent>
                </Card>
              ) : isWeeklyLoading || !weeklyData?.nextWeek ? (
                <Skeleton className="h-[450px] w-full" />
              ) : (
                <SessionsByTypeChart
                  data={weeklyData.nextWeek}
                  title={`Next Week (${formatWeekRange(nextWeek.week_start, nextWeek.week_end)})`}
                />
              )}
            </Suspense>
          </div>
        </div>

        {/* Monthly Activity Section */}
        <div>
          <MonthlyActivityCard />
        </div>
      </div>
    </MainLayout>
  );
}
