/**
 * Cancellations Bar Chart Component
 *
 * Displays subscription cancellations as a bar chart
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

interface CancellationsChartProps {
  subscriptionsCancelled: number;
  month: string;
}

// Chart configuration for shadcn/ui ChartContainer
const chartConfig = {
  subscriptions_cancelled: {
    label: "Cancelled",
    color: "#ef4444", // red-500
  },
} satisfies ChartConfig;

/**
 * CancellationsChart Component
 *
 * Renders a bar chart showing cancelled subscriptions
 * - Displays single bar
 * - Shows tooltip on hover
 * - Includes legend
 * - Empty state when no data
 *
 * @performance Wrapped in React.memo, uses useMemo for data transformation
 */
export const CancellationsChart = memo(function CancellationsChart({
  subscriptionsCancelled,
  month,
}: CancellationsChartProps) {
  // Transform data for bar chart
  const chartData = useMemo(() => {
    return [
      {
        metric: "Cancelled",
        value: subscriptionsCancelled,
        fill: chartConfig.subscriptions_cancelled.color,
      },
    ];
  }, [subscriptionsCancelled]);

  // Empty state - no data
  if (subscriptionsCancelled === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cancellations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-muted-foreground text-center text-sm">
              No cancellations for {month}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Cancellations</CardTitle>
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
              fill="var(--color-subscriptions_cancelled)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});
