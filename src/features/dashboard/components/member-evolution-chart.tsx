"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
} from "@/components/ui/chart";

interface MemberEvolutionData {
  month: string;
  totalMembers: number;
  newMembers: number;
}

interface MemberEvolutionChartProps {
  data: MemberEvolutionData[];
  isLoading?: boolean;
}

const chartConfig = {
  totalMembers: {
    label: "Total Members",
    color: "hsl(var(--chart-1))",
  },
  newMembers: {
    label: "New Members",
    color: "hsl(var(--chart-2))",
  },
};

export function MemberEvolutionChart({
  data,
  isLoading = false,
}: MemberEvolutionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Member Growth</CardTitle>
          <CardDescription>
            Evolution of total and new members over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-[350px] w-full animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[400px] w-full">
      <CardHeader>
        <CardTitle>Member Growth</CardTitle>
        <CardDescription>
          Evolution of total and new members over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <defs>
              <linearGradient
                id="totalMembersGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient
                id="newMembersGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="newMembers"
              type="natural"
              fill="url(#newMembersGradient)"
              stroke="#f97316"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="totalMembers"
              type="natural"
              fill="url(#totalMembersGradient)"
              stroke="#ef4444"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
