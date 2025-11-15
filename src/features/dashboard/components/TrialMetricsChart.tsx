/**
 * Trial Metrics Bar Chart Component
 *
 * Displays trial sessions and conversions as a bar chart
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

interface TrialMetricsChartProps {
  trialSessions: number;
  trialConversions: number;
  month: string;
}

// Chart configuration for shadcn/ui ChartContainer
const chartConfig = {
  trial_sessions: {
    label: "Trial Sessions",
    color: "#3b82f6", // blue-500
  },
  trial_conversions: {
    label: "Trial Conversions",
    color: "#22c55e", // green-500
  },
} satisfies ChartConfig;

/**
 * TrialMetricsChart Component
 *
 * Renders a bar chart showing trial sessions and conversions
 * - Displays two bars side by side
 * - Shows tooltip on hover
 * - Includes legend
 * - Empty state when no data
 *
 * @performance Wrapped in React.memo, uses useMemo for data transformation
 */
export const TrialMetricsChart = memo(function TrialMetricsChart({
  trialSessions,
  trialConversions,
  month,
}: TrialMetricsChartProps) {
  // Transform data for bar chart
  const chartData = useMemo(() => {
    return [
      {
        metric: "Trial Sessions",
        value: trialSessions,
        fill: chartConfig.trial_sessions.color,
      },
      {
        metric: "Trial Conversions",
        value: trialConversions,
        fill: chartConfig.trial_conversions.color,
      },
    ];
  }, [trialSessions, trialConversions]);

  // Calculate if we have any data
  const hasData = useMemo(
    () => trialSessions > 0 || trialConversions > 0,
    [trialSessions, trialConversions]
  );

  // Empty state - no data
  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trial Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-muted-foreground text-center text-sm">
              No trial activity for {month}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Trial Metrics</CardTitle>
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
              fill="var(--color-trial_sessions)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});
