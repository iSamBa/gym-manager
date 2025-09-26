"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin } from "lucide-react";
import { useTrainingSessions } from "@/features/training-sessions/hooks";
import { useMemo } from "react";

const SessionQuickStats: React.FC = () => {
  // Get all sessions and calculate quick stats
  const { data: allSessions, isLoading } = useTrainingSessions();

  const stats = useMemo(() => {
    if (!allSessions) return null;

    const today = new Date();
    const todaySessions = allSessions.filter((session) => {
      const sessionDate = new Date(session.start_time);
      return sessionDate.toDateString() === today.toDateString();
    });

    return {
      totalToday: todaySessions.length,
      completedToday: todaySessions.filter((s) => s.status === "completed")
        .length,
      upcomingToday: todaySessions.filter((s) => s.status === "scheduled")
        .length,
      totalThisWeek: allSessions.length, // simplified
    };
  }, [allSessions]);

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

  if (!stats) return null;

  const statCards = [
    {
      title: "Today's Sessions",
      value: stats.today_sessions,
      change: stats.today_change,
      icon: Calendar,
      color: "text-blue-600",
      description: `${stats.today_completed} completed`,
    },
    {
      title: "This Week",
      value: stats.week_sessions,
      change: stats.week_change,
      icon: Clock,
      color: "text-green-600",
      description: `${stats.week_upcoming} upcoming`,
    },
    {
      title: "Active Trainers",
      value: stats.active_trainers,
      icon: Users,
      color: "text-purple-600",
      description: `${stats.total_trainers} total`,
    },
    {
      title: "Active Locations",
      value: stats.active_locations || 0,
      icon: MapPin,
      color: "text-orange-600",
      description: "In use this week",
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
                  {stat.change !== undefined && (
                    <Badge
                      variant={stat.change >= 0 ? "default" : "secondary"}
                      className={`text-xs ${
                        stat.change >= 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {stat.change >= 0 ? "+" : ""}
                      {Math.round(stat.change)}%
                    </Badge>
                  )}
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
