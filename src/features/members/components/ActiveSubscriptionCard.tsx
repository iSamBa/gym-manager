"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  CreditCard,
  Pause,
  Play,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type {
  MemberSubscriptionWithSnapshot,
  Member,
} from "@/features/database/lib/types";
import { paymentUtils } from "@/features/payments/lib/payment-utils";
import {
  usePauseSubscription,
  useResumeSubscription,
} from "@/features/memberships/hooks/use-subscriptions";

import { UpgradeDialog } from "./UpgradeDialog";
import { AddPaymentDialog } from "./AddPaymentDialog";

interface ActiveSubscriptionCardProps {
  subscription: MemberSubscriptionWithSnapshot;
  member: Member;
}

export function ActiveSubscriptionCard({
  subscription,
  member,
}: ActiveSubscriptionCardProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const pauseSubscriptionMutation = usePauseSubscription();
  const resumeSubscriptionMutation = useResumeSubscription();

  // Calculate subscription metrics
  const remainingSessions = Math.max(
    0,
    subscription.total_sessions_snapshot - subscription.used_sessions
  );
  const sessionProgress =
    (subscription.used_sessions / subscription.total_sessions_snapshot) * 100;
  const balanceInfo = paymentUtils.calculateBalanceInfo(subscription);

  // Calculate days remaining
  const daysRemaining = subscription.end_date
    ? Math.ceil(
        (new Date(subscription.end_date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const isLowSessions = remainingSessions <= 2 && remainingSessions > 0;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const hasOutstandingBalance = balanceInfo.balance > 0;

  const handlePauseResume = async () => {
    if (subscription.status === "active") {
      await pauseSubscriptionMutation.mutateAsync({
        subscriptionId: subscription.id,
        reason: "Paused by admin",
      });
    } else if (subscription.status === "paused") {
      await resumeSubscriptionMutation.mutateAsync(subscription.id);
    }
  };

  const getStatusBadge = () => {
    switch (subscription.status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "expired":
        return <Badge variant="outline">Expired</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{subscription.status}</Badge>;
    }
  };

  return (
    <>
      <Card role="article">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {subscription.plan_name_snapshot}
              {getStatusBadge()}
            </CardTitle>
            <div className="flex gap-2">
              {subscription.status === "active" && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePauseResume}
                          disabled={pauseSubscriptionMutation.isPending}
                          aria-label="Pause Subscription"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Pause Subscription</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowUpgradeDialog(true)}
                          aria-label="Upgrade Plan"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Upgrade Plan</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              {subscription.status === "paused" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePauseResume}
                        disabled={resumeSubscriptionMutation.isPending}
                        aria-label="Resume Subscription"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Resume Subscription</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {hasOutstandingBalance && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add Payment
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alerts */}
          <div className="space-y-2">
            {isLowSessions && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Only {remainingSessions} session
                  {remainingSessions !== 1 ? "s" : ""} remaining. Consider
                  renewing soon.
                </AlertDescription>
              </Alert>
            )}

            {isExpiringSoon && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Subscription expires in {daysRemaining} day
                  {daysRemaining !== 1 ? "s" : ""}.
                </AlertDescription>
              </Alert>
            )}

            {hasOutstandingBalance && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Outstanding balance: ${balanceInfo.balance.toFixed(2)}
                  <Button
                    variant="link"
                    className="ml-2 h-auto p-0"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    Add Payment
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Sessions Progress */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sessions Used</span>
              <span className="font-medium">
                {subscription.used_sessions} /{" "}
                {subscription.total_sessions_snapshot}
              </span>
            </div>

            <Progress value={sessionProgress} className="h-2" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Remaining</p>
                <p className="text-2xl font-bold">{remainingSessions}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Expires</p>
                <p className="text-sm font-medium">
                  {subscription.end_date
                    ? format(new Date(subscription.end_date), "PP")
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Total Cost</p>
                <p className="font-bold">
                  ${subscription.total_amount_snapshot.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Amount Paid</p>
                <p className="font-bold text-green-600">
                  ${subscription.paid_amount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Payment Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Progress</span>
                <span className="font-medium">
                  {balanceInfo.paidPercentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={balanceInfo.paidPercentage} className="h-1" />
            </div>
          </div>

          {/* Subscription Dates */}
          <div className="text-muted-foreground flex items-center gap-4 border-t pt-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Started: {format(new Date(subscription.start_date), "PP")}
              </span>
            </div>
            {subscription.end_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Expires: {format(new Date(subscription.end_date), "PP")}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UpgradeDialog
        currentSubscription={subscription}
        member={member}
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
      />

      <AddPaymentDialog
        subscription={subscription}
        member={member}
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
      />
    </>
  );
}
