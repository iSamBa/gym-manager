"use client";

import React from "react";
import { format } from "date-fns";
import {
  Calendar,
  CreditCard,
  Eye,
  Pause,
  Play,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";

import type { MemberSubscriptionWithSnapshot } from "@/features/database/lib/types";
import {
  usePauseSubscription,
  useResumeSubscription,
} from "@/features/memberships/hooks/use-subscriptions";

interface MemberSubscriptionTableProps {
  subscriptions: MemberSubscriptionWithSnapshot[];
  isLoading?: boolean;
  error?: Error | null;
}

export function MemberSubscriptionTable({
  subscriptions,
  isLoading,
  error,
}: MemberSubscriptionTableProps) {
  const pauseSubscriptionMutation = usePauseSubscription();
  const resumeSubscriptionMutation = useResumeSubscription();

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      paused: "secondary",
      pending: "outline",
      cancelled: "destructive",
      expired: "destructive",
      completed: "outline",
    } as const;

    const variant = variants[status as keyof typeof variants] || "outline";

    return <Badge variant={variant}>{status}</Badge>;
  };

  const calculateProgress = (subscription: MemberSubscriptionWithSnapshot) => {
    const used = subscription.used_sessions || 0;
    const total = subscription.total_sessions_snapshot || 1;
    return (used / total) * 100;
  };

  const calculatePaymentProgress = (
    subscription: MemberSubscriptionWithSnapshot
  ) => {
    const paid = subscription.paid_amount || 0;
    const total = subscription.total_amount_snapshot || 1;
    return (paid / total) * 100;
  };

  const handlePauseResume = async (
    subscription: MemberSubscriptionWithSnapshot
  ) => {
    if (subscription.status === "active") {
      await pauseSubscriptionMutation.mutateAsync({
        subscriptionId: subscription.id,
        reason: "Paused by user",
      });
    } else if (subscription.status === "paused") {
      await resumeSubscriptionMutation.mutateAsync(subscription.id);
    }
  };

  const handleViewDetails = (subscription: MemberSubscriptionWithSnapshot) => {
    // TODO: Implement view details functionality
    console.log("View details for subscription:", subscription.id);
  };

  const handleAddPayment = (subscription: MemberSubscriptionWithSnapshot) => {
    // TODO: Implement add payment functionality
    console.log("Add payment for subscription:", subscription.id);
  };

  const handleUpgrade = (subscription: MemberSubscriptionWithSnapshot) => {
    // TODO: Implement upgrade functionality
    console.log("Upgrade subscription:", subscription.id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-16 w-full"
                data-testid="skeleton"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load subscription data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <EmptyState
            icon={AlertCircle}
            title="No Subscriptions"
            description="This member doesn't have any subscriptions."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg border">
      <CardHeader>
        <CardTitle className="font-semibold">Subscriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead role="columnheader">Plan</TableHead>
                <TableHead role="columnheader">Period</TableHead>
                <TableHead role="columnheader">Sessions</TableHead>
                <TableHead role="columnheader">Payment</TableHead>
                <TableHead role="columnheader">Status</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {subscription.plan_name_snapshot || "Unknown Plan"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        $
                        {subscription.total_amount_snapshot?.toFixed(2) ||
                          "0.00"}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(
                            new Date(subscription.start_date),
                            "MMM dd, yyyy"
                          )}
                        </span>
                      </div>
                      {subscription.end_date && (
                        <div className="text-muted-foreground text-xs">
                          to{" "}
                          {format(
                            new Date(subscription.end_date),
                            "MMM dd, yyyy"
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {subscription.used_sessions || 0} /{" "}
                          {subscription.total_sessions_snapshot || 0}
                        </span>
                        <span className="text-muted-foreground">
                          {calculateProgress(subscription).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={calculateProgress(subscription)}
                        className="h-1"
                      />
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          ${subscription.paid_amount?.toFixed(2) || "0.00"}
                        </span>
                        <span className="text-muted-foreground">
                          {calculatePaymentProgress(subscription).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={calculatePaymentProgress(subscription)}
                        className="h-1"
                      />
                      {(subscription.paid_amount || 0) <
                        (subscription.total_amount_snapshot || 0) && (
                        <p className="text-xs text-orange-600">
                          Balance: $
                          {(
                            (subscription.total_amount_snapshot || 0) -
                            (subscription.paid_amount || 0)
                          ).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(subscription)}
                        className="h-8 w-8 p-0"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {(subscription.status === "active" ||
                        subscription.status === "paused") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePauseResume(subscription)}
                          className="h-8 w-8 p-0"
                          title={
                            subscription.status === "active"
                              ? "Pause"
                              : "Resume"
                          }
                          disabled={
                            pauseSubscriptionMutation.isPending ||
                            resumeSubscriptionMutation.isPending
                          }
                        >
                          {subscription.status === "active" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}

                      {(subscription.paid_amount || 0) <
                        (subscription.total_amount_snapshot || 0) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddPayment(subscription)}
                          className="h-8 w-8 p-0"
                          title="Add Payment"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}

                      {subscription.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpgrade(subscription)}
                          className="h-8 w-8 p-0"
                          title="Upgrade Plan"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
