"use client";

import React from "react";
import { DollarSign, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { useQuery } from "@tanstack/react-query";
import { notificationUtils } from "../lib/notification-utils";

export function PaymentDueWidget() {
  const { data: paymentStats, isLoading } = useQuery({
    queryKey: ["payment-due-widget"],
    queryFn: () => notificationUtils.getPaymentStatistics(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!paymentStats || paymentStats.membersWithOutstandingBalance === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <DollarSign className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <h3 className="mb-2 font-semibold">All Caught Up!</h3>
            <p className="text-muted-foreground text-sm">
              No outstanding payments at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topOutstandingBalances = paymentStats.outstandingBalances
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Due
          </div>
          <Badge variant="destructive">
            {paymentStats.membersWithOutstandingBalance}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="rounded-lg bg-red-50 p-3">
          <div className="text-2xl font-bold text-red-900">
            ${paymentStats.totalOutstandingAmount.toFixed(2)}
          </div>
          <p className="text-sm text-red-700">Total Outstanding</p>
        </div>

        {/* Top Outstanding Balances */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Top Outstanding Balances</h4>
          {topOutstandingBalances.map((member) => (
            <div
              key={member.memberId}
              className="flex items-center justify-between rounded border p-2"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{member.memberName}</p>
                <p className="text-muted-foreground text-xs">
                  Member #{member.memberId.slice(-8)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">
                  ${member.balance.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            window.location.href = "/payments?filter=outstanding";
          }}
        >
          View All Outstanding Payments
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
