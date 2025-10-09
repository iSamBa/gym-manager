"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Calendar,
  Package,
  Cake,
  DollarSign,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import {
  useMemberActivityMetrics,
  useActiveCommentAlerts,
} from "@/features/members/hooks";
import type { MemberWithSubscription } from "@/features/database/lib/types";
import { cn } from "@/lib/utils";

interface MemberAlertsCardProps {
  member: MemberWithSubscription;
}

interface Alert {
  id: string;
  type: "warning" | "critical";
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const MemberAlertsCard = memo(function MemberAlertsCard({
  member,
}: MemberAlertsCardProps) {
  const { data: metrics } = useMemberActivityMetrics(member.id);
  const { data: commentAlerts = [] } = useActiveCommentAlerts(member.id);

  const alerts = useMemo((): Alert[] => {
    const alertList: Alert[] = [];

    // Expiring subscription
    if (member.subscription?.end_date) {
      const endDate = new Date(member.subscription.end_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
        alertList.push({
          id: "expiring-subscription",
          type: "warning",
          icon: (
            <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          ),
          title: "Subscription Expiring Soon",
          description: `Renews in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`,
        });
      }
    }

    // Missing equipment
    if (!member.uniform_received) {
      alertList.push({
        id: "missing-uniform",
        type: "warning",
        icon: (
          <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ),
        title: "Uniform Not Received",
        description: "Member has not received uniform yet",
      });
    }

    // Upcoming birthday
    if (member.date_of_birth) {
      const today = new Date();
      const birthDate = new Date(member.date_of_birth);
      const thisYearBirthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      );

      const daysUntilBirthday = Math.ceil(
        (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilBirthday >= 0 && daysUntilBirthday <= 7) {
        alertList.push({
          id: "upcoming-birthday",
          type: "warning",
          icon: <Cake className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
          title: "Birthday Coming Up",
          description: `Birthday on ${thisYearBirthday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        });
      }
    }

    // Outstanding payments
    if (metrics && metrics.overduePaymentsCount > 0) {
      alertList.push({
        id: "outstanding-payments",
        type: "critical",
        icon: <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />,
        title: "Outstanding Payments",
        description: `${metrics.overduePaymentsCount} overdue payment${metrics.overduePaymentsCount !== 1 ? "s" : ""}`,
      });
    }

    // Comment-based alerts
    commentAlerts.forEach((comment) => {
      if (!comment.due_date) return;

      const dueDate = new Date(comment.due_date);
      const today = new Date();
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only show alerts for future dates
      if (daysUntilDue < 0) return;

      // Determine alert type based on urgency
      const alertType = daysUntilDue <= 3 ? "critical" : "warning";
      const iconColor =
        alertType === "critical"
          ? "text-red-600 dark:text-red-400"
          : "text-amber-600 dark:text-amber-400";

      // Truncate comment body to 100 characters
      const truncatedBody =
        comment.body.length > 100
          ? `${comment.body.substring(0, 100)}...`
          : comment.body;

      // Format due date
      const formattedDate = dueDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      alertList.push({
        id: `comment-${comment.id}`,
        type: alertType,
        icon: <MessageSquare className={cn("h-4 w-4", iconColor)} />,
        title: comment.author,
        description: `${truncatedBody} (Due: ${formattedDate})`,
      });
    });

    // Sort alerts by priority (critical first)
    return alertList.sort((a, b) => {
      const priorityOrder = { critical: 0, warning: 1 };
      return priorityOrder[a.type] - priorityOrder[b.type];
    });
  }, [member, metrics, commentAlerts]);

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>No alerts</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-4 w-4" />
          Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "rounded-md border-l-4 p-4",
              alert.type === "warning"
                ? "border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/30"
                : "border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/30"
            )}
          >
            <div className="flex items-start gap-3">
              {alert.icon}
              <div className="flex-1 space-y-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    alert.type === "warning"
                      ? "text-amber-900 dark:text-amber-100"
                      : "text-red-900 dark:text-red-100"
                  )}
                >
                  {alert.title}
                </p>
                <p
                  className={cn(
                    "text-sm",
                    alert.type === "warning"
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-red-700 dark:text-red-300"
                  )}
                >
                  {alert.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
