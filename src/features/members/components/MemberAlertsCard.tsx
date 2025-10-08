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
} from "lucide-react";
import { useMemberActivityMetrics } from "@/features/members/hooks";
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
          icon: <Calendar className="h-4 w-4 text-amber-600" />,
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
        icon: <Package className="h-4 w-4 text-amber-600" />,
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
          icon: <Cake className="h-4 w-4 text-amber-600" />,
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
        icon: <DollarSign className="h-4 w-4 text-red-600" />,
        title: "Outstanding Payments",
        description: `${metrics.overduePaymentsCount} overdue payment${metrics.overduePaymentsCount !== 1 ? "s" : ""}`,
      });
    }

    return alertList;
  }, [member, metrics]);

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
          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
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
                ? "border-amber-400 bg-amber-50"
                : "border-red-400 bg-red-50"
            )}
          >
            <div className="flex items-start gap-3">
              {alert.icon}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-muted-foreground text-sm">
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
