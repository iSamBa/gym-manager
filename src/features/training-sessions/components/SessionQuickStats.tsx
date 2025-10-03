"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Users, MapPin } from "lucide-react";
import { useSessionStats } from "@/features/training-sessions/hooks";
import { useMemo } from "react";

const SessionQuickStats: React.FC = () => {
  // Create today's date range for filtering
  const todayRange = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );
    return { start: startOfDay, end: endOfDay };
  }, []);

  // Get today's stats with SQL aggregation
  const { data: todayStats, isLoading } = useSessionStats({
    date_range: todayRange,
  });

  // Get this week's total (simplified)
  const weekRange = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59);
    return { start: startOfWeek, end: endOfWeek };
  }, []);

  const { data: weekStats } = useSessionStats({
    date_range: weekRange,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="bg-muted h-4 w-24 rounded"></div>
                <div className="bg-muted h-8 w-16 rounded"></div>
                <div className="bg-muted h-3 w-32 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Sessions",
      value: todayStats?.total || 0,
      icon: Calendar,
      color: "text-blue-600",
      description: `${todayStats?.completed || 0} completed`,
    },
    {
      title: "This Week",
      value: weekStats?.total || 0,
      icon: Clock,
      color: "text-green-600",
      description: `${weekStats?.scheduled || 0} upcoming`,
    },
    {
      title: "Active Today",
      value: todayStats?.active || 0,
      icon: Users,
      color: "text-purple-600",
      description: "Currently active",
    },
    {
      title: "Utilization",
      value: `${todayStats?.average_utilization || 0}%`,
      icon: MapPin,
      color: "text-orange-600",
      description: "Today's average",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm font-medium">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <div className="flex items-center gap-2">
                  {/* Change tracking disabled */}
                  <span className="text-muted-foreground text-xs">
                    {stat.description}
                  </span>
                </div>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SessionQuickStats;
