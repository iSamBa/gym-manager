"use client";

import React from "react";
import { AlertCircle, DollarSign, Calendar, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { useQuery } from "@tanstack/react-query";
import { notificationUtils } from "../lib/notification-utils";

interface AlertItem {
  id: string;
  type: "payment" | "renewal" | "expiry" | "low_sessions";
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
  memberName?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SubscriptionAlerts() {
  const { data: paymentStats, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["subscription-alerts", "payments"],
    queryFn: () => notificationUtils.getPaymentStatistics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: sessionStats, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["subscription-alerts", "sessions"],
    queryFn: () => notificationUtils.getSessionStatistics(),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoadingPayments && isLoadingSessions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const alerts: AlertItem[] = [];

  // Payment alerts
  if (paymentStats && paymentStats.membersWithOutstandingBalance > 0) {
    alerts.push({
      id: "outstanding-payments",
      type: "payment",
      title: "Outstanding Payments",
      message: `${paymentStats.membersWithOutstandingBalance} member(s) have outstanding balances totaling $${paymentStats.totalOutstandingAmount.toFixed(2)}`,
      severity: paymentStats.totalOutstandingAmount > 1000 ? "high" : "medium",
      action: {
        label: "View Details",
        onClick: () => {
          window.location.href = "/payments?filter=outstanding";
        },
      },
    });
  }

  // Low sessions alerts
  if (sessionStats && sessionStats.subscriptionsWithLowSessions > 0) {
    alerts.push({
      id: "low-sessions",
      type: "low_sessions",
      title: "Low Session Credits",
      message: `${sessionStats.subscriptionsWithLowSessions} subscription(s) have 2 or fewer sessions remaining`,
      severity: "medium",
      action: {
        label: "View Members",
        onClick: () => {
          window.location.href = "/subscriptions?filter=low-sessions";
        },
      },
    });
  }

  // Utilization alert
  if (sessionStats && sessionStats.utilizationRate < 50) {
    alerts.push({
      id: "low-utilization",
      type: "renewal",
      title: "Low Session Utilization",
      message: `Overall session utilization is ${sessionStats.utilizationRate.toFixed(1)}%. Consider engagement strategies.`,
      severity: "low",
    });
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <p className="text-muted-foreground text-sm">
              All good! No alerts at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertIcon = (type: AlertItem["type"]) => {
    switch (type) {
      case "payment":
        return <DollarSign className="h-4 w-4" />;
      case "renewal":
      case "expiry":
        return <Calendar className="h-4 w-4" />;
      case "low_sessions":
        return <Users className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (severity: AlertItem["severity"]) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const getSeverityBadge = (severity: AlertItem["severity"]) => {
    const variants = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    } as const;

    return (
      <Badge variant={variants[severity]} className="text-xs">
        {severity.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Subscription Alerts
          <Badge variant="outline">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <Alert key={alert.id} variant={getAlertVariant(alert.severity)}>
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <AlertTitle className="text-sm font-medium">
                    {alert.title}
                  </AlertTitle>
                  {getSeverityBadge(alert.severity)}
                </div>
                <AlertDescription className="text-sm">
                  {alert.message}
                </AlertDescription>
              </div>
            </div>
            {alert.action && (
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={alert.action.onClick}
                >
                  {alert.action.label}
                </Button>
              </div>
            )}
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
