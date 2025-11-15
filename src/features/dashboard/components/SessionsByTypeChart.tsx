/**
 * Sessions By Type Pie Chart Component
 *
 * Displays weekly session statistics as a donut chart with all 7 session types
 * Performance optimized with React.memo and useMemo
 */

"use client";

import { memo, useMemo } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { WeeklySessionStats, SessionTypeData } from "../lib/types";

interface SessionsByTypeChartProps {
  data: WeeklySessionStats;
  title: string;
}

// Session type colors - CRITICAL: Must match requirements
// Using direct hex colors for better compatibility
const SESSION_TYPE_COLORS = {
  trial: "#3b82f6", // blue-500
  member: "#22c55e", // green-500
  contractual: "#f97316", // orange-500
  multi_site: "#a855f7", // purple-500
  collaboration: "#84cc16", // lime-600
  makeup: "#1e3a8a", // blue-900
  non_bookable: "#ef4444", // red-500
} as const;

// Chart configuration for shadcn/ui ChartContainer
const chartConfig = {
  trial: {
    label: "Trial",
    color: "#3b82f6",
  },
  member: {
    label: "Member",
    color: "#22c55e",
  },
  contractual: {
    label: "Contractual",
    color: "#f97316",
  },
  multi_site: {
    label: "Multi-Site",
    color: "#a855f7",
  },
  collaboration: {
    label: "Collaboration",
    color: "#84cc16",
  },
  makeup: {
    label: "Makeup",
    color: "#1e3a8a",
  },
  non_bookable: {
    label: "Non-Bookable",
    color: "#ef4444",
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
        type: "trial",
        count: data.trial,
        fill: SESSION_TYPE_COLORS.trial,
      },
      {
        type: "member",
        count: data.member,
        fill: SESSION_TYPE_COLORS.member,
      },
      {
        type: "contractual",
        count: data.contractual,
        fill: SESSION_TYPE_COLORS.contractual,
      },
      {
        type: "multi_site",
        count: data.multi_site,
        fill: SESSION_TYPE_COLORS.multi_site,
      },
      {
        type: "collaboration",
        count: data.collaboration,
        fill: SESSION_TYPE_COLORS.collaboration,
      },
      {
        type: "makeup",
        count: data.makeup,
        fill: SESSION_TYPE_COLORS.makeup,
      },
      {
        type: "non_bookable",
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
    <Card className="flex flex-col p-4">
      <CardHeader className="p-0">
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <div className="flex flex-col items-center">
          {/* Pie chart */}
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[475px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="type"
                innerRadius="55%"
                outerRadius="85%"
                strokeWidth={2}
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  count,
                }) => {
                  const RADIAN = Math.PI / 180;
                  // Position label in the middle of the donut ring
                  const radius = innerRadius + (outerRadius - innerRadius) / 2;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-base font-bold"
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                    >
                      {count}
                    </text>
                  );
                }}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    className="stroke-background hover:opacity-80"
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-5xl font-bold"
                          >
                            {totalSessions}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Legend below pie - hidden on small screens */}
          <div className="hidden sm:flex sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-1 sm:pt-2">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-muted-foreground text-xs">
                  {chartConfig[entry.type as keyof typeof chartConfig]?.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
