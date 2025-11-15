"use client";

import { memo, useState, useMemo } from "react";
import { Users, UserPlus, UserX, RefreshCw, UserMinus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "./stats-card";
import { useMonthlyActivity } from "../hooks/use-monthly-activity";
import { getCurrentMonthBounds, formatMonth } from "../lib/month-utils";
import { subMonths } from "date-fns";
import { getLocalDateString } from "@/lib/date-utils";

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Monthly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-destructive">Failed to load monthly data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !monthlyData) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Monthly Activity</CardTitle>
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
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <StatsCard
            title="Trial Sessions"
            value={monthlyData.trial_sessions.toString()}
            description="New trial members this month"
            icon={Users}
          />
          <StatsCard
            title="Trial Conversions"
            value={monthlyData.trial_conversions.toString()}
            description="Trial members who subscribed"
            icon={UserPlus}
          />
          <StatsCard
            title="Subscriptions Expired"
            value={monthlyData.subscriptions_expired.toString()}
            description="Subscriptions that ended"
            icon={UserX}
          />
          <StatsCard
            title="Subscriptions Renewed"
            value={monthlyData.subscriptions_renewed.toString()}
            description="Members who renewed"
            icon={RefreshCw}
          />
          <StatsCard
            title="Subscriptions Cancelled"
            value={monthlyData.subscriptions_cancelled.toString()}
            description="Early cancellations"
            icon={UserMinus}
          />
        </div>
      </CardContent>
    </Card>
  );
});
