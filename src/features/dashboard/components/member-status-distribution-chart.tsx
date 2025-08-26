"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface MemberStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface MemberStatusDistributionChartProps {
  data: MemberStatusData[];
  isLoading?: boolean;
}

const statusConfig = {
  active: {
    label: "Active",
    color: "hsl(142 71% 45%)", // Green
  },
  pending: {
    label: "Pending",
    color: "hsl(48 96% 53%)", // Yellow
  },
  inactive: {
    label: "Inactive",
    color: "hsl(215 28% 47%)", // Blue
  },
  suspended: {
    label: "Suspended",
    color: "hsl(25 95% 53%)", // Orange
  },
  expired: {
    label: "Expired",
    color: "hsl(0 84% 60%)", // Red
  },
};

export function MemberStatusDistributionChart({
  data,
  isLoading = false,
}: MemberStatusDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Member Status</CardTitle>
          <CardDescription>Distribution by member status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-[300px] w-full animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    status: item.status,
    count: item.count,
    percentage: item.percentage,
    fill:
      statusConfig[item.status as keyof typeof statusConfig]?.color ||
      "hsl(var(--chart-1))",
  }));

  const totalMembers = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="h-[400px] w-[40vw]">
      <CardHeader>
        <CardTitle>Member Status</CardTitle>
        <CardDescription>Distribution by member status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={statusConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => [
                    `${value} members (${chartData.find((item) => item.status === name)?.percentage}%)`,
                    statusConfig[name as keyof typeof statusConfig]?.label ||
                      name,
                  ]}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              cx="50%"
              cy="50%"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            {/* Center Text using SVG text elements */}
            <text
              x="50%"
              y="46%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-5xl font-bold"
            >
              {totalMembers}
            </text>
            <text
              x="50%"
              y="56%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-sm"
            >
              Members
            </text>
            <ChartLegend
              content={<ChartLegendContent nameKey="status" />}
              className="-translate-y-2 flex-wrap gap-2 *:justify-center [&>*]:basis-1/5"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
