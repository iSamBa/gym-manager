/**
 * Sessions By Type Pie Chart Component
 *
 * Displays weekly session statistics as a donut chart with all 7 session types
 * Performance optimized with React.memo and useMemo
 */

"use client";

import { memo, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { WeeklySessionStats, SessionTypeData } from "../lib/types";

interface SessionsByTypeChartProps {
  data: WeeklySessionStats;
  title: string;
}

// Session type colors - CRITICAL: Must match requirements
const SESSION_TYPE_COLORS = {
  trial: "hsl(var(--chart-1))", // blue-500
  member: "hsl(var(--chart-2))", // green-500
  contractual: "hsl(var(--chart-3))", // orange-500
  multi_site: "hsl(var(--chart-4))", // purple-500
  collaboration: "hsl(var(--chart-5))", // lime-600
  makeup: "hsl(var(--chart-6))", // blue-900
  non_bookable: "hsl(var(--chart-7))", // red-500
} as const;

// Chart configuration for shadcn/ui ChartContainer
const chartConfig = {
  trial: {
    label: "Trial",
    color: "hsl(var(--chart-1))",
  },
  member: {
    label: "Member",
    color: "hsl(var(--chart-2))",
  },
  contractual: {
    label: "Contractual",
    color: "hsl(var(--chart-3))",
  },
  multi_site: {
    label: "Multi-Site",
    color: "hsl(var(--chart-4))",
  },
  collaboration: {
    label: "Collaboration",
    color: "hsl(var(--chart-5))",
  },
  makeup: {
    label: "Makeup",
    color: "hsl(var(--chart-6))",
  },
  non_bookable: {
    label: "Non-Bookable",
    color: "hsl(var(--chart-7))",
  },
} satisfies ChartConfig;

/**
 * SessionsByTypeChart Component
 *
 * Renders a donut chart showing session distribution by type
 * - Only displays types with count > 0
 * - Shows total count in center
 * - Responsive sizing for mobile/tablet/desktop
 * - Empty state when no sessions
 *
 * @performance Wrapped in React.memo, uses useMemo for data transformation
 */
export const SessionsByTypeChart = memo(function SessionsByTypeChart({
  data,
  title,
}: SessionsByTypeChartProps) {
  // Transform data with useMemo - only recalculate when data changes
  const chartData = useMemo<SessionTypeData[]>(() => {
    return [
      {
        type: "Trial",
        count: data.trial,
        fill: SESSION_TYPE_COLORS.trial,
      },
      {
        type: "Member",
        count: data.member,
        fill: SESSION_TYPE_COLORS.member,
      },
      {
        type: "Contractual",
        count: data.contractual,
        fill: SESSION_TYPE_COLORS.contractual,
      },
      {
        type: "Multi-Site",
        count: data.multi_site,
        fill: SESSION_TYPE_COLORS.multi_site,
      },
      {
        type: "Collaboration",
        count: data.collaboration,
        fill: SESSION_TYPE_COLORS.collaboration,
      },
      {
        type: "Makeup",
        count: data.makeup,
        fill: SESSION_TYPE_COLORS.makeup,
      },
      {
        type: "Non-Bookable",
        count: data.non_bookable,
        fill: SESSION_TYPE_COLORS.non_bookable,
      },
    ].filter((item) => item.count > 0); // Only include types with sessions
  }, [data]);

  // Calculate total with useMemo
  const totalSessions = useMemo(
    () => data.total_sessions,
    [data.total_sessions]
  );

  // Empty state - no sessions for this week
  if (totalSessions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center sm:h-[350px] md:h-[400px]">
            <p className="text-muted-foreground text-center">
              No sessions for this week
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ChartContainer
            config={chartConfig}
            className="h-[280px] sm:h-[350px] md:h-[400px]"
          >
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0];
                  return (
                    <div className="bg-background border-border/50 rounded-lg border px-3 py-2 shadow-xl">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: data.payload.fill }}
                        />
                        <span className="text-foreground font-medium">
                          {data.name}: {data.value}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <ChartLegend
                content={<ChartLegendContent nameKey="type" />}
                verticalAlign="bottom"
              />
            </PieChart>
          </ChartContainer>

          {/* Center total count display */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold sm:text-4xl md:text-5xl">
                {totalSessions}
              </div>
              <div className="text-muted-foreground mt-1 text-sm">
                Total Sessions
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
