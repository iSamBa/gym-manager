"use client";

import { memo, useState, useMemo, lazy, Suspense } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthlyActivity } from "../hooks/use-monthly-activity";
import { getCurrentMonthBounds, formatMonth } from "../lib/month-utils";
import { subMonths } from "date-fns";
import { getLocalDateString } from "@/lib/date-utils";

// Lazy load chart components to reduce initial bundle size
const TrialMetricsChart = lazy(() =>
  import("./TrialMetricsChart").then((module) => ({
    default: module.TrialMetricsChart,
  }))
);

const SubscriptionMetricsChart = lazy(() =>
  import("./SubscriptionMetricsChart").then((module) => ({
    default: module.SubscriptionMetricsChart,
  }))
);

const CancellationsChart = lazy(() =>
  import("./CancellationsChart").then((module) => ({
    default: module.CancellationsChart,
  }))
);

export const MonthlyActivityCard = memo(function MonthlyActivityCard() {
  // State for selected month (default: current month)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const { month_start } = getCurrentMonthBounds();
    return month_start;
  });

  // Generate month options (current month + 5 previous months)
  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();

    // Current month + 5 previous months = 6 total
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(today, i);
      const monthStart = getLocalDateString(
        new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      );
      options.push({
        value: monthStart,
        label: formatMonth(monthStart),
      });
    }

    return options;
  }, []);

  // Fetch monthly activity data
  const {
    data: monthlyData,
    isLoading,
    isError,
  } = useMonthlyActivity(selectedMonth);

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Monthly Activity
          </h2>
        </div>
        <div className="border-destructive/50 bg-destructive/10 flex h-[200px] items-center justify-center rounded-lg border">
          <p className="text-destructive">Failed to load monthly data</p>
        </div>
      </div>
    );
  }

  if (isLoading || !monthlyData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Monthly Activity
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with title and month selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          Monthly Activity
        </h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chart cards grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
          <TrialMetricsChart
            trialSessions={monthlyData.trial_sessions}
            trialConversions={monthlyData.trial_conversions}
            month={formatMonth(selectedMonth)}
          />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
          <SubscriptionMetricsChart
            subscriptionsExpired={monthlyData.subscriptions_expired}
            subscriptionsRenewed={monthlyData.subscriptions_renewed}
            month={formatMonth(selectedMonth)}
          />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
          <CancellationsChart
            subscriptionsCancelled={monthlyData.subscriptions_cancelled}
            month={formatMonth(selectedMonth)}
          />
        </Suspense>
      </div>
    </div>
  );
});
