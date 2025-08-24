"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/features/dashboard/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  Plus,
  Activity,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRequireAdmin } from "@/hooks/use-require-auth";

export default function Home() {
  const t = useTranslations("dashboard");
  const { user, isLoading } = useRequireAdmin();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading...</div>
          <p className="text-muted-foreground">Verifying authentication</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // useRequireAdmin will handle redirect
  }

  // Convert user object to expected format for MainLayout
  const layoutUser = {
    name:
      user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.email,
    email: user.email,
    avatar: user.avatar_url || user.first_name?.[0] || user.email?.[0] || "A",
  };

  // Mock stats data
  const stats = [
    {
      title: t("stats.total_members"),
      value: "2,847",
      description: t("stats.active_memberships"),
      icon: Users,
      trend: { value: 12, label: t("stats.from_last_month") },
    },
    {
      title: t("stats.monthly_revenue"),
      value: "$23,580",
      description: t("stats.current_month_earnings"),
      icon: DollarSign,
      trend: { value: 8, label: t("stats.from_last_month") },
    },
    {
      title: t("stats.classes_today"),
      value: "12",
      description: t("stats.scheduled_sessions"),
      icon: Calendar,
      trend: { value: 0, label: t("stats.same_as_yesterday") },
    },
    {
      title: t("stats.equipment_usage"),
      value: "78%",
      description: t("stats.peak_hours_utilization"),
      icon: Activity,
      trend: { value: -5, label: t("stats.from_last_week") },
    },
  ];

  // Mock recent activities
  const recentActivities = [
    {
      id: 1,
      member: "Alice Johnson",
      action: t("recent_activity.checked_in"),
      time: `2 ${t("recent_activity.minutes_ago")}`,
    },
    {
      id: 2,
      member: "Bob Smith",
      action: t("recent_activity.booked_yoga_class"),
      time: `5 ${t("recent_activity.minutes_ago")}`,
    },
    {
      id: 3,
      member: "Carol Davis",
      action: t("recent_activity.updated_payment_method"),
      time: `12 ${t("recent_activity.minutes_ago")}`,
    },
    {
      id: 4,
      member: "David Wilson",
      action: t("recent_activity.completed_workout"),
      time: `18 ${t("recent_activity.minutes_ago")}`,
    },
  ];

  return (
    <MainLayout user={layoutUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">{t("welcome_message")}</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("add_member")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              trend={stat.trend}
            />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("quick_actions.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                {t("quick_actions.register_member")}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                {t("quick_actions.schedule_class")}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                {t("quick_actions.process_payment")}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                {t("quick_actions.view_reports")}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t("recent_activity.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{activity.member}</p>
                      <p className="text-muted-foreground text-xs">
                        {activity.action}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activity.time}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Classes */}
          <Card>
            <CardHeader>
              <CardTitle>{t("todays_classes.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {t("todays_classes.morning_yoga")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      08:00 - 09:00
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">12/15</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {t("todays_classes.hiit_training")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      10:00 - 11:00
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">8/10</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {t("todays_classes.pilates")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      18:00 - 19:00
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">15/20</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {t("todays_classes.strength_training")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      19:30 - 20:30
                    </p>
                  </div>
                  <Badge variant="secondary">5/12</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
