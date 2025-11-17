/**
 * Subscription Metrics Bar Chart Component
 *
 * Displays subscription expired and renewed counts as a bar chart
 * Performance optimized with React.memo and useMemo
 */

"use client";

import { memo, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface SubscriptionMetricsChartProps {
  subscriptionsExpired: number;
  subscriptionsRenewed: number;
  month: string;
}

// Chart configuration for shadcn/ui ChartContainer
const chartConfig = {
  subscriptions_expired: {
    label: "Expired",
    color: "#ef4444", // red-500
  },
  subscriptions_renewed: {
    label: "Renewed",
    color: "#22c55e", // green-500
  },
} satisfies ChartConfig;

/**
 * SubscriptionMetricsChart Component
 *
 * Renders a bar chart showing expired and renewed subscriptions
 * - Displays two bars side by side
 * - Shows tooltip on hover
 * - Includes legend
 * - Empty state when no data
 *
 * @performance Wrapped in React.memo, uses useMemo for data transformation
 */
export const SubscriptionMetricsChart = memo(function SubscriptionMetricsChart({
  subscriptionsExpired,
  subscriptionsRenewed,
  month,
}: SubscriptionMetricsChartProps) {
  // Transform data for bar chart
  const chartData = useMemo(() => {
    return [
      {
        metric: "Expired",
        value: subscriptionsExpired,
        fill: chartConfig.subscriptions_expired.color,
      },
      {
        metric: "Renewed",
        value: subscriptionsRenewed,
        fill: chartConfig.subscriptions_renewed.color,
      },
    ];
  }, [subscriptionsExpired, subscriptionsRenewed]);

  // Calculate if we have any data
  const hasData = useMemo(
    () => subscriptionsExpired > 0 || subscriptionsRenewed > 0,
    [subscriptionsExpired, subscriptionsRenewed]
  );

  // Empty state - no data
  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-muted-foreground text-center text-sm">
              No subscription activity for {month}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Subscription Activity</CardTitle>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, bottom: 20, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="metric"
              tickLine={false}
              axisLine={false}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-xs"
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="value"
              fill="var(--color-subscriptions_expired)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});
