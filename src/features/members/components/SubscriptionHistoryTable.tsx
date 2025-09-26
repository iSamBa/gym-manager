"use client";

import React from "react";
import { format } from "date-fns";
import { MoreHorizontal, Calendar, CreditCard } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import type { MemberSubscriptionWithSnapshot } from "@/features/database/lib/types";

interface SubscriptionHistoryTableProps {
  subscriptions: MemberSubscriptionWithSnapshot[];
  isLoading?: boolean;
}

export function SubscriptionHistoryTable({
  subscriptions,
  isLoading,
}: SubscriptionHistoryTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription History</CardTitle>
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

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      paused: "secondary",
      pending: "outline",
      cancelled: "destructive",
      expired: "destructive",
    } as const;

    const variant = variants[status as keyof typeof variants] || "outline";

    const baseClasses = {
      default: "bg-primary",
      secondary: "bg-secondary",
      outline: "border",
      destructive: "destructive",
    };

    return (
      <Badge variant={variant} className={baseClasses[variant]}>
        {status}
      </Badge>
    );
  };

  const calculateProgress = (subscription: MemberSubscriptionWithSnapshot) => {
    return (
      (subscription.used_sessions / subscription.total_sessions_snapshot) * 100
    );
  };

  const calculatePaymentProgress = (
    subscription: MemberSubscriptionWithSnapshot
  ) => {
    return (
      (subscription.paid_amount / subscription.total_amount_snapshot) * 100
    );
  };

  return (
    <Card className="rounded-lg border">
      <CardHeader>
        <CardTitle className="font-semibold">Subscription History</CardTitle>
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
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {subscription.plan_name_snapshot}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        ${subscription.total_amount_snapshot.toFixed(2)}
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
                          {subscription.used_sessions} /{" "}
                          {subscription.total_sessions_snapshot}
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
                        <span>${subscription.paid_amount.toFixed(2)}</span>
                        <span className="text-muted-foreground">
                          {calculatePaymentProgress(subscription).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={calculatePaymentProgress(subscription)}
                        className="h-1"
                      />
                      {subscription.paid_amount <
                        subscription.total_amount_snapshot && (
                        <p className="text-xs text-orange-600">
                          Balance: $
                          {(
                            subscription.total_amount_snapshot -
                            subscription.paid_amount
                          ).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" aria-haspopup="true">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {(subscription.status === "active" ||
                          subscription.status === "pending") && (
                          <DropdownMenuItem>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Add Payment
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
